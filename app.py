import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Resolve the absolute path to database.db in the workspace directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create database tables and insert seed data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create team_members table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT NOT NULL,
            avatar_color TEXT NOT NULL,
            is_available BOOLEAN NOT NULL DEFAULT 1,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create activity_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER,
            member_name TEXT NOT NULL,
            action TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()

    # Seed data if table is empty
    cursor.execute('SELECT COUNT(*) FROM team_members')
    count = cursor.fetchone()[0]
    if count == 0:
        seed_members = [
            ("Sarah Jenkins", "Lead Frontend Developer", "Engineering", "hsl(14, 88%, 62%)", 1),
            ("Marcus Chen", "Product Designer", "Product & Design", "hsl(168, 76%, 42%)", 1),
            ("Aisha Rahman", "DevOps Engineer", "Engineering", "hsl(283, 62%, 58%)", 0),
            ("David Beck", "QA Lead", "QA", "hsl(43, 96%, 56%)", 1),
            ("Elena Rostova", "Product Manager", "Product & Design", "hsl(204, 76%, 50%)", 0)
        ]
        
        for name, role, dept, color, status in seed_members:
            cursor.execute('''
                INSERT INTO team_members (name, role, department, avatar_color, is_available, last_updated)
                VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
            ''', (name, role, dept, color, status))
            
            # Log initial seeding
            member_id = cursor.lastrowid
            status_text = "Available" if status == 1 else "Unavailable"
            cursor.execute('''
                INSERT INTO activity_logs (member_id, member_name, action, timestamp)
                VALUES (?, ?, ?, datetime('now', 'localtime'))
            ''', (member_id, name, f"initialized as {status_text}"))
            
        conn.commit()
    conn.close()

# Initialize DB on start
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/members', methods=['GET'])
def get_members():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM team_members ORDER BY name ASC')
    rows = cursor.fetchall()
    conn.close()
    
    members = []
    for row in rows:
        members.append({
            'id': row['id'],
            'name': row['name'],
            'role': row['role'],
            'department': row['department'],
            'avatar_color': row['avatar_color'],
            'is_available': bool(row['is_available']),
            'last_updated': row['last_updated']
        })
    return jsonify(members)

@app.route('/api/members', methods=['POST'])
def add_member():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    role = data.get('role', '').strip()
    department = data.get('department', '').strip()
    avatar_color = data.get('avatar_color', '').strip()
    
    if not name or not role or not department:
        return jsonify({'error': 'Name, Role, and Department are required.'}), 400
        
    # Generate random HSL avatar color if not provided
    if not avatar_color:
        import random
        hue = random.randint(0, 360)
        avatar_color = f"hsl({hue}, 70%, 60%)"
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO team_members (name, role, department, avatar_color, is_available, last_updated)
        VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'))
    ''', (name, role, department, avatar_color))
    
    member_id = cursor.lastrowid
    
    # Write to activity log
    cursor.execute('''
        INSERT INTO activity_logs (member_id, member_name, action, timestamp)
        VALUES (?, ?, 'joined the team (Available)', datetime('now', 'localtime'))
    ''', (member_id, name))
    
    conn.commit()
    
    # Fetch the new member record
    cursor.execute('SELECT * FROM team_members WHERE id = ?', (member_id,))
    row = cursor.fetchone()
    conn.close()
    
    new_member = {
        'id': row['id'],
        'name': row['name'],
        'role': row['role'],
        'department': row['department'],
        'avatar_color': row['avatar_color'],
        'is_available': bool(row['is_available']),
        'last_updated': row['last_updated']
    }
    return jsonify(new_member), 201

@app.route('/api/members/<int:member_id>/toggle', methods=['POST'])
def toggle_availability(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if member exists
    cursor.execute('SELECT * FROM team_members WHERE id = ?', (member_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Member not found'}), 404
        
    new_status = 0 if row['is_available'] else 1
    status_text = "Available" if new_status == 1 else "Unavailable"
    
    # Update status
    cursor.execute('''
        UPDATE team_members 
        SET is_available = ?, last_updated = datetime('now', 'localtime')
        WHERE id = ?
    ''', (new_status, member_id))
    
    # Log status change
    cursor.execute('''
        INSERT INTO activity_logs (member_id, member_name, action, timestamp)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
    ''', (member_id, row['name'], f"marked {status_text}"))
    
    conn.commit()
    
    # Fetch updated record
    cursor.execute('SELECT * FROM team_members WHERE id = ?', (member_id,))
    updated_row = cursor.fetchone()
    conn.close()
    
    updated_member = {
        'id': updated_row['id'],
        'name': updated_row['name'],
        'role': updated_row['role'],
        'department': updated_row['department'],
        'avatar_color': updated_row['avatar_color'],
        'is_available': bool(updated_row['is_available']),
        'last_updated': updated_row['last_updated']
    }
    return jsonify(updated_member)

@app.route('/api/logs', methods=['GET'])
def get_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 15')
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for row in rows:
        logs.append({
            'id': row['id'],
            'member_id': row['member_id'],
            'member_name': row['member_name'],
            'action': row['action'],
            'timestamp': row['timestamp']
        })
    return jsonify(logs)

if __name__ == '__main__':
    # Determine port
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
