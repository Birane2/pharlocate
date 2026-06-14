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
        'delivery_phone',
        'distance_km',
        'delivery_fee',
        'status',
        'created_at',
        'delivered_at',
    )

    list_filter = (
        'status',
        'created_at',
        'delivered_at',
    )

    search_fields = (
        'delivery_phone',
        'delivery_address',
        'pharmacy__nom',
        'user__username',
        'user__phone_number',
    )

    readonly_fields = (
        'distance_km',
        'delivery_fee',
        'created_at',
        'updated_at',
        'delivered_at',
    )