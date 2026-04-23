from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from notifications_app.models import Notification
from .models import Reservation
from .serializers import ReservationSerializer


class ReservationListCreateView(generics.ListCreateAPIView):
    queryset = Reservation.objects.all().prefetch_related('items__medicament')
    serializer_class = ReservationSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'utilisateur':
            return Response(
                {'error': 'Seuls les utilisateurs peuvent creer une reservation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        reservation = serializer.instance
        Notification.objects.create(
            user=request.user,
            message=f"Votre reservation #{reservation.id} a ete creee avec succes.",
            type='confirmation'
        )

        return Response(
            {
                'message': 'Reservation creee avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class ReservationDetailView(generics.RetrieveAPIView):
    queryset = Reservation.objects.all().prefetch_related('items__medicament')
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny]
