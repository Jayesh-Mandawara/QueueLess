import os
import django
from datetime import time, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from businesses.models import Business, Service
from queues.models import Queue, QueueEntry

def seed_data():
    print("Seeding database...")

    # Create Admin
    admin_user, created = User.objects.get_or_create(
        email='admin@queueless.com',
        defaults={
            'name': 'System Admin',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("Created Superuser: admin@queueless.com / admin123")

    # Create Business: ABC Care Clinic
    clinic, created = Business.objects.get_or_create(
        name='ABC Care Clinic',
        defaults={
            'description': 'Premier Multi-Specialty Health & Consultation Clinic',
            'address': 'Sector 17, Chandigarh, India',
            'phone': '+91 98765 43210',
            'email': 'contact@abcclinic.com',
            'opening_time': time(9, 0),
            'closing_time': time(18, 0),
            'is_active': True
        }
    )
    if created:
        print("Created Business: ABC Care Clinic")

    # Create Services
    gen_service, _ = Service.objects.get_or_create(
        business=clinic,
        name='General Consultation',
        defaults={'description': 'General Health Checkup & Diagnosis', 'average_service_time': 10}
    )
    dental_service, _ = Service.objects.get_or_create(
        business=clinic,
        name='Dental Care',
        defaults={'description': 'Teeth Cleaning, Fillings & Dental Checkup', 'average_service_time': 15}
    )
    diag_service, _ = Service.objects.get_or_create(
        business=clinic,
        name='Diagnostic Test',
        defaults={'description': 'Blood Test & Routine Labs', 'average_service_time': 8}
    )
    print("Created 3 Services for ABC Care Clinic")

    # Create Staff User
    staff_user, created = User.objects.get_or_create(
        email='staff@abcclinic.com',
        defaults={
            'name': 'Dr. Sharma (Staff)',
            'role': User.Role.STAFF,
            'business': clinic,
            'is_staff': True
        }
    )
    if created:
        staff_user.set_password('staff123')
        staff_user.save()
        print("Created Staff User: staff@abcclinic.com / staff123")

    # Create Sample Customers
    customers_data = [
        ('rahul@example.com', 'Rahul Kumar'),
        ('priya@example.com', 'Priya Sharma'),
        ('aman@example.com', 'Aman Verma'),
        ('riya@example.com', 'Riya Gupta'),
        ('karan@example.com', 'Karan Patel'),
    ]

    customers = []
    for email, name in customers_data:
        c, created = User.objects.get_or_create(
            email=email,
            defaults={'name': name, 'role': User.Role.CUSTOMER}
        )
        if created:
            c.set_password('customer123')
            c.save()
        customers.append(c)
    print(f"Created {len(customers)} Sample Customers (password: customer123)")

    # Create Today's Queue for General Consultation
    today = date.today()
    gen_queue, _ = Queue.objects.get_or_create(
        service=gen_service,
        date=today,
        defaults={'status': Queue.Status.OPEN, 'current_token_number': 5}
    )
    gen_queue.current_token_number = 5
    gen_queue.save()

    # Seed Tokens: 1 completed, 1 serving, 3 waiting
    tokens = [
        (1, customers[0], QueueEntry.Status.COMPLETED),
        (2, customers[1], QueueEntry.Status.SERVING),
        (3, customers[2], QueueEntry.Status.WAITING),
        (4, customers[3], QueueEntry.Status.WAITING),
        (5, customers[4], QueueEntry.Status.WAITING),
    ]

    for num, cust, st in tokens:
        QueueEntry.objects.get_or_create(
            queue=gen_queue,
            token_number=num,
            defaults={'customer': cust, 'status': st}
        )

    print("Seeded Today's Queue with 5 tokens (1 Completed, 1 Serving, 3 Waiting)!")

if __name__ == '__main__':
    seed_data()
