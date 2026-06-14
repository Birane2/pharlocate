from django.db import migrations


LEGACY_DEFAULTS = {
    'delivery_fee': '0.00',
    'total_amount': '0.00',
    'fulfillment_method': "'retrait'",
    'medicine_amount': '0.00',
}


def add_legacy_column_defaults(apps, schema_editor):
    table_name = 'reservations_reservation'
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        columns = {
            column.name: column
            for column in connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    quoted_table = schema_editor.quote_name(table_name)

    for column_name, default_value in LEGACY_DEFAULTS.items():
        if column_name not in columns:
            continue

        quoted_column = schema_editor.quote_name(column_name)
        schema_editor.execute(
            f'ALTER TABLE {quoted_table} '
            f'ALTER COLUMN {quoted_column} SET DEFAULT {default_value}'
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        (
            'reservations',
            '0003_reservation_frais_livraison_reservation_mode_retrait_and_more',
        ),
    ]

    operations = [
        migrations.RunPython(
            add_legacy_column_defaults,
            migrations.RunPython.noop,
        ),
    ]
