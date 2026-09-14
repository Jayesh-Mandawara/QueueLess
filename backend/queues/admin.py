from django.contrib import admin
from .models import Queue, QueueEntry

@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ('service', 'date', 'status', 'current_token_number')
    list_filter = ('status', 'date', 'service__business')
    search_fields = ('service__name', 'service__business__name')

@admin.register(QueueEntry)
class QueueEntryAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'queue', 'customer', 'status', 'joined_at', 'called_at', 'completed_at')
    list_filter = ('status', 'queue__date', 'queue__service')
    search_fields = ('customer__name', 'customer__email', 'token_number')
