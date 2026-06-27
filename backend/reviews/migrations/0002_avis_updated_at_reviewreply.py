from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('reviews', '0001_initial'),
        ('pharmacies', '0002_horaire'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='avis',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.CreateModel(
            name='ReviewReply',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pharmacist', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='review_replies',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('pharmacy', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='review_replies',
                    to='pharmacies.pharmacy',
                )),
                ('review', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reply',
                    to='reviews.avis',
                )),
            ],
        ),
    ]
