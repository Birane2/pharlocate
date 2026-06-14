from django.db import models
from django.utils import timezone

from pharmacies.models import Pharmacy


class PharmacyPaymentMethod(models.Model):
    pharmacy = models.OneToOneField(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )

    beneficiary_name = models.CharField(max_length=150)

    bankily_number = models.CharField(max_length=30, blank=True, null=True)
    masrivi_number = models.CharField(max_length=30, blank=True, null=True)
    click_number = models.CharField(max_length=30, blank=True, null=True)
    sedad_number = models.CharField(max_length=30, blank=True, null=True)
    bci_pay_number = models.CharField(max_length=30, blank=True, null=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def has_any_method(self):
        return any([
            self.bankily_number,
            self.masrivi_number,
            self.click_number,
            self.sedad_number,
            self.bci_pay_number,
        ])

    def __str__(self):
        return f"Méthodes paiement - {self.pharmacy.nom}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('bankily', 'Bankily'),
        ('masrivi', 'Masrivi'),
        ('click', 'Click'),
        ('sedad', 'Sedad'),
        ('bci_pay', 'BCI Pay'),
        ('cash_pharmacy', 'Paiement à la pharmacie'),
        ('cash_delivery', 'Paiement à la livraison'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('en_attente_verification', 'En attente de vérification'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
        ('rembourse', 'Remboursé'),
        ('annule', 'Annulé'),
    )

    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='payment'
    )

    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='payments'
    )

    method = models.CharField(
        max_length=30,
        choices=PAYMENT_METHOD_CHOICES
    )

    client_phone = models.CharField(max_length=30)

    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    payment_proof = models.ImageField(
        upload_to='payments/proofs/',
        blank=True,
        null=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=40,
        choices=PAYMENT_STATUS_CHOICES,
        default='en_attente_verification'
    )

    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments'
    )

    verified_at = models.DateTimeField(null=True, blank=True)

    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def validate_payment(self, user):
        self.status = 'valide'
        self.verified_by = user
        self.verified_at = timezone.now()
        self.rejection_reason = None
        self.save()

    def reject_payment(self, user, reason=''):
        self.status = 'refuse'
        self.verified_by = user
        self.verified_at = timezone.now()
        self.rejection_reason = reason
        self.save()

    def cancel_payment(self):
        self.status = 'annule'
        self.save()

    def refund_payment(self):
        self.status = 'rembourse'
        self.save()

    def __str__(self):
        return f"Paiement #{self.id} - {self.method} - {self.status}"