from rest_framework import serializers

from medicaments.models import Stock
from reservations.models import Reservation
from .models import Horaire, Pharmacy
from .validators import (
    CoordinateDecimalField,
    validate_latitude_value,
    validate_longitude_value,
)


class AdminHoraireInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horaire
        fields = [
            'id',
            'jour',
            'heure_ouverture',
            'heure_fermeture',
            'est_ouvert',
            'est_garde',
        ]


class AdminStockInlineSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)

    class Meta:
        model = Stock
        fields = [
            'id',
            'medicament_nom',
            'quantite',
            'prix',
            'seuil_alerte',
            'status',
        ]


class AdminReservationInlineSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'user_username',
            'statut',
            'date_reservation',
        ]


class AdminPharmacyListSerializer(serializers.ModelSerializer):
    pharmacien_id = serializers.IntegerField(source='user.id', read_only=True)
    pharmacien_username = serializers.CharField(source='user.username', read_only=True)
    pharmacien_email = serializers.EmailField(source='user.email', read_only=True)
    horaires_count = serializers.IntegerField(read_only=True)
    stocks_count = serializers.IntegerField(read_only=True)
    reservations_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            'id',
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'telephone',
            'photo',
            'est_valide',
            'statut_validation',
            'motif_refus',
            'date_creation',
            'date_modification',
            'date_validation',
            'date_suspension',
            'pharmacien_id',
            'pharmacien_username',
            'pharmacien_email',
            'horaires_count',
            'stocks_count',
            'reservations_count',
        ]
        read_only_fields = fields


class AdminPharmacyDetailSerializer(AdminPharmacyListSerializer):
    horaires = AdminHoraireInlineSerializer(many=True, read_only=True)
    stocks = AdminStockInlineSerializer(many=True, read_only=True)
    reservations = AdminReservationInlineSerializer(many=True, read_only=True)

    class Meta(AdminPharmacyListSerializer.Meta):
        fields = AdminPharmacyListSerializer.Meta.fields + [
            'horaires',
            'stocks',
            'reservations',
        ]


class AdminPharmacyUpdateSerializer(serializers.ModelSerializer):
    latitude = CoordinateDecimalField(coordinate_label='Latitude')
    longitude = CoordinateDecimalField(coordinate_label='Longitude')

    class Meta:
        model = Pharmacy
        fields = [
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'telephone',
        ]

    def validate_latitude(self, value):
        return validate_latitude_value(value)

    def validate_longitude(self, value):
        return validate_longitude_value(value)


class PharmacyValidationSerializer(AdminPharmacyListSerializer):
    pass


class PharmacyRejectSerializer(serializers.Serializer):
    motif_refus = serializers.CharField(
        max_length=500,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )


class PharmacySuspendSerializer(serializers.Serializer):
    motif = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
