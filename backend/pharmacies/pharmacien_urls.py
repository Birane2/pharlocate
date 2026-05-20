from django.urls import path

from .views import PharmacienPharmacyPhotoView, PharmacienPharmacyProfileView

urlpatterns = [
    path('', PharmacienPharmacyProfileView.as_view(), name='pharmacien_pharmacy_profile'),
    path('photo/', PharmacienPharmacyPhotoView.as_view(), name='pharmacien_pharmacy_photo'),
]
