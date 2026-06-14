from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('pharmacien', 'Pharmacien'),
        ('utilisateur', 'Utilisateur'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='utilisateur')
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        null=True,
        blank=True,
    )
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.phone_number or self.username} - {self.role}"


class OTPCode(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='otp_codes',
    )
    phone_number = models.CharField(max_length=20, db_index=True, blank=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code', 'is_used']),
            models.Index(fields=['created_at']),
        ]

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"OTP {self.user.phone_number or self.user.username}"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_otps',
    )
    email = models.EmailField(max_length=191, db_index=True)
    otp_code = models.CharField(max_length=6)
    reset_token = models.CharField(max_length=128, blank=True, db_index=True)
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_used']),
            models.Index(fields=['otp_code', 'is_used']),
            models.Index(fields=['reset_token', 'is_used']),
            models.Index(fields=['created_at']),
        ]

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Password reset OTP {self.email}"
