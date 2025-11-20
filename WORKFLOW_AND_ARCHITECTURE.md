# Complete Workflow & Architecture Documentation

## 📋 Project Overview
**BookMyCampus** - A college resource booking portal for managing campus facilities (Seminar Hall, Auditorium, Lab) with role-based access control.

---

## 🏗️ System Architecture

### **High-Level Architecture**
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend       │         │   Backend API   │         │   Database      │
│   (React)        │◄────────►│   (Flask)       │◄────────►│   (SQLite)      │
│   Netlify        │  HTTPS  │   Render        │  SQL    │   college_      │
│   Deployment     │         │   Deployment    │         │   booking.db     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### **Technology Stack**

#### **Frontend Layer**
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 6.8.1
- **Calendar**: FullCalendar 6.1.10
- **Styling**: Tailwind CSS 3.2.7
- **State Management**: React Context API
- **Build Tool**: Create React App (React Scripts 5.0.1)
- **HTTP Client**: Fetch API (native)
- **Storage**: localStorage (for JWT tokens)

#### **Backend Layer**
- **Framework**: Flask 3.0.0
- **Language**: Python 3.11
- **WSGI Server**: Gunicorn 21.2.0 (production)
- **Database**: SQLite3
- **Authentication**: JWT (PyJWT 2.8.0)
- **Password Hashing**: bcrypt 5.0.0
- **CORS**: Flask-CORS 4.0.0

#### **Deployment**
- **Frontend**: Netlify (static hosting)
- **Backend**: Render (PaaS)
- **Version Control**: GitHub

---

## 🔄 Complete User Workflows

### **1. Authentication Workflow**

#### **Login Flow**
```
User → Login Form → Frontend API Service
                    ↓
              POST /api/auth/login
                    ↓
              Backend validates credentials
                    ↓
              Generate JWT token
                    ↓
              Return token + user data
                    ↓
              Store token in localStorage
                    ↓
              Redirect to Dashboard
```

**API Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "student@gmail.com",
    "password": "Student"
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Student User",
      "email": "student@gmail.com",
      "role": "student",
      "department": "Computer Science",
      "department_id": 1
    }
  }
  ```

**Backend Process**:
1. Validate email and password presence
2. Query database for user by email
3. Verify password using bcrypt
4. Generate JWT token with user_id, expiration (7 days)
5. Return token and user data

**Frontend Process**:
1. Call `apiService.login(email, password)`
2. Store token in localStorage
3. Set token in ApiService instance
4. Update AuthContext with user data
5. Redirect based on role

---

#### **Signup Flow**
```
User → Signup Form → Frontend API Service
                     ↓
               POST /api/auth/signup
                     ↓
               Backend validates data
                     ↓
               Hash password with bcrypt
                     ↓
               Insert user into database
                     ↓
               Generate JWT token
                     ↓
               Return token + user data
                     ↓
               Auto-login user
```

**API Endpoint**: `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "email": "newuser@college.edu",
    "password": "password123",
    "name": "New User",
    "role": "student",
    "department": "Computer Science",
    "department_id": 1
  }
  ```

---

### **2. Booking Creation Workflow**

#### **Student/Teacher Booking Flow**
```
User Dashboard → Click Calendar Date
                    ↓
              Open BookingForm Modal
                    ↓
              Fill Form (title, resource, date, time, purpose)
                    ↓
              Submit Form
                    ↓
              Frontend validates:
                - All fields filled
                - End time > Start time
                - Date not in past
                - Date not weekend
                    ↓
              POST /api/bookings
              (with JWT token in Authorization header)
                    ↓
              Backend validates:
                - JWT token
                - User authentication
                - Resource exists
                - No time conflicts
                - Date validations
                    ↓
              Insert booking with status='pending'
                    ↓
              Return booking data
                    ↓
              Refresh calendar & My Bookings
                    ↓
              Show success notification
