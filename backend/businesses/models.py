from django.db import models

class Business(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    address = models.CharField(max_length=550)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    opening_time = models.TimeField(default='09:00:00')
    closing_time = models.TimeField(default='18:00:00')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Businesses'

    def __str__(self):
        return self.name

class Service(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    average_service_time = models.PositiveIntegerField(default=10, help_text="Average service time in minutes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.business.name})"
