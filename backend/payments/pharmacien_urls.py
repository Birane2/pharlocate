from django.urls import path

from .views import pharmacist_payment_methods


urlpatterns = [
    path('', pharmacist_payment_methods, name='pharmacien-payment-methods'),
]
