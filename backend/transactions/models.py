from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from payments.models import Payment
from pharmacies.models import Pharmacy
from reservations.models import Reservation


class Transaction(models.Model):
    TYPE_PAYMENT = 'paiement'
    TYPE_COMMISSION = 'commission'
    TYPE_REFUND = 'remboursement'
    TYPE_ADJUSTMENT = 'ajustement'
    TYPE_SUBSCRIPTION = 'abonnement'

    TYPE_CHOICES = [
        (TYPE_PAYMENT, 'Paiement'),
        (TYPE_COMMISSION, 'Commission'),
        (TYPE_REFUND, 'Remboursement'),
        (TYPE_ADJUSTMENT, 'Ajustement'),
        (TYPE_SUBSCRIPTION, 'Abonnement'),
    ]

    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    type_transaction = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default=TYPE_PAYMENT,
        db_index=True,
    )
    montant_brut = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    commission = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    montant_pharmacie = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    description = models.TextField(blank=True)
    reference_transaction = models.CharField(max_length=80, unique=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_transactions',
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['type_transaction', 'date_creation']),
            models.Index(fields=['pharmacy', 'date_creation']),
            models.Index(fields=['user', 'date_creation']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['payment', 'type_transaction'],
                name='unique_transaction_type_per_payment',
            ),
        ]
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    def clean(self):
        errors = {}

        if self.payment_id:
            if self.reservation_id and self.reservation_id != self.payment.reservation_id:
                errors['reservation'] = 'La reservation doit correspondre au paiement.'

            if self.user_id and self.user_id != self.payment.user_id:
                errors['user'] = "L'utilisateur doit correspondre au paiement."

            if self.pharmacy_id and self.pharmacy_id != self.payment.pharmacy_id:
                errors['pharmacy'] = 'La pharmacie doit correspondre au paiement.'

        if self.montant_brut < 0:
            errors['montant_brut'] = 'Le montant brut ne peut pas etre negatif.'

        if self.commission < 0:
            errors['commission'] = 'La commission ne peut pas etre negative.'

        if self.montant_pharmacie < 0:
            errors['montant_pharmacie'] = 'Le montant pharmacie ne peut pas etre negatif.'

        if self.montant_pharmacie != self.montant_brut - self.commission:
            errors['montant_pharmacie'] = (
                'Le montant pharmacie doit etre egal au montant brut moins la commission.'
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError('Une transaction financiere est immutable apres creation.')

        if self.payment_id:
            self.reservation_id = self.payment.reservation_id
            self.user_id = self.payment.user_id
            self.pharmacy_id = self.payment.pharmacy_id

        if not self.reference_transaction:
            self.reference_transaction = f'TXN-{uuid4().hex[:16].upper()}'

        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('Une transaction financiere ne peut pas etre supprimee.')

    def __str__(self):
        return self.reference_transaction
