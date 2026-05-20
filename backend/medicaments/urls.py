from django.urls import path
from .views import (
    MedicamentListCreateView,
    MedicamentDetailView,
    StockDetailView,
    StockListCreateView,
)

urlpatterns = [
    path('', MedicamentListCreateView.as_view(), name='medicament_list_create'),
    path('<int:pk>/', MedicamentDetailView.as_view(), name='medicament_detail'),
    path('stocks/', StockListCreateView.as_view(), name='stock_list_create'),
    path('stocks/<int:pk>/', StockDetailView.as_view(), name='stock_detail'),
]
