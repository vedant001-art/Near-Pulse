# NearPulse — Local Amenities Discovery and Subscription Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Express.js](https://img.shields.io/badge/Express-5.3-black?logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?logo=leaflet)](https://leafletjs.com/)

A modern, responsive, full-stack web application designed for students and working professionals to discover, compare, and subscribe to nearby amenities and essential daily services (Mess & Tiffins, PG Accommodations, Hostels, Gyms & Fitness Centers, Clinics, and Laundromats).

---

## 🌟 Key Highlights & Features

### 🎓 1. Student / Working Professional Experience
- **Interactive Map & Discovery**: Leaflet + OpenStreetMap interactive map with custom color-coded pins synchronized with amenity cards.
- **Geographic Proximity & Sorting**: Calculate real-time distance in kilometers using the Haversine formula based on GPS or locality hubs (Koramangala, HSR Layout, Indiranagar, BTM Layout, Whitefield).
- **Search & Multi-Filters**: Filter by category, price slider, distance radius, 4+ star ratings, and "Available Now" immediate joining status.
- **Detailed Amenity Page**: High-resolution image gallery, operating hours, perks checklist (WiFi, 3 Meals, AC, Power Backup), host information, and direct "Contact Provider" modal.
- **Transparent Subscription Checkout**:
  - Detailed plan duration and features breakdown.
  - Price breakdown: Base Price, Platform Security Fee (₹49), and 5% GST.
  - Start date picker with automatic expiry date calculation.
- **Razorpay Sandbox Payment Gateway Experience**:
  - Realistic payment modal supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (with 1-click test card filler), NetBanking, and Wallets.
  - Secure cryptographic signature verification on the backend.
  - Test mode controls for simulating both **Payment Success** and **Payment Failure / Bank Decline**.
  - Confetti celebration and instant digital activation receipt.
- **Subscriber Dashboard**:
  - Active & past subscriptions with days remaining and visual progress bars.
  - Automated 7-day renewal alerts banner.
  - Transaction history with printable/downloadable digital tax invoices.
  - Saved amenities bookmarks.
  - Customer review submission with 1-5 star ratings.

### 🏪 2. Service Provider Dashboard
- **Business KPI Metrics**: Total Listings, Active Subscribers, Total Revenue Earned (₹), and Average Rating.
- **Listing Management (CRUD)**: Create listings with address, GPS coordinates, operating hours, photos, perks, and custom subscription plans (Weekly, Monthly, Semester).
- **Availability Toggle**: Instant 1-click toggle between `Available` and `Full (Waitlist)`.
- **Customer Subscriptions Table**: View customer names, contact info, selected plan, validity dates, and subscription status.
- **Payment Records & Payouts**: Real-time earnings breakdown and transaction IDs.
- **Customer Reviews & Replies**: Respond directly to customer reviews as the verified host.

### 🛡️ 3. Administrator Console
- **Platform Analytics**: Total Users, Total Providers, Total Amenities, Active Subscriptions, and Gross Merchandise Value (GMV).
- **Listing Approval & Moderation**: Queue to review, approve, reject, or flag provider listings.
- **User Directory & RBAC**: View all students and providers, and toggle account activation or suspension.
- **Review Moderation**: Delete inappropriate or spam reviews.
- **Renewal Cron Simulator**: 1-Click execution button for the background renewal reminder engine.

---

## 🔑 Quick Demo Credentials (1-Click Switcher Available in Top Bar)

| Role | Account Email | Password | Persona & Highlights |
| :--- | :--- | :--- | :--- |
| **Student** | `student@nearpulse.com` | `student123` | Aditya Verma (Active Mess subscription & Gym plan expiring in 3 days) |
| **Professional** | `sneha@nearpulse.com` | `student123` | Sneha Kulkarni (Product Designer in HSR Layout) |
| **Provider** | `provider@annapurnamess.com` | `provider123` | Ramesh Patel (Annapurna Royal Mess with 4 listings & subscribers) |
| **Provider** | `provider@comfortstays.com` | `provider123` | Kavita Reddy (ComfortStays Luxury PG & Coliving) |
| **Provider** | `provider@ironpulse.com` | `provider123` | Vikram Malhotra (IronPulse 24/7 Gym) |
| **Provider** | `provider@carewell.com` | `provider123` | Dr. Ananya Roy (CareWell Clinic & Emergency) |
| **Administrator** | `admin@nearpulse.com` | `admin123` | Priya Sharma (Full platform management & moderation) |

> 💡 **Demo Bar**: An interactive bar is pinned at the top of the interface allowing instant 1-click switching between **Student**, **Provider**, and **Admin** without typing passwords.

---

## 🏗️ Architecture & Technology Stack

