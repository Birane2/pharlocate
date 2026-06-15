from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from config.permissions import IsAdminRole
from pharmacies.models import Pharmacy
from reservations.models import Reservation
from reservations.services import calculate_reservation_amount, confirm_reservation
from subscriptions.models import SubscriptionPayment
from subscriptions.serializers import SubscriptionPaymentSerializer
from subscriptions.subscription_service import (
    reject_subscription_payment,
    validate_subscription_payment,
)

from .models import Payment, PaymentMethod, PharmacyPaymentMethod
from .serializers import (
    AdminPaymentSerializer,
    PaymentSerializer,
    PharmacyPaymentMethodSerializer,
)
from .services import reject_payment as reject_payment_service
from .services import validate_payment as validate_payment_service


def get_pharmacist_pharmacy(user):
    return Pharmacy.objects.filter(user=user).first()


def is_pharmacy_owner(user, pharmacy):
    return getattr(pharmacy, 'user_id', None) == user.id


def _zero():
    return 0


def _full_name(user):
    if not user:
        return ''
    return user.get_full_name() or getattr(user, 'phone_number', '') or user.username


def _file_url(request, file_field):
    if not file_field:
        return ''
    try:
        url = file_field.url
    except ValueError:
        return ''
    return request.build_absolute_uri(url) if request else url


def serialize_admin_reservation_payment(payment, request=None):
    return {
        'id': f'reservation-{payment.id}',
        'source_id': payment.id,
        'payment_type': 'reservation_payment',
        'reference': f'PAY-{payment.id:06d}',
        'user_name': _full_name(payment.user),
        'pharmacy_id': payment.pharmacy_id,
        'pharmacy_name': payment.pharmacy.nom if payment.pharmacy_id else '',
        'reservation_id': payment.reservation_id,
        'subscription_id': None,
        'payment_method': payment.payment_method.nom if payment.payment_method_id else '',
        'transaction_id': payment.transaction_id or '',
        'client_phone': payment.numero_client or '',
        'amount': payment.montant_total,
        'amount_medicines': payment.montant_medicaments,
        'delivery_fee': payment.frais_livraison,
        'status': payment.statut,
        'rejection_reason': payment.motif_refus or '',
        'proof_image_url': _file_url(request, payment.capture_paiement),
        'validated_by': _full_name(payment.valide_par),
        'validated_at': payment.date_validation,
        'created_at': payment.date_creation,
    }


def serialize_admin_subscription_payment(payment, request=None):
    status_map = {
        SubscriptionPayment.STATUS_PENDING: Payment.STATUS_PENDING,
        SubscriptionPayment.STATUS_VALIDATED: Payment.STATUS_VALIDATED,
        SubscriptionPayment.STATUS_REJECTED: Payment.STATUS_REJECTED,
        SubscriptionPayment.STATUS_CANCELLED: Payment.STATUS_CANCELLED,
    }
    return {
        'id': f'subscription-{payment.id}',
        'source_id': payment.id,
        'payment_type': 'subscription_payment',
        'reference': f'SUBPAY-{payment.id:06d}',
        'user_name': _full_name(payment.pharmacy.user) if payment.pharmacy_id else '',
        'pharmacy_id': payment.pharmacy_id,
        'pharmacy_name': payment.pharmacy.nom if payment.pharmacy_id else '',
        'reservation_id': None,
        'subscription_id': payment.subscription_id,
        'payment_method': payment.get_payment_method_display(),
        'transaction_id': payment.transaction_id or '',
        'client_phone': getattr(payment.pharmacy, 'telephone', '') or '',
        'amount': payment.amount,
        'amount_medicines': _zero(),
        'delivery_fee': _zero(),
        'status': status_map.get(payment.status, payment.status),
        'rejection_reason': payment.rejection_reason or '',
        'proof_image_url': _file_url(request, payment.proof_image),
        'validated_by': _full_name(payment.validated_by),
        'validated_at': payment.validated_at,
        'created_at': payment.created_at,
    }


