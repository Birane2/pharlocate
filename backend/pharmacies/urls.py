from django.urls import path
from .views import PharmacyListCreateView, PharmacyDetailView, HoraireListCreateView

urlpatterns = [
    path('', PharmacyListCreateView.as_view(), name='pharmacy_list_create'),
    path('<int:pk>/', PharmacyDetailView.as_view(), name='pharmacy_detail'),
    path('horaires/', HoraireListCreateView.as_view(), name='horaire_list_create'),
]