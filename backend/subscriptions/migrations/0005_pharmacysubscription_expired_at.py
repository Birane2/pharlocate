from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0004_subscription_refunds_and_plan_rules'),
    ]

    operations = [
        migrations.AddField(
            model_name='pharmacysubscription',
            name='expired_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
