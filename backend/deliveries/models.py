from decimal import Decimal

from django.db import models
from django.utils import timezone


class DeliveryFeeConfig(models.Model):
    price_per_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('10.00'),
    )
    minimum_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('50.00'),
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Configuration frais livraison'
        verbose_name_plural = 'Configurations frais livraison'

    def __str__(self):
        return f"{self.price_per_km} MRU/km - minimum {self.minimum_fee} MRU"


class Delivery(models.Model):
    STATUS_PENDING = 'en_attente'
    STATUS_IN_PROGRESS = 'en_cours'
    STATUS_DELIVERED = 'livree'
    STATUS_CANCELLED = 'annulee'

    STATUT_CHOICES = (
        (STATUS_PENDING, 'En attente'),
        (STATUS_IN_PROGRESS, 'En cours'),
        (STATUS_DELIVERED, 'Livree'),
        (STATUS_CANCELLED, 'Annulee'),
    )

    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='delivery',
    )
    pharmacy = models.ForeignKey(
        'pharmacies.Pharmacy',
        on_delete=models.CASCADE,
        related_name='deliveries',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='deliveries',
    )
    adresse_livraison = models.TextField()
    telephone = models.CharField(max_length=20)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    note = models.TextField(blank=True)
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    distance_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Distance estimee entre la pharmacie et le client.',
    )
    tarif_par_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('50.00'),
        help_text='Tarif utilise pour calculer les frais de livraison.',
    )
    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_livraison_estimee = models.DateTimeField(null=True, blank=True)
    date_livraison_reelle = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'
        indexes = [
            models.Index(
                fields=['statut', 'date_creation'],
                name='deliveries__statut_0b0e0b_idx',
            ),
            models.Index(
                fields=['pharmacy', 'statut'],
                name='deliveries__pharmac_1264a6_idx',
            ),
        ]

    @property
    def status(self):
        return self.statut

    @status.setter
    def status(self, value):
        self.statut = value

    @property
    def delivery_address(self):
        return self.adresse_livraison

    @property
    def delivery_phone(self):
        return self.telephone

    @property
    def delivery_note(self):
        return self.note

    @property
    def client_latitude(self):
        return self.latitude

    @property
    def client_longitude(self):
        return self.longitude

    @property
    def delivery_fee(self):
        return self.frais_livraison

    @property
    def delivered_at(self):
        return self.date_livraison_reelle

    def save(self, *args, **kwargs):
        if self.statut == self.STATUS_DELIVERED and self.date_livraison_reelle is None:
            self.date_livraison_reelle = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Livraison #{self.id} - {self.statut}"


class DeliveryStatusHistory(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    ancien_statut = models.CharField(
        max_length=30,
        choices=Delivery.STATUT_CHOICES,
        blank=True,
    )
    nouveau_statut = models.CharField(
        max_length=30,
        choices=Delivery.STATUT_CHOICES,
    )
    changed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_status_changes',
    )
    commentaire = models.TextField(blank=True)
    date_changement = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_changement']
        verbose_name = 'Historique statut livraison'
        verbose_name_plural = 'Historiques statuts livraison'

    def __str__(self):
        return f"Livraison #{self.delivery_id}: {self.ancien_statut} -> {self.nouveau_statut}"
