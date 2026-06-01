from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification


class NotificationMarkAllReadApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username='notification-user',
            password='test-password',
        )
        self.other_user = user_model.objects.create_user(
            username='other-notification-user',
            password='test-password',
        )

    def test_list_returns_only_authenticated_user_notifications(self):
        Notification.objects.create(user=self.user, message='Visible notification')
        Notification.objects.create(user=self.other_user, message='Hidden notification')

        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/notifications/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message'], 'Visible notification')
        self.assertIn('titre', response.data[0])
        self.assertIn('lu', response.data[0])
        self.assertIn('date_creation', response.data[0])

    def test_mark_all_read_updates_only_authenticated_user_notifications(self):
        Notification.objects.create(user=self.user, message='Unread 1')
        Notification.objects.create(user=self.user, message='Unread 2')
        Notification.objects.create(user=self.user, message='Already read', est_lue=True)
        other_notification = Notification.objects.create(
            user=self.other_user,
            message='Other user unread',
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.patch('/api/notifications/mark-all-read/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 2)
        self.assertFalse(
            Notification.objects.filter(user=self.user, est_lue=False).exists()
        )
        other_notification.refresh_from_db()
        self.assertFalse(other_notification.est_lue)

    def test_mark_all_read_requires_authentication(self):
        response = self.client.patch('/api/notifications/mark-all-read/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_all_read_returns_zero_when_everything_is_already_read(self):
        Notification.objects.create(
            user=self.user,
            message='Already read',
            est_lue=True,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.patch('/api/notifications/mark-all-read/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 0)

    def test_delete_removes_only_authenticated_user_notification(self):
        notification = Notification.objects.create(
            user=self.user,
            message='Delete me',
        )
        other_notification = Notification.objects.create(
            user=self.other_user,
            message='Keep me',
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/notifications/{notification.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=notification.id).exists())
        self.assertTrue(Notification.objects.filter(pk=other_notification.id).exists())

    def test_delete_returns_not_found_for_another_user_notification(self):
        other_notification = Notification.objects.create(
            user=self.other_user,
            message='Other user notification',
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/notifications/{other_notification.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Notification.objects.filter(pk=other_notification.id).exists())

    def test_clear_all_removes_only_authenticated_user_notifications(self):
        Notification.objects.create(user=self.user, message='Delete 1')
        Notification.objects.create(user=self.user, message='Delete 2')
        other_notification = Notification.objects.create(
            user=self.other_user,
            message='Keep me',
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.delete('/api/notifications/clear-all/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['deleted'], 2)
        self.assertFalse(Notification.objects.filter(user=self.user).exists())
        self.assertTrue(Notification.objects.filter(pk=other_notification.id).exists())
