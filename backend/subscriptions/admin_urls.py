from django.urls import path

from .views import (
    AdminSubscriptionListView,
    AdminSubscriptionPlanListCreateView,
    AdminSubscriptionPlanUpdateView,
)


urlpatterns = [
    path('', AdminSubscriptionListView.as_view(), name='admin-subscription-list'),
    path('plans/', AdminSubscriptionPlanListCreateView.as_view(), name='admin-subscription-plan-list-create'),
    path('plans/<int:pk>/', AdminSubscriptionPlanUpdateView.as_view(), name='admin-subscription-plan-update'),
]
