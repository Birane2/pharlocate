from django.urls import path

from .views import (
    AdminTransactionDetailView,
    AdminTransactionListView,
    AdminTransactionStatisticsView,
)


urlpatterns = [
    path('', AdminTransactionListView.as_view(), name='transaction-admin-list'),
    path('summary/', AdminTransactionStatisticsView.as_view(), name='transaction-admin-summary'),
    path('statistics/', AdminTransactionStatisticsView.as_view(), name='transaction-admin-statistics'),
    path('<str:pk>/', AdminTransactionDetailView.as_view(), name='transaction-admin-detail'),
]
