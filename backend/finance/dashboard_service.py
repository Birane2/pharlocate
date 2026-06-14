from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDay, TruncMonth
from django.utils import timezone

from deliveries.models import Delivery
from payments.models import Payment
from pharmacies.models import Pharmacy
from refunds.models import Refund
from reservations.models import Reservation
from subscriptions.models import PharmacySubscription
from transactions.models import Transaction


MONEY_FIELD = DecimalField(max_digits=14, decimal_places=2)
ZERO_MONEY = Value(Decimal('0.00'), output_field=MONEY_FIELD)


def _make_aware(date_value, boundary):
    date_time = datetime.combine(date_value, boundary)
    if timezone.is_naive(date_time):
        return timezone.make_aware(date_time)
    return date_time


def _parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, '%Y-%m-%d').date()


def get_date_range(params):
    period = params.get('period') or ''
    today = timezone.localdate()

    if period == 'today':
        start = end = today
    elif period == 'week':
        start = today - timedelta(days=today.weekday())
        end = today
    elif period == 'month':
        start = today.replace(day=1)
        end = today
    elif period == 'year':
        start = today.replace(month=1, day=1)
        end = today
    elif period == 'custom':
        start = _parse_date(params.get('start_date'))
        end = _parse_date(params.get('end_date'))
        if not start or not end:
            return None
    else:
        return None

    return _make_aware(start, time.min), _make_aware(end, time.max)


def apply_date_filter(queryset, field_name, date_range):
    if not date_range:
        return queryset

    start_date, end_date = date_range
    return queryset.filter(
        **{
            f'{field_name}__gte': start_date,
            f'{field_name}__lte': end_date,
        }
    )


def sum_money(queryset, field_name):
    return queryset.aggregate(
        total=Coalesce(Sum(field_name), ZERO_MONEY, output_field=MONEY_FIELD)
    )['total']


def count_by_status(queryset, status_field='statut'):
    return {
        row[status_field]: row['count']
        for row in queryset.values(status_field).annotate(count=Count('id'))
    }


def get_revenue_stats(transaction_queryset):
    return {
        'revenu_brut': sum_money(transaction_queryset, 'montant_brut'),
        'commissions': sum_money(transaction_queryset, 'commission'),
        'montant_net_pharmacie': sum_money(transaction_queryset, 'montant_pharmacie'),
        'nombre_transactions': transaction_queryset.count(),
    }


def get_payment_stats(payment_queryset):
    return payment_queryset.aggregate(
        total=Count('id'),
        valides=Count('id', filter=Q(statut=Payment.STATUS_VALIDATED)),
        en_attente=Count('id', filter=Q(statut=Payment.STATUS_PENDING)),
        refuses=Count('id', filter=Q(statut=Payment.STATUS_REJECTED)),
        rembourses=Count('id', filter=Q(statut=Payment.STATUS_REFUNDED)),
    )


def get_delivery_stats(delivery_queryset):
    active_statuses = [
        Delivery.STATUS_PENDING,
        Delivery.STATUS_IN_PROGRESS,
    ]
    return {
        'total': delivery_queryset.count(),
        'en_cours': delivery_queryset.filter(statut__in=active_statuses).count(),
        'terminees': delivery_queryset.filter(statut=Delivery.STATUS_DELIVERED).count(),
        'par_statut': count_by_status(delivery_queryset),
    }


def get_subscription_stats(subscription_queryset):
    return {
        'total': subscription_queryset.count(),
        'actifs': subscription_queryset.filter(statut=PharmacySubscription.STATUS_ACTIVE).count(),
        'par_plan': [
            {
                'plan': row['plan__code'],
                'plan_name': row['plan__nom'],
                'count': row['count'],
            }
            for row in subscription_queryset.values('plan__code', 'plan__nom')
            .annotate(count=Count('id'))
            .order_by('-count')
        ],
    }


