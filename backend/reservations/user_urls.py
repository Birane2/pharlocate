from django.urls import path

from .views import (
    ReservationDetailView,
    ReservationListCreateView,
    cancel_reservation,
)

urlpatterns = [
    path('', ReservationListCreateView.as_view(), name='user_reservations'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='user_reservation_detail'),
    path('<int:pk>/cancel/', cancel_reservation, name='user_reservation_cancel'),
]