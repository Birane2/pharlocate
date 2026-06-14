from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from pharmacies.models import Pharmacy


class AdminUsersApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin-main',
            email='admin-main@example.com',
            password='secret123',
            role='admin',
        )
        self.other_admin = User.objects.create_user(
            username='admin-second',
            email='admin-second@example.com',
            password='secret123',
            role='admin',
        )
        self.pharmacien = User.objects.create_user(
            username='pharma-user',
            email='ganguebirane034@gmail.com',
            password='00Ig20143@@',
            role='pharmacien',
        )
        self.user = User.objects.create_user(
            username='simple-user',
            email='takkhalidou@gmail.com',
            password='secret123',
            role='utilisateur',
        )

        self.client.force_authenticate(user=self.admin)

    def test_admin_can_list_users(self):
        response = self.client.get(reverse('admin_user_list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 4)

    def test_admin_cannot_suspend_self(self):
        response = self.client.patch(reverse('admin_user_suspend', args=[self.admin.id]))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('propre compte', response.data['error'])

    def test_admin_can_suspend_user(self):
        response = self.client.patch(reverse('admin_user_suspend', args=[self.user.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_admin_can_delete_other_admin(self):
        response = self.client.delete(reverse('admin_user_delete', args=[self.other_admin.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.other_admin.id).exists())

    def test_admin_cannot_remove_pharmacien_role_if_pharmacy_exists(self):
        Pharmacy.objects.create(
            user=self.pharmacien,
            nom='Pharmacie Centrale',
            adresse='Rue 1',
            latitude=14.6928,
            longitude=-17.4467,
            telephone='770000000',
        )

        response = self.client.patch(
            reverse('admin_user_change_role', args=[self.pharmacien.id]),
            {'role': 'utilisateur'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('pharmacie', response.data['error'])
