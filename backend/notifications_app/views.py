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
        qs = Notification.objects.filter(user=self.request.user)
        ntype = self.request.query_params.get('notification_type')
        if ntype:
            qs = qs.filter(notification_type=ntype)
        unread_only = self.request.query_params.get('unread')
        if unread_only:
            qs = qs.filter(est_lue=False)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Manual pagination: 20 per page
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = max(1, min(50, int(request.query_params.get('page_size', 20))))
        except (TypeError, ValueError):
            page = 1
            page_size = 20

        total = qs.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        page = min(page, total_pages)
        items = qs[(page - 1) * page_size: page * page_size]
        serializer = self.get_serializer(items, many=True)
        return Response({
            'count': total,
            'total_pages': total_pages,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, est_lue=False).count()
        return Response({'unread_count': count})


class NotificationCreateView(generics.CreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'pharmacien']:
            return Response(
                {'error': 'Seuls les administrateurs ou pharmaciens peuvent envoyer une notification manuelle.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(
            {'message': 'Notification creee avec succes.', 'data': serializer.data},
            status=status.HTTP_201_CREATED,
        )


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.est_lue = True
        notification.save(update_fields=['est_lue'])
        return Response({
            'message': 'Notification marquee comme lue.',
            'data': self.get_serializer(notification).data,
        })


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        updated = Notification.objects.filter(
            user=request.user,
            est_lue=False,
        ).update(est_lue=True)
        return Response({
            'message': 'Toutes les notifications ont ete marquees comme lues.',
            'updated': updated,
        })


class NotificationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationClearAllView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        deleted, _ = Notification.objects.filter(user=request.user).delete()
        return Response({
            'message': 'Toutes les notifications ont ete supprimees.',
            'deleted': deleted,
        })
