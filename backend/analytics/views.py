from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from queues.models import QueueEntry, Queue
from businesses.models import Business, Service
from accounts.permissions import IsAdminUser

class AdminAnalyticsDashboardView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        business_id = request.query_params.get('business_id')

        entries_qs = QueueEntry.objects.all()
        if business_id:
            entries_qs = entries_qs.filter(queue__service__business_id=business_id)

        today_entries = entries_qs.filter(queue__date=today)

        total_tokens = today_entries.count()
        completed = today_entries.filter(status=QueueEntry.Status.COMPLETED).count()
        serving = today_entries.filter(status=QueueEntry.Status.SERVING).count()
        waiting = today_entries.filter(status=QueueEntry.Status.WAITING).count()
        cancelled = today_entries.filter(status=QueueEntry.Status.CANCELLED).count()
        skipped = today_entries.filter(status=QueueEntry.Status.SKIPPED).count()

        # Calculate average waiting & service time
        completed_set = today_entries.filter(status=QueueEntry.Status.COMPLETED, called_at__isnull=False, completed_at__isnull=False)

        wait_durations = [(e.called_at - e.joined_at).total_seconds() / 60.0 for e in completed_set]
        service_durations = [(e.completed_at - e.called_at).total_seconds() / 60.0 for e in completed_set]

        avg_wait_mins = round(sum(wait_durations) / len(wait_durations), 1) if wait_durations else 0.0
        avg_service_mins = round(sum(service_durations) / len(service_durations), 1) if service_durations else 0.0

        # Group by hour for peak hour detection
        hourly_counts = {}
        for entry in today_entries:
            hour_str = entry.joined_at.strftime('%H:00')
            hourly_counts[hour_str] = hourly_counts.get(hour_str, 0) + 1

        peak_hour = max(hourly_counts, key=hourly_counts.get) if hourly_counts else "N/A"

        return Response({
            'date': str(today),
            'summary': {
                'total_tokens': total_tokens,
                'completed': completed,
                'serving': serving,
                'waiting': waiting,
                'cancelled': cancelled,
                'skipped': skipped,
                'average_waiting_time_mins': avg_wait_mins,
                'average_service_time_mins': avg_service_mins,
                'peak_hour': peak_hour,
            },
            'hourly_breakdown': hourly_counts
        })
