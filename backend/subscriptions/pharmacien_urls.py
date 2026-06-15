from django.urls import path

from .views import (
    PharmacienCurrentSubscriptionView,
    SubscriptionPaymentCreateView,
    SubscriptionRequestView,
)


urlpatterns = [
    path('', PharmacienCurrentSubscriptionView.as_view(), name='pharmacien-current-subscription'),
    path('subscribe/', SubscriptionRequestView.as_view(), name='pharmacien-subscription-subscribe'),
    path('payment/', SubscriptionPaymentCreateView.as_view(), name='pharmacien-subscription-payment'),
]
