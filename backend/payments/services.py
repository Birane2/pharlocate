from django.core.exceptions import ValidationError
from django.db import transaction

from notifications_app.models import Notification
from reservations.models import Reservation

from .models import Payment


def get_initial_payment_status(payment_method):
    return Payment.STATUS_PENDING


def calculate_payment_amounts(reservation):
    reservation.calculate_amounts(save=True)
    return {
        'montant_medicaments': reservation.montant_medicaments,
        'frais_livraison': reservation.frais_livraison,
        'montant_total': reservation.montant_total,
    }


@transaction.atomic
def create_payment_for_reservation(
    reservation,
    payment_method,
    numero_client,
    transaction_id='',
    capture_paiement=None,
):
    if hasattr(reservation, 'payment'):
        raise ValidationError('Cette reservation possede deja un paiement.')

    if not (numero_client or '').strip():
        raise ValidationError('Le numero de telephone du client est obligatoire.')

    if payment_method.requires_proof:
        if not (transaction_id or '').strip():
            raise ValidationError('Le transaction ID est obligatoire.')
        if not capture_paiement:
            raise ValidationError('La capture de paiement est obligatoire.')

    amounts = calculate_payment_amounts(reservation)
    initial_status = get_initial_payment_status(payment_method)
    payment = Payment(
        reservation=reservation,
        user=reservation.user,
        pharmacy=reservation.pharmacie,
        payment_method=payment_method,
        numero_client=numero_client.strip(),
        transaction_id=transaction_id.strip(),
        capture_paiement=capture_paiement,
        statut=initial_status,
        **amounts,
    )
    payment.save()
    reservation.statut_paiement = initial_status
    reservation.save(update_fields=['statut_paiement', 'date_modification'])
    Notification.objects.create(
        user=reservation.pharmacie.user,
        message=f'Nouvelle commande #{reservation.id} en attente de verification.',
        type='alerte',
    )
    return payment


@transaction.atomic
def submit_payment_proof(payment, transaction_id='', capture_paiement=None):
    if payment.statut in {Payment.STATUS_VALIDATED, Payment.STATUS_CANCELLED, Payment.STATUS_REFUNDED}:
        raise ValidationError('Ce paiement ne peut plus etre modifie.')

    if transaction_id:
        payment.transaction_id = transaction_id.strip()

    if capture_paiement:
        payment.capture_paiement = capture_paiement

    if payment.payment_method.requires_proof and not payment.has_complete_proof:
        raise ValidationError(
            'Le transaction ID et la capture de paiement sont obligatoires.'
        )

    payment.statut = Payment.STATUS_PENDING
    payment.motif_refus = ''
    payment.save()
    payment.reservation.statut_paiement = Payment.STATUS_PENDING
    payment.reservation.save(update_fields=['statut_paiement', 'date_modification'])
    return payment


@transaction.atomic
def validate_payment(payment, validated_by):
    if payment.statut != Payment.STATUS_PENDING:
        raise ValidationError('Seul un paiement en attente peut etre valide.')

    if payment.payment_method.requires_proof and not payment.has_complete_proof:
        raise ValidationError(
            'Impossible de valider un paiement sans transaction ID et capture.'
        )

    payment.statut = Payment.STATUS_VALIDATED
    payment.valide_par = validated_by
    payment.date_validation = timezone.now()
    payment.motif_refus = ''
    payment.save()

    payment.reservation.statut_paiement = Payment.STATUS_VALIDATED
    payment.reservation.save(update_fields=['statut_paiement', 'date_modification'])
    from transactions.transaction_service import generate_transaction
    from invoices.invoice_service import create_invoice

    financial_transaction = generate_transaction(payment, created_by=validated_by)
    create_invoice(payment, financial_transaction)
    Notification.objects.create(
        user=payment.user,
        message=f'Le paiement de votre commande #{payment.reservation_id} a ete valide.',
        type='confirmation',
    )
    return payment


@transaction.atomic
def reject_payment(payment, rejected_by, motif_refus):
    if not (motif_refus or '').strip():
        raise ValidationError('Le motif de refus est obligatoire.')

    if payment.statut != Payment.STATUS_PENDING:
        raise ValidationError('Seul un paiement en attente peut etre refuse.')

    payment.statut = Payment.STATUS_REJECTED
    payment.valide_par = rejected_by
    payment.date_validation = timezone.now()
    payment.motif_refus = motif_refus.strip()
    payment.save()

    payment.reservation.statut_paiement = Payment.STATUS_REJECTED
    payment.reservation.statut = Reservation.STATUS_REJECTED
    payment.reservation.save(
        update_fields=['statut', 'statut_paiement', 'date_modification']
    )
    Notification.objects.create(
        user=payment.user,
        message=(
            f'Le paiement de votre commande #{payment.reservation_id} a ete refuse. '
            f'Motif: {payment.motif_refus}'
        ),
        type='alerte',
    )
    return payment
