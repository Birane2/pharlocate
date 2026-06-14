from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)

from .models import Delivery
from .permissions import IsAdminOrDeliveryOwnerOrPharmacist, is_admin_user
from .serializers import (
    DeliveryCreateSerializer,
    DeliverySerializer,
    DeliveryStatusUpdateSerializer,
)
from .services import change_delivery_status


def format_django_validation_error(exc):
    if hasattr(exc, 'message_dict'):
        return exc.message_dict

    if hasattr(exc, 'messages'):
        return {'detail': exc.messages}

    return {'detail': str(exc)}


class DeliveryCreateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def post(self, request):
        serializer = DeliveryCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            delivery = serializer.save()
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': 'Livraison creee avec succes.',
                'delivery': DeliverySerializer(delivery).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyDeliveryListView(generics.ListAPIView):
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return (
            Delivery.objects.filter(user=self.request.user)
            .select_related('reservation', 'user', 'pharmacy')
            .prefetch_related('status_history__changed_by')
            .order_by('-date_creation')
        )


class DeliveryDetailView(generics.RetrieveAPIView):
    serializer_class = DeliverySerializer
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrDeliveryOwnerOrPharmacist,
    ]

    def get_queryset(self):
        return (
            Delivery.objects.select_related('reservation', 'user', 'pharmacy')
            .prefetch_related('status_history__changed_by')
            .order_by('-date_creation')
        )


class DeliveryStatusUpdateView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrDeliveryOwnerOrPharmacist,
    ]

    def patch(self, request, pk):
        delivery = get_object_or_404(
            Delivery.objects.select_related('reservation', 'user', 'pharmacy'),
            pk=pk,
        )
        self.check_object_permissions(request, delivery)

        is_pharmacien_owner = (
            getattr(request.user, 'role', None) == 'pharmacien'
            and delivery.pharmacy.user_id == request.user.id
        )
        if not (is_admin_user(request.user) or is_pharmacien_owner):
            return Response(
                {'error': 'Seuls le pharmacien de la pharmacie ou un administrateur peuvent changer le statut.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DeliveryStatusUpdateSerializer(
            data=request.data,
            context={'delivery': delivery},
        )
        serializer.is_valid(raise_exception=True)

        try:
            delivery = change_delivery_status(
                delivery=delivery,
                nouveau_statut=serializer.validated_data['statut'],
                changed_by=request.user,
                commentaire=serializer.validated_data.get('commentaire', ''),
            )
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': 'Statut de livraison mis a jour.',
                'delivery': DeliverySerializer(delivery).data,
            },
            status=status.HTTP_200_OK,
        )


class PharmacienDeliveryListView(generics.ListAPIView):
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_queryset(self):
        return (
            Delivery.objects.filter(pharmacy__user=self.request.user)
            .select_related('reservation', 'user', 'pharmacy')
            .prefetch_related('status_history__changed_by')
            .order_by('-date_creation')
        )


class AdminDeliveryListView(generics.ListAPIView):
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            Delivery.objects.select_related('reservation', 'user', 'pharmacy')
            .prefetch_related('status_history__changed_by')
            .order_by('-date_creation')
        )
