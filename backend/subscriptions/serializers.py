from rest_framework import serializers

from payments.models import Payment

from .models import PharmacySubscription, SubscriptionPlan
from .subscription_service import create_subscription_request


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    is_free = serializers.BooleanField(read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'nom',
            'code',
            'description',
            'prix_mensuel',
            'prix_annuel',
            'max_medicaments',
            'visibilite_prioritaire',
            'statistiques_avancees',
            'badge_premium',
            'notifications_prioritaires',
            'est_actif',
            'is_free',
            'date_creation',
        ]
        read_only_fields = ['id', 'is_free', 'date_creation']


class PharmacySubscriptionSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    plan_detail = SubscriptionPlanSerializer(source='plan', read_only=True)
    payment_status = serializers.CharField(source='payment.statut', read_only=True)
    transaction_reference = serializers.CharField(
        source='transaction.reference_transaction',
        read_only=True,
    )

    class Meta:
        model = PharmacySubscription
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'plan',
            'plan_detail',
            'statut',
            'date_debut',
            'date_fin',
            'renouvellement_auto',
            'payment',
            'payment_status',
            'transaction',
            'transaction_reference',
            'date_creation',
        ]
        read_only_fields = fields


class SubscriptionRequestSerializer(serializers.Serializer):
    plan = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(est_actif=True)
    )
    payment = serializers.PrimaryKeyRelatedField(
        queryset=Payment.objects.select_related('pharmacy').all(),
        required=False,
        allow_null=True,
    )
    renouvellement_auto = serializers.BooleanField(default=True)

    def validate(self, attrs):
        request = self.context['request']
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            raise serializers.ValidationError(
                {'pharmacy': 'Aucune pharmacie associee a ce pharmacien.'}
            )

        payment = attrs.get('payment')
        if payment and payment.pharmacy_id != pharmacy.id:
            raise serializers.ValidationError(
                {'payment': 'Ce paiement ne correspond pas a votre pharmacie.'}
            )

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        return create_subscription_request(
            pharmacy=request.user.pharmacy,
            plan=validated_data['plan'],
            payment=validated_data.get('payment'),
            renouvellement_auto=validated_data.get('renouvellement_auto', True),
        )
