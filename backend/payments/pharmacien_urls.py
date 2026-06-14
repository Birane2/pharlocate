from django.urls import path

from .views import PharmacienPaymentMethodView


urlpatterns = [
    path('', PharmacienPaymentMethodView.as_view(), name='pharmacien-payment-methods'),
]
