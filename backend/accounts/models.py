from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('pharmacien', 'Pharmacien'),
        ('utilisateur', 'Utilisateur'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='utilisateur')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} - {self.role}"
