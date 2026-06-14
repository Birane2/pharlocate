from django.contrib import admin
from .models import Reservation, ReservationItem


class ReservationItemInline(admin.TabularInline):
    model = ReservationItem
    extra = 1


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'pharmacie',
        'statut',
        'mode_retrait',
        'statut_paiement',
        'montant_total',
        'date_reservation',
    )
    list_filter = (
        'statut',
        'mode_retrait',
        'statut_paiement',
        'date_reservation',
        'pharmacie',
    )
    search_fields = ('user__username', 'pharmacie__nom')
    readonly_fields = (
        'montant_medicaments',
        'frais_livraison',
        'montant_total',
    )
    inlines = [ReservationItemInline]


@admin.register(ReservationItem)
class ReservationItemAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'medicament', 'quantite')
    search_fields = ('reservation__id', 'medicament__nom')
