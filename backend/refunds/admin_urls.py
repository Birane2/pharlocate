from django.urls import path

from .views import AdminRefundListView


urlpatterns = [
    path('', AdminRefundListView.as_view(), name='refund-admin-list'),
]
