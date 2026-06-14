from django.urls import path

from .views import (
    AdminDeliveryListView,
    DeliveryCreateView,
    DeliveryDetailView,
    DeliveryStatusUpdateView,
    MyDeliveryListView,
    PharmacienDeliveryListView,
)

urlpatterns = [
    path('create/', DeliveryCreateView.as_view(), name='delivery-create'),
    path('my-deliveries/', MyDeliveryListView.as_view(), name='delivery-my-list'),
    path('pharmacien/', PharmacienDeliveryListView.as_view(), name='delivery-pharmacien-list'),
    path('admin/', AdminDeliveryListView.as_view(), name='delivery-admin-list'),
    path('<int:pk>/', DeliveryDetailView.as_view(), name='delivery-detail'),
    path('<int:pk>/status/', DeliveryStatusUpdateView.as_view(), name='delivery-status-update'),
]
