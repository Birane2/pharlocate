import logging
import smtplib

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class OTPEmailDeliveryError(Exception):
    pass


def build_otp_email_message(otp_code, first_name=''):
    greeting = f'Bonjour {first_name},' if first_name else 'Bonjour,'
    return (
        f'{greeting}\n\n'
        'Votre code de verification PharmaLocate est :\n\n'
        f'  {otp_code}\n\n'
        'Ce code expire dans 5 minutes.\n\n'
        "Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.\n\n"
        '-- L\'equipe PharmaLocate'
    )


def debug_print_email_otp(email, otp_code, label='OTP'):
    if getattr(settings, 'OTP_DEBUG_PRINT', True):
        logger.info('OTP EMAIL DEBUG PharmaLocate pour %s: %s', email, otp_code)
        sep = '=' * 55
        print(sep)
        print(f'  [PHARMALOCATE] {label} POUR : {email}')
        print(f'  CODE : {otp_code}')
        print(sep)


def _is_smtp_backend():
    return 'smtp' in getattr(settings, 'EMAIL_BACKEND', '').lower()


def validate_email_settings():
    if not settings.DEFAULT_FROM_EMAIL:
        raise OTPEmailDeliveryError('DEFAULT_FROM_EMAIL est manquant dans le fichier .env.')

    # SMTP-specific checks: skip when console/dummy backend is used
    if _is_smtp_backend():
        if not settings.EMAIL_HOST_USER:
            raise OTPEmailDeliveryError('EMAIL_HOST_USER est manquant dans le fichier .env.')
        if not settings.EMAIL_HOST_PASSWORD:
            raise OTPEmailDeliveryError('EMAIL_HOST_PASSWORD est manquant dans le fichier .env.')
        if settings.EMAIL_HOST_PASSWORD == 'mot_de_passe_application_gmail':
            raise OTPEmailDeliveryError(
                'EMAIL_HOST_PASSWORD contient encore le placeholder. '
                'Utilisez un mot de passe d application Gmail.'
            )


def send_otp_email(user, otp_code):
    if not user.email:
        raise OTPEmailDeliveryError('Adresse e-mail introuvable pour ce compte.')

    validate_email_settings()

    subject = 'Code de verification PharmaLocate'
    message = build_otp_email_message(otp_code, first_name=user.first_name or '')

    try:
        print(f'Envoi OTP vers : {user.email}')
        print(f'Code OTP : {otp_code}')
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        print('Email OTP envoye')
        debug_print_email_otp(user.email, otp_code, label='OTP VERIFICATION')
        return True
    except smtplib.SMTPAuthenticationError as exc:
        logger.exception('Authentification Gmail SMTP refusee pour %s', settings.EMAIL_HOST_USER)
        debug_print_email_otp(user.email, otp_code, label='OTP VERIFICATION (SMTP KO)')
        raise OTPEmailDeliveryError(
            'Authentification Gmail refusee. Verifiez le mot de passe d application.'
        ) from exc
    except Exception as exc:
        logger.exception('Erreur envoi OTP e-mail a %s: %s', user.email, exc)
        debug_print_email_otp(user.email, otp_code, label='OTP VERIFICATION (EMAIL KO)')
        raise OTPEmailDeliveryError(
            'Impossible d envoyer le code OTP par e-mail.'
        ) from exc


def build_password_reset_email_message(otp_code, first_name=''):
    greeting = f'Bonjour {first_name},' if first_name else 'Bonjour,'
    return (
        f'{greeting}\n\n'
        'Vous avez demande la reinitialisation de votre mot de passe PharmaLocate.\n\n'
        'Votre code de reinitialisation est :\n\n'
        f'  {otp_code}\n\n'
        'Ce code expire dans 10 minutes.\n\n'
        "Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.\n\n"
        '-- L\'equipe PharmaLocate'
    )


def send_password_reset_email(user, otp_code):
    if not user.email:
        raise OTPEmailDeliveryError('Adresse e-mail introuvable pour ce compte.')

    validate_email_settings()

    subject = 'Reinitialisation de votre mot de passe PharmaLocate'
    message = build_password_reset_email_message(otp_code, first_name=user.first_name or '')

    try:
        print(f'Envoi OTP reset vers : {user.email}')
        print(f'Code OTP reset : {otp_code}')
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        print('Email OTP reset envoye')
        debug_print_email_otp(user.email, otp_code, label='OTP RESET MOT DE PASSE')
        return True
    except smtplib.SMTPAuthenticationError as exc:
        logger.exception('Authentification Gmail SMTP refusee pour %s', settings.EMAIL_HOST_USER)
        debug_print_email_otp(user.email, otp_code, label='OTP RESET MOT DE PASSE (SMTP KO)')
        raise OTPEmailDeliveryError(
            'Authentification Gmail refusee. Verifiez le mot de passe d application.'
        ) from exc
    except Exception as exc:
        logger.exception('Erreur envoi OTP reset password a %s: %s', user.email, exc)
        debug_print_email_otp(user.email, otp_code, label='OTP RESET MOT DE PASSE (EMAIL KO)')
        raise OTPEmailDeliveryError(
            'Impossible d envoyer le code OTP par e-mail.'
        ) from exc
