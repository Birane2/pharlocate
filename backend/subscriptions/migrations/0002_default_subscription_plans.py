from decimal import Decimal

from django.db import migrations


DEFAULT_PLANS = [
    {
        'nom': 'Gratuit',
        'code': 'gratuit',
        'description': 'Plan de base pour demarrer sur PharmaLocate.',
        'prix_mensuel': Decimal('0.00'),
        'prix_annuel': Decimal('0.00'),
        'max_medicaments': 50,
        'visibilite_prioritaire': False,
        'statistiques_avancees': False,
        'badge_premium': False,
        'notifications_prioritaires': False,
    },
    {
        'nom': 'Standard',
        'code': 'standard',
        'description': 'Plan standard avec plus de medicaments et des outils de suivi.',
        'prix_mensuel': Decimal('5000.00'),
        'prix_annuel': Decimal('50000.00'),
        'max_medicaments': 300,
        'visibilite_prioritaire': False,
        'statistiques_avancees': True,
        'badge_premium': False,
        'notifications_prioritaires': False,
    },
    {
        'nom': 'Premium',
        'code': 'premium',
        'description': 'Plan premium pour pharmacies avec visibilite et rapports avances.',
        'prix_mensuel': Decimal('10000.00'),
        'prix_annuel': Decimal('100000.00'),
        'max_medicaments': 1000,
        'visibilite_prioritaire': True,
        'statistiques_avancees': True,
        'badge_premium': True,
        'notifications_prioritaires': True,
    },
]


def create_default_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    for plan in DEFAULT_PLANS:
        SubscriptionPlan.objects.update_or_create(
            code=plan['code'],
            defaults={**plan, 'est_actif': True},
        )


def delete_default_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    SubscriptionPlan.objects.filter(code__in=[plan['code'] for plan in DEFAULT_PLANS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_plans, delete_default_plans),
    ]
