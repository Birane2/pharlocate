# Generated manually for complete Horaire management support.

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pharmacies', '0002_horaire'),
    ]

    operations = [
        migrations.AddField(
            model_name='horaire',
            name='date_creation',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='horaire',
            name='date_debut_garde',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='horaire',
            name='date_fin_garde',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='horaire',
            name='date_modification',
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='horaire',
            name='est_ouvert',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterModelOptions(
            name='horaire',
            options={'ordering': ['pharmacie__nom', 'jour', 'heure_ouverture']},
        ),
    ]
