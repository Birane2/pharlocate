from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/pharmacies/', include('pharmacies.urls')),
    path('api/avis/', include('reviews.urls')),
    path('api/medicaments/', include('medicaments.urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/notifications/', include('notifications_app.urls')),
]