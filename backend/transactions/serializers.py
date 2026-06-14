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
