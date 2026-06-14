import logging
import secrets
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone

from accounts.models import PasswordResetOTP, User
from accounts.services.email_service import (
    OTPEmailDeliveryError,
    send_password_reset_email,
)

PASSWORD_RESET_EXPIRATION_MINUTES = 10
PASSWORD_RESET_RATE_LIMIT_PER_HOUR = 5
PASSWORD_RESET_MAX_VERIFY_ATTEMPTS = 3

logger = logging.getLogger(__name__)


class PasswordResetRateLimitError(Exception):
    pass


class PasswordResetDeliveryError(Exception):
    pass


class PasswordResetVerificationError(Exception):
    pass


class PasswordResetConfirmError(Exception):
    pass


def generate_otp():
    return f'{secrets.randbelow(900000) + 100000}'


def generate_reset_token():
    return secrets.token_urlsafe(48)


def ensure_password_reset_rate_limit(user):
    one_hour_ago = timezone.now() - timedelta(hours=1)
    request_count = PasswordResetOTP.objects.filter(
        user=user,
        created_at__gte=one_hour_ago,
    ).count()

    if request_count >= PASSWORD_RESET_RATE_LIMIT_PER_HOUR:
        raise PasswordResetRateLimitError(
            'Trop de demandes de reinitialisation. Reessayez plus tard.'
        )


def invalidate_previous_password_reset_otps(user):
    PasswordResetOTP.objects.filter(
        user=user,
        is_used=False,
    ).update(is_used=True)


@transaction.atomic
def create_password_reset_otp(user):
    ensure_password_reset_rate_limit(user)
    invalidate_previous_password_reset_otps(user)

    otp_code = PasswordResetOTP.objects.create(
        user=user,
        email=user.email.lower(),
        otp_code=generate_otp(),
        expires_at=timezone.now() + timedelta(minutes=PASSWORD_RESET_EXPIRATION_MINUTES),
    )

    logger.info('Password reset OTP cree pour %s', user.email)
    return otp_code


def request_password_reset(email):
    user = User.objects.filter(email__iexact=email).first()

    if not user:
        return None

    otp_code = create_password_reset_otp(user)

    try:
        send_password_reset_email(user, otp_code.otp_code)
    except OTPEmailDeliveryError as exc:
        raise PasswordResetDeliveryError(str(exc)) from exc

    return otp_code


@transaction.atomic
def verify_password_reset_otp(email, otp):
    active_otps = PasswordResetOTP.objects.select_for_update().filter(
        email__iexact=email,
        is_used=False,
    ).select_related('user')

    reset_otp = active_otps.filter(otp_code=otp).order_by('-created_at').first()
    code_matches = reset_otp is not None

    if not reset_otp:
        reset_otp = active_otps.order_by('-created_at').first()

    if not reset_otp:
        raise PasswordResetVerificationError(
            'Aucun code actif ne correspond a cette adresse e-mail.'
        )

    if reset_otp.is_expired:
        reset_otp.is_used = True
        reset_otp.save(update_fields=['is_used'])
        raise PasswordResetVerificationError(
            'Votre code a expire. Veuillez demander un nouveau code.'
        )

    if reset_otp.attempt_count >= PASSWORD_RESET_MAX_VERIFY_ATTEMPTS:
        reset_otp.is_used = True
        reset_otp.save(update_fields=['is_used'])
        raise PasswordResetVerificationError(
            'Nombre maximal de tentatives atteint. Demandez un nouveau code.'
        )

    if not code_matches:
        reset_otp.attempt_count += 1
        update_fields = ['attempt_count']
        if reset_otp.attempt_count >= PASSWORD_RESET_MAX_VERIFY_ATTEMPTS:
            reset_otp.is_used = True
            update_fields.append('is_used')
        reset_otp.save(update_fields=update_fields)
        raise PasswordResetVerificationError('Code OTP incorrect.')

    reset_otp.reset_token = generate_reset_token()
    reset_otp.verified_at = timezone.now()
    reset_otp.save(update_fields=['reset_token', 'verified_at'])
    return reset_otp


@transaction.atomic
def confirm_password_reset(email, reset_token, new_password):
    reset_otp = PasswordResetOTP.objects.select_for_update().filter(
        email__iexact=email,
        reset_token=reset_token,
        is_used=False,
    ).select_related('user').order_by('-created_at').first()

    if not reset_otp:
        raise PasswordResetConfirmError('Token de reinitialisation invalide.')

    if reset_otp.is_expired:
        reset_otp.is_used = True
        reset_otp.save(update_fields=['is_used'])
        raise PasswordResetConfirmError(
            'Votre session de reinitialisation a expire.'
        )

    if not reset_otp.verified_at:
        raise PasswordResetConfirmError('Le code OTP doit etre verifie.')

    user = reset_otp.user
    validate_password(new_password, user=user)
    user.set_password(new_password)
    user.save(update_fields=['password'])

    reset_otp.is_used = True
    reset_otp.save(update_fields=['is_used'])

    PasswordResetOTP.objects.filter(
        user=user,
        is_used=False,
    ).exclude(id=reset_otp.id).update(is_used=True)

    return user
