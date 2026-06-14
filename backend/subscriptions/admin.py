from django.contrib import admin

from .models import PharmacySubscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        'nom',
        'code',
        'prix_mensuel',
        'prix_annuel',
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
        'renouvellement_auto',
    )
    list_filter = ('plan', 'statut', 'date_debut')
    search_fields = ('pharmacy__nom', 'plan__nom', 'plan__code')
    readonly_fields = ('date_creation',)
    autocomplete_fields = ('pharmacy', 'plan', 'payment', 'transaction')
