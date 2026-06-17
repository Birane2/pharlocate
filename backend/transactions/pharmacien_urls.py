from django.urls import path

from .export_views import (
    PharmacienTransactionsExcelExport,
    PharmacienTransactionsPDFExport,
    PharmacienTransactionsWordExport,
)
from .views import PharmacienTransactionListView


urlpatterns = [
    path('', PharmacienTransactionListView.as_view(), name='transaction-pharmacien-list'),
    path('export/pdf/', PharmacienTransactionsPDFExport.as_view(), name='transaction-pharmacien-export-pdf'),
    path('export/excel/', PharmacienTransactionsExcelExport.as_view(), name='transaction-pharmacien-export-excel'),
    path('export/word/', PharmacienTransactionsWordExport.as_view(), name='transaction-pharmacien-export-word'),
]
