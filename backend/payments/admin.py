from django.contrib import admin

from .models import Payment, PharmacyPaymentMethod


@admin.register(PharmacyPaymentMethod)
class PharmacyPaymentMethodAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'pharmacy',
        'beneficiary_name',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
        'is_active',
        'created_at',
        'updated_at',
    )
    list_filter = ('is_active', 'created_at')
    search_fields = (
        'pharmacy__nom',
        'beneficiary_name',
        'bankily_number',
        'masrivi_number',
        'click_number',
        'sedad_number',
        'bci_pay_number',
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reservation',
        'pharmacy',
        'user',
        'method',
        'amount',
        'status',
        'transaction_id',
        'verified_by',
        'verified_at',
        'created_at',
    )
    list_filter = ('status', 'method', 'created_at', 'verified_at')
    search_fields = (
        'transaction_id',
        'client_phone',
        'user__phone_number',
        'user__email',
        'pharmacy__nom',
    )
    readonly_fields = ('created_at', 'updated_at', 'verified_at')