from rest_framework import serializers

from pharmacies.models import Pharmacy
from .models import Avis, ReviewReply


class ReviewReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReply
        fields = ['id', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_message(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('La reponse ne peut pas etre vide.')
        return normalized


class AvisSerializer(serializers.ModelSerializer):
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    reply = ReviewReplySerializer(read_only=True)

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
            'reply',
        ]
        read_only_fields = ['id', 'pharmacie_nom', 'user_username', 'date', 'reply']

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

    def validate_note(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('La note doit etre comprise entre 1 et 5.')

        return value

    def validate_commentaire(self, value):
        normalized = value.strip()

        if not normalized:
            raise serializers.ValidationError('Le commentaire est obligatoire.')

        return normalized

    def validate(self, attrs):
        attrs = super().validate(attrs)

        request = self.context.get('request')
        user = getattr(request, 'user', None)
        pharmacie = attrs.get('pharmacie') or getattr(self.instance, 'pharmacie', None)

        if user and getattr(user, 'is_authenticated', False) and pharmacie:
            queryset = Avis.objects.filter(user=user, pharmacie=pharmacie)

            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError(
                    {'pharmacie': 'Vous avez deja publie un avis pour cette pharmacie.'}
                )

        return attrs
