from django.urls import path

from .views import (
    AdminPlatformPaymentMethodView,
    AdminSubscriptionListView,
    AdminSubscriptionDashboardView,
    AdminSubscriptionPaymentListView,
    AdminSubscriptionPaymentRejectView,
    AdminSubscriptionPaymentValidateView,
    AdminSubscriptionPlanListCreateView,
    AdminSubscriptionPlanUpdateView,
    AdminSubscriptionRefundApproveView,
    AdminSubscriptionRefundListView,
    AdminSubscriptionRefundProcessedView,
    AdminSubscriptionRefundRejectView,
)


urlpatterns = [
    path('', AdminSubscriptionListView.as_view(), name='admin-subscription-list'),
    path('dashboard/', AdminSubscriptionDashboardView.as_view(), name='admin-subscription-dashboard'),
    path('plans/', AdminSubscriptionPlanListCreateView.as_view(), name='admin-subscription-plan-list-create'),
    path('plans/<int:pk>/', AdminSubscriptionPlanUpdateView.as_view(), name='admin-subscription-plan-update'),
    path('payment-methods/', AdminPlatformPaymentMethodView.as_view(), name='admin-platform-payment-methods'),
    path('payments/', AdminSubscriptionPaymentListView.as_view(), name='admin-subscription-payment-list'),
    path(
        'payments/<int:pk>/validate/',
        AdminSubscriptionPaymentValidateView.as_view(),
        name='admin-subscription-payment-validate',
    ),
    path(
        'payments/<int:pk>/reject/',
        AdminSubscriptionPaymentRejectView.as_view(),
        name='admin-subscription-payment-reject',
    ),
    path('refunds/', AdminSubscriptionRefundListView.as_view(), name='admin-subscription-refund-list'),
    path(
        'refunds/<int:pk>/approve/',
        AdminSubscriptionRefundApproveView.as_view(),
        name='admin-subscription-refund-approve',
    ),
    path(
        'refunds/<int:pk>/reject/',
        AdminSubscriptionRefundRejectView.as_view(),
        name='admin-subscription-refund-reject',
    ),
    path(
        'refunds/<int:pk>/processed/',
        AdminSubscriptionRefundProcessedView.as_view(),
        name='admin-subscription-refund-processed',
    ),
]
