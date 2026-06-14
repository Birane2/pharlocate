from django.contrib import admin

from .models import Reservation, ReservationItem


class ReservationItemInline(admin.TabularInline):
    model = ReservationItem
    extra = 0
    readonly_fields = ('prix_unitaire', 'sous_total', 'created_at')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'pharmacie',
        'type_reservation',
        'statut',
        'montant_medicaments',
        'frais_livraison',
        'montant_total',
        'date_creation',
    )

    list_filter = (
        'statut',
        'type_reservation',
        'date_reservation',
    )

    search_fields = (
        'user__username',
        'user__phone_number',
        'pharmacie__nom',
    )

    readonly_fields = (
        'montant_medicaments',
        'frais_livraison',
        'montant_total',
        'date_creation',
        'date_modification',
    )

    inlines = [ReservationItemInline]


@admin.register(ReservationItem)
class ReservationItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'medicament',
        'quantite',
        'prix_unitaire',
        'sous_total',
        'created_at',
    )

    search_fields = (
        'medicament__nom',
        'reservation__pharmacie__nom',
    )

    readonly_fields = (
        'prix_unitaire',
        'sous_total',
        'created_at',
    )
