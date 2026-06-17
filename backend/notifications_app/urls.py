from django.urls import path

from .views import (
    NotificationCreateView,
    NotificationClearAllView,
    NotificationDeleteView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('create/', NotificationCreateView.as_view(), name='notification_create'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification_unread_count'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('clear-all/', NotificationClearAllView.as_view(), name='notification_clear_all'),
    path('<int:pk>/', NotificationDeleteView.as_view(), name='notification_delete'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
]
