from decimal import Decimal

from django.conf import settings
from django.db import models


class Reservation(models.Model):
    STATUS_PENDING = 'en_attente'
    STATUS_CONFIRMED = 'confirmee'
    STATUS_PREPARING = 'en_preparation'
    STATUS_READY = 'prete'
    STATUS_DELIVERED = 'livree'
    STATUS_CANCELLED = 'annulee'
    STATUS_REJECTED = 'refusee'

    STATUT_CHOICES = (
        (STATUS_PENDING, 'En attente'),
        (STATUS_CONFIRMED, 'Confirmee'),
        (STATUS_PREPARING, 'En preparation'),
        (STATUS_READY, 'Prete'),
        (STATUS_DELIVERED, 'Livree'),
        (STATUS_CANCELLED, 'Annulee'),
        (STATUS_REJECTED, 'Refusee'),
    )

    TYPE_PICKUP = 'retrait'
    TYPE_DELIVERY = 'livraison'

    RESERVATION_TYPE_CHOICES = (
        (TYPE_PICKUP, 'Retrait a la pharmacie'),
        (TYPE_DELIVERY, 'Livraison a domicile'),
    )

    PAYMENT_STATUS_PENDING = 'en_attente_verification'
    PAYMENT_STATUS_VALIDATED = 'valide'
    PAYMENT_STATUS_REJECTED = 'refuse'
    PAYMENT_STATUS_CANCELLED = 'annule'
    PAYMENT_STATUS_REFUNDED = 'rembourse'

    PAYMENT_STATUS_CHOICES = (
        (PAYMENT_STATUS_PENDING, 'En attente de verification'),
        (PAYMENT_STATUS_VALIDATED, 'Valide'),
        (PAYMENT_STATUS_REJECTED, 'Refuse'),
        (PAYMENT_STATUS_CANCELLED, 'Annule'),
        (PAYMENT_STATUS_REFUNDED, 'Rembourse'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    pharmacie = models.ForeignKey(
        'pharmacies.Pharmacy',
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    type_reservation = models.CharField(
        max_length=20,
        choices=RESERVATION_TYPE_CHOICES,
        default=TYPE_PICKUP,
        db_column='mode_retrait',
        db_index=True,
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    statut_paiement = models.CharField(
        max_length=30,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_PENDING,
        db_index=True,
    )
    montant_medicaments = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    date_reservation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    @property
    def date_creation(self):
        return self.date_reservation

    def calculate_amounts(self, save=False):
        montant_medicaments = sum(
            (item.sous_total for item in self.items.all()),
            Decimal('0.00'),
        )
        self.montant_medicaments = montant_medicaments
        self.frais_livraison = self.frais_livraison or Decimal('0.00')
        self.montant_total = self.montant_medicaments + self.frais_livraison

        if save:
            self.save(
                update_fields=[
                    'montant_medicaments',
                    'frais_livraison',
                    'montant_total',
                    'date_modification',
                ]
            )

        return self.montant_total

    def __str__(self):
        return f"Reservation #{self.id} - {self.user} - {self.statut}"


class ReservationItem(models.Model):
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='items',
    )
    medicament = models.ForeignKey(
        'medicaments.Medicament',
        on_delete=models.CASCADE,
        related_name='reservation_items',
    )
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['reservation', 'medicament'],
                name='unique_medicament_per_reservation',
            ),
        ]

    @property
    def sous_total(self):
        return self.prix_unitaire * self.quantite

    @property
    def created_at(self):
        return self.reservation.date_reservation

    def __str__(self):
        return f"{self.medicament.nom} x {self.quantite}"
