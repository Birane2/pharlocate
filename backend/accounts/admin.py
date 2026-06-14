from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import OTPCode, PasswordResetOTP, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('phone_number', 'username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('phone_number', 'username', 'email', 'first_name', 'last_name')
    readonly_fields = ('date_creation',)
    fieldsets = UserAdmin.fieldsets + (
        (
            'Informations supplementaires',
            {
                'fields': (
                    'phone_number',
                    'is_email_verified',
                    'is_phone_verified',
                    'role',
                    'date_creation',
                )
            },
        ),
    )


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'expires_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__phone_number', 'user__username', 'code')
    readonly_fields = ('created_at',)


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'email',
        'otp_code',
        'is_used',
        'attempt_count',
        'expires_at',
        'verified_at',
        'created_at',
    )
    list_filter = ('is_used', 'created_at', 'verified_at')
    search_fields = ('email', 'otp_code', 'user__phone_number', 'user__username')
    readonly_fields = ('created_at', 'verified_at')
