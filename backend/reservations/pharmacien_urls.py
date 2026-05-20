from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PharmacienReservationViewSet

router = DefaultRouter()
router.register('', PharmacienReservationViewSet, basename='pharmacien-reservation')

urlpatterns = [
    path('', include(router.urls)),
]
