from django.urls import path

from .views import (
    public_pharmacy_payment_methods,
    pharmacist_payment_methods,
)

urlpatterns = [
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