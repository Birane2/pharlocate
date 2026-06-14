from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from pharmacies.models import Pharmacy
from reservations.models import Reservation
from reservations.services import calculate_reservation_amount

from .models import Payment, PharmacyPaymentMethod
from .serializers import PaymentSerializer, PharmacyPaymentMethodSerializer


def get_pharmacist_pharmacy(user):
    return Pharmacy.objects.filter(pharmacien=user).first()


def is_pharmacy_owner(user, pharmacy):
    return getattr(pharmacy, 'pharmacien', None) == user


@api_view(['GET'])
@permission_classes([AllowAny])
def public_pharmacy_payment_methods(request, pharmacy_id):
    try:
        payment_methods = PharmacyPaymentMethod.objects.get(
            pharmacy_id=pharmacy_id,
            is_active=True
        )
    except PharmacyPaymentMethod.DoesNotExist:
        return Response({
            'error': 'Aucune méthode de paiement configurée pour cette pharmacie.'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = PharmacyPaymentMethodSerializer(payment_methods)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def pharmacist_payment_methods(request):
    pharmacy = get_pharmacist_pharmacy(request.user)

    if not pharmacy:
        return Response({
            'error': 'Aucune pharmacie associée à ce pharmacien.'
        }, status=status.HTTP_404_NOT_FOUND)

    payment_methods, _ = PharmacyPaymentMethod.objects.get_or_create(
        pharmacy=pharmacy,
        defaults={
            'beneficiary_name': pharmacy.nom,
            'is_active': True,
        }
    )

    if request.method == 'GET':
        serializer = PharmacyPaymentMethodSerializer(payment_methods)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = PharmacyPaymentMethodSerializer(
        payment_methods,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save(pharmacy=pharmacy)

        return Response({
            'message': 'Méthodes de paiement mises à jour avec succès.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_payments(request):
    payments = Payment.objects.filter(
        user=request.user
    ).order_by('-created_at')

    serializer = PaymentSerializer(
        payments,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    try:
        payment = Payment.objects.get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    is_owner = payment.user == request.user
    is_pharmacist = is_pharmacy_owner(request.user, payment.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_owner or is_pharmacist or is_admin):
        return Response({
            'error': "Vous n'avez pas la permission de voir ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    serializer = PaymentSerializer(
        data=request.data,
        context={'request': request}
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    reservation = serializer.validated_data.get('reservation')

    try:
        reservation = Reservation.objects.get(id=reservation.id)
    except Reservation.DoesNotExist:
        return Response({
            'error': 'Réservation introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if reservation.user != request.user:
        return Response({
            'error': "Vous ne pouvez payer que vos propres réservations."
        }, status=status.HTTP_403_FORBIDDEN)

    if hasattr(reservation, 'payment'):
        return Response({
            'error': 'Un paiement existe déjà pour cette réservation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    amount = calculate_reservation_amount(reservation)

    payment = serializer.save(
        user=request.user,
        pharmacy=reservation.pharmacie,
        amount=amount,
        status='en_attente_verification'
    )

    response_serializer = PaymentSerializer(
        payment,
        context={'request': request}
    )

    return Response({
        'message': 'Paiement envoyé avec succès. Il est en attente de vérification.',
        'data': response_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_orders(request):
    payments = Payment.objects.filter(
        pharmacy__pharmacien=request.user
    ).select_related(
        'reservation',
        'pharmacy',
        'user'
    ).order_by('-created_at')

    serializer = PaymentSerializer(
        payments,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_order_detail(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy',
            'user'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de voir cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def validate_payment(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de valider ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.status != 'en_attente_verification':
        return Response({
            'error': 'Ce paiement ne peut plus être validé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    payment.validate_payment(request.user)

    return Response({
        'message': 'Paiement validé avec succès.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reject_payment(request, pk):
    reason = request.data.get('reason', '')

    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de refuser ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.status != 'en_attente_verification':
        return Response({
            'error': 'Ce paiement ne peut plus être refusé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    payment.reject_payment(request.user, reason)

    return Response({
        'message': 'Paiement refusé.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


def decrease_stock_for_reservation(reservation):
    if not hasattr(reservation, 'items'):
        return

    for item in reservation.items.all():
        stock = item.stock

        if stock.quantite < item.quantite:
            raise ValueError(
                f"Stock insuffisant pour {stock.medicament.nom}."
            )

        stock.quantite -= item.quantite
        stock.save()


def update_reservation_status(reservation, new_status):
    reservation.statut = new_status
    reservation.save()
    return reservation


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def confirm_order(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de confirmer cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.status != 'valide':
        return Response({
            'error': 'Le paiement doit être validé avant confirmation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    reservation = payment.reservation

    if reservation.statut != 'en_attente':
        return Response({
            'error': 'Cette commande ne peut plus être confirmée.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            decrease_stock_for_reservation(reservation)
            update_reservation_status(reservation, 'confirmee')
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Commande confirmée avec succès.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


def change_order_status(request, pk, current_allowed, new_status, message):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de modifier cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    reservation = payment.reservation

    if reservation.statut not in current_allowed:
        return Response({
            'error': 'Changement de statut non autorisé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    reservation.statut = new_status
    reservation.save()

    return Response({
        'message': message,
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def prepare_order(request, pk):
    return change_order_status(
        request,
        pk,
        current_allowed=['confirmee'],
        new_status='en_preparation',
        message='Commande passée en préparation.'
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def ready_order(request, pk):
    return change_order_status(
        request,
        pk,
        current_allowed=['en_preparation'],
        new_status='prete',
        message='Commande marquée comme prête.'
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def delivered_order(request, pk):
    response = change_order_status(
        request,
        pk,
        current_allowed=['prete', 'en_preparation'],
        new_status='livree',
        message='Commande marquée comme livrée.'
    )

    if response.status_code == 200:
        try:
            payment = Payment.objects.get(pk=pk)

            if hasattr(payment.reservation, 'delivery'):
                delivery = payment.reservation.delivery
                delivery.status = 'livree'
                delivery.delivered_at = timezone.now()
                delivery.save()
        except Payment.DoesNotExist:
            pass

    return response