from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings

from accounts.models import User
from deliveries.models import Delivery
from deliveries.serializers import DeliverySerializer
from deliveries.services import (
    calculate_delivery_fee,
    create_delivery_for_reservation,
)
from medicaments.models import Medicament, Stock
from notifications_app.models import Notification
from payments.models import Payment, PaymentMethod, PharmacyPaymentMethod
from payments.services import (
    create_payment_for_reservation,
    validate_payment,
)
from pharmacies.models import Pharmacy
from rest_framework import status
from rest_framework.test import APIClient

from .models import Reservation, ReservationItem
from .services import cancel_reservation_by_user, confirm_reservation


class ManualPaymentDeliveryWorkflowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='client',
            email='client@example.com',
            password='secret123',
            phone_number='22112233',
            role='utilisateur',
        )
        self.pharmacist = User.objects.create_user(
            username='pharmacist',
            email='pharmacist@example.com',
            password='secret123',
            phone_number='44112233',
            role='pharmacien',
        )
        self.pharmacy = Pharmacy.objects.create(
            user=self.pharmacist,
            nom='Pharmacie Test',
            adresse='Nouakchott',
            telephone='45250000',
            latitude=Decimal('18.073500'),
            longitude=Decimal('-15.958200'),
            est_valide=True,
            statut_validation='validee',
        )
        self.medicament = Medicament.objects.create(nom='Paracetamol Test')
        self.stock = Stock.objects.create(
            pharmacie=self.pharmacy,
            medicament=self.medicament,
            quantite=10,
            prix=Decimal('100.00'),
        )
        self.payment_method, _ = PaymentMethod.objects.update_or_create(
            code=PaymentMethod.CODE_BANKILY,
            defaults={
                'nom': 'Bankily Test',
                'est_actif': True,
            },
        )
        PharmacyPaymentMethod.objects.create(
            pharmacy=self.pharmacy,
            bankily_number='22220000',
        )

    def create_reservation(self, reservation_type=Reservation.TYPE_PICKUP):
        reservation = Reservation.objects.create(
            user=self.user,
            pharmacie=self.pharmacy,
            type_reservation=reservation_type,
        )
        ReservationItem.objects.create(
            reservation=reservation,
            medicament=self.medicament,
            quantite=2,
            prix_unitaire=self.stock.prix,
        )
        reservation.calculate_amounts()
        return reservation

    def create_payment(self, reservation):
        return create_payment_for_reservation(
            reservation=reservation,
            payment_method=self.payment_method,
            numero_client='22112233',
            transaction_id='BANKILY-123',
            capture_paiement='payments/proofs/test-proof.jpg',
        )

    def test_manual_payment_requires_transaction_id_and_capture(self):
        reservation = self.create_reservation()

        with self.assertRaisesMessage(
            ValidationError,
            'Le transaction ID est obligatoire.',
        ):
            create_payment_for_reservation(
                reservation=reservation,
                payment_method=self.payment_method,
                numero_client='22112233',
                capture_paiement='payments/proofs/test-proof.jpg',
            )

        with self.assertRaisesMessage(
            ValidationError,
            'La capture de paiement est obligatoire.',
        ):
            create_payment_for_reservation(
                reservation=reservation,
                payment_method=self.payment_method,
                numero_client='22112233',
                transaction_id='BANKILY-123',
            )

    @override_settings(
        DELIVERY_BASE_FEE='0.00',
        DELIVERY_PRICE_PER_KM='10.00',
    )
    def test_delivery_fee_is_calculated_from_server_rate(self):
        reservation = self.create_reservation(Reservation.TYPE_DELIVERY)

        distance, rate, fee = calculate_delivery_fee(
            reservation,
            latitude=Decimal('18.123500'),
            longitude=Decimal('-15.958200'),
        )

        self.assertGreater(distance, Decimal('0.00'))
        self.assertEqual(rate, Decimal('10.00'))
        self.assertEqual(fee, (distance * rate).quantize(Decimal('0.01')))

    def test_delivery_rejects_missing_gps_without_fallback_fee(self):
        reservation = self.create_reservation(Reservation.TYPE_DELIVERY)

        with self.assertRaisesMessage(
            ValidationError,
            'La position GPS du client est obligatoire',
        ):
            calculate_delivery_fee(reservation)

    def test_delivery_serializer_never_exposes_coordinates(self):
        reservation = self.create_reservation(Reservation.TYPE_DELIVERY)
        delivery = create_delivery_for_reservation(
            reservation=reservation,
            adresse_livraison='Tevragh Zeina',
            telephone='22112233',
            latitude=Decimal('18.083500'),
            longitude=Decimal('-15.968200'),
        )

        data = DeliverySerializer(delivery).data

        self.assertNotIn('latitude', data)
        self.assertNotIn('longitude', data)
        self.assertIn('distance_km', data)

    def test_user_cancellation_updates_payment_delivery_and_notifications(self):
        reservation = self.create_reservation(Reservation.TYPE_DELIVERY)
        delivery = create_delivery_for_reservation(
            reservation=reservation,
            adresse_livraison='Arafat',
            telephone='22112233',
            latitude=Decimal('18.063500'),
            longitude=Decimal('-15.948200'),
        )
        payment = self.create_payment(reservation)

        cancel_reservation_by_user(reservation, self.user)

        reservation.refresh_from_db()
        payment.refresh_from_db()
        delivery.refresh_from_db()
        self.assertEqual(reservation.statut, Reservation.STATUS_CANCELLED)
        self.assertEqual(
            reservation.statut_paiement,
            Payment.STATUS_CANCELLED,
        )
        self.assertEqual(payment.statut, Payment.STATUS_CANCELLED)
        self.assertEqual(delivery.statut, Delivery.STATUS_CANCELLED)
        self.assertTrue(
            Notification.objects.filter(
                user=self.pharmacist,
                message__contains=f'#{reservation.id}',
            ).exists()
        )

    def test_validated_payment_blocks_direct_user_cancellation(self):
        reservation = self.create_reservation()
        payment = self.create_payment(reservation)
        payment.statut = Payment.STATUS_VALIDATED
        payment.save()

        with self.assertRaisesMessage(
            ValidationError,
            'Creez une demande de remboursement',
        ):
            cancel_reservation_by_user(reservation, self.user)

    def test_order_confirmation_requires_valid_payment_then_decrements_stock(self):
        reservation = self.create_reservation()
        payment = self.create_payment(reservation)

        with self.assertRaisesMessage(
            ValidationError,
            'Le paiement doit etre valide',
        ):
            confirm_reservation(reservation, self.pharmacist)

        validate_payment(payment, self.pharmacist)
        confirm_reservation(reservation, self.pharmacist)

        reservation.refresh_from_db()
        self.stock.refresh_from_db()
        self.assertEqual(reservation.statut, Reservation.STATUS_CONFIRMED)
        self.assertEqual(self.stock.quantite, 8)

    def test_user_cannot_read_another_users_reservation(self):
        other_user = User.objects.create_user(
            username='other-client',
            email='other-client@example.com',
            password='secret123',
            phone_number='99112233',
            role='utilisateur',
        )
        reservation = Reservation.objects.create(
            user=other_user,
            pharmacie=self.pharmacy,
            type_reservation=Reservation.TYPE_PICKUP,
        )
        client = APIClient()
        client.force_authenticate(user=self.user)

        detail_response = client.get(f'/api/reservations/{reservation.id}/')
        list_response = client.get('/api/reservations/')

        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertNotIn(
            reservation.id,
            [item['id'] for item in list_response.data['results']],
        )
