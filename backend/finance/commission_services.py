from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from transactions.models import Transaction


def calculate_pharmacy_commission(pharmacy, period_start, period_end):
    """Return (total_sales, commission_rate, commission_amount) for a pharmacy and period."""
    transactions = Transaction.objects.filter(
        pharmacy=pharmacy,
        type_transaction=Transaction.TYPE_PAYMENT,
        date_creation__date__gte=period_start,
        date_creation__date__lte=period_end,
    )
    agg = transactions.aggregate(
        total_sales=Sum('montant_brut'),
        total_commission=Sum('commission'),
    )
    total_sales = agg['total_sales'] or Decimal('0.00')
    total_commission = agg['total_commission'] or Decimal('0.00')

    subscription = pharmacy.subscriptions.filter(
        is_current=True,
    ).select_related('plan').first()
    commission_rate = subscription.plan.commission_rate if subscription else Decimal('0.0500')

    return total_sales, commission_rate, total_commission


def _generate_invoice_number():
    from .models import CommissionInvoice

    today = date.today()
    prefix = f'CINV-{today.year}{today.month:02d}-'
    last = (
        CommissionInvoice.objects.filter(invoice_number__startswith=prefix)
        .order_by('-invoice_number')
        .first()
    )
    seq = (int(last.invoice_number.split('-')[-1]) + 1) if last else 1
    return f'{prefix}{seq:05d}'


def generate_monthly_commission_invoice(pharmacy, period_start, period_end):
    """Generate a commission invoice. Returns (invoice, created: bool)."""
    from .models import CommissionInvoice

    existing = CommissionInvoice.objects.filter(
        pharmacy=pharmacy,
        period_start=period_start,
        period_end=period_end,
    ).first()
    if existing:
        return existing, False

    total_sales, commission_rate, commission_amount = calculate_pharmacy_commission(
        pharmacy, period_start, period_end
    )

    invoice = CommissionInvoice.objects.create(
        invoice_number=_generate_invoice_number(),
        pharmacy=pharmacy,
        period_start=period_start,
        period_end=period_end,
        total_sales=total_sales,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        due_date=period_end + timedelta(days=15),
        status=CommissionInvoice.STATUS_PENDING,
    )
    return invoice, True


def create_invoice_payment(invoice, payment_method, transaction_id, proof_image, amount):
    """Create a payment submission for a commission invoice."""
    from django.core.exceptions import ValidationError
    from .models import CommissionInvoice, CommissionInvoicePayment

    if invoice.status not in [CommissionInvoice.STATUS_PENDING, CommissionInvoice.STATUS_OVERDUE]:
        raise ValidationError('Cette facture ne peut plus recevoir de paiement.')

    pending = invoice.payments.filter(status=CommissionInvoicePayment.STATUS_PENDING).exists()
    if pending:
        raise ValidationError('Un paiement est deja en cours de validation pour cette facture.')

    return CommissionInvoicePayment.objects.create(
        invoice=invoice,
        payment_method=payment_method,
        transaction_id=transaction_id,
        proof_image=proof_image,
        amount=amount,
        status=CommissionInvoicePayment.STATUS_PENDING,
    )


def validate_commission_payment(payment, admin_user):
    """Admin validates a commission invoice payment and marks the invoice paid."""
    from django.core.exceptions import ValidationError
    from .models import CommissionInvoice, CommissionInvoicePayment

    if payment.status != CommissionInvoicePayment.STATUS_PENDING:
        raise ValidationError('Ce paiement a deja ete traite.')

    payment.status = CommissionInvoicePayment.STATUS_VALIDATED
    payment.validated_by = admin_user
    payment.validated_at = timezone.now()
    payment.rejection_reason = ''
    payment.save(
        update_fields=['status', 'validated_by', 'validated_at', 'rejection_reason', 'updated_at']
    )

    invoice = payment.invoice
    invoice.status = CommissionInvoice.STATUS_PAID
    invoice.paid_at = timezone.now()
    invoice.save(update_fields=['status', 'paid_at', 'updated_at'])

    return payment


def reject_commission_payment(payment, admin_user, reason=''):
    """Admin rejects a commission invoice payment."""
    from django.core.exceptions import ValidationError
    from .models import CommissionInvoicePayment

    if payment.status != CommissionInvoicePayment.STATUS_PENDING:
        raise ValidationError('Ce paiement a deja ete traite.')

    payment.status = CommissionInvoicePayment.STATUS_REJECTED
    payment.validated_by = admin_user
    payment.validated_at = timezone.now()
    payment.rejection_reason = reason
    payment.save(
        update_fields=['status', 'validated_by', 'validated_at', 'rejection_reason', 'updated_at']
    )
    return payment


def mark_overdue_invoices():
    """Mark pending invoices whose due_date has passed as overdue."""
    from .models import CommissionInvoice

    today = date.today()
    updated = CommissionInvoice.objects.filter(
        status=CommissionInvoice.STATUS_PENDING,
        due_date__lt=today,
    ).update(status=CommissionInvoice.STATUS_OVERDUE)
    return updated