```
web-tech project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema for PostgreSQL
│   │   └── seed.js               # Comprehensive seed script with realistic amenities
│   ├── src/
│   │   ├── controllers/          # Business logic (Auth, Amenities, Subscriptions, Payments, Reviews, Admin)
│   │   ├── middleware/           # JWT authentication & Role-Based Access Control (RBAC)
│   │   ├── routes/               # Express REST API routes
│   │   ├── services/             # Payment verification & Renewal reminder cron service
│   │   ├── prisma.js             # Prisma client instance
│   │   └── index.js              # Express application entry point
│   ├── package.json
│   └── .env                      # Environment configuration
└── frontend/
    ├── src/
    │   ├── components/           # Reusable UI: Navbar, Footer, AmenityCard, MapLeaflet, PaymentModal, etc.
    │   ├── context/              # AuthContext with persistent session & role helpers
    │   ├── pages/                # Landing, Explore, AmenityDetails, Checkout, Dashboards, Auth
    │   ├── services/api.js       # Axios client with interceptors
    │   ├── App.jsx               # React Router routes and RBAC guards
    │   └── main.jsx
    ├── tailwind.config.js        # Modern SaaS color tokens
    ├── vite.config.js            # Vite configuration with API proxy to port 5000
    └── package.json
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **PostgreSQL**: PostgreSQL 14, 15, or 17 (accepting connections on port 5432)

### 1. Database Setup
Ensure PostgreSQL is running locally on port 5432 with a database named `amenities_platform`:
```sql
CREATE DATABASE amenities_platform;
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Push schema to PostgreSQL and generate client
npx prisma db push

# Seed realistic demo data (Amenities, Plans, Users, Reviews, Subscriptions)
node prisma/seed.js

# Start backend server (runs on http://localhost:5000)
npm start
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

## 📡 REST API Reference

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new user or provider | Public |
| **POST** | `/api/auth/login` | Authenticate and issue JWT | Public |
| **GET** | `/api/auth/me` | Fetch active user profile and counts | Authenticated |
| **GET** | `/api/amenities` | Search amenities with filters & GPS distance | Public / Optional Auth |
| **GET** | `/api/amenities/:id` | Fetch detailed amenity, plans, & reviews | Public / Optional Auth |
| **POST** | `/api/amenities` | Create new listing with plans | Provider / Admin |
| **PUT** | `/api/amenities/:id` | Update listing details | Owner / Admin |
| **DELETE** | `/api/amenities/:id` | Delete listing | Owner / Admin |
| **POST** | `/api/amenities/:id/save` | Bookmark / Save amenity | Student / Authenticated |
| **GET** | `/api/amenities/saved` | List bookmarked amenities | Student / Authenticated |
| **POST** | `/api/subscriptions` | Create pending subscription & payment order | Authenticated |
| **GET** | `/api/subscriptions` | List user's subscriptions with progress | Authenticated |
| **PATCH** | `/api/subscriptions/:id/cancel` | Cancel active or pending subscription | Subscriber / Admin |
| **POST** | `/api/payments/verify` | Verify Razorpay signature & activate sub | Authenticated |
| **GET** | `/api/payments/history` | User transaction history with receipts | Authenticated |
| **POST** | `/api/amenities/:id/reviews` | Submit a 1-5 star review | Authenticated |
| **GET** | `/api/provider/stats` | Provider dashboard metrics & revenue | Provider / Admin |
| **GET** | `/api/provider/listings` | Provider's listings with subscriber counts | Provider / Admin |
| **GET** | `/api/provider/subscriptions` | Paying customer subscriber table | Provider / Admin |
| **PATCH** | `/api/provider/listings/:id/availability` | Toggle listing Availability (Available / Full) | Provider / Admin |
| **GET** | `/api/admin/stats` | Platform-wide GMV and user analytics | Admin |
| **PATCH** | `/api/admin/amenities/:id/approval` | Approve or Reject amenity listing | Admin |
| **PATCH** | `/api/admin/users/:id/status` | Activate or Suspend user account | Admin |
| **DELETE** | `/api/admin/reviews/:id` | Remove review (Content Moderation) | Admin |
| **POST** | `/api/admin/trigger-renewal-reminders` | Execute renewal cron reminder job | Admin |

---

## ⚙️ Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amenities_platform?schema=public"
JWT_SECRET="super_secret_nearpulse_jwt_key_2026_local_amenities"
RAZORPAY_KEY_ID="rzp_test_nearpulse_demo_key"
RAZORPAY_KEY_SECRET="rzp_test_secret_demo_987654321"
FRONTEND_URL="http://localhost:5173"
```

---

## 🔒 Security & Best Practices
- **Password Protection**: Passwords hashed with `bcryptjs` using 10 salt rounds.
- **Server-Side Verification**: Subscriptions are never activated solely because the client claims payment succeeded. The server validates order existence and cryptographic signatures.
- **Role-Based Access Control (RBAC)**: Role validation enforced at both middleware route level and database query level to prevent horizontal privilege escalation.
- **Duplicate Reminder Prevention**: Subscriptions track `reminderSent` boolean flag to ensure each expiring period generates exactly one notification.
