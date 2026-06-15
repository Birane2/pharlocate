from decimal import Decimal

from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)
from payments.models import Payment
from subscriptions.models import SubscriptionPayment

from .models import Transaction
from .permissions import IsAdminOrTransactionOwnerOrPharmacist
from .serializers import AdminFinancialTransactionSerializer, TransactionSerializer


STATUS_LABELS = {
    'pending': 'En attente',
    'validated': 'Validee',
    'rejected': 'Refusee',
    'cancelled': 'Annulee',
    'refunded': 'Remboursee',
}

TYPE_LABELS = {
    'reservation_payment': 'Paiement reservation',
    'subscription_payment': 'Paiement abonnement',
    'refund': 'Remboursement',
    'commission': 'Commission',
    'adjustment': 'Ajustement',
}

PAYMENT_STATUS_MAP = {
    Payment.STATUS_PENDING: 'pending',
    Payment.STATUS_VALIDATED: 'validated',
    Payment.STATUS_REJECTED: 'rejected',
    Payment.STATUS_CANCELLED: 'cancelled',
    Payment.STATUS_REFUNDED: 'refunded',
}

SUBSCRIPTION_PAYMENT_STATUS_MAP = {
    SubscriptionPayment.STATUS_PENDING: 'pending',
    SubscriptionPayment.STATUS_VALIDATED: 'validated',
    SubscriptionPayment.STATUS_REJECTED: 'rejected',
    SubscriptionPayment.STATUS_CANCELLED: 'cancelled',
}

TRANSACTION_TYPE_MAP = {
    Transaction.TYPE_PAYMENT: 'reservation_payment',
    Transaction.TYPE_COMMISSION: 'commission',
    Transaction.TYPE_REFUND: 'refund',
    Transaction.TYPE_ADJUSTMENT: 'adjustment',
    Transaction.TYPE_SUBSCRIPTION: 'subscription_payment',
}


def _zero():
    return Decimal('0.00')


def _full_name(user):
    if not user:
        return ''
    return user.get_full_name() or getattr(user, 'phone_number', '') or user.username


def _build_absolute_file_url(request, file_field):
    if not file_field:
        return ''
    try:
        url = file_field.url
    except ValueError:
        return ''
    return request.build_absolute_uri(url) if request else url


def _payment_transaction(payment):
    transactions = [
        transaction
        for transaction in payment.transactions.all()
        if transaction.type_transaction == Transaction.TYPE_PAYMENT
    ]
    if transactions:
        return transactions[0]
    return payment.transactions.filter(type_transaction=Transaction.TYPE_PAYMENT).first()


def serialize_reservation_payment(payment, request=None):
    transaction = _payment_transaction(payment)
    status_value = PAYMENT_STATUS_MAP.get(payment.statut, payment.statut)
    reference = (
        transaction.reference_transaction
        if transaction
        else f'PAY-{payment.id:06d}'
    )
    return {
        'id': f'reservation-{payment.id}',
        'source': 'reservation_payment',
        'source_id': payment.id,
        'reference': reference,
        'type': 'reservation_payment',
        'type_label': TYPE_LABELS['reservation_payment'],
        'user_id': payment.user_id,
        'user_name': _full_name(payment.user),
        'pharmacy_id': payment.pharmacy_id,
        'pharmacy_name': payment.pharmacy.nom if payment.pharmacy_id else '',
        'reservation_id': payment.reservation_id,
        'subscription_id': None,
        'payment_method': payment.payment_method.nom if payment.payment_method_id else '',
        'transaction_id': payment.transaction_id or '',
        'amount_medicines': payment.montant_medicaments,
        'delivery_fee': payment.frais_livraison,
        'total_amount': payment.montant_total,
        'platform_commission': transaction.commission if transaction else _zero(),
        'pharmacy_amount': transaction.montant_pharmacie if transaction else _zero(),
        'status': status_value,
        'status_label': STATUS_LABELS.get(status_value, status_value),
        'validated_by': _full_name(payment.valide_par),
        'validated_at': payment.date_validation,
        'created_at': payment.date_creation,
        'proof_url': _build_absolute_file_url(request, payment.capture_paiement),
    }


def serialize_subscription_payment(payment, request=None):
    status_value = SUBSCRIPTION_PAYMENT_STATUS_MAP.get(payment.status, payment.status)
    return {
        'id': f'subscription-{payment.id}',
        'source': 'subscription_payment',
        'source_id': payment.id,
        'reference': f'SUBPAY-{payment.id:06d}',
        'type': 'subscription_payment',
        'type_label': TYPE_LABELS['subscription_payment'],
        'user_id': payment.pharmacy.user_id if payment.pharmacy_id else None,
        'user_name': _full_name(payment.pharmacy.user) if payment.pharmacy_id else '',
        'pharmacy_id': payment.pharmacy_id,
        'pharmacy_name': payment.pharmacy.nom if payment.pharmacy_id else '',
        'reservation_id': None,
        'subscription_id': payment.subscription_id,
        'payment_method': payment.get_payment_method_display(),
        'transaction_id': payment.transaction_id or '',
        'amount_medicines': _zero(),
        'delivery_fee': _zero(),
        'total_amount': payment.amount,
        'platform_commission': payment.amount if status_value == 'validated' else _zero(),
        'pharmacy_amount': _zero(),
        'status': status_value,
        'status_label': STATUS_LABELS.get(status_value, status_value),
        'validated_by': _full_name(payment.validated_by),
        'validated_at': payment.validated_at,
        'created_at': payment.created_at,
        'proof_url': _build_absolute_file_url(request, payment.proof_image),
    }


