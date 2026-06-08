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
    var overlay = document.getElementById('faculty-portal-overlay');
    if (overlay) {
      overlay.classList.add('portal-overlay--open');
      document.body.style.overflow = 'hidden';
    }
    PCU.renderFacultyPortal();
  };

  PCU.closeFacultyPortal = function () {
    var overlay = document.getElementById('faculty-portal-overlay');
    if (overlay) {
      overlay.classList.remove('portal-overlay--open');
      document.body.style.overflow = '';
    }
  };

  // ─── Faculty Login ───────────────────────────────
  PCU.loginFaculty = async function (facultyId, password) {
    facultyId = facultyId.trim();
    password = password.trim();
    if (!facultyId || !password) return false;

    if (!PCU.apiLogin) return false;
    try {
      var result = await PCU.apiLogin(facultyId, password);
      if (!result || !result.success || result.user.role !== 'faculty') return false;

      var faculty = result.user;
      PCU.currentFaculty = {
        id: faculty.id,
        faculty_id: faculty.user_id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department || '',
        specialization: faculty.specialization || '',
        initials: faculty.name.split(' ').map(function (n) { return n[0]; }).join('').substr(0, 2).toUpperCase()
      };
      return true;
    } catch (e) {
      console.warn('Faculty login failed:', e);
      return false;
    }
  };

  PCU.logoutFaculty = function () {
    PCU.currentFaculty = null;
    PCU.renderFacultyPortal();
  };

  // ─── Render Faculty Portal ───────────────────────
  PCU.renderFacultyPortal = async function () {
    var body = document.getElementById('faculty-portal-body');
    if (!body) return;

    var userEl = document.getElementById('faculty-portal-header-user');
    if (userEl) userEl.textContent = PCU.currentFaculty ? PCU.currentFaculty.name : '';
    var logoutBtn = document.getElementById('faculty-portal-logout-btn');
    if (logoutBtn) logoutBtn.style.display = PCU.currentFaculty ? 'inline-block' : 'none';

    if (!PCU.currentFaculty) {
      PCU.renderFacultyLogin(body);
    } else {
      await PCU.renderFacultyDashboard(body);
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

    document.getElementById('faculty-login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var fid = document.getElementById('faculty-login-id').value;
      var pwd = document.getElementById('faculty-login-password').value;
      if (await PCU.loginFaculty(fid, pwd)) {
        PCU.renderFacultyPortal();
      } else {
        document.getElementById('faculty-login-error').style.display = 'block';
      }
    });
  };

  PCU.renderFacultyDashboard = async function (body) {
    var f = PCU.currentFaculty;

    // Find matching professor in the catalog
    var prof = null;
    var profCatalog = PCU.PROFESSORS || [];
    for (var i = 0; i < profCatalog.length; i++) {
      if (profCatalog[i].id === f.faculty_id || profCatalog[i].email === f.email || profCatalog[i].name === f.name) {
        prof = profCatalog[i];
        break;
      }
    }

    // Fetch bookings from server API
    var serverBookings = [];
    if (prof && PCU.apiGetBookingsByProfessor) {
      try {
        var rawBookings = await PCU.apiGetBookingsByProfessor(prof.id);
        if (Array.isArray(rawBookings)) {
          serverBookings = rawBookings.map(function (db) {
            return {
              id: db.id, professorId: db.professor_id, studentId: db.student_id,
              studentName: db.student_name, studentEmail: db.student_email,
              date: db.date, startTime: db.start_time, endTime: db.end_time,
              purpose: db.purpose, consultationType: db.consultation_type,
              mode: db.mode, status: db.status, createdAt: db.created_at
            };
          });
        }
      } catch (e) {
        console.warn('Failed to fetch bookings from server:', e);
      }
    }

    // Use server bookings only (no localStorage / local SQLite)
    var myBookings = serverBookings;

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
      '<div class="faculty-stat-card faculty-stat-card--warning">' +
        '<div class="faculty-stat-card__number">' + pending.length + '</div>' +
        '<div class="faculty-stat-card__label">Pending</div>' +
      '</div>' +
      '<div class="faculty-stat-card faculty-stat-card--success">' +
        '<div class="faculty-stat-card__number">' + confirmed.length + '</div>' +
        '<div class="faculty-stat-card__label">Confirmed</div>' +
      '</div>' +
      '<div class="faculty-stat-card faculty-stat-card--danger">' +
        '<div class="faculty-stat-card__number">' + declined.length + '</div>' +
        '<div class="faculty-stat-card__label">Declined</div>' +
      '</div>' +
    '</div>';

    // Consultation Hours (editable) — shown first
    html += '<h3 class="portal-section-title">&#x1F550; Your Consultation Hours</h3>';
    html += '<div class="faculty-schedule-editor" id="faculty-schedule-editor">';

    var hours = (prof && prof.consultationHours) || [];
    var bufferTime = (prof && prof.bufferTime) || 15;

    // Buffer time setting
    html += '<div class="faculty-schedule-editor__buffer">' +
      '<label class="faculty-schedule-editor__label">Buffer Time Between Consultations:</label>' +
      '<select class="faculty-schedule-editor__select" id="faculty-buffer-time">' +
        '<option value="5"' + (bufferTime === 5 ? ' selected' : '') + '>5 minutes</option>' +
        '<option value="10"' + (bufferTime === 10 ? ' selected' : '') + '>10 minutes</option>' +
        '<option value="15"' + (bufferTime === 15 ? ' selected' : '') + '>15 minutes</option>' +
        '<option value="20"' + (bufferTime === 20 ? ' selected' : '') + '>20 minutes</option>' +
        '<option value="30"' + (bufferTime === 30 ? ' selected' : '') + '>30 minutes</option>' +
      '</select>' +
    '</div>';

    // Existing consultation hours
    html += '<div class="faculty-schedule-editor__list" id="faculty-hours-list">';
    hours.forEach(function (ch, idx) {
      html += '<div class="faculty-schedule-editor__row" data-index="' + idx + '">' +
        '<input type="date" class="faculty-schedule-editor__date" data-index="' + idx + '" value="' + (ch.date || '') + '">' +
        '<select class="faculty-schedule-editor__select faculty-schedule-editor__day" data-index="' + idx + '">' +
          '<option value="Monday"' + (ch.day === 'Monday' ? ' selected' : '') + '>Monday</option>' +
          '<option value="Tuesday"' + (ch.day === 'Tuesday' ? ' selected' : '') + '>Tuesday</option>' +
          '<option value="Wednesday"' + (ch.day === 'Wednesday' ? ' selected' : '') + '>Wednesday</option>' +
          '<option value="Thursday"' + (ch.day === 'Thursday' ? ' selected' : '') + '>Thursday</option>' +
          '<option value="Friday"' + (ch.day === 'Friday' ? ' selected' : '') + '>Friday</option>' +
          '<option value="Saturday"' + (ch.day === 'Saturday' ? ' selected' : '') + '>Saturday</option>' +
        '</select>' +
        '<input type="time" class="faculty-schedule-editor__time" data-index="' + idx + '" data-field="start" value="' + ch.start + '">' +
        '<span class="faculty-schedule-editor__separator">&ndash;</span>' +
        '<input type="time" class="faculty-schedule-editor__time" data-index="' + idx + '" data-field="end" value="' + ch.end + '">' +
        '<button type="button" class="faculty-schedule-editor__remove" data-index="' + idx + '" title="Remove">&#x2716;</button>' +
      '</div>';
    });
    html += '</div>';

    // Add new row button
    html += '<button type="button" class="faculty-schedule-editor__add" id="faculty-add-hours-btn">+ Add Consultation Hours</button>';

    // Save button
    html += '<button type="button" class="faculty-schedule-editor__save" id="faculty-save-hours-btn">Save Schedule</button>';

    html += '</div>';

    // Pending Requests section
    html += '<h3 class="portal-section-title">&#x1F4E9; Pending Requests (' + pending.length + ')</h3>';
    html += '<div class="portal-booking-list">';
    if (pending.length === 0) {
      html += '<p class="portal-empty">No pending requests.</p>';
    } else {
      pending.forEach(function (b) {
        html += PCU.renderFacultyBookingCard(b, true);
      });
    }
    html += '</div>';

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

    // Faculty's notifications — fetch from server API only
    var myNotifs = [];
    if (PCU.apiGetNotifications) {
      try {
        var serverNotifs = await PCU.apiGetNotifications({ professorId: prof.id });
        if (Array.isArray(serverNotifs)) {
          myNotifs = serverNotifs.map(function (sn) {
            return {
              id: sn.id, type: sn.type, title: sn.title, message: sn.message,
              professorId: sn.professor_id, professorName: sn.professor_name,
              studentId: sn.student_id || '', studentName: sn.student_name || '',
              timestamp: sn.timestamp, read: sn.read
            };
          });
          myNotifs.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
        }
      } catch (e) {
        console.warn('Failed to fetch notifications from server:', e);
      }
    }
    html += '<h3 class="portal-section-title">&#x1F514; Your Notifications</h3>';
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
    html += '</div>';

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

    // Attach schedule editor listeners
    PCU.attachScheduleEditorListeners();
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
      if (b.status === 'pending') {
        html += '<button class="faculty-action-btn faculty-action-btn--approve" data-action="approve" data-booking-id="' + b.id + '">Approve</button>';
        html += '<button class="faculty-action-btn faculty-action-btn--decline" data-action="decline" data-booking-id="' + b.id + '">Decline</button>';
      } else if (b.status === 'confirmed' && b.date >= PCU.todayStr()) {
        html += '<button class="faculty-action-btn faculty-action-btn--complete" data-action="complete" data-booking-id="' + b.id + '">Complete</button>';
        html += '<button class="faculty-action-btn faculty-action-btn--cancel" data-action="cancel" data-booking-id="' + b.id + '">Cancel</button>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  };

  PCU.handleFacultyAction = async function (action, bookingId) {
    if (action === 'approve') {
      if (!confirm('Approve this consultation request?')) return;
    } else if (action === 'decline') {
      if (!confirm('Decline this consultation request?')) return;
    } else if (action === 'cancel') {
      if (!confirm('Are you sure you want to cancel this consultation?')) return;
    } else {
      if (!confirm('Mark this consultation as completed?')) return;
    }

    var newStatus;
    if (action === 'approve') newStatus = 'confirmed';
    else if (action === 'decline') newStatus = 'declined';
    else if (action === 'cancel') newStatus = 'cancelled';
    else newStatus = 'completed';

    // Find booking from server API
    var booking = null;
    if (PCU.currentFaculty && PCU.apiGetBookingsByProfessor) {
      try {
        var prof = PCU.getProfessor(PCU.currentFaculty.faculty_id);
        if (prof) {
          var serverBookings = await PCU.apiGetBookingsByProfessor(prof.id);
          if (Array.isArray(serverBookings)) {
            var found = serverBookings.find(function (db) { return db.id === bookingId; });
            if (found) {
              booking = {
                id: found.id, professorId: found.professor_id, studentId: found.student_id,
                studentName: found.student_name, studentEmail: found.student_email,
                date: found.date, startTime: found.start_time, endTime: found.end_time,
                purpose: found.purpose, consultationType: found.consultation_type,
                mode: found.mode, status: found.status, createdAt: found.created_at
              };
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch booking from server:', e);
      }
    }

    // Update on server API
    if (PCU.apiUpdateBookingStatus) {
      PCU.apiUpdateBookingStatus(bookingId, newStatus).catch(function () {});
    }

    var dateStr = (booking && booking.date) ? PCU.formatDate(booking.date) : 'the scheduled date';
    var timeStr = (booking && booking.startTime) ? PCU.formatTime12(booking.startTime) : '';
    var studentName = (booking && booking.studentName) ? booking.studentName : 'the student';
    var profName = PCU.currentFaculty ? PCU.currentFaculty.name : 'faculty';

    if (action === 'approve') {
      // Notify student
      PCU.addNotification({
        type: 'confirmation',
        title: 'Booking Approved',
        message: 'Your consultation with ' + profName + ' on ' + dateStr + ' at ' + timeStr + ' has been approved.',
        professorId: '', professorName: profName,
        studentId: booking ? booking.studentId : '', studentName: studentName
      });
      // Notify faculty
      PCU.addNotification({
        type: 'confirmation',
        title: 'Booking Approved',
        message: 'Consultation with ' + studentName + ' on ' + dateStr + ' at ' + timeStr + ' has been settled.',
        professorId: booking ? booking.professorId : '', professorName: profName,
        studentId: '', studentName: studentName
      });
    } else if (action === 'decline') {
      // Notify student
      PCU.addNotification({
        type: 'decline',
        title: 'Booking Declined',
        message: 'Your consultation with ' + profName + ' on ' + dateStr + ' at ' + timeStr + ' has been declined.',
        professorId: '', professorName: profName,
        studentId: booking ? booking.studentId : '', studentName: studentName
      });
      // Notify faculty
      PCU.addNotification({
        type: 'decline',
        title: 'Booking Declined',
        message: 'Consultation with ' + studentName + ' on ' + dateStr + ' at ' + timeStr + ' has been declined.',
        professorId: booking ? booking.professorId : '', professorName: profName,
        studentId: '', studentName: studentName
      });
    } else {
      var notifType = action === 'cancel' ? 'decline' : 'confirmation';
      var notifTitle = action === 'cancel' ? 'Consultation Cancelled' : 'Consultation Completed';
      var notifMsg = action === 'cancel'
        ? 'Your consultation with ' + profName + ' on ' + dateStr + ' has been cancelled.'
        : 'Your consultation with ' + profName + ' on ' + dateStr + ' has been completed.';

      // Notify student
      PCU.addNotification({
        type: notifType, title: notifTitle, message: notifMsg,
        professorId: '', professorName: profName,
        studentId: booking ? booking.studentId : '', studentName: studentName
      });
      // Notify faculty
      var facultyMsg = action === 'cancel'
        ? 'Consultation with ' + studentName + ' on ' + dateStr + ' has been cancelled.'
        : 'Consultation with ' + studentName + ' on ' + dateStr + ' has been completed.';
      PCU.addNotification({
        type: notifType, title: notifTitle, message: facultyMsg,
        professorId: booking ? booking.professorId : '', professorName: profName,
        studentId: '', studentName: studentName
      });
    }

    PCU.renderFacultyPortal();
  };

  // ─── Schedule Editor Listeners ────────────────────
  PCU.attachScheduleEditorListeners = function () {
    var faculty = PCU.currentFaculty;
    if (!faculty) return;

    // Add hours button
    var addBtn = document.getElementById('faculty-add-hours-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var list = document.getElementById('faculty-hours-list');
        if (!list) return;
        var idx = list.children.length;
        var today = PCU.todayStr();
        var dayName = PCU.getDayOfWeek(today);
        var row = document.createElement('div');
        row.className = 'faculty-schedule-editor__row';
        row.setAttribute('data-index', idx);
        row.innerHTML =
          '<input type="date" class="faculty-schedule-editor__date" data-index="' + idx + '" value="' + today + '">' +
          '<select class="faculty-schedule-editor__select faculty-schedule-editor__day" data-index="' + idx + '">' +
            '<option value="Monday"' + (dayName === 'Monday' ? ' selected' : '') + '>Monday</option>' +
            '<option value="Tuesday"' + (dayName === 'Tuesday' ? ' selected' : '') + '>Tuesday</option>' +
            '<option value="Wednesday"' + (dayName === 'Wednesday' ? ' selected' : '') + '>Wednesday</option>' +
            '<option value="Thursday"' + (dayName === 'Thursday' ? ' selected' : '') + '>Thursday</option>' +
            '<option value="Friday"' + (dayName === 'Friday' ? ' selected' : '') + '>Friday</option>' +
            '<option value="Saturday"' + (dayName === 'Saturday' ? ' selected' : '') + '>Saturday</option>' +
          '</select>' +
          '<input type="time" class="faculty-schedule-editor__time" data-index="' + idx + '" data-field="start" value="09:00">' +
          '<span class="faculty-schedule-editor__separator">&ndash;</span>' +
          '<input type="time" class="faculty-schedule-editor__time" data-index="' + idx + '" data-field="end" value="12:00">' +
          '<button type="button" class="faculty-schedule-editor__remove" data-index="' + idx + '" title="Remove">&#x2716;</button>';
        list.appendChild(row);
        // Attach remove listener
        row.querySelector('.faculty-schedule-editor__remove').addEventListener('click', function () {
          row.remove();
        });
        // Auto-update day when date changes
        row.querySelector('.faculty-schedule-editor__date').addEventListener('change', function () {
          var d = PCU.getDayOfWeek(this.value);
          var daySelect = row.querySelector('.faculty-schedule-editor__day');
          if (daySelect && d) daySelect.value = d;
        });
      });
    }

    // Remove buttons (existing rows)
    document.querySelectorAll('.faculty-schedule-editor__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.faculty-schedule-editor__row').remove();
      });
    });

    // Date change auto-fills day for existing rows
    document.querySelectorAll('.faculty-schedule-editor__date').forEach(function (dateInput) {
      dateInput.addEventListener('change', function () {
        var d = PCU.getDayOfWeek(this.value);
        var row = this.closest('.faculty-schedule-editor__row');
        var daySelect = row ? row.querySelector('.faculty-schedule-editor__day') : null;
        if (daySelect && d) daySelect.value = d;
      });
    });

    // Save button
    var saveBtn = document.getElementById('faculty-save-hours-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        PCU.saveScheduleFromEditor();
      });
    }
  };

  PCU.saveScheduleFromEditor = async function () {
    var faculty = PCU.currentFaculty;
    if (!faculty) return;

    var rows = document.querySelectorAll('.faculty-schedule-editor__row');
    var hours = [];
    rows.forEach(function (row) {
      var date = row.querySelector('.faculty-schedule-editor__date').value;
      var day = row.querySelector('.faculty-schedule-editor__day').value;
      var start = row.querySelector('[data-field="start"]').value;
      var end = row.querySelector('[data-field="end"]').value;
      if (date && day && start && end) {
        hours.push({ date: date, day: day, start: start, end: end });
      }
    });

    var bufferSelect = document.getElementById('faculty-buffer-time');
    var bufferTime = bufferSelect ? parseInt(bufferSelect.value) : 15;

    // Save to API
    var success = await PCU.saveConsultationHours(faculty.faculty_id, hours, bufferTime);

    // Update the PROFESSORS array in memory
    var prof = PCU.getProfessor(faculty.faculty_id);
    if (prof) {
      prof.consultationHours = hours;
      prof.bufferTime = bufferTime;
    }

    if (success) {
      alert('Schedule saved successfully!');
    } else {
      alert('Failed to save schedule to server.');
    }
    PCU.renderFacultyPortal();
  };

  })();
