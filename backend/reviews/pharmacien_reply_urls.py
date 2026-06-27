from django.urls import path

from .views import ReplyDetailView

urlpatterns = [
    path('<int:pk>/', ReplyDetailView.as_view(), name='reply_detail'),
]
