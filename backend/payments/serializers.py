from rest_framework import serializers

from reservations.models import Reservation

from .models import Payment, PaymentMethod, PharmacyPaymentMethod
from .services import create_payment_for_reservation, submit_payment_proof


class PaymentMethodSerializer(serializers.ModelSerializer):
    requires_proof = serializers.BooleanField(read_only=True)

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'nom',
            'code',
            'description',
            'numero_compte',
            'instructions',
            'est_actif',
            'requires_proof',
            'date_creation',
        ]
        read_only_fields = fields


class PublicPharmacyPaymentMethodSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    beneficiary_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    methods = serializers.SerializerMethodField()

    class Meta:
        model = PharmacyPaymentMethod
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'beneficiary_name',
            'is_active',
            'methods',
        ]
        read_only_fields = fields

    def get_methods(self, obj):
        if not obj.is_active:
            return []

        methods = []
        active_methods = PaymentMethod.objects.filter(est_actif=True).order_by('nom')
        deferred_payment_codes = {
            PaymentMethod.CODE_PHARMACY,
            PaymentMethod.CODE_DELIVERY,
        }

        for method in active_methods:
            account_number = obj.get_account_number(method.code)
            if method.code not in deferred_payment_codes and not account_number:
                continue

            methods.append(
                {
                    'id': method.id,
                    'nom': method.nom,
                    'code': method.code,
                    'description': method.description,
                    'instructions': method.instructions,
                    'requires_proof': method.requires_proof,
                    'account_number': account_number,
                    'logo_key': method.code,
                }
            )

        return methods


class PharmacyPaymentMethodSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)

    class Meta:
        model = PharmacyPaymentMethod
        fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'bankily_number',
            'masrivi_number',
            'click_number',
            'sedad_number',
            'bci_pay_number',
            'is_active',
            'date_creation',
            'date_modification',
        ]
        read_only_fields = [
            'id',
            'pharmacy',
            'pharmacy_name',
            'date_creation',
            'date_modification',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_method_name = serializers.CharField(source='payment_method.nom', read_only=True)
    payment_method_code = serializers.CharField(source='payment_method.code', read_only=True)
    capture_paiement_url = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'reservation',
            'user',
            'user_name',
            'pharmacy',
            'pharmacy_name',
            'payment_method',
            'payment_method_name',
            'payment_method_code',
            'montant_medicaments',
            'frais_livraison',
            'montant_total',
            'reference_paiement',
            'capture_paiement',
            'capture_paiement_url',
            'statut',
            'valide_par',
            'date_paiement',
            'date_validation',
            'motif_refus',
            'date_creation',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_capture_paiement_url(self, obj):
        if not obj.capture_paiement:
            return None

        request = self.context.get('request')
        url = obj.capture_paiement.url
        return request.build_absolute_uri(url) if request else url


class PaymentCreateSerializer(serializers.Serializer):
    reservation = serializers.PrimaryKeyRelatedField(
        queryset=Reservation.objects.select_related('user', 'pharmacie').all()
    )
    payment_method = serializers.PrimaryKeyRelatedField(
        queryset=PaymentMethod.objects.filter(est_actif=True)
    )
    reference_paiement = serializers.CharField(required=False, allow_blank=True)
    capture_paiement = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        reservation = attrs['reservation']
        payment_method = attrs['payment_method']
        reference = attrs.get('reference_paiement', '')
        capture = attrs.get('capture_paiement')

        if reservation.user_id != user.id:
            raise serializers.ValidationError(
                {'reservation': 'Cette reservation ne vous appartient pas.'}
            )

        if hasattr(reservation, 'payment'):
            raise serializers.ValidationError(
                {'reservation': 'Cette reservation possede deja un paiement.'}
            )

        if payment_method.code == PaymentMethod.CODE_PHARMACY and reservation.mode_retrait != 'retrait':
            raise serializers.ValidationError(
                {
                    'payment_method': (
                        'Le paiement a la pharmacie est disponible uniquement '
                        'pour une reservation en retrait.'
                    )
                }
            )

        if payment_method.code == PaymentMethod.CODE_DELIVERY and reservation.mode_retrait != 'livraison':
            raise serializers.ValidationError(
                {
                    'payment_method': (
                        'Le paiement a la livraison est disponible uniquement '
                        'pour une reservation en livraison.'
                    )
                }
            )

        if payment_method.requires_proof:
            config = getattr(reservation.pharmacie, 'payment_methods_config', None)
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

        if payment_method.requires_proof and not (reference or capture):
            raise serializers.ValidationError(
                {'reference_paiement': 'Une reference ou une capture de paiement est obligatoire.'}
            )

        return attrs

    def create(self, validated_data):
        return create_payment_for_reservation(
            reservation=validated_data['reservation'],
            payment_method=validated_data['payment_method'],
            reference_paiement=validated_data.get('reference_paiement', ''),
            capture_paiement=validated_data.get('capture_paiement'),
        )


class PaymentProofSerializer(serializers.Serializer):
    reference_paiement = serializers.CharField(required=False, allow_blank=True)
    capture_paiement = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        payment = self.context['payment']
        reference = attrs.get('reference_paiement', '')
        capture = attrs.get('capture_paiement')

        if payment.payment_method.requires_proof and not (
            reference or capture or payment.has_proof
        ):
            raise serializers.ValidationError(
                {'reference_paiement': 'Une reference ou une capture de paiement est obligatoire.'}
            )

        return attrs

    def update(self, instance, validated_data):
        return submit_payment_proof(
            payment=instance,
            reference_paiement=validated_data.get('reference_paiement', ''),
            capture_paiement=validated_data.get('capture_paiement'),
        )


class PaymentRejectSerializer(serializers.Serializer):
    motif_refus = serializers.CharField()

    def validate_motif_refus(self, value):
        if not value.strip():
            raise serializers.ValidationError('Le motif de refus est obligatoire.')
        return value.strip()
