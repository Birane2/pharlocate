from django.db import migrations, models


def copy_user_phone_to_otp(apps, schema_editor):
    OTPCode = apps.get_model('accounts', 'OTPCode')

    for otp_code in OTPCode.objects.select_related('user').all():
        otp_code.phone_number = otp_code.user.phone_number or ''
        otp_code.save(update_fields=['phone_number'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_is_phone_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='otpcode',
            name='phone_number',
            field=models.CharField(blank=True, db_index=True, max_length=20),
        ),
        migrations.RunPython(copy_user_phone_to_otp, migrations.RunPython.noop),
    ]
