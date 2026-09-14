# QueueLess - Virtual Queue Management System

A full-stack virtual queue management platform built with **Django 5 REST Framework + PostgreSQL** backend and **React Native (Expo)** mobile application. Designed to reduce physical queue crowding in clinics, banks, and service centers.

---

## 🌟 Key Features

- 🎟️ **Atomic Token Generation**: Prevents duplicate tokens during concurrent join requests using PostgreSQL row-level locks (`select_for_update`).
- ⏱️ **Dynamic Wait-Time Estimation**: Calculates waiting times dynamically based on recent completed service durations and real-time active tokens ahead.
- 🔔 **Idempotent In-App Alerts**: Automatically alerts customers when their turn is approaching (<= 3 people ahead) and when called by staff.
- 👨‍⚕️ **Staff Counter Control**: One-tap `Call Next`, `Complete`, and `Skip` actions for counter management.
- 📊 **Analytics Dashboard Engine**: Tracks total tokens, completed vs skipped rates, average service times, and peak hours.
- 🔒 **Role-Based Security**: Custom User model supporting `CUSTOMER`, `STAFF`, and `ADMIN` roles using SimpleJWT tokens.

---

## 📁 Repository Structure

```text
QueueLess Django/
├── backend/                  # Django REST Framework Backend
│   ├── config/               # Project Settings & URLs
│   ├── accounts/             # Custom User & Auth APIs
│   ├── businesses/           # Business & Service Models
│   ├── queues/               # Core Queue Engine & Logic
│   ├── notifications/        # In-App Notification System
│   ├── analytics/            # Admin Analytics API
│   ├── seed_db.py            # Initial Database Seeder
│   └── manage.py
│
└── mobile/                   # React Native (Expo) Mobile App
    ├── src/
    │   ├── context/          # Auth Context & JWT Handler
    │   ├── services/         # Axios API Client
    │   └── screens/          # Customer & Staff Mobile UI
    ├── AppNavigator.js       # React Navigation Setup
    └── App.js
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (Django)

```bash
cd backend

# Create & activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary pillow

# Apply database migrations
python manage.py migrate

# Seed sample data (Clinics, Services, Staff, Customers, and Tokens)
python seed_db.py

# Run development server
python manage.py runserver
```

The Django API server will start at `http://127.0.0.1:8000/`.

---

### 🔑 Demo Accounts (Seeded)

| Role | Email | Password |
|---|---|---|
| 👑 **Super Admin** | `admin@queueless.com` | `admin123` |
| 👨‍⚕️ **Staff User** | `staff@abcclinic.com` | `staff123` |
| 👤 **Customer 1** | `rahul@example.com` | `customer123` |
| 👤 **Customer 2** | `priya@example.com` | `customer123` |

Django Admin Interface is accessible at `http://127.0.0.1:8000/admin/`.

---

### 2. Mobile Setup (React Native + Expo)

```bash
cd mobile

# Install mobile dependencies
npm install

# Start Expo dev server
npx expo start
```

Press `a` to run on Android Emulator, `w` to run in Web Browser, or scan the QR code using the **Expo Go** app on your phone!
