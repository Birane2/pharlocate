from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-date')


class NotificationCreateView(generics.CreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent envoyer une notification manuelle.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(
            {
                'message': 'Notification creee avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.est_lue = True
        notification.save(update_fields=["est_lue"])

        return Response(
            {
                "message": "Notification marquee comme lue.",
                "data": self.get_serializer(notification).data,
            }
        )


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        updated = Notification.objects.filter(
            user=request.user,
            est_lue=False,
        ).update(est_lue=True)

        return Response(
            {
                "message": "Toutes les notifications ont ete marquees comme lues.",
                "updated": updated,
            }
        )


class NotificationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationClearAllView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        deleted, _ = Notification.objects.filter(user=request.user).delete()

        return Response(
            {
                "message": "Toutes les notifications ont ete supprimees.",
                "deleted": deleted,
            }
        )
