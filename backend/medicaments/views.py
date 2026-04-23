from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Medicament, Stock
from .serializers import MedicamentSerializer, StockSerializer


class MedicamentListCreateView(generics.ListCreateAPIView):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent ajouter un médicament.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'message': 'Médicament ajouté avec succès.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class MedicamentDetailView(generics.RetrieveAPIView):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer
    permission_classes = [AllowAny]


class StockListCreateView(generics.ListCreateAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent gérer le stock.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'message': 'Stock ajouté avec succès.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )