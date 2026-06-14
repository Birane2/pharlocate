from django.urls import path

from .views import (
    AdminPendingPaymentListView,
    MyPaymentListView,
    PaymentCreateView,
    PaymentDetailView,
    PaymentMethodListView,
    PaymentRejectView,
    PaymentSubmitProofView,
    PaymentValidateView,
    PharmacienPaymentListView,
)


urlpatterns = [
    path('methods/', PaymentMethodListView.as_view(), name='payment-method-list'),
    path('create/', PaymentCreateView.as_view(), name='payment-create'),
    path('my-payments/', MyPaymentListView.as_view(), name='payment-my-list'),
    path('pharmacien/', PharmacienPaymentListView.as_view(), name='payment-pharmacien-list'),
    path('admin/pending/', AdminPendingPaymentListView.as_view(), name='payment-admin-pending-list'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('<int:pk>/submit-proof/', PaymentSubmitProofView.as_view(), name='payment-submit-proof'),
    path('<int:pk>/validate/', PaymentValidateView.as_view(), name='payment-validate'),
    path('<int:pk>/reject/', PaymentRejectView.as_view(), name='payment-reject'),
]
