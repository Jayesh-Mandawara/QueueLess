from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Queue, QueueEntry
from businesses.models import Service
from .serializers import QueueSerializer, QueueEntrySerializer
from .services import (
    get_or_create_today_queue,
    join_queue_transactional,
    call_next_customer_transactional
)
from accounts.permissions import IsStaffUser

class ServiceQueueStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, service_id):
        try:
            service = Service.objects.get(id=service_id, is_active=True)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)

        queue = get_or_create_today_queue(service)
        currently_serving = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.SERVING).first()
        waiting_count = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.WAITING).count()

        return Response({
            'queue_id': queue.id,
            'service_id': service.id,
            'service_name': service.name,
            'status': queue.status,
            'currently_serving_token': currently_serving.token_number if currently_serving else None,
            'waiting_count': waiting_count,
            'last_token_generated': queue.current_token_number
        })

class JoinQueueView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, service_id):
        try:
            service = Service.objects.get(id=service_id, is_active=True)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            entry = join_queue_transactional(service, request.user)
            return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MyCurrentQueueView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        entry = QueueEntry.objects.filter(
            customer=request.user,
            queue__date=today,
            status__in=[QueueEntry.Status.WAITING, QueueEntry.Status.SERVING]
        ).first()

        if not entry:
            return Response({'active_queue': False})

        return Response({
            'active_queue': True,
            'entry': QueueEntrySerializer(entry).data
        })

class CancelQueueView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, entry_id):
        try:
            entry = QueueEntry.objects.get(id=entry_id, customer=request.user)
        except QueueEntry.DoesNotExist:
            return Response({'error': 'Queue entry not found'}, status=status.HTTP_404_NOT_FOUND)

        if entry.status != QueueEntry.Status.WAITING:
            return Response({'error': 'Can only cancel tokens in WAITING status'}, status=status.HTTP_400_BAD_REQUEST)

        entry.status = QueueEntry.Status.CANCELLED
        entry.save()
        return Response({'message': 'Queue entry cancelled successfully'})

class MyQueueHistoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entries = QueueEntry.objects.filter(customer=request.user).order_by('-joined_at')
        return Response(QueueEntrySerializer(entries, many=True).data)

# Staff Actions
class StaffQueueDashboardView(views.APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        business = request.user.business
        if not business:
            return Response({'error': 'Staff user is not assigned to a business'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        services = Service.objects.filter(business=business, is_active=True)

        data = []
        for service in services:
            queue = get_or_create_today_queue(service)
            serving = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.SERVING).first()
            waiting = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.WAITING).order_by('token_number')
            completed_count = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.COMPLETED).count()

            data.append({
                'service_id': service.id,
                'service_name': service.name,
                'queue_id': queue.id,
                'queue_status': queue.status,
                'current_serving': QueueEntrySerializer(serving).data if serving else None,
                'waiting_entries': QueueEntrySerializer(waiting, many=True).data,
                'completed_count': completed_count,
            })

        return Response({'business_name': business.name, 'queues': data})

class StaffCallNextView(views.APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, queue_id):
        try:
            queue = Queue.objects.get(id=queue_id, service__business=request.user.business)
        except Queue.DoesNotExist:
            return Response({'error': 'Queue not found for your business'}, status=status.HTTP_404_NOT_FOUND)

        try:
            entry = call_next_customer_transactional(queue)
            return Response(QueueEntrySerializer(entry).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StaffCompleteCurrentView(views.APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, queue_id):
        try:
            queue = Queue.objects.get(id=queue_id, service__business=request.user.business)
        except Queue.DoesNotExist:
            return Response({'error': 'Queue not found for your business'}, status=status.HTTP_404_NOT_FOUND)

        serving = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.SERVING).first()
        if not serving:
            return Response({'error': 'No customer currently in SERVING status'}, status=status.HTTP_400_BAD_REQUEST)

        serving.status = QueueEntry.Status.COMPLETED
        serving.completed_at = timezone.now()
        serving.save()

        return Response(QueueEntrySerializer(serving).data)

class StaffSkipCurrentView(views.APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, queue_id):
        try:
            queue = Queue.objects.get(id=queue_id, service__business=request.user.business)
        except Queue.DoesNotExist:
            return Response({'error': 'Queue not found for your business'}, status=status.HTTP_404_NOT_FOUND)

        serving = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.SERVING).first()
        if not serving:
            return Response({'error': 'No customer currently in SERVING status'}, status=status.HTTP_400_BAD_REQUEST)

        serving.status = QueueEntry.Status.SKIPPED
        serving.completed_at = timezone.now()
        serving.save()

        return Response(QueueEntrySerializer(serving).data)
