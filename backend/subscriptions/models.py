from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from payments.models import Payment
from pharmacies.models import Pharmacy
from transactions.models import Transaction


class SubscriptionPlan(models.Model):
    CODE_FREE = 'gratuit'
    CODE_STANDARD = 'standard'
    CODE_PREMIUM = 'premium'

    nom = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    prix_mensuel = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    prix_annuel = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    max_medicaments = models.PositiveIntegerField(default=50)
    visibilite_prioritaire = models.BooleanField(default=False)
    statistiques_avancees = models.BooleanField(default=False)
    badge_premium = models.BooleanField(default=False)
    notifications_prioritaires = models.BooleanField(default=False)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['prix_mensuel', 'nom']
        verbose_name = 'Plan abonnement'
        verbose_name_plural = 'Plans abonnement'

    @property
    def is_free(self):
        return self.prix_mensuel == 0 and self.prix_annuel == 0

    @property
    def prix(self):
        return self.prix_mensuel if self.prix_mensuel > 0 else self.prix_annuel

    @property
    def duree_jours(self):
        return 30 if self.prix_mensuel > 0 else 365

    def __str__(self):
        return self.nom


class PharmacySubscription(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_EXPIRED = 'expiree'
    STATUS_CANCELLED = 'annulee'
    STATUS_PENDING_PAYMENT = 'en_attente_paiement'
    STATUS_PENDING_VALIDATION = 'en_attente_validation'
    STATUS_REJECTED = 'refuse'

    STATUT_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expiree'),
        (STATUS_CANCELLED, 'Annulee'),
        (STATUS_PENDING_PAYMENT, 'En attente paiement'),
        (STATUS_PENDING_VALIDATION, 'En attente validation'),
        (STATUS_REJECTED, 'Refusee'),
    ]

    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
    )
    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default=STATUS_PENDING_PAYMENT,
        db_index=True,
    )
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    renouvellement_auto = models.BooleanField(default=True)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='subscriptions',
    )
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='subscription',
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['pharmacy', 'statut']),
            models.Index(fields=['plan', 'statut']),
            models.Index(fields=['date_fin']),
        ]
        verbose_name = 'Abonnement pharmacie'
        verbose_name_plural = 'Abonnements pharmacies'

    def clean(self):
        errors = {}

        if self.payment_id and self.payment.pharmacy_id != self.pharmacy_id:
            errors['payment'] = 'Le paiement doit appartenir a la pharmacie.'

        if self.payment_id and self.payment.statut != Payment.STATUS_VALIDATED:
            errors['payment'] = 'Le paiement associe doit etre valide.'

        has_valid_subscription_payment = False
        if self.pk:
            has_valid_subscription_payment = self.subscription_payments.filter(
                status=SubscriptionPayment.STATUS_VALIDATED,
            ).exists()

        if (
            self.statut == self.STATUS_ACTIVE
            and not self.plan.is_free
            and not self.payment_id
            and not has_valid_subscription_payment
        ):
            errors['payment'] = 'Un abonnement payant necessite un paiement valide.'

        if self.date_debut and self.date_fin and self.date_fin <= self.date_debut:
            errors['date_fin'] = 'La date de fin doit etre posterieure a la date de debut.'

        if errors:
            raise ValidationError(errors)

    @property
    def is_active(self):
        return self.statut == self.STATUS_ACTIVE

    def __str__(self):
        return f'{self.pharmacy.nom} - {self.plan.nom}'


class PlatformPaymentMethod(models.Model):
    bankily_number = models.CharField(max_length=50, blank=True)
    masrivi_number = models.CharField(max_length=50, blank=True)
    click_number = models.CharField(max_length=50, blank=True)
    sedad_number = models.CharField(max_length=50, blank=True)
    bci_pay_number = models.CharField(max_length=50, blank=True)
    beneficiary_name = models.CharField(max_length=150, blank=True)
    payment_instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuration paiement plateforme'
        verbose_name_plural = 'Configurations paiement plateforme'

    @property
    def display_beneficiary_name(self):
        return self.beneficiary_name or 'PharmaLocate'

    def has_any_method(self):
        return any([
            self.bankily_number,
            self.masrivi_number,
            self.click_number,
            self.sedad_number,
            self.bci_pay_number,
        ])

    def save(self, *args, **kwargs):
        if self.is_active:
            PlatformPaymentMethod.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Paiements plateforme - {self.display_beneficiary_name}'


class SubscriptionPayment(models.Model):
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

    STATUS_PENDING = 'en_attente_validation'
    STATUS_VALIDATED = 'valide'
    STATUS_REJECTED = 'refuse'
    STATUS_CANCELLED = 'annule'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente validation'),
        (STATUS_VALIDATED, 'Valide'),
        (STATUS_REJECTED, 'Refuse'),
        (STATUS_CANCELLED, 'Annule'),
    ]

    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='subscription_payments',
    )
    subscription = models.ForeignKey(
        PharmacySubscription,
        on_delete=models.CASCADE,
        related_name='subscription_payments',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    transaction_id = models.CharField(max_length=150)
    proof_image = models.ImageField(upload_to='subscriptions/proofs/', blank=True, null=True)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_subscription_payments',
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['pharmacy', 'status']),
        ]
        verbose_name = 'Paiement abonnement'
        verbose_name_plural = 'Paiements abonnements'

    def clean(self):
        errors = {}

        if self.subscription_id and self.pharmacy_id != self.subscription.pharmacy_id:
            errors['subscription'] = 'Cet abonnement ne correspond pas a cette pharmacie.'

        if self.amount < 0:
            errors['amount'] = 'Le montant ne peut pas etre negatif.'

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f'Paiement abonnement #{self.id} - {self.status}'
