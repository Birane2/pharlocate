from django.urls import path

from payments.views import PublicPharmacyPaymentMethodView

from .views import (
    GuardPharmacyListView,
    NearbyPharmacyListView,
    PharmacienPharmacyProfileView,
    PharmacyDetailView,
    PharmacyListCreateView,
)

urlpatterns = [
    path('my-pharmacy/', PharmacienPharmacyProfileView.as_view(), name='my_pharmacy'),
    path('garde/', GuardPharmacyListView.as_view(), name='pharmacy_guard_list'),
    path('nearby/', NearbyPharmacyListView.as_view(), name='pharmacy_nearby'),
    path('', PharmacyListCreateView.as_view(), name='pharmacy_list_create'),
    path(
        '<int:pharmacy_id>/payment-methods/',
        PublicPharmacyPaymentMethodView.as_view(),
        name='pharmacy_payment_methods',
    ),
    path('<int:pk>/', PharmacyDetailView.as_view(), name='pharmacy_detail'),
]
