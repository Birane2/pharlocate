from django.urls import path
from .views import ReservationListCreateView, ReservationDetailView

urlpatterns = [
    path('', ReservationListCreateView.as_view(), name='reservation_list_create'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='reservation_detail'),
]