from django.urls import path

from .views import MyTransactionListView, TransactionDetailView


urlpatterns = [
    path('my-transactions/', MyTransactionListView.as_view(), name='transaction-my-list'),
    path('<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
]
