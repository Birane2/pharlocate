from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from pharmacies.models import Pharmacy
from reservations.models import Reservation


class Delivery(models.Model):
    STATUS_PENDING = 'en_attente'
    STATUS_PREPARING = 'en_preparation'
    STATUS_COURIER_ASSIGNED = 'livreur_assigne'
    STATUS_ON_ROUTE = 'en_route'
    STATUS_DELIVERED = 'livree'
    STATUS_CANCELLED = 'annulee'
    STATUS_FAILED = 'echec_livraison'

    STATUT_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_PREPARING, 'En preparation'),
        (STATUS_COURIER_ASSIGNED, 'Livreur assigne'),
        (STATUS_ON_ROUTE, 'En route'),
        (STATUS_DELIVERED, 'Livree'),
        (STATUS_CANCELLED, 'Annulee'),
        (STATUS_FAILED, 'Echec livraison'),
    ]

    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.CASCADE,
        related_name='delivery',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='deliveries',
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='deliveries',
    )
    adresse_livraison = models.TextField()
    telephone = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    note = models.TextField(blank=True)
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
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
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
        indexes = [
            models.Index(fields=['statut', 'date_creation']),
            models.Index(fields=['pharmacy', 'statut']),
        ]
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'

    def clean(self):
        errors = {}

        if self.reservation_id:
            if self.reservation.mode_retrait == 'retrait':
                errors['reservation'] = (
                    'Aucune livraison ne doit etre creee pour une reservation en retrait.'
                )

            if self.user_id and self.user_id != self.reservation.user_id:
                errors['user'] = "L'utilisateur doit correspondre a la reservation."

            if self.pharmacy_id and self.pharmacy_id != self.reservation.pharmacie_id:
                errors['pharmacy'] = 'La pharmacie doit correspondre a la reservation.'

            if self.statut == self.STATUS_DELIVERED and self.reservation.statut == 'annulee':
                errors['statut'] = (
                    'Impossible de marquer une livraison comme livree '
                    'si la reservation est annulee.'
                )

        if not (self.adresse_livraison or '').strip():
            errors['adresse_livraison'] = "L'adresse de livraison est obligatoire."

        if not (self.telephone or '').strip():
            errors['telephone'] = 'Le telephone de livraison est obligatoire.'

        if self.frais_livraison is not None and self.frais_livraison < 0:
            errors['frais_livraison'] = 'Les frais de livraison doivent etre positifs ou nuls.'

        if self.distance_km is not None and self.distance_km < 0:
            errors['distance_km'] = 'La distance de livraison doit etre positive ou nulle.'

        if self.tarif_par_km is not None and self.tarif_par_km < 0:
            errors['tarif_par_km'] = 'Le tarif par kilometre doit etre positif ou nul.'

        if self.latitude is not None and not (Decimal('-90') <= self.latitude <= Decimal('90')):
            errors['latitude'] = 'La latitude doit etre comprise entre -90 et 90.'

        if self.longitude is not None and not (Decimal('-180') <= self.longitude <= Decimal('180')):
            errors['longitude'] = 'La longitude doit etre comprise entre -180 et 180.'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.reservation_id:
            if not self.user_id:
                self.user_id = self.reservation.user_id

            if not self.pharmacy_id:
                self.pharmacy_id = self.reservation.pharmacie_id

        if self.statut == self.STATUS_DELIVERED and self.date_livraison_reelle is None:
            self.date_livraison_reelle = timezone.now()

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Livraison #{self.id} - Reservation #{self.reservation_id}'


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
        settings.AUTH_USER_MODEL,
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

    def clean(self):
        if self.ancien_statut and self.ancien_statut == self.nouveau_statut:
            raise ValidationError({
                'nouveau_statut': 'Le nouveau statut doit etre different de l ancien statut.'
            })

    def __str__(self):
        return (
            f'Livraison #{self.delivery_id}: '
            f'{self.ancien_statut or "-"} -> {self.nouveau_statut}'
        )
