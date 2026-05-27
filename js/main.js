/* ============================================
   PCU Quick-Book — Main Entry Point
   Init, event wiring, seed data
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Seed Demo Data ────────────────────────────────
  function seedDemoData() {
    if (localStorage.getItem('pcu_seeded')) return;
    localStorage.setItem('pcu_seeded', '1');

    var d1 = new Date(); d1.setDate(d1.getDate() + 1);
    while (d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() + 1);
    var date1 = d1.getFullYear() + '-' + String(d1.getMonth() + 1).padStart(2, '0') + '-' + String(d1.getDate()).padStart(2, '0');

    var d2 = new Date(); d2.setDate(d2.getDate() + 2);
    while (d2.getDay() === 0 || d2.getDay() === 6) d2.setDate(d2.getDate() + 1);
    var date2 = d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0');

    PCU.bookings.push(
      { id: PCU.generateId(), professorId: 'delacruz', studentName: 'Ana Marie Reyes', studentId: '2023-005678', studentEmail: 'a.reyes@pcu.edu.ph', date: date1, startTime: '10:00', endTime: '10:30', purpose: 'Thesis proposal review', consultationType: 'thesis', mode: 'face-to-face', status: 'confirmed', createdAt: new Date().toISOString() },
      { id: PCU.generateId(), professorId: 'delacruz', studentName: 'Mark Andrew Lim', studentId: '2024-002345', studentEmail: 'm.lim@pcu.edu.ph', date: date1, startTime: '11:00', endTime: '11:30', purpose: 'Grade inquiry', consultationType: 'grade', mode: 'online', status: 'confirmed', createdAt: new Date().toISOString() },
      { id: PCU.generateId(), professorId: 'aguilar', studentName: 'Jasmine Cruz', studentId: '2025-001122', studentEmail: 'j.cruz@pcu.edu.ph', date: date2, startTime: '14:00', endTime: '14:30', purpose: 'Capstone project guidance', consultationType: 'thesis', mode: 'face-to-face', status: 'confirmed', createdAt: new Date().toISOString() }
    );
    PCU.saveBookings();

    PCU.notificationQueue.push(
      { id: PCU.generateId(), type: 'confirmation', title: 'Booking Confirmed', message: 'Consultation with Dr. Ricardo Dela Cruz on ' + PCU.formatDate(date1) + ' at 10:00 AM confirmed.', professorId: 'delacruz', professorName: 'Dr. Ricardo Dela Cruz', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
      { id: PCU.generateId(), type: 'decline', title: 'Request Declined — Conflict', message: 'Meeting request with Dr. Carlos Aguilar auto-declined due to scheduling conflict.', professorId: 'aguilar', professorName: 'Dr. Carlos Aguilar', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false }
    );
    PCU.saveNotifications();
  }

  // ─── Event Wiring ──────────────────────────────────
  function attachEventListeners() {
    // Top bar (hamburger menu, mobile nav)
    PCU.initTopBar();

    // Notification bell
    var bell = document.getElementById('notif-bell');
    if (bell) bell.addEventListener('click', PCU.toggleNotifPanel);

    // Close notif panel on outside click
    document.addEventListener('click', function (e) {
      var panel = document.getElementById('notif-panel');
      if (panel && panel.classList.contains('notif-panel--open') && !panel.contains(e.target) && e.target !== bell && !bell.contains(e.target)) {
        panel.classList.remove('notif-panel--open');
      }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { PCU.switchTab(this.getAttribute('data-tab')); });
    });

    // Directory controls (search, filter, sort, bulk-availability)
    PCU.initDirectoryControls();

    // Modal
    var modalClose = document.getElementById('modal-close');
    if (modalClose) modalClose.addEventListener('click', PCU.closeRequestModal);
    var modalCancel = document.getElementById('modal-cancel');
    if (modalCancel) modalCancel.addEventListener('click', PCU.closeRequestModal);
    var modal = document.getElementById('request-modal');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) PCU.closeRequestModal(); });
    var modalDate = document.getElementById('modal-date');
    if (modalDate) modalDate.addEventListener('change', PCU.updateModalTimeSlots);
    var modalForm = document.getElementById('modal-form');
    if (modalForm) modalForm.addEventListener('submit', PCU.handleModalSubmit);

    // Main form
    var mainForm = document.querySelector('.booking-form');
    if (mainForm) mainForm.addEventListener('submit', PCU.handleMainFormSubmit);
    var facSelect = document.getElementById('faculty-select');
    if (facSelect) facSelect.addEventListener('change', PCU.suggestTimeSlotsInMainForm);
    var dateInput = document.getElementById('consultation-date');
    if (dateInput) dateInput.addEventListener('change', PCU.suggestTimeSlotsInMainForm);

    // Min date
    var t = new Date(); t.setDate(t.getDate() + 1); var ts = t.toISOString().split('T')[0];
    if (dateInput) dateInput.min = ts;
    if (modalDate) modalDate.min = ts;

    // Student Portal link
    var portalLink = document.getElementById('portal-link');
    if (portalLink) {
      portalLink.addEventListener('click', function (e) { e.preventDefault(); PCU.openPortal(); });
    }

    // Help Desk link
    var helpdeskLink = document.getElementById('helpdesk-link');
    if (helpdeskLink) {
      helpdeskLink.addEventListener('click', function (e) { e.preventDefault(); PCU.toggleHelpDesk(); });
    }

    // Help Desk close button
    var helpdeskClose = document.getElementById('helpdesk-close');
    if (helpdeskClose) helpdeskClose.addEventListener('click', function () {
      document.getElementById('helpdesk-panel').classList.remove('helpdesk-panel--open');
    });

    // Close Help Desk on outside click
    document.addEventListener('click', function (e) {
      var panel = document.getElementById('helpdesk-panel');
      var link = document.getElementById('helpdesk-link');
      if (panel && panel.classList.contains('helpdesk-panel--open') && !panel.contains(e.target) && e.target !== link && (!link || !link.contains(e.target))) {
        panel.classList.remove('helpdesk-panel--open');
      }
    });

    // Portal close
    var portalClose = document.getElementById('portal-close');
    if (portalClose) portalClose.addEventListener('click', PCU.closePortal);

    // Portal logout
    var logoutBtn = document.getElementById('portal-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', PCU.logoutStudent);

    // Escape key — close modals, portal, help desk
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var portalOverlay = document.getElementById('portal-overlay');
        if (portalOverlay && portalOverlay.classList.contains('portal-overlay--open')) {
          PCU.closePortal();
          return;
        }
        var hdPanel = document.getElementById('helpdesk-panel');
        if (hdPanel && hdPanel.classList.contains('helpdesk-panel--open')) {
          hdPanel.classList.remove('helpdesk-panel--open');
          return;
        }
        PCU.closeRequestModal();
      }
    });
  }

  // ─── Init ──────────────────────────────────────────
  PCU.init = function () {
    PCU.loadState();
    seedDemoData();
    PCU.renderProfessorDirectory();
    PCU.renderNotificationPanel();
    PCU.updateBellBadge();
    attachEventListeners();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PCU.init);
  } else {
    PCU.init();
  }
})();
