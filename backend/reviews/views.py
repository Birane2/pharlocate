from rest_framework import generics, status
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Avg, Count
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAuthenticatedWithTokenMessage, IsPharmacien, IsAdminRole
from notifications_app.models import Notification
from .models import Avis, ReviewReply
from .serializers import AvisSerializer, ReviewReplySerializer


class AvisListCreateView(generics.ListCreateAPIView):
    queryset = (
        Avis.objects
        .select_related('user', 'pharmacie')
        .prefetch_related('reply')
        .all()
    )
    serializer_class = AvisSerializer

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date')
        pharmacie_id = (
            self.request.query_params.get('pharmacie_id')
            or self.request.query_params.get('pharmacie')
        )

        if pharmacie_id:
            queryset = queryset.filter(pharmacie_id=pharmacie_id)

        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticatedWithTokenMessage()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'utilisateur':
            return Response(
                {'error': 'Seuls les utilisateurs peuvent publier un avis.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(
            {
                'message': 'Avis ajoute avec succes.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class PharmacienAvisListView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def get(self, request):
        queryset = (
            Avis.objects
            .select_related('user', 'pharmacie')
            .prefetch_related('reply')
            .filter(pharmacie__user=request.user)
            .order_by('-date')
        )
        try:
            pharmacy = request.user.pharmacy
        except ObjectDoesNotExist:
            pharmacy = None
        distribution_rows = queryset.values('note').annotate(total=Count('id'))
        distribution = {str(note): 0 for note in range(1, 6)}

        for row in distribution_rows:
            distribution[str(row['note'])] = row['total']

        serializer = AvisSerializer(queryset, many=True)
        return Response({
            'pharmacie': {
                'id': pharmacy.id,
                'nom': pharmacy.nom,
            } if pharmacy else None,
            'stats': {
                'note_moyenne': round(queryset.aggregate(avg=Avg('note'))['avg'] or 0, 1),
                'total': queryset.count(),
                'repartition': distribution,
            },
            'results': serializer.data,
        })


class PostReplyView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def post(self, request, review_id):
        try:
            review = Avis.objects.select_related('pharmacie', 'user').get(pk=review_id)
        except Avis.DoesNotExist:
            return Response({'error': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            pharmacy = request.user.pharmacy
        except ObjectDoesNotExist:
            return Response(
                {'error': 'Pharmacie introuvable pour ce compte.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if review.pharmacie_id != pharmacy.id:
            return Response(
                {'error': "Vous ne pouvez repondre qu'aux avis de votre pharmacie."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if hasattr(review, 'reply'):
            return Response(
                {'error': 'Une reponse existe deja pour cet avis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(review=review, pharmacist=request.user, pharmacy=pharmacy)

        Notification.objects.create(
            user=review.user,
            title='Reponse a votre avis',
            message=f'Le pharmacien de {pharmacy.nom} a repondu a votre avis.',
            type=Notification.TYPE_INFO,
            notification_type=Notification.NTYPE_SYSTEM,
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReplyDetailView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsPharmacien]

    def _get_reply(self, pk, user):
        try:
            reply = ReviewReply.objects.get(pk=pk)
        except ReviewReply.DoesNotExist:
            return None, Response({'error': 'Reponse introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if reply.pharmacist_id != user.id:
            return None, Response(
                {'error': 'Vous ne pouvez modifier que vos propres reponses.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return reply, None

    def put(self, request, pk):
        reply, err = self._get_reply(pk, request.user)
        if err:
            return err
        serializer = ReviewReplySerializer(reply, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        reply, err = self._get_reply(pk, request.user)
        if err:
            return err
        reply.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDeleteReviewView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def delete(self, _request, pk):
        try:
            review = Avis.objects.get(pk=pk)
        except Avis.DoesNotExist:
            return Response({'error': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDeleteReplyView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def delete(self, _request, pk):
        try:
            reply = ReviewReply.objects.get(pk=pk)
        except ReviewReply.DoesNotExist:
            return Response({'error': 'Reponse introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        reply.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
