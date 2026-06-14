from rest_framework import serializers

from payments.models import Payment

from .models import Refund, RefundStatusHistory
from .refund_service import create_refund_request


class RefundStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RefundStatusHistory
        fields = [
            'ancien_statut',
            'nouveau_statut',
            'changed_by',
            'changed_by_name',
            'commentaire',
            'date_changement',
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return None
        return obj.changed_by.get_full_name() or obj.changed_by.username


class RefundSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_status = serializers.CharField(source='payment.statut', read_only=True)
    invoice_number = serializers.CharField(source='invoice.numero_facture', read_only=True)
    status_history = RefundStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id',
            'payment',
            'transaction',
            'refund_transaction',
            'invoice',
            'invoice_number',
            'reservation',
            'user',
            'user_name',
            'pharmacy',
            'pharmacy_name',
            'montant_demande',
            'montant_approuve',
            'motif',
            'commentaire_admin',
            'statut',
            'payment_status',
            'traite_par',
            'date_demande',
            'date_validation',
            'date_remboursement',
            'status_history',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class RefundCreateSerializer(serializers.Serializer):
    payment = serializers.PrimaryKeyRelatedField(
        queryset=Payment.objects.select_related('user', 'pharmacy', 'reservation').all()
    )
    montant_demande = serializers.DecimalField(max_digits=12, decimal_places=2)
    motif = serializers.ChoiceField(choices=Refund.MOTIF_CHOICES)

    def validate(self, attrs):
        request = self.context['request']
        payment = attrs['payment']

        if payment.user_id != request.user.id:
            raise serializers.ValidationError(
                {'payment': 'Ce paiement ne vous appartient pas.'}
            )

        if payment.statut != Payment.STATUS_VALIDATED:
            raise serializers.ValidationError(
                {'payment': 'Seuls les paiements valides peuvent etre rembourses.'}
            )

        if hasattr(payment, 'refund'):
            raise serializers.ValidationError(
                {'payment': 'Ce paiement possede deja une demande de remboursement.'}
            )

        if attrs['montant_demande'] > payment.montant_total:
            raise serializers.ValidationError(
                {'montant_demande': 'Le montant demande ne peut pas depasser le montant paye.'}
            )

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        return create_refund_request(
            payment=validated_data['payment'],
            user=request.user,
            montant_demande=validated_data['montant_demande'],
            motif=validated_data['motif'],
        )


class RefundApproveSerializer(serializers.Serializer):
    montant_approuve = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
    )
    commentaire_admin = serializers.CharField(required=False, allow_blank=True)


class RefundRejectSerializer(serializers.Serializer):
    commentaire_admin = serializers.CharField()

    def validate_commentaire_admin(self, value):
        if not value.strip():
            raise serializers.ValidationError('Le commentaire de refus est obligatoire.')
        return value.strip()
