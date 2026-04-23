from rest_framework import serializers
from .models import Pharmacy, Horaire


class HoraireSerializer(serializers.ModelSerializer):
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)

    class Meta:
        model = Horaire
        fields = [
            'id',
            'pharmacie',
            'pharmacie_nom',
            'jour',
            'heure_ouverture',
            'heure_fermeture',
            'est_garde',
        ]


class PharmacySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    horaires = HoraireSerializer(many=True, read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            'id',
            'username',
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'telephone',
            'photo',
            'est_valide',
            'date_creation',
            'horaires',
        ]
        read_only_fields = ['id', 'est_valide', 'date_creation']