def build_admin_payments(request):
    reservation_payments = Payment.objects.select_related(
        'reservation',
        'pharmacy',
        'user',
        'payment_method',
        'valide_par',
    ).order_by('-date_creation')
    subscription_payments = SubscriptionPayment.objects.select_related(
        'subscription__plan',
        'pharmacy__user',
        'validated_by',
    ).order_by('-created_at')

    items = [
        serialize_admin_reservation_payment(payment, request=request)
        for payment in reservation_payments
    ]
    items.extend(
        serialize_admin_subscription_payment(payment, request=request)
        for payment in subscription_payments
    )

    status_filter = request.query_params.get('status') or request.query_params.get('statut')
    type_filter = request.query_params.get('type') or request.query_params.get('payment_type')
    pharmacy_filter = request.query_params.get('pharmacy')
    date_filter = request.query_params.get('date')
    search = (request.query_params.get('search') or '').strip().lower()

    filtered = []
    for item in items:
        if status_filter and item['status'] != status_filter:
            continue
        if type_filter and item['payment_type'] != type_filter:
            continue
        if pharmacy_filter and str(item.get('pharmacy_id', '')) != str(pharmacy_filter):
            continue
        if date_filter and str(item['created_at'].date()) != date_filter:
            continue
        if search:
            haystack = ' '.join([
                item['reference'],
                item['transaction_id'],
                item['user_name'],
                item['pharmacy_name'],
                str(item['reservation_id'] or ''),
                str(item['subscription_id'] or ''),
            ]).lower()
            if search not in haystack:
                continue
        filtered.append(item)

    filtered.sort(key=lambda item: item['created_at'], reverse=True)
    return filtered


