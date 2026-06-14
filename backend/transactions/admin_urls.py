from django.urls import path

from .views import AdminTransactionListView, AdminTransactionStatisticsView


urlpatterns = [
    path('', AdminTransactionListView.as_view(), name='transaction-admin-list'),
    path('statistics/', AdminTransactionStatisticsView.as_view(), name='transaction-admin-statistics'),
]
