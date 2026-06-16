from rest_framework import serializers

from payments.models import Payment

from .models import (
    PharmacySubscription,
    PlatformPaymentMethod,
    SubscriptionPayment,
    SubscriptionPlan,
    SubscriptionRefund,
)
from .subscription_service import (
    create_subscription_request,
    get_subscription_amount,
    request_subscription_refund,
)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='nom', read_only=True)
    price_monthly = serializers.DecimalField(
        source='prix_mensuel',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    duration_days = serializers.IntegerField(read_only=True)
    priority_visibility = serializers.BooleanField(source='visibilite_prioritaire', read_only=True)
    advanced_statistics = serializers.BooleanField(source='statistiques_avancees', read_only=True)
    is_active = serializers.BooleanField(source='est_actif', read_only=True)
    is_free = serializers.BooleanField(read_only=True)
    prix = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    duree_jours = serializers.IntegerField(read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'nom',
            'name',
            'code',
            'description',
            'prix_mensuel',
            'price_monthly',
            'prix_annuel',
            'prix',
            'duree_jours',
            'duration_days',
            'commission_rate',
            'features',
            'max_medicaments',
            'visibilite_prioritaire',
            'priority_visibility',
            'statistiques_avancees',
            'advanced_statistics',
            'badge_premium',
            'notifications_prioritaires',
            'est_actif',
            'is_active',
            'is_free',
            'date_creation',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_free', 'date_creation', 'updated_at']


class PharmacySubscriptionSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    plan_detail = SubscriptionPlanSerializer(source='plan', read_only=True)
    payment_status = serializers.CharField(source='payment.statut', read_only=True)
    status = serializers.CharField(source='statut', read_only=True)
    start_date = serializers.DateTimeField(source='date_debut', read_only=True)
    end_date = serializers.DateTimeField(source='date_fin', read_only=True)
    commission_rate = serializers.DecimalField(
        source='plan.commission_rate',
        max_digits=5,
        decimal_places=4,
        read_only=True,
    )
    cancel_requested_at = serializers.DateTimeField(source='cancelled_at', read_only=True)
    latest_payment_id = serializers.SerializerMethodField()
    can_request_refund = serializers.SerializerMethodField()
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
            'status',
            'date_debut',
            'start_date',
            'date_fin',
            'end_date',
            'renouvellement_auto',
            'is_current',
            'cancelled_at',
            'cancel_requested_at',
            'cancel_effective_at',
            'expired_at',
            'commission_rate',
            'latest_payment_id',
            'can_request_refund',
            'payment',
            'payment_status',
            'transaction',
            'transaction_reference',
            'date_creation',
            'updated_at',
        ]
        read_only_fields = fields

    def get_latest_payment_id(self, obj):
        payment = obj.subscription_payments.filter(
            status=SubscriptionPayment.STATUS_VALIDATED,
        ).order_by('-created_at').first()
        return payment.id if payment else None

    def get_can_request_refund(self, obj):
        payment = obj.subscription_payments.filter(
            status=SubscriptionPayment.STATUS_VALIDATED,
        ).order_by('-created_at').first()
        if not payment:
            return False
        return not payment.refunds.exclude(
            status=SubscriptionRefund.STATUS_REJECTED,
        ).exists()


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
            'updated_at',
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
            'updated_at',
        ]

    def get_proof_image_url(self, obj):
        if not obj.proof_image:
            return ''
        request = self.context.get('request')
        url = obj.proof_image.url
        return request.build_absolute_uri(url) if request else url


class SubscriptionPaymentCreateSerializer(serializers.ModelSerializer):
    proof_image = serializers.ImageField(required=True)
    transaction_id = serializers.CharField(required=True, allow_blank=False)

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

    def validate_transaction_id(self, value):
        if not value.strip():
            raise serializers.ValidationError('L ID de transaction est obligatoire.')
        return value.strip()

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
            proof_image=validated_data['proof_image'],
        )
        subscription.statut = PharmacySubscription.STATUS_PENDING_VALIDATION
        subscription.save(update_fields=['statut'])
        return payment


class SubscriptionRefundSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_status = serializers.CharField(source='subscription_payment.status', read_only=True)
    plan_name = serializers.CharField(
        source='subscription_payment.subscription.plan.nom',
        read_only=True,
    )
    requested_by_name = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionRefund
        fields = [
            'id',
            'subscription_payment',
            'payment_status',
            'pharmacy',
            'pharmacy_name',
            'plan_name',
            'amount',
            'reason',
            'status',
            'requested_by',
            'requested_by_name',
            'processed_by',
            'processed_by_name',
            'processed_at',
            'admin_note',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'payment_status',
            'pharmacy',
            'pharmacy_name',
            'plan_name',
            'status',
            'requested_by',
            'requested_by_name',
            'processed_by',
            'processed_by_name',
            'processed_at',
            'admin_note',
            'created_at',
        ]

    def get_requested_by_name(self, obj):
        user = obj.requested_by
        if not user:
            return ''
        return user.get_full_name() or getattr(user, 'phone_number', '') or str(user)

    def get_processed_by_name(self, obj):
        user = obj.processed_by
        if not user:
            return ''
        return user.get_full_name() or getattr(user, 'phone_number', '') or str(user)


class SubscriptionRefundCreateSerializer(serializers.Serializer):
    subscription_payment = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPayment.objects.select_related('pharmacy', 'subscription__plan').all()
    )
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    reason = serializers.CharField()

    def validate_subscription_payment(self, payment):
        request = self.context['request']
        pharmacy = getattr(request.user, 'pharmacy', None)
        if not pharmacy:
            raise serializers.ValidationError('Aucune pharmacie associee a ce pharmacien.')
        if payment.pharmacy_id != pharmacy.id:
            raise serializers.ValidationError('Ce paiement ne vous appartient pas.')
        return payment

    def create(self, validated_data):
        request = self.context['request']
        return request_subscription_refund(
            subscription_payment=validated_data['subscription_payment'],
            requested_by=request.user,
            amount=validated_data.get('amount'),
            reason=validated_data['reason'],
        )
