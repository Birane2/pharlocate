from django.db import models
from pharmacies.models import Pharmacy


class Medicament(models.Model):
    nom = models.CharField(max_length=150)
    photo = models.ImageField(upload_to='medicaments/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class Stock(models.Model):
    pharmacie = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='stocks'
    )
    medicament = models.ForeignKey(
        Medicament,
        on_delete=models.CASCADE,
        related_name='stocks'
    )
    quantite = models.PositiveIntegerField(default=0)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('pharmacie', 'medicament')

    def __str__(self):
        return f"{self.pharmacie.nom} - {self.medicament.nom}"