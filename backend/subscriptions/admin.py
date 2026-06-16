from django.contrib import admin

from .models import (
    PharmacySubscription,
    PlatformPaymentMethod,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionRefund,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        'nom',
        'code',
        'prix_mensuel',
        'prix_annuel',
        'commission_rate',
        'duration_days',
        'est_actif',
    )
    list_filter = ('est_actif', 'badge_premium', 'statistiques_avancees')
    search_fields = ('nom', 'code', 'description')
    readonly_fields = ('date_creation',)


@admin.register(PharmacySubscription)
class PharmacySubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'pharmacy',
        'plan',
        'statut',
        'date_debut',
        'date_fin',
        'is_current',
        'cancelled_at',
        'cancel_effective_at',
    )
    list_filter = ('plan', 'statut', 'is_current', 'date_debut')
    search_fields = ('pharmacy__nom', 'plan__nom', 'plan__code')
    readonly_fields = ('date_creation', 'cancelled_at', 'cancel_effective_at')
    autocomplete_fields = ('pharmacy', 'plan', 'payment', 'transaction')


@admin.register(PlatformPaymentMethod)
class PlatformPaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('display_beneficiary_name', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'pharmacy',
        'subscription',
        'amount',
        'payment_method',
        'status',
        'created_at',
    )
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('pharmacy__nom', 'transaction_id', 'subscription__plan__nom')
    readonly_fields = ('created_at', 'validated_at')
    autocomplete_fields = ('pharmacy', 'subscription', 'validated_by')


@admin.register(SubscriptionRefund)
class SubscriptionRefundAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'pharmacy',
        'subscription_payment',
        'amount',
        'status',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('pharmacy__nom', 'reason', 'admin_note')
    readonly_fields = ('created_at', 'processed_at')
    autocomplete_fields = (
        'subscription_payment',
        'pharmacy',
        'requested_by',
        'processed_by',
    )
