from django.urls import path

from .views import PharmacienInvoiceListView


urlpatterns = [
    path('', PharmacienInvoiceListView.as_view(), name='invoice-pharmacien-list'),
]
