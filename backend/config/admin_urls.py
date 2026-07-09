from django.urls import path

from .admin_views import (
    AdminDashboardStatsView,
    AdminDeliveryDetailView,
    AdminDeliveryListView,
    AdminPendingPharmacyListView,
    AdminPharmacyListView,
    AdminPharmacyDetailView,
    AdminPharmacyReactivateView,
    AdminPharmacyRejectView,
    AdminPharmacySuspendView,
    AdminPharmacyValidateView,
    AdminReservationDetailView,
    AdminReservationListView,
    AdminUserActivateView,
    AdminUserChangeRoleView,
    AdminUserDeleteView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserSuspendView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardStatsView.as_view(), name='admin_dashboard'),
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),

    # Users
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('users/<int:pk>/activate/', AdminUserActivateView.as_view(), name='admin_user_activate'),
    path('users/<int:pk>/suspend/', AdminUserSuspendView.as_view(), name='admin_user_suspend'),
    path('users/<int:pk>/change-role/', AdminUserChangeRoleView.as_view(), name='admin_user_change_role'),
    path('users/<int:pk>/delete/', AdminUserDeleteView.as_view(), name='admin_user_delete'),

    # Pharmacies
    path('pharmacies/', AdminPharmacyListView.as_view(), name='admin_pharmacy_list'),
    path('pharmacies/pending/', AdminPendingPharmacyListView.as_view(), name='admin_pharmacy_pending'),
    path('pharmacies/<int:pk>/', AdminPharmacyDetailView.as_view(), name='admin_pharmacy_detail'),
    path('pharmacies/<int:pk>/validate/', AdminPharmacyValidateView.as_view(), name='admin_pharmacy_validate'),
    path('pharmacies/<int:pk>/suspend/', AdminPharmacySuspendView.as_view(), name='admin_pharmacy_suspend'),
    path('pharmacies/<int:pk>/reactivate/', AdminPharmacyReactivateView.as_view(), name='admin_pharmacy_reactivate'),
    path('pharmacies/<int:pk>/reject/', AdminPharmacyRejectView.as_view(), name='admin_pharmacy_reject'),

    # Reservations — lecture seule (supervision uniquement)
    path('reservations/', AdminReservationListView.as_view(), name='admin_reservation_list'),
    path('reservations/<int:pk>/', AdminReservationDetailView.as_view(), name='admin_reservation_detail'),

    # Deliveries — lecture seule (supervision uniquement)
    path('deliveries/', AdminDeliveryListView.as_view(), name='admin_delivery_list'),
    path('deliveries/<int:pk>/', AdminDeliveryDetailView.as_view(), name='admin_delivery_detail'),
]
