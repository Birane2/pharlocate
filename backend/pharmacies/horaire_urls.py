from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HoraireViewSet

router = DefaultRouter()
router.register('', HoraireViewSet, basename='horaire')

urlpatterns = [
    path('', include(router.urls)),
]
