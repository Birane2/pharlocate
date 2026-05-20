from django.urls import path

from .views import PharmacienStockDetailView, PharmacienStockListView

urlpatterns = [
    path('', PharmacienStockListView.as_view(), name='pharmacien_stock_list'),
    path('<int:pk>/', PharmacienStockDetailView.as_view(), name='pharmacien_stock_detail'),
]
