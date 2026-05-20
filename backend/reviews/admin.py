from django.contrib import admin
from .models import Avis


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('pharmacie', 'user', 'note', 'date')
    list_filter = ('note', 'date')
    search_fields = ('pharmacie__nom', 'user__username', 'commentaire')