from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.permissions import IsAuthenticatedWithTokenMessage
from .models import Horaire, Pharmacy
from .serializers import HoraireSerializer, PharmacySerializer


class PharmacyListCreateView(generics.ListCreateAPIView):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer

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
        serializer.save(user=user)

        return Response(
            {
                'message': 'Pharmacie creee avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class PharmacyDetailView(generics.RetrieveAPIView):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer
    permission_classes = [AllowAny]


class HoraireListCreateView(generics.ListCreateAPIView):
    queryset = Horaire.objects.all()
    serializer_class = HoraireSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]
