const express = require('express');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname, { index: 'home.html' }));

// Database
let db = null;
const DB_PATH = path.join(__dirname, 'pcu_database.sqlite');

async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        status TEXT DEFAULT 'approved',
        department TEXT DEFAULT '',
        specialization TEXT DEFAULT '',
        course TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        course TEXT DEFAULT '',
        year_level TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT NOT NULL,
        specialization TEXT DEFAULT '',
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        professor_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        purpose TEXT DEFAULT '',
        consultation_type TEXT DEFAULT 'other',
        mode TEXT DEFAULT 'face-to-face',
        status TEXT DEFAULT 'confirmed',
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT DEFAULT 'info',
        title TEXT DEFAULT 'Notification',
        message TEXT DEFAULT '',
        professor_id TEXT DEFAULT '',
        professor_name TEXT DEFAULT '',
        timestamp TEXT DEFAULT (datetime('now')),
        read INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS consultation_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id TEXT NOT NULL,
        date TEXT NOT NULL,
        day TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        buffer_time INTEGER DEFAULT 15,
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS id_blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        original_role TEXT DEFAULT '',
        deleted_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    )`);

    // Seed demo data if empty
    const count = db.exec("SELECT COUNT(*) FROM users")[0].values[0][0];
    if (count === 0) {
        seedDemoData();
    }

    saveDatabase();
    console.log('Database initialized.');
}

function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

function seedDemoData() {
    // Admin
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['admin', 'System Administrator', 'admin@pcu.edu.ph', 'admin123', 'admin', 'approved', '', '', '']);

    // Demo students
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['S20230056', 'Ana Marie Reyes', 'a.reyes@pcu.edu.ph', 'student123', 'student', 'approved', 'College of Business Administration and Accountancy', '', 'BS Business Administration']);
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['S20240023', 'Mark Andrew Lim', 'm.lim@pcu.edu.ph', 'student123', 'student', 'approved', 'College of Informatics', '', 'BS Computer Science']);
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['S20250011', 'Jasmine Cruz', 'j.cruz@pcu.edu.ph', 'student123', 'student', 'approved', 'College of Education', '', 'BS Education']);

    // Demo faculty (approved)
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['F001', 'Dr. Ricardo Dela Cruz', 'r.delacruz@pcu.edu.ph', 'faculty123', 'faculty', 'approved', 'College of Business Administration and Accountancy', 'Business Management', '']);
    db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['F002', 'Dr. Carlos Aguilar', 'c.aguilar@pcu.edu.ph', 'faculty123', 'faculty', 'approved', 'College of Informatics', 'Software Engineering', '']);
}

// Helper: run query and return rows
function dbAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

function dbGet(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

// ==================== API ROUTES ====================

// --- Auth ---
app.post('/api/auth/login', (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
        return res.json({ success: false, error: 'Please enter your credentials.' });
    }

    let user = dbGet("SELECT * FROM users WHERE user_id = ? AND password = ?", [userId, password]);

    // If not found and input is 9 digits, try with 'S' prefix
    if (!user && /^[0-9]{9}$/.test(userId)) {
        user = dbGet("SELECT * FROM users WHERE user_id = ? AND password = ?", ['S' + userId, password]);
    }

    if (!user) {
        return res.json({ success: false, error: 'Invalid credentials.' });
    }

    if (user.status === 'pending') {
        return res.json({ success: false, error: 'Your account is pending admin approval.' });
    }

    if (user.status === 'rejected') {
        return res.json({ success: false, error: 'Your account has been rejected.' });
    }

    // Create session
    const sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
    db.run("INSERT INTO sessions (session_id, user_id) VALUES (?, ?)", [sessionId, user.user_id]);
    saveDatabase();

    res.json({
        success: true,
        sessionId: sessionId,
        user: {
            id: user.id, user_id: user.user_id, name: user.name,
            email: user.email, role: user.role, status: user.status,
            department: user.department || '', specialization: user.specialization || '',
            course: user.course || '',
            initials: user.name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase()
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
        db.run("DELETE FROM sessions WHERE session_id = ?", [sessionId]);
        saveDatabase();
    }
    res.json({ success: true });
});

app.get('/api/auth/session/:sessionId', (req, res) => {
    const session = dbGet("SELECT * FROM sessions WHERE session_id = ?", [req.params.sessionId]);
    if (!session) {
        return res.json({ valid: false });
    }

    const user = dbGet("SELECT * FROM users WHERE user_id = ?", [session.user_id]);
    if (!user || user.status !== 'approved') {
        return res.json({ valid: false });
    }

    res.json({
        valid: true,
        user: {
            id: user.id, user_id: user.user_id, name: user.name,
            email: user.email, role: user.role, status: user.status,
            department: user.department || '', specialization: user.specialization || '',
            course: user.course || '',
            initials: user.name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase()
        }
    });
});

// --- Users ---
app.get('/api/users', (req, res) => {
    const users = dbAll("SELECT * FROM users ORDER BY created_at DESC");
    res.json(users);
});

app.get('/api/users/:userId', (req, res) => {
    const user = dbGet("SELECT * FROM users WHERE user_id = ?", [req.params.userId]);
    res.json(user);
});

app.post('/api/users', (req, res) => {
    const { user_id, name, email, password, role, status, department, specialization, course } = req.body;

    // Check blacklist
    const blacklisted = dbGet("SELECT COUNT(*) as count FROM id_blacklist WHERE user_id = ?", [user_id]);
    if (blacklisted && blacklisted.count > 0) {
        return res.json({ success: false, error: 'This ID has been previously deleted and cannot be reused.' });
    }

    // Check existing
    const existing = dbGet("SELECT COUNT(*) as count FROM users WHERE user_id = ?", [user_id]);
    if (existing && existing.count > 0) {
        return res.json({ success: false, error: 'This ID is already registered.' });
    }

    try {
        db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [user_id, name, email, password, role || 'student', status || 'approved', department || '', specialization || '', course || '']);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/users/:userId/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE users SET status = ? WHERE user_id = ?", [status, req.params.userId]);
    saveDatabase();
    res.json({ success: true });
});

app.delete('/api/users/:userId', (req, res) => {
    const user = dbGet("SELECT * FROM users WHERE user_id = ?", [req.params.userId]);
    if (user) {
        db.run("INSERT OR IGNORE INTO id_blacklist (user_id, original_role) VALUES (?, ?)", [user.user_id, user.role]);
    }
    db.run("DELETE FROM users WHERE user_id = ?", [req.params.userId]);
    saveDatabase();
    res.json({ success: true });
});

// --- Blacklist ---
app.get('/api/blacklist', (req, res) => {
    const list = dbAll("SELECT * FROM id_blacklist ORDER BY deleted_at DESC");
    res.json(list);
});

app.get('/api/blacklist/check/:userId', (req, res) => {
    const result = dbGet("SELECT COUNT(*) as count FROM id_blacklist WHERE user_id = ?", [req.params.userId]);
    res.json({ blacklisted: result && result.count > 0 });
});

// --- Faculty ---
const DEPT_COLORS = {
    'College of Arts and Sciences': '#6A1B9A',
    'College of Business Administration and Accountancy': '#1B3A6B',
    'College of Criminal Justice': '#4E342E',
    'College of Education': '#2E7D32',
    'College of Informatics': '#1565C0',
    'College of Hospitality and Tourism Management': '#F57F17',
    'College of Nursing and Health Sciences': '#1A56DB',
    'College of Social Work': '#00796B',
    'College of Law': '#B71C1C',
    'Institute of Philosophy and Religious Studies': '#00695C',
    'Graduate School': '#4A148C'
};

app.get('/api/faculty', (req, res) => {
    const rows = dbAll("SELECT * FROM users WHERE role = 'faculty' AND status = 'approved' ORDER BY name ASC");
    const faculty = rows.map(u => ({
        id: u.user_id,
        name: u.name,
        email: u.email,
        department: u.department || '',
        specialization: u.specialization || '',
        initials: u.name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase(),
        color: DEPT_COLORS[u.department] || '#1B3A6B'
    }));
    res.json(faculty);
});

// --- Consultation Hours ---
app.get('/api/faculty/:facultyId/hours', (req, res) => {
    const hours = dbAll("SELECT * FROM consultation_hours WHERE faculty_id = ? ORDER BY date ASC, start_time ASC", [req.params.facultyId]);
    res.json(hours);
});

app.post('/api/faculty/:facultyId/hours', (req, res) => {
    const { hours, bufferTime } = req.body;
    const facultyId = req.params.facultyId;

    // Delete existing hours for this faculty
    db.run("DELETE FROM consultation_hours WHERE faculty_id = ?", [facultyId]);

    // Insert new hours
    if (hours && Array.isArray(hours)) {
        hours.forEach(h => {
            db.run(
                "INSERT INTO consultation_hours (faculty_id, date, day, start_time, end_time, buffer_time) VALUES (?, ?, ?, ?, ?, ?)",
                [facultyId, h.date, h.day, h.start, h.end, bufferTime || 15]
            );
        });
    }

    saveDatabase();
    res.json({ success: true });
});

app.delete('/api/faculty/:facultyId/hours/:hourId', (req, res) => {
    db.run("DELETE FROM consultation_hours WHERE id = ? AND faculty_id = ?", [req.params.hourId, req.params.facultyId]);
    saveDatabase();
    res.json({ success: true });
});

// --- Bookings ---
app.get('/api/bookings', (req, res) => {
    const bookings = dbAll("SELECT * FROM bookings ORDER BY date DESC, start_time DESC");
    res.json(bookings);
});

app.get('/api/bookings/professor/:profId', (req, res) => {
    const bookings = dbAll("SELECT * FROM bookings WHERE professor_id = ? ORDER BY date DESC, start_time DESC", [req.params.profId]);
    res.json(bookings);
});

app.get('/api/bookings/student/:studentId', (req, res) => {
    const bookings = dbAll("SELECT * FROM bookings WHERE student_id = ? ORDER BY date DESC, start_time DESC", [req.params.studentId]);
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const b = req.body;
    try {
        db.run("INSERT INTO bookings (id, professor_id, student_id, student_name, student_email, date, start_time, end_time, purpose, consultation_type, mode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [b.id, b.professorId, b.studentId, b.studentName, b.studentEmail, b.date, b.startTime, b.endTime, b.purpose || '', b.consultationType || 'other', b.mode || 'face-to-face', b.status || 'confirmed']);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/bookings/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
    saveDatabase();
    res.json({ success: true });
});

// --- Notifications ---
app.get('/api/notifications', (req, res) => {
    const notifs = dbAll("SELECT * FROM notifications ORDER BY timestamp DESC");
    res.json(notifs);
});

app.post('/api/notifications', (req, res) => {
    const n = req.body;
    try {
        db.run("INSERT INTO notifications (id, type, title, message, professor_id, professor_name, timestamp, read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [n.id, n.type || 'info', n.title || 'Notification', n.message || '', n.professorId || '', n.professorName || '', n.timestamp || new Date().toISOString(), n.read ? 1 : 0]);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/notifications/read', (req, res) => {
    db.run("UPDATE notifications SET read = 1");
    saveDatabase();
    res.json({ success: true });
});

// --- Stats ---
app.get('/api/stats', (req, res) => {
    const students = db.exec("SELECT COUNT(*) FROM users WHERE role='student'")[0]?.values[0][0] || 0;
    const faculty = db.exec("SELECT COUNT(*) FROM users WHERE role='faculty'")[0]?.values[0][0] || 0;
    const bookings = db.exec("SELECT COUNT(*) FROM bookings")[0]?.values[0][0] || 0;
    const confirmed = db.exec("SELECT COUNT(*) FROM bookings WHERE status='confirmed'")[0]?.values[0][0] || 0;
    const declined = db.exec("SELECT COUNT(*) FROM bookings WHERE status='declined'")[0]?.values[0][0] || 0;
    const cancelled = db.exec("SELECT COUNT(*) FROM bookings WHERE status='cancelled'")[0]?.values[0][0] || 0;
    res.json({ students, faculty, bookings, confirmed, declined, cancelled });
});

// --- Reset Database (keep Admin, re-seed demo data) ---
app.post('/api/reset', (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not ready.' });

    // Delete all data except admin user
    db.run("DELETE FROM consultation_hours");
    db.run("DELETE FROM bookings");
    db.run("DELETE FROM notifications");
    db.run("DELETE FROM sessions");
    db.run("DELETE FROM id_blacklist");
    db.run("DELETE FROM students");
    db.run("DELETE FROM faculty");
    db.run("DELETE FROM users WHERE user_id != 'admin'");

    // Re-seed demo data
    seedDemoData();
    saveDatabase();

    res.json({ success: true, message: 'Database reset. Demo data restored.' });
});

// Root redirect to home.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Start server
async function start() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`PCU Quick-Book server running at http://localhost:${PORT}`);
    });
}

start();
