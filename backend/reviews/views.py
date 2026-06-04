from rest_framework import generics, status
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Avg, Count
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAuthenticatedWithTokenMessage, IsPharmacien
from .models import Avis
from .serializers import AvisSerializer


class AvisListCreateView(generics.ListCreateAPIView):
    queryset = Avis.objects.select_related('user', 'pharmacie').all()
    serializer_class = AvisSerializer

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date')
        pharmacie_id = (
            self.request.query_params.get('pharmacie_id')
            or self.request.query_params.get('pharmacie')
        )

        if pharmacie_id:
            queryset = queryset.filter(pharmacie_id=pharmacie_id)

        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'utilisateur':
            return Response(
                {'error': 'Seuls les utilisateurs peuvent publier un avis.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(
            {
                'message': 'Avis ajoute avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class PharmacienAvisListView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        queryset = (
            Avis.objects.select_related('user', 'pharmacie')
            .filter(pharmacie__user=request.user)
            .order_by('-date')
        )
        try:
            pharmacy = request.user.pharmacy
        except ObjectDoesNotExist:
            pharmacy = None
        distribution_rows = queryset.values('note').annotate(total=Count('id'))
        distribution = {str(note): 0 for note in range(1, 6)}

        for row in distribution_rows:
            distribution[str(row['note'])] = row['total']

        serializer = AvisSerializer(queryset, many=True)
        return Response({
            'pharmacie': {
                'id': pharmacy.id,
                'nom': pharmacy.nom,
            } if pharmacy else None,
            'stats': {
                'note_moyenne': round(queryset.aggregate(avg=Avg('note'))['avg'] or 0, 1),
                'total': queryset.count(),
                'repartition': distribution,
            },
            'results': serializer.data,
        })