def revenue_by_day(transaction_queryset):
    return [
        {
            'date': row['period'].date().isoformat(),
            'revenu': row['revenu'],
            'commission': row['commission'],
            'net_pharmacie': row['net_pharmacie'],
        }
        for row in transaction_queryset.annotate(period=TruncDay('date_creation'))
        .values('period')
        .annotate(
            revenu=Coalesce(Sum('montant_brut'), ZERO_MONEY, output_field=MONEY_FIELD),
            commission=Coalesce(Sum('commission'), ZERO_MONEY, output_field=MONEY_FIELD),
            net_pharmacie=Coalesce(Sum('montant_pharmacie'), ZERO_MONEY, output_field=MONEY_FIELD),
        )
        .order_by('period')
    ]


def revenue_by_month(transaction_queryset):
    return [
        {
            'month': row['period'].date().strftime('%Y-%m'),
            'revenu': row['revenu'],
            'commission': row['commission'],
            'net_pharmacie': row['net_pharmacie'],
        }
        for row in transaction_queryset.annotate(period=TruncMonth('date_creation'))
        .values('period')
        .annotate(
            revenu=Coalesce(Sum('montant_brut'), ZERO_MONEY, output_field=MONEY_FIELD),
            commission=Coalesce(Sum('commission'), ZERO_MONEY, output_field=MONEY_FIELD),
            net_pharmacie=Coalesce(Sum('montant_pharmacie'), ZERO_MONEY, output_field=MONEY_FIELD),
        )
        .order_by('period')
    ]


def payments_by_method(payment_queryset):
    return [
        {
            'method': row['payment_method__code'] or 'inconnu',
            'method_name': row['payment_method__nom'] or 'Inconnu',
            'count': row['count'],
            'montant': row['montant'],
        }
        for row in payment_queryset.values('payment_method__code', 'payment_method__nom')
        .annotate(
            count=Count('id'),
            montant=Coalesce(Sum('montant_total'), ZERO_MONEY, output_field=MONEY_FIELD),
        )
        .order_by('-count')
    ]


def get_pharmacist_dashboard(pharmacy, params):
    date_range = get_date_range(params)
    transaction_queryset = Transaction.objects.filter(
        pharmacy=pharmacy,
        type_transaction=Transaction.TYPE_PAYMENT,
    )
    payment_queryset = Payment.objects.filter(pharmacy=pharmacy)
    delivery_queryset = Delivery.objects.filter(pharmacy=pharmacy)

    filtered_transactions = apply_date_filter(transaction_queryset, 'date_creation', date_range)
    filtered_payments = apply_date_filter(payment_queryset, 'date_creation', date_range)
    filtered_deliveries = apply_date_filter(delivery_queryset, 'date_creation', date_range)

    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    current_week = (
        _make_aware(week_start, time.min),
        _make_aware(today, time.max),
    )
    current_month = (
        _make_aware(month_start, time.min),
        _make_aware(today, time.max),
    )

    active_subscription = (
        pharmacy.subscriptions.filter(statut=PharmacySubscription.STATUS_ACTIVE)
        .select_related('plan')
        .order_by('-date_debut')
        .first()
    )

    return {
        'pharmacy': {
            'id': pharmacy.id,
            'nom': pharmacy.nom,
        },
        'summary': {
            'revenu_total': sum_money(transaction_queryset, 'montant_brut'),
            'revenus_mois': sum_money(
                apply_date_filter(transaction_queryset, 'date_creation', current_month),
                'montant_brut',
            ),
            'revenus_semaine': sum_money(
                apply_date_filter(transaction_queryset, 'date_creation', current_week),
                'montant_brut',
            ),
            'commissions_prelevees': sum_money(filtered_transactions, 'commission'),
            'montant_net_pharmacie': sum_money(filtered_transactions, 'montant_pharmacie'),
            'reservations_payees': Reservation.objects.filter(
                pharmacie=pharmacy,
                statut_paiement=Payment.STATUS_VALIDATED,
            ).count(),
            'livraisons_en_cours': get_delivery_stats(filtered_deliveries)['en_cours'],
            'livraisons_terminees': get_delivery_stats(filtered_deliveries)['terminees'],
            'abonnement_actuel': active_subscription.plan.nom if active_subscription else None,
            'date_expiration_abonnement': active_subscription.date_fin if active_subscription else None,
        },
        'payments': get_payment_stats(filtered_payments),
        'revenues': get_revenue_stats(filtered_transactions),
        'charts': {
            'revenus_par_jour': revenue_by_day(filtered_transactions),
            'revenus_par_mois': revenue_by_month(filtered_transactions),
            'repartition_paiements': count_by_status(filtered_payments),
            'repartition_modes_paiement': payments_by_method(filtered_payments),
        },
    }


