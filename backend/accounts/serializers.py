from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'role')
        read_only_fields = ('id', 'role')

    def create(self, validated_data):
        validated_data['role'] = User.Role.CUSTOMER
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'role', 'business', 'business_name')
        read_only_fields = fields
