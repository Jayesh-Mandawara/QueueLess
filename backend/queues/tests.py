from django.test import TestCase
from django.contrib.auth import get_user_model
from businesses.models import Business, Service
from queues.models import Queue, QueueEntry
from queues.services import join_queue_transactional, call_next_customer_transactional, calculate_people_ahead

User = get_user_model()

class QueueEngineTestCase(TestCase):
    def setUp(self):
        self.clinic = Business.objects.create(name='Test Clinic', address='Test Address')
        self.service = Service.objects.create(business=self.clinic, name='Test Service', average_service_time=10)
        self.staff = User.objects.create_user(email='staff@test.com', password='password', name='Staff User', role=User.Role.STAFF, business=self.clinic)
        self.cust1 = User.objects.create_user(email='cust1@test.com', password='password', name='Customer 1')
        self.cust2 = User.objects.create_user(email='cust2@test.com', password='password', name='Customer 2')
        self.cust3 = User.objects.create_user(email='cust3@test.com', password='password', name='Customer 3')

    def test_token_generation_and_queue_flow(self):
        # Customer 1 joins queue -> gets Token #1
        e1 = join_queue_transactional(self.service, self.cust1)
        self.assertEqual(e1.token_number, 1)
        self.assertEqual(e1.status, QueueEntry.Status.WAITING)

        # Customer 2 joins queue -> gets Token #2
        e2 = join_queue_transactional(self.service, self.cust2)
        self.assertEqual(e2.token_number, 2)

        # Customer 3 joins queue -> gets Token #3
        e3 = join_queue_transactional(self.service, self.cust3)
        self.assertEqual(e3.token_number, 3)

        # Verify people ahead for Customer 3
        self.assertEqual(calculate_people_ahead(e3), 2)

        # Duplicate join attempt should raise ValueError
        with self.assertRaises(ValueError):
            join_queue_transactional(self.service, self.cust3)

        # Call next customer -> Customer 1 becomes SERVING
        queue = e1.queue
        called_entry = call_next_customer_transactional(queue)
        self.assertEqual(called_entry.id, e1.id)
        self.assertEqual(called_entry.status, QueueEntry.Status.SERVING)

        # Calling next again while someone is serving should raise ValueError
        with self.assertRaises(ValueError):
            call_next_customer_transactional(queue)
