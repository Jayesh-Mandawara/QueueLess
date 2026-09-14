from django.contrib import admin
from .models import Business, Service

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'opening_time', 'closing_time', 'is_active')
    search_fields = ('name', 'address')
    list_filter = ('is_active',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'average_service_time', 'is_active')
    list_filter = ('business', 'is_active')
    search_fields = ('name', 'business__name')
