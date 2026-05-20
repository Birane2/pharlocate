from django.db import models
from django.core.exceptions import ValidationError
from pharmacies.models import Pharmacy


class Medicament(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    photo = models.ImageField(upload_to='medicaments/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    categorie = models.CharField(max_length=100, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']

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
    seuil_alerte = models.PositiveIntegerField(default=5)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_modification']
        constraints = [
            models.UniqueConstraint(
                fields=['pharmacie', 'medicament'],
                name='unique_stock_per_pharmacy_medicament',
            ),
        ]

    def clean(self):
        errors = {}

        if self.quantite < 0:
            errors['quantite'] = 'La quantite ne peut pas etre negative.'

        if self.prix is not None and self.prix < 0:
            errors['prix'] = 'Le prix ne peut pas etre negatif.'

        if self.seuil_alerte < 0:
            errors['seuil_alerte'] = 'Le seuil d alerte ne peut pas etre negatif.'

        if errors:
            raise ValidationError(errors)

    @property
    def is_rupture(self):
        return self.quantite == 0

    @property
    def is_stock_faible(self):
        return self.quantite > 0 and self.quantite < self.seuil_alerte

    @property
    def status(self):
        if self.is_rupture:
            return 'rupture'

        if self.is_stock_faible:
            return 'faible'

        return 'disponible'

    def __str__(self):
        return f"{self.pharmacie.nom} - {self.medicament.nom}"
