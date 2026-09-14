from rest_framework import serializers
from .models import Business, Service

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('id', 'name', 'description', 'average_service_time', 'is_active')

class BusinessSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Business
        fields = ('id', 'name', 'description', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'is_active', 'services')
