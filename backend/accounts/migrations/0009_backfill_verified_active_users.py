from django.db import migrations


def mark_active_legacy_users_verified(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(
        is_active=True,
        is_email_verified=False,
    ).update(is_email_verified=True)


def reverse_mark_active_legacy_users_verified(apps, schema_editor):
    # This migration repairs legacy data. Reversing it would re-break valid
    # existing accounts, so the reverse operation intentionally does nothing.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0008_passwordresetotp'),
    ]

    operations = [
        migrations.RunPython(
            mark_active_legacy_users_verified,
            reverse_mark_active_legacy_users_verified,
        ),
    ]
