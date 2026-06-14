from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        'numero_facture',
        'user',
        'pharmacy',
        'montant_total',
        'statut',
        'date_emission',
    )
    list_filter = ('statut', 'pharmacy', 'date_emission')
    search_fields = (
        'numero_facture',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'user__phone_number',
        'pharmacy__nom',
    )
    readonly_fields = (
        'numero_facture',
        'payment',
        'transaction',
        'reservation',
        'user',
        'pharmacy',
        'montant_medicaments',
        'frais_livraison',
        'commission',
        'montant_total',
        'statut',
        'date_emission',
        'date_paiement',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if change:
            try:
                obj.save()
            except ValidationError as exc:
                raise exc
            return
        super().save_model(request, obj, form, change)
