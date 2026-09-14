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

| Role               | Email                 | Password      |
| ------------------ | --------------------- | ------------- |
| 👑 **Super Admin** | `admin@queueless.com` | `admin123`    |
| 👨‍⚕️ **Staff User**  | `staff@abcclinic.com` | `staff123`    |
| 👤 **Customer 1**  | `rahul@example.com`   | `customer123` |
| 👤 **Customer 2**  | `priya@example.com`   | `customer123` |

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

---

## Render Deployment

The backend is configured to use SQLite locally and PostgreSQL automatically when Render provides `DATABASE_URL`.

Create a Render PostgreSQL database first, then create a Render Web Service with:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt && python manage.py collectstatic --no-input
Start Command: gunicorn config.wsgi:application
```

Add these environment variables to the Render Web Service:

| Variable               | Value source                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `SECRET_KEY`           | Generate locally with `python -c "from secrets import token_urlsafe; print(token_urlsafe(64))"` and paste the output. |
| `DEBUG`                | Type `False`.                                                                                                         |
| `ALLOWED_HOSTS`        | Your Render service hostname, for example `queueless-api.onrender.com`, without `https://`.                           |
| `DATABASE_URL`         | Copy the PostgreSQL database's **Internal Database URL** from Render.                                                 |
| `CORS_ALLOWED_ORIGINS` | Optional. Add browser origins separated by commas. Native Android APK requests do not require CORS.                   |

Do not commit real secrets or the database URL. The safe variable names and placeholders are listed in `backend/.env.example`.

After the first successful deployment, open the Render Web Service Shell and run:

```bash
python manage.py migrate
python seed_db.py
```

The mobile app must use the deployed API URL in `mobile/src/services/api.js`, for example:

```js
export const BASE_URL = "https://queueless-api.onrender.com/api";
```
