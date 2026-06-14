from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'payment',
        'pharmacy',
        'user',
        'montant_brut',
        'commission',
        'montant_pharmacie',
        'type_transaction',
        'date_creation',
    )
    list_filter = ('type_transaction', 'pharmacy', 'date_creation')
    search_fields = (
        'reference_transaction',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'user__phone_number',
        'pharmacy__nom',
    )
    readonly_fields = (
        'payment',
        'reservation',
        'user',
        'pharmacy',
        'type_transaction',
        'montant_brut',
        'commission',
        'montant_pharmacie',
        'description',
        'reference_transaction',
        'created_by',
        'date_creation',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if change:
            raise ValidationError('Une transaction financiere est immutable apres creation.')
        super().save_model(request, obj, form, change)
