from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from pharmacies.models import Pharmacy


class Avis(models.Model):
    pharmacie = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='avis'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avis'
    )
    note = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    commentaire = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.pharmacie.nom} - {self.note}"