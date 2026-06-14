from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reservations.models import Reservation
from reservations.services import calculate_reservation_amount

from .models import Delivery
from .serializers import DeliverySerializer, DeliveryStatusUpdateSerializer


def get_reservation_user(reservation):
    return getattr(reservation, 'user', None)


def get_reservation_pharmacy(reservation):
    return (
        getattr(reservation, 'pharmacie', None)
        or getattr(reservation, 'pharmacy', None)
    )


def is_pharmacy_owner(user, pharmacy):
    return getattr(pharmacy, 'pharmacien', None) == user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_delivery(request):
    serializer = DeliverySerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    reservation = serializer.validated_data.get('reservation')

    try:
        reservation = Reservation.objects.get(id=reservation.id)
    except Reservation.DoesNotExist:
        return Response({
            'error': 'Réservation introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    reservation_user = get_reservation_user(reservation)
    reservation_pharmacy = get_reservation_pharmacy(reservation)

    if reservation_user != request.user:
        return Response({
            'error': "Vous ne pouvez créer une livraison que pour vos propres réservations."
        }, status=status.HTTP_403_FORBIDDEN)

    if not reservation_pharmacy:
        return Response({
            'error': 'Aucune pharmacie associée à cette réservation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(reservation, 'delivery'):
        return Response({
            'error': 'Une livraison existe déjà pour cette réservation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    delivery = serializer.save(
        user=request.user,
        pharmacy=reservation_pharmacy,
        status='en_attente'
    )

    reservation.type_reservation = 'livraison'
    reservation.frais_livraison = delivery.delivery_fee
    reservation.save()

    calculate_reservation_amount(reservation)

    response_serializer = DeliverySerializer(delivery)

    return Response({
        'message': 'Livraison créée avec succès.',
        'data': response_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_deliveries(request):
    deliveries = Delivery.objects.filter(
        user=request.user
    ).order_by('-created_at')

    serializer = DeliverySerializer(deliveries, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delivery_detail(request, pk):
    try:
        delivery = Delivery.objects.get(pk=pk)
    except Delivery.DoesNotExist:
        return Response({
            'error': 'Livraison introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    is_owner = delivery.user == request.user
    is_pharmacist = is_pharmacy_owner(request.user, delivery.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_owner or is_pharmacist or is_admin):
        return Response({
            'error': "Vous n'avez pas la permission de voir cette livraison."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = DeliverySerializer(delivery)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_deliveries(request):
    deliveries = Delivery.objects.filter(
        pharmacy__pharmacien=request.user
    ).order_by('-created_at')

    serializer = DeliverySerializer(deliveries, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_delivery_status(request, pk):
    try:
        delivery = Delivery.objects.get(pk=pk)
    except Delivery.DoesNotExist:
        return Response({
            'error': 'Livraison introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    is_pharmacist = is_pharmacy_owner(request.user, delivery.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_pharmacist or is_admin):
        return Response({
            'error': "Vous n'avez pas la permission de modifier cette livraison."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = DeliveryStatusUpdateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    delivery.status = serializer.validated_data['status']

    if delivery.status == 'livree':
        delivery.delivered_at = timezone.now()

        if delivery.reservation.statut != 'livree':
            delivery.reservation.statut = 'livree'
            delivery.reservation.save()

    if delivery.status == 'annulee':
        if delivery.reservation.statut not in ['livree', 'annulee']:
            delivery.reservation.statut = 'annulee'
            delivery.reservation.save()

    delivery.save()

    response_serializer = DeliverySerializer(delivery)

    return Response({
        'message': 'Statut livraison mis à jour avec succès.',
        'data': response_serializer.data
    }, status=status.HTTP_200_OK)