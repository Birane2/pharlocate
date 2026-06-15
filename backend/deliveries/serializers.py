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


class PharmacistDeliverySerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source='reservation.id', read_only=True)
    client_name = serializers.SerializerMethodField()
    client_phone = serializers.CharField(source='telephone', read_only=True)
    address = serializers.CharField(source='adresse_livraison', read_only=True)
    latitude_client = serializers.DecimalField(
        source='latitude',
        max_digits=9,
        decimal_places=6,
        read_only=True,
    )
    longitude_client = serializers.DecimalField(
        source='longitude',
        max_digits=9,
        decimal_places=6,
        read_only=True,
    )
    payment_status = serializers.CharField(source='reservation.statut_paiement', read_only=True)
    delivery_status = serializers.CharField(source='statut', read_only=True)
    total_amount = serializers.DecimalField(
        source='reservation.montant_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    medicines = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='date_creation', read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation_id',
            'client_name',
            'client_phone',
            'address',
            'latitude_client',
            'longitude_client',
            'payment_status',
            'delivery_status',
            'total_amount',
            'medicines',
            'created_at',
        ]

    def get_client_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.phone_number or obj.user.username

    def get_medicines(self, obj):
        items = obj.reservation.items.select_related('medicament').all()
        return [
            {
                'name': item.medicament.nom,
                'quantity': item.quantite,
                'unit_price': item.prix_unitaire,
                'subtotal': item.sous_total,
            }
            for item in items
        ]


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
