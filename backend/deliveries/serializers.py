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
    payment_id = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    client_phone = serializers.CharField(source='telephone', read_only=True)
    address = serializers.CharField(source='adresse_livraison', read_only=True)
    payment_status = serializers.CharField(source='reservation.statut_paiement', read_only=True)
    reservation_status = serializers.CharField(source='reservation.statut', read_only=True)
    delivery_status = serializers.CharField(source='statut', read_only=True)
    total_amount = serializers.DecimalField(
        source='reservation.montant_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    google_maps_url = serializers.SerializerMethodField()
    medicines = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='date_creation', read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation_id',
            'payment_id',
            'client_name',
            'client_phone',
            'address',
            'note',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'payment_status',
            'reservation_status',
            'delivery_status',
            'total_amount',
            'google_maps_url',
            'medicines',
            'created_at',
            'date_livraison_estimee',
            'date_livraison_reelle',
        ]

    def get_client_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or getattr(obj.user, 'phone_number', None) or obj.user.username

    def get_payment_id(self, obj):
        payment = getattr(obj.reservation, 'payment', None)
        return payment.id if payment else None

    def get_google_maps_url(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return f"https://www.google.com/maps?q={float(obj.latitude)},{float(obj.longitude)}"
        if obj.adresse_livraison:
            from urllib.parse import quote
            return f"https://www.google.com/maps/search/?api=1&query={quote(obj.adresse_livraison)}"
        return None

    def get_medicines(self, obj):
        items = obj.reservation.items.select_related('medicament').all()
        return [
            {
                'name': item.medicament.nom,
                'quantity': item.quantite,
                'unit_price': float(item.prix_unitaire),
                'subtotal': float(item.sous_total),
            }
            for item in items
        ]


class AdminDeliverySerializer(serializers.ModelSerializer):
    """Read-only serializer for admin delivery list and detail."""

    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    reservation_statut = serializers.CharField(source='reservation.statut', read_only=True)
    reservation_statut_paiement = serializers.CharField(
        source='reservation.statut_paiement', read_only=True
    )
    reservation_montant_total = serializers.DecimalField(
        source='reservation.montant_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    google_maps_url = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = [
            'id',
            'reservation',
            'reservation_statut',
            'reservation_statut_paiement',
            'reservation_montant_total',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'user_email',
            'user_phone',
            'adresse_livraison',
            'telephone',
            'note',
            'distance_km',
            'tarif_par_km',
            'frais_livraison',
            'statut',
            'date_creation',
            'date_livraison_estimee',
            'date_livraison_reelle',
            'google_maps_url',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or getattr(obj.user, 'phone_number', None) or obj.user.username

    def get_google_maps_url(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return f"https://www.google.com/maps?q={float(obj.latitude)},{float(obj.longitude)}"
        if obj.adresse_livraison:
            from urllib.parse import quote
            return f"https://www.google.com/maps/search/?api=1&query={quote(obj.adresse_livraison)}"
        return None


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
