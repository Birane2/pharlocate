from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from pharmacies.models import Pharmacy
from reservations.models import Reservation


class PaymentMethod(models.Model):
    CODE_BANKILY = 'bankily'
    CODE_MASRVI = 'masrvi'
    CODE_CLICK = 'click'
    CODE_SEDAD = 'sedad'
    CODE_BCI_PAY = 'bci_pay'
    CODE_PHARMACY = 'paiement_pharmacie'
    CODE_DELIVERY = 'paiement_livraison'

    MANUAL_PROOF_CODES = {
        CODE_BANKILY,
        CODE_MASRVI,
        CODE_CLICK,
        CODE_SEDAD,
        CODE_BCI_PAY,
    }

    nom = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    numero_compte = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Methode de paiement'
        verbose_name_plural = 'Methodes de paiement'

    @property
    def requires_proof(self):
        return self.code in self.MANUAL_PROOF_CODES

    def __str__(self):
        return self.nom


class PharmacyPaymentMethod(models.Model):
    pharmacy = models.OneToOneField(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='payment_methods_config',
    )
    bankily_number = models.CharField(max_length=50, blank=True)
    masrivi_number = models.CharField(max_length=50, blank=True)
    click_number = models.CharField(max_length=50, blank=True)
    sedad_number = models.CharField(max_length=50, blank=True)
    bci_pay_number = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuration paiement pharmacie'
        verbose_name_plural = 'Configurations paiement pharmacies'

    def get_account_number(self, code):
        mapping = {
            PaymentMethod.CODE_BANKILY: self.bankily_number,
            PaymentMethod.CODE_MASRVI: self.masrivi_number,
            PaymentMethod.CODE_CLICK: self.click_number,
            PaymentMethod.CODE_SEDAD: self.sedad_number,
            PaymentMethod.CODE_BCI_PAY: self.bci_pay_number,
        }
        return mapping.get(code, '')

    def __str__(self):
        return f'Methodes paiement - {self.pharmacy.nom}'


class Payment(models.Model):
    STATUS_UNPAID = 'non_paye'
    STATUS_PENDING = 'en_attente_validation'
    STATUS_VALIDATED = 'valide'
    STATUS_REJECTED = 'refuse'
    STATUS_CANCELLED = 'annule'
    STATUS_REFUNDED = 'rembourse'

    STATUT_CHOICES = [
        (STATUS_UNPAID, 'Non paye'),
        (STATUS_PENDING, 'En attente de validation'),
        (STATUS_VALIDATED, 'Valide'),
        (STATUS_REJECTED, 'Refuse'),
        (STATUS_CANCELLED, 'Annule'),
        (STATUS_REFUNDED, 'Rembourse'),
    ]

    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.CASCADE,
        related_name='payment',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        related_name='payments',
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
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    reference_paiement = models.CharField(max_length=150, blank=True)
    capture_paiement = models.ImageField(
        upload_to='payments/proofs/',
        blank=True,
        null=True,
    )
    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_payments',
    )
    date_paiement = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    motif_refus = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['statut', 'date_creation']),
            models.Index(fields=['pharmacy', 'statut']),
            models.Index(fields=['user', 'statut']),
        ]
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    @property
    def has_proof(self):
        return bool(self.reference_paiement or self.capture_paiement)

    def recalculate_amounts(self):
        self.reservation.calculate_amounts(save=True)
        self.montant_medicaments = self.reservation.montant_medicaments
        self.frais_livraison = self.reservation.frais_livraison
        self.montant_total = self.montant_medicaments + self.frais_livraison

    def clean(self):
        errors = {}

        if self.reservation_id:
            if self.user_id and self.user_id != self.reservation.user_id:
                errors['user'] = "L'utilisateur doit correspondre a la reservation."

            if self.pharmacy_id and self.pharmacy_id != self.reservation.pharmacie_id:
                errors['pharmacy'] = 'La pharmacie doit correspondre a la reservation.'

        if self.payment_method_id and self.payment_method.requires_proof and not self.has_proof:
            errors['reference_paiement'] = (
                'Une reference ou une capture est obligatoire pour ce mode de paiement.'
            )

        if self.statut == self.STATUS_REJECTED and not (self.motif_refus or '').strip():
            errors['motif_refus'] = 'Le motif de refus est obligatoire.'

        if self.montant_medicaments < 0:
            errors['montant_medicaments'] = 'Le montant des medicaments ne peut pas etre negatif.'

        if self.frais_livraison < 0:
            errors['frais_livraison'] = 'Les frais de livraison ne peuvent pas etre negatifs.'

        if self.montant_total != self.montant_medicaments + self.frais_livraison:
            errors['montant_total'] = 'Le montant total doit etre recalcule cote backend.'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.reservation_id:
            if not self.user_id:
                self.user_id = self.reservation.user_id

            if not self.pharmacy_id:
                self.pharmacy_id = self.reservation.pharmacie_id

            self.recalculate_amounts()

        if self.has_proof and self.date_paiement is None:
            self.date_paiement = timezone.now()

        if self.statut in {self.STATUS_VALIDATED, self.STATUS_REJECTED}:
            if self.date_validation is None:
                self.date_validation = timezone.now()

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Paiement #{self.id} - Reservation #{self.reservation_id}'
