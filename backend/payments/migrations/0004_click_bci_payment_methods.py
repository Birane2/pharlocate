from django.db import migrations


NEW_PAYMENT_METHODS = [
    {
        'nom': 'Click',
        'code': 'click',
        'description': 'Paiement mobile manuel via Click.',
        'instructions': (
            'Effectuez le paiement via Click, puis ajoutez la reference '
            'ou une capture de paiement.'
        ),
    },
    {
        'nom': 'BCI Pay',
        'code': 'bci_pay',
        'description': 'Paiement mobile manuel via BCI Pay.',
        'instructions': (
            'Effectuez le paiement via BCI Pay, puis ajoutez la reference '
            'ou une capture de paiement.'
        ),
    },
]


def create_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')

    for method in NEW_PAYMENT_METHODS:
        PaymentMethod.objects.update_or_create(
            code=method['code'],
            defaults={**method, 'est_actif': True},
        )


def delete_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')
    PaymentMethod.objects.filter(
        code__in=[method['code'] for method in NEW_PAYMENT_METHODS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_pharmacypaymentmethod'),
    ]

    operations = [
        migrations.RunPython(create_payment_methods, delete_payment_methods),
    ]
