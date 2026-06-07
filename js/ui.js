/* ============================================
   PCU Quick-Book — UI Layer
   Rendering, modals, toasts, tabs
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Directory Filter State ───────────────────────
  PCU._dirFilter = { search: '', department: '', sort: 'name-asc', date: '' };

  PCU.getFilteredProfessors = function () {
    var filter = PCU._dirFilter;
    var profs = PCU.PROFESSORS.slice();

    if (filter.search) {
      var q = filter.search.toLowerCase();
      profs = profs.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 ||
               p.department.toLowerCase().indexOf(q) !== -1 ||
               p.specialization.toLowerCase().indexOf(q) !== -1;
      });
    }

    if (filter.department) {
      profs = profs.filter(function (p) { return p.department === filter.department; });
    }

    var dayOrder = { Sunday: 7, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    switch (filter.sort) {
      case 'name-asc':
        profs.sort(function (a, b) { return a.name.localeCompare(b.name); });
        break;
      case 'dept-asc':
        profs.sort(function (a, b) {
          return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
        });
        break;
      case 'available':
        profs.sort(function (a, b) {
          var nextA = PCU.findNextAvailableDay(a.id);
          var nextB = PCU.findNextAvailableDay(b.id);
          if (!nextA && !nextB) return 0;
          if (!nextA) return 1;
          if (!nextB) return -1;
          return (dayOrder[nextA] || 8) - (dayOrder[nextB] || 8);
        });
        break;
    }
    return profs;
  };

  // ─── Professor Directory ──────────────────────────
  PCU.renderProfessorDirectory = async function () {
    var container = document.getElementById('directory-grid');
    if (!container) return;

    // Show loading state
    container.innerHTML = '<div class="directory-empty"><span class="directory-empty__icon">&#x23F3;</span><p>Loading faculty...</p></div>';

    // Ensure faculty is loaded
    if (PCU.PROFESSORS.length === 0) {
      await PCU.fetchFaculty();
    }

    var profs = PCU.getFilteredProfessors();
    var availDate = PCU._dirFilter.date;
    var resultsInfo = document.getElementById('directory-results-info');

    if (profs.length === 0) {
      container.innerHTML = '<div class="directory-empty"><span class="directory-empty__icon">&#x1F50D;</span><p>No professors match your search.</p><p class="directory-empty__hint">Try a different name, department, or clear the filters.</p></div>';
      if (resultsInfo) resultsInfo.innerHTML = '';
      return;
    }

    if (resultsInfo) {
      var label = availDate ? ' on ' + PCU.formatDate(availDate) : '';
      resultsInfo.innerHTML = '<span class="directory-results-info__count">' + profs.length + ' professor' + (profs.length !== 1 ? 's' : '') + ' found' + label + '</span>';
    }

    container.innerHTML = '';

    profs.forEach(function (prof) {
      var card = document.createElement('div');
      card.className = 'prof-card';

      var statusText = '', statusClass = '';

      if (availDate) {
        // Bulk-availability mode: show per-date slot count
        var dayName = PCU.getDayOfWeek(availDate);
        var slots = PCU.getAvailableSlots(prof.id, availDate, 30);
        var totalSlots = slots.length;
        var availCount = slots.filter(function (s) { return s.available; }).length;

        if (totalSlots === 0) {
          statusText = 'Off Day';
          statusClass = 'prof-card__status--appointment';
        } else if (availCount === 0) {
          statusText = 'Fully Booked';
          statusClass = 'prof-card__status--appointment';
        } else {
          statusText = availCount + ' slot' + (availCount !== 1 ? 's' : '') + ' open';
          statusClass = availCount <= 2 ? 'prof-card__status--upcoming' : 'prof-card__status--available';
        }
      } else {
        // Default mode: today's availability
        var today = PCU.todayStr();
        var dayNameToday = PCU.getDayOfWeek(today);
        var todayHours = PCU.getConsultationHoursForDay(prof.id, dayNameToday);

        if (todayHours.length > 0) {
          var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
          var inSession = todayHours.some(function (h) {
            return nowMin >= PCU.timeToMinutes(h.start) && nowMin < PCU.timeToMinutes(h.end);
          });
          statusText = inSession ? 'Available Now' : 'Available Today';
          statusClass = inSession ? 'prof-card__status--available' : 'prof-card__status--today';
        } else {
          var nextDay = PCU.findNextAvailableDay(prof.id);
          statusText = nextDay ? 'Next: ' + nextDay : 'By Appointment';
          statusClass = nextDay ? 'prof-card__status--upcoming' : 'prof-card__status--appointment';
        }
      }

      var hoursHTML = prof.consultationHours.map(function (ch) {
        var label = '';
        if (ch.date) {
          label = PCU.formatDateShort(ch.date) + ' ' + ch.day.substr(0, 3) + ' ' + PCU.formatTime12(ch.start) + '\u2013' + PCU.formatTime12(ch.end);
        } else {
          label = ch.day.substr(0, 3) + ' ' + PCU.formatTime12(ch.start) + '\u2013' + PCU.formatTime12(ch.end);
        }
        return '<span class="prof-card__hour-chip">' + label + '</span>';
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

  // ─── Top Bar Navigation ───────────────────────────
  PCU.initTopBar = function () {
    var toggle = document.getElementById('top-bar-toggle');
    var nav = document.getElementById('top-bar-nav');
    var overlay = document.getElementById('top-bar-overlay');
    if (!toggle || !nav) return;

    function open() {
      nav.classList.add('top-bar__nav--open');
      toggle.classList.add('top-bar__toggle--open');
      toggle.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.classList.add('top-bar__overlay--visible');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      nav.classList.remove('top-bar__nav--open');
      toggle.classList.remove('top-bar__toggle--open');
      toggle.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('top-bar__overlay--visible');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      nav.classList.contains('top-bar__nav--open') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('top-bar__nav--open')) close();
    });

    // Close mobile nav when a link inside it is clicked
    nav.querySelectorAll('.top-bar__link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (nav.classList.contains('top-bar__nav--open')) close();
      });
    });
  };

  // ─── Directory Controls ───────────────────────────
  PCU.initDirectoryControls = function () {
    var searchInput = document.getElementById('dir-search-input');
    var searchClear = document.getElementById('dir-search-clear');
    var deptFilter = document.getElementById('dir-dept-filter');
    var sortSelect = document.getElementById('dir-sort-select');
    var availDate = document.getElementById('dir-avail-date');
    var availClear = document.getElementById('dir-avail-clear');

    function applyFilters() {
      PCU._dirFilter.search = searchInput ? searchInput.value.trim() : '';
      PCU._dirFilter.department = deptFilter ? deptFilter.value : '';
      PCU._dirFilter.sort = sortSelect ? sortSelect.value : 'name-asc';
      PCU._dirFilter.date = availDate ? availDate.value : '';
      PCU.renderProfessorDirectory();
      if (searchClear) searchClear.style.display = PCU._dirFilter.search ? 'inline-block' : 'none';
      if (availClear) availClear.style.display = PCU._dirFilter.date ? 'inline-block' : 'none';
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (searchClear) searchClear.addEventListener('click', function () {
      searchInput.value = '';
      applyFilters();
    });
    if (deptFilter) deptFilter.addEventListener('change', applyFilters);
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    if (availDate) availDate.addEventListener('change', applyFilters);
    if (availClear) availClear.addEventListener('click', function () {
      availDate.value = '';
      applyFilters();
    });

    // Set min date to tomorrow
    if (availDate) {
      var t = new Date(); t.setDate(t.getDate() + 1);
      availDate.min = t.toISOString().split('T')[0];
    }
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

    // Validate Student ID format (10 digits)
    if (!/^[0-9]{10}$/.test(studentId)) { PCU.showFeedback('Student ID must be exactly 10 digits (e.g., 202232946).', 'error'); return; }

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

    // Validate Student ID format (10 digits)
    if (!/^[0-9]{10}$/.test(studentId)) {
      PCU.showToast('Student ID must be exactly 10 digits (e.g., 202232946).', 'info'); return;
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
