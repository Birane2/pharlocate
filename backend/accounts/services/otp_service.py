import logging
import random
from datetime import timedelta

from django.utils import timezone

from accounts.models import OTPCode
from accounts.services.email_service import OTPEmailDeliveryError, send_otp_email

OTP_EXPIRATION_MINUTES = 5
OTP_RATE_LIMIT_PER_HOUR = 5
OTP_MAX_VERIFY_ATTEMPTS = 3
logger = logging.getLogger(__name__)


class OTPRateLimitError(Exception):
    pass


class OTPDeliveryError(Exception):
    pass


class OTPVerificationError(Exception):
    pass


def generate_otp():
    return f'{random.randint(100000, 999999)}'


def ensure_otp_rate_limit(user):
    one_hour_ago = timezone.now() - timedelta(hours=1)
    otp_count = OTPCode.objects.filter(
        user=user,
        created_at__gte=one_hour_ago,
    ).count()

    if otp_count >= OTP_RATE_LIMIT_PER_HOUR:
        raise OTPRateLimitError('Limite OTP atteinte. Reessayez plus tard.')


def invalidate_previous_otps(user):
    OTPCode.objects.filter(
        user=user,
        is_used=False,
        expires_at__gt=timezone.now(),
    ).update(is_used=True)


def create_otp_for_user(user):
    ensure_otp_rate_limit(user)
    invalidate_previous_otps(user)
    otp = generate_otp()

    otp_code = OTPCode.objects.create(
        user=user,
        phone_number=user.phone_number or '',
        code=otp,
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRATION_MINUTES),
    )
    logger.info('OTP cree pour %s', user.email)
    return otp_code


def send_otp(user):
    otp_code = create_otp_for_user(user)
    logger.info('Envoi OTP e-mail lance vers %s', user.email)

    try:
        send_otp_email(user, otp_code.code)
    except OTPEmailDeliveryError as exc:
        logger.exception('Echec envoi OTP e-mail vers %s', user.email)
        raise OTPDeliveryError(str(exc)) from exc

    logger.info('OTP envoye avec succes vers %s', user.email)
    return otp_code


def verify_otp(email, otp):
    active_otps = OTPCode.objects.filter(
        user__email__iexact=email,
        is_used=False,
    ).select_related('user')

    otp_code = active_otps.filter(code=otp).order_by('-created_at').first()
    code_matches = otp_code is not None

    if not otp_code:
        otp_code = active_otps.order_by('-created_at').first()

    if not otp_code:
        raise OTPVerificationError(
            'Aucun code OTP actif ne correspond a cette adresse e-mail.'
        )

    user = otp_code.user

    if otp_code.is_expired:
        otp_code.is_used = True
        otp_code.save(update_fields=['is_used'])
        raise OTPVerificationError(
            'Votre code a expire. Veuillez demander un nouveau code.'
        )

    if otp_code.attempt_count >= OTP_MAX_VERIFY_ATTEMPTS:
        otp_code.is_used = True
        otp_code.save(update_fields=['is_used'])
        raise OTPVerificationError(
            'Nombre maximal de tentatives atteint. Demandez un nouveau code.'
        )

    if not code_matches:
        otp_code.attempt_count += 1
        update_fields = ['attempt_count']
        if otp_code.attempt_count >= OTP_MAX_VERIFY_ATTEMPTS:
            otp_code.is_used = True
            update_fields.append('is_used')
        otp_code.save(update_fields=update_fields)
        raise OTPVerificationError('Code OTP incorrect.')

    otp_code.is_used = True
    otp_code.save(update_fields=['is_used'])

    user.is_active = True
    user.is_email_verified = True
    user.is_phone_verified = True
    user.save(update_fields=['is_active', 'is_email_verified', 'is_phone_verified'])
    return user
