from decimal import Decimal

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

    def __str__(self):
        return self.nom


class PharmacySubscription(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_EXPIRED = 'expiree'
    STATUS_CANCELLED = 'annulee'
    STATUS_PENDING_PAYMENT = 'en_attente_paiement'

    STATUT_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expiree'),
        (STATUS_CANCELLED, 'Annulee'),
        (STATUS_PENDING_PAYMENT, 'En attente paiement'),
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

        if self.statut == self.STATUS_ACTIVE and not self.plan.is_free and not self.payment_id:
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
