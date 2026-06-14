from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)
from payments.models import Payment
from transactions.models import Transaction

from .dashboard_service import (
    apply_date_filter,
    get_admin_dashboard,
    get_date_range,
    get_pharmacist_dashboard,
    get_top_pharmacies,
    payments_by_method,
    revenue_by_day,
    revenue_by_month,
    sum_money,
)
from .serializers import FinanceFilterSerializer


class FinanceFilterMixin:
    def get_validated_filters(self, request):
        serializer = FinanceFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return request.query_params


class PharmacienFinanceDashboardView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            return Response(
                {'error': 'Aucune pharmacie associee a ce pharmacien.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(get_pharmacist_dashboard(pharmacy, self.get_validated_filters(request)))


class PharmacienFinanceRevenuesView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            return Response(
                {'error': 'Aucune pharmacie associee a ce pharmacien.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        date_range = get_date_range(self.get_validated_filters(request))
        queryset = Transaction.objects.filter(
            pharmacy=pharmacy,
            type_transaction=Transaction.TYPE_PAYMENT,
        )
        queryset = apply_date_filter(queryset, 'date_creation', date_range)
        return Response(
            {
                'total': sum_money(queryset, 'montant_brut'),
                'net_pharmacie': sum_money(queryset, 'montant_pharmacie'),
                'commissions': sum_money(queryset, 'commission'),
                'par_jour': revenue_by_day(queryset),
                'par_mois': revenue_by_month(queryset),
            }
        )


class PharmacienFinanceTransactionsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            return Response(
                {'error': 'Aucune pharmacie associee a ce pharmacien.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        date_range = get_date_range(self.get_validated_filters(request))
        queryset = Transaction.objects.filter(pharmacy=pharmacy).select_related(
            'payment',
            'reservation',
            'user',
            'pharmacy',
        )
        queryset = apply_date_filter(queryset, 'date_creation', date_range)
        return Response(
            [
                {
                    'id': transaction.id,
                    'reference_transaction': transaction.reference_transaction,
                    'type_transaction': transaction.type_transaction,
                    'montant_brut': transaction.montant_brut,
                    'commission': transaction.commission,
                    'montant_pharmacie': transaction.montant_pharmacie,
                    'date_creation': transaction.date_creation,
                }
                for transaction in queryset.order_by('-date_creation')[:100]
            ]
        )


class AdminFinanceDashboardView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        return Response(get_admin_dashboard(self.get_validated_filters(request)))


class AdminFinanceRevenuesView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        date_range = get_date_range(self.get_validated_filters(request))
        queryset = apply_date_filter(Transaction.objects.all(), 'date_creation', date_range)
        return Response(
            {
                'total': sum_money(queryset, 'montant_brut'),
                'par_mois': revenue_by_month(queryset),
            }
        )


class AdminFinanceCommissionsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        date_range = get_date_range(self.get_validated_filters(request))
        queryset = apply_date_filter(Transaction.objects.all(), 'date_creation', date_range)
        return Response(
            {
                'total_commissions': sum_money(queryset, 'commission'),
                'par_mois': revenue_by_month(queryset),
            }
        )


class AdminFinanceTopPharmaciesView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        date_range = get_date_range(self.get_validated_filters(request))
        queryset = apply_date_filter(Transaction.objects.all(), 'date_creation', date_range)
        return Response(get_top_pharmacies(queryset))


class AdminFinancePaymentMethodsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        date_range = get_date_range(self.get_validated_filters(request))
        queryset = apply_date_filter(Payment.objects.all(), 'date_creation', date_range)
        return Response(payments_by_method(queryset))


class FinanceExportPlaceholderView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get(self, request):
        self.get_validated_filters(request)
        export_type = request.query_params.get('type', 'transactions')
        export_format = request.query_params.get('format', 'excel')
        return Response(
            {
                'message': 'Export financier prepare pour une prochaine etape.',
                'type': export_type,
                'format': export_format,
                'formats_supportes': ['excel', 'pdf'],
                'types_supportes': ['transactions', 'revenus', 'paiements', 'remboursements'],
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class AdminFinanceExportPlaceholderView(FinanceExportPlaceholderView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]


class PharmacienFinanceExportPlaceholderView(FinanceExportPlaceholderView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]
