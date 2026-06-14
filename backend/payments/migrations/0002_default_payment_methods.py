from django.db import migrations


DEFAULT_PAYMENT_METHODS = [
    {
        'nom': 'Bankily',
        'code': 'bankily',
        'description': 'Paiement mobile manuel via Bankily.',
        'instructions': (
            'Effectuez le paiement via Bankily, puis ajoutez la reference '
            'ou une capture de paiement.'
        ),
    },
    {
        'nom': 'Masrvi',
        'code': 'masrvi',
        'description': 'Paiement mobile manuel via Masrvi.',
        'instructions': (
            'Effectuez le paiement via Masrvi, puis ajoutez la reference '
            'ou une capture de paiement.'
        ),
    },
    {
        'nom': 'Sedad',
        'code': 'sedad',
        'description': 'Paiement mobile manuel via Sedad.',
        'instructions': (
            'Effectuez le paiement via Sedad, puis ajoutez la reference '
            'ou une capture de paiement.'
        ),
    },
    {
        'nom': 'Paiement a la pharmacie',
        'code': 'paiement_pharmacie',
        'description': 'Paiement effectue directement a la pharmacie lors du retrait.',
        'instructions': 'Payez directement a la pharmacie au moment du retrait.',
    },
    {
        'nom': 'Paiement a la livraison',
        'code': 'paiement_livraison',
        'description': 'Paiement effectue au moment de la livraison.',
        'instructions': 'Payez le livreur au moment de la reception de la commande.',
    },
]


def create_default_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')

    for method in DEFAULT_PAYMENT_METHODS:
        PaymentMethod.objects.update_or_create(
            code=method['code'],
            defaults={
                **method,
                'est_actif': True,
            },
        )


def delete_default_payment_methods(apps, schema_editor):
    PaymentMethod = apps.get_model('payments', 'PaymentMethod')
    PaymentMethod.objects.filter(
        code__in=[method['code'] for method in DEFAULT_PAYMENT_METHODS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            create_default_payment_methods,
            delete_default_payment_methods,
        ),
    ]
