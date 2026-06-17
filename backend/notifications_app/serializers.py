from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    # Backward-compat aliases
    titre = serializers.SerializerMethodField()
    lu = serializers.BooleanField(source='est_lue', read_only=True)
    is_read = serializers.BooleanField(source='est_lue', read_only=True)
    date_creation = serializers.DateTimeField(source='date', read_only=True)

    def get_titre(self, obj):
        if obj.title:
            return obj.title
        return obj.get_type_display()

    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'user_username',
            'title',
            'message',
            'date',
            'type',
            'notification_type',
            'est_lue',
            'lu',
            'is_read',
            'titre',
            'date_creation',
        ]
        read_only_fields = ['id', 'date', 'date_creation']
