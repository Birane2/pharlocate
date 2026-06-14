from django.core.exceptions import ValidationError

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reservations.models import Reservation

from .models import Delivery
from .serializers import DeliverySerializer, DeliveryStatusUpdateSerializer
from .services import create_delivery_for_reservation, change_delivery_status


def is_pharmacy_owner(user, pharmacy):
    return getattr(pharmacy, 'user_id', None) == user.id


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
