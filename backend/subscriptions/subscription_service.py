from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from medicaments.models import Stock
from payments.models import Payment
from transactions.models import Transaction

from .models import PharmacySubscription, SubscriptionPayment, SubscriptionPlan, SubscriptionRefund


def get_free_plan():
    plan = SubscriptionPlan.objects.filter(
        code__in=[SubscriptionPlan.CODE_FREE, SubscriptionPlan.CODE_FREE_ALIAS],
        est_actif=True,
    ).first()
    if not plan:
        raise ValidationError('Le plan gratuit n est pas configure.')
    return plan


@transaction.atomic
def assign_free_plan(pharmacy):
    plan = get_free_plan()
    PharmacySubscription.objects.filter(
        pharmacy=pharmacy,
        is_current=True,
    ).update(is_current=False)

    PharmacySubscription.objects.filter(
        pharmacy=pharmacy,
        statut=PharmacySubscription.STATUS_ACTIVE,
    ).exclude(plan=plan).update(
        statut=PharmacySubscription.STATUS_EXPIRED,
        is_current=False,
    )

    subscription, _ = PharmacySubscription.objects.update_or_create(
        pharmacy=pharmacy,
        plan=plan,
        statut=PharmacySubscription.STATUS_ACTIVE,
        defaults={
            'date_debut': timezone.now(),
            'date_fin': None,
            'renouvellement_auto': False,
            'is_current': True,
            'payment': None,
        },
    )
    return subscription


@transaction.atomic
def create_subscription_request(pharmacy, plan, payment=None, renouvellement_auto=True):
    if not plan.est_actif:
        raise ValidationError('Ce plan abonnement est inactif.')

    if plan.is_free:
        return assign_free_plan(pharmacy)

    if payment and payment.pharmacy_id != pharmacy.id:
        raise ValidationError('Le paiement ne correspond pas a cette pharmacie.')

    if payment and payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Le paiement associe doit etre valide.')

    return PharmacySubscription.objects.create(
        pharmacy=pharmacy,
        plan=plan,
        statut=PharmacySubscription.STATUS_PENDING_PAYMENT,
        renouvellement_auto=renouvellement_auto,
        payment=payment,
    )


def _subscription_price(plan):
    return plan.prix_mensuel if plan.prix_mensuel > 0 else plan.prix_annuel


def get_subscription_amount(plan):
    return _subscription_price(plan)


@transaction.atomic
def activate_subscription(subscription, activated_by=None):
    if not subscription.plan.is_free and not subscription.payment_id:
        has_valid_subscription_payment = subscription.subscription_payments.filter(
            status='valide',
        ).exists()
        if not has_valid_subscription_payment:
            raise ValidationError('Un abonnement payant necessite un paiement valide.')

    if subscription.payment_id and subscription.payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Le paiement associe doit etre valide.')

    # Retirer is_current de tous les abonnements actuels (actifs ou expirés)
    PharmacySubscription.objects.filter(
        pharmacy=subscription.pharmacy,
        is_current=True,
    ).exclude(pk=subscription.pk).update(is_current=False)

    # Expirer formellement les abonnements encore actifs
    PharmacySubscription.objects.filter(
        pharmacy=subscription.pharmacy,
        statut=PharmacySubscription.STATUS_ACTIVE,
    ).exclude(pk=subscription.pk).update(
        statut=PharmacySubscription.STATUS_EXPIRED,
        is_current=False,
    )

    subscription.statut = PharmacySubscription.STATUS_ACTIVE
    subscription.is_current = True
    subscription.date_debut = timezone.now()
    subscription.date_fin = (
        None if subscription.plan.is_free
        else subscription.date_debut + timezone.timedelta(days=subscription.plan.duree_jours)
    )

    if subscription.payment_id and not subscription.transaction_id:
        montant = _subscription_price(subscription.plan)
        subscription.transaction = Transaction.objects.create(
            payment=subscription.payment,
            reservation=subscription.payment.reservation,
            user=subscription.pharmacy.user,
            pharmacy=subscription.pharmacy,
            type_transaction=Transaction.TYPE_SUBSCRIPTION,
            montant_brut=montant,
            commission=montant,
            montant_pharmacie=Decimal('0.00'),
            description=f'Activation abonnement {subscription.plan.nom}.',
            created_by=activated_by,
        )

    subscription.save()
    return subscription