```

**API Endpoint**: `POST /api/bookings`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "title": "Quantum theory lab",
    "resource": "Lab",
    "start": "2024-11-20T12:00:00",
    "end": "2024-11-20T13:00:00",
    "purpose": "lab for students on quantum theory concepts",
    "requester": "Student User",
    "requesterId": 1
  }
  ```
- **Response**:
  ```json
  {
    "id": 123,
    "title": "Quantum theory lab",
    "resource": "Lab",
    "start": "2024-11-20T12:00:00",
    "end": "2024-11-20T13:00:00",
    "purpose": "lab for students on quantum theory concepts",
    "status": "pending",
    "requester": "Student User",
    "requesterId": 1
  }
  ```

**Backend Validations**:
1. **Authentication**: Verify JWT token
2. **Required Fields**: title, resource, date, start_time, end_time, purpose
3. **Time Validation**: end_time > start_time
4. **Date Validation**: 
   - Not in the past
   - Not Saturday (weekday 5)
   - Not Sunday (weekday 6)
5. **Resource Validation**: Resource exists in database
6. **Conflict Check**: No overlapping bookings for same resource/date/time
7. **Insert**: Create booking with status='pending'

---

### **3. Calendar Display Workflow**

#### **Loading Calendar Events**
```
Dashboard Component Mounts
        ↓
useEffect triggers
        ↓
loadCalendarEvents() called
        ↓
GET /api/calendar/events?resource_id=<optional>
        ↓
Backend queries database:
  - Get all bookings (pending, approved, conducted)
  - Get timetable events
  - Format as calendar events
        ↓
Return events array
        ↓
Frontend formats events for FullCalendar
        ↓
Display on calendar with color coding
```

**API Endpoint**: `GET /api/calendar/events`
- **Query Parameters**: `resource_id` (optional)
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Department Meeting",
      "resource": "Seminar Hall",
      "start": "2024-11-20T10:00:00",
      "end": "2024-11-20T12:00:00",
      "purpose": "Monthly meeting",
      "status": "approved",
      "display_status": "pending",
      "type": "booking",
      "requester": "Dr. Jane Teacher",
      "requesterId": 2
    },
    {
      "id": 2,
      "title": "Regular Class",
      "resource": "Seminar Hall",
      "start": "2024-11-20T09:00:00",
      "end": "2024-11-20T11:00:00",
      "type": "timetable",
      "requester": "System"
    }
  ]
  ```

**Backend Process**:
1. Query bookings table
2. Filter by status (pending, approved, conducted)
3. Calculate `display_status`:
   - If booking date < today → 'conducted'
   - Else → 'pending'
4. Query timetable events (if any)
5. Format and return combined events

**Frontend Process**:
1. Call `apiService.getCalendarEvents(resourceId)`
2. Transform events for FullCalendar format
3. Apply color coding:
   - Blue: Seminar Hall
   - Red: Auditorium
   - Green: Lab
   - Gray: Timetable events
4. Render on FullCalendar component

---

### **4. My Bookings Display Workflow**

#### **Loading User's Bookings**
```
Dashboard Component Mounts
        ↓
useEffect triggers (when user is available)
        ↓
loadMyBookings() called
        ↓
GET /api/bookings/my
(with JWT token)
        ↓
Backend validates JWT token
        ↓
Query bookings WHERE user_id = <authenticated_user_id>
        ↓
Return bookings array
        ↓
Frontend displays in "My Bookings" section
        ↓
Apply status badges (pending/conducted)
```

**API Endpoint**: `GET /api/bookings/my`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Lab Session",
      "resource": "Lab",
      "start": "2024-11-20T10:00:00",
      "end": "2024-11-20T12:00:00",
      "purpose": "Research work",
      "status": "pending",
      "requester": "Student User",
      "requesterId": 1
    }
  ]
  ```

