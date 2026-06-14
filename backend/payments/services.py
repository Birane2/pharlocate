from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Payment


def get_initial_payment_status(payment_method):
    if payment_method.requires_proof:
        return Payment.STATUS_PENDING

    return Payment.STATUS_UNPAID


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
    reference_paiement='',
    capture_paiement=None,
):
    if hasattr(reservation, 'payment'):
        raise ValidationError('Cette reservation possede deja un paiement.')

    amounts = calculate_payment_amounts(reservation)
    initial_status = get_initial_payment_status(payment_method)
    payment = Payment(
        reservation=reservation,
        user=reservation.user,
        pharmacy=reservation.pharmacie,
        payment_method=payment_method,
        reference_paiement=reference_paiement,
        capture_paiement=capture_paiement,
        statut=initial_status,
        **amounts,
    )
    payment.save()
    reservation.statut_paiement = initial_status
    reservation.save(update_fields=['statut_paiement', 'date_modification'])
    return payment


@transaction.atomic
def submit_payment_proof(payment, reference_paiement='', capture_paiement=None):
    if payment.statut in {Payment.STATUS_VALIDATED, Payment.STATUS_CANCELLED, Payment.STATUS_REFUNDED}:
        raise ValidationError('Ce paiement ne peut plus etre modifie.')

    if reference_paiement:
        payment.reference_paiement = reference_paiement

    if capture_paiement:
        payment.capture_paiement = capture_paiement

    if payment.payment_method.requires_proof and not payment.has_proof:
        raise ValidationError('Une reference ou une capture de paiement est obligatoire.')

    payment.statut = Payment.STATUS_PENDING
    payment.motif_refus = ''
    payment.save()
    payment.reservation.statut_paiement = Payment.STATUS_PENDING
    payment.reservation.save(update_fields=['statut_paiement', 'date_modification'])
    return payment


@transaction.atomic
def validate_payment(payment, validated_by):
    if payment.statut == Payment.STATUS_VALIDATED:
        raise ValidationError('Ce paiement est deja valide.')

    if payment.payment_method.requires_proof and not payment.has_proof:
        raise ValidationError('Impossible de valider un paiement sans preuve.')

    payment.statut = Payment.STATUS_VALIDATED
    payment.valide_par = validated_by
    payment.motif_refus = ''
    payment.save()

    payment.reservation.statut_paiement = Payment.STATUS_VALIDATED
    payment.reservation.save(update_fields=['statut_paiement', 'date_modification'])
    from transactions.transaction_service import generate_transaction
    from invoices.invoice_service import create_invoice

    financial_transaction = generate_transaction(payment, created_by=validated_by)
    create_invoice(payment, financial_transaction)
    return payment


@transaction.atomic
def reject_payment(payment, rejected_by, motif_refus):
    if not (motif_refus or '').strip():
        raise ValidationError('Le motif de refus est obligatoire.')

    if payment.statut == Payment.STATUS_VALIDATED:
        raise ValidationError('Impossible de refuser un paiement deja valide.')

    payment.statut = Payment.STATUS_REJECTED
    payment.valide_par = rejected_by
    payment.motif_refus = motif_refus.strip()
    payment.save()

    payment.reservation.statut_paiement = Payment.STATUS_REJECTED
    payment.reservation.save(update_fields=['statut_paiement', 'date_modification'])
    return payment