def get_admin_dashboard(params):
    date_range = get_date_range(params)
    User = get_user_model()

    transaction_queryset = Transaction.objects.all()
    payment_queryset = Payment.objects.all()
    refund_queryset = Refund.objects.all()
    subscription_queryset = PharmacySubscription.objects.all()
    delivery_queryset = Delivery.objects.all()

    filtered_transactions = apply_date_filter(transaction_queryset, 'date_creation', date_range)
    filtered_payments = apply_date_filter(payment_queryset, 'date_creation', date_range)
    filtered_refunds = apply_date_filter(refund_queryset, 'date_demande', date_range)
    filtered_subscriptions = apply_date_filter(subscription_queryset, 'date_creation', date_range)
    filtered_deliveries = apply_date_filter(delivery_queryset, 'date_creation', date_range)

    subscription_transactions = filtered_transactions.filter(
        type_transaction=Transaction.TYPE_SUBSCRIPTION
    )

    return {
        'summary': {
            'revenu_total_plateforme': sum_money(filtered_transactions, 'montant_brut'),
            'total_commissions': sum_money(filtered_transactions, 'commission'),
            'total_remboursements': sum_money(
                filtered_refunds.filter(statut=Refund.STATUS_EXECUTED),
                'montant_approuve',
            ),
            'nombre_transactions': filtered_transactions.count(),
            'nombre_paiements': filtered_payments.count(),
            'paiements_valides': filtered_payments.filter(statut=Payment.STATUS_VALIDATED).count(),
            'paiements_refuses': filtered_payments.filter(statut=Payment.STATUS_REJECTED).count(),
            'paiements_en_attente': filtered_payments.filter(statut=Payment.STATUS_PENDING).count(),
            'nombre_pharmacies': Pharmacy.objects.count(),
            'nombre_utilisateurs': User.objects.count(),
            'nombre_abonnements_actifs': filtered_subscriptions.filter(
                statut=PharmacySubscription.STATUS_ACTIVE
            ).count(),
            'revenu_abonnements': sum_money(subscription_transactions, 'montant_brut'),
            'livraisons_totales': filtered_deliveries.count(),
        },
        'payments': get_payment_stats(filtered_payments),
        'deliveries': get_delivery_stats(filtered_deliveries),
        'subscriptions': get_subscription_stats(filtered_subscriptions),
        'charts': {
            'revenus_plateforme_par_mois': revenue_by_month(filtered_transactions),
            'commissions_par_mois': revenue_by_month(filtered_transactions),
            'top_pharmacies': get_top_pharmacies(filtered_transactions),
            'paiements_par_statut': count_by_status(filtered_payments),
            'abonnements_par_plan': get_subscription_stats(filtered_subscriptions)['par_plan'],
            'livraisons_par_statut': count_by_status(filtered_deliveries),
        },
    }


def get_top_pharmacies(transaction_queryset, limit=10):
    return [
        {
            'pharmacy': row['pharmacy'],
            'pharmacy_name': row['pharmacy__nom'],
            'revenu': row['revenu'],
            'commission': row['commission'],
            'net_pharmacie': row['net_pharmacie'],
            'transactions': row['transactions'],
        }
        for row in transaction_queryset.values('pharmacy', 'pharmacy__nom')
        .annotate(
            revenu=Coalesce(Sum('montant_brut'), ZERO_MONEY, output_field=MONEY_FIELD),
            commission=Coalesce(Sum('commission'), ZERO_MONEY, output_field=MONEY_FIELD),
            net_pharmacie=Coalesce(Sum('montant_pharmacie'), ZERO_MONEY, output_field=MONEY_FIELD),
            transactions=Count('id'),
        )
        .order_by('-revenu')[:limit]
    ]
