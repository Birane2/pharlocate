from django.urls import path

from .views import (
    AdminFinanceCommissionsView,
    AdminFinanceDashboardView,
    AdminFinanceExportPlaceholderView,
    AdminFinancePaymentMethodsView,
    AdminFinanceRevenuesView,
    AdminFinanceTopPharmaciesView,
)


urlpatterns = [
    path('dashboard/', AdminFinanceDashboardView.as_view(), name='admin-finance-dashboard'),
    path('revenues/', AdminFinanceRevenuesView.as_view(), name='admin-finance-revenues'),
    path('commissions/', AdminFinanceCommissionsView.as_view(), name='admin-finance-commissions'),
    path('top-pharmacies/', AdminFinanceTopPharmaciesView.as_view(), name='admin-finance-top-pharmacies'),
    path('payment-methods/', AdminFinancePaymentMethodsView.as_view(), name='admin-finance-payment-methods'),
    path('export/', AdminFinanceExportPlaceholderView.as_view(), name='admin-finance-export'),
]