def serialize_technical_transaction(transaction, request=None):
    type_value = TRANSACTION_TYPE_MAP.get(
        transaction.type_transaction,
        transaction.type_transaction,
    )
    return {
        'id': f'transaction-{transaction.id}',
        'source': 'transaction',
        'source_id': transaction.id,
        'reference': transaction.reference_transaction,
        'type': type_value,
        'type_label': TYPE_LABELS.get(type_value, type_value),
        'user_id': transaction.user_id,
        'user_name': _full_name(transaction.user),
        'pharmacy_id': transaction.pharmacy_id,
        'pharmacy_name': transaction.pharmacy.nom if transaction.pharmacy_id else '',
        'reservation_id': transaction.reservation_id,
        'subscription_id': None,
        'payment_method': transaction.payment.payment_method.nom if transaction.payment_id else '',
        'transaction_id': transaction.payment.transaction_id if transaction.payment_id else '',
        'amount_medicines': getattr(transaction.payment, 'montant_medicaments', _zero()),
        'delivery_fee': getattr(transaction.payment, 'frais_livraison', _zero()),
        'total_amount': transaction.montant_brut,
        'platform_commission': transaction.commission,
        'pharmacy_amount': transaction.montant_pharmacie,
        'status': 'validated',
        'status_label': STATUS_LABELS['validated'],
        'validated_by': _full_name(transaction.created_by),
        'validated_at': transaction.date_creation,
        'created_at': transaction.date_creation,
        'proof_url': _build_absolute_file_url(
            request,
            transaction.payment.capture_paiement if transaction.payment_id else None,
        ),
    }


def _filter_by_params(items, params):
    status_filter = params.get('status')
    type_filter = params.get('type')
    pharmacy_filter = params.get('pharmacy')
    date_start = params.get('date_start') or params.get('start_date')
    date_end = params.get('date_end') or params.get('end_date')
    search = (params.get('search') or '').strip().lower()

    filtered = []
    for item in items:
        if status_filter and item['status'] != status_filter:
            continue
        if type_filter and item['type'] != type_filter:
            continue
        if pharmacy_filter and str(item['pharmacy_id']) != str(pharmacy_filter):
            continue
        item_date = item['created_at'].date()
        if date_start and str(item_date) < date_start:
            continue
        if date_end and str(item_date) > date_end:
            continue
        if search:
            haystack = ' '.join([
                str(item.get('reference', '')),
                str(item.get('transaction_id', '')),
                str(item.get('pharmacy_name', '')),
                str(item.get('user_name', '')),
                str(item.get('reservation_id', '')),
            ]).lower()
            if search not in haystack:
                continue
        filtered.append(item)
    return filtered


def build_admin_financial_transactions(request):
    payments = (
        Payment.objects.select_related(
            'reservation',
            'user',
            'pharmacy',
            'payment_method',
            'valide_par',
        )
        .prefetch_related('transactions')
        .order_by('-date_creation')
    )
    subscription_payments = (
        SubscriptionPayment.objects.select_related(
            'subscription__plan',
            'pharmacy__user',
            'validated_by',
        )
        .order_by('-created_at')
    )
    technical_transactions = (
        Transaction.objects.exclude(type_transaction=Transaction.TYPE_PAYMENT)
        .select_related('payment__payment_method', 'reservation', 'user', 'pharmacy', 'created_by')
        .order_by('-date_creation')
    )

    items = [
        serialize_reservation_payment(payment, request=request)
        for payment in payments
    ]
    items.extend(
        serialize_subscription_payment(payment, request=request)
        for payment in subscription_payments
    )
    items.extend(
        serialize_technical_transaction(transaction, request=request)
        for transaction in technical_transactions
    )
    items.sort(key=lambda item: item['created_at'], reverse=True)
    return _filter_by_params(items, request.query_params)


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
    serializer_class = AdminFinancialTransactionSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def list(self, request, *args, **kwargs):
        items = build_admin_financial_transactions(request)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class AdminTransactionDetailView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request, pk):
        items = build_admin_financial_transactions(request)
        item = next(
            (
                current
                for current in items
                if str(current['id']) == str(pk)
                or str(current['source_id']) == str(pk)
                or str(current['reference']) == str(pk)
            ),
            None,
        )
        if not item:
            return Response(
                {'detail': 'Transaction introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(AdminFinancialTransactionSerializer(item).data)


class AdminTransactionStatisticsView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        items = build_admin_financial_transactions(request)
        summary = {
            'total_transactions': len(items),
            'total_validated': sum(1 for item in items if item['status'] == 'validated'),
            'total_pending': sum(1 for item in items if item['status'] == 'pending'),
            'total_rejected': sum(1 for item in items if item['status'] == 'rejected'),
            'total_cancelled': sum(1 for item in items if item['status'] == 'cancelled'),
            'total_refunded': sum(1 for item in items if item['status'] == 'refunded'),
            'total_amount': sum((item['total_amount'] for item in items), _zero()),
            'validated_amount': sum(
                (item['total_amount'] for item in items if item['status'] == 'validated'),
                _zero(),
            ),
            'total_commissions': sum((item['platform_commission'] for item in items), _zero()),
            'total_pharmacy_revenue': sum((item['pharmacy_amount'] for item in items), _zero()),
            'subscription_payments': sum(
                (item['total_amount'] for item in items if item['type'] == 'subscription_payment'),
                _zero(),
            ),
        }

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
                **summary,
                'revenu_total_plateforme': totals['revenu_total'],
                'legacy_total_commissions': totals['total_commissions'],
                'legacy_total_pharmacies': totals['total_pharmacies'],
                'legacy_nombre_transactions': totals['nombre_transactions'],
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
