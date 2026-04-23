from rest_framework import serializers
from .models import Medicament, Stock


class MedicamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicament
        fields = [
            'id',
            'nom',
            'photo',
            'description',
            'date_creation',
        ]
        read_only_fields = ['id', 'date_creation']


class StockSerializer(serializers.ModelSerializer):
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)

    class Meta:
        model = Stock
        fields = [
            'id',
            'pharmacie',
            'pharmacie_nom',
            'medicament',
            'medicament_nom',
            'quantite',
            'prix',
            'date_mise_a_jour',
        ]
        read_only_fields = ['id', 'date_mise_a_jour']