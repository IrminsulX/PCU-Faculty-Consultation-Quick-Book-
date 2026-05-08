/* ============================================
   PCU Quick-Book — Smart Scheduling Engine
   Features: Professor Directory, Request Meeting,
   Buffer Time, Conflict Warning, Auto-Decline,
   Notification Queue
   ============================================ */

(function () {
  'use strict';

  // ─── Professor Data ───────────────────────────────────
  const PROFESSORS = [
    {
      id: 'delacruz',
      name: 'Dr. Ricardo Dela Cruz',
      department: 'College of Business Administration',
      specialization: 'Business Management',
      email: 'r.delacruz@pcu.edu.ph',
      initials: 'DC',
      color: '#7B1E2E',
      consultationHours: [
        { day: 'Monday',    start: '09:00', end: '12:00' },
        { day: 'Wednesday', start: '13:00', end: '17:00' },
        { day: 'Friday',    start: '09:00', end: '12:00' },
      ],
      bufferTime: 15,
    },
    {
      id: 'santos',
      name: 'Prof. Maria Santos',
      department: 'College of Business Administration',
      specialization: 'Marketing',
      email: 'm.santos@pcu.edu.ph',
      initials: 'MS',
      color: '#7B1E2E',
      consultationHours: [
        { day: 'Tuesday',   start: '08:00', end: '12:00' },
        { day: 'Thursday',  start: '13:00', end: '17:00' },
      ],
      bufferTime: 10,
    },
    {
      id: 'gonzales',
      name: 'Dr. Antonio Gonzales',
      department: 'College of Business Administration',
      specialization: 'Finance',
      email: 'a.gonzales@pcu.edu.ph',
      initials: 'AG',
      color: '#7B1E2E',
      consultationHours: [
        { day: 'Monday',    start: '13:00', end: '16:00' },
        { day: 'Wednesday', start: '09:00', end: '12:00' },
      ],
      bufferTime: 20,
    },
    {
      id: 'mendoza',
      name: 'Prof. Elena Mendoza',
      department: 'College of Education',
      specialization: 'Curriculum Studies',
      email: 'e.mendoza@pcu.edu.ph',
      initials: 'EM',
      color: '#2E7D32',
      consultationHours: [
        { day: 'Tuesday',   start: '09:00', end: '12:00' },
        { day: 'Thursday',  start: '09:00', end: '15:00' },
        { day: 'Friday',    start: '13:00', end: '17:00' },
      ],
      bufferTime: 15,
    },
    {
      id: 'rivera',
      name: 'Dr. Jose Rivera',
      department: 'College of Education',
      specialization: 'Educational Leadership',
      email: 'j.rivera@pcu.edu.ph',
      initials: 'JR',
      color: '#2E7D32',
      consultationHours: [
        { day: 'Monday',    start: '08:00', end: '12:00' },
        { day: 'Wednesday', start: '13:00', end: '17:00' },
      ],
      bufferTime: 15,
    },
    {
      id: 'aguilar',
      name: 'Dr. Carlos Aguilar',
      department: 'College of Computer Studies',
      specialization: 'Software Engineering',
      email: 'c.aguilar@pcu.edu.ph',
      initials: 'CA',
      color: '#1565C0',
      consultationHours: [
        { day: 'Monday',    start: '13:00', end: '17:00' },
        { day: 'Tuesday',   start: '08:00', end: '12:00' },
        { day: 'Wednesday', start: '13:00', end: '17:00' },
        { day: 'Thursday',  start: '08:00', end: '12:00' },
      ],
      bufferTime: 10,
    },
    {
      id: 'torres',
      name: 'Prof. Patricia Torres',
      department: 'College of Computer Studies',
      specialization: 'Data Science',
      email: 'p.torres@pcu.edu.ph',
      initials: 'PT',
      color: '#1565C0',
      consultationHours: [
        { day: 'Wednesday', start: '09:00', end: '12:00' },
        { day: 'Friday',    start: '13:00', end: '17:00' },
      ],
      bufferTime: 15,
    },
    {
      id: 'ramos',
      name: 'Dr. Angela Ramos',
      department: 'College of Arts & Sciences',
      specialization: 'Psychology',
      email: 'a.ramos@pcu.edu.ph',
      initials: 'AR',
      color: '#6A1B9A',
      consultationHours: [
        { day: 'Tuesday',   start: '13:00', end: '17:00' },
        { day: 'Thursday',  start: '08:00', end: '12:00' },
      ],
      bufferTime: 15,
    },
    {
      id: 'castro',
      name: 'Prof. Luis Castro',
      department: 'College of Arts & Sciences',
      specialization: 'Communication',
      email: 'l.castro@pcu.edu.ph',
      initials: 'LC',
      color: '#6A1B9A',
      consultationHours: [
        { day: 'Monday',    start: '08:00', end: '12:00' },
        { day: 'Wednesday', start: '09:00', end: '12:00' },
        { day: 'Friday',    start: '09:00', end: '17:00' },
      ],
      bufferTime: 10,
    },
    {
      id: 'fernandez',
      name: 'Dr. Isabel Fernandez',
      department: 'College of Nursing',
      specialization: 'Clinical Nursing',
      email: 'i.fernandez@pcu.edu.ph',
      initials: 'IF',
      color: '#C62828',
      consultationHours: [
        { day: 'Tuesday',   start: '08:00', end: '15:00' },
        { day: 'Thursday',  start: '08:00', end: '15:00' },
      ],
      bufferTime: 20,
    },
    {
      id: 'villar',
      name: 'Prof. Miguel Villar',
      department: 'College of Engineering',
      specialization: 'Civil Engineering',
      email: 'm.villar@pcu.edu.ph',
      initials: 'MV',
      color: '#E65100',
      consultationHours: [
        { day: 'Monday',    start: '09:00', end: '16:00' },
        { day: 'Wednesday', start: '09:00', end: '16:00' },
      ],
      bufferTime: 15,
    },
  ];

  // ─── State ────────────────────────────────────────────
  let bookings = [];
  let notificationQueue = [];

  // ─── Helpers ──────────────────────────────────────────
  function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(m) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function formatTime12(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }

  function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  }

  function getDayOfWeek(dateStr) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getProfessor(id) {
    return PROFESSORS.find(function (p) { return p.id === id; });
  }

  // ─── Persistence ──────────────────────────────────────
  function loadState() {
    try {
      bookings = JSON.parse(localStorage.getItem('pcu_bookings')) || [];
      notificationQueue = JSON.parse(localStorage.getItem('pcu_notifications')) || [];
    } catch (e) {
      bookings = [];
      notificationQueue = [];
    }
  }

  function saveBookings() {
    localStorage.setItem('pcu_bookings', JSON.stringify(bookings));
  }

  function saveNotifications() {
    localStorage.setItem('pcu_notifications', JSON.stringify(notificationQueue));
  }

  function seedDemoData() {
    // Only seed once
    if (localStorage.getItem('pcu_seeded')) return;
    localStorage.setItem('pcu_seeded', '1');

    var today = new Date();
    // Create a few bookings for the next few days to demo conflict detection
    var d1 = new Date(today);
    d1.setDate(d1.getDate() + 1); // tomorrow
    while (d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() + 1);
    var date1 = d1.getFullYear() + '-' +
      String(d1.getMonth() + 1).padStart(2, '0') + '-' +
      String(d1.getDate()).padStart(2, '0');

    var d2 = new Date(today);
    d2.setDate(d2.getDate() + 2);
    while (d2.getDay() === 0 || d2.getDay() === 6) d2.setDate(d2.getDate() + 1);
    var date2 = d2.getFullYear() + '-' +
      String(d2.getMonth() + 1).padStart(2, '0') + '-' +
      String(d2.getDate()).padStart(2, '0');

    bookings.push({
      id: generateId(),
      professorId: 'delacruz',
      studentName: 'Ana Marie Reyes',
      studentId: '2023-005678',
      studentEmail: 'a.reyes@pcu.edu.ph',
      date: date1,
      startTime: '10:00',
      endTime: '10:30',
      purpose: 'Thesis proposal review',
      consultationType: 'thesis',
      mode: 'face-to-face',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    bookings.push({
      id: generateId(),
      professorId: 'delacruz',
      studentName: 'Mark Andrew Lim',
      studentId: '2024-002345',
      studentEmail: 'm.lim@pcu.edu.ph',
      date: date1,
      startTime: '11:00',
      endTime: '11:30',
      purpose: 'Grade inquiry',
      consultationType: 'grade',
      mode: 'online',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    bookings.push({
      id: generateId(),
      professorId: 'aguilar',
      studentName: 'Jasmine Cruz',
      studentId: '2025-001122',
      studentEmail: 'j.cruz@pcu.edu.ph',
      date: date2,
      startTime: '14:00',
      endTime: '14:30',
      purpose: 'Capstone project guidance',
      consultationType: 'thesis',
      mode: 'face-to-face',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    saveBookings();

    // Seed a few notifications
    notificationQueue.push({
      id: generateId(),
      type: 'confirmation',
      title: 'Booking Confirmed',
      message: 'Your consultation with Dr. Ricardo Dela Cruz on ' + formatDate(date1) + ' at 10:00 AM has been confirmed.',
      professorId: 'delacruz',
      professorName: 'Dr. Ricardo Dela Cruz',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    });

    notificationQueue.push({
      id: generateId(),
      type: 'decline',
      title: 'Request Declined — Conflict',
      message: 'Your meeting request with Dr. Carlos Aguilar was auto-declined due to a scheduling conflict. Please choose another time.',
      professorId: 'aguilar',
      professorName: 'Dr. Carlos Aguilar',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: false,
    });

    saveNotifications();
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ─── Conflict Detection Engine ────────────────────────
  function getProfessorBookingsOnDate(profId, date) {
    return bookings.filter(function (b) {
      return b.professorId === profId && b.date === date && b.status !== 'declined' && b.status !== 'cancelled';
    });
  }

  /**
   * Check if a proposed booking conflicts with existing bookings.
   * Considers buffer time before and after each existing booking.
   * Returns { conflict: boolean, conflictingBooking: object|null }
   */
  function hasConflict(profId, date, startTime, endTime, excludeBookingId) {
    var prof = getProfessor(profId);
    var buffer = prof ? prof.bufferTime : 15;
    var existing = getProfessorBookingsOnDate(profId, date);

    var pStart = timeToMinutes(startTime);
    var pEnd = timeToMinutes(endTime);

    for (var i = 0; i < existing.length; i++) {
      var b = existing[i];
      if (excludeBookingId && b.id === excludeBookingId) continue;

      var eStart = timeToMinutes(b.startTime);
      var eEnd = timeToMinutes(b.endTime);

      // Unavailable window: [eStart - buffer, eEnd + buffer]
      var blockStart = eStart - buffer;
      var blockEnd = eEnd + buffer;

      // Overlap check
      if (pStart < blockEnd && pEnd > blockStart) {
        return { conflict: true, conflictingBooking: b };
      }
    }

    return { conflict: false, conflictingBooking: null };
  }

  /**
   * Check if a professor is available on a given day of the week.
   */
  function getConsultationHoursForDay(profId, dayName) {
    var prof = getProfessor(profId);
    if (!prof) return [];
    return prof.consultationHours.filter(function (ch) {
      return ch.day === dayName;
    });
  }

  /**
   * Generate available time slots for a professor on a given date.
   * Duration in minutes (default 30).
   */
  function getAvailableSlots(profId, date, duration) {
    duration = duration || 30;
    var dayName = getDayOfWeek(date);
    var hours = getConsultationHoursForDay(profId, dayName);
    var allSlots = [];

    // Generate all possible slots within consultation hours
    for (var h = 0; h < hours.length; h++) {
      var start = timeToMinutes(hours[h].start);
      var end = timeToMinutes(hours[h].end);
      for (var t = start; t + duration <= end; t += duration) {
        allSlots.push({
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + duration),
        });
      }
    }

    // Filter out slots that conflict with existing bookings
    var available = [];
    for (var s = 0; s < allSlots.length; s++) {
      var slot = allSlots[s];
      var result = hasConflict(profId, date, slot.startTime, slot.endTime);
      slot.available = !result.conflict;
      slot.conflictingBooking = result.conflictingBooking;
      available.push(slot);
    }

    return available;
  }

  // ─── Booking Logic ────────────────────────────────────
  function requestMeeting(data) {
    var profId = data.professorId;
    var prof = getProfessor(profId);
    if (!prof) return { success: false, reason: 'Professor not found.' };

    var date = data.date;
    var startTime = data.startTime;
    var endTime = data.endTime;

    // Validate professor works that day
    var dayName = getDayOfWeek(date);
    var dayHours = getConsultationHoursForDay(profId, dayName);
    if (dayHours.length === 0) {
      return {
        success: false,
        reason: prof.name + ' does not hold consultation hours on ' + dayName + '.',
        suggestion: 'Please select a different date.',
      };
    }

    // Validate time is within consultation hours
    var inHours = false;
    for (var h = 0; h < dayHours.length; h++) {
      var chStart = timeToMinutes(dayHours[h].start);
      var chEnd = timeToMinutes(dayHours[h].end);
      var reqStart = timeToMinutes(startTime);
      var reqEnd = timeToMinutes(endTime);
      if (reqStart >= chStart && reqEnd <= chEnd) {
        inHours = true;
        break;
      }
    }
    if (!inHours) {
      return {
        success: false,
        reason: 'The selected time is outside ' + prof.name + '\'s consultation hours on ' + dayName + '.',
      };
    }

    // Check conflict
    var conflictResult = hasConflict(profId, date, startTime, endTime);

    if (conflictResult.conflict) {
      // Auto-decline
      var declinedBooking = {
        id: generateId(),
        professorId: profId,
        studentName: data.studentName || 'Unknown',
        studentId: data.studentId || '',
        studentEmail: data.studentEmail || '',
        date: date,
        startTime: startTime,
        endTime: endTime,
        purpose: data.purpose || '',
        consultationType: data.consultationType || 'other',
        mode: data.mode || 'face-to-face',
        status: 'declined',
        createdAt: new Date().toISOString(),
      };
      bookings.push(declinedBooking);
      saveBookings();

      // Add decline notification
      addNotification({
        type: 'decline',
        title: 'Request Auto-Declined — Scheduling Conflict',
        message: 'Your meeting request with ' + prof.name + ' on ' + formatDate(date) +
          ' at ' + formatTime12(startTime) + ' was auto-declined. ' +
          'The slot conflicts with "' + conflictResult.conflictingBooking.studentName +
          '" (' + formatTime12(conflictResult.conflictingBooking.startTime) +
          '–' + formatTime12(conflictResult.conflictingBooking.endTime) + ').' +
          ' Buffer time: ' + prof.bufferTime + ' min.',
        professorId: profId,
        professorName: prof.name,
      });

      // Get alternatives
      var slots = getAvailableSlots(profId, date, 30);
      var alternatives = slots.filter(function (s) { return s.available; }).slice(0, 4);

      return {
        success: false,
        autoDeclined: true,
        reason: 'Time slot conflicts with an existing booking. Buffer time: ' + prof.bufferTime + ' min.',
        conflictingWith: conflictResult.conflictingBooking.studentName,
        alternatives: alternatives,
      };
    }

    // No conflict — confirm
    var confirmedBooking = {
      id: generateId(),
      professorId: profId,
      studentName: data.studentName || 'Unknown',
      studentId: data.studentId || '',
      studentEmail: data.studentEmail || '',
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: data.purpose || '',
      consultationType: data.consultationType || 'other',
      mode: data.mode || 'face-to-face',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    bookings.push(confirmedBooking);
    saveBookings();

    addNotification({
      type: 'confirmation',
      title: 'Booking Confirmed',
      message: 'Your consultation with ' + prof.name + ' on ' + formatDate(date) +
        ' at ' + formatTime12(startTime) + '–' + formatTime12(endTime) +
        ' has been confirmed. ' + prof.bufferTime + ' min buffer applied. A reminder will be sent 1 hour before.',
      professorId: profId,
      professorName: prof.name,
    });

    return { success: true, booking: confirmedBooking };
  }

  // ─── Notification Queue ──────────────────────────────
  function addNotification(data) {
    var notif = {
      id: generateId(),
      type: data.type || 'info',
      title: data.title || 'Notification',
      message: data.message || '',
      professorId: data.professorId || '',
      professorName: data.professorName || '',
      timestamp: new Date().toISOString(),
      read: false,
    };
    notificationQueue.unshift(notif);
    saveNotifications();

    // Update UI
    renderNotificationPanel();
    updateBellBadge();
    showToast(data.title, data.type);
  }

  function markAllRead() {
    notificationQueue.forEach(function (n) { n.read = true; });
    saveNotifications();
    updateBellBadge();
    renderNotificationPanel();
  }

  function getUnreadCount() {
    return notificationQueue.filter(function (n) { return !n.read; }).length;
  }

  function timeAgo(isoStr) {
    var diff = Date.now() - new Date(isoStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  // ─── Rendering ────────────────────────────────────────

  function renderProfessorDirectory() {
    var container = document.getElementById('directory-grid');
    if (!container) return;
    container.innerHTML = '';

    PROFESSORS.forEach(function (prof) {
      var card = document.createElement('div');
      card.className = 'prof-card';

      var statusText = '';
      var statusClass = '';
      var today = todayStr();
      var dayName = getDayOfWeek(today);
      var todayHours = getConsultationHoursForDay(prof.id, dayName);

      if (todayHours.length > 0) {
        var now = new Date();
        var nowMin = now.getHours() * 60 + now.getMinutes();
        var inSession = todayHours.some(function (h) {
          return nowMin >= timeToMinutes(h.start) && nowMin < timeToMinutes(h.end);
        });
        if (inSession) {
          statusText = 'Available Now';
          statusClass = 'prof-card__status--available';
        } else {
          statusText = 'Available Today';
          statusClass = 'prof-card__status--today';
        }
      } else {
        // Find next available day
        var nextDay = findNextAvailableDay(prof.id);
        if (nextDay) {
          statusText = 'Next: ' + nextDay;
          statusClass = 'prof-card__status--upcoming';
        } else {
          statusText = 'By Appointment';
          statusClass = 'prof-card__status--appointment';
        }
      }

      // Build consultation hours display
      var hoursHTML = prof.consultationHours.map(function (ch) {
        return '<span class="prof-card__hour-chip">' + ch.day.substr(0, 3) + ' ' +
          formatTime12(ch.start) + '–' + formatTime12(ch.end) + '</span>';
      }).join('');

      card.innerHTML =
        '<div class="prof-card__top">' +
          '<div class="prof-card__avatar" style="background:' + prof.color + '">' + prof.initials + '</div>' +
          '<div class="prof-card__head">' +
            '<h3 class="prof-card__name">' + prof.name + '</h3>' +
            '<p class="prof-card__spec">' + prof.specialization + '</p>' +
            '<p class="prof-card__dept">' + prof.department + '</p>' +
          '</div>' +
          '<span class="prof-card__status ' + statusClass + '">' + statusText + '</span>' +
        '</div>' +
        '<div class="prof-card__hours">' +
          '<span class="prof-card__hours-label">Consultation Hours:</span>' +
          '<div class="prof-card__hours-chips">' + hoursHTML + '</div>' +
        '</div>' +
        '<div class="prof-card__meta">' +
          '<span class="prof-card__meta-item">🕐 Buffer: ' + prof.bufferTime + ' min</span>' +
          '<span class="prof-card__meta-item">📧 ' + prof.email + '</span>' +
        '</div>' +
        '<button class="prof-card__book-btn" data-prof-id="' + prof.id + '">' +
          '📅 Request Meeting' +
        '</button>';

      container.appendChild(card);
    });

    // Attach button listeners
    container.querySelectorAll('.prof-card__book-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var profId = this.getAttribute('data-prof-id');
        openRequestModal(profId);
      });
    });
  }

  function findNextAvailableDay(profId) {
    var prof = getProfessor(profId);
    if (!prof) return null;
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (var i = 1; i <= 7; i++) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      var dn = dayNames[d.getDay()];
      if (prof.consultationHours.some(function (ch) { return ch.day === dn; })) {
        return dn;
      }
    }
    return null;
  }

  function renderNotificationPanel() {
    var list = document.getElementById('notif-list');
    if (!list) return;

    if (notificationQueue.length === 0) {
      list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }

    list.innerHTML = notificationQueue.map(function (n) {
      var iconMap = {
        confirmation: '✅',
        decline: '❌',
        request: '📩',
        reminder: '⏰',
        info: 'ℹ️',
      };
      var icon = iconMap[n.type] || '🔔';
      return '<div class="notif-item' + (n.read ? '' : ' notif-item--unread') + '">' +
        '<span class="notif-item__icon">' + icon + '</span>' +
        '<div class="notif-item__body">' +
          '<p class="notif-item__title">' + n.title + '</p>' +
          '<p class="notif-item__msg">' + n.message + '</p>' +
          '<span class="notif-item__time">' + timeAgo(n.timestamp) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    // Mark all as read button
    list.insertAdjacentHTML('beforeend',
      '<button class="notif-clear-btn" id="notif-clear-btn">Mark All as Read</button>');
    var clearBtn = document.getElementById('notif-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', markAllRead);
  }

  function updateBellBadge() {
    var badge = document.getElementById('notif-badge');
    if (!badge) return;
    var count = getUnreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // ─── Modal ────────────────────────────────────────────
  function openRequestModal(profId) {
    var prof = getProfessor(profId);
    if (!prof) return;

    var modal = document.getElementById('request-modal');
    if (!modal) return;

    document.getElementById('modal-prof-name').textContent = prof.name;
    document.getElementById('modal-prof-dept').textContent = prof.department;
    document.getElementById('modal-prof-avatar').textContent = prof.initials;
    document.getElementById('modal-prof-avatar').style.background = prof.color;
    document.getElementById('modal-prof-id').value = profId;

    // Reset form
    document.getElementById('modal-student-name').value = '';
    document.getElementById('modal-student-id').value = '';
    document.getElementById('modal-student-email').value = '';
    document.getElementById('modal-date').value = '';
    document.getElementById('modal-purpose').value = '';
    document.getElementById('modal-notes').value = '';

    // Reset time slots
    var slotContainer = document.getElementById('modal-time-slots');
    slotContainer.innerHTML = '<p class="modal-time-hint">Select a date to view available time slots.</p>';

    // Hide feedback
    document.getElementById('modal-feedback').innerHTML = '';
    document.getElementById('modal-feedback').style.display = 'none';

    modal.classList.add('modal--visible');
    document.body.classList.add('body--modal-open');
  }

  function closeRequestModal() {
    var modal = document.getElementById('request-modal');
    if (modal) {
      modal.classList.remove('modal--visible');
      document.body.classList.remove('body--modal-open');
    }
  }

  function updateModalTimeSlots() {
    var profId = document.getElementById('modal-prof-id').value;
    var date = document.getElementById('modal-date').value;
    var slotContainer = document.getElementById('modal-time-slots');
    if (!profId || !date) {
      slotContainer.innerHTML = '<p class="modal-time-hint">Select a date to view available time slots.</p>';
      return;
    }

    var slots = getAvailableSlots(profId, date, 30);
    if (slots.length === 0) {
      var dayName = getDayOfWeek(date);
      slotContainer.innerHTML = '<p class="modal-time-hint modal-time-hint--warn">' +
        'No consultation hours on ' + dayName + '. Please select a different date.</p>';
      return;
    }

    var html = '';
    var hasAvailable = false;
    slots.forEach(function (slot) {
      var label = formatTime12(slot.startTime) + ' – ' + formatTime12(slot.endTime);
      if (slot.available) {
        hasAvailable = true;
        html += '<label class="modal-slot-pill modal-slot-pill--free">' +
          '<input type="radio" name="modal_time_slot" value="' + slot.startTime + '|' + slot.endTime + '" class="modal-slot-pill__radio">' +
          '<span class="modal-slot-pill__label">' + label + ' <em>Available</em></span>' +
        '</label>';
      } else {
        html += '<label class="modal-slot-pill modal-slot-pill--blocked">' +
          '<span class="modal-slot-pill__label">' + label + ' <em>Booked</em></span>' +
        '</label>';
      }
    });

    if (!hasAvailable) {
      html += '<p class="modal-time-hint modal-time-hint--warn">All slots are booked for this date. Try another day.</p>';
    }

    slotContainer.innerHTML = html;
  }

  function handleModalSubmit(e) {
    e.preventDefault();

    var profId = document.getElementById('modal-prof-id').value;
    var studentName = document.getElementById('modal-student-name').value.trim();
    var studentId = document.getElementById('modal-student-id').value.trim();
    var studentEmail = document.getElementById('modal-student-email').value.trim();
    var date = document.getElementById('modal-date').value;
    var purpose = document.getElementById('modal-purpose').value;
    var notes = document.getElementById('modal-notes').value.trim();

    // Validate
    if (!studentName || !studentId || !studentEmail || !date) {
      showFeedback('Please fill all required fields.', 'error');
      return;
    }

    var slotRadio = document.querySelector('input[name="modal_time_slot"]:checked');
    if (!slotRadio) {
      showFeedback('Please select a time slot.', 'error');
      return;
    }

    var times = slotRadio.value.split('|');
    var startTime = times[0];
    var endTime = times[1];

    var result = requestMeeting({
      professorId: profId,
      studentName: studentName,
      studentId: studentId,
      studentEmail: studentEmail,
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: purpose + (notes ? ' — ' + notes : ''),
      consultationType: 'other',
    });

    if (result.success) {
      showFeedback('Booking confirmed! A notification has been sent.', 'success');
      // Clear form after a moment
      setTimeout(function () {
        closeRequestModal();
        renderProfessorDirectory();
        renderNotificationPanel();
        updateBellBadge();
      }, 1500);
    } else if (result.autoDeclined) {
      var altHTML = '';
      if (result.alternatives && result.alternatives.length > 0) {
        altHTML = '<p style="margin-top:0.6rem;"><strong>Suggested alternatives:</strong></p><ul>';
        result.alternatives.forEach(function (a) {
          altHTML += '<li>' + formatTime12(a.startTime) + ' – ' + formatTime12(a.endTime) + '</li>';
        });
        altHTML += '</ul>';
      }
      showFeedback(
        '⚠️ Auto-declined: ' + result.reason + ' (Conflict with: ' + result.conflictingWith + ')' + altHTML,
        'error'
      );
    } else {
      showFeedback(result.reason, 'error');
    }
  }

  function showFeedback(msg, type) {
    var fb = document.getElementById('modal-feedback');
    if (!fb) return;
    fb.innerHTML = msg;
    fb.className = 'modal-feedback modal-feedback--' + (type || 'info');
    fb.style.display = 'block';
  }

  // ─── Toast Notifications ──────────────────────────────
  function showToast(title, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var icons = { confirmation: '✅', decline: '❌', request: '📩', reminder: '⏰', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.innerHTML = '<span class="toast__icon">' + (icons[type] || '🔔') + '</span>' +
      '<span class="toast__text">' + title + '</span>';
    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast--out');
      setTimeout(function () { toast.remove(); }, 400);
    }, 3500);
  }

  // ─── Tab Switching ────────────────────────────────────
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('tab-btn--active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('tab-panel--active', panel.getAttribute('data-tab') === tabName);
    });
  }

  // ─── Notification Panel Toggle ────────────────────────
  function toggleNotifPanel() {
    var panel = document.getElementById('notif-panel');
    if (!panel) return;
    var isOpen = panel.classList.contains('notif-panel--open');
    if (isOpen) {
      panel.classList.remove('notif-panel--open');
    } else {
      panel.classList.add('notif-panel--open');
    }
  }

  // ─── Main Form Integration ────────────────────────────
  function handleMainFormSubmit(e) {
    e.preventDefault();

    var profId = document.getElementById('faculty-select').value;
    var studentName = document.getElementById('student-name').value.trim();
    var studentId = document.getElementById('student-id').value.trim();
    var studentEmail = document.getElementById('student-email').value.trim();
    var date = document.getElementById('consultation-date').value;
    var consultationType = document.getElementById('consultation-type').value;
    var purpose = document.getElementById('concern-subject').value.trim();
    var notes = document.getElementById('additional-notes').value.trim();
    var modeRadio = document.querySelector('input[name="consultation_mode"]:checked');
    var mode = modeRadio ? modeRadio.value : 'face-to-face';
    var slotRadio = document.querySelector('input[name="time_slot"]:checked');

    if (!studentName || !studentId || !studentEmail || !date || !profId || !slotRadio) {
      showToast('Please fill all required fields in the booking form.', 'info');
      return;
    }

    var slotValue = slotRadio.value;
    var times = slotValue.split('-');
    var startTime = times[0];
    var endTime = times[1];

    // Convert from "8:00" format to "08:00" if needed
    function padTime(t) {
      var parts = t.split(':');
      return String(parts[0]).padStart(2, '0') + ':' + parts[1];
    }
    startTime = padTime(startTime);
    endTime = padTime(endTime);

    var result = requestMeeting({
      professorId: profId,
      studentName: studentName,
      studentId: studentId,
      studentEmail: studentEmail,
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: purpose + (notes ? ' — ' + notes : ''),
      consultationType: consultationType,
      mode: mode,
    });

    if (result.success) {
      showToast('Booking confirmed! Check notifications for details.', 'confirmation');
      document.querySelector('.booking-form').reset();
      renderProfessorDirectory();
      renderNotificationPanel();
      updateBellBadge();
      suggestTimeSlotsInMainForm();
    } else if (result.autoDeclined) {
      var altMsg = '';
      if (result.alternatives && result.alternatives.length > 0) {
        altMsg = ' Try: ' + result.alternatives.map(function (a) {
          return formatTime12(a.startTime);
        }).join(', ');
      }
      showToast('Auto-declined: conflict with ' + result.conflictingWith + '.' + altMsg, 'decline');
      renderNotificationPanel();
      updateBellBadge();
      suggestTimeSlotsInMainForm();
    } else {
      showToast(result.reason, 'info');
    }
  }

  /**
   * Dynamically update time slot pills in the main form based on
   * selected professor and date.
   */
  function suggestTimeSlotsInMainForm() {
    var profId = document.getElementById('faculty-select').value;
    var date = document.getElementById('consultation-date').value;
    if (!profId || !date) return;

    var slots = getAvailableSlots(profId, date, 30);
    var allPills = document.querySelectorAll('.time-slot-pill');

    allPills.forEach(function (pill) {
      var radio = pill.querySelector('input[type="radio"]');
      if (!radio) return;
      var val = radio.value;
      var parts = val.split('-');
      var pad = function (t) {
        var p = t.split(':');
        return String(p[0]).padStart(2, '0') + ':' + p[1];
      };
      var startTime = pad(parts[0]);
      var endTime = pad(parts[1]);

      var slotData = slots.find(function (s) {
        return s.startTime === startTime && s.endTime === endTime;
      });

      var label = pill.querySelector('.time-slot-pill__label');
      if (!slotData) {
        // Slot not in professor's hours for this day
        pill.style.display = 'none';
      } else if (!slotData.available) {
        pill.style.display = 'inline-block';
        pill.style.opacity = '0.4';
        pill.style.pointerEvents = 'none';
        radio.disabled = true;
        if (label) label.style.textDecoration = 'line-through';
      } else {
        pill.style.display = 'inline-block';
        pill.style.opacity = '1';
        pill.style.pointerEvents = 'auto';
        radio.disabled = false;
        if (label) label.style.textDecoration = 'none';
      }
    });
  }

  // ─── Event Wiring ─────────────────────────────────────
  function attachEventListeners() {
    // Notification bell
    var bell = document.getElementById('notif-bell');
    if (bell) bell.addEventListener('click', toggleNotifPanel);

    // Close notification panel when clicking outside
    document.addEventListener('click', function (e) {
      var panel = document.getElementById('notif-panel');
      var bell = document.getElementById('notif-bell');
      if (panel && bell && panel.classList.contains('notif-panel--open')) {
        if (!panel.contains(e.target) && !bell.contains(e.target)) {
          panel.classList.remove('notif-panel--open');
        }
      }
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // Modal close buttons
    var modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', closeRequestModal);

    var modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', closeRequestModal);

    // Close modal on backdrop click
    var modal = document.getElementById('request-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeRequestModal();
      });
    }

    // Close modal on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeRequestModal();
    });

    // Modal date change → update slots
    var modalDate = document.getElementById('modal-date');
    if (modalDate) modalDate.addEventListener('change', updateModalTimeSlots);

    // Modal submit
    var modalForm = document.getElementById('modal-form');
    if (modalForm) modalForm.addEventListener('submit', handleModalSubmit);

    // Main form submit
    var mainForm = document.querySelector('.booking-form');
    if (mainForm) mainForm.addEventListener('submit', handleMainFormSubmit);

    // Main form: professor or date change → update slot availability
    var facSelect = document.getElementById('faculty-select');
    var dateInput = document.getElementById('consultation-date');
    if (facSelect) facSelect.addEventListener('change', suggestTimeSlotsInMainForm);
    if (dateInput) dateInput.addEventListener('change', suggestTimeSlotsInMainForm);

    // Set min date to tomorrow
    if (dateInput) {
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];
    }
    if (modalDate) {
      var t2 = new Date();
      t2.setDate(t2.getDate() + 1);
      modalDate.min = t2.toISOString().split('T')[0];
    }
  }

  // ─── Initialization ───────────────────────────────────
  function init() {
    loadState();
    seedDemoData();
    renderProfessorDirectory();
    renderNotificationPanel();
    updateBellBadge();
    attachEventListeners();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
