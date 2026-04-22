# 🌍 Pollution Monitoring & Awareness System

> Real-time Air Quality Monitoring | SDG 3 · SDG 11 · SDG 13

---

## 🔐 Login Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@pollution.com    | admin123  |
| User  | user@pollution.com     | user123   |

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Node.js & MySQL
- Download Node.js (v18+): https://nodejs.org/
- Download MySQL (v8+): https://dev.mysql.com/downloads/

### Step 2 — Install Dependencies

```bash
cd pollution-monitoring-system
npm install
```

### Step 3 — Configure Environment

Edit `.env` and set your MySQL password:

```env
DB_PASSWORD=your_mysql_password_here
```

**Get a FREE WAQI API key** (for real-time AQI):
1. Go to: https://aqicn.org/data-platform/token/
2. Enter your email → Get token
3. Paste into `.env`:

```env
WAQI_API_KEY=your_token_here
```

> **Note:** The `demo` token works for testing but has rate limits.

### Step 4 — Setup MySQL Database

Open MySQL and run:

```sql
source /path/to/pollution-monitoring-system/database.sql
```

Or paste the SQL from `database.sql` into MySQL Workbench / phpMyAdmin.

### Step 5 — Seed Default Users

```bash
npm run seed
```

This creates:
- `admin@pollution.com` / `admin123`
- `user@pollution.com` / `user123`

### Step 6 — Run the Server

```bash
npm start
# or for auto-reload during development:
npm run dev
```

### Step 7 — Open in Browser

```
http://localhost:3000
```

---

## 📁 Project Structure

```
pollution-monitoring-system/
│
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js  # Login / Register logic
│   │   └── pollutionController.js  # CRUD + AQI API
│   ├── middleware/
│   │   └── auth.js            # JWT verify + Admin guard
│   ├── models/
│   │   ├── userModel.js       # User DB queries
│   │   └── pollutionModel.js  # Pollution DB queries
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── pollutionRoutes.js # /api/pollution/*
│   └── server.js              # Express server entry point
│
├── public/
│   ├── css/
│   │   ├── style.css          # Global styles
│   │   └── login.css          # Login page styles
│   ├── js/
│   │   ├── api.js             # Shared API utility
│   │   ├── login.js           # Login/Register logic
│   │   ├── dashboard.js       # User dashboard logic
│   │   └── admin.js           # Admin panel logic
│   ├── login.html             # Login & Register page
│   ├── dashboard.html         # User dashboard
│   └── admin.html             # Admin panel (admin only)
│
├── seed.js                    # Creates default users
├── database.sql               # MySQL schema
├── .env                       # Environment variables
└── package.json
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Create account    |
| POST   | /api/auth/login       | Login (get JWT)   |

### Pollution (JWT required)
| Method | Endpoint                    | Role  | Description             |
|--------|-----------------------------|-------|-------------------------|
| GET    | /api/pollution              | All   | Get all records         |
| GET    | /api/pollution/search?area= | All   | Search by area          |
| GET    | /api/pollution/aqi/:city    | All   | Real-time AQI from WAQI |
| GET    | /api/pollution/summary      | All   | Analytics summary       |
| GET    | /api/pollution/users        | Admin | All registered users    |
| POST   | /api/pollution              | Admin | Add new record          |
| PUT    | /api/pollution/:id          | Admin | Update record           |
| DELETE | /api/pollution/:id          | Admin | Delete record           |

---

## ✨ Features

- 🔐 JWT authentication with role-based access (Admin/User)
- 📡 Real-time AQI from WAQI API (aqicn.org)
- 🗺️ Interactive map with Leaflet + OpenStreetMap (free!)
- 📊 Charts with Chart.js (bar + doughnut)
- 🚨 Automatic high-AQI alerts and admin warnings
- 💡 Awareness tips based on pollution level
- 📱 Responsive design — works on mobile
- 🌱 Aligned with SDG 3, 11, 13

---

## 🔧 Troubleshooting

**"Database connection failed"**
→ Check `.env` DB credentials; ensure MySQL is running.

**"No AQI data found"**
→ Try a major city name. Get a real API key from aqicn.org.

**"Invalid token" on login**
→ Change `JWT_SECRET` in `.env` to any long random string.

**Port 3000 in use**
→ Change `PORT=3001` in `.env`.
