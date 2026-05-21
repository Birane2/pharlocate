from rest_framework import serializers
import re
from django.db.models import Q
from django.utils import timezone

from medicaments.models import Stock
from reviews.models import Avis
from .models import Pharmacy, Horaire


class HoraireSerializer(serializers.ModelSerializer):
    id_horaire = serializers.IntegerField(source='id', read_only=True)
    pharmacie = serializers.PrimaryKeyRelatedField(read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)

    class Meta:
        model = Horaire
        fields = [
            'id_horaire',
            'pharmacie',
            'pharmacie_nom',
            'jour',
            'heure_ouverture',
            'heure_fermeture',
            'est_ouvert',
            'est_garde',
            'date_debut_garde',
            'date_fin_garde',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = [
            'id_horaire',
            'pharmacie',
            'date_creation',
            'date_modification',
        ]

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        heure_ouverture = attrs.get(
            'heure_ouverture',
            getattr(instance, 'heure_ouverture', None),
        )
        heure_fermeture = attrs.get(
            'heure_fermeture',
            getattr(instance, 'heure_fermeture', None),
        )
        date_debut_garde = attrs.get(
            'date_debut_garde',
            getattr(instance, 'date_debut_garde', None),
        )
        date_fin_garde = attrs.get(
            'date_fin_garde',
            getattr(instance, 'date_fin_garde', None),
        )
        est_garde = attrs.get(
            'est_garde',
            getattr(instance, 'est_garde', False),
        )

        if heure_ouverture and heure_fermeture and heure_fermeture <= heure_ouverture:
            raise serializers.ValidationError({
                'heure_fermeture': "L'heure de fermeture doit être supérieure à l'heure d'ouverture."
            })

        if date_debut_garde and date_fin_garde and date_debut_garde > date_fin_garde:
            raise serializers.ValidationError({
                'date_fin_garde': 'La date de fin de garde doit être supérieure ou égale à la date de début.'
            })

        if est_garde and bool(date_debut_garde) != bool(date_fin_garde):
            raise serializers.ValidationError({
                'date_debut_garde': 'Les dates de garde doivent être renseignées ensemble.',
                'date_fin_garde': 'Les dates de garde doivent être renseignées ensemble.',
            })

        return attrs


class PharmacySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    horaires = HoraireSerializer(many=True, read_only=True)
    is_open = serializers.SerializerMethodField()
    est_garde = serializers.SerializerMethodField()

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
            'statut_validation',
            'motif_refus',
            'date_creation',
            'date_modification',
            'date_validation',
            'date_suspension',
            'is_open',
            'est_garde',
            'horaires',
        ]
        read_only_fields = [
            'id',
            'est_valide',
            'statut_validation',
            'motif_refus',
            'date_creation',
            'date_modification',
            'date_validation',
            'date_suspension',
        ]

    def get_is_open(self, obj):
        now = timezone.localtime()
        current_day = now.strftime('%A').lower()
        day_mapping = {
            'monday': 'lundi',
            'tuesday': 'mardi',
            'wednesday': 'mercredi',
            'thursday': 'jeudi',
            'friday': 'vendredi',
            'saturday': 'samedi',
            'sunday': 'dimanche',
        }
        jour = day_mapping.get(current_day)

        if not jour:
            return False

        current_time = now.time()
        return obj.horaires.filter(
            jour=jour,
            est_ouvert=True,
            heure_ouverture__lte=current_time,
            heure_fermeture__gte=current_time,
        ).exists()

    def get_est_garde(self, obj):
        now = timezone.localtime()
        return obj.horaires.filter(est_garde=True).filter(
            Q(date_debut_garde__isnull=True, date_fin_garde__isnull=True)
            | Q(
                date_debut_garde__lte=now,
                date_fin_garde__gte=now,
            )
        ).exists()


class NearbyPharmacySerializer(PharmacySerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta(PharmacySerializer.Meta):
        model = Pharmacy
        fields = [
            'id',
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'telephone',
            'est_valide',
            'statut_validation',
            'is_open',
            'est_garde',
            'distance',
        ]


class PublicPharmacyReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Avis
        fields = [
            'id',
            'user_username',
            'note',
            'commentaire',
            'date',
        ]


class PublicPharmacyStockSerializer(serializers.ModelSerializer):
    id_stock = serializers.IntegerField(source='id', read_only=True)
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    medicament_photo = serializers.ImageField(source='medicament.photo', read_only=True)
    medicament_description = serializers.CharField(
        source='medicament.description',
        read_only=True,
    )
    medicament_categorie = serializers.CharField(
        source='medicament.categorie',
        read_only=True,
    )
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Stock
        fields = [
            'id_stock',
            'medicament',
            'medicament_nom',
            'medicament_photo',
            'medicament_description',
            'medicament_categorie',
            'quantite',
            'prix',
            'status',
            'date_modification',
        ]


class PharmacyDetailSerializer(PharmacySerializer):
    avis = PublicPharmacyReviewSerializer(many=True, read_only=True)
    stocks = serializers.SerializerMethodField()
    note_moyenne = serializers.SerializerMethodField()
    total_avis = serializers.SerializerMethodField()

    class Meta(PharmacySerializer.Meta):
        fields = PharmacySerializer.Meta.fields + [
            'avis',
            'stocks',
            'note_moyenne',
            'total_avis',
        ]

    def get_stocks(self, obj):
        available_stocks = obj.stocks.filter(quantite__gt=0).select_related('medicament')
        return PublicPharmacyStockSerializer(
            available_stocks,
            many=True,
            context=self.context,
        ).data

    def get_note_moyenne(self, obj):
        notes = [avis.note for avis in obj.avis.all()]
        if not notes:
            return 0
        return round(sum(notes) / len(notes), 1)

    def get_total_avis(self, obj):
        return obj.avis.count()


class PharmacyProfileSerializer(serializers.ModelSerializer):
    id_pharmacie = serializers.IntegerField(source='id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            'id_pharmacie',
            'username',
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'telephone',
            'photo',
            'est_valide',
            'statut_validation',
            'motif_refus',
            'date_creation',
            'date_modification',
            'date_validation',
            'date_suspension',
        ]
        read_only_fields = [
            'id_pharmacie',
            'username',
            'photo',
            'est_valide',
            'statut_validation',
            'motif_refus',
            'date_creation',
            'date_modification',
            'date_validation',
            'date_suspension',
        ]

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                'La latitude doit etre comprise entre -90 et 90.'
            )
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                'La longitude doit etre comprise entre -180 et 180.'
            )
        return value

    def validate_telephone(self, value):
        if not re.match(r'^\+?[0-9\s().-]{6,20}$', value):
            raise serializers.ValidationError(
                'Le telephone doit etre valide.'
            )
        return value


class PharmacyPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['photo']
