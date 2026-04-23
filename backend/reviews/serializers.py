from rest_framework import serializers

from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Avis
        fields = [
            'id',
            'pharmacie',
            'pharmacie_nom',
            'user_username',
            'note',
            'commentaire',
            'date',
        ]
        read_only_fields = ['id', 'pharmacie_nom', 'user_username', 'date']
