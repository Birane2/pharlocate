from django.urls import path

from .views import (
    ReservationListCreateView,
    ReservationDetailView,
    cancel_reservation,
)

urlpatterns = [
    path(
        '',
        ReservationListCreateView.as_view(),
        name='pharmacien_reservations'
    ),

    path(
        '<int:pk>/',
        ReservationDetailView.as_view(),
        name='pharmacien_reservation_detail'
    ),

    path(
        '<int:pk>/cancel/',
        cancel_reservation,
        name='pharmacien_reservation_cancel'
    ),
]