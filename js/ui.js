/* ============================================
   PCU Quick-Book — UI Layer
   Rendering, modals, toasts, tabs
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Professor Directory ──────────────────────────
  PCU.renderProfessorDirectory = function () {
    var container = document.getElementById('directory-grid');
    if (!container) return;
    container.innerHTML = '';

    PCU.PROFESSORS.forEach(function (prof) {
      var card = document.createElement('div');
      card.className = 'prof-card';

      var today = PCU.todayStr();
      var dayName = PCU.getDayOfWeek(today);
      var todayHours = PCU.getConsultationHoursForDay(prof.id, dayName);
      var statusText = '', statusClass = '';

      if (todayHours.length > 0) {
        var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        var inSession = todayHours.some(function (h) { return nowMin >= PCU.timeToMinutes(h.start) && nowMin < PCU.timeToMinutes(h.end); });
        statusText = inSession ? 'Available Now' : 'Available Today';
        statusClass = inSession ? 'prof-card__status--available' : 'prof-card__status--today';
      } else {
        var nextDay = PCU.findNextAvailableDay(prof.id);
        statusText = nextDay ? 'Next: ' + nextDay : 'By Appointment';
        statusClass = nextDay ? 'prof-card__status--upcoming' : 'prof-card__status--appointment';
      }

      var hoursHTML = prof.consultationHours.map(function (ch) {
        return '<span class="prof-card__hour-chip">' + ch.day.substr(0, 3) + ' ' + PCU.formatTime12(ch.start) + '\u2013' + PCU.formatTime12(ch.end) + '</span>';
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
        '<div class="prof-card__hours"><span class="prof-card__hours-label">Consultation Hours:</span>' +
          '<div class="prof-card__hours-chips">' + hoursHTML + '</div></div>' +
        '<div class="prof-card__meta">' +
          '<span class="prof-card__meta-item">\uD83D\uDD50 Buffer: ' + prof.bufferTime + ' min</span>' +
          '<span class="prof-card__meta-item">\uD83D\uDCE7 ' + prof.email + '</span>' +
        '</div>' +
        '<button class="prof-card__book-btn" data-prof-id="' + prof.id + '">\uD83D\uDCC5 Request Meeting</button>';
      container.appendChild(card);
    });

    container.querySelectorAll('.prof-card__book-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { PCU.openRequestModal(this.getAttribute('data-prof-id')); });
    });
  };

  // ─── Modal ─────────────────────────────────────────
  PCU.openRequestModal = function (profId) {
    var prof = PCU.getProfessor(profId);
    if (!prof) return;
    var modal = document.getElementById('request-modal');
    if (!modal) return;

    document.getElementById('modal-prof-name').textContent = prof.name;
    document.getElementById('modal-prof-dept').textContent = prof.department;
    document.getElementById('modal-prof-avatar').textContent = prof.initials;
    document.getElementById('modal-prof-avatar').style.background = prof.color;
    document.getElementById('modal-prof-id').value = profId;
    ['modal-student-name','modal-student-id','modal-student-email','modal-date','modal-purpose','modal-notes'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('modal-time-slots').innerHTML = '<p class="modal-time-hint">Select a date to view available time slots.</p>';
    document.getElementById('modal-feedback').innerHTML = '';
    document.getElementById('modal-feedback').style.display = 'none';
    modal.classList.add('modal--visible');
    document.body.classList.add('body--modal-open');
  };

  PCU.closeRequestModal = function () {
    var modal = document.getElementById('request-modal');
    if (modal) { modal.classList.remove('modal--visible'); document.body.classList.remove('body--modal-open'); }
  };

  PCU.updateModalTimeSlots = function () {
    var profId = document.getElementById('modal-prof-id').value;
    var date = document.getElementById('modal-date').value;
    var container = document.getElementById('modal-time-slots');
    if (!profId || !date) { container.innerHTML = '<p class="modal-time-hint">Select a date to view available time slots.</p>'; return; }

    var slots = PCU.getAvailableSlots(profId, date, 30);
    if (slots.length === 0) {
      container.innerHTML = '<p class="modal-time-hint modal-time-hint--warn">No hours on ' + PCU.getDayOfWeek(date) + '.</p>';
      return;
    }

    var html = '', hasAvail = false;
    slots.forEach(function (s) {
      var label = PCU.formatTime12(s.startTime) + ' \u2013 ' + PCU.formatTime12(s.endTime);
      if (s.available) {
        hasAvail = true;
        html += '<label class="modal-slot-pill modal-slot-pill--free"><input type="radio" name="modal_time_slot" value="' + s.startTime + '|' + s.endTime + '" class="modal-slot-pill__radio"><span class="modal-slot-pill__label">' + label + ' <em>Available</em></span></label>';
      } else {
        html += '<label class="modal-slot-pill modal-slot-pill--blocked"><span class="modal-slot-pill__label">' + label + ' <em>Booked</em></span></label>';
      }
    });
    if (!hasAvail) html += '<p class="modal-time-hint modal-time-hint--warn">All slots booked. Try another day.</p>';
    container.innerHTML = html;
  };

  PCU.handleModalSubmit = function (e) {
    e.preventDefault();
    var profId = document.getElementById('modal-prof-id').value;
    var studentName = document.getElementById('modal-student-name').value.trim();
    var studentId = document.getElementById('modal-student-id').value.trim();
    var studentEmail = document.getElementById('modal-student-email').value.trim();
    var date = document.getElementById('modal-date').value;
    var purpose = document.getElementById('modal-purpose').value;
    var notes = document.getElementById('modal-notes').value.trim();

    if (!studentName || !studentId || !studentEmail || !date) { PCU.showFeedback('Please fill all required fields.', 'error'); return; }
    var radio = document.querySelector('input[name="modal_time_slot"]:checked');
    if (!radio) { PCU.showFeedback('Please select a time slot.', 'error'); return; }
    var times = radio.value.split('|');

    var result = PCU.requestMeeting({
      professorId: profId, studentName: studentName, studentId: studentId, studentEmail: studentEmail,
      date: date, startTime: times[0], endTime: times[1],
      purpose: purpose + (notes ? ' \u2014 ' + notes : ''), consultationType: 'other'
    });

    if (result.success) {
      PCU.showFeedback('Booking confirmed! Notification sent.', 'success');
      setTimeout(function () { PCU.closeRequestModal(); PCU.renderProfessorDirectory(); PCU.renderNotificationPanel(); PCU.updateBellBadge(); }, 1500);
    } else if (result.autoDeclined) {
      var altHTML = '';
      if (result.alternatives && result.alternatives.length > 0) {
        altHTML = '<p style="margin-top:0.6rem;"><strong>Suggested alternatives:</strong></p><ul>';
        result.alternatives.forEach(function (a) { altHTML += '<li>' + PCU.formatTime12(a.startTime) + ' \u2013 ' + PCU.formatTime12(a.endTime) + '</li>'; });
        altHTML += '</ul>';
      }
      PCU.showFeedback('\u26A0\uFE0F Auto-declined: ' + result.reason + ' (Conflict: ' + result.conflictingWith + ')' + altHTML, 'error');
    } else {
      PCU.showFeedback(result.reason, 'error');
    }
  };

  PCU.showFeedback = function (msg, type) {
    var fb = document.getElementById('modal-feedback');
    if (!fb) return;
    fb.innerHTML = msg;
    fb.className = 'modal-feedback modal-feedback--' + (type || 'info');
    fb.style.display = 'block';
  };

  // ─── Toast ─────────────────────────────────────────
  PCU.showToast = function (title, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var icons = { confirmation: '\u2705', decline: '\u274C', request: '\uD83D\uDCE9', reminder: '\u23F0', info: '\u2139\uFE0F' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.innerHTML = '<span class="toast__icon">' + (icons[type] || '\uD83D\uDD14') + '</span><span class="toast__text">' + title + '</span>';
    container.appendChild(toast);
    setTimeout(function () { toast.classList.add('toast--out'); setTimeout(function () { toast.remove(); }, 400); }, 3500);
  };

  // ─── Tabs ──────────────────────────────────────────
  PCU.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('tab-btn--active', b.getAttribute('data-tab') === tabName); });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('tab-panel--active', p.getAttribute('data-tab') === tabName); });
  };

  // ─── Notification Panel Toggle ─────────────────────
  PCU.toggleNotifPanel = function () {
    var panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.toggle('notif-panel--open');
  };

  // ─── Main Form Integration ─────────────────────────
  PCU.handleMainFormSubmit = function (e) {
    e.preventDefault();
    var profId = document.getElementById('faculty-select').value;
    var studentName = document.getElementById('student-name').value.trim();
    var studentId = document.getElementById('student-id').value.trim();
    var studentEmail = document.getElementById('student-email').value.trim();
    var date = document.getElementById('consultation-date').value;
    var cType = document.getElementById('consultation-type').value;
    var purpose = document.getElementById('concern-subject').value.trim();
    var notes = document.getElementById('additional-notes').value.trim();
    var modeRadio = document.querySelector('input[name="consultation_mode"]:checked');
    var slotRadio = document.querySelector('input[name="time_slot"]:checked');

    if (!studentName || !studentId || !studentEmail || !date || !profId || !slotRadio) {
      PCU.showToast('Please fill all required fields.', 'info'); return;
    }
    var times = slotRadio.value.split('-');
    var pad = function (t) { var p = t.split(':'); return String(p[0]).padStart(2,'0') + ':' + p[1]; };

    var result = PCU.requestMeeting({
      professorId: profId, studentName: studentName, studentId: studentId, studentEmail: studentEmail,
      date: date, startTime: pad(times[0]), endTime: pad(times[1]),
      purpose: purpose + (notes ? ' \u2014 ' + notes : ''),
      consultationType: cType, mode: modeRadio ? modeRadio.value : 'face-to-face'
    });

    if (result.success) {
      PCU.showToast('Booking confirmed!', 'confirmation');
      document.querySelector('.booking-form').reset();
      PCU.renderProfessorDirectory(); PCU.renderNotificationPanel(); PCU.updateBellBadge(); PCU.suggestTimeSlotsInMainForm();
    } else if (result.autoDeclined) {
      var altMsg = result.alternatives && result.alternatives.length > 0 ? ' Try: ' + result.alternatives.map(function (a) { return PCU.formatTime12(a.startTime); }).join(', ') : '';
      PCU.showToast('Auto-declined: conflict with ' + result.conflictingWith + '.' + altMsg, 'decline');
      PCU.renderNotificationPanel(); PCU.updateBellBadge(); PCU.suggestTimeSlotsInMainForm();
    } else {
      PCU.showToast(result.reason, 'info');
    }
  };

  PCU.suggestTimeSlotsInMainForm = function () {
    var profId = document.getElementById('faculty-select').value;
    var date = document.getElementById('consultation-date').value;
    if (!profId || !date) return;
    var slots = PCU.getAvailableSlots(profId, date, 30);

    document.querySelectorAll('.time-slot-pill').forEach(function (pill) {
      var radio = pill.querySelector('input[type="radio"]');
      if (!radio) return;
      var parts = radio.value.split('-');
      var pad = function (t) { var p = t.split(':'); return String(p[0]).padStart(2,'0') + ':' + p[1]; };
      var st = pad(parts[0]), et = pad(parts[1]);
      var slotData = slots.find(function (s) { return s.startTime === st && s.endTime === et; });
      var label = pill.querySelector('.time-slot-pill__label');
      if (!slotData) { pill.style.display = 'none'; }
      else if (!slotData.available) {
        pill.style.display = 'inline-block'; pill.style.opacity = '0.4'; pill.style.pointerEvents = 'none';
        radio.disabled = true; if (label) label.style.textDecoration = 'line-through';
      } else {
        pill.style.display = 'inline-block'; pill.style.opacity = '1'; pill.style.pointerEvents = 'auto';
        radio.disabled = false; if (label) label.style.textDecoration = 'none';
      }
    });
  };
})();
