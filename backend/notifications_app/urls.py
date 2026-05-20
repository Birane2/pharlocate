from django.urls import path

from .views import NotificationCreateView, NotificationListView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('create/', NotificationCreateView.as_view(), name='notification_create'),
]
