from rest_framework import serializers

from medicaments.models import Stock
from .models import Reservation, ReservationItem
from .services import calculate_reservation_amount


class ReservationItemCreateSerializer(serializers.Serializer):
    stock = serializers.IntegerField()
    quantite = serializers.IntegerField(min_value=1)


class ReservationItemSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(
        source='medicament.nom',
        read_only=True
    )

    class Meta:
        model = ReservationItem
        fields = [
            'id',
            'medicament',
            'medicament_nom',
            'quantite',
            'prix_unitaire',
            'sous_total',
            'created_at',
        ]


class AdminReservationSerializer(serializers.ModelSerializer):
    """Read-only serializer for admin reservation list and detail."""

    items = ReservationItemSerializer(many=True, read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    nb_items = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'user_phone',
            'pharmacie',
            'pharmacie_nom',
            'items',
            'nb_items',
            'type_reservation',
            'statut',
            'statut_paiement',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or getattr(obj.user, 'phone_number', None) or obj.user.username

    def get_nb_items(self, obj):
        # len() uses prefetch_related cache — no extra query when items prefetched
        return len(obj.items.all())


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True, read_only=True)

    items_data = ReservationItemCreateSerializer(
        many=True,
        write_only=True,
        required=True
    )

    pharmacie_nom = serializers.CharField(
        source='pharmacie.nom',
        read_only=True
    )

    user_name = serializers.CharField(
        source='user.get_full_name',
        read_only=True
    )

    class Meta:
        model = Reservation
        fields = [
            'id',
            'user',
            'user_name',
            'pharmacie',
            'pharmacie_nom',
            'items',
            'items_data',
            'type_reservation',
            'statut',
            'statut_paiement',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'date_creation',
            'date_modification',
        ]

        read_only_fields = [
            'id',
            'user',
            'user_name',
            'statut',
            'statut_paiement',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'date_creation',
            'date_modification',
        ]

    def validate_items_data(self, value):
        if not value:
            raise serializers.ValidationError(
                'La réservation doit contenir au moins un médicament.'
            )

        return value

    def validate(self, attrs):
        pharmacie = attrs.get('pharmacie')
        items_data = attrs.get('items_data', [])

        for item in items_data:
            try:
                stock = Stock.objects.get(id=item['stock'])
            except Stock.DoesNotExist:
                raise serializers.ValidationError({
                    'items_data': f"Stock introuvable : {item['stock']}"
                })

            if stock.pharmacie != pharmacie:
                raise serializers.ValidationError({
                    'items_data': "Tous les médicaments doivent appartenir à la même pharmacie."
                })

            if item['quantite'] > stock.quantite:
                raise serializers.ValidationError({
                    'items_data': f"Stock insuffisant pour {stock.medicament.nom}."
                })

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items_data')
        user = self.context['request'].user

        reservation = Reservation.objects.create(
            user=user,
            statut='en_attente',
            **validated_data
        )

        for item in items_data:
            stock = Stock.objects.get(id=item['stock'])

            ReservationItem.objects.create(
                reservation=reservation,
                medicament=stock.medicament,
                quantite=item['quantite'],
                prix_unitaire=stock.prix,
            )

        calculate_reservation_amount(reservation)

        return reservation
