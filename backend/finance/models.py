from decimal import Decimal

from django.conf import settings
from django.db import models

from pharmacies.models import Pharmacy


class CommissionInvoice(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_OVERDUE = 'overdue'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_PAID, 'Payee'),
        (STATUS_OVERDUE, 'En retard'),
        (STATUS_CANCELLED, 'Annulee'),
    ]

    invoice_number = models.CharField(max_length=30, unique=True, db_index=True)
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.PROTECT,
        related_name='commission_invoices',
    )
    period_start = models.DateField()
    period_end = models.DateField()
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.0500'))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['pharmacy', 'period_start', 'period_end']]
        verbose_name = 'Facture commission'
        verbose_name_plural = 'Factures commissions'

    def __str__(self):
        return f'{self.invoice_number} — {self.pharmacy.nom}'


class CommissionInvoicePayment(models.Model):
    METHOD_BANKILY = 'bankily'
    METHOD_MASRIVI = 'masrivi'
    METHOD_CLICK = 'click'
    METHOD_SEDAD = 'sedad'
    METHOD_BCI_PAY = 'bci_pay'

    METHOD_CHOICES = [
        (METHOD_BANKILY, 'Bankily'),
        (METHOD_MASRIVI, 'Masrivi'),
        (METHOD_CLICK, 'Click'),
        (METHOD_SEDAD, 'Sedad'),
        (METHOD_BCI_PAY, 'BCI Pay'),
    ]

    STATUS_PENDING = 'pending_validation'
    STATUS_VALIDATED = 'validated'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente validation'),
        (STATUS_VALIDATED, 'Valide'),
        (STATUS_REJECTED, 'Refuse'),
    ]

    invoice = models.ForeignKey(
        CommissionInvoice,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    transaction_id = models.CharField(max_length=150)
    proof_image = models.ImageField(upload_to='commission_invoices/proofs/')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_commission_payments',
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Paiement facture commission'
        verbose_name_plural = 'Paiements factures commissions'

    def __str__(self):
        return f'Paiement #{self.id} — {self.invoice.invoice_number}'
