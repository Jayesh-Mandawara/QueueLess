from django.urls import path
from .views import AdminAnalyticsDashboardView

urlpatterns = [
    path('dashboard/', AdminAnalyticsDashboardView.as_view(), name='admin_analytics_dashboard'),
]
