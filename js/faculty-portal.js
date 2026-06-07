/* ============================================
   PCU Quick-Book — Faculty Portal
   Login, dashboard, booking management for faculty
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Faculty Portal State ────────────────────────
  PCU.currentFaculty = null;

  // ─── Portal Open / Close ─────────────────────────
  PCU.openFacultyPortal = function () {
    document.getElementById('faculty-portal-overlay').classList.add('portal-overlay--open');
    document.body.style.overflow = 'hidden';
    PCU.renderFacultyPortal();
  };

  PCU.closeFacultyPortal = function () {
    document.getElementById('faculty-portal-overlay').classList.remove('portal-overlay--open');
    document.body.style.overflow = '';
  };

  // ─── Faculty Login ───────────────────────────────
  PCU.loginFaculty = function (facultyId, password) {
    facultyId = facultyId.trim();
    password = password.trim();
    if (!facultyId || !password) return false;

    var faculty = PCU.dbAuthenticateFaculty(facultyId, password);
    if (!faculty) return false;

    PCU.currentFaculty = {
      id: faculty.id,
      faculty_id: faculty.faculty_id,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      specialization: faculty.specialization,
      initials: faculty.name.split(' ').map(function (n) { return n[0]; }).join('').substr(0, 2).toUpperCase()
    };
    return true;
  };

  PCU.logoutFaculty = function () {
    PCU.currentFaculty = null;
    PCU.renderFacultyPortal();
  };

  // ─── Render Faculty Portal ───────────────────────
  PCU.renderFacultyPortal = function () {
    var body = document.getElementById('faculty-portal-body');
    if (!body) return;

    var userEl = document.getElementById('faculty-portal-header-user');
    if (userEl) userEl.textContent = PCU.currentFaculty ? PCU.currentFaculty.name : '';
    var logoutBtn = document.getElementById('faculty-portal-logout-btn');
    if (logoutBtn) logoutBtn.style.display = PCU.currentFaculty ? 'inline-block' : 'none';

    if (!PCU.currentFaculty) {
      PCU.renderFacultyLogin(body);
    } else {
      PCU.renderFacultyDashboard(body);
    }
  };

  PCU.renderFacultyLogin = function (body) {
    body.innerHTML =
      '<div class="portal-login">' +
        '<div class="portal-login__icon">&#x1F468;&#x200D;&#x1F3EB;</div>' +
        '<h2 class="portal-login__title">Faculty Portal</h2>' +
        '<p class="portal-login__subtitle">Enter your credentials to manage your consultations.</p>' +
        '<form class="portal-login__form" id="faculty-login-form">' +
          '<label class="portal-login__label">Faculty ID</label>' +
          '<input type="text" class="portal-login__input" id="faculty-login-id" placeholder="e.g., F001" required>' +
          '<label class="portal-login__label">Password</label>' +
          '<input type="password" class="portal-login__input" id="faculty-login-password" placeholder="Enter your password" required>' +
          '<p class="portal-login__error" id="faculty-login-error">Invalid credentials. Please check your Faculty ID and password.</p>' +
          '<button type="submit" class="portal-login__submit">Sign In</button>' +
          '<p class="portal-login__hint">Demo credentials: F001 / faculty123</p>' +
        '</form>' +
      '</div>';

    document.getElementById('faculty-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fid = document.getElementById('faculty-login-id').value;
      var pwd = document.getElementById('faculty-login-password').value;
      if (PCU.loginFaculty(fid, pwd)) {
        PCU.renderFacultyPortal();
      } else {
        document.getElementById('faculty-login-error').style.display = 'block';
      }
    });
  };

  PCU.renderFacultyDashboard = function (body) {
    var f = PCU.currentFaculty;

    // Find matching professor in the catalog
    var prof = null;
    var profCatalog = PCU.PROFESSORS || [];
    for (var i = 0; i < profCatalog.length; i++) {
      if (profCatalog[i].email === f.email || profCatalog[i].name === f.name) {
        prof = profCatalog[i];
        break;
      }
    }

    // Get bookings from both localStorage and SQLite
    var myBookings = PCU.bookings.filter(function (b) {
      return prof ? b.professorId === prof.id : false;
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    // Also get from SQLite
    if (prof) {
      var dbBookings = PCU.dbGetBookingsByProfessor(prof.id);
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

    var upcoming = myBookings.filter(function (b) { return b.status === 'confirmed' && b.date >= PCU.todayStr(); });
    var pending = myBookings.filter(function (b) { return b.status === 'pending'; });
    var past = myBookings.filter(function (b) { return b.status !== 'confirmed' || b.date < PCU.todayStr(); });
    var confirmed = myBookings.filter(function (b) { return b.status === 'confirmed'; });
    var declined = myBookings.filter(function (b) { return b.status === 'declined'; });
    var cancelled = myBookings.filter(function (b) { return b.status === 'cancelled'; });

    // Stats
    var totalBookings = myBookings.length;
    var todayBookings = myBookings.filter(function (b) { return b.date === PCU.todayStr() && b.status === 'confirmed'; });

    var html =
      '<div class="portal-dashboard">' +
        '<div class="portal-student-card faculty-card">' +
          '<div class="portal-student-avatar" style="background:' + (prof ? prof.color : '#1B3A6B') + '">' + f.initials + '</div>' +
          '<div class="portal-student-details">' +
            '<p class="portal-student-name">' + f.name + '</p>' +
            '<p class="portal-student-meta"><span>&#x1F3EB; ' + f.department + '</span></p>' +
            '<p class="portal-student-meta"><span>&#x1F4DD; ' + f.specialization + '</span><span>&#x1F4E7; ' + f.email + '</span></p>' +
          '</div>' +
        '</div>';

    // Stats cards
    html += '<div class="faculty-stats-grid">' +
      '<div class="faculty-stat-card">' +
        '<div class="faculty-stat-card__number">' + totalBookings + '</div>' +
        '<div class="faculty-stat-card__label">Total Bookings</div>' +
      '</div>' +
      '<div class="faculty-stat-card faculty-stat-card--success">' +
        '<div class="faculty-stat-card__number">' + confirmed.length + '</div>' +
        '<div class="faculty-stat-card__label">Confirmed</div>' +
      '</div>' +
      '<div class="faculty-stat-card faculty-stat-card--warning">' +
        '<div class="faculty-stat-card__number">' + upcoming.length + '</div>' +
        '<div class="faculty-stat-card__label">Upcoming</div>' +
      '</div>' +
      '<div class="faculty-stat-card faculty-stat-card--danger">' +
        '<div class="faculty-stat-card__number">' + declined.length + '</div>' +
        '<div class="faculty-stat-card__label">Declined</div>' +
      '</div>' +
    '</div>';

    // Today's Schedule
    html += '<h3 class="portal-section-title">&#x1F4C5; Today\'s Schedule (' + PCU.formatDate(PCU.todayStr()) + ')</h3>';
    html += '<div class="portal-booking-list">';
    if (todayBookings.length === 0) {
      html += '<p class="portal-empty">No consultations scheduled for today.</p>';
    } else {
      todayBookings.forEach(function (b) {
        html += PCU.renderFacultyBookingCard(b);
      });
    }
    html += '</div>';

    // Upcoming section
    html += '<h3 class="portal-section-title">&#x1F525; Upcoming Consultations</h3>';
    html += '<div class="portal-booking-list">';
    if (upcoming.length === 0) {
      html += '<p class="portal-empty">No upcoming consultations.</p>';
    } else {
      upcoming.forEach(function (b) {
        html += PCU.renderFacultyBookingCard(b, true);
      });
    }
    html += '</div>';

    // All Bookings section
    html += '<h3 class="portal-section-title">&#x1F4CB; All Bookings</h3>';
    html += '<div class="portal-booking-list">';
    if (myBookings.length === 0) {
      html += '<p class="portal-empty">No bookings found.</p>';
    } else {
      myBookings.slice(0, 20).forEach(function (b) {
        html += PCU.renderFacultyBookingCard(b, true);
      });
    }
    html += '</div>';

    // Consultation Hours
    if (prof) {
      html += '<h3 class="portal-section-title">&#x1F550; Your Consultation Hours</h3>';
      html += '<div class="faculty-schedule">';
      prof.consultationHours.forEach(function (ch) {
        html += '<div class="faculty-schedule__item">' +
          '<span class="faculty-schedule__day">' + ch.day + '</span>' +
          '<span class="faculty-schedule__time">' + PCU.formatTime12(ch.start) + ' &ndash; ' + PCU.formatTime12(ch.end) + '</span>' +
          '<span class="faculty-schedule__buffer">Buffer: ' + prof.bufferTime + ' min</span>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';

    body.innerHTML = html;

    // Attach action listeners
    body.querySelectorAll('.faculty-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        var bookingId = this.getAttribute('data-booking-id');
        PCU.handleFacultyAction(action, bookingId);
      });
    });
  };

  PCU.renderFacultyBookingCard = function (b, showActions) {
    var studentName = b.studentName || 'Unknown';
    var html =
      '<div class="portal-booking-card portal-booking-card--' + b.status + '">' +
        '<div class="portal-booking-info">' +
          '<p class="portal-booking-prof">' + studentName + '</p>' +
          '<p class="portal-booking-detail"><strong>' + PCU.formatDate(b.date) + '</strong> &bull; ' +
            PCU.formatTime12(b.startTime) + '&ndash;' + PCU.formatTime12(b.endTime) + ' &bull; ' + (b.mode || 'face-to-face') + '</p>' +
          '<p class="portal-booking-detail">' + (b.purpose || '') + '</p>' +
          '<p class="portal-booking-detail" style="font-size:0.75rem;color:#999;">ID: ' + (b.studentId || '') + ' &bull; ' + (b.studentEmail || '') + '</p>' +
        '</div>' +
        '<span class="portal-booking-status portal-booking-status--' + b.status + '">' + b.status.charAt(0).toUpperCase() + b.status.slice(1) + '</span>';

    if (showActions) {
      html += '<div class="portal-booking-actions">';
      if (b.status === 'confirmed' && b.date >= PCU.todayStr()) {
        html += '<button class="faculty-action-btn faculty-action-btn--complete" data-action="complete" data-booking-id="' + b.id + '">Complete</button>';
        html += '<button class="faculty-action-btn faculty-action-btn--cancel" data-action="cancel" data-booking-id="' + b.id + '">Cancel</button>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  };

  PCU.handleFacultyAction = function (action, bookingId) {
    var confirmMsg = action === 'cancel'
      ? 'Are you sure you want to cancel this consultation?'
      : 'Mark this consultation as completed?';

    if (!confirm(confirmMsg)) return;

    var newStatus = action === 'cancel' ? 'cancelled' : 'completed';
    PCU.dbUpdateBookingStatus(bookingId, newStatus);

    // Also update in localStorage
    var booking = PCU.bookings.find(function (b) { return b.id === bookingId; });
    if (booking) {
      booking.status = newStatus;
      PCU.saveBookings();
    }

    // Add notification
    var notifType = action === 'cancel' ? 'decline' : 'confirmation';
    var notifTitle = action === 'cancel' ? 'Consultation Cancelled' : 'Consultation Completed';
    var notifMsg = action === 'cancel'
      ? 'You have cancelled the consultation with ' + (booking ? booking.studentName : 'student') + ' on ' + PCU.formatDate(booking ? booking.date : '') + '.'
      : 'Consultation with ' + (booking ? booking.studentName : 'student') + ' on ' + PCU.formatDate(booking ? booking.date : '') + ' has been completed.';

    PCU.addNotification({
      type: notifType, title: notifTitle, message: notifMsg,
      professorId: booking ? booking.professorId : '',
      professorName: PCU.currentFaculty ? PCU.currentFaculty.name : ''
    });

    PCU.renderFacultyPortal();
  };

  // ─── DB Stats Panel for Faculty ──────────────────
  PCU.renderDbStats = function () {
    var stats = PCU.dbGetStats();
    var container = document.getElementById('db-stats-panel');
    if (!container) return;

    container.innerHTML =
      '<div class="db-stats">' +
        '<h3 class="portal-section-title">&#x1F4CA; Database Statistics</h3>' +
        '<div class="db-stats__grid">' +
          '<div class="db-stats__item"><span class="db-stats__number">' + stats.students + '</span><span class="db-stats__label">Students</span></div>' +
          '<div class="db-stats__item"><span class="db-stats__number">' + stats.faculty + '</span><span class="db-stats__label">Faculty</span></div>' +
          '<div class="db-stats__item"><span class="db-stats__number">' + stats.bookings + '</span><span class="db-stats__label">Total Bookings</span></div>' +
          '<div class="db-stats__item db-stats__item--success"><span class="db-stats__number">' + stats.confirmed + '</span><span class="db-stats__label">Confirmed</span></div>' +
          '<div class="db-stats__item db-stats__item--danger"><span class="db-stats__number">' + stats.declined + '</span><span class="db-stats__label">Declined</span></div>' +
          '<div class="db-stats__item db-stats__item--muted"><span class="db-stats__number">' + stats.cancelled + '</span><span class="db-stats__label">Cancelled</span></div>' +
        '</div>' +
      '</div>';
  };
})();
