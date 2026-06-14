from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Reservation
from .serializers import ReservationSerializer


class ReservationListCreateView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Reservation.objects.all().order_by('-date_creation')

        if user.role == 'pharmacien':
            return Reservation.objects.filter(
                pharmacie__pharmacien=user
            ).order_by('-date_creation')

        return Reservation.objects.filter(
            user=user
        ).order_by('-date_creation')


class ReservationDetailView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Reservation.objects.all()

        if user.role == 'pharmacien':
            return Reservation.objects.filter(
                pharmacie__pharmacien=user
            )

        return Reservation.objects.filter(user=user)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancel_reservation(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return Response({
            'error': 'Réservation introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if reservation.user != request.user:
        return Response({
            'error': "Vous ne pouvez annuler que vos propres réservations."
        }, status=status.HTTP_403_FORBIDDEN)

    if reservation.statut != 'en_attente':
        return Response({
            'error': "Cette réservation ne peut plus être annulée."
        }, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(reservation, 'payment'):
        payment = reservation.payment

        if payment.status != 'en_attente_verification':
            return Response({
                'error': "Le paiement est déjà validé ou traité. Vous ne pouvez plus annuler directement."
            }, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'annule'
        payment.save()

    if hasattr(reservation, 'delivery'):
        delivery = reservation.delivery
        delivery.status = 'annulee'
        delivery.save()

    reservation.statut = 'annulee'
    reservation.save()

    serializer = ReservationSerializer(reservation, context={'request': request})

    return Response({
        'message': 'Réservation annulée avec succès.',
        'data': serializer.data
    }, status=status.HTTP_200_OK)