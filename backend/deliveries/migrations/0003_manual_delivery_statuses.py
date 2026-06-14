from django.db import migrations, models


STATUS_MAP = {
    'en_preparation': 'en_cours',
    'livreur_assigne': 'en_cours',
    'en_route': 'en_cours',
    'echec_livraison': 'annulee',
}


def migrate_delivery_statuses(apps, schema_editor):
    Delivery = apps.get_model('deliveries', 'Delivery')
    DeliveryStatusHistory = apps.get_model(
        'deliveries',
        'DeliveryStatusHistory',
    )

    for old_status, new_status in STATUS_MAP.items():
        Delivery.objects.filter(statut=old_status).update(statut=new_status)
        DeliveryStatusHistory.objects.filter(
            ancien_statut=old_status
        ).update(ancien_statut=new_status)
        DeliveryStatusHistory.objects.filter(
            nouveau_statut=old_status
        ).update(nouveau_statut=new_status)


def reverse_delivery_statuses(apps, schema_editor):
    Delivery = apps.get_model('deliveries', 'Delivery')
    DeliveryStatusHistory = apps.get_model(
        'deliveries',
        'DeliveryStatusHistory',
    )
    Delivery.objects.filter(statut='en_cours').update(statut='en_route')
    DeliveryStatusHistory.objects.filter(
        ancien_statut='en_cours'
    ).update(ancien_statut='en_route')
    DeliveryStatusHistory.objects.filter(
        nouveau_statut='en_cours'
    ).update(nouveau_statut='en_route')


class Migration(migrations.Migration):

    dependencies = [
        ('deliveries', '0002_delivery_distance_km_delivery_tarif_par_km'),
        ('reservations', '0005_manual_payment_delivery_workflow'),
    ]

    operations = [
        migrations.RunPython(
            migrate_delivery_statuses,
            reverse_delivery_statuses,
        ),
        migrations.AlterField(
            model_name='delivery',
            name='statut',
            field=models.CharField(
                choices=[
                    ('en_attente', 'En attente'),
                    ('en_cours', 'En cours'),
                    ('livree', 'Livree'),
                    ('annulee', 'Annulee'),
                ],
                db_index=True,
                default='en_attente',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='deliverystatushistory',
            name='ancien_statut',
            field=models.CharField(
                blank=True,
                choices=[
                    ('en_attente', 'En attente'),
                    ('en_cours', 'En cours'),
                    ('livree', 'Livree'),
                    ('annulee', 'Annulee'),
                ],
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='deliverystatushistory',
            name='nouveau_statut',
            field=models.CharField(
                choices=[
                    ('en_attente', 'En attente'),
                    ('en_cours', 'En cours'),
                    ('livree', 'Livree'),
                    ('annulee', 'Annulee'),
                ],
                max_length=30,
            ),
        ),
    ]
