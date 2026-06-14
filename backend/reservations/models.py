from django.conf import settings
from django.db import models


class Reservation(models.Model):
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('en_preparation', 'En préparation'),
        ('prete', 'Prête'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
        ('refusee', 'Refusée'),
    )

    RESERVATION_TYPE_CHOICES = (
        ('retrait', 'Retrait à la pharmacie'),
        ('livraison', 'Livraison à domicile'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    pharmacie = models.ForeignKey(
        'pharmacies.Pharmacy',
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    type_reservation = models.CharField(
        max_length=20,
        choices=RESERVATION_TYPE_CHOICES,
        default='retrait'
    )

    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    montant_medicaments = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    frais_livraison = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Réservation #{self.id} - {self.user} - {self.statut}"


class ReservationItem(models.Model):
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='items'
    )

    stock = models.ForeignKey(
        'medicaments.Stock',
        on_delete=models.CASCADE,
        related_name='reservation_items'
    )

    quantite = models.PositiveIntegerField(default=1)

    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    sous_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.stock:
            self.prix_unitaire = self.stock.prix

        self.sous_total = self.prix_unitaire * self.quantite

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.stock.medicament.nom} x {self.quantite}"