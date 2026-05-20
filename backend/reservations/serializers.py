from rest_framework import serializers

from medicaments.models import Stock
from pharmacies.models import Pharmacy

from .models import Reservation, ReservationItem


class ReservationItemSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    sous_total = serializers.SerializerMethodField()

    class Meta:
        model = ReservationItem
        fields = [
            'id',
            'medicament',
            'medicament_nom',
            'quantite',
            'prix_unitaire',
            'sous_total',
        ]
        read_only_fields = ['medicament_nom', 'prix_unitaire', 'sous_total']
        extra_kwargs = {
            'quantite': {'min_value': 1},
        }

    def get_sous_total(self, obj):
        return obj.quantite * obj.prix_unitaire


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id',
            'user',
            'user_username',
            'pharmacie',
            'pharmacie_nom',
            'date_reservation',
            'date_modification',
            'statut',
            'items',
            'total',
        ]
        read_only_fields = [
            'id',
            'user',
            'date_reservation',
            'date_modification',
            'statut',
            'total',
        ]

    def get_total(self, obj):
        return sum(item.quantite * item.prix_unitaire for item in obj.items.all())

    def validate_pharmacie(self, value):
        if not Pharmacy.objects.filter(
            pk=value.pk,
            est_valide=True,
            statut_validation='validee',
        ).exists():
            raise serializers.ValidationError(
                "Cette pharmacie n'est pas disponible pour une reservation publique."
            )

        return value

    def validate(self, attrs):
        pharmacie = attrs.get('pharmacie')
        items = attrs.get('items') or []

        if not items:
            raise serializers.ValidationError(
                {'items': 'Ajoutez au moins un medicament au panier avant de reserver.'}
            )

        seen_medicaments = set()

        for item in items:
            medicament = item['medicament']
            quantite = item['quantite']

            if medicament.pk in seen_medicaments:
                raise serializers.ValidationError(
                    {'items': 'Chaque medicament ne peut apparaitre qu une seule fois dans la reservation.'}
                )

            seen_medicaments.add(medicament.pk)

            try:
                stock = Stock.objects.select_related('medicament').get(
                    pharmacie=pharmacie,
                    medicament=medicament,
                )
            except Stock.DoesNotExist:
                raise serializers.ValidationError(
                    {'items': f"{medicament.nom} n'est pas disponible dans cette pharmacie."}
                )

            if stock.quantite <= 0:
                raise serializers.ValidationError(
                    {'items': f"{medicament.nom} est actuellement en rupture de stock."}
                )

            if quantite > stock.quantite:
                raise serializers.ValidationError(
                    {
                        'items': (
                            f"Quantite indisponible pour {medicament.nom}. "
                            f"Disponible: {stock.quantite}."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        reservation = Reservation.objects.create(**validated_data)

        for item_data in items_data:
            stock = Stock.objects.get(
                pharmacie=reservation.pharmacie,
                medicament=item_data['medicament'],
            )
            ReservationItem.objects.create(
                reservation=reservation,
                medicament=item_data['medicament'],
                quantite=item_data['quantite'],
                prix_unitaire=stock.prix,
            )

        return reservation
