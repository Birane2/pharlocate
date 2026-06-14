from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from invoices.models import Invoice
from payments.models import Payment
from pharmacies.models import Pharmacy
from reservations.models import Reservation
from transactions.models import Transaction


class Refund(models.Model):
    STATUS_REQUESTED = 'demande'
    STATUS_REVIEW = 'en_revision'
    STATUS_APPROVED = 'approuve'
    STATUS_REJECTED = 'refuse'
    STATUS_EXECUTED = 'effectue'

    STATUT_CHOICES = [
        (STATUS_REQUESTED, 'Demande'),
        (STATUS_REVIEW, 'En revision'),
        (STATUS_APPROVED, 'Approuve'),
        (STATUS_REJECTED, 'Refuse'),
        (STATUS_EXECUTED, 'Effectue'),
    ]

    REASON_UNAVAILABLE = 'medicament_indisponible'
    REASON_CANCELLED_RESERVATION = 'reservation_annulee'
    REASON_DOUBLE_PAYMENT = 'paiement_en_double'
    REASON_PAYMENT_ERROR = 'erreur_paiement'
    REASON_DELIVERY_FAILED = 'livraison_echouee'
    REASON_OTHER = 'autre'

    MOTIF_CHOICES = [
        (REASON_UNAVAILABLE, 'Medicament indisponible'),
        (REASON_CANCELLED_RESERVATION, 'Reservation annulee'),
        (REASON_DOUBLE_PAYMENT, 'Paiement en double'),
        (REASON_PAYMENT_ERROR, 'Erreur de paiement'),
        (REASON_DELIVERY_FAILED, 'Livraison echouee'),
        (REASON_OTHER, 'Autre'),
    ]

    payment = models.OneToOneField(
        Payment,
        on_delete=models.PROTECT,
        related_name='refund',
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.PROTECT,
        related_name='refund_requests',
    )
    refund_transaction = models.OneToOneField(
        Transaction,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='executed_refund',
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='refunds',
    )
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.PROTECT,
        related_name='refunds',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='refunds',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.PROTECT,
        related_name='refunds',
    )
    montant_demande = models.DecimalField(max_digits=12, decimal_places=2)
    montant_approuve = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    motif = models.CharField(max_length=40, choices=MOTIF_CHOICES)
    commentaire_admin = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUS_REQUESTED,
        db_index=True,
    )
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds',
    )
    date_demande = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_remboursement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_demande']
        indexes = [
            models.Index(fields=['statut', 'date_demande']),
            models.Index(fields=['pharmacy', 'statut']),
            models.Index(fields=['user', 'statut']),
        ]
        verbose_name = 'Remboursement'
        verbose_name_plural = 'Remboursements'

    def clean(self):
        errors = {}

        if self.payment_id:
            if self.payment.statut != Payment.STATUS_VALIDATED and self.statut != self.STATUS_EXECUTED:
                errors['payment'] = 'Seuls les paiements valides peuvent etre rembourses.'

            if self.reservation_id and self.reservation_id != self.payment.reservation_id:
                errors['reservation'] = 'La reservation doit correspondre au paiement.'

            if self.user_id and self.user_id != self.payment.user_id:
                errors['user'] = "L'utilisateur doit correspondre au paiement."

            if self.pharmacy_id and self.pharmacy_id != self.payment.pharmacy_id:
                errors['pharmacy'] = 'La pharmacie doit correspondre au paiement.'

            if self.montant_demande and self.montant_demande > self.payment.montant_total:
                errors['montant_demande'] = 'Le montant demande ne peut pas depasser le montant paye.'

            if self.montant_approuve and self.montant_approuve > self.payment.montant_total:
                errors['montant_approuve'] = 'Le montant approuve ne peut pas depasser le montant paye.'

        if self.invoice_id and self.payment_id and self.invoice.payment_id != self.payment_id:
            errors['invoice'] = 'La facture doit correspondre au paiement.'

        if self.transaction_id and self.payment_id and self.transaction.payment_id != self.payment_id:
            errors['transaction'] = 'La transaction doit correspondre au paiement.'

        if self.montant_demande <= 0:
            errors['montant_demande'] = 'Le montant demande doit etre superieur a zero.'

        if self.montant_approuve < 0:
            errors['montant_approuve'] = 'Le montant approuve ne peut pas etre negatif.'

        if self.statut in {self.STATUS_APPROVED, self.STATUS_EXECUTED} and self.montant_approuve <= 0:
            errors['montant_approuve'] = 'Le montant approuve est obligatoire.'

        if not self.motif:
            errors['motif'] = 'Le motif de remboursement est obligatoire.'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.payment_id:
            self.reservation_id = self.payment.reservation_id
            self.user_id = self.payment.user_id
            self.pharmacy_id = self.payment.pharmacy_id

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Remboursement #{self.id} - Paiement #{self.payment_id}'


class RefundStatusHistory(models.Model):
    refund = models.ForeignKey(
        Refund,
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    ancien_statut = models.CharField(
        max_length=20,
        choices=Refund.STATUT_CHOICES,
        blank=True,
    )
    nouveau_statut = models.CharField(
        max_length=20,
        choices=Refund.STATUT_CHOICES,
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='refund_status_changes',
    )
    commentaire = models.TextField(blank=True)
    date_changement = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_changement']
        verbose_name = 'Historique remboursement'
        verbose_name_plural = 'Historiques remboursements'

    def __str__(self):
        return f'Remboursement #{self.refund_id}: {self.ancien_statut or "-"} -> {self.nouveau_statut}'
