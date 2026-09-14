from django.urls import path
from .views import BusinessListView, BusinessDetailView, ServiceListView

urlpatterns = [
    path('', BusinessListView.as_view(), name='business_list'),
    path('<int:pk>/', BusinessDetailView.as_view(), name='business_detail'),
    path('<int:business_id>/services/', ServiceListView.as_view(), name='service_list'),
]
