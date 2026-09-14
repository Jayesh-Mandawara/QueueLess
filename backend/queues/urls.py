from django.urls import path
from .views import (
    ServiceQueueStatusView,
    JoinQueueView,
    MyCurrentQueueView,
    CancelQueueView,
    MyQueueHistoryView,
    StaffQueueDashboardView,
    StaffCallNextView,
    StaffCompleteCurrentView,
    StaffSkipCurrentView
)

urlpatterns = [
    # Customer endpoints
    path('services/<int:service_id>/status/', ServiceQueueStatusView.as_view(), name='service_queue_status'),
    path('services/<int:service_id>/join/', JoinQueueView.as_view(), name='join_queue'),
    path('my/current/', MyCurrentQueueView.as_view(), name='my_current_queue'),
    path('entries/<int:entry_id>/cancel/', CancelQueueView.as_view(), name='cancel_queue'),
    path('my/history/', MyQueueHistoryView.as_view(), name='my_queue_history'),

    # Staff endpoints
    path('staff/dashboard/', StaffQueueDashboardView.as_view(), name='staff_dashboard'),
    path('staff/<int:queue_id>/call-next/', StaffCallNextView.as_view(), name='staff_call_next'),
    path('staff/<int:queue_id>/complete/', StaffCompleteCurrentView.as_view(), name='staff_complete'),
    path('staff/<int:queue_id>/skip/', StaffSkipCurrentView.as_view(), name='staff_skip'),
]
