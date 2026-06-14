from django.contrib import admin

from .models import Payment, PaymentMethod, PharmacyPaymentMethod


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'est_actif', 'date_creation')
    list_filter = ('est_actif', 'date_creation')
    search_fields = ('nom', 'code', 'numero_compte')
    readonly_fields = ('date_creation',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'user',
        'pharmacy',
        'payment_method',
        'montant_total',
        'statut',
        'reference_paiement',
        'valide_par',
        'date_creation',
        'date_validation',
    )
    list_filter = ('statut', 'payment_method', 'pharmacy', 'date_creation')
    search_fields = (
        'reference_paiement',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'user__phone_number',
        'pharmacy__nom',
    )
    readonly_fields = (
        'montant_medicaments',
        'frais_livraison',
        'montant_total',
        'date_creation',
        'date_paiement',
        'date_validation',
    )
    autocomplete_fields = ('reservation', 'user', 'pharmacy', 'payment_method', 'valide_par')


@admin.register(PharmacyPaymentMethod)
class PharmacyPaymentMethodAdmin(admin.ModelAdmin):
    list_display = (
        'pharmacy',
        'is_active',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
        'date_modification',
    )
    list_filter = ('is_active', 'date_modification')
    search_fields = (
        'pharmacy__nom',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
    )
    readonly_fields = ('date_creation', 'date_modification')
    autocomplete_fields = ('pharmacy',)