def get_admin_payment_object(identifier):
    value = str(identifier)
    if value.startswith('subscription-'):
        return 'subscription_payment', SubscriptionPayment.objects.select_related(
            'subscription__plan',
            'pharmacy__user',
            'validated_by',
        ).get(pk=value.replace('subscription-', ''))
    if value.startswith('reservation-'):
        return 'reservation_payment', Payment.objects.select_related(
            'reservation',
            'pharmacy',
            'user',
            'payment_method',
            'valide_par',
        ).get(pk=value.replace('reservation-', ''))
    return 'reservation_payment', Payment.objects.select_related(
        'reservation',
        'pharmacy',
        'user',
        'payment_method',
        'valide_par',
    ).get(pk=value)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_pharmacy_payment_methods(request, pharmacy_id):
    pharmacy = Pharmacy.objects.filter(pk=pharmacy_id).first()

    if pharmacy is None:
        return Response(
            {'error': 'Pharmacie introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    configuration = PharmacyPaymentMethod.objects.filter(
        pharmacy_id=pharmacy_id,
    ).first()
    number_fields = {
        PaymentMethod.CODE_BANKILY: 'bankily_number',
        PaymentMethod.CODE_MASRIVI: 'masrivi_number',
        PaymentMethod.CODE_CLICK: 'click_number',
        PaymentMethod.CODE_SEDAD: 'sedad_number',
        PaymentMethod.CODE_BCI_PAY: 'bci_pay_number',
    }
    configured_methods = []

    for code, field_name in number_fields.items():
        method = PaymentMethod.objects.filter(code=code, est_actif=True).first()
        configured_number = (
            getattr(configuration, field_name, '').strip()
            if configuration and configuration.is_active
            else ''
        )

        if not configured_number:
            continue

        configured_methods.append({
            'id': method.id if method else None,
            'code': code,
            'label': method.nom if method else code,
            'name': method.nom if method else code,
            'number': configured_number,
            'account_number': configured_number,
            'requires_proof': method.requires_proof if method else True,
            'configured': True,
            'beneficiary_name': configuration.display_beneficiary_name,
            'instructions': configuration.payment_instructions,
        })

    has_configured_methods = any(
        method['configured'] for method in configured_methods
    )

    if configuration is None or not configuration.is_active:
        message = "Aucun mode de paiement n'a encore ete configure par cette pharmacie."
    elif not has_configured_methods:
        message = "Aucun mode de paiement n'a encore ete configure par cette pharmacie."
    else:
        message = ''

    beneficiary_name = (
        configuration.display_beneficiary_name if configuration else pharmacy.nom
    )
    payment_instructions = (
        configuration.payment_instructions if configuration else ''
    )

    return Response({
        'id': configuration.id if configuration else None,
        'pharmacy': pharmacy.id,
        'pharmacy_id': pharmacy.id,
        'pharmacy_name': pharmacy.nom,
        'beneficiary_name': beneficiary_name,
        'payment_instructions': payment_instructions,
        'bankily_number': configuration.bankily_number if configuration else '',
        'masrivi_number': configuration.masrivi_number if configuration else '',
        'click_number': configuration.click_number if configuration else '',
        'sedad_number': configuration.sedad_number if configuration else '',
        'bci_pay_number': configuration.bci_pay_number if configuration else '',
        'is_active': bool(configuration and configuration.is_active),
        'configuration_exists': configuration is not None,
        'methods': configured_methods,
        'has_configured_methods': has_configured_methods,
        'message': message,
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def pharmacist_payment_methods(request):
    pharmacy = get_pharmacist_pharmacy(request.user)

    if not pharmacy:
        return Response({
            'error': 'Aucune pharmacie associée à ce pharmacien.'
        }, status=status.HTTP_404_NOT_FOUND)

    payment_methods, _ = PharmacyPaymentMethod.objects.get_or_create(
        pharmacy=pharmacy,
        defaults={
            'beneficiary_name': pharmacy.nom,
            'is_active': True,
        }
    )

    if request.method == 'GET':
        serializer = PharmacyPaymentMethodSerializer(payment_methods)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = PharmacyPaymentMethodSerializer(
        payment_methods,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save(pharmacy=pharmacy)

        return Response({
            'message': 'Méthodes de paiement mises à jour avec succès.',
            'data': serializer.data,
            'payment_methods': serializer.data,
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_payments(request):
    payments = Payment.objects.filter(
        user=request.user
    ).order_by('-created_at')

    serializer = PaymentSerializer(
        payments,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    try:
        payment = Payment.objects.get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    is_owner = payment.user == request.user
    is_pharmacist = is_pharmacy_owner(request.user, payment.pharmacy)
    is_admin = request.user.role == 'admin'

    if not (is_owner or is_pharmacist or is_admin):
        return Response({
            'error': "Vous n'avez pas la permission de voir ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    serializer = PaymentSerializer(
        data=request.data,
        context={'request': request}
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    reservation = serializer.validated_data.get('reservation')

    try:
        reservation = Reservation.objects.get(id=reservation.id)
    except Reservation.DoesNotExist:
        return Response({
            'error': 'Réservation introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if reservation.user != request.user:
        return Response({
            'error': "Vous ne pouvez payer que vos propres réservations."
        }, status=status.HTTP_403_FORBIDDEN)

    if hasattr(reservation, 'payment'):
        return Response({
            'error': 'Un paiement existe déjà pour cette réservation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    amount = calculate_reservation_amount(reservation)

    payment = serializer.save(
        user=request.user,
        pharmacy=reservation.pharmacie,
        montant_medicaments=reservation.montant_medicaments,
        frais_livraison=reservation.frais_livraison,
        montant_total=amount,
        statut='en_attente_verification',
    )

    response_serializer = PaymentSerializer(
        payment,
        context={'request': request}
    )

    return Response({
        'message': 'Paiement envoyé avec succès. Il est en attente de vérification.',
        'data': response_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_orders(request):
    payments = Payment.objects.filter(
        pharmacy__user=request.user
    ).select_related(
        'reservation',
        'pharmacy',
        'user',
        'payment_method',
    ).order_by('-date_creation')

    serializer = PaymentSerializer(
        payments,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_payments(request):
    payments = Payment.objects.select_related(
        'reservation',
        'pharmacy',
        'user',
        'payment_method',
    ).order_by('-date_creation')

    status_filter = request.query_params.get('status') or request.query_params.get('statut')
    if status_filter:
        payments = payments.filter(statut=status_filter)

    serializer = PaymentSerializer(
        payments,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_payment_center(request):
    serializer = AdminPaymentSerializer(
        build_admin_payments(request),
        many=True,
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_payment_summary(request):
    items = build_admin_payments(request)
    return Response({
        'total_payments': len(items),
        'pending_payments': sum(
            1 for item in items if item['status'] == Payment.STATUS_PENDING
        ),
        'validated_payments': sum(
            1 for item in items if item['status'] == Payment.STATUS_VALIDATED
        ),
        'rejected_payments': sum(
            1 for item in items if item['status'] == Payment.STATUS_REJECTED
        ),
        'cancelled_payments': sum(
            1 for item in items if item['status'] == Payment.STATUS_CANCELLED
        ),
        'refunded_payments': sum(
            1 for item in items if item['status'] == Payment.STATUS_REFUNDED
        ),
        'total_amount': sum((item['amount'] for item in items), 0),
        'validated_amount': sum(
            (item['amount'] for item in items if item['status'] == Payment.STATUS_VALIDATED),
            0,
        ),
        'subscription_amount': sum(
            (item['amount'] for item in items if item['payment_type'] == 'subscription_payment'),
            0,
        ),
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_payment_detail(request, pk):
    try:
        payment_type, payment = get_admin_payment_object(pk)
    except (Payment.DoesNotExist, SubscriptionPayment.DoesNotExist, ValueError):
        return Response(
            {'error': 'Paiement introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = (
        serialize_admin_subscription_payment(payment, request=request)
        if payment_type == 'subscription_payment'
        else serialize_admin_reservation_payment(payment, request=request)
    )
    return Response(AdminPaymentSerializer(data).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_payments_by_status(request, payment_status):
    items = [
        item
        for item in build_admin_payments(request)
        if item['status'] == payment_status
    ]
    serializer = AdminPaymentSerializer(
        items,
        many=True,
    )
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_validate_payment(request, pk):
    try:
        payment_type, payment = get_admin_payment_object(pk)
        if payment_type == 'subscription_payment':
            validate_subscription_payment(payment, request.user)
            data = serialize_admin_subscription_payment(payment, request=request)
        else:
            validate_payment_service(payment, request.user)
            payment.refresh_from_db()
            data = serialize_admin_reservation_payment(payment, request=request)
    except (Payment.DoesNotExist, SubscriptionPayment.DoesNotExist, ValueError):
        return Response(
            {'error': 'Paiement introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Paiement valide avec succes.',
        'payment': AdminPaymentSerializer(data).data,
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_reject_payment(request, pk):
    reason = (
        request.data.get('reason')
        or request.data.get('motif_refus')
        or request.data.get('rejection_reason')
        or ''
    )

    try:
        payment_type, payment = get_admin_payment_object(pk)
        if payment_type == 'subscription_payment':
            reject_subscription_payment(payment, request.user, reason=reason)
            data = serialize_admin_subscription_payment(payment, request=request)
        else:
            reject_payment_service(payment, request.user, reason)
            payment.refresh_from_db()
            data = serialize_admin_reservation_payment(payment, request=request)
    except (Payment.DoesNotExist, SubscriptionPayment.DoesNotExist, ValueError):
        return Response(
            {'error': 'Paiement introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Paiement refuse.',
        'payment': AdminPaymentSerializer(data).data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pharmacist_order_detail(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy',
            'user',
            'payment_method',
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de voir cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def validate_payment(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de valider ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.statut != 'en_attente_verification':
        return Response({
            'error': 'Ce paiement ne peut plus être validé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_payment_service(payment, request.user)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Paiement validé avec succès.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def reject_payment(request, pk):
    reason = request.data.get('reason') or request.data.get('motif_refus') or ''

    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Paiement introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de refuser ce paiement."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.statut != 'en_attente_verification':
        return Response({
            'error': 'Ce paiement ne peut plus être refusé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        reject_payment_service(payment, request.user, reason)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Paiement refusé.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


def decrease_stock_for_reservation(reservation):
    if not hasattr(reservation, 'items'):
        return

    for item in reservation.items.all():
        stock = item.medicament.stocks.filter(
            pharmacie=reservation.pharmacie
        ).first()

        if stock is None:
            raise ValueError(
                f"Stock introuvable pour {item.medicament.nom}."
            )

        if stock.quantite < item.quantite:
            raise ValueError(
                f"Stock insuffisant pour {item.medicament.nom}."
            )

        stock.quantite -= item.quantite
        stock.save()


def update_reservation_status(reservation, new_status):
    reservation.statut = new_status
    reservation.save()
    return reservation


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def confirm_order(request, pk):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de confirmer cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    if payment.statut != 'valide':
        return Response({
            'error': 'Le paiement doit être validé avant confirmation.'
        }, status=status.HTTP_400_BAD_REQUEST)

    reservation = payment.reservation

    if reservation.statut != 'en_attente':
        return Response({
            'error': 'Cette commande ne peut plus être confirmée.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        confirm_reservation(reservation, request.user)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Commande confirmée avec succès.',
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


def change_order_status(request, pk, current_allowed, new_status, message):
    try:
        payment = Payment.objects.select_related(
            'reservation',
            'pharmacy'
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({
            'error': 'Commande introuvable.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not is_pharmacy_owner(request.user, payment.pharmacy):
        return Response({
            'error': "Vous n'avez pas la permission de modifier cette commande."
        }, status=status.HTTP_403_FORBIDDEN)

    reservation = payment.reservation

    if reservation.statut not in current_allowed:
        return Response({
            'error': 'Changement de statut non autorisé.'
        }, status=status.HTTP_400_BAD_REQUEST)

    reservation.statut = new_status
    reservation.save()

    return Response({
        'message': message,
        'data': PaymentSerializer(payment, context={'request': request}).data
    }, status=status.HTTP_200_OK)


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def prepare_order(request, pk):
    return change_order_status(
        request,
        pk,
        current_allowed=['confirmee'],
        new_status='en_preparation',
        message='Commande passée en préparation.'
    )


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def ready_order(request, pk):
    return change_order_status(
        request,
        pk,
        current_allowed=['en_preparation'],
        new_status='prete',
        message='Commande marquée comme prête.'
    )


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def delivered_order(request, pk):
    response = change_order_status(
        request,
        pk,
        current_allowed=['prete', 'en_preparation'],
        new_status='livree',
        message='Commande marquée comme livrée.'
    )

    if response.status_code == 200:
        try:
            payment = Payment.objects.get(pk=pk)

            if hasattr(payment.reservation, 'delivery'):
                delivery = payment.reservation.delivery
                delivery.statut = 'livree'
                delivery.date_livraison_reelle = timezone.now()
                delivery.save(update_fields=['statut', 'date_livraison_reelle'])
        except Payment.DoesNotExist:
            pass

    return response
