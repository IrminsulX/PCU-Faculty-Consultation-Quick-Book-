/* ============================================
   PCU Quick-Book — SQLite Database Layer
   Students & Faculty tables using sql.js
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU || {};

  // ─── Database State ──────────────────────────────
  PCU.db = null;
  PCU.dbReady = false;

  // ─── Initialize SQLite Database ──────────────────
  PCU.initDatabase = async function () {
    if (PCU.dbReady) return PCU.db;

    try {
      // Load sql.js from CDN
      if (typeof window.initSqlJs === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
      }

      var SQL = await window.initSqlJs({
        locateFile: function (file) {
          return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/' + file;
        }
      });

      // Try to load existing database from localStorage
      var savedDb = localStorage.getItem('pcu_sqlite_db');
      if (savedDb) {
        var buf = new Uint8Array(JSON.parse(savedDb));
        PCU.db = new SQL.Database(buf);
      } else {
        PCU.db = new SQL.Database();
      }

      // Create tables
      PCU.db.run(`
        CREATE TABLE IF NOT EXISTS users (
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
        )
      `);

      PCU.db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          course TEXT DEFAULT '',
          year_level TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      PCU.db.run(`
        CREATE TABLE IF NOT EXISTS faculty (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          faculty_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          department TEXT NOT NULL,
          specialization TEXT DEFAULT '',
          password TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      PCU.db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
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
        )
      `);

      PCU.db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT DEFAULT 'info',
          title TEXT DEFAULT 'Notification',
          message TEXT DEFAULT '',
          professor_id TEXT DEFAULT '',
          professor_name TEXT DEFAULT '',
          timestamp TEXT DEFAULT (datetime('now')),
          read INTEGER DEFAULT 0
        )
      `);

      // Seed demo admin account
      var userCount = PCU.db.exec("SELECT COUNT(*) FROM users")[0].values[0][0];
      if (userCount === 0) {
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['admin', 'System Administrator', 'admin@pcu.edu.ph', 'admin123', 'admin', 'approved', '', '', '']);
        // Seed demo students
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['S2023005678', 'Ana Marie Reyes', 'a.reyes@pcu.edu.ph', 'student123', 'student', 'approved', '', '', 'BS Business Administration']);
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['S2024002345', 'Mark Andrew Lim', 'm.lim@pcu.edu.ph', 'student123', 'student', 'approved', '', '', 'BS Computer Science']);
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['S2025001122', 'Jasmine Cruz', 'j.cruz@pcu.edu.ph', 'student123', 'student', 'approved', '', '', 'BS Education']);
        // Seed demo faculty (approved)
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['F001', 'Dr. Ricardo Dela Cruz', 'r.delacruz@pcu.edu.ph', 'faculty123', 'faculty', 'approved', 'College of Business Administration', 'Business Management', '']);
        PCU.db.run("INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ['F006', 'Dr. Carlos Aguilar', 'c.aguilar@pcu.edu.ph', 'faculty123', 'faculty', 'approved', 'College of Computer Studies', 'Software Engineering', '']);
      }

      // Seed demo students
      var studentCount = PCU.db.exec("SELECT COUNT(*) FROM students")[0].values[0][0];
      if (studentCount === 0) {
        PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
          ['2023005678', 'Ana Marie Reyes', 'a.reyes@pcu.edu.ph', 'BS Business Administration', '3rd Year']);
        PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
          ['2024002345', 'Mark Andrew Lim', 'm.lim@pcu.edu.ph', 'BS Computer Science', '2nd Year']);
        PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
          ['2025001122', 'Jasmine Cruz', 'j.cruz@pcu.edu.ph', 'BS Education', '1st Year']);
        PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
          ['2023009876', 'Maria Clara Santos', 'm.santos2@pcu.edu.ph', 'BS Nursing', '3rd Year']);
        PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
          ['2024005432', 'Jose Protasio Rizal', 'j.rizal@pcu.edu.ph', 'BS Engineering', '2nd Year']);
      }

      // Seed demo faculty accounts
      var facultyCount = PCU.db.exec("SELECT COUNT(*) FROM faculty")[0].values[0][0];
      if (facultyCount === 0) {
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F001', 'Dr. Ricardo Dela Cruz', 'r.delacruz@pcu.edu.ph', 'College of Business Administration', 'Business Management', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F002', 'Prof. Maria Santos', 'm.santos@pcu.edu.ph', 'College of Business Administration', 'Marketing', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F003', 'Dr. Antonio Gonzales', 'a.gonzales@pcu.edu.ph', 'College of Business Administration', 'Finance', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F004', 'Prof. Elena Mendoza', 'e.mendoza@pcu.edu.ph', 'College of Education', 'Curriculum Studies', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F005', 'Dr. Jose Rivera', 'j.rivera@pcu.edu.ph', 'College of Education', 'Educational Leadership', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F006', 'Dr. Carlos Aguilar', 'c.aguilar@pcu.edu.ph', 'College of Computer Studies', 'Software Engineering', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F007', 'Prof. Patricia Torres', 'p.torres@pcu.edu.ph', 'College of Computer Studies', 'Data Science', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F008', 'Dr. Angela Ramos', 'a.ramos@pcu.edu.ph', 'College of Arts & Sciences', 'Psychology', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F009', 'Prof. Luis Castro', 'l.castro@pcu.edu.ph', 'College of Arts & Sciences', 'Communication', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F010', 'Dr. Isabel Fernandez', 'i.fernandez@pcu.edu.ph', 'College of Nursing', 'Clinical Nursing', 'faculty123']);
        PCU.db.run("INSERT INTO faculty (faculty_id, name, email, department, specialization, password) VALUES (?, ?, ?, ?, ?, ?)",
          ['F011', 'Prof. Miguel Villar', 'm.villar@pcu.edu.ph', 'College of Engineering', 'Civil Engineering', 'faculty123']);
      }

      PCU.dbReady = true;
      PCU.saveDatabase();
      console.log('PCU SQLite database initialized successfully.');
      return PCU.db;
    } catch (err) {
      console.error('Database initialization error:', err);
      return null;
    }
  };

  // ─── Save Database to localStorage ───────────────
  PCU.saveDatabase = function () {
    if (!PCU.db) return;
    try {
      var data = PCU.db.export();
      var buffer = new Uint8Array(data);
      localStorage.setItem('pcu_sqlite_db', JSON.stringify(Array.from(buffer)));
    } catch (err) {
      console.error('Error saving database:', err);
    }
  };

  // ─── Student Queries ─────────────────────────────
  PCU.dbGetAllStudents = function () {
    if (!PCU.db) return [];
    var results = PCU.db.exec("SELECT * FROM students ORDER BY name");
    if (results.length === 0) return [];
    return results[0].values.map(function (row) {
      return {
        id: row[0], student_id: row[1], name: row[2], email: row[3],
        course: row[4], year_level: row[5], created_at: row[6]
      };
    });
  };

  PCU.dbGetStudent = function (studentId) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT * FROM students WHERE student_id = ?");
    stmt.bind([studentId]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  PCU.dbAddStudent = function (studentId, name, email, course, yearLevel) {
    if (!PCU.db) return false;
    try {
      PCU.db.run("INSERT INTO students (student_id, name, email, course, year_level) VALUES (?, ?, ?, ?, ?)",
        [studentId, name, email, course || '', yearLevel || '']);
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error adding student:', err);
      return false;
    }
  };

  // ─── User Queries ────────────────────────────────
  PCU.dbGetAllUsers = function () {
    if (!PCU.db) return [];
    var results = PCU.db.exec("SELECT * FROM users ORDER BY created_at DESC");
    if (results.length === 0) return [];
    return results[0].values.map(function (row) {
      return {
        id: row[0], user_id: row[1], name: row[2], email: row[3],
        password: row[4], role: row[5], status: row[6], department: row[7],
        specialization: row[8], course: row[9], created_at: row[10]
      };
    });
  };

  PCU.dbGetUserByUserId = function (userId) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT * FROM users WHERE user_id = ?");
    stmt.bind([userId]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  PCU.dbGetUserByEmail = function (email) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([email]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  PCU.dbAddUser = function (user) {
    if (!PCU.db) return false;
    try {
      PCU.db.run(
        "INSERT INTO users (user_id, name, email, password, role, status, department, specialization, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [user.user_id, user.name, user.email, user.password, user.role || 'student', user.status || 'approved',
         user.department || '', user.specialization || '', user.course || '']
      );
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error adding user:', err);
      return false;
    }
  };

  PCU.dbUpdateUserStatus = function (userId, status) {
    if (!PCU.db) return false;
    try {
      PCU.db.run("UPDATE users SET status = ? WHERE user_id = ?", [status, userId]);
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error updating user status:', err);
      return false;
    }
  };

  PCU.dbDeleteUser = function (userId) {
    if (!PCU.db) return false;
    try {
      PCU.db.run("DELETE FROM users WHERE user_id = ?", [userId]);
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      return false;
    }
  };

  PCU.dbAuthenticateUser = function (userId, password) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT * FROM users WHERE user_id = ? AND password = ?");
    stmt.bind([userId, password]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  PCU.dbGetPendingFacultyCount = function () {
    if (!PCU.db) return 0;
    var result = PCU.db.exec("SELECT COUNT(*) FROM users WHERE role='faculty' AND status='pending'");
    return result.length > 0 ? result[0].values[0][0] : 0;
  };

  PCU.dbGetApprovedFacultyCount = function () {
    if (!PCU.db) return 0;
    var result = PCU.db.exec("SELECT COUNT(*) FROM users WHERE role='faculty' AND status='approved'");
    return result.length > 0 ? result[0].values[0][0] : 0;
  };

  // ─── Faculty Queries ─────────────────────────────
  PCU.dbGetAllFaculty = function () {
    if (!PCU.db) return [];
    var results = PCU.db.exec("SELECT id, faculty_id, name, email, department, specialization, created_at FROM faculty ORDER BY name");
    if (results.length === 0) return [];
    return results[0].values.map(function (row) {
      return {
        id: row[0], faculty_id: row[1], name: row[2], email: row[3],
        department: row[4], specialization: row[5], created_at: row[6]
      };
    });
  };

  PCU.dbGetFaculty = function (facultyId) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT * FROM faculty WHERE faculty_id = ?");
    stmt.bind([facultyId]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  PCU.dbAuthenticateFaculty = function (facultyId, password) {
    if (!PCU.db) return null;
    var stmt = PCU.db.prepare("SELECT id, faculty_id, name, email, department, specialization FROM faculty WHERE faculty_id = ? AND password = ?");
    stmt.bind([facultyId, password]);
    if (stmt.step()) {
      var row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  };

  // ─── Booking Queries ─────────────────────────────
  PCU.dbAddBooking = function (booking) {
    if (!PCU.db) return false;
    try {
      PCU.db.run(
        "INSERT INTO bookings (id, professor_id, student_id, student_name, student_email, date, start_time, end_time, purpose, consultation_type, mode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [booking.id, booking.professorId, booking.studentId, booking.studentName, booking.studentEmail,
         booking.date, booking.startTime, booking.endTime, booking.purpose || '',
         booking.consultationType || 'other', booking.mode || 'face-to-face', booking.status || 'confirmed']
      );
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error adding booking:', err);
      return false;
    }
  };

  PCU.dbGetBookingsByProfessor = function (professorId) {
    if (!PCU.db) return [];
    var stmt = PCU.db.prepare("SELECT * FROM bookings WHERE professor_id = ? ORDER BY date DESC, start_time DESC");
    stmt.bind([professorId]);
    var results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  };

  PCU.dbGetBookingsByStudent = function (studentId) {
    if (!PCU.db) return [];
    var stmt = PCU.db.prepare("SELECT * FROM bookings WHERE student_id = ? ORDER BY date DESC, start_time DESC");
    stmt.bind([studentId]);
    var results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  };

  PCU.dbGetAllBookings = function () {
    if (!PCU.db) return [];
    var results = PCU.db.exec("SELECT * FROM bookings ORDER BY date DESC, start_time DESC");
    if (results.length === 0) return [];
    return results[0].values.map(function (row) {
      return {
        id: row[0], professor_id: row[1], student_id: row[2], student_name: row[3],
        student_email: row[4], date: row[5], start_time: row[6], end_time: row[7],
        purpose: row[8], consultation_type: row[9], mode: row[10], status: row[11], created_at: row[12]
      };
    });
  };

  PCU.dbUpdateBookingStatus = function (bookingId, status) {
    if (!PCU.db) return false;
    try {
      PCU.db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId]);
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error updating booking:', err);
      return false;
    }
  };

  // ─── Notification Queries ────────────────────────
  PCU.dbAddNotification = function (notif) {
    if (!PCU.db) return false;
    try {
      PCU.db.run(
        "INSERT INTO notifications (id, type, title, message, professor_id, professor_name, timestamp, read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [notif.id, notif.type || 'info', notif.title || 'Notification', notif.message || '',
         notif.professorId || '', notif.professorName || '', notif.timestamp || new Date().toISOString(), notif.read ? 1 : 0]
      );
      PCU.saveDatabase();
      return true;
    } catch (err) {
      console.error('Error adding notification:', err);
      return false;
    }
  };

  PCU.dbGetNotifications = function () {
    if (!PCU.db) return [];
    var results = PCU.db.exec("SELECT * FROM notifications ORDER BY timestamp DESC");
    if (results.length === 0) return [];
    return results[0].values.map(function (row) {
      return {
        id: row[0], type: row[1], title: row[2], message: row[3],
        professor_id: row[4], professor_name: row[5], timestamp: row[6], read: row[7] === 1
      };
    });
  };

  PCU.dbMarkAllNotificationsRead = function () {
    if (!PCU.db) return;
    PCU.db.run("UPDATE notifications SET read = 1");
    PCU.saveDatabase();
  };

  // ─── Database Statistics ─────────────────────────
  PCU.dbGetStats = function () {
    if (!PCU.db) return { students: 0, faculty: 0, bookings: 0, confirmed: 0, declined: 0, cancelled: 0 };
    var students = PCU.db.exec("SELECT COUNT(*) FROM students")[0].values[0][0];
    var faculty = PCU.db.exec("SELECT COUNT(*) FROM faculty")[0].values[0][0];
    var bookings = PCU.db.exec("SELECT COUNT(*) FROM bookings")[0].values[0][0];
    var confirmed = PCU.db.exec("SELECT COUNT(*) FROM bookings WHERE status='confirmed'")[0].values[0][0];
    var declined = PCU.db.exec("SELECT COUNT(*) FROM bookings WHERE status='declined'")[0].values[0][0];
    var cancelled = PCU.db.exec("SELECT COUNT(*) FROM bookings WHERE status='cancelled'")[0].values[0][0];
    return { students: students, faculty: faculty, bookings: bookings, confirmed: confirmed, declined: declined, cancelled: cancelled };
  };

  // ─── Sync existing localStorage bookings to SQLite
  PCU.syncBookingsToDb = function () {
    if (!PCU.db) return;
    PCU.bookings.forEach(function (b) {
      var exists = PCU.db.exec("SELECT COUNT(*) FROM bookings WHERE id = '" + b.id + "'")[0].values[0][0];
      if (exists === 0) {
        PCU.dbAddBooking({
          id: b.id, professorId: b.professorId, studentId: b.studentId,
          studentName: b.studentName, studentEmail: b.studentEmail,
          date: b.date, startTime: b.startTime, endTime: b.endTime,
          purpose: b.purpose, consultationType: b.consultationType,
          mode: b.mode, status: b.status
        });
      }
    });
  };

  // ─── Helper: Load external script ────────────────
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  window.PCU = PCU;
})();
