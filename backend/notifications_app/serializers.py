from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    titre = serializers.SerializerMethodField()
    lu = serializers.BooleanField(source='est_lue', read_only=True)
    date_creation = serializers.DateTimeField(source='date', read_only=True)

    def get_titre(self, obj):
        return obj.get_type_display()

    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'user_username',
            'message',
            'date',
            'type',
            'est_lue',
            'titre',
            'lu',
            'date_creation',
        ]
        read_only_fields = ['id', 'date']
