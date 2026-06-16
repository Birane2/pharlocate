from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pharmacies', '0007_alter_pharmacy_coordinates_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='pharmacy',
            name='google_maps_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
