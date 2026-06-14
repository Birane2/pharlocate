from django.core.exceptions import ValidationError
from django.db import transaction as db_transaction
from django.utils import timezone

from payments.models import Payment

from .models import Invoice


def generate_invoice_number():
    year = timezone.now().year
    prefix = f'INV-{year}-'
    last_invoice = (
        Invoice.objects.filter(numero_facture__startswith=prefix)
        .order_by('-numero_facture')
        .first()
    )

    if not last_invoice:
        next_number = 1
    else:
        next_number = int(last_invoice.numero_facture.split('-')[-1]) + 1

    return f'{prefix}{next_number:06d}'


@db_transaction.atomic
def create_invoice(payment, financial_transaction):
    if payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Seul un paiement valide peut generer une facture.')

    existing_invoice = Invoice.objects.filter(payment=payment).first()
    if existing_invoice:
        return existing_invoice

    if financial_transaction.payment_id != payment.id:
        raise ValidationError('La transaction ne correspond pas au paiement.')

    return Invoice.objects.create(
        numero_facture=generate_invoice_number(),
        payment=payment,
        transaction=financial_transaction,
        reservation=payment.reservation,
        user=payment.user,
        pharmacy=payment.pharmacy,
        montant_medicaments=payment.montant_medicaments,
        frais_livraison=payment.frais_livraison,
        commission=financial_transaction.commission,
        montant_total=payment.montant_total,
        statut=Invoice.STATUS_PAID,
        date_paiement=payment.date_paiement or payment.date_validation,
    )


def generate_invoice_pdf(invoice):
    """
    Preparation pour la future generation PDF.
    L'implementation concrete sera ajoutee dans une etape ulterieure.
    """
    return invoice.pdf_file if invoice.pdf_file else None
