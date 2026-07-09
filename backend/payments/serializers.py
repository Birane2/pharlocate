from rest_framework import serializers
from urllib.parse import quote

from .models import Payment, PaymentMethod, PharmacyPaymentMethod


class PharmacyPaymentMethodSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    created_at = serializers.DateTimeField(source='date_creation', read_only=True)
    updated_at = serializers.DateTimeField(source='date_modification', read_only=True)

    class Meta:
        model = PharmacyPaymentMethod
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'beneficiary_name',
            'payment_instructions',
            'bankily_number',
            'masrivi_number',
            'click_number',
            'sedad_number',
            'bci_pay_number',
            'is_active',
            'date_creation',
            'date_modification',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'date_creation',
            'date_modification',
            'created_at',
            'updated_at',
        ]

    def validate_beneficiary_name(self, value):
        return value.strip()

    def validate_payment_instructions(self, value):
        return value.strip()


class PaymentSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    payment_method_name = serializers.CharField(
        source='payment_method.nom',
        read_only=True,
    )
    method = serializers.SlugRelatedField(
        source='payment_method',
        queryset=PaymentMethod.objects.filter(est_actif=True),
        slug_field='code',
    )
    client_phone = serializers.CharField(source='numero_client')
    payment_proof = serializers.ImageField(
        source='capture_paiement',
        required=False,
        allow_null=True,
    )
    payment_proof_url = serializers.SerializerMethodField()
    capture_paiement_url = serializers.SerializerMethodField()
    reference_paiement = serializers.CharField(
        source='transaction_id',
        read_only=True,
    )
    amount = serializers.DecimalField(
        source='montant_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    status = serializers.CharField(source='statut', read_only=True)
    statut = serializers.CharField(read_only=True)
    verified_by = serializers.PrimaryKeyRelatedField(
        source='valide_par',
        read_only=True,
    )
    verified_at = serializers.DateTimeField(
        source='date_validation',
        read_only=True,
    )
    rejection_reason = serializers.CharField(source='motif_refus', read_only=True)
    client_name = serializers.CharField(source='user.get_full_name', read_only=True)
    reservation_status = serializers.CharField(source='reservation.statut', read_only=True)
    reservation_type = serializers.CharField(
        source='reservation.type_reservation',
        read_only=True,
    )
    reservation_created_at = serializers.DateTimeField(
        source='reservation.date_reservation',
        read_only=True,
    )
    items = serializers.SerializerMethodField()
    delivery = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'reservation',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'client_name',
            'method',
            'payment_method_name',
            'client_phone',
            'transaction_id',
            'reference_paiement',
            'payment_proof',
            'payment_proof_url',
            'capture_paiement_url',
            'amount',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'status',
            'statut',
            'verified_by',
            'verified_at',
            'rejection_reason',
            'date_creation',
            'reservation_status',
            'reservation_type',
            'reservation_created_at',
            'items',
            'delivery',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'user',
            'amount',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'status',
            'verified_by',
            'verified_at',
            'rejection_reason',
            'date_creation',
        ]

    def get_payment_proof_url(self, obj):
        request = self.context.get('request')

        if obj.capture_paiement and request:
            return request.build_absolute_uri(obj.capture_paiement.url)

        if obj.capture_paiement:
            return obj.capture_paiement.url

        return None

    def get_capture_paiement_url(self, obj):
        return self.get_payment_proof_url(obj)

    def get_items(self, obj):
        return [
            {
                'id': item.id,
                'medicament': item.medicament_id,
                'medicament_nom': item.medicament.nom,
                'quantite': item.quantite,
                'prix_unitaire': item.prix_unitaire,
                'sous_total': item.sous_total,
            }
            for item in obj.reservation.items.select_related('medicament').all()
        ]

    def get_delivery(self, obj):
        delivery = getattr(obj.reservation, 'delivery', None)
        if not delivery:
            return None

        google_maps_url = None
        if delivery.latitude is not None and delivery.longitude is not None:
            google_maps_url = (
                f"https://www.google.com/maps?q={float(delivery.latitude)},"
                f"{float(delivery.longitude)}"
            )
        elif delivery.adresse_livraison:
            google_maps_url = (
                "https://www.google.com/maps/search/?api=1&query="
                f"{quote(delivery.adresse_livraison)}"
            )

        return {
            'id': delivery.id,
            'address': delivery.adresse_livraison,
            'phone': delivery.telephone,
            'note': delivery.note,
            'fee': delivery.frais_livraison,
            'status': delivery.statut,
            'google_maps_url': google_maps_url,
        }

    def validate(self, attrs):
        payment_method = attrs.get('payment_method')
        transaction_id = attrs.get('transaction_id')
        payment_proof = attrs.get('capture_paiement')

        if payment_method and payment_method.requires_proof:
            if not transaction_id:
                raise serializers.ValidationError({
                    'transaction_id': 'Le transaction ID est obligatoire pour un paiement mobile.'
                })

            if not payment_proof:
                raise serializers.ValidationError({
                    'payment_proof': 'La capture de paiement est obligatoire.'
                })

        return attrs


class AdminPaymentSerializer(serializers.Serializer):
    id = serializers.CharField()
    source_id = serializers.IntegerField()
    payment_type = serializers.CharField()
    reference = serializers.CharField()
    user_name = serializers.CharField()
    pharmacy_id = serializers.IntegerField(allow_null=True)
    pharmacy_name = serializers.CharField()
    reservation_id = serializers.IntegerField(allow_null=True)
    subscription_id = serializers.IntegerField(allow_null=True)
    payment_method = serializers.CharField()
    transaction_id = serializers.CharField()
    client_phone = serializers.CharField(allow_blank=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    amount_medicines = serializers.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    rejection_reason = serializers.CharField(allow_blank=True)
    proof_image_url = serializers.CharField(allow_blank=True, allow_null=True)
    validated_by = serializers.CharField(allow_blank=True)
    validated_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
