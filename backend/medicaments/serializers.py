from django.db import IntegrityError, transaction
from rest_framework import serializers
from .models import Medicament, Stock


class MedicamentSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, required=False)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Medicament
        fields = [
            'id',
            'nom',
            'photo',
            'photo_url',
            'description',
            'categorie',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get('request')
        photo_url = obj.photo.url

        if request is None:
            return photo_url

        return request.build_absolute_uri(photo_url)

    def validate_nom(self, value):
        normalized = value.strip()

        if not normalized:
            raise serializers.ValidationError('Le nom du medicament est obligatoire.')

        queryset = Medicament.objects.filter(nom__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('Ce medicament existe deja.')

        return normalized


class MedicamentSummarySerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, required=False)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Medicament
        fields = [
            'id',
            'nom',
            'photo',
            'photo_url',
            'description',
            'categorie',
        ]

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get('request')
        photo_url = obj.photo.url

        if request is None:
            return photo_url

        return request.build_absolute_uri(photo_url)


class StockSerializer(serializers.ModelSerializer):
    id_stock = serializers.IntegerField(source='id', read_only=True)
    pharmacie = serializers.PrimaryKeyRelatedField(read_only=True)
    pharmacie_nom = serializers.CharField(source='pharmacie.nom', read_only=True)
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    medicament_data = MedicamentSummarySerializer(source='medicament', read_only=True)
    status = serializers.CharField(read_only=True)
    status_label = serializers.SerializerMethodField()
    is_rupture = serializers.BooleanField(read_only=True)
    is_stock_faible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Stock
        fields = [
            'id_stock',
            'pharmacie',
            'pharmacie_nom',
            'medicament',
            'medicament_nom',
            'medicament_data',
            'quantite',
            'prix',
            'seuil_alerte',
            'status',
            'status_label',
            'is_rupture',
            'is_stock_faible',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = [
            'id_stock',
            'pharmacie',
            'date_creation',
            'date_modification',
            'status',
            'is_rupture',
            'is_stock_faible',
        ]

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        pharmacie = (
            self.context.get('pharmacy')
            or attrs.get('pharmacie', getattr(instance, 'pharmacie', None))
        )
        medicament = attrs.get('medicament', getattr(instance, 'medicament', None))
        quantite = attrs.get('quantite', getattr(instance, 'quantite', 0))
        prix = attrs.get('prix', getattr(instance, 'prix', 0))
        seuil_alerte = attrs.get(
            'seuil_alerte',
            getattr(instance, 'seuil_alerte', 0),
        )

        if quantite < 0:
            raise serializers.ValidationError({
                'quantite': 'La quantite ne peut pas etre negative.'
            })

        if prix < 0:
            raise serializers.ValidationError({
                'prix': 'Le prix ne peut pas etre negatif.'
            })

        if seuil_alerte < 0:
            raise serializers.ValidationError({
                'seuil_alerte': 'Le seuil d alerte ne peut pas etre negatif.'
            })

        if pharmacie and medicament:
            queryset = Stock.objects.filter(
                pharmacie=pharmacie,
                medicament=medicament,
            )

            if instance:
                queryset = queryset.exclude(pk=instance.pk)

            if queryset.exists():
                raise serializers.ValidationError({
                    'medicament': 'Ce medicament existe deja dans le stock de cette pharmacie.'
                })

        return attrs

    def create(self, validated_data):
        pharmacy = self.context.get('pharmacy')

        if pharmacy:
            validated_data['pharmacie'] = pharmacy

        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError({
                'medicament': 'Ce medicament existe deja dans votre stock.'
            })

    def get_status_label(self, obj):
        labels = {
            'disponible': 'Disponible',
            'faible': 'Stock faible',
            'rupture': 'Rupture',
        }
        return labels.get(obj.status, obj.status)


class PublicPharmacyStockSerializer(serializers.ModelSerializer):
    id_stock = serializers.IntegerField(source='id', read_only=True)
    medicament = MedicamentSummarySerializer(read_only=True)
    statut = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id_stock',
            'medicament',
            'quantite',
            'prix',
            'statut',
        ]

    def get_statut(self, obj):
        return 'Disponible' if obj.quantite > 0 else 'Rupture'


class AddMedicamentToStockSerializer(serializers.Serializer):
    medicament_id = serializers.IntegerField(required=False, allow_null=True)
    nom = serializers.CharField(required=False, allow_blank=True, max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    categorie = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    quantite = serializers.IntegerField(min_value=0)
    prix = serializers.DecimalField(max_digits=10, decimal_places=2)
    seuil_alerte = serializers.IntegerField(min_value=0, required=False, default=5)

    def validate_prix(self, value):
        if value < 0:
            raise serializers.ValidationError('Le prix ne peut pas etre negatif.')
        return value

    def validate(self, attrs):
        medicament_id = attrs.get('medicament_id')
        nom = (attrs.get('nom') or '').strip()

        if not medicament_id and not nom:
            raise serializers.ValidationError({
                'nom': 'Selectionnez un medicament existant ou renseignez un nouveau nom.'
            })

        if medicament_id:
            try:
                attrs['medicament'] = Medicament.objects.get(pk=medicament_id)
            except Medicament.DoesNotExist:
                raise serializers.ValidationError({
                    'medicament_id': 'Medicament introuvable.'
                })
        else:
            attrs['nom'] = nom

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        pharmacy = self.context['pharmacy']
        medicament = validated_data.get('medicament')

        if not medicament:
            nom = validated_data['nom']
            medicament = Medicament.objects.filter(nom__iexact=nom).first()

            if not medicament:
                try:
                    medicament = Medicament.objects.create(
                        nom=nom,
                        description=validated_data.get('description') or '',
                        categorie=validated_data.get('categorie') or '',
                    )
                except IntegrityError:
                    medicament = Medicament.objects.get(nom__iexact=nom)

        if Stock.objects.filter(pharmacie=pharmacy, medicament=medicament).exists():
            raise serializers.ValidationError({
                'medicament': (
                    'Ce medicament existe deja dans le stock de votre pharmacie. '
                    'Modifiez le stock existant si necessaire.'
                )
            })

        try:
            stock = Stock.objects.create(
                pharmacie=pharmacy,
                medicament=medicament,
                quantite=validated_data['quantite'],
                prix=validated_data['prix'],
                seuil_alerte=validated_data.get('seuil_alerte', 5),
            )
        except IntegrityError:
            raise serializers.ValidationError({
                'medicament': 'Ce medicament existe deja dans votre stock.'
            })

        return stock
