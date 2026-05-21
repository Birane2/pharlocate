from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pharmacies.views import PharmacienDashboardStatsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/admin/', include('config.admin_urls')),
    path('api/pharmacies/', include('pharmacies.urls')),
    path('api/pharmacien/dashboard/stats/', PharmacienDashboardStatsView.as_view()),
    path('api/pharmacien/pharmacie/', include('pharmacies.pharmacien_urls')),
    path('api/horaires/', include('pharmacies.horaire_urls')),
    path('api/avis/', include('reviews.urls')),
    path('api/medicaments/', include('medicaments.urls')),
    path('api/stocks/', include('medicaments.stock_urls')),
    path('api/pharmacien/stocks/', include('medicaments.pharmacien_urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/user/reservations/', include('reservations.user_urls')),
    path('api/pharmacien/reservations/', include('reservations.pharmacien_urls')),
    path('api/notifications/', include('notifications_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
