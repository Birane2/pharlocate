from rest_framework import serializers

from pharmacies.models import Pharmacy
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

    def validate_pharmacie(self, value):
        if not Pharmacy.objects.filter(
            pk=value.pk,
            est_valide=True,
            statut_validation='validee',
        ).exists():
            raise serializers.ValidationError(
                "Cette pharmacie n'est pas disponible pour un avis public."
            )

        return value
