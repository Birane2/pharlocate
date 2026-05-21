from django.urls import path

from .views import UserReservationListView

urlpatterns = [
    path("", UserReservationListView.as_view(), name="user_reservation_list"),
]
