from datetime import datetime

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.admin_serializers import (
    AdminChangeUserRoleSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
)
from accounts.pagination import UserPagination
from config.permissions import IsAdminRole, IsAuthenticatedWithTokenMessage
from medicaments.models import Medicament, Stock
from notifications_app.models import Notification
from pharmacies.admin_serializers import (
    AdminPharmacyDetailSerializer,
    AdminPharmacyListSerializer,
    AdminPharmacyUpdateSerializer,
    PharmacyRejectSerializer,
    PharmacySuspendSerializer,
    PharmacyValidationSerializer,
)
from pharmacies.models import Pharmacy
from reservations.models import Reservation


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def _get_reservation_refused_count(self, queryset):
        return queryset.filter(statut__in=['refusee', 'annulee']).count()

    def get(self, request):
        date_param = request.query_params.get('date')
        selected_date = None

        if date_param:
            try:
                selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Format de date invalide. Utilisez YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        pharmacies_all = Pharmacy.objects.select_related('user').all()
        users_all = User.objects.all()
        reservations_all = Reservation.objects.select_related('user', 'pharmacie').all()
        medicaments_all = Medicament.objects.all()
        stocks_all = Stock.objects.all()

        if selected_date:
            pharmacies = pharmacies_all.filter(date_creation__date=selected_date)
            validated_pharmacies = pharmacies_all.filter(date_validation__date=selected_date)
            suspended_pharmacies = pharmacies_all.filter(date_suspension__date=selected_date)
            users = users_all.filter(date_creation__date=selected_date)
            reservations = reservations_all.filter(date_reservation__date=selected_date)
            medicaments = medicaments_all.filter(date_creation__date=selected_date)
            stocks = stocks_all.filter(
                Q(date_creation__date=selected_date)
                | Q(date_modification__date=selected_date)
            )
        else:
            pharmacies = pharmacies_all
            validated_pharmacies = pharmacies_all.filter(est_valide=True)
            suspended_pharmacies = pharmacies_all.filter(statut_validation='suspendue')
            users = users_all
            reservations = reservations_all
            medicaments = medicaments_all
            stocks = stocks_all

        users_by_role = {
            item['role']: item['total']
            for item in users.values('role').annotate(total=Count('id'))
        }

        latest_pharmacies = pharmacies.order_by('-date_creation')[:4]
        latest_reservations = reservations.order_by('-date_reservation')[:4]

        latest_activities = [
            {
                'id': f'pharmacy-{pharmacy.id}',
                'type': 'pharmacy',
                'title': pharmacy.nom,
                'description': (
                    'Pharmacie validee'
                    if pharmacy.est_valide
                    else 'Pharmacie en attente de validation'
                ),
                'date': pharmacy.date_creation,
                'status': (
                    'validee'
                    if pharmacy.est_valide
                    else pharmacy.statut_validation or 'en_attente'
                ),
            }
            for pharmacy in latest_pharmacies
        ] + [
            {
                'id': f'reservation-{reservation.id}',
                'type': 'reservation',
                'title': f'Reservation #{reservation.id}',
                'description': (
                    f'{reservation.user.username} - {reservation.pharmacie.nom} '
                    f'({reservation.statut})'
                ),
                'date': reservation.date_reservation,
                'status': reservation.statut,
            }
            for reservation in latest_reservations
        ]

        latest_activities = sorted(
            latest_activities,
            key=lambda activity: activity['date'],
            reverse=True,
        )[:6]

        return Response({
            'pharmacies': {
                'total': pharmacies.count(),
                'validees': validated_pharmacies.count(),
                'en_attente': pharmacies.filter(statut_validation='en_attente').count(),
                'suspendues': suspended_pharmacies.count(),
                'refusees': pharmacies.filter(statut_validation='refusee').count(),
            },
            'users': {
                'total': users.count(),
                'by_role': {
                    'admin': users_by_role.get('admin', 0),
                    'pharmacien': users_by_role.get('pharmacien', 0),
                    'utilisateur': users_by_role.get('utilisateur', 0),
                },
            },
            'reservations': {
                'total': reservations.count(),
                'en_attente': reservations.filter(statut='en_attente').count(),
                'confirmees': reservations.filter(statut='confirmee').count(),
                'refusees': self._get_reservation_refused_count(reservations),
                'recuperees': reservations.filter(statut='livree').count(),
                'annulees': reservations.filter(statut='annulee').count(),
            },
            'medicaments': {
                'total': medicaments.count(),
            },
            'stocks': {
                'total': stocks.count(),
                'faibles': stocks.filter(quantite__gt=0, quantite__lte=5).count(),
                'rupture': stocks.filter(quantite=0).count(),
            },
            'selected_date': selected_date.isoformat() if selected_date else None,
            'stats': {
                'total_pharmacies': pharmacies.count(),
                'validated_pharmacies': validated_pharmacies.count(),
                'pending_pharmacies': pharmacies.filter(statut_validation='en_attente').count(),
                'total_users': users.count(),
                'total_pharmacists': users_by_role.get('pharmacien', 0),
                'total_reservations': reservations.count(),
                'total_medicaments': medicaments.count(),
                'total_stocks': stocks.count(),
            },
            'charts': {
                'pharmacies_distribution': {
                    'validated': validated_pharmacies.count(),
                    'pending': pharmacies.filter(statut_validation='en_attente').count(),
                    'suspended': suspended_pharmacies.count(),
                },
                'reservations_by_status': {
                    'en_attente': reservations.filter(statut='en_attente').count(),
                    'confirmee': reservations.filter(statut='confirmee').count(),
                    'livree': reservations.filter(statut='livree').count(),
                    'refusee': self._get_reservation_refused_count(reservations),
                },
            },
            'alerts': {
                'pending_pharmacies': pharmacies.filter(statut_validation='en_attente').count(),
                'low_stocks': stocks.filter(quantite__gt=0, quantite__lte=5).count(),
                'out_of_stocks': stocks.filter(quantite=0).count(),
                'pending_reservations': reservations.filter(statut='en_attente').count(),
            },
            'latest_activities': latest_activities,
            'recent_activities': latest_activities,
        })


class AdminPharmacyPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 25


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    pagination_class = UserPagination

    def get_queryset(self):
        queryset = User.objects.select_related('pharmacy').order_by('-date_creation')
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        statut = self.request.query_params.get('statut')

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(role__icontains=search)
            )

        if role in {'admin', 'pharmacien', 'utilisateur'}:
            queryset = queryset.filter(role=role)

        if statut == 'actif':
            queryset = queryset.filter(is_active=True)
        elif statut == 'suspendu':
            queryset = queryset.filter(is_active=False)

        return queryset


class AdminUserDetailView(generics.RetrieveDestroyAPIView):
    queryset = User.objects.select_related('pharmacy').all()
    serializer_class = AdminUserDetailSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if request.user.id == user.id:
            return Response(
                {'error': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_last_active_admin = (
            user.role == 'admin'
            and user.is_active
            and User.objects.filter(role='admin', is_active=True).count() <= 1
        )

        if is_last_active_admin:
            return Response(
                {'error': 'Impossible de supprimer le dernier administrateur actif.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = user.username
        user.delete()
        return Response(
            {'message': f'Utilisateur {username} supprime avec succes.'},
            status=status.HTTP_200_OK,
        )


class AdminUserActionMixin:
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_user(self, pk):
        try:
            return User.objects.select_related('pharmacy').get(pk=pk)
        except User.DoesNotExist:
            return None

    def get_not_found_response(self):
        return Response(
            {'error': 'Utilisateur introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    def is_last_active_admin(self, user):
        return (
            user.role == 'admin'
            and user.is_active
            and User.objects.filter(role='admin', is_active=True).count() <= 1
        )


class AdminUserActivateView(AdminUserActionMixin, APIView):
    def patch(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return self.get_not_found_response()

        if user.is_active:
            return Response(
                {'message': 'Ce compte est deja actif.'},
                status=status.HTTP_200_OK,
            )

        user.is_active = True
        user.save(update_fields=['is_active'])

        return Response({
            'message': 'Compte utilisateur active avec succes.',
            'data': AdminUserDetailSerializer(user).data,
        })


class AdminUserSuspendView(AdminUserActionMixin, APIView):
    def patch(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return self.get_not_found_response()

        if request.user.id == user.id:
            return Response(
                {'error': 'Vous ne pouvez pas suspendre votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if self.is_last_active_admin(user):
            return Response(
                {'error': 'Impossible de suspendre le dernier administrateur actif.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {'message': 'Ce compte est deja suspendu.'},
                status=status.HTTP_200_OK,
            )

        user.is_active = False
        user.save(update_fields=['is_active'])

        return Response({
            'message': 'Compte utilisateur suspendu avec succes.',
            'data': AdminUserDetailSerializer(user).data,
        })


class AdminUserChangeRoleView(AdminUserActionMixin, APIView):
    def patch(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return self.get_not_found_response()

        serializer = AdminChangeUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_role = serializer.validated_data['role']

        if request.user.id == user.id and user.role != new_role:
            return Response(
                {'error': 'Vous ne pouvez pas modifier votre propre role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == new_role:
            return Response(
                {'message': 'Aucun changement detecte pour ce role.'},
                status=status.HTTP_200_OK,
            )

        if self.is_last_active_admin(user) and new_role != 'admin':
            return Response(
                {'error': 'Impossible de modifier le role du dernier administrateur actif.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == 'pharmacien' and new_role != 'pharmacien':
            try:
                pharmacy = user.pharmacy
            except Pharmacy.DoesNotExist:
                pharmacy = None

            if pharmacy:
                return Response(
                    {
                        'error': (
                            'Impossible de retirer le role pharmacien: '
                            'une pharmacie est encore associee a ce compte.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.role = new_role
        user.save(update_fields=['role'])

        return Response({
            'message': 'Role utilisateur mis a jour avec succes.',
            'data': AdminUserDetailSerializer(user).data,
        })


class AdminUserDeleteView(AdminUserActionMixin, APIView):
    def delete(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return self.get_not_found_response()

        if request.user.id == user.id:
            return Response(
                {'error': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if self.is_last_active_admin(user):
            return Response(
                {'error': 'Impossible de supprimer le dernier administrateur actif.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = user.username
        user.delete()
        return Response(
            {'message': f'Utilisateur {username} supprime avec succes.'},
            status=status.HTTP_200_OK,
        )


class AdminPendingPharmacyListView(generics.ListAPIView):
    serializer_class = PharmacyValidationSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    pagination_class = AdminPharmacyPagination

    def get_queryset(self):
        return (
            Pharmacy.objects.select_related('user')
            .filter(est_valide=False, statut_validation='en_attente')
            .order_by('-date_creation')
        )


class AdminPharmacyListView(generics.ListAPIView):
    serializer_class = AdminPharmacyListSerializer
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]
    pagination_class = AdminPharmacyPagination

    def get_queryset(self):
        queryset = (
            Pharmacy.objects.select_related('user')
            .annotate(
                horaires_count=Count('horaires', distinct=True),
                stocks_count=Count('stocks', distinct=True),
                reservations_count=Count('reservations', distinct=True),
            )
            .order_by('-date_creation')
        )
        search = self.request.query_params.get('search')
        statut_validation = self.request.query_params.get('statut_validation')

        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search)
                | Q(adresse__icontains=search)
                | Q(telephone__icontains=search)
                | Q(user__username__icontains=search)
                | Q(user__email__icontains=search)
            )

        if statut_validation:
            queryset = queryset.filter(statut_validation=statut_validation)

        return queryset


class AdminPharmacyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = (
        Pharmacy.objects.select_related('user')
        .prefetch_related('horaires', 'stocks__medicament', 'reservations__user')
        .annotate(
            horaires_count=Count('horaires', distinct=True),
            stocks_count=Count('stocks', distinct=True),
            reservations_count=Count('reservations', distinct=True),
        )
    )
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminPharmacyUpdateSerializer
        return AdminPharmacyDetailSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        pharmacy = self.get_object()
        response.data = {
            'message': 'Pharmacie modifiee avec succes.',
            'data': AdminPharmacyDetailSerializer(pharmacy).data,
        }
        return response

    def destroy(self, request, *args, **kwargs):
        pharmacy = self.get_object()
        pharmacy_name = pharmacy.nom
        pharmacy.delete()
        return Response(
            {'message': f'Pharmacie {pharmacy_name} supprimee avec succes.'},
            status=status.HTTP_200_OK,
        )


class AdminPharmacyValidateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        try:
            pharmacy = Pharmacy.objects.select_related('user').get(pk=pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {'error': 'Pharmacie introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        pharmacy.est_valide = True
        pharmacy.statut_validation = 'validee'
        pharmacy.motif_refus = ''
        pharmacy.date_suspension = None
        pharmacy.date_validation = timezone.now()
        pharmacy.save(
            update_fields=[
                'est_valide',
                'statut_validation',
                'motif_refus',
                'date_validation',
                'date_suspension',
                'date_modification',
            ]
        )

        Notification.objects.create(
            user=pharmacy.user,
            message=f"Votre pharmacie {pharmacy.nom} a ete validee.",
            type='confirmation',
        )

        return Response({
            'message': 'Pharmacie validee avec succes.',
            'data': PharmacyValidationSerializer(pharmacy).data,
        })


class AdminPharmacyRejectView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        serializer = PharmacyRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pharmacy = Pharmacy.objects.select_related('user').get(pk=pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {'error': 'Pharmacie introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        motif_refus = serializer.validated_data['motif_refus']
        pharmacy.est_valide = False
        pharmacy.statut_validation = 'refusee'
        pharmacy.motif_refus = motif_refus
        pharmacy.date_suspension = None
        pharmacy.date_validation = timezone.now()
        pharmacy.save(
            update_fields=[
                'est_valide',
                'statut_validation',
                'motif_refus',
                'date_validation',
                'date_suspension',
                'date_modification',
            ]
        )

        Notification.objects.create(
            user=pharmacy.user,
            message=f"Votre pharmacie {pharmacy.nom} a ete refusee. Motif: {motif_refus}",
            type='alerte',
        )

        return Response({
            'message': 'Pharmacie refusee avec succes.',
            'data': PharmacyValidationSerializer(pharmacy).data,
        })


class AdminPharmacySuspendView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        serializer = PharmacySuspendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pharmacy = Pharmacy.objects.select_related('user').get(pk=pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {'error': 'Pharmacie introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        motif = serializer.validated_data.get('motif') or 'Suspension administrative.'
        pharmacy.est_valide = False
        pharmacy.statut_validation = 'suspendue'
        pharmacy.motif_refus = motif
        pharmacy.date_suspension = timezone.now()
        pharmacy.save(
            update_fields=[
                'est_valide',
                'statut_validation',
                'motif_refus',
                'date_suspension',
                'date_modification',
            ]
        )

        Notification.objects.create(
            user=pharmacy.user,
            message=f"Votre pharmacie {pharmacy.nom} a ete suspendue. Motif: {motif}",
            type='alerte',
        )

        return Response({
            'message': 'Pharmacie suspendue avec succes.',
            'data': PharmacyValidationSerializer(pharmacy).data,
        })


class AdminPharmacyReactivateView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def patch(self, request, pk):
        try:
            pharmacy = Pharmacy.objects.select_related('user').get(pk=pk)
        except Pharmacy.DoesNotExist:
            return Response(
                {'error': 'Pharmacie introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        pharmacy.est_valide = True
        pharmacy.statut_validation = 'validee'
        pharmacy.motif_refus = ''
        pharmacy.date_validation = timezone.now()
        pharmacy.date_suspension = None
        pharmacy.save(
            update_fields=[
                'est_valide',
                'statut_validation',
                'motif_refus',
                'date_validation',
                'date_suspension',
                'date_modification',
            ]
        )

        Notification.objects.create(
            user=pharmacy.user,
            message=f"Votre pharmacie {pharmacy.nom} a ete reactivee.",
            type='confirmation',
        )

        return Response({
            'message': 'Pharmacie reactivee avec succes.',
            'data': PharmacyValidationSerializer(pharmacy).data,
        })
