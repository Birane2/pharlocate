import logging
import smtplib

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class OTPEmailDeliveryError(Exception):
    pass


def debug_print_email_otp(email, otp_code, label='OTP'):
    if not getattr(settings, 'OTP_DEBUG_PRINT', False):
        return

    logger.info('OTP EMAIL DEBUG PharmaLocate pour %s: %s', email, otp_code)
    sep = '=' * 55
    print(sep)
    print(f'  [PHARMALOCATE] {label} POUR : {email}')
    print(f'  CODE : {otp_code}')
    print(sep)


def _is_smtp_backend():
    return 'smtp' in getattr(settings, 'EMAIL_BACKEND', '').lower()


def _is_placeholder_password(password):
    placeholders = getattr(settings, '_EMAIL_PASSWORD_PLACEHOLDERS', set())
    return not password or password in placeholders


def validate_email_settings():
    env_file = getattr(settings, 'ENV_FILE', 'backend/.env')

    if not getattr(settings, 'DEFAULT_FROM_EMAIL', ''):
        raise OTPEmailDeliveryError(
            f'DEFAULT_FROM_EMAIL est manquant dans le fichier {env_file}.'
        )

    if not _is_smtp_backend():
        return

    if not getattr(settings, 'EMAIL_HOST_USER', ''):
        raise OTPEmailDeliveryError(
            f'EMAIL_HOST_USER est manquant dans le fichier {env_file}. '
            "Copiez .env.example vers .env puis ajoutez l'adresse Gmail SMTP."
        )

    if _is_placeholder_password(getattr(settings, 'EMAIL_HOST_PASSWORD', '')):
        raise OTPEmailDeliveryError(
            f'EMAIL_HOST_PASSWORD est manquant ou contient encore un placeholder dans {env_file}. '
            'Utilisez un mot de passe d application Gmail, pas le mot de passe normal.'
        )


def build_otp_email_context(user, otp_code, title, intro, expiration_minutes):
    full_name = user.get_full_name() if user else ''
    return {
        'title': title,
        'intro': intro,
        'otp_code': otp_code,
        'expiration_minutes': expiration_minutes,
        'first_name': getattr(user, 'first_name', '') or '',
        'full_name': full_name,
        'support_email': getattr(settings, 'EMAIL_HOST_USER', ''),
    }


def build_otp_email_text(context):
    greeting_name = context.get('first_name') or context.get('full_name')
    greeting = f'Bonjour {greeting_name},' if greeting_name else 'Bonjour,'
    return (
        f'{greeting}\n\n'
        f"{context['intro']}\n\n"
        'Votre code PharmaLocate est :\n\n'
        f"  {context['otp_code']}\n\n"
        f"Ce code expire dans {context['expiration_minutes']} minutes.\n\n"
        "Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.\n\n"
        "-- L'equipe PharmaLocate"
    )


def build_otp_email_html(context):
    try:
        return render_to_string('emails/otp_email.html', context)
    except Exception:
        logger.exception('Template HTML OTP indisponible. Fallback HTML inline utilise.')
        return f"""
        <div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:24px;color:#1C2B4A">
          <div style="max-width:560px;margin:auto;background:#FFFFFF;border-radius:20px;padding:28px;border:1px solid #E5E7EB">
            <div style="font-size:22px;font-weight:800;color:#2F6E9E;margin-bottom:8px">PharmaLocate</div>
            <h1 style="font-size:24px;margin:0 0 12px">{context['title']}</h1>
            <p style="font-size:15px;line-height:1.6;color:#4B5563">{context['intro']}</p>
            <div style="margin:24px 0;padding:18px;border-radius:16px;background:#EAF4FB;text-align:center">
              <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#2F6E9E">{context['otp_code']}</div>
            </div>
            <p style="font-size:14px;color:#6B7280">Ce code expire dans {context['expiration_minutes']} minutes.</p>
            <p style="font-size:13px;color:#6B7280">Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.</p>
            <p style="margin-top:24px;font-size:14px;font-weight:700;color:#2FA6A3">L'equipe PharmaLocate</p>
          </div>
        </div>
        """


def send_email_otp(user, otp_code, *, purpose='verification'):
    if not getattr(user, 'email', ''):
        raise OTPEmailDeliveryError('Adresse e-mail introuvable pour ce compte.')

    validate_email_settings()

    if purpose == 'password_reset':
        subject = 'Reinitialisation de votre mot de passe PharmaLocate'
        title = 'Reinitialisation de votre mot de passe'
        intro = 'Vous avez demande la reinitialisation de votre mot de passe.'
        expiration_minutes = 10
        debug_label = 'OTP RESET MOT DE PASSE'
    else:
        subject = 'Code de verification PharmaLocate'
        title = 'Verification de votre compte'
        intro = 'Merci de verifier votre adresse e-mail pour activer votre compte.'
        expiration_minutes = 5
        debug_label = 'OTP VERIFICATION'

    context = build_otp_email_context(
        user,
        otp_code,
        title=title,
        intro=intro,
        expiration_minutes=expiration_minutes,
    )
    text_body = build_otp_email_text(context)
    html_body = build_otp_email_html(context)

    try:
        logger.info('Envoi OTP e-mail PharmaLocate vers %s', user.email)
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_body, 'text/html')
        sent_count = email.send(fail_silently=False)
        if sent_count != 1:
            raise OTPEmailDeliveryError("L'e-mail OTP n'a pas ete accepte par le serveur SMTP.")

        debug_print_email_otp(user.email, otp_code, label=debug_label)
        logger.info('OTP e-mail envoye avec succes vers %s', user.email)
        return {
            'sent': True,
            'email': user.email,
            'backend': settings.EMAIL_BACKEND,
        }
    except smtplib.SMTPAuthenticationError as exc:
        logger.exception('Authentification Gmail SMTP refusee pour %s', settings.EMAIL_HOST_USER)
        debug_print_email_otp(user.email, otp_code, label=f'{debug_label} (SMTP AUTH KO)')
        raise OTPEmailDeliveryError(
            'Authentification Gmail refusee. Verifiez le mot de passe d application.'
        ) from exc
    except PermissionError as exc:
        logger.exception('Connexion SMTP bloquee pendant l envoi OTP a %s: %s', user.email, exc)
        debug_print_email_otp(user.email, otp_code, label=f'{debug_label} (SMTP BLOQUE)')
        raise OTPEmailDeliveryError(
            'Connexion SMTP bloquee par Windows, le pare-feu, l antivirus ou le reseau.'
        ) from exc
    except (smtplib.SMTPException, OSError) as exc:
        logger.exception('Erreur SMTP pendant l envoi OTP a %s: %s', user.email, exc)
        debug_print_email_otp(user.email, otp_code, label=f'{debug_label} (SMTP KO)')
        raise OTPEmailDeliveryError(
            'Impossible d envoyer le code OTP par e-mail. Verifiez la configuration SMTP.'
        ) from exc
    except OTPEmailDeliveryError:
        raise
    except Exception as exc:
        logger.exception('Erreur inattendue pendant l envoi OTP a %s: %s', user.email, exc)
        debug_print_email_otp(user.email, otp_code, label=f'{debug_label} (EMAIL KO)')
        raise OTPEmailDeliveryError(
            'Impossible d envoyer le code OTP par e-mail.'
        ) from exc


def send_otp_email(user, otp_code):
    return send_email_otp(user, otp_code, purpose='verification')


def send_password_reset_email(user, otp_code):
    return send_email_otp(user, otp_code, purpose='password_reset')
