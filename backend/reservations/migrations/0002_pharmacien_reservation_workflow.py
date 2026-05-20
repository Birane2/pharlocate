import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='date_modification',
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='reservationitem',
            name='prix_unitaire',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='statut',
            field=models.CharField(
                choices=[
                    ('en_attente', 'En attente'),
                    ('confirmee', 'Confirmee'),
                    ('prete', 'Prete'),
                    ('recuperee', 'Recuperee'),
                    ('annulee', 'Annulee'),
                ],
                default='en_attente',
                max_length=20,
            ),
        ),
    ]
