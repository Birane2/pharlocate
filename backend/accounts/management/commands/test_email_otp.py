from types import SimpleNamespace

from django.core.management.base import BaseCommand, CommandError

from accounts.services.email_service import OTPEmailDeliveryError, send_email_otp


class Command(BaseCommand):
    help = 'Envoie un e-mail OTP de test avec la configuration SMTP actuelle.'

    def add_arguments(self, parser):
        parser.add_argument('email', help='Adresse e-mail destinataire du test OTP.')
        parser.add_argument(
            '--code',
            default='123456',
            help='Code OTP de test a envoyer. Par defaut: 123456.',
        )
        parser.add_argument(
            '--purpose',
            choices=['verification', 'password_reset'],
            default='verification',
            help='Type d e-mail OTP a tester.',
        )

    def handle(self, *args, **options):
        email = options['email']
        user = SimpleNamespace(
            email=email,
            first_name='Test',
            get_full_name=lambda: 'Test PharmaLocate',
        )

        try:
            result = send_email_otp(
                user,
                options['code'],
                purpose=options['purpose'],
            )
        except OTPEmailDeliveryError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"OTP de test envoye vers {result['email']} via {result['backend']}."
            )
        )
