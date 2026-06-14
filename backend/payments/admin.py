from django.contrib import admin

from .models import Payment, PaymentMethod, PharmacyPaymentMethod


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'code', 'est_actif', 'date_creation')
    list_filter = ('est_actif',)
    search_fields = ('nom', 'code')


@admin.register(PharmacyPaymentMethod)
class PharmacyPaymentMethodAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'pharmacy',
        'beneficiary_name',
        'payment_instructions',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
        'is_active',
        'date_creation',
        'date_modification',
    )
    list_filter = ('is_active', 'date_creation')
    search_fields = (
        'pharmacy__nom',
        'beneficiary_name',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
    )
    readonly_fields = ('date_creation', 'date_modification')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'pharmacy',
        'user',
        'payment_method',
        'montant_total',
        'statut',
        'transaction_id',
        'valide_par',
        'date_validation',
        'date_creation',
    )
    list_filter = ('statut', 'payment_method', 'date_creation', 'date_validation')
    search_fields = (
        'transaction_id',
        'numero_client',
        'user__phone_number',
        'user__email',
        'pharmacy__nom',
    )
    readonly_fields = ('date_creation', 'date_validation')
