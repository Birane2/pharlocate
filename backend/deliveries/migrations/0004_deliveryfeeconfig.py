from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('deliveries', '0003_manual_delivery_statuses'),
    ]

    operations = [
        migrations.CreateModel(
            name='DeliveryFeeConfig',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'price_per_km',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('10.00'),
                        max_digits=8,
                    ),
                ),
                (
                    'minimum_fee',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('50.00'),
                        max_digits=8,
                    ),
                ),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Configuration frais livraison',
                'verbose_name_plural': 'Configurations frais livraison',
            },
        ),
    ]
