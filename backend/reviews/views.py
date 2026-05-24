from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.permissions import IsAuthenticatedWithTokenMessage
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
