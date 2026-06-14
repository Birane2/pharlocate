from django.contrib import admin

from .models import Refund, RefundStatusHistory


class RefundStatusHistoryInline(admin.TabularInline):
    model = RefundStatusHistory
    extra = 0
    readonly_fields = ('date_changement',)


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'pharmacy',
        'montant_demande',
        'montant_approuve',
        'statut',
        'date_demande',
    )
    list_filter = ('statut', 'pharmacy', 'date_demande')
    search_fields = (
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'user__phone_number',
        'pharmacy__nom',
        'reservation__id',
        'payment__id',
    )
    readonly_fields = (
        'date_demande',
        'date_validation',
        'date_remboursement',
    )
    inlines = (RefundStatusHistoryInline,)


@admin.register(RefundStatusHistory)
class RefundStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'refund',
        'ancien_statut',
        'nouveau_statut',
        'changed_by',
        'date_changement',
    )
    list_filter = ('nouveau_statut', 'date_changement')
    search_fields = ('refund__id', 'changed_by__username', 'commentaire')
    readonly_fields = ('date_changement',)
