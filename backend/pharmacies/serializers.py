from decimal import Decimal
import re
import urllib.request

from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone

from medicaments.models import Stock
from reviews.models import Avis
from .models import Pharmacy, Horaire
from .validators import (
    CoordinateDecimalField,
    round_coordinate_decimal,
    validate_latitude_value,
    validate_longitude_value,
)


_GOOGLE_MAPS_DOMAIN_RE = re.compile(
    r'(maps\.google\.com|google\.com/maps|goo\.gl/maps|maps\.app\.goo\.gl)',
    re.IGNORECASE,
)
_Q_PARAM_RE = re.compile(r'[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)')
_AT_RE = re.compile(r'@(-?\d+\.?\d*),(-?\d+\.?\d*)')
_LL_PARAM_RE = re.compile(r'[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)')
_SHORT_URL_RE = re.compile(r'(goo\.gl|maps\.app\.goo\.gl)', re.IGNORECASE)


def extract_coords_from_maps_url(url):
    """Return (latitude, longitude) floats from a Google Maps URL, or (None, None)."""
    if not url:
        return None, None

    url = url.strip()

    # ?q=lat,lng
    m = _Q_PARAM_RE.search(url)
    if m:
        return float(m.group(1)), float(m.group(2))

    # @lat,lng
    m = _AT_RE.search(url)
    if m:
        return float(m.group(1)), float(m.group(2))

    # ll=lat,lng
    m = _LL_PARAM_RE.search(url)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Short URL → follow redirect then retry
    if _SHORT_URL_RE.search(url):
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; PharmaLocate/1.0)'},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                final_url = resp.geturl()
            if final_url and final_url != url:
                return extract_coords_from_maps_url(final_url)
        except Exception:
            pass

    return None, None


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
    latitude = CoordinateDecimalField(coordinate_label='Latitude')
    longitude = CoordinateDecimalField(coordinate_label='Longitude')
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

    def validate_latitude(self, value):
        return validate_latitude_value(value)

    def validate_longitude(self, value):
        return validate_longitude_value(value)

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
    latitude = CoordinateDecimalField(coordinate_label='Latitude')
    longitude = CoordinateDecimalField(coordinate_label='Longitude')
    google_maps_url = serializers.URLField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    class Meta:
        model = Pharmacy
        fields = [
            'id_pharmacie',
            'username',
            'nom',
            'adresse',
            'latitude',
            'longitude',
            'google_maps_url',
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
        return validate_latitude_value(value)

    def validate_longitude(self, value):
        return validate_longitude_value(value)

    def validate_telephone(self, value):
        if not re.match(r'^\+?[0-9\s().-]{6,20}$', value):
            raise serializers.ValidationError(
                'Le telephone doit etre valide.'
            )
        return value

    def validate_google_maps_url(self, value):
        if not value:
            return value
        if not _GOOGLE_MAPS_DOMAIN_RE.search(value):
            raise serializers.ValidationError(
                'Veuillez coller un lien Google Maps valide '
                '(ex: maps.google.com ou maps.app.goo.gl).'
            )
        return value

    def validate(self, attrs):
        google_maps_url = attrs.get('google_maps_url')

        # If URL cleared → clear coordinates too
        if google_maps_url == '' or google_maps_url is None:
            if 'google_maps_url' in attrs:
                attrs['latitude'] = None
                attrs['longitude'] = None
            return attrs

        if google_maps_url:
            lat, lng = extract_coords_from_maps_url(google_maps_url)
            if lat is None or lng is None:
                raise serializers.ValidationError({
                    'google_maps_url': (
                        'Impossible d\'extraire les coordonnees GPS de ce lien. '
                        'Utilisez un lien complet Google Maps contenant la position '
                        'precise (ex: https://maps.google.com/?q=18.07,-15.95).'
                    )
                })
            try:
                lat_dec = round_coordinate_decimal(Decimal(str(lat)))
                lng_dec = round_coordinate_decimal(Decimal(str(lng)))
                validate_latitude_value(lat_dec)
                validate_longitude_value(lng_dec)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({'google_maps_url': exc.detail})

            attrs['latitude'] = lat_dec
            attrs['longitude'] = lng_dec

        return attrs


class PharmacyPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['photo']
