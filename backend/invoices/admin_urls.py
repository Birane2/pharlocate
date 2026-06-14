from django.urls import path

from .views import AdminInvoiceListView


urlpatterns = [
    path('', AdminInvoiceListView.as_view(), name='invoice-admin-list'),
]
