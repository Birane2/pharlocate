import logging

from django.core.exceptions import ValidationError

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications_app.models import Notification
from reservations.models import Reservation

from .models import Delivery
from .serializers import (
    DeliverySerializer,
    DeliveryStatusUpdateSerializer,
    PharmacistDeliverySerializer,
)
from .services import (
    calculate_distance_km,
    change_delivery_status,
    create_delivery_for_reservation,
    get_delivery_base_fee,
    get_delivery_price_per_km,
    round_money,
)


logger = logging.getLogger(__name__)


def is_pharmacy_owner(user, pharmacy):
    return getattr(pharmacy, 'user_id', None) == user.id


def is_pharmacist(user):
    return getattr(user, 'role', None) == 'pharmacien'


def get_pharmacist_delivery_queryset(user):
    return (
        Delivery.objects.select_related('reservation', 'pharmacy', 'user')
        .prefetch_related('reservation__items__medicament')
        .filter(pharmacy__user=user)
        .order_by('-date_creation')
    )


def get_pharmacist_delivery_or_response(user, pk):
    if not is_pharmacist(user):
        return None, Response(
            {'error': 'Acces reserve aux pharmaciens.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        delivery = get_pharmacist_delivery_queryset(user).get(pk=pk)
    except Delivery.DoesNotExist:
        return None, Response(
            {'error': 'Livraison introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return delivery, None


def update_pharmacist_delivery_status(request, pk, next_status, message):
    delivery, error_response = get_pharmacist_delivery_or_response(request.user, pk)
    if error_response is not None:
        return error_response

    logger.debug(
        'Pharmacist delivery status update',
        extra={
            'delivery_id': pk,
            'user_id': request.user.id,
            'current_status': delivery.statut,
            'next_status': next_status,
            'payment_status': delivery.reservation.statut_paiement,
            'reservation_status': delivery.reservation.statut,
        },
    )

    if delivery.reservation.statut in {
        Reservation.STATUS_CANCELLED,
        Reservation.STATUS_REJECTED,
    }:
        return Response(
            {
                'error': (
                    'Impossible de modifier une livraison dont la reservation '
                    'est annulee ou refusee.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if next_status == Delivery.STATUS_DELIVERED:
        if delivery.reservation.statut == Reservation.STATUS_DELIVERED:
            return Response(
                {'error': 'Cette livraison est deja marquee comme livree.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if delivery.reservation.statut_paiement != Reservation.PAYMENT_STATUS_VALIDATED:
            return Response(
                {
                    'error': (
                        'Impossible de marquer cette livraison comme livree car '
                        "le paiement n'est pas valide."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        delivery = change_delivery_status(
            delivery,
            next_status,
            changed_by=request.user,
            commentaire=message,
        )
    except ValidationError as exc:
        detail = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
        return Response({'error': detail}, status=status.HTTP_400_BAD_REQUEST)

    if delivery.statut == Delivery.STATUS_DELIVERED:
        delivery.reservation.statut = Reservation.STATUS_DELIVERED
        delivery.reservation.save(update_fields=['statut', 'date_modification'])
        Notification.objects.create(
            user=delivery.user,
            type='confirmation',
            message=(
                f'Votre commande #{delivery.reservation_id} a ete marquee '
                'comme livree.'
            ),
        )

    if delivery.statut == Delivery.STATUS_CANCELLED:
        delivery.reservation.statut = Reservation.STATUS_CANCELLED
        delivery.reservation.save(update_fields=['statut', 'date_modification'])

    return Response(
        {
            'message': message,
            'delivery_status': delivery.statut,
            'reservation_status': delivery.reservation.statut,
            'data': PharmacistDeliverySerializer(delivery).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_delivery(request):
    serializer = DeliverySerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    reservation = serializer.validated_data['reservation']

    try:
        reservation = Reservation.objects.select_related('pharmacie', 'user').get(
            id=reservation.id
        )
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if reservation.user_id != request.user.id:
        return Response(
            {'error': 'Vous ne pouvez creer une livraison que pour vos reservations.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if hasattr(reservation, 'delivery'):
        return Response(
            {'error': 'Une livraison existe deja pour cette reservation.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        delivery = create_delivery_for_reservation(
            reservation=reservation,
            adresse_livraison=serializer.validated_data['adresse_livraison'],
            telephone=serializer.validated_data['telephone'],
            latitude=serializer.validated_data['latitude'],
            longitude=serializer.validated_data['longitude'],
            note=serializer.validated_data.get('note', ''),
        )
    except ValidationError as exc:
        message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    response_serializer = DeliverySerializer(delivery)

    return Response(
        {
            'message': 'Livraison creee avec succes.',
            'data': response_serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_deliveries(request):
    deliveries = Delivery.objects.filter(user=request.user).order_by('-date_creation')
    serializer = DeliverySerializer(deliveries, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delivery_detail(request, pk):
    try:
        delivery = Delivery.objects.select_related('pharmacy', 'user').get(pk=pk)
    except Delivery.DoesNotExist:
        return Response(
            {'error': 'Livraison introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_owner = delivery.user_id == request.user.id
    is_pharmacist = is_pharmacy_owner(request.user, delivery.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_owner or is_pharmacist or is_admin):
        return Response(
            {"error": "Vous n'avez pas la permission de voir cette livraison."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = DeliverySerializer(delivery)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_deliveries(request):
    deliveries = Delivery.objects.filter(
        pharmacy__user=request.user
    ).order_by('-date_creation')

    serializer = DeliverySerializer(deliveries, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_delivery_list(request):
    if not is_pharmacist(request.user):
        return Response(
            {'error': 'Acces reserve aux pharmaciens.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = PharmacistDeliverySerializer(
        get_pharmacist_delivery_queryset(request.user),
        many=True,
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_delivery_detail(request, pk):
    delivery, error_response = get_pharmacist_delivery_or_response(request.user, pk)
    if error_response is not None:
        return error_response

    return Response(
        PharmacistDeliverySerializer(delivery).data,
        status=status.HTTP_200_OK,
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def pharmacist_delivery_in_progress(request, pk):
    return update_pharmacist_delivery_status(
        request,
        pk,
        Delivery.STATUS_IN_PROGRESS,
        'Livraison marquee en cours.',
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def pharmacist_delivery_delivered(request, pk):
    return update_pharmacist_delivery_status(
        request,
        pk,
        Delivery.STATUS_DELIVERED,
        'Livraison marquee comme livree.',
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def pharmacist_delivery_cancel(request, pk):
    return update_pharmacist_delivery_status(
        request,
        pk,
        Delivery.STATUS_CANCELLED,
        'Livraison annulee.',
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_delivery_status(request, pk):
    try:
        delivery = Delivery.objects.select_related('pharmacy', 'reservation').get(pk=pk)
    except Delivery.DoesNotExist:
        return Response(
            {'error': 'Livraison introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_pharmacist = is_pharmacy_owner(request.user, delivery.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_pharmacist or is_admin):
        return Response(
            {"error": "Vous n'avez pas la permission de modifier cette livraison."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = DeliveryStatusUpdateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        delivery = change_delivery_status(
            delivery,
            serializer.validated_data['statut'],
            changed_by=request.user,
            commentaire='Statut mis a jour depuis le dashboard.',
        )
    except ValidationError as exc:
        message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    if delivery.statut == Delivery.STATUS_DELIVERED:
        delivery.reservation.statut = Reservation.STATUS_DELIVERED
        delivery.reservation.save(update_fields=['statut', 'date_modification'])

    if delivery.statut == Delivery.STATUS_CANCELLED:
        if delivery.reservation.statut != Reservation.STATUS_DELIVERED:
            delivery.reservation.statut = Reservation.STATUS_CANCELLED
            delivery.reservation.save(update_fields=['statut', 'date_modification'])

    response_serializer = DeliverySerializer(delivery)

    return Response(
        {
            'message': 'Statut livraison mis a jour avec succes.',
            'data': response_serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_delivery_fee_view(request):
    from decimal import Decimal
    from pharmacies.models import Pharmacy

    pharmacy_id = request.data.get('pharmacy_id')
    latitude_client = request.data.get('latitude_client')
    longitude_client = request.data.get('longitude_client')

    if not pharmacy_id:
        return Response(
            {'error': 'pharmacy_id est requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if latitude_client is None or longitude_client is None:
        return Response(
            {'error': 'latitude_client et longitude_client sont requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        pharmacy = Pharmacy.objects.get(pk=pharmacy_id, statut_validation='validee')
    except Pharmacy.DoesNotExist:
        return Response(
            {'error': 'Pharmacie introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if pharmacy.latitude is None or pharmacy.longitude is None:
        return Response(
            {'error': "La pharmacie n'a pas configure sa position GPS."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tarif_par_km = get_delivery_price_per_km()
    distance_km = calculate_distance_km(
        pharmacy.latitude,
        pharmacy.longitude,
        Decimal(str(latitude_client)),
        Decimal(str(longitude_client)),
    )
    frais_livraison = round_money(
        get_delivery_base_fee() + (distance_km * tarif_par_km)
    )

    return Response(
        {
            'distance_km': float(distance_km),
            'tarif_km': float(tarif_par_km),
            'frais_livraison': float(frais_livraison),
        },
        status=status.HTTP_200_OK,
    )
