from django.urls import path

from .views import (
    PharmacienCommissionInvoiceDetailView,
    PharmacienCommissionInvoiceListView,
    PharmacienCommissionInvoicePayView,
    PharmacienFinanceDashboardView,
    PharmacienFinanceExportPlaceholderView,
    PharmacienFinancePaymentsView,
    PharmacienFinanceRevenuesView,
    PharmacienFinanceTransactionsView,
)


urlpatterns = [
    path('dashboard/', PharmacienFinanceDashboardView.as_view(), name='pharmacien-finance-dashboard'),
    path('payments/', PharmacienFinancePaymentsView.as_view(), name='pharmacien-finance-payments'),
    path('revenues/', PharmacienFinanceRevenuesView.as_view(), name='pharmacien-finance-revenues'),
    path('transactions/', PharmacienFinanceTransactionsView.as_view(), name='pharmacien-finance-transactions'),
    path('export/', PharmacienFinanceExportPlaceholderView.as_view(), name='pharmacien-finance-export'),
    # Commission invoices — canonical URLs (spec)
    path('invoices/', PharmacienCommissionInvoiceListView.as_view(), name='pharmacien-commission-invoices'),
    path('invoices/<int:pk>/', PharmacienCommissionInvoiceDetailView.as_view(), name='pharmacien-commission-invoice-detail'),
    path('invoices/<int:pk>/pay/', PharmacienCommissionInvoicePayView.as_view(), name='pharmacien-commission-invoice-pay'),
    # Aliases kept for backward-compat
    path('commission-invoices/', PharmacienCommissionInvoiceListView.as_view(), name='pharmacien-commission-invoices-alias'),
    path('commission-invoices/<int:pk>/', PharmacienCommissionInvoiceDetailView.as_view(), name='pharmacien-commission-invoice-detail-alias'),
    path('commission-invoices/<int:pk>/pay/', PharmacienCommissionInvoicePayView.as_view(), name='pharmacien-commission-invoice-pay-alias'),
]
