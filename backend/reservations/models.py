from decimal import Decimal

from django.conf import settings
from django.db import models

from medicaments.models import Medicament
from pharmacies.models import Pharmacy


class Reservation(models.Model):
    MODE_RETRAIT_CHOICES = [
        ('retrait', 'Retrait a la pharmacie'),
        ('livraison', 'Livraison a domicile'),
    ]

    STATUT_PAIEMENT_CHOICES = [
        ('non_paye', 'Non paye'),
        ('en_attente_validation', 'En attente de validation'),
        ('valide', 'Valide'),
        ('refuse', 'Refuse'),
        ('annule', 'Annule'),
        ('rembourse', 'Rembourse'),
    ]

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmee'),
        ('prete', 'Prete'),
        ('recuperee', 'Recuperee'),
        ('annulee', 'Annulee'),
    ]
    DEFAULT_FRAIS_LIVRAISON = Decimal('100.00')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    pharmacie = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    mode_retrait = models.CharField(
        max_length=20,
        choices=MODE_RETRAIT_CHOICES,
        default='retrait',
    )
    statut_paiement = models.CharField(
        max_length=30,
        choices=STATUT_PAIEMENT_CHOICES,
        default='non_paye',
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

    def calculate_amounts(self, save=True):
        self.montant_medicaments = sum(
            item.quantite * item.prix_unitaire
            for item in self.items.all()
        )

        if self.mode_retrait == 'retrait':
            self.frais_livraison = Decimal('0.00')
        elif self.frais_livraison <= 0:
            self.frais_livraison = self.DEFAULT_FRAIS_LIVRAISON

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

    def __str__(self):
        return f"Reservation #{self.id} - {self.user.username}"


class ReservationItem(models.Model):
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medicament = models.ForeignKey(
        Medicament,
        on_delete=models.CASCADE,
        related_name='reservation_items'
    )
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.medicament.nom} x {self.quantite}"
