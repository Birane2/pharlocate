from rest_framework import serializers

from .models import CommissionInvoice, CommissionInvoicePayment


class FinanceFilterSerializer(serializers.Serializer):
    period = serializers.ChoiceField(
        choices=['today', 'week', 'month', 'year', 'custom'],
        required=False,
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    status = serializers.CharField(required=False, allow_blank=True)
    method = serializers.CharField(required=False, allow_blank=True)
    pharmacy = serializers.IntegerField(required=False)
    type_transaction = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get('period') == 'custom' and (
            not attrs.get('start_date') or not attrs.get('end_date')
        ):
            raise serializers.ValidationError(
                'start_date et end_date sont obligatoires pour period=custom.'
            )

        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError(
                    'end_date doit etre superieure ou egale a start_date.'
                )

        return attrs


# ── Commission Invoice Serializers ─────────────────────────────────────────

class CommissionInvoicePaymentSerializer(serializers.ModelSerializer):
    payment_method_label = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )
    proof_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CommissionInvoicePayment
        fields = [
            'id',
            'payment_method',
            'payment_method_label',
            'transaction_id',
            'proof_image_url',
            'amount',
            'status',
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


class CommissionInvoiceSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_due_date = serializers.DateField(source='due_date', read_only=True)
    payments = CommissionInvoicePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = CommissionInvoice
        fields = [
            'id',
            'invoice_number',
            'pharmacy',
            'pharmacy_name',
            'period_start',
            'period_end',
            'total_sales',
            'commission_rate',
            'commission_amount',
            'status',
            'due_date',
            'payment_due_date',
            'paid_at',
            'notes',
            'created_at',
            'updated_at',
            'payments',
        ]


class CommissionInvoicePaymentCreateSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=CommissionInvoicePayment.METHOD_CHOICES)
    transaction_id = serializers.CharField(required=True, allow_blank=False)
    proof_image = serializers.ImageField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate_transaction_id(self, value):
        if not value.strip():
            raise serializers.ValidationError("L ID de transaction est obligatoire.")
        return value.strip()
