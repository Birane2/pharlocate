from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from medicaments.models import Stock
from payments.models import Payment
from transactions.models import Transaction

from .models import PharmacySubscription, SubscriptionPlan


def get_free_plan():
    plan = SubscriptionPlan.objects.filter(
        code=SubscriptionPlan.CODE_FREE,
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
        statut=PharmacySubscription.STATUS_ACTIVE,
    ).exclude(plan=plan).update(statut=PharmacySubscription.STATUS_EXPIRED)

    subscription, _ = PharmacySubscription.objects.update_or_create(
        pharmacy=pharmacy,
        plan=plan,
        statut=PharmacySubscription.STATUS_ACTIVE,
        defaults={
            'date_debut': timezone.now(),
            'date_fin': None,
            'renouvellement_auto': False,
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


@transaction.atomic
def activate_subscription(subscription, activated_by=None):
    if not subscription.plan.is_free and not subscription.payment_id:
        raise ValidationError('Un abonnement payant necessite un paiement valide.')

    if subscription.payment_id and subscription.payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Le paiement associe doit etre valide.')

    PharmacySubscription.objects.filter(
        pharmacy=subscription.pharmacy,
        statut=PharmacySubscription.STATUS_ACTIVE,
    ).exclude(pk=subscription.pk).update(statut=PharmacySubscription.STATUS_EXPIRED)

    subscription.statut = PharmacySubscription.STATUS_ACTIVE
    subscription.date_debut = timezone.now()
    subscription.date_fin = (
        None if subscription.plan.is_free else subscription.date_debut + timezone.timedelta(days=30)
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
def expire_subscription(subscription):
    subscription.statut = PharmacySubscription.STATUS_EXPIRED
    subscription.renouvellement_auto = False
    subscription.save(update_fields=['statut', 'renouvellement_auto'])
    return assign_free_plan(subscription.pharmacy)


@transaction.atomic
def cancel_subscription(subscription):
    if subscription.statut == PharmacySubscription.STATUS_CANCELLED:
        return subscription

    subscription.statut = PharmacySubscription.STATUS_CANCELLED
    subscription.renouvellement_auto = False
    subscription.save(update_fields=['statut', 'renouvellement_auto'])
    return assign_free_plan(subscription.pharmacy)


def check_plan_limits(pharmacy):
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
