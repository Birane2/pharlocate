from django.urls import path

from .views import (
    PharmacienCurrentSubscriptionView,
    PharmacienSubscriptionCancelView,
    SubscriptionPaymentCreateView,
    SubscriptionRefundRequestView,
    SubscriptionRequestView,
)


urlpatterns = [
    path('', PharmacienCurrentSubscriptionView.as_view(), name='pharmacien-current-subscription'),
    path('subscribe/', SubscriptionRequestView.as_view(), name='pharmacien-subscription-subscribe'),
    path('payment/', SubscriptionPaymentCreateView.as_view(), name='pharmacien-subscription-payment'),
    path('cancel/', PharmacienSubscriptionCancelView.as_view(), name='pharmacien-subscription-cancel'),
    path('refund-request/', SubscriptionRefundRequestView.as_view(), name='pharmacien-subscription-refund-request'),
]
