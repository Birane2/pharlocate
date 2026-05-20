from django.db.models import F, Q
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAuthenticatedWithTokenMessage, IsPharmacien

from .models import Medicament, Stock
from .serializers import (
    AddMedicamentToStockSerializer,
    MedicamentSerializer,
    PublicPharmacyStockSerializer,
    StockSerializer,
)


class PharmacienStockPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 24


class MedicamentListCreateView(generics.ListCreateAPIView):
    queryset = Medicament.objects.all().order_by('nom')
    serializer_class = MedicamentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent ajouter un medicament.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'message': 'Medicament ajoute avec succes.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class MedicamentDetailView(generics.RetrieveAPIView):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer
    permission_classes = [AllowAny]


class StockListCreateView(generics.ListCreateAPIView):
    queryset = Stock.objects.select_related('pharmacie', 'medicament').all()
    serializer_class = StockSerializer

    def get_queryset(self):
        queryset = Stock.objects.select_related('pharmacie', 'medicament').all()
        user = self.request.user
        pharmacie_id = self.request.query_params.get('pharmacie_id')

        if pharmacie_id:
            return queryset.filter(
                pharmacie_id=pharmacie_id,
                pharmacie__est_valide=True,
                pharmacie__statut_validation='validee',
            ).order_by('-date_modification')

        if user.is_authenticated and getattr(user, 'role', None) == 'pharmacien':
            return queryset.filter(pharmacie__user=user)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET' and self.request.query_params.get('pharmacie_id'):
            return PublicPharmacyStockSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent gerer le stock.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        pharmacy = None
        if request.user.role == 'pharmacien':
            try:
                pharmacy = request.user.pharmacy
            except Exception:
                return Response(
                    {
                        'has_pharmacy': False,
                        'message': (
                            'Vous devez d abord creer votre pharmacie avant '
                            'd ajouter un stock.'
                        ),
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = self.get_serializer(
            data=request.data,
            context={'request': request, 'pharmacy': pharmacy},
        )
        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            {
                'message': 'Stock ajoute avec succes.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class StockDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Stock.objects.select_related('pharmacie', 'medicament').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_object(self):
        stock = super().get_object()
        user = self.request.user

        if user.role == 'admin':
            return stock

        if user.role == 'pharmacien' and stock.pharmacie.user_id == user.id:
            return stock

        raise PermissionDenied(
            'Vous ne pouvez modifier ou supprimer que les stocks de votre pharmacie.'
        )

    def update(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent modifier le stock.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent supprimer le stock.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        self.get_object().delete()
        return Response(
            {'message': 'Stock supprime avec succes.'},
            status=status.HTTP_200_OK,
        )


class PharmacienStockListView(generics.ListAPIView):
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]
    pagination_class = PharmacienStockPagination

    def get_queryset(self):
        try:
            pharmacy = self.request.user.pharmacy
        except Exception:
            return Stock.objects.none()

        queryset = (
            Stock.objects.select_related('pharmacie', 'medicament')
            .filter(pharmacie=pharmacy)
            .order_by('-date_modification', '-date_creation')
        )

        search = self.request.query_params.get('search', '').strip()
        status_value = self.request.query_params.get('status', '').strip().lower()

        if search:
            queryset = queryset.filter(
                Q(medicament__nom__icontains=search)
                | Q(medicament__description__icontains=search)
                | Q(medicament__categorie__icontains=search)
            )

        if status_value == 'rupture':
            queryset = queryset.filter(quantite=0)
        elif status_value == 'faible':
            queryset = queryset.filter(quantite__gt=0, quantite__lt=F('seuil_alerte'))
        elif status_value == 'disponible':
            queryset = queryset.filter(quantite__gte=F('seuil_alerte'))

        return queryset


class PharmacienStockDetailView(StockDetailView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]


class AddMedicamentToStockView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_pharmacy(self, request):
        try:
            return request.user.pharmacy
        except Exception:
            return None

    def post(self, request):
        pharmacy = self.get_pharmacy(request)
        if not pharmacy:
            return Response(
                {
                    'has_pharmacy': False,
                    'message': (
                        'Vous devez d abord creer votre pharmacie avant '
                        'd ajouter un stock.'
                    ),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AddMedicamentToStockSerializer(
            data=request.data,
            context={'request': request, 'pharmacy': pharmacy},
        )
        serializer.is_valid(raise_exception=True)
        stock = serializer.save()

        return Response(
            {
                'message': 'Medicament ajoute au stock avec succes.',
                'data': StockSerializer(stock).data,
            },
            status=status.HTTP_201_CREATED,
        )
