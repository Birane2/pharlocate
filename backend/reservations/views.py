from django.core.exceptions import ValidationError

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
