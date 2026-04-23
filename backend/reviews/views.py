from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.permissions import IsAuthenticatedWithTokenMessage
from .models import Avis
from .serializers import AvisSerializer


class AvisListCreateView(generics.ListCreateAPIView):
    queryset = Avis.objects.all()
    serializer_class = AvisSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
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
