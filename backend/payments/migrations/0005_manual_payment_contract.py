from django.db import migrations, models


def migrate_payment_data(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')

    Payment.objects.filter(
        statut__in=['non_paye', 'en_attente_validation']
    ).update(statut='en_attente_verification')

    for payment in Payment.objects.select_related('user').all().iterator():
        if payment.numero_client:
            continue
        payment.numero_client = (
            payment.user.phone_number
            or payment.user.username
            or 'inconnu'
        )[:20]
        payment.save(update_fields=['numero_client'])

    PaymentMethod.objects.filter(code='masrvi').update(code='masrivi', nom='Masrivi')
    PaymentMethod.objects.filter(
        code__in=['paiement_pharmacie', 'paiement_livraison']
    ).update(est_actif=False)


def reverse_payment_data(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')

    Payment.objects.filter(statut='en_attente_verification').update(
        statut='en_attente_validation'
    )
    PaymentMethod.objects.filter(code='masrivi').update(code='masrvi', nom='Masrvi')


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_click_bci_payment_methods'),
        ('reservations', '0005_manual_payment_delivery_workflow'),
    ]

    operations = [
        migrations.RenameField(
            model_name='payment',
            old_name='reference_paiement',
            new_name='transaction_id',
        ),
        migrations.AddField(
            model_name='payment',
            name='numero_client',
            field=models.CharField(default='', max_length=20),
            preserve_default=False,
        ),
        migrations.RunPython(
            migrate_payment_data,
            reverse_payment_data,
        ),
        migrations.AlterField(
            model_name='payment',
            name='statut',
            field=models.CharField(
                choices=[
                    ('en_attente_verification', 'En attente de verification'),
                    ('valide', 'Valide'),
                    ('refuse', 'Refuse'),
                    ('annule', 'Annule'),
                    ('rembourse', 'Rembourse'),
                ],
                db_index=True,
                default='en_attente_verification',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='payment',
            name='transaction_id',
            field=models.CharField(
                db_column='reference_paiement',
                max_length=150,
            ),
        ),
    ]
