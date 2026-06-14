from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from payments.models import Payment

from .models import Transaction


COMMISSION_RATE = Decimal(
    str(getattr(settings, 'MANUAL_PAYMENT_COMMISSION_RATE', '0.00'))
)


def calculate_commission(montant_brut):
    return (montant_brut * COMMISSION_RATE).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP,
    )


def calculate_pharmacy_amount(montant_brut, commission):
    return montant_brut - commission


@transaction.atomic
def generate_transaction(payment, created_by=None, description=''):
    if payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Seul un paiement valide peut generer une transaction.')

    existing_transaction = Transaction.objects.filter(
        payment=payment,
        type_transaction=Transaction.TYPE_PAYMENT,
    ).first()
    if existing_transaction:
        return existing_transaction

    montant_brut = payment.montant_total
    commission = calculate_commission(montant_brut)
    montant_pharmacie = calculate_pharmacy_amount(montant_brut, commission)

    return Transaction.objects.create(
        payment=payment,
        reservation=payment.reservation,
        user=payment.user,
        pharmacy=payment.pharmacy,
        type_transaction=Transaction.TYPE_PAYMENT,
        montant_brut=montant_brut,
        commission=commission,
        montant_pharmacie=montant_pharmacie,
        description=description or f'Transaction generee pour le paiement #{payment.id}.',
        created_by=created_by,
    )
