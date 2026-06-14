from rest_framework import serializers

from reservations.models import Reservation

from .models import Delivery, DeliveryStatusHistory
from .services import create_delivery_for_reservation


class DeliveryStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryStatusHistory
        fields = [
            'ancien_statut',
            'nouveau_statut',
            'changed_by',
            'changed_by_name',
            'commentaire',
            'date_changement',
        ]
        read_only_fields = [
            'ancien_statut',
            'nouveau_statut',
            'changed_by',
            'changed_by_name',
            'commentaire',
            'date_changement',
        ]

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return None
        return obj.changed_by.get_full_name() or obj.changed_by.username


class DeliverySerializer(serializers.ModelSerializer):
    status_history = DeliveryStatusHistorySerializer(many=True, read_only=True)
    user_name = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation',
            'user',
            'user_name',
            'pharmacy',
            'pharmacy_name',
            'adresse_livraison',
            'telephone',
            'latitude',
            'longitude',
            'note',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'statut',
            'date_creation',
            'date_livraison_estimee',
            'date_livraison_reelle',
            'status_history',
        ]
        read_only_fields = [
            'id',
            'user_name',
            'pharmacy_name',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'date_creation',
            'date_livraison_reelle',
            'status_history',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class DeliveryCreateSerializer(serializers.Serializer):
    reservation = serializers.PrimaryKeyRelatedField(
        queryset=Reservation.objects.select_related('user', 'pharmacie').all()
    )
    adresse_livraison = serializers.CharField()
    telephone = serializers.CharField(max_length=20)
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        reservation = attrs['reservation']

        if not user or not user.is_authenticated:
            raise serializers.ValidationError(
                {'detail': 'Vous devez etre connecte pour creer une livraison.'}
            )

        if reservation.user_id != user.id:
            raise serializers.ValidationError(
                {'reservation': 'Cette reservation ne vous appartient pas.'}
            )

        if reservation.mode_retrait != 'livraison':
            raise serializers.ValidationError(
                {'reservation': 'Cette reservation est configuree en retrait.'}
            )

        if hasattr(reservation, 'delivery'):
            raise serializers.ValidationError(
                {'reservation': 'Cette reservation possede deja une livraison.'}
            )

        if not attrs.get('adresse_livraison', '').strip():
            raise serializers.ValidationError(
                {'adresse_livraison': "L'adresse de livraison est obligatoire."}
            )

        if not attrs.get('telephone', '').strip():
            raise serializers.ValidationError(
                {'telephone': 'Le telephone de livraison est obligatoire.'}
            )

        return attrs

    def create(self, validated_data):
        reservation = validated_data.pop('reservation')
        return create_delivery_for_reservation(
            reservation=reservation,
            adresse_livraison=validated_data['adresse_livraison'],
            telephone=validated_data['telephone'],
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude'),
            note=validated_data.get('note', ''),
        )


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(choices=Delivery.STATUT_CHOICES)
    commentaire = serializers.CharField(required=False, allow_blank=True)

    def validate_statut(self, value):
        delivery = self.context.get('delivery')
        if delivery and delivery.statut == value:
            raise serializers.ValidationError('La livraison possede deja ce statut.')
        return value
