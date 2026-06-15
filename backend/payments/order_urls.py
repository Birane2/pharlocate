from django.urls import path

from .views import (
    confirm_order,
    delivered_order,
    pharmacist_order_detail,
    pharmacist_orders,
    prepare_order,
    ready_order,
    reject_payment,
    validate_payment,
)


urlpatterns = [
    path('', pharmacist_orders, name='pharmacist_orders'),
    path('<int:pk>/', pharmacist_order_detail, name='pharmacist_order_detail'),
    path(
        '<int:pk>/validate-payment/',
        validate_payment,
        name='pharmacist_order_validate_payment',
    ),
    path(
        '<int:pk>/reject-payment/',
        reject_payment,
        name='pharmacist_order_reject_payment',
    ),
    path('<int:pk>/confirm/', confirm_order, name='pharmacist_order_confirm'),
    path('<int:pk>/prepare/', prepare_order, name='pharmacist_order_prepare'),
    path('<int:pk>/ready/', ready_order, name='pharmacist_order_ready'),
    path('<int:pk>/delivered/', delivered_order, name='pharmacist_order_delivered'),
]
