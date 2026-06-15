from rest_framework import serializers

from payments.models import Payment

from .models import (
    PharmacySubscription,
    PlatformPaymentMethod,
    SubscriptionPayment,
    SubscriptionPlan,
)
from .subscription_service import create_subscription_request, get_subscription_amount


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    is_free = serializers.BooleanField(read_only=True)
    prix = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    duree_jours = serializers.IntegerField(read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'nom',
            'code',
            'description',
            'prix_mensuel',
            'prix_annuel',
            'prix',
            'duree_jours',
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


class PlatformPaymentMethodSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(required=False, allow_blank=True)
    payment_instructions = serializers.CharField(required=False, allow_blank=True)
    methods = serializers.SerializerMethodField()

    class Meta:
        model = PlatformPaymentMethod
        fields = [
            'id',
            'bankily_number',
            'masrivi_number',
            'click_number',
            'sedad_number',
            'bci_pay_number',
            'beneficiary_name',
            'payment_instructions',
            'is_active',
            'methods',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'methods', 'created_at', 'updated_at']

    def get_methods(self, obj):
        labels = {
            SubscriptionPayment.METHOD_BANKILY: 'Bankily',
            SubscriptionPayment.METHOD_MASRIVI: 'Masrivi',
            SubscriptionPayment.METHOD_CLICK: 'Click',
            SubscriptionPayment.METHOD_SEDAD: 'Sedad',
            SubscriptionPayment.METHOD_BCI_PAY: 'BCI Pay',
        }
        fields = {
            SubscriptionPayment.METHOD_BANKILY: obj.bankily_number,
            SubscriptionPayment.METHOD_MASRIVI: obj.masrivi_number,
            SubscriptionPayment.METHOD_CLICK: obj.click_number,
            SubscriptionPayment.METHOD_SEDAD: obj.sedad_number,
            SubscriptionPayment.METHOD_BCI_PAY: obj.bci_pay_number,
        }
        return [
            {
                'code': code,
                'label': labels[code],
                'number': number,
                'beneficiary_name': obj.display_beneficiary_name,
                'instructions': obj.payment_instructions,
            }
            for code, number in fields.items()
            if number
        ]


class PublicPlatformPaymentMethodSerializer(PlatformPaymentMethodSerializer):
    class Meta(PlatformPaymentMethodSerializer.Meta):
        fields = [
            'beneficiary_name',
            'payment_instructions',
            'is_active',
            'methods',
        ]


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    plan_name = serializers.CharField(source='subscription.plan.nom', read_only=True)
    payment_method_label = serializers.CharField(source='get_payment_method_display', read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPayment
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'subscription',
            'plan_name',
            'amount',
            'payment_method',
            'payment_method_label',
            'transaction_id',
            'proof_image',
            'proof_image_url',
            'status',
            'validated_by',
            'validated_at',
            'rejection_reason',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'plan_name',
            'amount',
            'payment_method_label',
            'proof_image_url',
            'status',
            'validated_by',
            'validated_at',
            'rejection_reason',
            'created_at',
        ]

    def get_proof_image_url(self, obj):
        if not obj.proof_image:
            return ''
        request = self.context.get('request')
        url = obj.proof_image.url
        return request.build_absolute_uri(url) if request else url


class SubscriptionPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = [
            'subscription',
            'payment_method',
            'transaction_id',
            'proof_image',
        ]

    def validate_subscription(self, subscription):
        request = self.context['request']
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            raise serializers.ValidationError('Aucune pharmacie associee a ce pharmacien.')
        if subscription.pharmacy_id != pharmacy.id:
            raise serializers.ValidationError('Cet abonnement ne vous appartient pas.')
        if subscription.statut not in [
            PharmacySubscription.STATUS_PENDING_PAYMENT,
            PharmacySubscription.STATUS_REJECTED,
        ]:
            raise serializers.ValidationError(
                'Cet abonnement ne peut pas recevoir un nouveau paiement.'
            )
        return subscription

    def validate(self, attrs):
        platform_config = PlatformPaymentMethod.objects.filter(is_active=True).first()
        if not platform_config or not platform_config.has_any_method():
            raise serializers.ValidationError(
                {'payment_method': 'Aucun mode de paiement PharmaLocate actif.'}
            )

        number = getattr(platform_config, f"{attrs['payment_method']}_number", '')
        if not number:
            raise serializers.ValidationError(
                {'payment_method': 'Cette methode de paiement est indisponible.'}
            )
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        subscription = validated_data['subscription']
        payment = SubscriptionPayment.objects.create(
            pharmacy=request.user.pharmacy,
            subscription=subscription,
            amount=get_subscription_amount(subscription.plan),
            payment_method=validated_data['payment_method'],
            transaction_id=validated_data['transaction_id'],
            proof_image=validated_data.get('proof_image'),
        )
        subscription.statut = PharmacySubscription.STATUS_PENDING_VALIDATION
        subscription.save(update_fields=['statut'])
        return payment
