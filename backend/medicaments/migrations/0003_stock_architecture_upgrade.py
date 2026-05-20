import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medicaments', '0002_stock'),
    ]

    operations = [
        migrations.AddField(
            model_name='stock',
            name='date_creation',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='stock',
            name='date_modification',
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='stock',
            name='seuil_alerte',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.RemoveField(
            model_name='stock',
            name='date_mise_a_jour',
        ),
        migrations.AlterModelOptions(
            name='stock',
            options={'ordering': ['-date_modification']},
        ),
    ]
