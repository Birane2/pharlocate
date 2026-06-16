from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


PLAN_DEFAULTS = {
    'free': {
        'legacy_codes': ['gratuit', 'free'],
        'nom': 'Gratuit',
        'description': 'Acces de base pour demarrer sur PharmaLocate.',
        'prix_mensuel': Decimal('0.00'),
        'prix_annuel': Decimal('0.00'),
        'commission_rate': Decimal('0.0500'),
        'duration_days': 30,
        'features': [
            'Acces de base',
            'Gestion pharmacie',
            'Gestion horaires',
            'Stocks limites',
            'Reservations',
            'Visibilite normale',
            'Statistiques limitees',
        ],
        'max_medicaments': 50,
        'visibilite_prioritaire': False,
        'statistiques_avancees': False,
        'badge_premium': False,
        'notifications_prioritaires': False,
    },
    'standard': {
        'legacy_codes': ['standard'],
        'nom': 'Standard',
        'description': 'Plus de visibilite et gestion complete des stocks.',
        'prix_mensuel': Decimal('500.00'),
        'prix_annuel': Decimal('0.00'),
        'commission_rate': Decimal('0.0200'),
        'duration_days': 30,
        'features': [
            'Plus de visibilite',
            'Statistiques simples',
            'Meilleure position dans les listes',
            'Gestion complete des stocks',
            'Acces finance pharmacien',
        ],
        'max_medicaments': 300,
        'visibilite_prioritaire': False,
        'statistiques_avancees': True,
        'badge_premium': False,
        'notifications_prioritaires': False,
    },
    'premium': {
        'legacy_codes': ['premium'],
        'nom': 'Premium',
        'description': 'Visibilite prioritaire et statistiques avancees.',
        'prix_mensuel': Decimal('1000.00'),
        'prix_annuel': Decimal('0.00'),
        'commission_rate': Decimal('0.0100'),
        'duration_days': 30,
        'features': [
            'Visibilite prioritaire',
            'Badge premium',
            'Statistiques avancees',
            'Priorite dans la recherche',
            'Acces complet finance',
            'Visibilite renforcee',
        ],
        'max_medicaments': 1000,
        'visibilite_prioritaire': True,
        'statistiques_avancees': True,
        'badge_premium': True,
        'notifications_prioritaires': True,
    },
}


def sync_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    PharmacySubscription = apps.get_model('subscriptions', 'PharmacySubscription')

    for code, defaults in PLAN_DEFAULTS.items():
        legacy_codes = defaults.pop('legacy_codes')
        plan = SubscriptionPlan.objects.filter(code__in=legacy_codes).first()
        if plan:
            for field, value in defaults.items():
                setattr(plan, field, value)
            plan.code = code
            plan.est_actif = True
            plan.save()
        else:
            SubscriptionPlan.objects.create(code=code, est_actif=True, **defaults)
        defaults['legacy_codes'] = legacy_codes

    active_ids = set()
    for subscription in PharmacySubscription.objects.order_by('pharmacy_id', '-date_creation'):
        if subscription.statut == 'active' and subscription.pharmacy_id not in active_ids:
            subscription.is_current = True
            active_ids.add(subscription.pharmacy_id)
        else:
            subscription.is_current = False
        subscription.save(update_fields=['is_current'])


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_platformpaymentmethod_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='commission_rate',
            field=models.DecimalField(
                decimal_places=4,
                default=Decimal('0.0500'),
                help_text='Commission plateforme appliquee aux commandes, ex: 0.0500 = 5%.',
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='duration_days',
            field=models.PositiveIntegerField(default=30),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='features',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='pharmacysubscription',
            name='cancel_effective_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='pharmacysubscription',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='pharmacysubscription',
            name='is_current',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='pharmacysubscription',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='subscriptionpayment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='pharmacysubscription',
            name='statut',
            field=models.CharField(
                choices=[
                    ('active', 'Active'),
                    ('expiree', 'Expiree'),
                    ('annulee', 'Annulee'),
                    ('inactive', 'Inactive'),
                    ('en_attente_paiement', 'En attente paiement'),
                    ('en_attente_validation', 'En attente validation'),
                    ('refuse', 'Refusee'),
                ],
                db_index=True,
                default='en_attente_paiement',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='subscriptionpayment',
            name='status',
            field=models.CharField(
                choices=[
                    ('en_attente_validation', 'En attente validation'),
                    ('valide', 'Valide'),
                    ('refuse', 'Refuse'),
                    ('annule', 'Annule'),
                    ('rembourse', 'Rembourse'),
                ],
                db_index=True,
                default='en_attente_validation',
                max_length=30,
            ),
        ),
        migrations.CreateModel(
            name='SubscriptionRefund',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('reason', models.TextField()),
                ('status', models.CharField(choices=[('requested', 'Demandee'), ('approved', 'Approuvee'), ('rejected', 'Refusee'), ('processed', 'Traitee')], db_index=True, default='requested', max_length=30)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('admin_note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('pharmacy', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subscription_refunds', to='pharmacies.pharmacy')),
                ('processed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='processed_subscription_refunds', to=settings.AUTH_USER_MODEL)),
                ('requested_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='requested_subscription_refunds', to=settings.AUTH_USER_MODEL)),
                ('subscription_payment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='refunds', to='subscriptions.subscriptionpayment')),
            ],
            options={
                'verbose_name': 'Remboursement abonnement',
                'verbose_name_plural': 'Remboursements abonnements',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['status', 'created_at'], name='subscriptio_status_6e6cb0_idx'),
                    models.Index(fields=['pharmacy', 'status'], name='subscriptio_pharmac_0fd100_idx'),
                ],
            },
        ),
        migrations.RunPython(sync_plans, migrations.RunPython.noop),
    ]
