from rest_framework import serializers

from .models import Delivery, DeliveryFeeConfig


class DeliverySerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(
        source='pharmacy.nom',
        read_only=True
    )

    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'delivery_address',
            'delivery_phone',
            'delivery_note',
            'client_latitude',
            'client_longitude',
            'distance_km',
            'delivery_fee',
            'status',
            'created_at',
            'updated_at',
            'delivered_at',
        ]

        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'distance_km',
            'delivery_fee',
            'status',
            'created_at',
            'updated_at',
            'delivered_at',
        ]

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()

        if full_name:
            return full_name

        return obj.user.username

    def validate_delivery_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "L'adresse de livraison est obligatoire."
            )

        return value

    def validate_delivery_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Le numéro de téléphone de livraison est obligatoire."
            )

        return value

    def validate(self, attrs):
        latitude = attrs.get('client_latitude')
        longitude = attrs.get('client_longitude')

        if latitude is None or longitude is None:
            raise serializers.ValidationError({
                'location': 'La position GPS du client est obligatoire pour la livraison.'
            })

        return attrs


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            'en_attente',
            'en_preparation',
            'en_cours',
            'livree',
            'annulee',
            'echec',
        ]
    )


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