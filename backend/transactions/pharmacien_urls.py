from django.urls import path

from .views import PharmacienTransactionListView


urlpatterns = [
    path('', PharmacienTransactionListView.as_view(), name='transaction-pharmacien-list'),
]
