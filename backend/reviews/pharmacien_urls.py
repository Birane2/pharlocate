from django.urls import path

from .views import PharmacienAvisListView, PostReplyView

urlpatterns = [
    path('', PharmacienAvisListView.as_view(), name='pharmacien_avis_list'),
    path('<int:review_id>/reply/', PostReplyView.as_view(), name='post_reply'),
]
