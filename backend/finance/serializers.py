from rest_framework import serializers


class FinanceFilterSerializer(serializers.Serializer):
    period = serializers.ChoiceField(
        choices=['today', 'week', 'month', 'year', 'custom'],
        required=False,
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        if attrs.get('period') == 'custom' and (
            not attrs.get('start_date') or not attrs.get('end_date')
        ):
            raise serializers.ValidationError(
                'start_date et end_date sont obligatoires pour period=custom.'
            )

        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError(
                    'end_date doit etre superieure ou egale a start_date.'
                )

        return attrs
