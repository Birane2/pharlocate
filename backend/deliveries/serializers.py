from rest_framework import serializers

from .models import Delivery, DeliveryFeeConfig


class DeliverySerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    user_name = serializers.SerializerMethodField()
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        write_only=True,
        required=True,
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        write_only=True,
        required=True,
    )

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'adresse_livraison',
            'telephone',
            'note',
            'latitude',
            'longitude',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'statut',
            'date_creation',
            'date_livraison_estimee',
            'date_livraison_reelle',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'statut',
            'date_creation',
            'date_livraison_estimee',
            'date_livraison_reelle',
        ]

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.username

    def validate_adresse_livraison(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "L'adresse de livraison est obligatoire."
            )
        return value.strip()

    def validate_telephone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                'Le numero de telephone de livraison est obligatoire.'
            )
        return value.strip()


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(choices=Delivery.STATUT_CHOICES)


class DeliveryFeeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryFeeConfig
        fields = [
            'id',
            'price_per_km',
            'minimum_fee',
            'is_active',
            'created_at',
        ]
