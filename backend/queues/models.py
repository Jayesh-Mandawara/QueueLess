from django.db import models
from django.conf import settings
from businesses.models import Service

class Queue(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', 'Not Started'
        OPEN = 'OPEN', 'Open'
        CLOSED = 'CLOSED', 'Closed'

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='queues')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    current_token_number = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('service', 'date')

    def __str__(self):
        return f"{self.service.name} Queue ({self.date}) - {self.status}"

class QueueEntry(models.Model):
    class Status(models.TextChoices):
        WAITING = 'WAITING', 'Waiting'
        SERVING = 'SERVING', 'Serving'
        COMPLETED = 'COMPLETED', 'Completed'
        SKIPPED = 'SKIPPED', 'Skipped'
        CANCELLED = 'CANCELLED', 'Cancelled'
        EXPIRED = 'EXPIRED', 'Expired'

    queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name='entries')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='queue_entries')
    token_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    joined_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('queue', 'token_number')
        ordering = ['token_number']
        verbose_name_plural = 'Queue Entries'

    def __str__(self):
        return f"Token #{self.token_number} - {self.customer.name} ({self.status})"
