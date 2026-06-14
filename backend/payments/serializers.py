from rest_framework import serializers

from .models import Payment, PharmacyPaymentMethod


class PharmacyPaymentMethodSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)

    class Meta:
        model = PharmacyPaymentMethod
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'beneficiary_name',
            'bankily_number',
            'masrivi_number',
            'click_number',
            'sedad_number',
            'bci_pay_number',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'created_at',
            'updated_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    payment_proof_url = serializers.SerializerMethodField()

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
            'status',
            'verified_by',
            'verified_at',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'user',
            'amount',
            'status',
            'verified_by',
            'verified_at',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]

    def get_payment_proof_url(self, obj):
        request = self.context.get('request')

        if obj.payment_proof and request:
            return request.build_absolute_uri(obj.payment_proof.url)

        if obj.payment_proof:
            return obj.payment_proof.url

        return None

    def validate(self, attrs):
        method = attrs.get('method')
        transaction_id = attrs.get('transaction_id')
        payment_proof = attrs.get('payment_proof')

        manual_methods = [
            'bankily',
            'masrivi',
            'click',
            'sedad',
            'bci_pay',
        ]

        if method in manual_methods:
            if not transaction_id:
                raise serializers.ValidationError({
                    'transaction_id': 'Le transaction ID est obligatoire pour un paiement mobile.'
                })

            if not payment_proof:
                raise serializers.ValidationError({
                    'payment_proof': 'La capture de paiement est obligatoire.'
                })

        return attrs