@transaction.atomic
def validate_subscription_payment(subscription_payment, admin_user):
    if subscription_payment.status != subscription_payment.STATUS_PENDING:
        raise ValidationError('Ce paiement abonnement a deja ete traite.')

    subscription_payment.status = subscription_payment.STATUS_VALIDATED
    subscription_payment.validated_by = admin_user
    subscription_payment.validated_at = timezone.now()
    subscription_payment.rejection_reason = ''
    subscription_payment.save(
        update_fields=['status', 'validated_by', 'validated_at', 'rejection_reason']
    )

    subscription = subscription_payment.subscription

    # Retirer is_current de tous les abonnements actuels (actifs ou expirés)
    PharmacySubscription.objects.filter(
        pharmacy=subscription.pharmacy,
        is_current=True,
    ).exclude(pk=subscription.pk).update(is_current=False)

    # Expirer formellement les abonnements encore actifs
    PharmacySubscription.objects.filter(
        pharmacy=subscription.pharmacy,
        statut=PharmacySubscription.STATUS_ACTIVE,
    ).exclude(pk=subscription.pk).update(
        statut=PharmacySubscription.STATUS_EXPIRED,
        is_current=False,
    )

    subscription.statut = PharmacySubscription.STATUS_ACTIVE
    subscription.is_current = True
    subscription.date_debut = timezone.now()
    subscription.date_fin = (
        None if subscription.plan.is_free
        else subscription.date_debut + timezone.timedelta(days=subscription.plan.duree_jours)
    )
    subscription.save(update_fields=['statut', 'is_current', 'date_debut', 'date_fin'])
    return subscription_payment


@transaction.atomic
def reject_subscription_payment(subscription_payment, admin_user, reason=''):
    if subscription_payment.status != subscription_payment.STATUS_PENDING:
        raise ValidationError('Ce paiement abonnement a deja ete traite.')

    subscription_payment.status = subscription_payment.STATUS_REJECTED
    subscription_payment.validated_by = admin_user
    subscription_payment.validated_at = timezone.now()
    subscription_payment.rejection_reason = reason
    subscription_payment.save(
        update_fields=['status', 'validated_by', 'validated_at', 'rejection_reason']
    )

    subscription = subscription_payment.subscription
    subscription.statut = PharmacySubscription.STATUS_REJECTED
    subscription.save(update_fields=['statut'])
    return subscription_payment


@transaction.atomic
def expire_subscription(subscription):
    subscription.statut = PharmacySubscription.STATUS_EXPIRED
    subscription.renouvellement_auto = False
    subscription.expired_at = timezone.now()
    # is_current reste True : la pharmacie conserve son plan jusqu'au renouvellement
    subscription.save(update_fields=['statut', 'renouvellement_auto', 'expired_at', 'updated_at'])
    return subscription


@transaction.atomic
def cancel_subscription(subscription):
    if subscription.statut == PharmacySubscription.STATUS_CANCELLED:
        return subscription

    if subscription.plan.is_free:
        raise ValidationError('Vous etes deja sur le plan Gratuit.')

    if subscription.statut != PharmacySubscription.STATUS_ACTIVE:
        raise ValidationError('Seul un abonnement actif peut etre annule.')

    if not subscription.date_fin:
        raise ValidationError('Cet abonnement ne possede pas de date de fin.')

    subscription.statut = PharmacySubscription.STATUS_CANCELLED
    subscription.renouvellement_auto = False
    subscription.is_current = True
    subscription.cancelled_at = timezone.now()
    subscription.cancel_effective_at = subscription.date_fin
    subscription.save(
        update_fields=[
            'statut',
            'renouvellement_auto',
            'is_current',
            'cancelled_at',
            'cancel_effective_at',
            'updated_at',
        ]
    )
    return subscription


