from decimal import Decimal

from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)
from payments.models import Payment

from .models import Transaction
from .permissions import IsAdminOrTransactionOwnerOrPharmacist
from .serializers import TransactionSerializer


class MyTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return (
            Transaction.objects.filter(user=self.request.user)
            .select_related('payment', 'reservation', 'user', 'pharmacy', 'created_by')
            .order_by('-date_creation')
        )


class TransactionDetailView(generics.RetrieveAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrTransactionOwnerOrPharmacist,
    ]

    def get_queryset(self):
        return (
            Transaction.objects.select_related(
                'payment',
                'reservation',
                'user',
                'pharmacy',
                'created_by',
            )
            .order_by('-date_creation')
        )


class PharmacienTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_queryset(self):
        return (
            Transaction.objects.filter(pharmacy__user=self.request.user)
            .select_related('payment', 'reservation', 'user', 'pharmacy', 'created_by')
            .order_by('-date_creation')
        )


class AdminTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            Transaction.objects.select_related(
                'payment',
                'reservation',
                'user',
                'pharmacy',
                'created_by',
            )
            .order_by('-date_creation')
        )


class AdminTransactionStatisticsView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        money_field = DecimalField(max_digits=12, decimal_places=2)
        totals = Transaction.objects.aggregate(
            revenu_total=Coalesce(
                Sum('montant_brut'),
                Value(Decimal('0.00')),
                output_field=money_field,
            ),
            total_commissions=Coalesce(
                Sum('commission'),
                Value(Decimal('0.00')),
                output_field=money_field,
            ),
            total_pharmacies=Coalesce(
                Sum('montant_pharmacie'),
                Value(Decimal('0.00')),
                output_field=money_field,
            ),
            nombre_transactions=Count('id'),
        )
        payment_stats = Payment.objects.aggregate(
            paiements_valides=Count('id', filter=Q(statut=Payment.STATUS_VALIDATED)),
            paiements_refuses=Count('id', filter=Q(statut=Payment.STATUS_REJECTED)),
        )
        revenus_par_pharmacie = (
            Transaction.objects.values('pharmacy', 'pharmacy__nom')
            .annotate(
                montant_brut=Coalesce(
                    Sum('montant_brut'),
                    Value(Decimal('0.00')),
                    output_field=money_field,
                ),
                commission=Coalesce(
                    Sum('commission'),
                    Value(Decimal('0.00')),
                    output_field=money_field,
                ),
                montant_pharmacie=Coalesce(
                    Sum('montant_pharmacie'),
                    Value(Decimal('0.00')),
                    output_field=money_field,
                ),
                transactions=Count('id'),
            )
            .order_by('-montant_brut')
        )

        return Response(
            {
                'revenu_total_plateforme': totals['revenu_total'],
                'total_commissions': totals['total_commissions'],
                'total_pharmacies': totals['total_pharmacies'],
                'nombre_transactions': totals['nombre_transactions'],
                'paiements_valides': payment_stats['paiements_valides'],
                'paiements_refuses': payment_stats['paiements_refuses'],
                'revenus_par_pharmacie': [
                    {
                        'pharmacy': row['pharmacy'],
                        'pharmacy_name': row['pharmacy__nom'],
                        'montant_brut': row['montant_brut'],
                        'commission': row['commission'],
                        'montant_pharmacie': row['montant_pharmacie'],
                        'transactions': row['transactions'],
                    }
                    for row in revenus_par_pharmacie
                ],
            }
        )
