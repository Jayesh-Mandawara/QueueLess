from rest_framework import serializers
from .models import Queue, QueueEntry
from businesses.serializers import ServiceSerializer
from accounts.serializers import UserSerializer
from .services import calculate_people_ahead, calculate_estimated_wait_minutes

class QueueSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Queue
        fields = ('id', 'service', 'date', 'status', 'current_token_number')

class QueueEntrySerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    service_name = serializers.CharField(source='queue.service.name', read_only=True)
    business_name = serializers.CharField(source='queue.service.business.name', read_only=True)
    people_ahead = serializers.SerializerMethodField()
    estimated_wait_minutes = serializers.SerializerMethodField()

    class Meta:
        model = QueueEntry
        fields = (
            'id', 'queue', 'service_name', 'business_name', 'customer',
            'token_number', 'status', 'joined_at', 'called_at', 'completed_at',
            'people_ahead', 'estimated_wait_minutes'
        )

    def get_people_ahead(self, obj):
        return calculate_people_ahead(obj)

    def get_estimated_wait_minutes(self, obj):
        return calculate_estimated_wait_minutes(obj)
