from django.urls import path

from .views import PharmacienCurrentSubscriptionView


urlpatterns = [
    path('', PharmacienCurrentSubscriptionView.as_view(), name='pharmacien-current-subscription'),
]
