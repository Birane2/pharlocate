import json

from django.core.exceptions import ValidationError
from django.db import transaction

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from deliveries.services import create_delivery_for_reservation
from payments.models import PaymentMethod, PharmacyPaymentMethod
from payments.serializers import PaymentSerializer
from payments.services import create_payment_for_reservation
from .models import Reservation
from .serializers import ReservationSerializer
from .services import cancel_reservation_by_user


class ReservationListCreateView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Reservation.objects.all().order_by('-date_reservation')

        if user.role == 'pharmacien':
            return Reservation.objects.filter(
                pharmacie__user=user
            ).order_by('-date_reservation')

        return Reservation.objects.filter(user=user).order_by('-date_reservation')


class ReservationDetailView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Reservation.objects.all()

        if user.role == 'pharmacien':
            return Reservation.objects.filter(pharmacie__user=user)

        return Reservation.objects.filter(user=user)


def _parse_json_field(value, field_name):
    if value in (None, ''):
        return None

    if isinstance(value, (list, dict)):
        return value

    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValidationError({field_name: 'Format JSON invalide.'}) from exc


def _get_payment_method_for_checkout(pharmacy, payment_method_id):
    if not payment_method_id:
        raise ValidationError({'payment_method': 'Choisissez une methode de paiement.'})

    try:
        payment_method = PaymentMethod.objects.get(
            id=payment_method_id,
            est_actif=True,
        )
    except (PaymentMethod.DoesNotExist, ValueError):
        raise ValidationError({'payment_method': 'Methode de paiement invalide.'})

    if payment_method.code in PaymentMethod.MANUAL_MOBILE_CODES:
        config = PharmacyPaymentMethod.objects.filter(
            pharmacy=pharmacy,
            is_active=True,
        ).first()

        if not config or not (config.get_number_for_code(payment_method.code) or '').strip():
            raise ValidationError({
                'payment_method': (
                    'Cette methode de paiement n est pas configuree pour cette pharmacie.'
                )
            })

    return payment_method


def _get_checkout_file(request):
    return (
        request.FILES.get('capture_paiement')
        or request.FILES.get('payment_proof')
    )


def _get_checkout_reference(request):
    return (
        request.data.get('transaction_id')
        or request.data.get('reference_paiement')
        or ''
    )


def _get_checkout_client_phone(request):
    return (
        request.data.get('numero_client')
        or request.data.get('client_phone')
        or ''
    )


def _empty_to_none(value):
    if value == '':
        return None
    return value


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_reservation(request):
    try:
        items = _parse_json_field(request.data.get('items'), 'items')
        delivery_data = _parse_json_field(request.data.get('delivery'), 'delivery') or {}

        if not items:
            raise ValidationError({'items': 'Ajoutez au moins un medicament.'})

        reservation_payload = {
            'pharmacie': request.data.get('pharmacie'),
            'type_reservation': (
                request.data.get('mode_retrait')
                or request.data.get('type_reservation')
                or Reservation.TYPE_PICKUP
            ),
            'items_data': items,
        }

        with transaction.atomic():
            serializer = ReservationSerializer(
                data=reservation_payload,
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            reservation = serializer.save()

            if reservation.type_reservation == Reservation.TYPE_DELIVERY:
                address = (
                    delivery_data.get('adresse_livraison')
                    or request.data.get('adresse_livraison')
                    or ''
                )
                phone = (
                    delivery_data.get('telephone')
                    or request.data.get('telephone')
                    or _get_checkout_client_phone(request)
                )

                if not address.strip():
                    raise ValidationError({
                        'adresse_livraison': "L'adresse de livraison est obligatoire."
                    })

                if not phone.strip():
                    raise ValidationError({
                        'telephone': 'Le telephone de livraison est obligatoire.'
                    })

                create_delivery_for_reservation(
                    reservation=reservation,
                    adresse_livraison=address.strip(),
                    telephone=phone.strip(),
                    latitude=_empty_to_none(
                        delivery_data.get('latitude') or request.data.get('latitude')
                    ),
                    longitude=_empty_to_none(
                        delivery_data.get('longitude') or request.data.get('longitude')
                    ),
                    note=delivery_data.get('note') or request.data.get('note') or '',
                )
            else:
                reservation.frais_livraison = 0
                reservation.calculate_amounts(save=True)

            payment_method = _get_payment_method_for_checkout(
                reservation.pharmacie,
                request.data.get('payment_method'),
            )
            payment = create_payment_for_reservation(
                reservation=reservation,
                payment_method=payment_method,
                numero_client=_get_checkout_client_phone(request),
                transaction_id=_get_checkout_reference(request),
                capture_paiement=_get_checkout_file(request),
            )

        reservation_data = ReservationSerializer(
            reservation,
            context={'request': request},
        ).data
        payment_data = PaymentSerializer(
            payment,
            context={'request': request},
        ).data

        return Response(
            {
                'message': (
                    'Commande envoyee avec succes. Le paiement est en attente '
                    'de verification.'
                ),
                'reservation': reservation_data,
                'payment': payment_data,
            },
            status=status.HTTP_201_CREATED,
        )
    except ValidationError as exc:
        detail = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
        return Response({'error': detail}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancel_reservation(request, pk):
    try:
        reservation = Reservation.objects.select_related(
            'user',
            'pharmacie',
            'pharmacie__user',
        ).get(pk=pk)
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        reservation = cancel_reservation_by_user(reservation, request.user)
    except ValidationError as exc:
        status_code = status.HTTP_400_BAD_REQUEST
        if reservation.user_id != request.user.id:
            status_code = status.HTTP_403_FORBIDDEN

        message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
        return Response({'error': message}, status=status_code)

    serializer = ReservationSerializer(reservation, context={'request': request})

    return Response(
        {
            'message': 'Reservation annulee avec succes.',
            'data': serializer.data,
        },
        status=status.HTTP_200_OK,
    )
