from django.urls import path

from .views import (
    calculate_delivery_fee_view,
    create_delivery,
    delivery_detail,
    my_deliveries,
    pharmacist_deliveries,
    update_delivery_status,
)

urlpatterns = [
    path(
        'calculate-fee/',
        calculate_delivery_fee_view,
        name='calculate_delivery_fee',
    ),
    path(
        'deliveries/create/',
        create_delivery,
        name='create_delivery',
    ),
    path(
        'deliveries/my-deliveries/',
        my_deliveries,
        name='my_deliveries',
    ),
    path(
        'deliveries/<int:pk>/',
        delivery_detail,
        name='delivery_detail',
    ),
    path(
        'deliveries/<int:pk>/status/',
        update_delivery_status,
        name='update_delivery_status',
    ),
    path(
        'pharmacien/deliveries/',
        pharmacist_deliveries,
        name='pharmacist_deliveries',
    ),
]