**Status Display Logic**:
- Uses `getBookingDisplayStatus()` utility function
- If booking date < today → Show "Conducted" badge (blue)
- Else → Show "Pending" badge (yellow)

---

### **5. HOD/Approver Approval Workflow**

#### **Viewing Pending Requests**
```
HOD Dashboard Loads
        ↓
loadPendingRequests() called
        ↓
GET /api/bookings/pending?department_id=<optional>
(with JWT token)
        ↓
Backend validates JWT token & role
        ↓
Query bookings WHERE status='pending'
(Filter by department if department_id provided)
        ↓
Return pending bookings
        ↓
Display in "UPCOMING BOOKING EVENTS" section
```

**API Endpoint**: `GET /api/bookings/pending`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**: `department_id` (optional)
- **Response**: Array of pending booking objects

---

#### **Approving a Booking**
```
HOD clicks "Approve" button
        ↓
approveBooking(bookingId) called
        ↓
PATCH /api/bookings/<booking_id>
Body: { "action": "approve" }
        ↓
Backend validates:
  - JWT token
  - User role (hod/approver)
  - Booking exists
        ↓
UPDATE bookings SET status='approved'
        ↓
Return updated booking
        ↓
Refresh calendar & pending requests
        ↓
Show success notification
```

**API Endpoint**: `PATCH /api/bookings/<booking_id>`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "action": "approve"
  }
  ```
- **Response**: Updated booking object

---

#### **Rejecting a Booking**
```
HOD clicks "Reject" button
        ↓
rejectBooking(bookingId, reason) called
        ↓
PATCH /api/bookings/<booking_id>
Body: { "action": "reject", "reason": "..." }
        ↓
Backend validates & updates
        ↓
UPDATE bookings SET status='rejected'
        ↓
Return updated booking
        ↓
Refresh calendar & pending requests
```

**API Endpoint**: `PATCH /api/bookings/<booking_id>`
- **Request Body**:
  ```json
  {
    "action": "reject",
    "reason": "Resource already booked"
  }
  ```

---

### **6. Status Management Workflow**

#### **Dynamic Status Display**
```
Booking has status='approved' in database
        ↓
Calendar/My Bookings loads booking
        ↓
getBookingDisplayStatus(booking) called
        ↓
Check: booking.start date < today?
        ↓
If YES → Return 'conducted'
If NO → Return 'pending'
        ↓
Display appropriate badge:
  - Conducted: Blue background, blue border
  - Pending: Yellow background, yellow border
```

**Status Logic**:
- **Database Status**: `pending`, `approved`, `rejected`, `cancelled`, `conducted`
- **Display Status**: Only `pending` or `conducted` (based on date)
- **Visual**: 
  - Pending: Yellow badge (`bg-yellow-200 border-yellow-400 text-amber-900`)
  - Conducted: Blue badge (`bg-blue-200 border-blue-400 text-blue-900`)

---

## 🔐 Authentication & Security

### **JWT Token Flow**
```
1. User Login
   ↓
2. Backend generates JWT:
   {
     "user_id": 1,
     "exp": <timestamp + 7 days>,
     "iat": <current timestamp>
   }
   ↓
3. Token signed with JWT_SECRET_KEY
   ↓
4. Token returned to frontend
   ↓
5. Frontend stores in localStorage
   ↓
6. All API requests include:
   Authorization: Bearer <JWT_TOKEN>
   ↓
7. Backend validates token:
   - Decode JWT
   - Verify signature
   - Check expiration
   - Extract user_id
   - Query user from database
