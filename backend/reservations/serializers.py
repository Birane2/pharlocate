from django.db import transaction
from rest_framework import serializers

from medicaments.models import Stock
from deliveries.serializers import DeliverySerializer
from deliveries.services import create_delivery_for_reservation
from payments.models import PaymentMethod
from payments.serializers import PaymentSerializer
from payments.services import create_payment_for_reservation
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
            'mode_retrait',
            'statut_paiement',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'items',
            'total',
        ]
        read_only_fields = [
            'id',
            'user',
            'date_reservation',
            'date_modification',
            'statut',
            'statut_paiement',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'total',
        ]

    def get_total(self, obj):
        return obj.montant_total

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
        mode_retrait = attrs.get('mode_retrait', 'retrait')

        if not items:
            raise serializers.ValidationError(
                {'items': 'Ajoutez au moins un medicament au panier avant de reserver.'}
            )

        if mode_retrait not in dict(Reservation.MODE_RETRAIT_CHOICES):
            raise serializers.ValidationError(
                {'mode_retrait': 'Mode de retrait invalide.'}
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

    @transaction.atomic
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

        reservation.calculate_amounts()
        return reservation


class ReservationCheckoutSerializer(serializers.Serializer):
    pharmacie = serializers.PrimaryKeyRelatedField(
        queryset=Pharmacy.objects.filter(est_valide=True, statut_validation='validee')
    )
    mode_retrait = serializers.ChoiceField(
        choices=Reservation.MODE_RETRAIT_CHOICES,
        default='retrait',
    )
    items = ReservationItemSerializer(many=True)
    delivery = serializers.DictField(required=False)
    payment_method = serializers.PrimaryKeyRelatedField(
        queryset=PaymentMethod.objects.filter(est_actif=True)
    )
    reference_paiement = serializers.CharField(required=False, allow_blank=True)
    capture_paiement = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        mode_retrait = attrs['mode_retrait']
        payment_method = attrs['payment_method']
        delivery_data = attrs.get('delivery') or {}
        reference = attrs.get('reference_paiement', '')
        capture = attrs.get('capture_paiement')

        if not user or not user.is_authenticated:
            raise serializers.ValidationError(
                {'detail': 'Vous devez etre connecte pour finaliser la reservation.'}
            )

        reservation_serializer = ReservationSerializer(
            data={
                'pharmacie': attrs['pharmacie'].pk,
                'mode_retrait': mode_retrait,
                'items': self.initial_data.get('items', []),
            },
            context=self.context,
        )
        reservation_serializer.is_valid(raise_exception=True)
        attrs['_reservation_serializer'] = reservation_serializer

        if mode_retrait == 'livraison':
            if not delivery_data:
                raise serializers.ValidationError(
                    {'delivery': 'Les informations de livraison sont obligatoires.'}
                )

            if not str(delivery_data.get('adresse_livraison', '')).strip():
                raise serializers.ValidationError(
                    {'delivery': {"adresse_livraison": "L'adresse de livraison est obligatoire."}}
                )

            if not str(delivery_data.get('telephone', '')).strip():
                raise serializers.ValidationError(
                    {'delivery': {'telephone': 'Le telephone de livraison est obligatoire.'}}
                )

        if mode_retrait == 'retrait' and delivery_data:
            raise serializers.ValidationError(
                {'delivery': 'Aucune livraison ne doit etre envoyee pour un retrait.'}
            )

        if payment_method.code == PaymentMethod.CODE_PHARMACY and mode_retrait != 'retrait':
            raise serializers.ValidationError(
                {'payment_method': 'Le paiement a la pharmacie est reserve au retrait.'}
            )

        if payment_method.code == PaymentMethod.CODE_DELIVERY and mode_retrait != 'livraison':
            raise serializers.ValidationError(
                {'payment_method': 'Le paiement a la livraison est reserve a la livraison.'}
            )

        if payment_method.requires_proof:
            config = getattr(attrs['pharmacie'], 'payment_methods_config', None)
            account_number = config.get_account_number(payment_method.code) if config else ''

            if not config or not config.is_active or not account_number:
                raise serializers.ValidationError(
                    {
                        'payment_method': (
                            'Cette methode de paiement n est pas configuree '
                            'pour cette pharmacie.'
                        )
                    }
                )

            if not (reference or capture):
                raise serializers.ValidationError(
                    {
                        'reference_paiement': (
                            'Une reference ou une capture de paiement est obligatoire.'
                        )
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        reservation_serializer = validated_data['_reservation_serializer']
        delivery_data = validated_data.get('delivery') or {}

        reservation = reservation_serializer.save(user=request.user)
        delivery = None

        if reservation.mode_retrait == 'livraison':
            delivery = create_delivery_for_reservation(
                reservation=reservation,
                adresse_livraison=delivery_data['adresse_livraison'],
                telephone=delivery_data['telephone'],
                latitude=delivery_data.get('latitude'),
                longitude=delivery_data.get('longitude'),
                note=delivery_data.get('note', ''),
            )

        payment = create_payment_for_reservation(
            reservation=reservation,
            payment_method=validated_data['payment_method'],
            reference_paiement=validated_data.get('reference_paiement', ''),
            capture_paiement=validated_data.get('capture_paiement'),
        )

        return {
            'reservation': reservation,
            'delivery': delivery,
            'payment': payment,
        }

    def to_representation(self, instance):
        request = self.context.get('request')

        return {
            'reservation': ReservationSerializer(
                instance['reservation'],
                context=self.context,
            ).data,
            'delivery': (
                DeliverySerializer(instance['delivery'], context=self.context).data
                if instance.get('delivery')
                else None
            ),
            'payment': PaymentSerializer(
                instance['payment'],
                context={'request': request},
            ).data,
        }
