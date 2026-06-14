from django.contrib import admin

from .models import Delivery, DeliveryStatusHistory


class DeliveryStatusHistoryInline(admin.TabularInline):
    model = DeliveryStatusHistory
    extra = 0
    fields = (
        'ancien_statut',
        'nouveau_statut',
        'changed_by',
        'commentaire',
        'date_changement',
    )
    readonly_fields = ('date_changement',)


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'user',
        'pharmacy',
        'statut',
        'telephone',
        'distance_km',
        'tarif_par_km',
        'frais_livraison',
        'date_creation',
    )
    list_filter = ('statut', 'pharmacy', 'date_creation')
    search_fields = (
        'telephone',
        'adresse_livraison',
        'pharmacy__nom',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'user__phone_number',
    )
    readonly_fields = ('date_creation', 'date_livraison_reelle')
    autocomplete_fields = ('reservation', 'user', 'pharmacy')
    inlines = (DeliveryStatusHistoryInline,)


@admin.register(DeliveryStatusHistory)
class DeliveryStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'delivery',
        'ancien_statut',
        'nouveau_statut',
        'changed_by',
        'date_changement',
    )
    list_filter = ('nouveau_statut', 'date_changement')
    search_fields = (
        'delivery__telephone',
        'delivery__pharmacy__nom',
        'changed_by__username',
        'changed_by__email',
        'commentaire',
    )
    readonly_fields = ('date_changement',)
