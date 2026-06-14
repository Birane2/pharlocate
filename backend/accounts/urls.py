from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    password_reset_confirm_view,
    password_reset_request_view,
    password_reset_verify_view,
    profile_view,
    register_view,
    resend_register_otp_view,
    test_api,
    verify_register_otp_view,
)

urlpatterns = [
    path('test/', test_api, name='test_api'),
    path('register/', register_view, name='register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('verify-otp/', verify_register_otp_view, name='verify_otp'),
    path('resend-otp/', resend_register_otp_view, name='resend_otp'),
    path('verify-email-otp/', verify_register_otp_view, name='verify_email_otp'),
    path('resend-email-otp/', resend_register_otp_view, name='resend_email_otp'),
    path('verify-register-otp/', verify_register_otp_view, name='verify_register_otp'),
    path('resend-register-otp/', resend_register_otp_view, name='resend_register_otp'),
    path(
        'password-reset/request/',
        password_reset_request_view,
        name='password_reset_request',
    ),
    path(
        'password-reset/verify/',
        password_reset_verify_view,
        name='password_reset_verify',
    ),
    path(
        'password-reset/confirm/',
        password_reset_confirm_view,
        name='password_reset_confirm',
    ),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', profile_view, name='profile'),
]
