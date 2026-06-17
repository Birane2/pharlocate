from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='title',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('reservation', 'Réservation'),
                    ('payment', 'Paiement'),
                    ('delivery', 'Livraison'),
                    ('subscription', 'Abonnement'),
                    ('commission', 'Commission'),
                    ('system', 'Système'),
                ],
                db_index=True,
                default='system',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='notification',
            name='est_lue',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterModelOptions(
            name='notification',
            options={'ordering': ['-date']},
        ),
    ]
