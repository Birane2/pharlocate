from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from pharmacies.models import Pharmacy
from .models import Avis


class PharmacienAvisApiTests(APITestCase):
    def setUp(self):
        self.pharmacien = User.objects.create_user(
            username='pharma-reviews',
            password='secret123',
            role='pharmacien',
        )
        self.other_pharmacien = User.objects.create_user(
            username='other-pharma-reviews',
            password='secret123',
            role='pharmacien',
        )
        self.client_user = User.objects.create_user(
            username='client-reviews',
            password='secret123',
            role='utilisateur',
        )
        self.other_client = User.objects.create_user(
            username='other-client-reviews',
            password='secret123',
            role='utilisateur',
        )
        self.pharmacy = Pharmacy.objects.create(
            user=self.pharmacien,
            nom='Pharmacie Centrale',
            adresse='Nouakchott',
            telephone='22234567',
            est_valide=True,
            statut_validation='validee',
        )
        self.other_pharmacy = Pharmacy.objects.create(
            user=self.other_pharmacien,
            nom='Pharmacie Autre',
            adresse='Nouakchott',
            telephone='22345678',
            est_valide=True,
            statut_validation='validee',
        )
        Avis.objects.create(
            pharmacie=self.pharmacy,
            user=self.client_user,
            note=5,
            commentaire='Excellent service',
        )
        Avis.objects.create(
            pharmacie=self.other_pharmacy,
            user=self.other_client,
            note=2,
            commentaire='Avis autre pharmacie',
        )

    def test_pharmacien_only_receives_reviews_for_own_pharmacy(self):
        self.client.force_authenticate(user=self.pharmacien)

        response = self.client.get(reverse('pharmacien_avis_list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stats']['total'], 1)
        self.assertEqual(response.data['stats']['note_moyenne'], 5.0)
        self.assertEqual(response.data['stats']['repartition']['5'], 1)
        self.assertEqual(response.data['results'][0]['commentaire'], 'Excellent service')

    def test_anonymous_user_cannot_open_pharmacien_reviews(self):
        response = self.client.get(reverse('pharmacien_avis_list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_open_pharmacien_reviews(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.get(reverse('pharmacien_avis_list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
