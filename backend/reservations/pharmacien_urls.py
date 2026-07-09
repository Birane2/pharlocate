from django.urls import path

from .views import (
    ReservationDetailView,
    cancel_reservation,
    pharmacien_reservation_list,
    pharmacien_reservation_stats,
)
from payments.views import (
    confirm_order,
    delete_order,
    delivered_order,
    picked_up_order,
    prepare_order,
    ready_order,
    reject_payment,
    start_delivery_order,
    validate_payment,
)

urlpatterns = [
    path(
        '',
        pharmacien_reservation_list,
        name='pharmacien_reservations'
    ),
    path(
        'stats/',
        pharmacien_reservation_stats,
        name='pharmacien_reservation_stats',
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
    path(
        '<int:pk>/validate-payment/',
        validate_payment,
        name='pharmacien_reservation_validate_payment',
    ),
    path(
        '<int:pk>/reject-payment/',
        reject_payment,
        name='pharmacien_reservation_reject_payment',
    ),
    path('<int:pk>/confirm/', confirm_order, name='pharmacien_reservation_confirm'),
    path('<int:pk>/prepare/', prepare_order, name='pharmacien_reservation_prepare'),
    path('<int:pk>/ready/', ready_order, name='pharmacien_reservation_ready'),
    path('<int:pk>/picked-up/', picked_up_order, name='pharmacien_reservation_picked_up'),
    path('<int:pk>/start-delivery/', start_delivery_order, name='pharmacien_reservation_start_delivery'),
    path('<int:pk>/delivered/', delivered_order, name='pharmacien_reservation_delivered'),
    path('<int:pk>/delete/', delete_order, name='pharmacien_reservation_delete'),
]
