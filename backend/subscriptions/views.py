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

from .models import PharmacySubscription, SubscriptionPlan
from .permissions import IsSubscriptionOwnerPharmacistOrAdmin
from .serializers import (
    PharmacySubscriptionSerializer,
    SubscriptionPlanSerializer,
    SubscriptionRequestSerializer,
)
from .subscription_service import (
    activate_subscription,
    assign_free_plan,
    cancel_subscription,
    check_plan_limits,
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


class AdminSubscriptionPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    queryset = SubscriptionPlan.objects.all().order_by('prix_mensuel', 'nom')


class AdminSubscriptionPlanUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    queryset = SubscriptionPlan.objects.all()
