from django.urls import path

from .views import (
    ReservationCheckoutView,
    ReservationDetailView,
    ReservationListCreateView,
)

urlpatterns = [
    path('checkout/', ReservationCheckoutView.as_view(), name='reservation_checkout'),
    path('', ReservationListCreateView.as_view(), name='reservation_list_create'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='reservation_detail'),
]
