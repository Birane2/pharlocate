from django.urls import path

from payments.views import public_pharmacy_payment_methods

from .views import (
    GuardPharmacyListView,
    NearbyPharmacyListView,
    PharmacienPharmacyProfileView,
    PharmacyDetailView,
    PharmacyListCreateView,
    PharmacyLocationView,
)

urlpatterns = [
    path('my-pharmacy/', PharmacienPharmacyProfileView.as_view(), name='my_pharmacy'),
    path('garde/', GuardPharmacyListView.as_view(), name='pharmacy_guard_list'),
    path('nearby/', NearbyPharmacyListView.as_view(), name='pharmacy_nearby'),
    path('', PharmacyListCreateView.as_view(), name='pharmacy_list_create'),
    path(
        '<int:pharmacy_id>/payment-methods/',
        public_pharmacy_payment_methods,
        name='pharmacy_payment_methods',
    ),
    path('<int:pk>/', PharmacyDetailView.as_view(), name='pharmacy_detail'),
    path('<int:pk>/location/', PharmacyLocationView.as_view(), name='pharmacy_location'),
]
