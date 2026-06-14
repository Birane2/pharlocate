from django.contrib import admin

from .models import Delivery, DeliveryFeeConfig


@admin.register(DeliveryFeeConfig)
class DeliveryFeeConfigAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'price_per_km',
        'minimum_fee',
        'is_active',
        'created_at',
    )
    list_filter = ('is_active',)
    search_fields = ('price_per_km',)


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'pharmacy',
        'user',
        'telephone',
        'distance_km',
        'frais_livraison',
        'statut',
        'date_creation',
        'date_livraison_reelle',
    )

    list_filter = (
        'statut',
        'date_creation',
        'date_livraison_reelle',
    )

    search_fields = (
        'telephone',
        'adresse_livraison',
        'pharmacy__nom',
        'user__username',
        'user__phone_number',
    )

    readonly_fields = (
        'distance_km',
        'frais_livraison',
        'date_creation',
        'date_livraison_reelle',
    )
