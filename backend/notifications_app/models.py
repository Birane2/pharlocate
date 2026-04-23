from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Informatif'),
        ('alerte', 'Alerte'),
        ('confirmation', 'Confirmation'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    est_lue = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.type}"