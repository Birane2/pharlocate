from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, parsers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import (
    IsAdminRole,
    IsAuthenticatedWithTokenMessage,
    IsPharmacien,
)

from pharmacies.models import Pharmacy

from .models import Payment, PaymentMethod, PharmacyPaymentMethod
from .permissions import (
    IsAdminOrPaymentOwnerOrPharmacist,
    is_admin_user,
    is_pharmacy_owner,
)
from .serializers import (
    PaymentCreateSerializer,
    PaymentMethodSerializer,
    PaymentProofSerializer,
    PaymentRejectSerializer,
    PaymentSerializer,
    PharmacyPaymentMethodSerializer,
    PublicPharmacyPaymentMethodSerializer,
)
from .services import reject_payment, validate_payment


def format_django_validation_error(exc):
    if hasattr(exc, 'message_dict'):
        return exc.message_dict

    if hasattr(exc, 'messages'):
        return {'detail': exc.messages}

    return {'detail': str(exc)}


class PaymentMethodListView(generics.ListAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return PaymentMethod.objects.filter(est_actif=True).order_by('nom')


class PublicPharmacyPaymentMethodView(APIView):
    permission_classes = []

    def get(self, request, pharmacy_id):
        pharmacy = get_object_or_404(
            Pharmacy.objects.filter(est_valide=True, statut_validation='validee'),
            pk=pharmacy_id,
        )
        config, _ = PharmacyPaymentMethod.objects.get_or_create(pharmacy=pharmacy)
        serializer = PublicPharmacyPaymentMethodSerializer(
            config,
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class PharmacienPaymentMethodView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def _get_pharmacy(self, request):
        return get_object_or_404(Pharmacy, user=request.user)

    def _get_config(self, request):
        pharmacy = self._get_pharmacy(request)
        config, _ = PharmacyPaymentMethod.objects.get_or_create(pharmacy=pharmacy)
        return config

    def get(self, request):
        config = self._get_config(request)
        serializer = PharmacyPaymentMethodSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        config = self._get_config(request)
        serializer = PharmacyPaymentMethodSerializer(
            config,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                'message': 'Methodes de paiement mises a jour avec succes.',
                'payment_methods': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        return self.post(request)


class PaymentCreateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        serializer = PaymentCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            payment = serializer.save()
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': (
                    'Paiement cree avec succes. En attente de validation.'
                    if payment.statut == Payment.STATUS_PENDING
                    else 'Mode de paiement enregistre avec succes.'
                ),
                'payment': PaymentSerializer(payment, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentSubmitProofView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrPaymentOwnerOrPharmacist,
    ]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        payment = get_object_or_404(
            Payment.objects.select_related('reservation', 'user', 'pharmacy', 'payment_method'),
            pk=pk,
        )
        self.check_object_permissions(request, payment)

        if payment.user_id != request.user.id:
            return Response(
                {'error': 'Seul le proprietaire du paiement peut envoyer une preuve.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PaymentProofSerializer(
            payment,
            data=request.data,
            context={'payment': payment},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        try:
            payment = serializer.save()
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': 'Preuve de paiement envoyee avec succes.',
                'payment': PaymentSerializer(payment, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class MyPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return (
            Payment.objects.filter(user=self.request.user)
            .select_related('reservation', 'user', 'pharmacy', 'payment_method', 'valide_par')
            .order_by('-date_creation')
        )


class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrPaymentOwnerOrPharmacist,
    ]

    def get_queryset(self):
        return (
            Payment.objects.select_related(
                'reservation',
                'user',
                'pharmacy',
                'payment_method',
                'valide_par',
            )
            .order_by('-date_creation')
        )


class PaymentValidateView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrPaymentOwnerOrPharmacist,
    ]

    def post(self, request, pk):
        payment = get_object_or_404(
            Payment.objects.select_related('reservation', 'user', 'pharmacy', 'payment_method'),
            pk=pk,
        )
        self.check_object_permissions(request, payment)

        if not (is_admin_user(request.user) or is_pharmacy_owner(request.user, payment)):
            return Response(
                {'error': 'Seuls le pharmacien de la pharmacie ou un administrateur peuvent valider.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            payment = validate_payment(payment, request.user)
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': 'Paiement valide avec succes.',
                'payment': PaymentSerializer(payment, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class PaymentRejectView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsAdminOrPaymentOwnerOrPharmacist,
    ]

    def post(self, request, pk):
        payment = get_object_or_404(
            Payment.objects.select_related('reservation', 'user', 'pharmacy', 'payment_method'),
            pk=pk,
        )
        self.check_object_permissions(request, payment)

        if not (is_admin_user(request.user) or is_pharmacy_owner(request.user, payment)):
            return Response(
                {'error': 'Seuls le pharmacien de la pharmacie ou un administrateur peuvent refuser.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = reject_payment(
                payment=payment,
                rejected_by=request.user,
                motif_refus=serializer.validated_data['motif_refus'],
            )
        except DjangoValidationError as exc:
            return Response(
                format_django_validation_error(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': 'Paiement refuse avec succes.',
                'payment': PaymentSerializer(payment, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class PharmacienPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get_queryset(self):
        return (
            Payment.objects.filter(pharmacy__user=self.request.user)
            .select_related('reservation', 'user', 'pharmacy', 'payment_method', 'valide_par')
            .order_by('-date_creation')
        )


class AdminPendingPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            Payment.objects.filter(statut=Payment.STATUS_PENDING)
            .select_related('reservation', 'user', 'pharmacy', 'payment_method', 'valide_par')
            .order_by('-date_creation')
        )
