from django.urls import path

from .views import (
    AdminCommissionInvoiceDetailView,
    AdminCommissionInvoiceGenerateView,
    AdminCommissionInvoiceListView,
    AdminCommissionPaymentRejectView,
    AdminCommissionPaymentValidateView,
    AdminFinanceCommissionsView,
    AdminFinanceDashboardView,
    AdminFinanceExportPlaceholderView,
    AdminFinancePaymentMethodsView,
    AdminFinancePaymentsView,
    AdminFinanceRevenuesView,
    AdminFinanceRefundsView,
    AdminFinanceSubscriptionsView,
    AdminFinanceTopPharmaciesView,
    AdminFinanceTransactionsView,
)


urlpatterns = [
    path('dashboard/', AdminFinanceDashboardView.as_view(), name='admin-finance-dashboard'),
    path('payments/', AdminFinancePaymentsView.as_view(), name='admin-finance-payments'),
    path('transactions/', AdminFinanceTransactionsView.as_view(), name='admin-finance-transactions'),
    path('subscriptions/', AdminFinanceSubscriptionsView.as_view(), name='admin-finance-subscriptions'),
    path('refunds/', AdminFinanceRefundsView.as_view(), name='admin-finance-refunds'),
    path('revenues/', AdminFinanceRevenuesView.as_view(), name='admin-finance-revenues'),
    path('commissions/', AdminFinanceCommissionsView.as_view(), name='admin-finance-commissions'),
    path('top-pharmacies/', AdminFinanceTopPharmaciesView.as_view(), name='admin-finance-top-pharmacies'),
    path('payment-methods/', AdminFinancePaymentMethodsView.as_view(), name='admin-finance-payment-methods'),
    path('export/', AdminFinanceExportPlaceholderView.as_view(), name='admin-finance-export'),
    path('commission-invoices/', AdminCommissionInvoiceListView.as_view(), name='admin-commission-invoices'),
    path('commission-invoices/generate/', AdminCommissionInvoiceGenerateView.as_view(), name='admin-commission-invoice-generate'),
    path('commission-invoices/<int:pk>/', AdminCommissionInvoiceDetailView.as_view(), name='admin-commission-invoice-detail'),
    # Canonical payment action URLs (spec)
    path('commission-invoice-payments/<int:pk>/validate/', AdminCommissionPaymentValidateView.as_view(), name='admin-commission-payment-validate'),
    path('commission-invoice-payments/<int:pk>/reject/', AdminCommissionPaymentRejectView.as_view(), name='admin-commission-payment-reject'),
    # Aliases for backward-compat
    path('commission-invoices/payments/<int:pk>/validate/', AdminCommissionPaymentValidateView.as_view(), name='admin-commission-payment-validate-alias'),
    path('commission-invoices/payments/<int:pk>/reject/', AdminCommissionPaymentRejectView.as_view(), name='admin-commission-payment-reject-alias'),
]
