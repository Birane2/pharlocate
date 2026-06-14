from django.urls import path

from .views import InvoiceDetailView, InvoiceDownloadView, MyInvoiceListView


urlpatterns = [
    path('', MyInvoiceListView.as_view(), name='invoice-my-list'),
    path('<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('<int:pk>/download/', InvoiceDownloadView.as_view(), name='invoice-download'),
]
