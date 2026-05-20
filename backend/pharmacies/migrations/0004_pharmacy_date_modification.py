import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pharmacies', '0003_update_horaire_management'),
    ]

    operations = [
        migrations.AddField(
            model_name='pharmacy',
            name='date_modification',
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
    ]
