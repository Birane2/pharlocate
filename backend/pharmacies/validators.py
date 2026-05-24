from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from rest_framework import serializers


GPS_COORDINATE_MAX_DIGITS = 9
GPS_COORDINATE_DECIMAL_PLACES = 6
GPS_COORDINATE_QUANTIZER = Decimal('0.000001')
LATITUDE_MIN = Decimal('-90')
LATITUDE_MAX = Decimal('90')
LONGITUDE_MIN = Decimal('-180')
LONGITUDE_MAX = Decimal('180')


def round_coordinate_decimal(value):
    decimal_value = value if isinstance(value, Decimal) else Decimal(str(value))
    return decimal_value.quantize(
        GPS_COORDINATE_QUANTIZER,
        rounding=ROUND_HALF_UP,
    )


def validate_latitude_value(value):
    if value is None:
        return value

    if value < LATITUDE_MIN or value > LATITUDE_MAX:
        raise serializers.ValidationError(
            'Latitude invalide. Elle doit etre comprise entre -90 et 90.'
        )

    return value


def validate_longitude_value(value):
    if value is None:
        return value

    if value < LONGITUDE_MIN or value > LONGITUDE_MAX:
        raise serializers.ValidationError(
            'Longitude invalide. Elle doit etre comprise entre -180 et 180.'
        )

    return value


class CoordinateDecimalField(serializers.DecimalField):
    def __init__(self, *args, coordinate_label='Coordonnee', **kwargs):
        kwargs.setdefault('max_digits', GPS_COORDINATE_MAX_DIGITS)
        kwargs.setdefault('decimal_places', GPS_COORDINATE_DECIMAL_PLACES)
        kwargs.setdefault('coerce_to_string', False)

        error_messages = kwargs.pop('error_messages', {})
        error_messages.setdefault('invalid', f'{coordinate_label} invalide.')

        super().__init__(*args, error_messages=error_messages, **kwargs)

    def to_internal_value(self, data):
        if data in (None, ''):
            return super().to_internal_value(data)

        try:
            value = Decimal(str(data).strip())
        except (InvalidOperation, TypeError, ValueError):
            self.fail('invalid')

        if not value.is_finite():
            self.fail('invalid')

        rounded_value = round_coordinate_decimal(value)
        return super().to_internal_value(str(rounded_value))
