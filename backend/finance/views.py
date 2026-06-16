from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)
from payments.models import Payment
from payments.serializers import PaymentSerializer
from pharmacies.models import Pharmacy
from refunds.models import Refund
from refunds.serializers import RefundSerializer
from subscriptions.models import PharmacySubscription, SubscriptionPayment, SubscriptionRefund
from subscriptions.serializers import (
    PharmacySubscriptionSerializer,
    SubscriptionPaymentSerializer,
    SubscriptionRefundSerializer,
)
from transactions.models import Transaction
from transactions.serializers import TransactionSerializer

from .commission_services import (
    create_invoice_payment,
    generate_monthly_commission_invoice,
    mark_overdue_invoices,
    reject_commission_payment,
    validate_commission_payment,
)
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
from .models import CommissionInvoice, CommissionInvoicePayment
from .serializers import (
    CommissionInvoicePaymentCreateSerializer,
    CommissionInvoiceSerializer,
    FinanceFilterSerializer,
)


class FinanceFilterMixin:
    def get_validated_filters(self, request):
        serializer = FinanceFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return request.query_params

    def apply_common_filters(self, queryset, params):
        date_range = get_date_range(params)
        queryset = apply_date_filter(queryset, 'date_creation', date_range)

        status_filter = params.get('status')
        if status_filter:
            if hasattr(queryset.model, 'statut'):
                queryset = queryset.filter(statut=status_filter)
            elif hasattr(queryset.model, 'status'):
                queryset = queryset.filter(status=status_filter)

        return queryset


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


class PharmacienFinancePaymentsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            return Response(
                {'error': 'Aucune pharmacie associee a ce pharmacien.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        params = self.get_validated_filters(request)
        queryset = Payment.objects.filter(pharmacy=pharmacy).select_related(
            'payment_method',
            'reservation',
            'user',
            'pharmacy',
        )
        queryset = self.apply_common_filters(queryset, params)
        method = params.get('method')
        if method:
            queryset = queryset.filter(payment_method__code=method)

        return Response(
            PaymentSerializer(
                queryset.order_by('-date_creation')[:100],
                many=True,
                context={'request': request},
            ).data
        )


class AdminFinanceDashboardView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        return Response(get_admin_dashboard(self.get_validated_filters(request)))


class AdminFinancePaymentsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        params = self.get_validated_filters(request)
        queryset = Payment.objects.select_related(
            'payment_method',
            'reservation',
            'user',
            'pharmacy',
        )
        queryset = self.apply_common_filters(queryset, params)

        pharmacy_id = params.get('pharmacy')
        method = params.get('method')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        if method:
            queryset = queryset.filter(payment_method__code=method)

        subscription_payments = SubscriptionPayment.objects.select_related(
            'pharmacy',
            'subscription__plan',
            'validated_by',
        )
        date_range = get_date_range(params)
        subscription_payments = apply_date_filter(subscription_payments, 'created_at', date_range)
        status_filter = params.get('status')
        if status_filter:
            subscription_payments = subscription_payments.filter(status=status_filter)
        if pharmacy_id:
            subscription_payments = subscription_payments.filter(pharmacy_id=pharmacy_id)

        return Response(
            {
                'reservation_payments': PaymentSerializer(
                    queryset.order_by('-date_creation')[:100],
                    many=True,
                    context={'request': request},
                ).data,
                'subscription_payments': SubscriptionPaymentSerializer(
                    subscription_payments.order_by('-created_at')[:100],
                    many=True,
                    context={'request': request},
                ).data,
            }
        )


class AdminFinanceTransactionsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        params = self.get_validated_filters(request)
        date_range = get_date_range(params)
        queryset = Transaction.objects.select_related(
            'payment',
            'reservation',
            'user',
            'pharmacy',
        )
        queryset = apply_date_filter(queryset, 'date_creation', date_range)

        pharmacy_id = params.get('pharmacy')
        type_transaction = params.get('type_transaction')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        if type_transaction:
            queryset = queryset.filter(type_transaction=type_transaction)

        return Response(
            TransactionSerializer(
                queryset.order_by('-date_creation')[:150],
                many=True,
            ).data
        )


class AdminFinanceSubscriptionsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        params = self.get_validated_filters(request)
        queryset = PharmacySubscription.objects.select_related('pharmacy', 'plan')
        queryset = self.apply_common_filters(queryset, params)
        pharmacy_id = params.get('pharmacy')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        return Response(
            PharmacySubscriptionSerializer(
                queryset.order_by('-date_creation')[:150],
                many=True,
            ).data
        )


class AdminFinanceRefundsView(FinanceFilterMixin, APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        params = self.get_validated_filters(request)
        date_range = get_date_range(params)
        pharmacy_id = params.get('pharmacy')
        status_filter = params.get('status')

        refunds = Refund.objects.select_related(
            'payment',
            'transaction',
            'invoice',
            'reservation',
            'user',
            'pharmacy',
        )
        refunds = apply_date_filter(refunds, 'date_demande', date_range)
        if pharmacy_id:
            refunds = refunds.filter(pharmacy_id=pharmacy_id)
        if status_filter:
            refunds = refunds.filter(statut=status_filter)

        subscription_refunds = SubscriptionRefund.objects.select_related(
            'subscription_payment__subscription__plan',
            'pharmacy',
            'requested_by',
            'processed_by',
        )
        subscription_refunds = apply_date_filter(subscription_refunds, 'created_at', date_range)
        if pharmacy_id:
            subscription_refunds = subscription_refunds.filter(pharmacy_id=pharmacy_id)
        if status_filter:
            subscription_refunds = subscription_refunds.filter(status=status_filter)

        return Response(
            {
                'reservation_refunds': RefundSerializer(
                    refunds.order_by('-date_demande')[:100],
                    many=True,
                ).data,
                'subscription_refunds': SubscriptionRefundSerializer(
                    subscription_refunds.order_by('-created_at')[:100],
                    many=True,
                ).data,
            }
        )


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


# ── Commission Invoice helpers ──────────────────────────────────────────────

def _get_pharmacy_or_404(request):
    pharmacy = getattr(request.user, 'pharmacy', None)
    if not pharmacy:
        return None, Response(
            {'error': 'Aucune pharmacie associee a ce pharmacien.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return pharmacy, None


# ── Pharmacien commission invoice views ────────────────────────────────────

class PharmacienCommissionInvoiceListView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy, err = _get_pharmacy_or_404(request)
        if err:
            return err
        mark_overdue_invoices()
        invoices = (
            CommissionInvoice.objects.filter(pharmacy=pharmacy)
            .prefetch_related('payments')
            .order_by('-created_at')
        )
        return Response(
            CommissionInvoiceSerializer(invoices, many=True, context={'request': request}).data
        )


class PharmacienCommissionInvoiceDetailView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request, pk):
        pharmacy, err = _get_pharmacy_or_404(request)
        if err:
            return err
        try:
            invoice = CommissionInvoice.objects.prefetch_related('payments').get(
                pk=pk, pharmacy=pharmacy
            )
        except CommissionInvoice.DoesNotExist:
            return Response({'error': 'Facture introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            CommissionInvoiceSerializer(invoice, context={'request': request}).data
        )


class PharmacienCommissionInvoicePayView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def post(self, request, pk):
        pharmacy, err = _get_pharmacy_or_404(request)
        if err:
            return err
        try:
            invoice = CommissionInvoice.objects.get(pk=pk, pharmacy=pharmacy)
        except CommissionInvoice.DoesNotExist:
            return Response({'error': 'Facture introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CommissionInvoicePaymentCreateSerializer(data={
            **request.data,
            'proof_image': request.FILES.get('proof_image'),
        })
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        amount = data.get('amount') or invoice.commission_amount

        try:
            payment = create_invoice_payment(
                invoice=invoice,
                payment_method=data['payment_method'],
                transaction_id=data['transaction_id'],
                proof_image=data['proof_image'],
                amount=amount,
            )
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Paiement soumis. En attente de validation par l administration.',
                'payment_id': payment.id,
                'invoice': CommissionInvoiceSerializer(
                    CommissionInvoice.objects.prefetch_related('payments').get(pk=pk),
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ── Admin commission invoice views ─────────────────────────────────────────

class AdminCommissionInvoiceListView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        mark_overdue_invoices()
        queryset = (
            CommissionInvoice.objects.select_related('pharmacy')
            .prefetch_related('payments')
            .order_by('-created_at')
        )

        pharmacy_id = request.query_params.get('pharmacy')
        inv_status = request.query_params.get('status')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        if inv_status:
            queryset = queryset.filter(status=inv_status)

        return Response(
            CommissionInvoiceSerializer(
                queryset[:200], many=True, context={'request': request}
            ).data
        )


class AdminCommissionInvoiceDetailView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request, pk):
        try:
            invoice = (
                CommissionInvoice.objects.select_related('pharmacy')
                .prefetch_related('payments')
                .get(pk=pk)
            )
        except CommissionInvoice.DoesNotExist:
            return Response({'error': 'Facture introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CommissionInvoiceSerializer(invoice, context={'request': request}).data)


class AdminCommissionInvoiceGenerateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def post(self, request):
        import datetime

        pharmacy_id = request.data.get('pharmacy')
        period_start_str = request.data.get('period_start')
        period_end_str = request.data.get('period_end')
        due_date_str = request.data.get('due_date')

        if not pharmacy_id:
            return Response(
                {'error': 'pharmacy est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST
            )
        if not period_start_str or not period_end_str:
            return Response(
                {'error': 'period_start et period_end sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pharmacy = Pharmacy.objects.get(pk=pharmacy_id)
        except Pharmacy.DoesNotExist:
            return Response({'error': 'Pharmacie introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            period_start = datetime.date.fromisoformat(period_start_str)
            period_end = datetime.date.fromisoformat(period_end_str)
        except ValueError:
            return Response(
                {'error': 'Dates invalides. Format attendu: YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if period_end < period_start:
            return Response(
                {'error': 'period_end doit etre posterieure a period_start.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice, created = generate_monthly_commission_invoice(pharmacy, period_start, period_end)

        # Allow admin to override due_date
        if due_date_str and created:
            try:
                invoice.due_date = datetime.date.fromisoformat(due_date_str)
                invoice.save(update_fields=['due_date'])
            except ValueError:
                pass

        invoice.refresh_from_db()
        serialized = CommissionInvoiceSerializer(
            CommissionInvoice.objects.prefetch_related('payments').get(pk=invoice.pk),
            context={'request': request},
        ).data
        return Response(
            {'created': created, 'invoice': serialized},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class AdminCommissionPaymentValidateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        try:
            payment = CommissionInvoicePayment.objects.select_related('invoice').get(pk=pk)
        except CommissionInvoicePayment.DoesNotExist:
            return Response({'error': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            validate_commission_payment(payment, request.user)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        invoice = CommissionInvoice.objects.prefetch_related('payments').get(
            pk=payment.invoice_id
        )
        return Response({
            'message': 'Paiement valide. Facture marquee payee.',
            'invoice': CommissionInvoiceSerializer(invoice, context={'request': request}).data,
        })


class AdminCommissionPaymentRejectView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        try:
            payment = CommissionInvoicePayment.objects.select_related('invoice').get(pk=pk)
        except CommissionInvoicePayment.DoesNotExist:
            return Response({'error': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'error': 'reason est obligatoire pour refuser un paiement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reject_commission_payment(payment, request.user, reason)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        invoice = CommissionInvoice.objects.prefetch_related('payments').get(
            pk=payment.invoice_id
        )
        return Response({
            'message': 'Paiement refuse.',
            'invoice': CommissionInvoiceSerializer(invoice, context={'request': request}).data,
        })
