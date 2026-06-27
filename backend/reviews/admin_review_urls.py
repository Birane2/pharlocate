from django.urls import path

from .views import AdminDeleteReviewView, AdminDeleteReplyView

urlpatterns = [
    path('<int:pk>/', AdminDeleteReviewView.as_view(), name='admin_delete_review'),
    path('replies/<int:pk>/', AdminDeleteReplyView.as_view(), name='admin_delete_reply'),
]
