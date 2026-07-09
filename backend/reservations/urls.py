from django.urls import path

from .views import (
    ReservationDetailView,
    ReservationListCreateView,
    cancel_reservation,
    checkout_reservation,
    delete_reservation,
)

urlpatterns = [
    path('checkout/', checkout_reservation, name='reservation_checkout'),
    path('', ReservationListCreateView.as_view(), name='pharmacien_reservations'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='pharmacien_reservation_detail'),
    path('<int:pk>/cancel/', cancel_reservation, name='pharmacien_reservation_cancel'),
    path('<int:pk>/delete/', delete_reservation, name='reservation_delete'),
]
