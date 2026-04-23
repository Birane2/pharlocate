from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, test_api, register_view, profile_view

urlpatterns = [
    path('test/', test_api, name='test_api'),
    path('register/', register_view, name='register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', profile_view, name='profile'),
]
