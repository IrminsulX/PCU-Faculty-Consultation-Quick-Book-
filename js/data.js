/* ============================================
   PCU Quick-Book — Data Layer
   Professor catalog, state, persistence, helpers
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU || {};

  // ─── Professor Catalog (loaded from API) ────────
  PCU.PROFESSORS = [];

  // ─── State ─────────────────────────────────────────
  PCU.bookings = [];
  PCU.notificationQueue = [];
  PCU.currentStudent = null;

  // ─── Helpers ───────────────────────────────────────
  PCU.timeToMinutes = function (t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
  PCU.minutesToTime = function (m) { var h = Math.floor(m / 60); var mn = m % 60; return String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0'); };
  PCU.formatTime12 = function (t) { var p = t.split(':'); var h = parseInt(p[0]); var h12 = h % 12 || 12; return h12 + ':' + String(parseInt(p[1])).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM'); };
  PCU.generateId = function () { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6); };
  PCU.getDayOfWeek = function (dateStr) { var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; return days[new Date(dateStr + 'T00:00:00').getDay()]; };
  PCU.todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  PCU.formatDate = function (dateStr) { var d = new Date(dateStr + 'T00:00:00'); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); };
  PCU.formatDateShort = function (dateStr) { var d = new Date(dateStr + 'T00:00:00'); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m[d.getMonth()] + ' ' + d.getDate(); };

  PCU.getProfessor = function (id) {
    return PCU.PROFESSORS.find(function (p) { return p.id === id; });
  };

  PCU.getProfessorBookingsOnDate = function (profId, date) {
    return PCU.bookings.filter(function (b) {
      return b.professorId === profId && b.date === date && b.status !== 'declined' && b.status !== 'cancelled';
    });
  };

  PCU.findNextAvailableDay = function (profId) {
    var prof = PCU.getProfessor(profId);
    if (!prof) return null;
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (var i = 1; i <= 7; i++) {
      var d = new Date(); d.setDate(d.getDate() + i);
      var dn = dayNames[d.getDay()];
      if (prof.consultationHours && prof.consultationHours.some(function (ch) { return ch.day === dn; })) return dn;
    }
    return null;
  };

  // ─── Fetch Faculty from API ───────────────────────
  PCU.fetchFaculty = async function () {
    try {
      var response = await fetch('/api/faculty');
      var faculty = await response.json();
      PCU.PROFESSORS = faculty.map(function (f) {
        return {
          id: f.id,
          name: f.name,
          department: f.department,
          specialization: f.specialization,
          email: f.email,
          initials: f.initials,
          color: f.color,
          consultationHours: [],
          bufferTime: 15
        };
      });
      // Load consultation hours for each faculty
      for (var i = 0; i < PCU.PROFESSORS.length; i++) {
        var prof = PCU.PROFESSORS[i];
        try {
          var hoursResp = await fetch('/api/faculty/' + prof.id + '/hours');
          var hours = await hoursResp.json();
          prof.consultationHours = hours.map(function (h) {
            return { id: h.id, date: h.date, day: h.day, start: h.start_time, end: h.end_time };
          });
          if (hours.length > 0) {
            prof.bufferTime = hours[0].buffer_time || 15;
          }
        } catch (e) {
          console.warn('Failed to load hours for', prof.id, e);
        }
      }
      console.log('Faculty loaded from API:', PCU.PROFESSORS.length);
    } catch (err) {
      console.warn('Failed to fetch faculty from API:', err);
    }
  };

  // ─── Fetch consultation hours for one faculty ────
  PCU.fetchConsultationHours = async function (facultyId) {
    try {
      var response = await fetch('/api/faculty/' + facultyId + '/hours');
      var hours = await response.json();
      return hours.map(function (h) {
        return { id: h.id, date: h.date, day: h.day, start: h.start_time, end: h.end_time, bufferTime: h.buffer_time };
      });
    } catch (e) {
      console.warn('Failed to fetch hours for', facultyId, e);
      return [];
    }
  };

  // ─── Save consultation hours via API ──────────────
  PCU.saveConsultationHours = async function (facultyId, hours, bufferTime) {
    try {
      var response = await fetch('/api/faculty/' + facultyId + '/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: hours, bufferTime: bufferTime })
      });
      var result = await response.json();
      return result.success;
    } catch (e) {
      console.warn('Failed to save hours for', facultyId, e);
      return false;
    }
  };

  // ─── Persistence (localStorage fallback) ──────────
  PCU.loadState = function () {
    try {
      PCU.bookings = JSON.parse(localStorage.getItem('pcu_bookings')) || [];
      PCU.notificationQueue = JSON.parse(localStorage.getItem('pcu_notifications')) || [];
    } catch (e) { PCU.bookings = []; PCU.notificationQueue = []; }
  };

  PCU.saveBookings = function () { localStorage.setItem('pcu_bookings', JSON.stringify(PCU.bookings)); };
  PCU.saveNotifications = function () { localStorage.setItem('pcu_notifications', JSON.stringify(PCU.notificationQueue)); };

  // ─── Faculty Schedule (API + localStorage fallback) ──
  PCU.loadFacultySchedule = function (facultyId) {
    // Try localStorage first (cached from API)
    try {
      var data = JSON.parse(localStorage.getItem('pcu_faculty_schedule_' + facultyId));
      if (data && data.consultationHours) return data;
    } catch (e) {}
    return { consultationHours: [], bufferTime: 15 };
  };

  PCU.saveFacultySchedule = function (facultyId, schedule) {
    localStorage.setItem('pcu_faculty_schedule_' + facultyId, JSON.stringify(schedule));
  };

  PCU.getEffectiveConsultationHours = function (facultyId) {
    var schedule = PCU.loadFacultySchedule(facultyId);
    return schedule.consultationHours || [];
  };

  PCU.getEffectiveBufferTime = function (facultyId) {
    var schedule = PCU.loadFacultySchedule(facultyId);
    return schedule.bufferTime || 15;
  };

  window.PCU = PCU;
})();
