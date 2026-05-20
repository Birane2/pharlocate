from django.db import transaction
from django.db.models import Q
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from config.permissions import IsAuthenticatedWithTokenMessage, IsPharmacien
from medicaments.models import Stock
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


class PharmacienReservationPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class PharmacienReservationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]
    pagination_class = PharmacienReservationPagination

    def get_queryset(self):
        queryset = (
            Reservation.objects.filter(pharmacie__user=self.request.user)
            .select_related('user', 'pharmacie')
            .prefetch_related('items__medicament')
            .order_by('-date_reservation')
        )
        statut = self.request.query_params.get('statut')
        search = self.request.query_params.get('search')

        if statut:
            queryset = queryset.filter(statut=statut)

        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__email__icontains=search)
                | Q(items__medicament__nom__icontains=search)
            ).distinct()

        return queryset

    def _notify(self, reservation, message):
        Notification.objects.create(
            user=reservation.user,
            message=message,
            type='info',
        )

    def _serialize(self, reservation):
        return Response(self.get_serializer(reservation).data)

    @transaction.atomic
    def _confirm_reservation(self, reservation):
        if reservation.statut != 'en_attente':
            return Response(
                {'error': 'Seule une reservation en attente peut etre confirmee.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in reservation.items.select_related('medicament'):
            try:
                stock = Stock.objects.select_for_update().get(
                    pharmacie=reservation.pharmacie,
                    medicament=item.medicament,
                )
            except Stock.DoesNotExist:
                return Response(
                    {'error': f"Stock introuvable pour {item.medicament.nom}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if stock.quantite < item.quantite:
                return Response(
                    {
                        'error': (
                            f"Stock insuffisant pour {item.medicament.nom}. "
                            f"Disponible: {stock.quantite}, demande: {item.quantite}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for item in reservation.items.select_related('medicament'):
            stock = Stock.objects.select_for_update().get(
                pharmacie=reservation.pharmacie,
                medicament=item.medicament,
            )
            stock.quantite -= item.quantite
            stock.save(update_fields=['quantite', 'date_modification'])

        reservation.statut = 'confirmee'
        reservation.save(update_fields=['statut', 'date_modification'])
        self._notify(
            reservation,
            f"Votre reservation #{reservation.id} a ete confirmee.",
        )
        return self._serialize(reservation)

    @transaction.atomic
    def _cancel_reservation(self, reservation):
        if reservation.statut in ['annulee', 'recuperee']:
            return Response(
                {'error': 'Cette reservation ne peut plus etre modifiee.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.statut in ['confirmee', 'prete']:
            for item in reservation.items.select_related('medicament'):
                stock, _ = Stock.objects.select_for_update().get_or_create(
                    pharmacie=reservation.pharmacie,
                    medicament=item.medicament,
                    defaults={'quantite': 0, 'prix': item.prix_unitaire or 0},
                )
                stock.quantite += item.quantite
                stock.save(update_fields=['quantite', 'date_modification'])

        reservation.statut = 'annulee'
        reservation.save(update_fields=['statut', 'date_modification'])
        self._notify(
            reservation,
            f"Votre reservation #{reservation.id} a ete annulee.",
        )
        return self._serialize(reservation)

    @action(detail=True, methods=['patch'])
    def confirm(self, request, pk=None):
        return self._confirm_reservation(self.get_object())

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        return self._cancel_reservation(self.get_object())

    @action(detail=True, methods=['patch'])
    def ready(self, request, pk=None):
        reservation = self.get_object()

        if reservation.statut != 'confirmee':
            return Response(
                {'error': 'Seule une reservation confirmee peut devenir prete.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.statut = 'prete'
        reservation.save(update_fields=['statut', 'date_modification'])
        self._notify(reservation, f"Votre reservation #{reservation.id} est prete.")
        return self._serialize(reservation)

    @action(detail=True, methods=['patch'], url_path='picked-up')
    def picked_up(self, request, pk=None):
        reservation = self.get_object()

        if reservation.statut != 'prete':
            return Response(
                {'error': 'Seule une reservation prete peut etre recuperee.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.statut = 'recuperee'
        reservation.save(update_fields=['statut', 'date_modification'])
        self._notify(
            reservation,
            f"Votre reservation #{reservation.id} a ete recuperee.",
        )
        return self._serialize(reservation)
