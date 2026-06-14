from django.urls import path

from .views import (
    MyRefundListView,
    RefundApproveView,
    RefundCreateView,
    RefundDetailView,
    RefundExecuteView,
    RefundRejectView,
)


urlpatterns = [
    path('', RefundCreateView.as_view(), name='refund-create'),
    path('my-refunds/', MyRefundListView.as_view(), name='refund-my-list'),
    path('<int:pk>/', RefundDetailView.as_view(), name='refund-detail'),
    path('<int:pk>/approve/', RefundApproveView.as_view(), name='refund-approve'),
    path('<int:pk>/reject/', RefundRejectView.as_view(), name='refund-reject'),
    path('<int:pk>/execute/', RefundExecuteView.as_view(), name='refund-execute'),
]
