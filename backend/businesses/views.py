from rest_framework import generics, permissions
from .models import Business, Service
from .serializers import BusinessSerializer, ServiceSerializer

class BusinessListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Business.objects.filter(is_active=True)
    serializer_class = BusinessSerializer

class BusinessDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Business.objects.filter(is_active=True)
    serializer_class = BusinessSerializer

class ServiceListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ServiceSerializer

    def get_queryset(self):
        business_id = self.kwargs['business_id']
        return Service.objects.filter(business_id=business_id, is_active=True)
