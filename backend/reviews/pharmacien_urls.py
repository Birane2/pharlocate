from django.urls import path

from .views import PharmacienAvisListView

urlpatterns = [
    path('', PharmacienAvisListView.as_view(), name='pharmacien_avis_list'),
]
