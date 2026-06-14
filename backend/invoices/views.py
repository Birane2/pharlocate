from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)

from .models import Invoice
from .permissions import IsAdminOrInvoiceOwnerOrPharmacist
from .serializers import InvoiceSerializer


class MyInvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return (
            Invoice.objects.filter(user=self.request.user)
            .select_related('payment', 'transaction', 'reservation', 'user', 'pharmacy')
            .prefetch_related('reservation__items__medicament')
            .order_by('-date_emission')
        )


class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrInvoiceOwnerOrPharmacist,
    ]

    def get_queryset(self):
        return (
            Invoice.objects.select_related(
                'payment',
                'transaction',
                'reservation',
                'user',
                'pharmacy',
            )
            .prefetch_related('reservation__items__medicament')
            .order_by('-date_emission')
        )


class InvoiceDownloadView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrInvoiceOwnerOrPharmacist,
    ]

    def get(self, request, pk):
        invoice = get_object_or_404(
            Invoice.objects.select_related('payment', 'transaction', 'user', 'pharmacy'),
            pk=pk,
        )
        self.check_object_permissions(request, invoice)

        if not invoice.pdf_file:
            return Response(
                {'message': 'Le PDF de cette facture sera disponible prochainement.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            invoice.pdf_file.open('rb'),
            as_attachment=True,
            filename=f'{invoice.numero_facture}.pdf',
        )


class PharmacienInvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_queryset(self):
        return (
            Invoice.objects.filter(pharmacy__user=self.request.user)
            .select_related('payment', 'transaction', 'reservation', 'user', 'pharmacy')
            .prefetch_related('reservation__items__medicament')
            .order_by('-date_emission')
        )


class AdminInvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            Invoice.objects.select_related(
                'payment',
                'transaction',
                'reservation',
                'user',
                'pharmacy',
            )
            .prefetch_related('reservation__items__medicament')
            .order_by('-date_emission')
        )
