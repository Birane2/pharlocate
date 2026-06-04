from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from pharmacies.models import Pharmacy


class PharmacyCoordinatesApiTests(APITestCase):
    def setUp(self):
        self.pharmacien = User.objects.create_user(
            username='pharma-coords',
            email='pharma-coords@example.com',
            password='secret123',
            role='pharmacien',
        )
        self.client.force_authenticate(user=self.pharmacien)

    def test_create_pharmacy_rounds_coordinates_to_six_decimals(self):
        response = self.client.post(
            reverse('pharmacy_list_create'),
            {
                'nom': 'Pharmacie Centrale',
                'adresse': 'Nouakchott',
                'telephone': '22234567',
                'latitude': 18.073512987,
                'longitude': -15.958245789,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        pharmacy = Pharmacy.objects.get(user=self.pharmacien)
        self.assertEqual(str(pharmacy.latitude), '18.073513')
        self.assertEqual(str(pharmacy.longitude), '-15.958246')
        self.assertEqual(str(response.data['data']['latitude']), '18.073513')
        self.assertEqual(str(response.data['data']['longitude']), '-15.958246')

    def test_create_pharmacy_accepts_el_menar_coordinates(self):
        response = self.client.post(
            reverse('pharmacy_list_create'),
            {
                'nom': 'Pharmacie El Menar',
                'adresse': 'Nouakchott',
                'telephone': '22234567',
                'latitude': 18.114961,
                'longitude': -15.961197,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        pharmacy = Pharmacy.objects.get(user=self.pharmacien)
        self.assertEqual(str(pharmacy.latitude), '18.114961')
        self.assertEqual(str(pharmacy.longitude), '-15.961197')
        self.assertEqual(str(response.data['data']['latitude']), '18.114961')
        self.assertEqual(str(response.data['data']['longitude']), '-15.961197')

    def test_create_pharmacy_accepts_empty_coordinates(self):
        response = self.client.post(
            reverse('pharmacy_list_create'),
            {
                'nom': 'Pharmacie Sans Position',
                'adresse': 'Nouakchott',
                'telephone': '22234567',
                'latitude': '',
                'longitude': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        pharmacy = Pharmacy.objects.get(user=self.pharmacien)
        self.assertIsNone(pharmacy.latitude)
        self.assertIsNone(pharmacy.longitude)

    def test_create_pharmacy_rejects_out_of_range_latitude_with_clear_message(self):
        response = self.client.post(
            reverse('pharmacy_list_create'),
            {
                'nom': 'Pharmacie Centrale',
                'adresse': 'Nouakchott',
                'telephone': '22234567',
                'latitude': 98.123456,
                'longitude': -15.958245,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['latitude'][0],
            'Latitude invalide. Elle doit etre comprise entre -90 et 90.',
        )

    def test_patch_pharmacy_rounds_mobile_coordinates(self):
        Pharmacy.objects.create(
            user=self.pharmacien,
            nom='Pharmacie Centrale',
            adresse='Nouakchott',
            telephone='22234567',
            latitude='18.073512',
            longitude='-15.958245',
        )

        response = self.client.patch(
            reverse('my_pharmacy'),
            {
                'latitude': 18.073512444,
                'longitude': -15.958245555,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pharmacy = Pharmacy.objects.get(user=self.pharmacien)
        self.assertEqual(str(pharmacy.latitude), '18.073512')
        self.assertEqual(str(pharmacy.longitude), '-15.958246')
        self.assertEqual(str(response.data['latitude']), '18.073512')
        self.assertEqual(str(response.data['longitude']), '-15.958246')

    def test_create_pharmacy_rejects_invalid_longitude_format_with_clear_message(self):
        response = self.client.post(
            reverse('pharmacy_list_create'),
            {
                'nom': 'Pharmacie Centrale',
                'adresse': 'Nouakchott',
                'telephone': '22234567',
                'latitude': 18.073512,
                'longitude': 'ouest',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['longitude'][0], 'Longitude invalide.')
