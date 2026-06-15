from django.urls import path

from .views import (
    admin_payments,
    delivered_order,
    my_payments,
    payment_detail,
    pharmacist_order_detail,
    pharmacist_orders,
    public_pharmacy_payment_methods,
    pharmacist_payment_methods,
    prepare_order,
    ready_order,
    reject_payment,
    validate_payment,
)

urlpatterns = [
    path('my-payments/', my_payments, name='my_payments'),
    path('pharmacien/', pharmacist_orders, name='pharmacist_orders'),
    path('admin/pending/', admin_payments, name='admin_payments'),
    path('<int:pk>/', payment_detail, name='payment_detail'),
    path('<int:pk>/validate/', validate_payment, name='payment_validate'),
    path('<int:pk>/reject/', reject_payment, name='payment_reject'),
    path('<int:pk>/prepare/', prepare_order, name='payment_prepare_order'),
    path('<int:pk>/ready/', ready_order, name='payment_ready_order'),
    path('<int:pk>/delivered/', delivered_order, name='payment_delivered_order'),
    path('<int:pk>/order/', pharmacist_order_detail, name='payment_order_detail'),
    path(
        'pharmacies/<int:pharmacy_id>/payment-methods/',
        public_pharmacy_payment_methods,
        name='public_pharmacy_payment_methods'
    ),
    path(
        'pharmacien/payment-methods/',
        pharmacist_payment_methods,
        name='pharmacist_payment_methods'
    ),
]
