import math

from django.db.models import Avg, F, Q
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAuthenticatedWithTokenMessage, IsPharmacien
from medicaments.models import Stock
from reservations.models import Reservation
from reviews.models import Avis
from .models import Horaire, Pharmacy
from .serializers import (
    HoraireSerializer,
    NearbyPharmacySerializer,
    PharmacyDetailSerializer,
    PharmacyPhotoSerializer,
    PharmacyProfileSerializer,
    PharmacySerializer,
)


class PublicPharmacyPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 24


def parse_bool_query_param(value):
    if value is None:
        return None

    normalized = str(value).strip().lower()

    if normalized in {'true', '1', 'oui', 'yes'}:
        return True

    if normalized in {'false', '0', 'non', 'no'}:
        return False

    return None


def calculate_distance_in_meters(origin_lat, origin_lng, target_lat, target_lng):
    earth_radius_meters = 6371000

    lat_1 = math.radians(origin_lat)
    lng_1 = math.radians(origin_lng)
    lat_2 = math.radians(target_lat)
    lng_2 = math.radians(target_lng)

    delta_lat = lat_2 - lat_1
    delta_lng = lng_2 - lng_1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat_1) * math.cos(lat_2) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(earth_radius_meters * c, 1)


class PharmacyListCreateView(generics.ListCreateAPIView):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer
    pagination_class = PublicPharmacyPagination

    def get_queryset(self):
        queryset = (
            Pharmacy.objects.select_related('user')
            .prefetch_related('horaires')
            .order_by('-date_validation', '-date_creation')
        )

        if self.request.method == 'GET':
            queryset = queryset.filter(est_valide=True, statut_validation='validee')
            search = self.request.query_params.get('search', '').strip()
            est_garde = parse_bool_query_param(self.request.query_params.get('est_garde'))
            is_open = parse_bool_query_param(self.request.query_params.get('is_open'))

            if search:
                queryset = queryset.filter(
                    Q(nom__icontains=search)
                    | Q(adresse__icontains=search)
                    | Q(telephone__icontains=search)
                )

            if est_garde is True:
                now = timezone.localtime()
                queryset = queryset.filter(horaires__est_garde=True).filter(
                    Q(
                        horaires__date_debut_garde__isnull=True,
                        horaires__date_fin_garde__isnull=True,
                    )
                    | Q(
                        horaires__date_debut_garde__lte=now,
                        horaires__date_fin_garde__gte=now,
                    )
                )
            elif est_garde is False:
                queryset = queryset.exclude(horaires__est_garde=True)

            if is_open is not None:
                now = timezone.localtime()
                current_day = now.strftime('%A').lower()
                day_mapping = {
                    'monday': 'lundi',
                    'tuesday': 'mardi',
                    'wednesday': 'mercredi',
                    'thursday': 'jeudi',
                    'friday': 'vendredi',
                    'saturday': 'samedi',
                    'sunday': 'dimanche',
                }
                jour = day_mapping.get(current_day)

                if jour:
                    open_query = Q(
                        horaires__jour=jour,
                        horaires__est_ouvert=True,
                        horaires__heure_ouverture__lte=now.time(),
                        horaires__heure_fermeture__gte=now.time(),
                    )

                    queryset = queryset.filter(open_query) if is_open else queryset.exclude(open_query)
                elif is_open:
                    queryset = queryset.none()

            return queryset.distinct()

        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        user = request.user

        if user.role != 'pharmacien':
            return Response(
                {'error': 'Seul un pharmacien peut creer une pharmacie.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if Pharmacy.objects.filter(user=user).exists():
            return Response(
                {'error': 'Ce pharmacien possede deja une pharmacie.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            user=user,
            est_valide=False,
            statut_validation='en_attente',
            motif_refus='',
        )

        return Response(
            {
                'message': 'Pharmacie creee avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class PharmacyDetailView(generics.RetrieveAPIView):
    queryset = (
        Pharmacy.objects.filter(est_valide=True, statut_validation='validee')
        .select_related('user')
        .prefetch_related(
            'horaires',
            'avis__user',
            'stocks__medicament',
        )
    )
    serializer_class = PharmacyDetailSerializer
    permission_classes = [AllowAny]


class NearbyPharmacyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10000)

        if lat in {None, ''} or lng in {None, ''}:
            return Response(
                {'error': 'Les parametres lat et lng sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            origin_lat = float(lat)
            origin_lng = float(lng)
            radius_in_meters = max(float(radius), 0)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Les parametres lat, lng et radius doivent etre numeriques.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = (
            Pharmacy.objects.filter(
                est_valide=True,
                statut_validation='validee',
                latitude__isnull=False,
                longitude__isnull=False,
            )
            .order_by('-date_validation', '-date_creation')
        )

        nearby_pharmacies = []

        for pharmacy in queryset:
            target_lat = float(pharmacy.latitude)
            target_lng = float(pharmacy.longitude)
            distance = calculate_distance_in_meters(
                origin_lat,
                origin_lng,
                target_lat,
                target_lng,
            )

            if distance <= radius_in_meters:
                pharmacy.distance = distance
                nearby_pharmacies.append(pharmacy)

        nearby_pharmacies.sort(key=lambda pharmacy: pharmacy.distance)

        serializer = NearbyPharmacySerializer(
            nearby_pharmacies,
            many=True,
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class GuardPharmacyListView(generics.ListAPIView):
    serializer_class = PharmacySerializer
    permission_classes = [AllowAny]
    pagination_class = PublicPharmacyPagination

    def get_queryset(self):
        now = timezone.localtime()
        return (
            Pharmacy.objects.select_related('user')
            .prefetch_related('horaires')
            .filter(
                est_valide=True,
                statut_validation='validee',
                horaires__est_garde=True,
            )
            .filter(
                Q(
                    horaires__date_debut_garde__isnull=True,
                    horaires__date_fin_garde__isnull=True,
                )
                | Q(
                    horaires__date_debut_garde__lte=now,
                    horaires__date_fin_garde__gte=now,
                )
            )
            .order_by('-date_validation', '-date_creation')
            .distinct()
        )


class HorairePagination(PageNumberPagination):
    page_size = 3


class HoraireViewSet(viewsets.ModelViewSet):
    serializer_class = HoraireSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]
    pagination_class = HorairePagination

    def get_queryset(self):
        queryset = Horaire.objects.select_related('pharmacie').filter(
            pharmacie__user=self.request.user
        )
        jour = self.request.query_params.get('jour')
        est_garde = self.request.query_params.get('est_garde')

        if jour:
            queryset = queryset.filter(jour=jour)

        if est_garde is not None:
            if est_garde.lower() in ['true', '1', 'oui']:
                queryset = queryset.filter(est_garde=True)
            elif est_garde.lower() in ['false', '0', 'non']:
                queryset = queryset.filter(est_garde=False)

        return queryset.order_by('-date_creation')

    def perform_create(self, serializer):
        serializer.save(pharmacie=self.request.user.pharmacy)

    def perform_update(self, serializer):
        serializer.save(pharmacie=self.request.user.pharmacy)


class PharmacienPharmacyProfileView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_object(self):
        try:
            return self.request.user.pharmacy
        except Pharmacy.DoesNotExist:
            raise NotFound(
                {
                    'has_pharmacy': False,
                    'message': (
                        'Ce pharmacien ne possede pas encore de pharmacie associee. '
                        'Veuillez creer votre pharmacie pour acceder a toutes les fonctionnalites.'
                    ),
                }
            )

    def get(self, request):
        try:
            pharmacy = self.get_object()
        except NotFound as exc:
            return Response(exc.detail, status=status.HTTP_404_NOT_FOUND)

        serializer = PharmacyProfileSerializer(pharmacy, context={'request': request})
        return Response({
            'has_pharmacy': True,
            'message': 'Pharmacie associee trouvee.',
            'data': serializer.data,
        })

    def put(self, request):
        serializer = PharmacyProfileSerializer(
            self.get_object(),
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = PharmacyProfileSerializer(
            self.get_object(),
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PharmacienPharmacyPhotoView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        try:
            return self.request.user.pharmacy
        except Pharmacy.DoesNotExist:
            raise NotFound('Aucune pharmacie associee a ce compte.')

    def post(self, request):
        pharmacy = self.get_object()
        serializer = PharmacyPhotoSerializer(
            pharmacy,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            PharmacyProfileSerializer(pharmacy, context={'request': request}).data
        )


class PharmacienDashboardStatsView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_pharmacy(self):
        try:
            return self.request.user.pharmacy
        except Pharmacy.DoesNotExist:
            raise NotFound('Aucune pharmacie associee a ce compte.')

    def get(self, request):
        pharmacy = self.get_pharmacy()
        stocks = Stock.objects.select_related('medicament').filter(pharmacie=pharmacy)
        reservations = (
            Reservation.objects.select_related('user', 'pharmacie')
            .prefetch_related('items__medicament')
            .filter(pharmacie=pharmacy)
        )
        horaires = Horaire.objects.filter(pharmacie=pharmacy)
        avis = Avis.objects.filter(pharmacie=pharmacy)

        stocks_faibles = stocks.filter(quantite__lte=F('seuil_alerte'))
        stocks_rupture = stocks.filter(quantite=0)
        reservations_recentes = reservations.order_by('-date_reservation')[:5]

        return Response({
            'pharmacie': {
                'id': pharmacy.id,
                'nom': pharmacy.nom,
                'adresse': pharmacy.adresse,
                'telephone': pharmacy.telephone,
                'est_valide': pharmacy.est_valide,
            },
            'stocks': {
                'total': stocks.count(),
                'disponibles': stocks.filter(quantite__gt=0).count(),
                'rupture': stocks_rupture.count(),
                'faibles': stocks_faibles.count(),
                'ruptures_liste': [
                    {
                        'id_stock': stock.id,
                        'medicament_nom': stock.medicament.nom,
                        'quantite': stock.quantite,
                        'seuil_alerte': stock.seuil_alerte,
                    }
                    for stock in stocks_rupture.order_by('medicament__nom')[:5]
                ],
                'faibles_liste': [
                    {
                        'id_stock': stock.id,
                        'medicament_nom': stock.medicament.nom,
                        'quantite': stock.quantite,
                        'seuil_alerte': stock.seuil_alerte,
                    }
                    for stock in stocks_faibles.order_by('quantite', 'medicament__nom')[:5]
                ],
            },
            'reservations': {
                'total': reservations.count(),
                'en_attente': reservations.filter(statut='en_attente').count(),
                'confirmees': reservations.filter(statut='confirmee').count(),
                'annulees': reservations.filter(statut='annulee').count(),
                'recuperees': reservations.filter(statut='livree').count(),
                'recentes': [
                    {
                        'id': reservation.id,
                        'client': reservation.user.username,
                        'statut': reservation.statut,
                        'date_reservation': reservation.date_reservation,
                        'items': [
                            {
                                'medicament_nom': item.medicament.nom,
                                'quantite': item.quantite,
                            }
                            for item in reservation.items.all()
                        ],
                    }
                    for reservation in reservations_recentes
                ],
            },
            'horaires': {
                'total': horaires.count(),
                'jours_ouverts': horaires.filter(est_ouvert=True).count(),
                'jours_garde': horaires.filter(est_garde=True).count(),
            },
            'avis': {
                'note_moyenne': round(avis.aggregate(avg=Avg('note'))['avg'] or 0, 1),
                'total': avis.count(),
            },
        })
