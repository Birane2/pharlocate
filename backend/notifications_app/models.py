from django.conf import settings
from django.db import models


class Notification(models.Model):
    # Legacy display type (kept for backward compat)
    TYPE_INFO = 'info'
    TYPE_ALERTE = 'alerte'
    TYPE_CONFIRMATION = 'confirmation'
    TYPE_CHOICES = [
        (TYPE_INFO, 'Informatif'),
        (TYPE_ALERTE, 'Alerte'),
        (TYPE_CONFIRMATION, 'Confirmation'),
    ]

    # Semantic domain type
    NTYPE_RESERVATION = 'reservation'
    NTYPE_PAYMENT = 'payment'
    NTYPE_DELIVERY = 'delivery'
    NTYPE_SUBSCRIPTION = 'subscription'
    NTYPE_COMMISSION = 'commission'
    NTYPE_SYSTEM = 'system'
    NTYPE_CHOICES = [
        (NTYPE_RESERVATION, 'Réservation'),
        (NTYPE_PAYMENT, 'Paiement'),
        (NTYPE_DELIVERY, 'Livraison'),
        (NTYPE_SUBSCRIPTION, 'Abonnement'),
        (NTYPE_COMMISSION, 'Commission'),
        (NTYPE_SYSTEM, 'Système'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200, blank=True, default='')
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_INFO)
    notification_type = models.CharField(
        max_length=30,
        choices=NTYPE_CHOICES,
        default=NTYPE_SYSTEM,
        db_index=True,
    )
    est_lue = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'{self.user.username} — {self.title or self.notification_type}'
