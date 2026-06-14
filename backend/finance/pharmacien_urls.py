from django.urls import path

from .views import (
    PharmacienFinanceDashboardView,
    PharmacienFinanceExportPlaceholderView,
    PharmacienFinanceRevenuesView,
    PharmacienFinanceTransactionsView,
)


urlpatterns = [
    path('dashboard/', PharmacienFinanceDashboardView.as_view(), name='pharmacien-finance-dashboard'),
    path('revenues/', PharmacienFinanceRevenuesView.as_view(), name='pharmacien-finance-revenues'),
    path('transactions/', PharmacienFinanceTransactionsView.as_view(), name='pharmacien-finance-transactions'),
    path('export/', PharmacienFinanceExportPlaceholderView.as_view(), name='pharmacien-finance-export'),
]
