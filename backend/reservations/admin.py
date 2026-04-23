from django.contrib import admin
from .models import Reservation, ReservationItem


class ReservationItemInline(admin.TabularInline):
    model = ReservationItem
    extra = 1


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'pharmacie', 'statut', 'date_reservation')
    list_filter = ('statut', 'date_reservation', 'pharmacie')
    search_fields = ('user__username', 'pharmacie__nom')
    inlines = [ReservationItemInline]


@admin.register(ReservationItem)
class ReservationItemAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'medicament', 'quantite')
    search_fields = ('reservation__id', 'medicament__nom')