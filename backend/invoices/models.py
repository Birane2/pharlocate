from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from payments.models import Payment
from pharmacies.models import Pharmacy
from reservations.models import Reservation
from transactions.models import Transaction


class Invoice(models.Model):
    STATUS_ISSUED = 'emise'
    STATUS_PAID = 'payee'
    STATUS_CANCELLED = 'annulee'
    STATUS_REFUNDED = 'remboursee'

    STATUT_CHOICES = [
        (STATUS_ISSUED, 'Emise'),
        (STATUS_PAID, 'Payee'),
        (STATUS_CANCELLED, 'Annulee'),
        (STATUS_REFUNDED, 'Remboursee'),
    ]

    numero_facture = models.CharField(max_length=30, unique=True, db_index=True)
    payment = models.OneToOneField(
        Payment,
        on_delete=models.PROTECT,
        related_name='invoice',
    )
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.PROTECT,
        related_name='invoice',
    )
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.PROTECT,
        related_name='invoices',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='invoices',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.PROTECT,
        related_name='invoices',
    )
    montant_medicaments = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    commission = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUS_ISSUED,
        db_index=True,
    )
    date_emission = models.DateTimeField(auto_now_add=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    pdf_file = models.FileField(upload_to='invoices/pdf/', null=True, blank=True)

    IMMUTABLE_FIELDS = [
        'numero_facture',
        'payment_id',
        'transaction_id',
        'reservation_id',
        'user_id',
        'pharmacy_id',
        'montant_medicaments',
        'frais_livraison',
        'commission',
        'montant_total',
        'date_paiement',
    ]

    class Meta:
        ordering = ['-date_emission']
        indexes = [
            models.Index(fields=['statut', 'date_emission']),
            models.Index(fields=['pharmacy', 'date_emission']),
            models.Index(fields=['user', 'date_emission']),
        ]
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'

    def clean(self):
        errors = {}

        if self.payment_id:
            if self.reservation_id and self.reservation_id != self.payment.reservation_id:
                errors['reservation'] = 'La reservation doit correspondre au paiement.'

            if self.user_id and self.user_id != self.payment.user_id:
                errors['user'] = "L'utilisateur doit correspondre au paiement."

            if self.pharmacy_id and self.pharmacy_id != self.payment.pharmacy_id:
                errors['pharmacy'] = 'La pharmacie doit correspondre au paiement.'

        if self.transaction_id:
            if self.payment_id and self.transaction.payment_id != self.payment_id:
                errors['transaction'] = 'La transaction doit correspondre au paiement.'

            if self.commission != self.transaction.commission:
                errors['commission'] = 'La commission doit correspondre a la transaction.'

        if self.montant_medicaments < 0:
            errors['montant_medicaments'] = 'Le montant medicaments ne peut pas etre negatif.'

        if self.frais_livraison < 0:
            errors['frais_livraison'] = 'Les frais de livraison ne peuvent pas etre negatifs.'

        if self.commission < 0:
            errors['commission'] = 'La commission ne peut pas etre negative.'

        if self.montant_total != self.montant_medicaments + self.frais_livraison:
            errors['montant_total'] = (
                'Le montant total doit etre egal au montant medicaments plus les frais de livraison.'
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.pk:
            previous = Invoice.objects.get(pk=self.pk)
            changed_fields = [
                field
                for field in self.IMMUTABLE_FIELDS
                if getattr(previous, field) != getattr(self, field)
            ]
            if changed_fields:
                raise ValidationError(
                    'Une facture emise est immutable. Champs modifies: '
                    + ', '.join(changed_fields)
                )

        if self.payment_id:
            self.reservation_id = self.payment.reservation_id
            self.user_id = self.payment.user_id
            self.pharmacy_id = self.payment.pharmacy_id
            self.montant_medicaments = self.payment.montant_medicaments
            self.frais_livraison = self.payment.frais_livraison
            self.montant_total = self.payment.montant_total
            self.date_paiement = self.payment.date_paiement or self.payment.date_validation

        if self.transaction_id:
            self.commission = self.transaction.commission

        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError('Une facture emise ne peut pas etre supprimee.')

    def __str__(self):
        return self.numero_facture