```

### **Password Security**
- **Hashing**: bcrypt with salt
- **Storage**: Hashed passwords in database
- **Migration**: Plain text passwords auto-hashed on first login

### **CORS Configuration**
- **Backend**: Allows all origins (`*`) for `/api/*` routes
- **Purpose**: Enable frontend-backend communication across domains

---

## 📡 Complete API Reference

### **Base URL**
- **Development**: `http://localhost:8000/api`
- **Production**: `https://<render-url>/api`

### **Authentication Endpoints**

#### `POST /api/auth/login`
- **Description**: User login
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "token": "string (JWT)",
    "user": {
      "id": "integer",
      "name": "string",
      "email": "string",
      "role": "string",
      "department": "string",
      "department_id": "integer"
    }
  }
  ```

#### `POST /api/auth/signup`
- **Description**: User registration
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "name": "string",
    "role": "string (student|teacher|hod)",
    "department": "string",
    "department_id": "integer"
  }
  ```
- **Response**: `201 Created` (same format as login)

#### `GET /api/auth/me`
- **Description**: Get current authenticated user
- **Auth Required**: Yes (JWT token)
- **Response**: `200 OK`
  ```json
  {
    "user": {
      "id": "integer",
      "email": "string",
      "role": "string",
      "name": "string",
      "department": "string",
      "department_id": "integer"
    }
  }
  ```

---

### **Resource Endpoints**

#### `GET /api/resources`
- **Description**: Get all available resources
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Seminar Hall",
      "capacity": 100
    },
    {
      "id": 2,
      "name": "Auditorium",
      "capacity": 500
    },
    {
      "id": 3,
      "name": "Lab",
      "capacity": 30
    }
  ]
  ```

#### `GET /api/departments`
- **Description**: Get all departments
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Computer Science"
    }
  ]
  ```

---

### **Calendar Endpoints**

#### `GET /api/calendar/events`
- **Description**: Get all calendar events (bookings + timetable)
- **Auth Required**: No
- **Query Parameters**:
  - `resource_id` (optional): Filter by resource
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "string",
      "resource": "string",
      "start": "ISO datetime string",
      "end": "ISO datetime string",
      "purpose": "string",
      "status": "string",
      "display_status": "pending|conducted",
      "type": "booking|timetable",
      "requester": "string",
      "requesterId": "integer"
    }
  ]
  ```

---

### **Booking Endpoints**

#### `POST /api/bookings`
- **Description**: Create a new booking request
- **Auth Required**: Yes (JWT token)
- **Request Body**:
  ```json
  {
    "title": "string",
    "resource": "string",
    "start": "ISO datetime string",
    "end": "ISO datetime string",
    "purpose": "string",
    "requester": "string",
    "requesterId": "integer"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "integer",
    "title": "string",
    "resource": "string",
    "start": "ISO datetime string",
    "end": "ISO datetime string",
    "purpose": "string",
    "status": "pending",
    "requester": "string",
    "requesterId": "integer"
  }
  ```
- **Error Responses**:
  - `400`: Validation error (missing fields, invalid date/time, weekend booking)
  - `401`: Unauthorized (invalid/missing token)
  - `409`: Conflict (time slot already booked)

#### `GET /api/bookings/my`
- **Description**: Get current user's bookings
- **Auth Required**: Yes (JWT token)
- **Response**: `200 OK` (array of booking objects)

#### `GET /api/bookings/pending`
- **Description**: Get pending booking requests (HOD/Approver only)
- **Auth Required**: Yes (JWT token, hod/approver role)
- **Query Parameters**:
  - `department_id` (optional): Filter by department
- **Response**: `200 OK` (array of pending booking objects)

#### `PATCH /api/bookings/<booking_id>`
- **Description**: Update booking status (approve/reject/cancel)
- **Auth Required**: Yes (JWT token)
- **Request Body**:
  ```json
  {
    "action": "approve|reject|cancel",
    "reason": "string (optional, for reject)"
  }
  ```
- **Response**: `200 OK` (updated booking object)
- **Error Responses**:
  - `401`: Unauthorized
  - `403`: Forbidden (insufficient permissions)
  - `404`: Booking not found

---

### **Health Check Endpoints**

#### `GET /`
- **Description**: API status
- **Response**: `200 OK`
  ```json
  {
    "app": "college-booking",
    "version": "dev",
    "status": "running"
  }
  ```

#### `GET /health`
- **Description**: Health check
- **Response**: `200 OK`
  ```json
  {
    "ok": true
  }
  ```

---

## 🗄️ Database Schema

### **Tables**

#### **users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,           -- Email address
  password TEXT,                   -- Bcrypt hashed password
  role TEXT CHECK(role IN ('student','teacher','hod')),
  name TEXT,
  department TEXT,
  department_id INTEGER
);
```

#### **resources**
```sql
CREATE TABLE resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                       -- 'Seminar Hall', 'Auditorium', 'Lab'
  type TEXT CHECK(type IN ('seminar','auditorium','lab')),
  capacity INTEGER
);
```

#### **departments**
```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
);
```

#### **bookings**
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,                -- Foreign key to users
  resource_id INTEGER,             -- Foreign key to resources
  title TEXT,
  date TEXT,                       -- Format: YYYY-MM-DD
  start_time TEXT,                 -- Format: HH:MM
  end_time TEXT,                   -- Format: HH:MM
  purpose TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected','cancelled','conducted')) DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(resource_id) REFERENCES resources(id)
);
```

---

## 🔄 Data Flow Diagrams

### **Complete Booking Lifecycle**
```
1. User Creates Booking
   ┌─────────────┐
   │   Frontend  │
   └──────┬──────┘
          │ POST /api/bookings
          ↓
   ┌─────────────┐
   │   Backend   │
   └──────┬──────┘
          │ INSERT INTO bookings
          ↓
   ┌─────────────┐
   │  Database   │
   │ status='pending'
   └─────────────┘

2. HOD Reviews Booking
   ┌─────────────┐
   │   Frontend   │
   │ (HOD Dashboard)
   └──────┬───────┘
          │ GET /api/bookings/pending
          ↓
   ┌─────────────┐
   │   Backend   │
   └──────┬──────┘
          │ SELECT * FROM bookings WHERE status='pending'
          ↓
   ┌─────────────┐
   │  Database   │
   └─────────────┘

3. HOD Approves Booking
   ┌─────────────┐
   │   Frontend   │
   └──────┬───────┘
          │ PATCH /api/bookings/<id>
          │ { "action": "approve" }
          ↓
   ┌─────────────┐
   │   Backend   │
   └──────┬──────┘
          │ UPDATE bookings SET status='approved'
          ↓
   ┌─────────────┐
   │  Database   │
   │ status='approved'
   └─────────────┘

4. Calendar Displays Booking
   ┌─────────────┐
   │   Frontend   │
   │   Calendar   │
   └──────┬───────┘
          │ GET /api/calendar/events
          ↓
   ┌─────────────┐
   │   Backend   │
   └──────┬──────┘
          │ SELECT * FROM bookings WHERE status IN ('pending','approved','conducted')
          │ Calculate display_status based on date
          ↓
   ┌─────────────┐
   │  Database   │
   └─────────────┘
```

---

## 🚀 Deployment Architecture

### **Frontend Deployment (Netlify)**
```
GitHub Repository
        ↓
Netlify detects changes
        ↓
Build Process:
  npm install
  npm run build
        ↓
Deploy static files from /build
        ↓
Serve via CDN
        ↓
URL: https://<app-name>.netlify.app
```

**Configuration** (`netlify.toml`):
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables:
  - `REACT_APP_API_URL`: Backend API URL

---

### **Backend Deployment (Render)**
```
GitHub Repository
        ↓
Render detects changes
        ↓
Build Process:
  pip install -r requirements.txt
        ↓
Start Process:
  gunicorn app:app
        ↓
WSGI Server Running
        ↓
URL: https://<app-name>.onrender.com
```

**Configuration**:
- **Runtime**: Python 3.11 (`runtime.txt`)
- **Start Command**: Gunicorn (`Procfile`)
- **Root Directory**: `backend`
- **Environment Variables**:
  - `JWT_SECRET_KEY`: Secret for JWT signing

---

## 🔧 Environment Variables

### **Frontend (.env)**
```env
REACT_APP_API_URL=https://ecom-project-11-1.onrender.com/api
REACT_APP_GOOGLE_API_KEY=<optional>
REACT_APP_GOOGLE_CLIENT_ID=<optional>
```

### **Backend (Render Environment)**
```env
JWT_SECRET_KEY=<secure-random-string>
```

---

## 📊 Request/Response Examples

### **Example 1: Complete Booking Flow**

**1. Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@gmail.com",
  "password": "Student"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Student User",
    "email": "student@gmail.com",
    "role": "student",
    "department": "Computer Science",
    "department_id": 1
  }
}
```

**2. Create Booking**
```http
POST /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Quantum theory lab",
  "resource": "Lab",
  "start": "2024-11-20T12:00:00",
  "end": "2024-11-20T13:00:00",
  "purpose": "lab for students on quantum theory concepts",
  "requester": "Student User",
  "requesterId": 2
}
```

**Response**:
```json
{
  "id": 15,
  "title": "Quantum theory lab",
  "resource": "Lab",
  "start": "2024-11-20T12:00:00",
  "end": "2024-11-20T13:00:00",
  "purpose": "lab for students on quantum theory concepts",
  "status": "pending",
  "requester": "Student User",
  "requesterId": 2
}
```

**3. Get Calendar Events**
```http
GET /api/calendar/events
```

**Response**:
```json
[
  {
    "id": 15,
    "title": "Quantum theory lab",
    "resource": "Lab",
    "start": "2024-11-20T12:00:00",
    "end": "2024-11-20T13:00:00",
    "purpose": "lab for students on quantum theory concepts",
    "status": "pending",
    "display_status": "pending",
    "type": "booking",
    "requester": "Student User",
    "requesterId": 2
  }
]
```

---

## 🎯 Key Features Summary

1. **Role-Based Access Control**
   - Student: Create bookings, view own bookings
   - Teacher: Create bookings, view own bookings
   - HOD: Approve/reject bookings, view all department bookings

2. **Dynamic Status Management**
   - Database stores: pending, approved, rejected, cancelled, conducted
   - Display shows: pending or conducted (based on date)

3. **Weekend Restriction**
   - Bookings blocked on Saturdays and Sundays
   - Frontend and backend validation

4. **Conflict Detection**
   - Prevents overlapping bookings for same resource/date/time

5. **JWT Authentication**
   - Stateless authentication
   - 7-day token expiration
   - Persistent across server restarts

6. **Automatic Data Seeding**
   - Demo users, resources, departments, and bookings
   - Seeded on application startup

---

## 🔍 Error Handling

### **Common Error Responses**

**401 Unauthorized**
```json
{
  "message": "Unauthorized"
}
```
- **Causes**: Missing/invalid JWT token, expired token

**400 Bad Request**
```json
{
  "message": "All fields are required"
}
```
- **Causes**: Missing required fields, invalid date/time format, weekend booking

**409 Conflict**
```json
{
  "message": "Slot already booked or has a conflict"
}
```
- **Causes**: Time slot already booked

**403 Forbidden**
```json
{
  "message": "Forbidden - HOD only"
}
```
- **Causes**: Insufficient permissions for action

---

## 📝 Summary

**Complete Tech Stack**:
- **Frontend**: React + Tailwind CSS + FullCalendar
- **Backend**: Flask + SQLite + Gunicorn
- **Authentication**: JWT (PyJWT)
- **Deployment**: Netlify (frontend) + Render (backend)

**API Architecture**: RESTful API with JWT authentication

**Data Flow**: Frontend → API Service → Backend → Database → Response

**Key Workflows**: Authentication → Booking Creation → Approval → Calendar Display

---

*Last Updated: Based on current project state with JWT authentication*

