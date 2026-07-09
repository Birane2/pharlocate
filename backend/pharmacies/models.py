from django.conf import settings
from django.db import models

from .validators import round_coordinate_decimal


class Pharmacy(models.Model):
    STATUT_VALIDATION_CHOICES = [
        ('en_attente', 'En attente'),
        ('validee', 'Validee'),
        ('refusee', 'Refusee'),
        ('suspendue', 'Suspendue'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pharmacy'
    )
    nom = models.CharField(max_length=150)
    adresse = models.CharField(max_length=255)
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
    telephone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='pharmacies/', blank=True, null=True)
    est_valide = models.BooleanField(default=False)
    statut_validation = models.CharField(
        max_length=20,
        choices=STATUT_VALIDATION_CHOICES,
        default='en_attente',
    )
    google_maps_url = models.URLField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    google_place_id = models.CharField(max_length=300, blank=True, null=True)
    motif_refus = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_validation = models.DateTimeField(blank=True, null=True)
    date_suspension = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.latitude is not None:
            self.latitude = round_coordinate_decimal(self.latitude)

        if self.longitude is not None:
            self.longitude = round_coordinate_decimal(self.longitude)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Horaire(models.Model):
    JOURS_CHOICES = [
        ('lundi', 'Lundi'),
        ('mardi', 'Mardi'),
        ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'),
        ('vendredi', 'Vendredi'),
        ('samedi', 'Samedi'),
        ('dimanche', 'Dimanche'),
    ]

    pharmacie = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='horaires'
    )
    jour = models.CharField(max_length=20, choices=JOURS_CHOICES)
    heure_ouverture = models.TimeField()
    heure_fermeture = models.TimeField()
    est_ouvert = models.BooleanField(default=True)
    est_garde = models.BooleanField(default=False)
    date_debut_garde = models.DateTimeField(blank=True, null=True)
    date_fin_garde = models.DateTimeField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['pharmacie__nom', 'jour', 'heure_ouverture']

    def __str__(self):
        return f"{self.pharmacie.nom} - {self.jour}"
