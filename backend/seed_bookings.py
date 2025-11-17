#!/usr/bin/env python3
"""
Seed script to populate bookings in the database
Run this after deployment to add demo bookings
"""
import sqlite3
import os
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "college_booking.db")

def seed_bookings():
    """Add demo bookings to the database"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
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
        print("❌ Required users not found! Please run the app first to create users.")
        print(f"   student@gmail.com: {'Found' if student_id else 'Missing'}")
        print(f"   teacher@gmail.com: {'Found' if teacher_id else 'Missing'}")
        print(f"   hod@gmail.com: {'Found' if hod_id else 'Missing'}")
        conn.close()
        return
    
    # Get resource IDs
    cur.execute("SELECT id, name FROM resources ORDER BY id")
    resources = cur.fetchall()
    resource_map = {name: id for id, name in resources}
    
    if not resource_map:
        print("❌ No resources found! Please run the app first to create resources.")
        conn.close()
        return
    
    # Get today's date
    today = datetime.now()
    
    # Check if bookings already exist
    cur.execute("SELECT COUNT(*) FROM bookings")
    existing_count = cur.fetchone()[0]
    
    if existing_count > 0:
        print(f"⚠️  Found {existing_count} existing bookings.")
        print("   Skipping seed to avoid duplicates.")
        conn.close()
        return
    
    # Demo bookings to add - targeting specific users
    demo_bookings = [
        # Student bookings (student@gmail.com)
        {
            "user_id": student_id,
            "resource_id": resource_map.get('Lab', 3),
            "title": "Machine Learning Workshop",
            "date": (today + timedelta(days=6)).strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_time": "12:00",
            "purpose": "Hands-on workshop on neural networks and deep learning",
            "status": "pending"
        },
        {
            "user_id": student_id,
            "resource_id": resource_map.get('Seminar Hall', 1),
            "title": "Project Presentation",
            "date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "purpose": "Final year project presentation and demonstration",
            "status": "pending"
        },
        {
            "user_id": student_id,
            "resource_id": resource_map.get('Seminar Hall', 1),
            "title": "Project Demo Day",
            "date": (today + timedelta(days=9)).strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "purpose": "Demonstrating final year projects to faculty and peers",
            "status": "pending"
        },
        # Teacher bookings (teacher@gmail.com)
        {
            "user_id": teacher_id,
            "resource_id": resource_map.get('Auditorium', 2),
            "title": "Faculty Development Session",
            "date": (today - timedelta(days=8)).strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "purpose": "Training session on modern teaching methodologies",
            "status": "conducted"
        },
        {
            "user_id": teacher_id,
            "resource_id": resource_map.get('Seminar Hall', 1),
            "title": "Research Presentation",
            "date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_time": "12:00",
            "purpose": "Presenting research findings to department",
            "status": "pending"
        },
        {
            "user_id": teacher_id,
            "resource_id": resource_map.get('Lab', 3),
            "title": "Programming Workshop",
            "date": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
            "start_time": "13:00",
            "end_time": "15:00",
            "purpose": "Teaching advanced programming concepts",
            "status": "pending"
        },
        {
            "user_id": teacher_id,
            "resource_id": resource_map.get('Seminar Hall', 1),
            "title": "Curriculum Review Meeting",
            "date": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
            "start_time": "11:00",
            "end_time": "13:00",
            "purpose": "Reviewing and updating course curriculum",
            "status": "pending"
        },
        # HOD bookings (hod@gmail.com)
        {
            "user_id": hod_id,
            "resource_id": resource_map.get('Auditorium', 2),
            "title": "Department Annual Meeting",
            "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_time": "12:00",
            "purpose": "Annual department meeting to discuss achievements and plans",
            "status": "conducted"
        },
        {
            "user_id": hod_id,
            "resource_id": resource_map.get('Seminar Hall', 1),
            "title": "Industry Collaboration Workshop",
            "date": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
            "start_time": "09:00",
            "end_time": "11:00",
            "purpose": "Workshop on industry-academia collaboration",
            "status": "pending"
        },
    ]
    
    # Insert bookings
    added = 0
    for booking in demo_bookings:
        try:
            cur.execute("""
                INSERT INTO bookings (user_id, resource_id, title, date, start_time, end_time, purpose, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                booking["user_id"],
                booking["resource_id"],
                booking["title"],
                booking["date"],
                booking["start_time"],
                booking["end_time"],
                booking["purpose"],
                booking["status"]
            ))
            added += 1
        except sqlite3.IntegrityError as e:
            print(f"⚠️  Skipped duplicate booking: {booking['title']} on {booking['date']}")
        except Exception as e:
            print(f"❌ Error adding booking {booking['title']}: {str(e)}")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Successfully added {added} demo bookings!")
    print("\n📅 Bookings added:")
    print(f"   - Student (student@gmail.com): 3 bookings (all pending)")
    print(f"   - Teacher (teacher@gmail.com): 4 bookings (1 conducted, 3 pending)")
    print(f"   - HOD (hod@gmail.com): 2 bookings (1 conducted, 1 pending)")
    print("\n💡 These bookings will appear:")
    print("   - In the calendar view for all users")
    print("   - In 'My Bookings' for respective users")
    print("   - As pending requests on the HOD dashboard")

if __name__ == "__main__":
    seed_bookings()

