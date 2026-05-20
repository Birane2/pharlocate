from django.urls import path

from .views import AddMedicamentToStockView

urlpatterns = [
    path('add-medicament/', AddMedicamentToStockView.as_view(), name='pharmacien_stock_add_medicament'),
]
