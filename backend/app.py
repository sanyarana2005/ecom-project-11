
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import logging
import hashlib
import secrets
import bcrypt
import jwt

# ---------------- Configuration ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = "college_booking.db"
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

app = Flask(__name__)
# CORS configuration for deployment - allow all origins
CORS(app, resources={r"/api/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO)

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-12345')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

@app.route("/", methods=["GET"])
def index():
    return jsonify({"app": "college-booking", "version": "dev", "status": "running"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

# ---------------- Helpers ----------------
def db_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def time_ok(t):
    try:
        datetime.strptime(t, "%H:%M")
        return True
    except:
        return False

def date_ok(d):
    try:
        datetime.strptime(d, "%Y-%m-%d")
        return True
    except:
        return False

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    # PyJWT 2.x returns a string, not bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token

def get_user_from_token():
    """Extract user from Authorization header using JWT"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.replace('Bearer ', '').strip()
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        if not user_id:
            return None
        
        # Get user from database
        conn = db_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, username, role, name, department, department_id FROM users WHERE id=?", (user_id,))
        row = cur.fetchone()
        conn.close()
        
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "role": row[2],
                "name": row[3] if row[3] else row[1],
                "department": row[4] if row[4] else "Computer Science",
                "department_id": row[5] if row[5] else 1
            }
        return None
    except jwt.ExpiredSignatureError:
        logging.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logging.warning("Invalid token")
        return None
    except Exception as e:
        logging.error(f"Error decoding token: {str(e)}")
        return None

def require_auth():
    """Middleware to require authentication"""
    user = get_user_from_token()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    return user

def require_hod():
    """Middleware to require HOD role"""
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    if user.get("role") != "hod":
        return jsonify({"message": "Forbidden - HOD only"}), 403
    return user

# ---------------- Init & Seed ----------------
def init_db():
    """Create tables and seed demo users/resources if missing."""
    try:
        logging.info("Initializing DB at %s", DB_PATH)
        conn = db_conn()
        cur = conn.cursor()
    except Exception as e:
        logging.error(f"Failed to connect to database: {str(e)}")
        raise

    try:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT CHECK(role IN ('student','teacher','hod')),
            name TEXT,
            department TEXT,
            department_id INTEGER
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT CHECK(type IN ('seminar','auditorium','lab')),
            capacity INTEGER
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            resource_id INTEGER,
            title TEXT,
            date TEXT,
            start_time TEXT,
            end_time TEXT,
            purpose TEXT,
            status TEXT CHECK(status IN ('pending','approved','rejected','cancelled','conducted')) DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(resource_id) REFERENCES resources(id)
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )
        """)

        # Seed users - check if each user exists, if not add them
        logging.info("Seeding users...")
        demo_users = [
            ("student@college.edu", "student123", "student", "John Student", "Computer Science", 1),
            ("student@gmail.com", "Student", "student", "Student User", "Computer Science", 1),
            ("teacher@college.edu", "teacher123", "teacher", "Dr. Jane Teacher", "Computer Science", 1),
            ("teacher@gmail.com", "Teacher", "teacher", "Teacher User", "Computer Science", 1),
            ("hod@college.edu", "hod123", "hod", "Prof. Smith HOD", "Computer Science", 1),
            ("hod@gmail.com", "hod", "hod", "HOD User", "Computer Science", 1),
        ]
        
        for email, password, role, name, department, dept_id in demo_users:
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE username = ?", (email.lower(),))
            if not cur.fetchone():
                # User doesn't exist, create them
                hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                try:
                    cur.execute(
                        "INSERT INTO users (username, password, role, name, department, department_id) VALUES (?, ?, ?, ?, ?, ?)",
                        (email.lower(), hashed_pwd, role, name, department, dept_id)
                    )
                    logging.info(f"Created user: {email.lower()}")
                except Exception as e:
                    logging.warning(f"Failed to create user {email.lower()}: {str(e)}")

        # Seed resources
        cur.execute("SELECT COUNT(*) FROM resources")
        if cur.fetchone()[0] == 0:
            logging.info("Seeding resources...")
            cur.executemany(
                "INSERT INTO resources (name, type, capacity) VALUES (?, ?, ?)",
                [
                    ("Seminar Hall", "seminar", 100),
                    ("Auditorium", "auditorium", 500),
                    ("Lab", "lab", 30),
                ],
            )

        # Seed departments
        cur.execute("SELECT COUNT(*) FROM departments")
        if cur.fetchone()[0] == 0:
            logging.info("Seeding departments...")
            cur.executemany(
                "INSERT INTO departments (name) VALUES (?)",
                [
                    ("Computer Science",),
                    ("Electronics",),
                    ("Mechanical",),
                ],
            )

        conn.commit()
        
        # Seed demo bookings - always ensure demo users have bookings
        # First, delete any existing bookings for demo users to avoid duplicates
        cur.execute("""
            DELETE FROM bookings 
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username IN ('student@gmail.com', 'teacher@gmail.com', 'hod@gmail.com')
            )
        """)
        deleted_count = cur.rowcount
        if deleted_count > 0:
            logging.info(f"Cleaned up {deleted_count} existing demo bookings")
        
        # Now seed fresh demo bookings
        logging.info("Seeding demo bookings...")
        _seed_demo_bookings(cur)
        conn.commit()
        
        conn.close()
        logging.info("DB initialization complete.")
    except Exception as e:
        logging.error(f"Error during DB initialization: {str(e)}")
        if 'conn' in locals():
            conn.close()
        raise

def _seed_demo_bookings(cur):
    """Seed demo bookings for student@gmail.com, teacher@gmail.com, and hod@gmail.com"""
    try:
        # Get specific user IDs by email
        cur.execute("SELECT id FROM users WHERE username = 'student@gmail.com'")
        student_result = cur.fetchone()
        student_id = student_result[0] if student_result else None
        
        cur.execute("SELECT id FROM users WHERE username = 'teacher@gmail.com'")
        teacher_result = cur.fetchone()
        teacher_id = teacher_result[0] if teacher_result else None
        
        cur.execute("SELECT id FROM users WHERE username = 'hod@gmail.com'")
        hod_result = cur.fetchone()
        hod_id = hod_result[0] if hod_result else None
        
        if not student_id or not teacher_id or not hod_id:
            logging.warning("Demo users not found, skipping booking seed")
            return
        
        # Get resource IDs
        cur.execute("SELECT id, name FROM resources ORDER BY id")
        resources = cur.fetchall()
        resource_map = {name: id for id, name in resources}
        
        if not resource_map:
            logging.warning("Resources not found, skipping booking seed")
            return
        
        today = datetime.now()
        
        # Helper function to get next weekday (skip weekends)
        def get_next_weekday(start_date, days_ahead):
            target_date = start_date + timedelta(days=days_ahead)
            # If it's Saturday (5) or Sunday (6), move to Monday
            while target_date.weekday() >= 5:  # Saturday=5, Sunday=6
                target_date += timedelta(days=1)
            return target_date
        
        # Helper function to get previous weekday (skip weekends)
        def get_previous_weekday(start_date, days_back):
            target_date = start_date - timedelta(days=days_back)
            # If it's Saturday (5) or Sunday (6), move to Friday
            while target_date.weekday() >= 5:  # Saturday=5, Sunday=6
                target_date -= timedelta(days=1)
            return target_date
        
        # Demo bookings - ensure no bookings on weekends
        demo_bookings = [
            # Student bookings (3 bookings - different from teacher)
            (student_id, resource_map.get('Lab', 3), "Machine Learning Workshop",
             get_next_weekday(today, 6).strftime("%Y-%m-%d"), "10:00", "12:00",
             "Hands-on workshop on neural networks and deep learning", "pending"),
            (student_id, resource_map.get('Seminar Hall', 1), "Project Presentation",
             get_next_weekday(today, 7).strftime("%Y-%m-%d"), "14:00", "16:00",
             "Final year project presentation and demonstration", "pending"),
            (student_id, resource_map.get('Auditorium', 2), "Project Demo Day",
             get_next_weekday(today, 9).strftime("%Y-%m-%d"), "14:00", "16:00",
             "Demonstrating final year projects to faculty and peers", "pending"),
            # Teacher bookings (only 2: one conducted, one pending)
            (teacher_id, resource_map.get('Auditorium', 2), "Faculty Development Session",
             get_previous_weekday(today, 8).strftime("%Y-%m-%d"), "14:00", "16:00",
             "Training session on modern teaching methodologies", "conducted"),
            (teacher_id, resource_map.get('Seminar Hall', 1), "Research Presentation",
             get_next_weekday(today, 3).strftime("%Y-%m-%d"), "10:00", "12:00",
             "Presenting research findings to department", "pending"),
            # HOD bookings
            (hod_id, resource_map.get('Auditorium', 2), "Department Annual Meeting",
             get_previous_weekday(today, 5).strftime("%Y-%m-%d"), "10:00", "12:00",
             "Annual department meeting to discuss achievements and plans", "conducted"),
            (hod_id, resource_map.get('Seminar Hall', 1), "Industry Collaboration Workshop",
             get_next_weekday(today, 10).strftime("%Y-%m-%d"), "09:00", "11:00",
             "Workshop on industry-academia collaboration", "pending"),
        ]
        
        cur.executemany("""
            INSERT INTO bookings (user_id, resource_id, title, date, start_time, end_time, purpose, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_bookings)
        
        # Verify bookings were created
        cur.execute("SELECT COUNT(*) FROM bookings WHERE user_id IN (?, ?, ?)", (student_id, teacher_id, hod_id))
        created_count = cur.fetchone()[0]
        
        logging.info(f"Seeded {len(demo_bookings)} demo bookings")
        logging.info(f"Verified: {created_count} bookings exist for demo users")
        logging.info(f"Student ID: {student_id}, Teacher ID: {teacher_id}, HOD ID: {hod_id}")
    except Exception as e:
        logging.warning(f"Failed to seed demo bookings: {str(e)}")

# ---------------- Overlap check ----------------
def has_overlap(cur, resource_id, date, start_time, end_time, ignore_booking_id=None):
    """Check for overlapping bookings"""
    q = """
        SELECT id FROM bookings
        WHERE resource_id=? AND date=?
          AND status IN ('pending','approved')
          AND (? < end_time) AND (? > start_time)
    """
    params = [resource_id, date, start_time, end_time]
    if ignore_booking_id:
        q += " AND id<>?"
        params.append(ignore_booking_id)
    cur.execute(q, params)
    return cur.fetchone() is not None

# ---------------- API Routes ----------------

# Authentication
@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
    except:
        return jsonify({"message": "Invalid JSON"}), 400
    
    email = data.get("email", "").strip().lower()  # Normalize email to lowercase
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    try:
        conn = db_conn()
        cur = conn.cursor()
        
        # Check database for user
        cur.execute("SELECT id, username, password, role, name, department, department_id FROM users WHERE username = ?", (email,))
        user_row = cur.fetchone()
        
        if not user_row:
            conn.close()
            return jsonify({"message": "Invalid credentials"}), 401
        
        user_id, username, hashed_password, role, name, department, department_id = user_row
        
        # Verify password
        # Check if password is hashed (starts with $2b$) or plain text (for migration)
        password_valid = False
        if hashed_password and hashed_password.startswith('$2b$'):
            # Password is hashed, verify using bcrypt
            try:
                password_valid = bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
            except Exception as e:
                logging.error(f"Bcrypt check error: {str(e)}")
                password_valid = False
        else:
            # Plain text password (for existing users - migrate on first login)
            if password == hashed_password:
                password_valid = True
                # Hash the password and update database
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                cur.execute("UPDATE users SET password = ? WHERE id = ?", (hashed, user_id))
                conn.commit()
        
        if not password_valid:
            conn.close()
            logging.warning(f"Login failed for user: {email}")
            return jsonify({"message": "Invalid credentials"}), 401
        
        conn.close()
        
        # Generate JWT token
        token = generate_token(user_id)
        
        # Return response matching frontend format
        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "name": name or username,
                "email": email,
                "role": role,
                "department": department or "Computer Science",
                "department_id": department_id or 1
            }
        })
    except Exception as db_error:
        logging.error(f"Database query error: {str(db_error)}")
        logging.error(f"Error type: {type(db_error).__name__}")
        logging.error(f"Error details: {str(db_error)}")
        # Try to initialize database if connection fails
        try:
            logging.info("Attempting to reinitialize database...")
            init_db()
            conn = db_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, username, password, role, name, department, department_id FROM users WHERE username = ?", (email,))
            user_row = cur.fetchone()
            if not user_row:
                if 'conn' in locals():
                    conn.close()
                return jsonify({"message": "Invalid credentials"}), 401
            user_id, username, hashed_password, role, name, department, department_id = user_row
            
            # Verify password
            password_valid = False
            if hashed_password and hashed_password.startswith('$2b$'):
                try:
                    password_valid = bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
                except Exception as e:
                    logging.error(f"Bcrypt check error: {str(e)}")
                    password_valid = False
            else:
                if password == hashed_password:
                    password_valid = True
                    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    cur.execute("UPDATE users SET password = ? WHERE id = ?", (hashed, user_id))
                    conn.commit()
            
            if not password_valid:
                conn.close()
                return jsonify({"message": "Invalid credentials"}), 401
            
            conn.close()
            # Generate JWT token
            token = generate_token(user_id)
            return jsonify({
                "token": token,
                "user": {
                    "id": user_id,
                    "name": name or username,
                    "email": email,
                    "role": role,
                    "department": department or "Computer Science",
                    "department_id": department_id or 1
                }
            })
        except Exception as init_error:
            logging.error(f"Database initialization failed: {str(init_error)}")
            logging.error(f"Init error type: {type(init_error).__name__}")
            if 'conn' in locals():
                try:
                    conn.close()
                except:
                    pass
            return jsonify({"message": f"Database error: {str(init_error)}"}), 500
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        if 'conn' in locals():
            try:
                conn.close()
            except:
                pass
        return jsonify({"message": "Internal server error"}), 500

@app.route("/api/auth/me", methods=["GET"])
def get_current_user():
    """Get current user from token"""
    user = get_user_from_token()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, role, name, department, department_id FROM users WHERE id=?", (user["id"],))
    row = cur.fetchone()
    conn.close()
    
    if row:
        return jsonify({
            "user": {
                "id": row[0],
                "email": row[1],
                "role": row[2],
                "name": row[3],
                "department": row[4],
                "department_id": row[5]
            }
        })
    
    return jsonify({"message": "User not found"}), 404

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    """Register a new user"""
    try:
        data = request.get_json(force=True)
    except:
        return jsonify({"message": "Invalid JSON"}), 400
    
    email = data.get("email", "").strip().lower()  # Normalize email to lowercase
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    role = data.get("role", "").strip().lower()
    department = data.get("department", "Computer Science").strip()
    department_id = data.get("department_id", 1)

    # Validation
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400
    
    if role not in ["student", "teacher", "hod"]:
        return jsonify({"message": "Invalid role. Must be student, teacher, or hod"}), 400
    
    if not name:
        name = email.split("@")[0]  # Use email prefix as default name

    conn = db_conn()
    cur = conn.cursor()
    
    # Check if user already exists
    cur.execute("SELECT id FROM users WHERE username = ?", (email,))
    if cur.fetchone():
        conn.close()
        return jsonify({"message": "User with this email already exists"}), 409
    
    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Insert new user
    try:
        cur.execute("""
            INSERT INTO users (username, password, role, name, department, department_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (email, hashed_password, role, name, department, department_id))
        conn.commit()
        user_id = cur.lastrowid
        conn.close()
        
        # Generate JWT token and return user
        token = generate_token(user_id)
        
        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role,
                "department": department,
                "department_id": department_id
            },
            "message": "Account created successfully"
        }), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        logging.error(f"Error creating user: {str(e)}")
        return jsonify({"message": "Failed to create account"}), 500

# Resources
@app.route("/api/resources", methods=["GET"])
def list_resources():
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, capacity FROM resources ORDER BY id")
    rows = cur.fetchall()
    conn.close()
    resources = [{"id": r[0], "name": r[1], "capacity": r[2]} for r in rows]
    return jsonify(resources)

# Departments
@app.route("/api/departments", methods=["GET"])
def list_departments():
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM departments ORDER BY id")
    rows = cur.fetchall()
    conn.close()
    departments = [{"id": r[0], "name": r[1]} for r in rows]
    return jsonify(departments)

# Calendar Events
@app.route("/api/calendar/events", methods=["GET"])
def get_calendar_events():
    """Get calendar events - matches frontend format"""
    resource_id = request.args.get("resource_id", type=int)
    
    conn = db_conn()
    cur = conn.cursor()
    
    # Get today's date for status determination
    today = datetime.now().date()
    
    if resource_id:
        # Get events for specific resource - show all events (pending, conducted, approved)
        cur.execute("""
            SELECT b.id, b.title, r.name, b.date, b.start_time, b.end_time, 
                   b.purpose, b.status, u.name, b.user_id
            FROM bookings b
            JOIN resources r ON r.id = b.resource_id
            LEFT JOIN users u ON u.id = b.user_id
            WHERE b.resource_id = ? AND b.status IN ('pending', 'conducted', 'approved')
            ORDER BY b.date, b.start_time
        """, (resource_id,))
    else:
        # Get all events - show all events (pending, conducted, approved)
        cur.execute("""
            SELECT b.id, b.title, r.name, b.date, b.start_time, b.end_time, 
                   b.purpose, b.status, u.name, b.user_id
            FROM bookings b
            JOIN resources r ON r.id = b.resource_id
            LEFT JOIN users u ON u.id = b.user_id
            WHERE b.status IN ('pending', 'conducted', 'approved')
            ORDER BY b.date, b.start_time
        """)
    
    rows = cur.fetchall()
    conn.close()
    
    events = []
    for row in rows:
        booking_id, title, resource_name, date, start_time, end_time, purpose, status, requester_name, requester_id = row
        # Format datetime strings
        start_datetime = f"{date}T{start_time}:00"
        end_datetime = f"{date}T{end_time}:00"
        
        # Determine display status based on date
        booking_date = datetime.strptime(date, "%Y-%m-%d").date()
        if booking_date < today:
            display_status = 'conducted'
        else:
            display_status = 'pending'
        
        events.append({
            "id": booking_id,
            "title": title,
            "resource": resource_name,
            "start": start_datetime,
            "end": end_datetime,
            "purpose": purpose,
            "status": display_status,  # Use computed status based on date
            "type": "booking",
            "requester": requester_name or "Unknown",
            "requesterId": requester_id or 0
        })
    
    return jsonify(events)

# Bookings
@app.route("/api/bookings", methods=["POST"])
def create_booking():
    """Create booking - matches frontend format"""
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user
    
    data = request.get_json(force=True)
    title = (data.get("title") or "").strip()
    resource = (data.get("resource") or "").strip()
    start = data.get("start", "").strip()  # ISO format: "2024-01-15T10:00:00"
    end = data.get("end", "").strip()  # ISO format: "2024-01-15T12:00:00"
    purpose = (data.get("purpose") or "").strip()
    requester = data.get("requester", "").strip()
    requesterId = data.get("requesterId")

    # Parse ISO datetime strings
    try:
        start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
        date = start_dt.strftime("%Y-%m-%d")
        start_time = start_dt.strftime("%H:%M")
        end_time = end_dt.strftime("%H:%M")
    except Exception as e:
        return jsonify({"message": f"Invalid date/time format: {str(e)}"}), 400

    # Validate required fields
    if not all([title, resource, date, start_time, end_time, purpose]):
        return jsonify({"message": "All fields are required"}), 400

    if start_time >= end_time:
        return jsonify({"message": "End time must be after start time"}), 400

    # Check if date is in the past
    if datetime.strptime(date, "%Y-%m-%d") < datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
        return jsonify({"message": "Cannot book resources for past dates"}), 400

    # Check if date is Saturday (5) or Sunday (6)
    booking_date = datetime.strptime(date, "%Y-%m-%d")
    weekday = booking_date.weekday()  # Monday=0, Sunday=6
    if weekday == 5:  # Saturday
        return jsonify({"message": "Bookings are not allowed on Saturdays"}), 400
    if weekday == 6:  # Sunday
        return jsonify({"message": "Bookings are not allowed on Sundays"}), 400

    conn = db_conn()
    cur = conn.cursor()

    try:
        # Get resource_id from resource name
        cur.execute("SELECT id FROM resources WHERE name = ?", (resource,))
        resource_result = cur.fetchone()
        if not resource_result:
            return jsonify({"message": "Invalid resource"}), 400
        resource_id = resource_result[0]

        # Use authenticated user_id
        user_id = user["id"]

        # Check for overlaps
        if has_overlap(cur, resource_id, date, start_time, end_time):
            return jsonify({"message": "Slot already booked or has a conflict"}), 409

        # Insert the booking
        cur.execute("""
            INSERT INTO bookings (user_id, resource_id, title, date, start_time, end_time, purpose, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (user_id, resource_id, title, date, start_time, end_time, purpose))
        
        booking_id = cur.lastrowid
        conn.commit()

        # Return response matching frontend format
        return jsonify({
            "id": booking_id,
            "title": title,
            "resource": resource,
            "start": start,
            "end": end,
            "purpose": purpose,
            "status": "pending",
            "requester": requester or user.get("name", "Unknown"),
            "requesterId": requesterId or user_id
        }), 201

    except Exception as e:
        conn.rollback()
        logging.error(f"Error creating booking: {str(e)}")
        return jsonify({"message": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/bookings/my", methods=["GET"])
def my_bookings():
    """Get current user's bookings - matches frontend format"""
    user = require_auth()
    if isinstance(user, tuple):  # Error response
        return user

    conn = db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT b.id, b.title, r.name, b.date, b.start_time, b.end_time, 
               b.purpose, b.status, u.name, b.user_id
        FROM bookings b
        JOIN resources r ON r.id = b.resource_id
        LEFT JOIN users u ON u.id = b.user_id
        WHERE b.user_id = ?
        ORDER BY b.date DESC, b.start_time DESC
    """, (user["id"],))
    rows = cur.fetchall()
    conn.close()

    bookings = []
    for row in rows:
        booking_id, title, resource_name, date, start_time, end_time, purpose, status, requester_name, requester_id = row
        start_datetime = f"{date}T{start_time}:00"
        end_datetime = f"{date}T{end_time}:00"
        
        bookings.append({
            "id": booking_id,
            "title": title,
            "resource": resource_name,
            "start": start_datetime,
            "end": end_datetime,
            "purpose": purpose,
            "status": status,
            "requester": requester_name or "Unknown",
            "requesterId": requester_id or 0
        })

    return jsonify(bookings)

@app.route("/api/bookings/pending", methods=["GET"])
def pending_bookings():
    """Get pending bookings for HOD - matches frontend format"""
    user = require_hod()
    if isinstance(user, tuple):  # Error response
        return user

    department_id = request.args.get("department_id", type=int)

    conn = db_conn()
    cur = conn.cursor()
    
    if department_id:
        cur.execute("""
            SELECT b.id, b.title, r.name, b.date, b.start_time, b.end_time, 
                   b.purpose, b.status, u.name, b.user_id, b.created_at
            FROM bookings b
            JOIN resources r ON r.id = b.resource_id
            JOIN users u ON u.id = b.user_id
            WHERE b.status = 'pending' AND u.department_id = ?
            ORDER BY b.created_at DESC
        """, (department_id,))
    else:
        cur.execute("""
            SELECT b.id, b.title, r.name, b.date, b.start_time, b.end_time, 
                   b.purpose, b.status, u.name, b.user_id, b.created_at
            FROM bookings b
            JOIN resources r ON r.id = b.resource_id
            JOIN users u ON u.id = b.user_id
            WHERE b.status = 'pending'
            ORDER BY b.created_at DESC
        """)
    
    rows = cur.fetchall()
    conn.close()

    pending_requests = []
    for row in rows:
        booking_id, title, resource_name, date, start_time, end_time, purpose, status, requester_name, requester_id, created_at = row
        start_datetime = f"{date}T{start_time}:00"
        end_datetime = f"{date}T{end_time}:00"
        
        pending_requests.append({
            "id": booking_id,
            "title": title,
            "resource": resource_name,
            "start": start_datetime,
            "end": end_datetime,
            "purpose": purpose,
            "status": status,
            "requesterName": requester_name or "Unknown",
            "requesterId": requester_id or 0,
            "createdAt": created_at or datetime.now().isoformat()
        })

    return jsonify(pending_requests)

@app.route("/api/bookings/<int:booking_id>", methods=["PATCH"])
def update_booking(booking_id):
    """Approve, reject, or cancel booking - matches frontend format"""
    data = request.get_json(force=True)
    action = data.get("action", "").strip().lower()

    conn = db_conn()
    cur = conn.cursor()

    # Get booking details and user_id
    cur.execute("""
        SELECT resource_id, date, start_time, end_time, status, user_id 
        FROM bookings 
        WHERE id = ?
    """, (booking_id,))
    row = cur.fetchone()

    if not row:
        conn.close()
        return jsonify({"message": "Booking not found"}), 404

    resource_id, date, start_time, end_time, current_status, booking_user_id = row

    # Handle cancel action - user can cancel their own bookings
    if action == "cancel":
        # Check if user is authorized (either HOD or booking owner)
        user_data = get_user_from_token()
        if not user_data:
            conn.close()
            return jsonify({"message": "Unauthorized"}), 401
        
        # Get user details from database
        cur.execute("SELECT id, role FROM users WHERE id = ?", (user_data["id"],))
        user_row = cur.fetchone()
        if not user_row:
            conn.close()
            return jsonify({"message": "User not found"}), 404
        
        user_id, user_role = user_row
        
        # Allow cancellation if user is the owner or HOD
        if user_id != booking_user_id and user_role != "hod":
            conn.close()
            return jsonify({"message": "Unauthorized"}), 403

        if current_status == "cancelled":
            conn.close()
            return jsonify({"message": "Booking already cancelled"}), 400

        cur.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))
        new_status = "cancelled"
        conn.commit()
        conn.close()
        return jsonify({
            "id": booking_id,
            "status": new_status,
            "action": action
        })

    # For approve/reject, require HOD
    user = require_hod()
    if isinstance(user, tuple):  # Error response
        conn.close()
        return user

    if action not in ["approve", "reject"]:
        conn.close()
        return jsonify({"message": "Action must be 'approve', 'reject', or 'cancel'"}), 400

    if current_status in ("approved", "rejected", "cancelled"):
        conn.close()
        return jsonify({"message": f"Booking already {current_status}"}), 400

    if action == "approve":
        # Check for conflicts before approving
        if has_overlap(cur, resource_id, date, start_time, end_time, ignore_booking_id=booking_id):
            conn.close()
            return jsonify({"message": "Conflict detected; cannot approve"}), 409

        cur.execute("UPDATE bookings SET status = 'approved' WHERE id = ?", (booking_id,))
        new_status = "approved"
    else:  # reject
        reason = data.get("reason", "")
        cur.execute("UPDATE bookings SET status = 'rejected' WHERE id = ?", (booking_id,))
        new_status = "rejected"

    conn.commit()
    conn.close()

    # Return response matching frontend format
    return jsonify({
        "id": booking_id,
        "status": new_status,
        "action": action
    })

# ---------------- Initialize Database on App Start ----------------
# Initialize database when app is imported (works with both dev server and gunicorn)
try:
    init_db()
except Exception as e:
    logging.error(f"Failed to initialize database: {str(e)}")
    # Don't raise - let the app start and handle errors in routes

# ---------------- Main ----------------
if __name__ == "__main__":
    # Get port from environment variable (for deployment) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Run dev server (using port 8000 to avoid conflict with macOS AirPlay)
    # In production, use gunicorn: gunicorn app:app --config gunicorn_config.py
    app.run(host="0.0.0.0", port=port, debug=False)

