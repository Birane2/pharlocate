from django.urls import path
from .views import AvisListCreateView

urlpatterns = [
    path('', AvisListCreateView.as_view(), name='avis_list_create'),
]