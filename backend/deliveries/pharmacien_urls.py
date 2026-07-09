from django.urls import path

from .views import (
    pharmacist_delivery_cancel,
    pharmacist_delivery_delivered,
    pharmacist_delivery_detail,
    pharmacist_delivery_in_progress,
    pharmacist_delivery_list,
    pharmacist_delivery_stats,
)

urlpatterns = [
    path('', pharmacist_delivery_list, name='pharmacist_delivery_list'),
    path('stats/', pharmacist_delivery_stats, name='pharmacist_delivery_stats'),
    path('<int:pk>/', pharmacist_delivery_detail, name='pharmacist_delivery_detail'),
    path(
        '<int:pk>/in-progress/',
        pharmacist_delivery_in_progress,
        name='pharmacist_delivery_in_progress',
    ),
    path(
        '<int:pk>/start/',
        pharmacist_delivery_in_progress,
        name='pharmacist_delivery_start',
    ),
    path(
        '<int:pk>/delivered/',
        pharmacist_delivery_delivered,
        name='pharmacist_delivery_delivered',
    ),
    path('<int:pk>/cancel/', pharmacist_delivery_cancel, name='pharmacist_delivery_cancel'),
]
