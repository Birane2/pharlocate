from django.conf import settings
from django.db import models


class Pharmacy(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pharmacy'
    )
    nom = models.CharField(max_length=150)
    adresse = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    telephone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='pharmacies/', blank=True, null=True)
    est_valide = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

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
    est_garde = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.pharmacie.nom} - {self.jour}"
