from django.contrib import admin
from .models import Medicament, Stock


@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ('nom', 'date_creation')
    search_fields = ('nom', 'description')


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = (
        'pharmacie',
        'medicament',
        'quantite',
        'prix',
        'seuil_alerte',
        'date_modification',
    )
    list_filter = ('pharmacie',)
    search_fields = ('pharmacie__nom', 'medicament__nom')
