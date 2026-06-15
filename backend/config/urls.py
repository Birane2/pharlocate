from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pharmacies.views import PharmacienDashboardStatsView
from subscriptions.views import (
    AdminPlatformPaymentMethodView,
    AdminSubscriptionPaymentListView,
    AdminSubscriptionPaymentRejectView,
    AdminSubscriptionPaymentValidateView,
    PlatformPaymentMethodPublicView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/admin/payment-methods/', AdminPlatformPaymentMethodView.as_view()),
    path('api/admin/subscription-payments/', AdminSubscriptionPaymentListView.as_view()),
    path(
        'api/admin/subscription-payments/<int:pk>/validate/',
        AdminSubscriptionPaymentValidateView.as_view(),
    ),
    path(
        'api/admin/subscription-payments/<int:pk>/reject/',
        AdminSubscriptionPaymentRejectView.as_view(),
    ),
    path('api/admin/payments/', include('payments.admin_urls')),
    path('api/admin/', include('config.admin_urls')),
    path('api/platform/payment-methods/', PlatformPaymentMethodPublicView.as_view()),
    path('api/pharmacies/', include('pharmacies.urls')),
    path('api/pharmacien/dashboard/stats/', PharmacienDashboardStatsView.as_view()),
    path('api/pharmacien/pharmacie/', include('pharmacies.pharmacien_urls')),
    path('api/horaires/', include('pharmacies.horaire_urls')),
    path('api/avis/', include('reviews.urls')),
    path('api/pharmacien/avis/', include('reviews.pharmacien_urls')),
    path('api/medicaments/', include('medicaments.urls')),
    path('api/stocks/', include('medicaments.stock_urls')),
    path('api/pharmacien/stocks/', include('medicaments.pharmacien_urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/user/reservations/', include('reservations.user_urls')),
    path('api/pharmacien/reservations/', include('reservations.pharmacien_urls')),
    path('api/deliveries/', include('deliveries.urls')),
    path('api/pharmacien/deliveries/', include('deliveries.pharmacien_urls')),
    path('api/payments/', include('payments.urls')),
    path('api/pharmacien/orders/', include('payments.order_urls')),
    path('api/pharmacien/payments/', include('payments.order_urls')),
    path('api/pharmacien/payment-methods/', include('payments.pharmacien_urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/pharmacien/transactions/', include('transactions.pharmacien_urls')),
    path('api/admin/transactions/', include('transactions.admin_urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/pharmacien/invoices/', include('invoices.pharmacien_urls')),
    path('api/admin/invoices/', include('invoices.admin_urls')),
    path('api/refunds/', include('refunds.urls')),
    path('api/pharmacien/refunds/', include('refunds.pharmacien_urls')),
    path('api/admin/refunds/', include('refunds.admin_urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/pharmacien/subscription/', include('subscriptions.pharmacien_urls')),
    path('api/admin/subscriptions/', include('subscriptions.admin_urls')),
    path('api/pharmacien/finance/', include('finance.pharmacien_urls')),
    path('api/admin/finance/', include('finance.admin_urls')),
    path('api/notifications/', include('notifications_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
