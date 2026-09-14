from django.db import transaction
from django.utils import timezone
from django.db.models import Avg, F, ExpressionWrapper, fields
from queues.models import Queue, QueueEntry
from notifications.models import Notification
from businesses.models import Service

def get_or_create_today_queue(service):
    today = timezone.now().date()
    queue, created = Queue.objects.get_or_create(
        service=service,
        date=today,
        defaults={'status': Queue.Status.OPEN, 'current_token_number': 0}
    )
    return queue

def calculate_people_ahead(queue_entry):
    if queue_entry.status != QueueEntry.Status.WAITING:
        return 0
    return QueueEntry.objects.filter(
        queue=queue_entry.queue,
        status=QueueEntry.Status.WAITING,
        token_number__lt=queue_entry.token_number
    ).count()

def calculate_recent_avg_service_time(service):
    # Get last 10 completed entries for this service
    completed_entries = QueueEntry.objects.filter(
        queue__service=service,
        status=QueueEntry.Status.COMPLETED,
        called_at__isnull=False,
        completed_at__isnull=False
    ).order_by('-completed_at')[:10]

    durations = []
    for entry in completed_entries:
        duration_mins = (entry.completed_at - entry.called_at).total_seconds() / 60.0
        durations.append(duration_mins)

    if len(durations) >= 3:
        return round(sum(durations) / len(durations), 1)
    return float(service.average_service_time)

def calculate_estimated_wait_minutes(queue_entry):
    if queue_entry.status != QueueEntry.Status.WAITING:
        return 0
    people_ahead = calculate_people_ahead(queue_entry)
    avg_time = calculate_recent_avg_service_time(queue_entry.queue.service)
    return int(round(people_ahead * avg_time))

def join_queue_transactional(service, customer):
    today = timezone.now().date()

    with transaction.atomic():
        # Lock queue row for atomic token generation
        queue = Queue.objects.select_for_update().get_or_create(
            service=service,
            date=today,
            defaults={'status': Queue.Status.OPEN, 'current_token_number': 0}
        )[0]

        if queue.status != Queue.Status.OPEN:
            raise ValueError("Today's queue is closed or not started.")

        # Check if customer already has an active WAITING/SERVING entry
        active_entry = QueueEntry.objects.filter(
            queue=queue,
            customer=customer,
            status__in=[QueueEntry.Status.WAITING, QueueEntry.Status.SERVING]
        ).first()

        if active_entry:
            raise ValueError("You already have an active token in this queue.")

        next_token = queue.current_token_number + 1
        queue.current_token_number = next_token
        queue.save()

        entry = QueueEntry.objects.create(
            queue=queue,
            customer=customer,
            token_number=next_token,
            status=QueueEntry.Status.WAITING
        )

        return entry

def check_and_send_approaching_notifications(queue_entry):
    if queue_entry.status == QueueEntry.Status.WAITING:
        people_ahead = calculate_people_ahead(queue_entry)
        if people_ahead <= 3:
            # Idempotency check: don't duplicate approaching alert
            title = "Turn Approaching"
            exists = Notification.objects.filter(
                user=queue_entry.customer,
                title=title,
                message__icontains=f"Token #{queue_entry.token_number}"
            ).exists()
            if not exists:
                Notification.objects.create(
                    user=queue_entry.customer,
                    title=title,
                    message=f"Your turn for {queue_entry.queue.service.name} is approaching! You have {people_ahead} people ahead (Token #{queue_entry.token_number})."
                )

def call_next_customer_transactional(queue):
    with transaction.atomic():
        # Check if someone is already SERVING
        serving = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.SERVING).first()
        if serving:
            raise ValueError(f"Token #{serving.token_number} is currently serving. Please complete or skip first.")

        next_entry = QueueEntry.objects.select_for_update().filter(
            queue=queue,
            status=QueueEntry.Status.WAITING
        ).order_by('token_number').first()

        if not next_entry:
            raise ValueError("No customers currently waiting in the queue.")

        next_entry.status = QueueEntry.Status.SERVING
        next_entry.called_at = timezone.now()
        next_entry.save()

        # Send Turn Arrived notification
        Notification.objects.create(
            user=next_entry.customer,
            title="Your Turn Has Arrived!",
            message=f"Please proceed to the counter for {queue.service.name}. (Token #{next_entry.token_number})"
        )

        # Notify next waiting entries about approaching turn
        waiting_entries = QueueEntry.objects.filter(queue=queue, status=QueueEntry.Status.WAITING).order_by('token_number')[:3]
        for we in waiting_entries:
            check_and_send_approaching_notifications(we)

        return next_entry
