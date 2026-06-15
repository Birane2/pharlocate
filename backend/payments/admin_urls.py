from django.urls import path

from .models import Payment
from .views import (
    admin_payment_center,
    admin_payment_detail,
    admin_payment_summary,
    admin_payments_by_status,
    admin_reject_payment,
    admin_validate_payment,
)


urlpatterns = [
    path('', admin_payment_center, name='admin-payment-center'),
    path('summary/', admin_payment_summary, name='admin-payment-summary'),
    path(
        'pending/',
        lambda request: admin_payments_by_status(request, Payment.STATUS_PENDING),
        name='admin-payment-pending',
    ),
    path(
        'validated/',
        lambda request: admin_payments_by_status(request, Payment.STATUS_VALIDATED),
        name='admin-payment-validated',
    ),
    path(
        'rejected/',
        lambda request: admin_payments_by_status(request, Payment.STATUS_REJECTED),
        name='admin-payment-rejected',
    ),
    path(
        'refunds/',
        lambda request: admin_payments_by_status(request, Payment.STATUS_REFUNDED),
        name='admin-payment-refunds',
    ),
    path('<str:pk>/', admin_payment_detail, name='admin-payment-detail'),
    path('<str:pk>/validate/', admin_validate_payment, name='admin-payment-validate'),
    path('<str:pk>/reject/', admin_reject_payment, name='admin-payment-reject'),
]
