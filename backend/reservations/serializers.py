from rest_framework import serializers
from .models import Reservation, ReservationItem


class ReservationItemSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)

    class Meta:
        model = ReservationItem
        fields = ['id', 'medicament', 'medicament_nom', 'quantite']


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'user',
            'user_username',
            'pharmacie',
            'pharmacie_nom',
            'date_reservation',
            'statut',
            'items',
        ]
        read_only_fields = ['id', 'user', 'date_reservation', 'statut']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        reservation = Reservation.objects.create(**validated_data)

        for item_data in items_data:
            ReservationItem.objects.create(reservation=reservation, **item_data)

        return reservation