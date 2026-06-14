from rest_framework import serializers

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
    amount = serializers.DecimalField(
        source='montant_total',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    status = serializers.CharField(source='statut', read_only=True)
    verified_by = serializers.PrimaryKeyRelatedField(
        source='valide_par',
        read_only=True,
    )
    verified_at = serializers.DateTimeField(
        source='date_validation',
        read_only=True,
    )
    rejection_reason = serializers.CharField(source='motif_refus', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'reservation',
            'pharmacy',
            'pharmacy_name',
            'user',
            'user_name',
            'method',
            'client_phone',
            'transaction_id',
            'payment_proof',
            'payment_proof_url',
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
