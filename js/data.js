/* ============================================
   PCU Quick-Book — Data Layer
   Professor catalog, state, persistence, helpers
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU || {};

  // ─── Professor Catalog ─────────────────────────────
  PCU.PROFESSORS = [
    { id:'delacruz', name:'Dr. Ricardo Dela Cruz', department:'College of Business Administration', specialization:'Business Management', email:'r.delacruz@pcu.edu.ph', initials:'DC', color:'#1B3A6B', consultationHours:[{day:'Monday',start:'09:00',end:'12:00'},{day:'Wednesday',start:'13:00',end:'17:00'},{day:'Friday',start:'09:00',end:'12:00'}], bufferTime:15 },
    { id:'santos', name:'Prof. Maria Santos', department:'College of Business Administration', specialization:'Marketing', email:'m.santos@pcu.edu.ph', initials:'MS', color:'#1B3A6B', consultationHours:[{day:'Tuesday',start:'08:00',end:'12:00'},{day:'Thursday',start:'13:00',end:'17:00'}], bufferTime:10 },
    { id:'gonzales', name:'Dr. Antonio Gonzales', department:'College of Business Administration', specialization:'Finance', email:'a.gonzales@pcu.edu.ph', initials:'AG', color:'#1B3A6B', consultationHours:[{day:'Monday',start:'13:00',end:'16:00'},{day:'Wednesday',start:'09:00',end:'12:00'}], bufferTime:20 },
    { id:'mendoza', name:'Prof. Elena Mendoza', department:'College of Education', specialization:'Curriculum Studies', email:'e.mendoza@pcu.edu.ph', initials:'EM', color:'#2E7D32', consultationHours:[{day:'Tuesday',start:'09:00',end:'12:00'},{day:'Thursday',start:'09:00',end:'15:00'},{day:'Friday',start:'13:00',end:'17:00'}], bufferTime:15 },
    { id:'rivera', name:'Dr. Jose Rivera', department:'College of Education', specialization:'Educational Leadership', email:'j.rivera@pcu.edu.ph', initials:'JR', color:'#2E7D32', consultationHours:[{day:'Monday',start:'08:00',end:'12:00'},{day:'Wednesday',start:'13:00',end:'17:00'}], bufferTime:15 },
    { id:'aguilar', name:'Dr. Carlos Aguilar', department:'College of Computer Studies', specialization:'Software Engineering', email:'c.aguilar@pcu.edu.ph', initials:'CA', color:'#1565C0', consultationHours:[{day:'Monday',start:'13:00',end:'17:00'},{day:'Tuesday',start:'08:00',end:'12:00'},{day:'Wednesday',start:'13:00',end:'17:00'},{day:'Thursday',start:'08:00',end:'12:00'}], bufferTime:10 },
    { id:'torres', name:'Prof. Patricia Torres', department:'College of Computer Studies', specialization:'Data Science', email:'p.torres@pcu.edu.ph', initials:'PT', color:'#1565C0', consultationHours:[{day:'Wednesday',start:'09:00',end:'12:00'},{day:'Friday',start:'13:00',end:'17:00'}], bufferTime:15 },
    { id:'ramos', name:'Dr. Angela Ramos', department:'College of Arts & Sciences', specialization:'Psychology', email:'a.ramos@pcu.edu.ph', initials:'AR', color:'#6A1B9A', consultationHours:[{day:'Tuesday',start:'13:00',end:'17:00'},{day:'Thursday',start:'08:00',end:'12:00'}], bufferTime:15 },
    { id:'castro', name:'Prof. Luis Castro', department:'College of Arts & Sciences', specialization:'Communication', email:'l.castro@pcu.edu.ph', initials:'LC', color:'#6A1B9A', consultationHours:[{day:'Monday',start:'08:00',end:'12:00'},{day:'Wednesday',start:'09:00',end:'12:00'},{day:'Friday',start:'09:00',end:'17:00'}], bufferTime:10 },
    { id:'fernandez', name:'Dr. Isabel Fernandez', department:'College of Nursing', specialization:'Clinical Nursing', email:'i.fernandez@pcu.edu.ph', initials:'IF', color:'#1A56DB', consultationHours:[{day:'Tuesday',start:'08:00',end:'15:00'},{day:'Thursday',start:'08:00',end:'15:00'}], bufferTime:20 },
    { id:'villar', name:'Prof. Miguel Villar', department:'College of Engineering', specialization:'Civil Engineering', email:'m.villar@pcu.edu.ph', initials:'MV', color:'#E65100', consultationHours:[{day:'Monday',start:'09:00',end:'16:00'},{day:'Wednesday',start:'09:00',end:'16:00'}], bufferTime:15 }
  ];

  // ─── State ─────────────────────────────────────────
  PCU.bookings = [];
  PCU.notificationQueue = [];
  PCU.currentStudent = null; // logged-in student object

  // ─── Helpers ───────────────────────────────────────
  PCU.timeToMinutes = function (t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
  PCU.minutesToTime = function (m) { var h = Math.floor(m / 60); var mn = m % 60; return String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0'); };
  PCU.formatTime12 = function (t) { var p = t.split(':'); var h = parseInt(p[0]); var h12 = h % 12 || 12; return h12 + ':' + String(parseInt(p[1])).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM'); };
  PCU.generateId = function () { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6); };
  PCU.getDayOfWeek = function (dateStr) { var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; return days[new Date(dateStr + 'T00:00:00').getDay()]; };
  PCU.todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  PCU.formatDate = function (dateStr) { var d = new Date(dateStr + 'T00:00:00'); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); };

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
      if (prof.consultationHours.some(function (ch) { return ch.day === dn; })) return dn;
    }
    return null;
  };

  // ─── Persistence ───────────────────────────────────
  PCU.loadState = function () {
    try {
      PCU.bookings = JSON.parse(localStorage.getItem('pcu_bookings')) || [];
      PCU.notificationQueue = JSON.parse(localStorage.getItem('pcu_notifications')) || [];
    } catch (e) { PCU.bookings = []; PCU.notificationQueue = []; }
  };

  PCU.saveBookings = function () { localStorage.setItem('pcu_bookings', JSON.stringify(PCU.bookings)); };
  PCU.saveNotifications = function () { localStorage.setItem('pcu_notifications', JSON.stringify(PCU.notificationQueue)); };

  window.PCU = PCU;
})();
