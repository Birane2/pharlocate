from django.contrib import admin
from .models import Pharmacy, Horaire


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ('nom', 'user', 'telephone', 'est_valide', 'date_creation')
    list_filter = ('est_valide', 'date_creation')
    search_fields = ('nom', 'adresse', 'telephone', 'user__username')


@admin.register(Horaire)
class HoraireAdmin(admin.ModelAdmin):
    list_display = ('pharmacie', 'jour', 'heure_ouverture', 'heure_fermeture', 'est_garde')
    list_filter = ('jour', 'est_garde')
    search_fields = ('pharmacie__nom',)