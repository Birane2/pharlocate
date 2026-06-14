from django.db import migrations, models
from django.db.models import Count


def migrate_reservation_data(apps, schema_editor):
    Reservation = apps.get_model('reservations', 'Reservation')
    ReservationItem = apps.get_model('reservations', 'ReservationItem')

    Reservation.objects.filter(statut='recuperee').update(statut='livree')
    Reservation.objects.filter(statut='terminee').update(statut='livree')
    Reservation.objects.filter(
        statut_paiement__in=['non_paye', 'en_attente_validation']
    ).update(statut_paiement='en_attente_verification')

    duplicates = (
        ReservationItem.objects.values('reservation_id', 'medicament_id')
        .annotate(total=Count('id'))
        .filter(total__gt=1)
    )
    for duplicate in duplicates.iterator():
        items = list(
            ReservationItem.objects.filter(
                reservation_id=duplicate['reservation_id'],
                medicament_id=duplicate['medicament_id'],
            ).order_by('id')
        )
        first = items[0]
        first.quantite = sum(item.quantite for item in items)
        first.save(update_fields=['quantite'])
        ReservationItem.objects.filter(
            pk__in=[item.pk for item in items[1:]]
        ).delete()


def reverse_reservation_data(apps, schema_editor):
    Reservation = apps.get_model('reservations', 'Reservation')
    Reservation.objects.filter(statut='livree').update(statut='recuperee')
    Reservation.objects.filter(
        statut_paiement='en_attente_verification'
    ).update(statut_paiement='en_attente_validation')


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0004_legacy_columns_defaults'),
    ]

    operations = [
        migrations.RenameField(
            model_name='reservation',
            old_name='mode_retrait',
            new_name='type_reservation',
        ),
        migrations.RunPython(
            migrate_reservation_data,
            reverse_reservation_data,
        ),
        migrations.AlterField(
            model_name='reservation',
            name='statut',
            field=models.CharField(
                choices=[
                    ('en_attente', 'En attente'),
                    ('confirmee', 'Confirmee'),
                    ('en_preparation', 'En preparation'),
                    ('prete', 'Prete'),
                    ('livree', 'Livree'),
                    ('annulee', 'Annulee'),
                    ('refusee', 'Refusee'),
                ],
                db_index=True,
                default='en_attente',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='statut_paiement',
            field=models.CharField(
                choices=[
                    ('en_attente_verification', 'En attente de verification'),
                    ('valide', 'Valide'),
                    ('refuse', 'Refuse'),
                    ('annule', 'Annule'),
                    ('rembourse', 'Rembourse'),
                ],
                db_index=True,
                default='en_attente_verification',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='type_reservation',
            field=models.CharField(
                choices=[
                    ('retrait', 'Retrait a la pharmacie'),
                    ('livraison', 'Livraison a domicile'),
                ],
                db_column='mode_retrait',
                db_index=True,
                default='retrait',
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name='reservationitem',
            constraint=models.UniqueConstraint(
                fields=('reservation', 'medicament'),
                name='unique_medicament_per_reservation',
            ),
        ),
    ]
