from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'est_lue', 'date')
    list_filter = ('type', 'est_lue', 'date')
    search_fields = ('user__username', 'message')