@transaction.atomic
def expire_cancelled_subscriptions(now=None):
    current_time = now or timezone.now()
    expired = []

    subscriptions = PharmacySubscription.objects.filter(
        statut=PharmacySubscription.STATUS_CANCELLED,
        is_current=True,
        date_fin__isnull=False,
        date_fin__lte=current_time,
    ).select_related('pharmacy')

    for subscription in subscriptions:
        subscription.statut = PharmacySubscription.STATUS_EXPIRED
        subscription.expired_at = current_time
        # is_current reste True : la pharmacie conserve son plan jusqu'au renouvellement
        subscription.save(update_fields=['statut', 'expired_at', 'updated_at'])
        expired.append(subscription.id)

    return expired


@transaction.atomic
def request_subscription_refund(subscription_payment, requested_by, amount=None, reason=''):
    if subscription_payment.status not in [
        SubscriptionPayment.STATUS_VALIDATED,
        SubscriptionPayment.STATUS_REFUNDED,
    ]:
        raise ValidationError('Seul un paiement valide peut faire l objet d un remboursement.')

    refund_amount = amount or subscription_payment.amount
    refund = SubscriptionRefund(
        subscription_payment=subscription_payment,
        pharmacy=subscription_payment.pharmacy,
        amount=refund_amount,
        reason=reason,
        requested_by=requested_by,
    )
    refund.full_clean()
    refund.save()
    return refund


@transaction.atomic
def approve_subscription_refund(refund, admin_user, note=''):
    if refund.status != SubscriptionRefund.STATUS_REQUESTED:
        raise ValidationError('Cette demande de remboursement a deja ete traitee.')
    refund.status = SubscriptionRefund.STATUS_APPROVED
    refund.processed_by = admin_user
    refund.processed_at = timezone.now()
    refund.admin_note = note
    refund.save(update_fields=['status', 'processed_by', 'processed_at', 'admin_note'])
    return refund


@transaction.atomic
def reject_subscription_refund(refund, admin_user, note=''):
    if refund.status != SubscriptionRefund.STATUS_REQUESTED:
        raise ValidationError('Cette demande de remboursement a deja ete traitee.')
    refund.status = SubscriptionRefund.STATUS_REJECTED
    refund.processed_by = admin_user
    refund.processed_at = timezone.now()
    refund.admin_note = note
    refund.save(update_fields=['status', 'processed_by', 'processed_at', 'admin_note'])
    return refund


@transaction.atomic
def mark_subscription_refund_processed(refund, admin_user, note=''):
    if refund.status not in [
        SubscriptionRefund.STATUS_APPROVED,
        SubscriptionRefund.STATUS_REQUESTED,
    ]:
        raise ValidationError('Ce remboursement ne peut pas etre marque comme traite.')
    refund.status = SubscriptionRefund.STATUS_PROCESSED
    refund.processed_by = admin_user
    refund.processed_at = timezone.now()
    refund.admin_note = note or refund.admin_note
    refund.save(update_fields=['status', 'processed_by', 'processed_at', 'admin_note'])

    payment = refund.subscription_payment
    payment.status = SubscriptionPayment.STATUS_REFUNDED
    payment.save(update_fields=['status'])
    return refund


def check_plan_limits(pharmacy):
    subscription = pharmacy.subscriptions.filter(
        is_current=True,
    ).select_related('plan').first()

    if not subscription:
        subscription = pharmacy.subscriptions.filter(
            statut=PharmacySubscription.STATUS_ACTIVE,
        ).select_related('plan').first()

    if not subscription:
        subscription = assign_free_plan(pharmacy)

    medicines_count = Stock.objects.filter(pharmacie=pharmacy).values('medicament').distinct().count()
    return {
        'plan': subscription.plan.code,
        'max_medicaments': subscription.plan.max_medicaments,
        'medicaments_utilises': medicines_count,
        'can_add_medicament': medicines_count < subscription.plan.max_medicaments,
        'visibilite_prioritaire': subscription.plan.visibilite_prioritaire,
        'statistiques_avancees': subscription.plan.statistiques_avancees,
        'badge_premium': subscription.plan.badge_premium,
        'notifications_prioritaires': subscription.plan.notifications_prioritaires,
    }
