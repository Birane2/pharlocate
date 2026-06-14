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

from .models import Refund
from .permissions import IsAdminOrRefundOwnerOrPharmacist
from .refund_service import approve_refund, execute_refund, reject_refund
from .serializers import (
    RefundApproveSerializer,
    RefundCreateSerializer,
    RefundRejectSerializer,
    RefundSerializer,
)


def format_django_validation_error(exc):
    if hasattr(exc, 'message_dict'):
        return exc.message_dict

    if hasattr(exc, 'messages'):
        return {'detail': exc.messages}

    return {'detail': str(exc)}


class RefundCreateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def post(self, request):
        serializer = RefundCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            refund = serializer.save()
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Demande de remboursement creee avec succes.',
                'refund': RefundSerializer(refund).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyRefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return (
            Refund.objects.filter(user=self.request.user)
            .select_related(
                'payment',
                'transaction',
                'refund_transaction',
                'invoice',
                'reservation',
                'user',
                'pharmacy',
                'traite_par',
            )
            .prefetch_related('status_history__changed_by')
            .order_by('-date_demande')
        )


class RefundDetailView(generics.RetrieveAPIView):
    serializer_class = RefundSerializer
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrRefundOwnerOrPharmacist,
    ]

    def get_queryset(self):
        return (
            Refund.objects.select_related(
                'payment',
                'transaction',
                'refund_transaction',
                'invoice',
                'reservation',
                'user',
                'pharmacy',
                'traite_par',
            )
            .prefetch_related('status_history__changed_by')
            .order_by('-date_demande')
        )


class RefundApproveView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def post(self, request, pk):
        refund = get_object_or_404(Refund, pk=pk)
        serializer = RefundApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refund = approve_refund(
                refund=refund,
                approved_by=request.user,
                montant_approuve=serializer.validated_data.get('montant_approuve'),
                commentaire_admin=serializer.validated_data.get('commentaire_admin', ''),
            )
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Remboursement approuve avec succes.',
                'refund': RefundSerializer(refund).data,
            }
        )


class RefundRejectView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def post(self, request, pk):
        refund = get_object_or_404(Refund, pk=pk)
        serializer = RefundRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refund = reject_refund(
                refund=refund,
                rejected_by=request.user,
                commentaire_admin=serializer.validated_data['commentaire_admin'],
            )
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Remboursement refuse avec succes.',
                'refund': RefundSerializer(refund).data,
            }
        )


class RefundExecuteView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def post(self, request, pk):
        refund = get_object_or_404(Refund, pk=pk)

        try:
            refund = execute_refund(refund, request.user)
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Remboursement marque comme effectue.',
                'refund': RefundSerializer(refund).data,
            }
        )


class PharmacienRefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_queryset(self):
        return (
            Refund.objects.filter(pharmacy__user=self.request.user)
            .select_related(
                'payment',
                'transaction',
                'refund_transaction',
                'invoice',
                'reservation',
                'user',
                'pharmacy',
                'traite_par',
            )
            .prefetch_related('status_history__changed_by')
            .order_by('-date_demande')
        )


class AdminRefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            Refund.objects.select_related(
                'payment',
                'transaction',
                'refund_transaction',
                'invoice',
                'reservation',
                'user',
                'pharmacy',
                'traite_par',
            )
            .prefetch_related('status_history__changed_by')
            .order_by('-date_demande')
        )
