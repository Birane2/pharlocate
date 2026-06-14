from django.db import models
from django.utils import timezone

from pharmacies.models import Pharmacy


class PaymentMethod(models.Model):
    CODE_BANKILY = 'bankily'
    CODE_MASRIVI = 'masrivi'
    CODE_CLICK = 'click'
    CODE_SEDAD = 'sedad'
    CODE_BCI_PAY = 'bci_pay'
    CODE_CASH_PHARMACY = 'paiement_pharmacie'
    CODE_CASH_DELIVERY = 'paiement_livraison'

    MANUAL_MOBILE_CODES = {
        CODE_BANKILY,
        CODE_MASRIVI,
        CODE_CLICK,
        CODE_SEDAD,
        CODE_BCI_PAY,
    }

    nom = models.CharField(max_length=100)
    code = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    numero_compte = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Methode de paiement'
        verbose_name_plural = 'Methodes de paiement'
        ordering = ['nom']

    @property
    def requires_proof(self):
        return self.code in self.MANUAL_MOBILE_CODES

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
    beneficiary_name = models.CharField(max_length=150, blank=True)
    payment_instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuration paiement pharmacie'
        verbose_name_plural = 'Configurations paiement pharmacies'

    @property
    def display_beneficiary_name(self):
        return self.beneficiary_name or self.pharmacy.nom

    @property
    def created_at(self):
        return self.date_creation

    @property
    def updated_at(self):
        return self.date_modification

    def get_number_for_code(self, code):
        mapping = {
            PaymentMethod.CODE_BANKILY: self.bankily_number,
            PaymentMethod.CODE_MASRIVI: self.masrivi_number,
            PaymentMethod.CODE_CLICK: self.click_number,
            PaymentMethod.CODE_SEDAD: self.sedad_number,
            PaymentMethod.CODE_BCI_PAY: self.bci_pay_number,
        }
        return mapping.get(code, '')

    def has_any_method(self):
        return any([
            self.bankily_number,
            self.masrivi_number,
            self.click_number,
            self.sedad_number,
            self.bci_pay_number,
        ])

    def __str__(self):
        return f"Methodes paiement - {self.pharmacy.nom}"


class Payment(models.Model):
    STATUS_PENDING = 'en_attente_verification'
    STATUS_VALIDATED = 'valide'
    STATUS_REJECTED = 'refuse'
    STATUS_CANCELLED = 'annule'
    STATUS_REFUNDED = 'rembourse'

    PAYMENT_STATUS_CHOICES = (
        (STATUS_PENDING, 'En attente de verification'),
        (STATUS_VALIDATED, 'Valide'),
        (STATUS_REJECTED, 'Refuse'),
        (STATUS_CANCELLED, 'Annule'),
        (STATUS_REFUNDED, 'Rembourse'),
    )

    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='payment',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    numero_client = models.CharField(max_length=20)
    montant_medicaments = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    frais_livraison = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transaction_id = models.CharField(
        max_length=150,
        db_column='reference_paiement',
    )
    capture_paiement = models.ImageField(
        upload_to='payments/proofs/',
        blank=True,
        null=True,
    )
    statut = models.CharField(
        max_length=30,
        choices=PAYMENT_STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    date_paiement = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    motif_refus = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    valide_par = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_payments',
    )

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_creation']
        indexes = [
            models.Index(
                fields=['statut', 'date_creation'],
                name='payments_pa_statut_66a919_idx',
            ),
            models.Index(
                fields=['pharmacy', 'statut'],
                name='payments_pa_pharmac_b451c5_idx',
            ),
            models.Index(
                fields=['user', 'statut'],
                name='payments_pa_user_id_368514_idx',
            ),
        ]

    @property
    def status(self):
        return self.statut

    @status.setter
    def status(self, value):
        self.statut = value

    @property
    def method(self):
        return self.payment_method.code

    @property
    def client_phone(self):
        return self.numero_client

    @property
    def payment_proof(self):
        return self.capture_paiement

    @property
    def amount(self):
        return self.montant_total

    @property
    def verified_by(self):
        return self.valide_par

    @property
    def verified_at(self):
        return self.date_validation

    @property
    def rejection_reason(self):
        return self.motif_refus

    @property
    def has_complete_proof(self):
        return bool(self.transaction_id and self.capture_paiement)

    def validate_payment(self, user):
        self.statut = self.STATUS_VALIDATED
        self.valide_par = user
        self.date_validation = timezone.now()
        self.motif_refus = ''
        self.save()

    def reject_payment(self, user, reason=''):
        self.statut = self.STATUS_REJECTED
        self.valide_par = user
        self.date_validation = timezone.now()
        self.motif_refus = reason
        self.save()

    def cancel_payment(self):
        self.statut = self.STATUS_CANCELLED
        self.save(update_fields=['statut'])

    def refund_payment(self):
        self.statut = self.STATUS_REFUNDED
        self.save(update_fields=['statut'])

    def __str__(self):
        return f"Paiement #{self.id} - {self.payment_method.code} - {self.statut}"
