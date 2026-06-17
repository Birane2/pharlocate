from django.urls import path

from .export_views import (
    AdminTransactionsExcelExport,
    AdminTransactionsPDFExport,
    AdminTransactionsWordExport,
)
from .views import (
    AdminTransactionDetailView,
    AdminTransactionListView,
    AdminTransactionStatisticsView,
)


urlpatterns = [
    path('', AdminTransactionListView.as_view(), name='transaction-admin-list'),
    path('summary/', AdminTransactionStatisticsView.as_view(), name='transaction-admin-summary'),
    path('statistics/', AdminTransactionStatisticsView.as_view(), name='transaction-admin-statistics'),
    path('export/pdf/', AdminTransactionsPDFExport.as_view(), name='transaction-admin-export-pdf'),
    path('export/excel/', AdminTransactionsExcelExport.as_view(), name='transaction-admin-export-excel'),
    path('export/word/', AdminTransactionsWordExport.as_view(), name='transaction-admin-export-word'),
    path('<str:pk>/', AdminTransactionDetailView.as_view(), name='transaction-admin-detail'),
]
