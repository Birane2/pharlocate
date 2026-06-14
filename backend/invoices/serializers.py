from rest_framework import serializers

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    pharmacy_name = serializers.CharField(source='pharmacy.nom', read_only=True)
    payment_status = serializers.CharField(source='payment.statut', read_only=True)
    transaction_reference = serializers.CharField(
        source='transaction.reference_transaction',
        read_only=True,
    )
    items = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'numero_facture',
            'payment',
            'transaction',
            'transaction_reference',
            'reservation',
            'user',
            'user_name',
            'pharmacy',
            'pharmacy_name',
            'montant_medicaments',
            'frais_livraison',
            'commission',
            'montant_total',
            'statut',
            'payment_status',
            'date_emission',
            'date_paiement',
            'pdf_file',
            'pdf_url',
            'items',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_items(self, obj):
        return [
            {
                'id': item.id,
                'medicament': item.medicament_id,
                'medicament_nom': item.medicament.nom,
                'quantite': item.quantite,
                'prix_unitaire': item.prix_unitaire,
                'sous_total': item.quantite * item.prix_unitaire,
            }
            for item in obj.reservation.items.select_related('medicament').all()
        ]

    def get_pdf_url(self, obj):
        if not obj.pdf_file:
            return None

        request = self.context.get('request')
        url = obj.pdf_file.url
        return request.build_absolute_uri(url) if request else url
