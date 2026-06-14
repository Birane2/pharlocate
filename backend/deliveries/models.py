from decimal import Decimal
from math import asin, cos, radians, sin, sqrt

from django.db import models
from django.utils import timezone


class DeliveryFeeConfig(models.Model):
    price_per_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('10.00')
    )
    minimum_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('50.00')
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Configuration frais livraison'
        verbose_name_plural = 'Configurations frais livraison'

    def __str__(self):
        return f"{self.price_per_km} MRU/km - minimum {self.minimum_fee} MRU"


class Delivery(models.Model):
    DELIVERY_STATUS_CHOICES = (
        ('en_attente', 'En attente'),
        ('en_preparation', 'En préparation'),
        ('en_cours', 'En cours'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
        ('echec', 'Échec livraison'),
    )

    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='delivery'
    )

    pharmacy = models.ForeignKey(
        'pharmacies.Pharmacy',
        on_delete=models.CASCADE,
        related_name='deliveries'
    )

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='deliveries'
    )

    delivery_address = models.TextField()
    delivery_phone = models.CharField(max_length=30)
    delivery_note = models.TextField(blank=True, null=True)

    client_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )
    client_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )

    distance_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )

    delivery_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )

    status = models.CharField(
        max_length=30,
        choices=DELIVERY_STATUS_CHOICES,
        default='en_attente'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'

    @staticmethod
    def calculate_distance_km(lat1, lon1, lat2, lon2):
        radius = 6371

        lat1 = radians(float(lat1))
        lon1 = radians(float(lon1))
        lat2 = radians(float(lat2))
        lon2 = radians(float(lon2))

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))

        return Decimal(str(round(radius * c, 2)))

    @classmethod
    def calculate_fee(cls, distance_km):
        config = DeliveryFeeConfig.objects.filter(is_active=True).first()

        if not config:
            return Decimal('0.00')

        fee = Decimal(distance_km) * config.price_per_km

        if fee < config.minimum_fee:
            return config.minimum_fee

        return fee.quantize(Decimal('0.01'))

    def save(self, *args, **kwargs):
        if self.pharmacy and self.client_latitude and self.client_longitude:
            self.distance_km = self.calculate_distance_km(
                self.pharmacy.latitude,
                self.pharmacy.longitude,
                self.client_latitude,
                self.client_longitude
            )
            self.delivery_fee = self.calculate_fee(self.distance_km)

        if self.status == 'livree' and self.delivered_at is None:
            self.delivered_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Livraison #{self.id} - {self.status}"