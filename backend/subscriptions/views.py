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

from .models import (
    PharmacySubscription,
    PlatformPaymentMethod,
    SubscriptionPayment,
    SubscriptionPlan,
)
from .permissions import IsSubscriptionOwnerPharmacistOrAdmin
from .serializers import (
    PlatformPaymentMethodSerializer,
    PharmacySubscriptionSerializer,
    PublicPlatformPaymentMethodSerializer,
    SubscriptionPaymentCreateSerializer,
    SubscriptionPaymentSerializer,
    SubscriptionPlanSerializer,
    SubscriptionRequestSerializer,
)
from .subscription_service import (
    activate_subscription,
    assign_free_plan,
    cancel_subscription,
    check_plan_limits,
    reject_subscription_payment,
    validate_subscription_payment,
)


def format_django_validation_error(exc):
    if hasattr(exc, 'message_dict'):
        return exc.message_dict
    if hasattr(exc, 'messages'):
        return {'detail': exc.messages}
    return {'detail': str(exc)}


class SubscriptionPlanListView(generics.ListAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(est_actif=True).order_by('prix_mensuel', 'nom')


class PharmacienCurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            return Response(
                {'error': 'Aucune pharmacie associee a ce pharmacien.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        subscription = (
            pharmacy.subscriptions.filter(statut=PharmacySubscription.STATUS_ACTIVE)
            .select_related('plan', 'payment', 'transaction')
            .first()
        )
        if not subscription:
            subscription = assign_free_plan(pharmacy)

        return Response(
            {
                'subscription': PharmacySubscriptionSerializer(subscription).data,
                'limits': check_plan_limits(pharmacy),
            }
        )


class SubscriptionRequestView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def post(self, request):
        serializer = SubscriptionRequestSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            subscription = serializer.save()
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Demande abonnement creee avec succes.',
                'subscription': PharmacySubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PlatformPaymentMethodPublicView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage]

    def get(self, request):
        config = PlatformPaymentMethod.objects.filter(is_active=True).first()
        if not config:
            return Response(
                {
                    'is_active': False,
                    'beneficiary_name': 'PharmaLocate',
                    'payment_instructions': '',
                    'methods': [],
                    'message': 'Aucun mode de paiement PharmaLocate configure.',
                }
            )
        return Response(PublicPlatformPaymentMethodSerializer(config).data)


class AdminPlatformPaymentMethodView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_object(self):
        obj = PlatformPaymentMethod.objects.filter(is_active=True).first()
        if obj:
            return obj
        return PlatformPaymentMethod.objects.order_by('-updated_at').first()

    def get(self, request):
        obj = self.get_object()
        if not obj:
            obj = PlatformPaymentMethod.objects.create(
                beneficiary_name='PharmaLocate',
                is_active=True,
            )
        return Response(PlatformPaymentMethodSerializer(obj).data)

    def post(self, request):
        return self._save(request)

    def put(self, request):
        return self._save(request)

    def _save(self, request):
        obj = self.get_object()
        serializer = PlatformPaymentMethodSerializer(
            obj,
            data=request.data,
            partial=bool(obj),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(is_active=request.data.get('is_active', True))
        return Response(
            {
                'message': 'Modes de paiement PharmaLocate sauvegardes.',
                'config': serializer.data,
            }
        )


class SubscriptionPaymentCreateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def post(self, request):
        serializer = SubscriptionPaymentCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(
            {
                'message': 'Preuve de paiement abonnement envoyee.',
                'payment': SubscriptionPaymentSerializer(
                    payment,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SubscriptionActivateView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsSubscriptionOwnerPharmacistOrAdmin,
    ]

    def post(self, request, pk):
        subscription = get_object_or_404(
            PharmacySubscription.objects.select_related('pharmacy', 'plan', 'payment'),
            pk=pk,
        )
        self.check_object_permissions(request, subscription)

        try:
            subscription = activate_subscription(subscription, activated_by=request.user)
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Abonnement active avec succes.',
                'subscription': PharmacySubscriptionSerializer(subscription).data,
            }
        )


class SubscriptionCancelView(APIView):
    permission_classes = [
        IsAuthenticatedWithTokenMessage,
        IsSubscriptionOwnerPharmacistOrAdmin,
    ]

    def post(self, request, pk):
        subscription = get_object_or_404(
            PharmacySubscription.objects.select_related('pharmacy', 'plan'),
            pk=pk,
        )
        self.check_object_permissions(request, subscription)

        try:
            subscription = cancel_subscription(subscription)
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Abonnement annule avec succes.',
                'subscription': PharmacySubscriptionSerializer(subscription).data,
            }
        )


class AdminSubscriptionListView(generics.ListAPIView):
    serializer_class = PharmacySubscriptionSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        return (
            PharmacySubscription.objects.select_related('pharmacy', 'plan', 'payment', 'transaction')
            .order_by('-date_creation')
        )


class AdminSubscriptionPaymentListView(generics.ListAPIView):
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_queryset(self):
        queryset = SubscriptionPayment.objects.select_related(
            'pharmacy',
            'subscription__plan',
            'validated_by',
        ).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminSubscriptionPaymentValidateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        payment = get_object_or_404(
            SubscriptionPayment.objects.select_related('subscription__plan', 'pharmacy'),
            pk=pk,
        )
        try:
            payment = validate_subscription_payment(payment, request.user)
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                'message': 'Paiement abonnement valide et abonnement active.',
                'payment': SubscriptionPaymentSerializer(
                    payment,
                    context={'request': request},
                ).data,
            }
        )


class AdminSubscriptionPaymentRejectView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        payment = get_object_or_404(
            SubscriptionPayment.objects.select_related('subscription__plan', 'pharmacy'),
            pk=pk,
        )
        reason = request.data.get('rejection_reason') or request.data.get('reason') or ''
        try:
            payment = reject_subscription_payment(payment, request.user, reason=reason)
        except DjangoValidationError as exc:
            return Response(format_django_validation_error(exc), status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                'message': 'Paiement abonnement refuse.',
                'payment': SubscriptionPaymentSerializer(
                    payment,
                    context={'request': request},
                ).data,
            }
        )


class AdminSubscriptionPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    queryset = SubscriptionPlan.objects.all().order_by('prix_mensuel', 'nom')


class AdminSubscriptionPlanUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    queryset = SubscriptionPlan.objects.all()
