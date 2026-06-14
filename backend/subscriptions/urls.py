from django.urls import path

from .views import (
    SubscriptionActivateView,
    SubscriptionCancelView,
    SubscriptionPlanListView,
    SubscriptionRequestView,
)


urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription-plan-list'),
    path('subscribe/', SubscriptionRequestView.as_view(), name='subscription-request'),
    path('<int:pk>/activate/', SubscriptionActivateView.as_view(), name='subscription-activate'),
    path('<int:pk>/cancel/', SubscriptionCancelView.as_view(), name='subscription-cancel'),
]
