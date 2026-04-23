from django.contrib import admin
from .models import Medicament, Stock


@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ('nom', 'date_creation')
    search_fields = ('nom', 'description')


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('pharmacie', 'medicament', 'quantite', 'prix', 'date_mise_a_jour')
    list_filter = ('pharmacie',)
    search_fields = ('pharmacie__nom', 'medicament__nom')