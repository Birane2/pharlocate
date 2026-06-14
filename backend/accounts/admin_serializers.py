from rest_framework import serializers

from pharmacies.models import Pharmacy

from .models import User


class AdminUserListSerializer(serializers.ModelSerializer):
    statut = serializers.SerializerMethodField()
    nom_complet = serializers.SerializerMethodField()
    has_pharmacy = serializers.SerializerMethodField()
    pharmacy_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'phone_number',
            'first_name',
            'last_name',
            'email',
            'role',
            'is_email_verified',
            'is_phone_verified',
            'statut',
            'nom_complet',
            'date_creation',
            'has_pharmacy',
            'pharmacy_name',
        ]

    def get_statut(self, obj):
        return 'actif' if obj.is_active else 'suspendu'

    def get_nom_complet(self, obj):
        full_name = f'{obj.first_name} {obj.last_name}'.strip()
        return full_name or obj.phone_number or obj.username

    def get_has_pharmacy(self, obj):
        if obj.role != 'pharmacien':
            return False
        try:
            obj.pharmacy
            return True
        except Pharmacy.DoesNotExist:
            return False

    def get_pharmacy_name(self, obj):
        if obj.role != 'pharmacien':
            return None
        try:
            return obj.pharmacy.nom
        except Pharmacy.DoesNotExist:
            return None


class AdminUserDetailSerializer(AdminUserListSerializer):
    pharmacy = serializers.SerializerMethodField()

    class Meta(AdminUserListSerializer.Meta):
        fields = AdminUserListSerializer.Meta.fields + ['pharmacy']

    def get_pharmacy(self, obj):
        if obj.role != 'pharmacien':
            return None

        try:
            pharmacy = obj.pharmacy
        except Pharmacy.DoesNotExist:
            return None

        return {
            'id': pharmacy.id,
            'nom': pharmacy.nom,
            'statut_validation': pharmacy.statut_validation,
            'est_valide': pharmacy.est_valide,
        }


class AdminChangeUserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
