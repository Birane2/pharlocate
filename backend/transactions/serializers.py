from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_status = serializers.CharField(source='payment.statut', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'payment',
            'reservation',
            'user',
            'user_name',
            'pharmacy',
            'pharmacy_name',
            'type_transaction',
            'montant_brut',
            'commission',
            'montant_pharmacie',
            'description',
            'reference_transaction',
            'created_by',
            'payment_status',
            'date_creation',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class AdminFinancialTransactionSerializer(serializers.Serializer):
    id = serializers.CharField()
    source = serializers.CharField()
    source_id = serializers.IntegerField()
    reference = serializers.CharField()
    type = serializers.CharField()
    type_label = serializers.CharField()
    user_id = serializers.IntegerField(allow_null=True)
    user_name = serializers.CharField()
    pharmacy_id = serializers.IntegerField(allow_null=True)
    pharmacy_name = serializers.CharField()
    reservation_id = serializers.IntegerField(allow_null=True)
    subscription_id = serializers.IntegerField(allow_null=True)
    payment_method = serializers.CharField()
    transaction_id = serializers.CharField()
    amount_medicines = serializers.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    platform_commission = serializers.DecimalField(max_digits=12, decimal_places=2)
    pharmacy_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    status_label = serializers.CharField()
    validated_by = serializers.CharField()
    validated_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    proof_url = serializers.CharField(allow_blank=True)
