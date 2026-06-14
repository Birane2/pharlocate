from django.urls import path

from .views import PharmacienRefundListView


urlpatterns = [
    path('', PharmacienRefundListView.as_view(), name='refund-pharmacien-list'),
]
