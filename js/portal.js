/* ============================================
   PCU Quick-Book — Student Portal
   Login, dashboard, booking management
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Portal Open / Close ──────────────────────────
  PCU.openPortal = function () {
    var overlay = document.getElementById('portal-overlay');
    if (overlay) {
      overlay.classList.add('portal-overlay--open');
      document.body.style.overflow = 'hidden';
    }
    PCU.renderPortal();
  };

  PCU.closePortal = function () {
    var overlay = document.getElementById('portal-overlay');
    if (overlay) {
      overlay.classList.remove('portal-overlay--open');
      document.body.style.overflow = '';
    }
  };

  // ─── Login ─────────────────────────────────────────
  PCU.loginStudent = function (studentId, email) {
    studentId = studentId.trim(); email = email.trim().toLowerCase();
    if (!studentId || !email) return false;

    // Validate Student ID format (9 digits)
    if (!/^[0-9]{9}$/.test(studentId)) return false;

    // Find all bookings matching this student (from localStorage)
    var matches = PCU.bookings.filter(function (b) {
      return b.studentId === studentId && b.studentEmail.toLowerCase() === email;
    });

    // Also check SQLite database
    if (PCU.dbReady && PCU.db) {
      var dbBookings = PCU.dbGetBookingsByStudent(studentId);
      dbBookings.forEach(function (db) {
        var exists = matches.find(function (b) { return b.id === db.id; });
        if (!exists && db.student_email && db.student_email.toLowerCase() === email) {
          matches.push({
            id: db.id, professorId: db.professor_id, studentId: db.student_id,
            studentName: db.student_name, studentEmail: db.student_email,
            date: db.date, startTime: db.start_time, endTime: db.end_time,
            purpose: db.purpose, consultationType: db.consultation_type,
            mode: db.mode, status: db.status, createdAt: db.created_at
          });
        }
      });
    }

    if (matches.length === 0) return false;

    // Build student profile from most recent booking
    var latest = matches.reduce(function (a, b) {
      return new Date(b.createdAt) > new Date(a.createdAt) ? b : a;
    });

    PCU.currentStudent = {
      studentId: latest.studentId,
      studentName: latest.studentName,
      studentEmail: latest.studentEmail,
      initials: latest.studentName.split(' ').map(function (n) { return n[0]; }).join('').substr(0, 2).toUpperCase()
    };
    return true;
  };

  PCU.logoutStudent = function () {
    PCU.currentStudent = null;
    PCU.renderPortal();
  };

  // ─── Cancel Booking ────────────────────────────────
  PCU.cancelBooking = function (bookingId) {
    var booking = PCU.bookings.find(function (b) { return b.id === bookingId; });
    if (!booking) return;
    booking.status = 'cancelled';
    PCU.saveBookings();

    // Update in SQLite database
    if (PCU.dbReady && PCU.db) {
      PCU.dbUpdateBookingStatus(bookingId, 'cancelled');
    }

    // Update on server API so faculty portal sees it
    if (PCU.apiUpdateBookingStatus) {
      PCU.apiUpdateBookingStatus(bookingId, 'cancelled').catch(function () {});
    }

    PCU.addNotification({
      type: 'info',
      title: 'Booking Cancelled',
      message: 'Your consultation with ' + (PCU.getProfessor(booking.professorId) || {}).name + ' on ' +
        PCU.formatDate(booking.date) + ' at ' + PCU.formatTime12(booking.startTime) + ' has been cancelled.',
      professorId: '',
      professorName: (PCU.getProfessor(booking.professorId) || {}).name || '',
      studentId: booking.studentId, studentName: booking.studentName || ''
    });

    PCU.renderPortal();
    PCU.renderProfessorDirectory();
  };

  // ─── Render Portal ─────────────────────────────────
  PCU.renderPortal = async function () {
    var body = document.getElementById('portal-body');
    if (!body) return;

    // Update header user info
    var userEl = document.getElementById('portal-header-user');
    if (userEl) userEl.textContent = PCU.currentStudent ? PCU.currentStudent.studentName : '';
    var logoutBtn = document.getElementById('portal-logout-btn');
    if (logoutBtn) logoutBtn.style.display = PCU.currentStudent ? 'inline-block' : 'none';

    // Auto-login if user is already authenticated as student
    if (!PCU.currentStudent && PCU.currentUser && PCU.currentUser.role === 'student') {
      PCU.autoLoginStudent();
    }

    if (!PCU.currentStudent) {
      PCU.renderPortalLogin(body);
    } else {
      await PCU.renderPortalDashboard(body);
    }
  };

  // ─── Auto-Login from Auth Session ────────────────
  PCU.autoLoginStudent = function () {
    var user = PCU.currentUser;
    if (!user) return;

    var studentId = user.user_id.replace(/^S/, ''); // Strip 'S' prefix
    PCU.currentStudent = {
      studentId: studentId,
      studentName: user.name,
      studentEmail: user.email,
      initials: user.name.split(' ').map(function (n) { return n[0]; }).join('').substr(0, 2).toUpperCase()
    };
  };

  PCU.renderPortalLogin = function (body) {
    var prefilledId = '';
    var prefilledEmail = '';
    if (PCU.currentUser && PCU.currentUser.role === 'student') {
      prefilledId = PCU.currentUser.user_id.replace(/^S/, '');
      prefilledEmail = PCU.currentUser.email;
    }

    body.innerHTML =
      '<div class="portal-login">' +
        '<div class="portal-login__icon">\uD83C\uDF93</div>' +
        '<h2 class="portal-login__title">Student Portal</h2>' +
        '<p class="portal-login__subtitle">Enter your credentials to view your consultations.</p>' +
        '<form class="portal-login__form" id="portal-login-form">' +
          '<label class="portal-login__label">Student ID Number</label>' +
          '<input type="text" class="portal-login__input" id="portal-login-id" placeholder="e.g., 20223294" required maxlength="9" pattern="[0-9]{9}" value="' + prefilledId + '">' +
          '<label class="portal-login__label">Email Address</label>' +
          '<input type="email" class="portal-login__input" id="portal-login-email" placeholder="your.email@pcu.edu.ph" required value="' + prefilledEmail + '">' +
          '<p class="portal-login__error" id="portal-login-error">No matching student found. Check your ID and email.</p>' +
          '<button type="submit" class="portal-login__submit">Sign In</button>' +
        '</form>' +
      '</div>';

    document.getElementById('portal-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var sid = document.getElementById('portal-login-id').value;
      var sem = document.getElementById('portal-login-email').value;
      if (PCU.loginStudent(sid, sem)) {
        PCU.renderPortal();
      } else {
        document.getElementById('portal-login-error').style.display = 'block';
      }
    });
  };

  PCU.renderPortalDashboard = async function (body) {
    var s = PCU.currentStudent;
    // Get this student's bookings from localStorage, sorted by date descending
    var myBookings = PCU.bookings
      .filter(function (b) { return b.studentId === s.studentId && b.studentEmail.toLowerCase() === s.studentEmail.toLowerCase(); })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    // Fetch bookings from server API
    if (PCU.apiGetBookingsByStudent) {
      try {
        var rawBookings = await PCU.apiGetBookingsByStudent(s.studentId);
        if (Array.isArray(rawBookings)) {
          rawBookings.forEach(function (db) {
            var mapped = {
              id: db.id, professorId: db.professor_id, studentId: db.student_id,
              studentName: db.student_name, studentEmail: db.student_email,
              date: db.date, startTime: db.start_time, endTime: db.end_time,
              purpose: db.purpose, consultationType: db.consultation_type,
              mode: db.mode, status: db.status, createdAt: db.created_at
            };
            var exists = myBookings.find(function (b) { return b.id === mapped.id; });
            if (exists) {
              exists.status = mapped.status;
            } else {
              myBookings.push(mapped);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch bookings from server:', e);
      }
    }

    // Also get from SQLite database
    if (PCU.dbReady && PCU.db) {
      var dbBookings = PCU.dbGetBookingsByStudent(s.studentId);
      dbBookings.forEach(function (db) {
        var exists = myBookings.find(function (b) { return b.id === db.id; });
        if (!exists) {
          myBookings.push({
            id: db.id, professorId: db.professor_id, studentId: db.student_id,
            studentName: db.student_name, studentEmail: db.student_email,
            date: db.date, startTime: db.start_time, endTime: db.end_time,
            purpose: db.purpose, consultationType: db.consultation_type,
            mode: db.mode, status: db.status, createdAt: db.created_at
          });
        }
      });
    }
    // Re-sort after merging
    myBookings.sort(function (a, b) { return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at); });

    var upcoming = myBookings.filter(function (b) { return (b.status === 'confirmed' || b.status === 'pending') && b.date >= PCU.todayStr(); });
    var pending = myBookings.filter(function (b) { return b.status === 'pending'; });
    var past = myBookings.filter(function (b) { return b.status !== 'confirmed' && b.status !== 'pending' || b.date < PCU.todayStr(); });

    // Student's notifications (only show notifications targeted to student)
    var myNotifs = PCU.notificationQueue.filter(function (n) {
      return n.studentId === s.studentId && !n.professorId;
    });

    // Also fetch from server API (only student's notifications)
    if (PCU.apiGetNotifications) {
      try {
        var serverNotifs = await PCU.apiGetNotifications({ studentId: s.studentId });
        if (Array.isArray(serverNotifs)) {
          serverNotifs.forEach(function (sn) {
            var exists = myNotifs.find(function (n) { return n.id === sn.id; });
            if (!exists) {
              myNotifs.push({
                id: sn.id, type: sn.type, title: sn.title, message: sn.message,
                professorId: sn.professor_id, professorName: sn.professor_name,
                studentId: sn.student_id || '', studentName: sn.student_name || '',
                timestamp: sn.timestamp, read: sn.read
              });
            }
          });
          myNotifs.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
        }
      } catch (e) {
        console.warn('Failed to fetch notifications from server:', e);
      }
    }

    var html =
      '<div class="portal-dashboard">' +
        '<div class="portal-student-card">' +
          '<div class="portal-student-avatar">' + s.initials + '</div>' +
          '<div class="portal-student-details">' +
            '<p class="portal-student-name">' + s.studentName + '</p>' +
            '<p class="portal-student-meta"><span>\uD83C\uDF93 ID: ' + s.studentId + '</span><span>\uD83D\uDCE7 ' + s.studentEmail + '</span></p>' +
            '<p class="portal-student-meta"><span>Total bookings: ' + myBookings.length + '</span><span>Upcoming: ' + upcoming.length + '</span><span>Pending: ' + pending.length + '</span></p>' +
          '</div>' +
        '</div>';

    // Upcoming section (includes pending and confirmed)
    html += '<h3 class="portal-section-title">\uD83D\uDCC5 Upcoming Consultations</h3>';
    html += '<div class="portal-booking-list">';
    if (upcoming.length === 0) {
      html += '<p class="portal-empty">No upcoming consultations.</p>';
    } else {
      upcoming.forEach(function (b) {
        var prof = PCU.getProfessor(b.professorId);
        var statusLabel = b.status === 'pending' ? 'Pending Approval' : 'Confirmed';
        html +=
          '<div class="portal-booking-card portal-booking-card--' + b.status + '">' +
            '<div class="portal-booking-info">' +
              '<p class="portal-booking-prof">' + (prof ? prof.name : 'Unknown') + '</p>' +
              '<p class="portal-booking-detail"><strong>' + PCU.formatDate(b.date) + '</strong> \u2022 ' +
                PCU.formatTime12(b.startTime) + '\u2013' + PCU.formatTime12(b.endTime) + ' \u2022 ' + (b.mode || 'face-to-face') + '</p>' +
              '<p class="portal-booking-detail">' + (b.purpose || '') + '</p>' +
            '</div>' +
            '<span class="portal-booking-status portal-booking-status--' + b.status + '">' + statusLabel + '</span>' +
            '<div class="portal-booking-actions">' +
              '<button class="portal-cancel-btn" data-booking-id="' + b.id + '">Cancel</button>' +
            '</div>' +
          '</div>';
      });
    }
    html += '</div>';

    // Past section
    html += '<h3 class="portal-section-title">\uD83D\uDCCB History</h3>';
    html += '<div class="portal-booking-list">';
    if (past.length === 0) {
      html += '<p class="portal-empty">No past consultations.</p>';
    } else {
      past.forEach(function (b) {
        var prof = PCU.getProfessor(b.professorId);
        html +=
          '<div class="portal-booking-card portal-booking-card--' + b.status + '">' +
            '<div class="portal-booking-info">' +
              '<p class="portal-booking-prof">' + (prof ? prof.name : 'Unknown') + '</p>' +
              '<p class="portal-booking-detail"><strong>' + PCU.formatDate(b.date) + '</strong> \u2022 ' +
                PCU.formatTime12(b.startTime) + '\u2013' + PCU.formatTime12(b.endTime) + '</p>' +
              '<p class="portal-booking-detail">' + (b.purpose || '') + '</p>' +
            '</div>' +
            '<span class="portal-booking-status portal-booking-status--' + b.status + '">' + b.status.charAt(0).toUpperCase() + b.status.slice(1) + '</span>' +
          '</div>';
      });
    }
    html += '</div>';

    // Notifications
    html += '<h3 class="portal-section-title">\uD83D\uDD14 Your Notifications</h3>';
    html += '<div class="portal-notif-list">';
    if (myNotifs.length === 0) {
      html += '<p class="portal-empty">No notifications yet.</p>';
    } else {
      var icons = { confirmation: '\u2705', decline: '\u274C', request: '\uD83D\uDCE9', reminder: '\u23F0', info: '\u2139\uFE0F' };
      myNotifs.slice(0, 10).forEach(function (n) {
        html += '<div class="portal-notif-item">' +
          '<span class="portal-notif-item__icon">' + (icons[n.type] || '\uD83D\uDD14') + '</span>' +
          '<span class="portal-notif-item__text">' + n.message + '</span>' +
          '<span class="portal-notif-item__time">' + PCU.timeAgo(n.timestamp) + '</span>' +
        '</div>';
      });
    }
    html += '</div></div>';

    body.innerHTML = html;

    // Attach cancel listeners
    body.querySelectorAll('.portal-cancel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Cancel this consultation?')) {
          PCU.cancelBooking(this.getAttribute('data-booking-id'));
        }
      });
    });
  };
})();
