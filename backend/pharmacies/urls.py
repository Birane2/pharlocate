from django.urls import path

from .views import (
    NearbyPharmacyListView,
    PharmacienPharmacyProfileView,
    PharmacyDetailView,
    PharmacyListCreateView,
)

urlpatterns = [
    path('my-pharmacy/', PharmacienPharmacyProfileView.as_view(), name='my_pharmacy'),
    path('nearby/', NearbyPharmacyListView.as_view(), name='pharmacy_nearby'),
    path('', PharmacyListCreateView.as_view(), name='pharmacy_list_create'),
    path('<int:pk>/', PharmacyDetailView.as_view(), name='pharmacy_detail'),
]
