/* ============================================
   PCU Quick-Book — Main Entry Point
   Init, event wiring, seed data
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Seed Demo Data ────────────────────────────────
  function seedDemoData() {
    // Demo data removed
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

    // Student Portal link - now navigates to separate page
    var portalLink = document.getElementById('portal-link');
    if (portalLink) {
      portalLink.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'student-portal.html';
      });
    }

    // Faculty Portal link - now navigates to separate page
    var facultyPortalLink = document.getElementById('faculty-portal-link');
    if (facultyPortalLink) {
      facultyPortalLink.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'faculty-portal.html';
      });
    }

    // Admin Portal link - now navigates to separate page
    var adminPortalLink = document.getElementById('admin-portal-link');
    if (adminPortalLink) {
      adminPortalLink.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'admin-portal.html';
      });
    }

    // Logout link
    var logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) { e.preventDefault(); PCU.logout(); });
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

    // Escape key — close modals, help desk
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var hdPanel = document.getElementById('helpdesk-panel');
        if (hdPanel && hdPanel.classList.contains('helpdesk-panel--open')) {
          hdPanel.classList.remove('helpdesk-panel--open');
          return;
        }
        PCU.closeRequestModal();
      }
    });
  }

  // ─── Update Nav Based on User Role ────────────────
  function updateNavForUser() {
    var adminLink = document.getElementById('admin-portal-link');
    var portalLink = document.getElementById('portal-link');
    var facultyLink = document.getElementById('faculty-portal-link');
    var logoutLink = document.getElementById('logout-link');
    var signInLink = document.getElementById('signin-link');

    if (PCU.currentUser) {
      if (logoutLink) logoutLink.style.display = '';
      if (signInLink) signInLink.style.display = 'none';

      // Hide all portal links by default, then show only the relevant ones
      if (adminLink) adminLink.style.display = 'none';
      if (portalLink) portalLink.style.display = 'none';
      if (facultyLink) facultyLink.style.display = 'none';

      switch (PCU.currentUser.role) {
        case 'admin':
          if (adminLink) adminLink.style.display = '';
          break;
        case 'faculty':
          if (facultyLink) {
            if (PCU.currentUser.status === 'pending') {
              facultyLink.style.display = 'none';
            } else {
              facultyLink.style.display = '';
            }
          }
          break;
        case 'student':
          if (portalLink) portalLink.style.display = '';
          break;
      }

      // Show pending approval banner if applicable
      var pendingBanner = document.getElementById('pending-approval-banner');
      if (pendingBanner) {
        if (PCU.currentUser.status === 'pending') {
          pendingBanner.style.display = 'flex';
        } else {
          pendingBanner.style.display = 'none';
        }
      }
    } else {
      // Not logged in: show Sign In, hide portal links
      if (adminLink) adminLink.style.display = 'none';
      if (portalLink) portalLink.style.display = 'none';
      if (facultyLink) facultyLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'none';
      if (signInLink) signInLink.style.display = '';
    }
  }

  // ─── Init App (called after login) ───────────────
  PCU.initApp = async function () {
    updateNavForUser();
    await PCU.fetchFaculty();
    populateFacultySelect();
    populateFeaturedFaculty();
    autoFillStudentInfo();
    await PCU.renderProfessorDirectory();

    // Fetch notifications from server API filtered by logged-in user
    if (PCU.apiGetNotifications && PCU.currentUser) {
      try {
        var filters = {};
        if (PCU.currentUser.role === 'student') {
          filters.studentId = (PCU.currentUser.user_id || '').replace(/^S/, '');
        } else if (PCU.currentUser.role === 'faculty') {
          filters.professorId = PCU.currentUser.user_id;
        }
        var serverNotifs = await PCU.apiGetNotifications(filters);
        if (Array.isArray(serverNotifs)) {
          // Replace queue with server data to avoid cross-user leaks from localStorage
          PCU.notificationQueue = [];
          serverNotifs.forEach(function (sn) {
            PCU.notificationQueue.push({
              id: sn.id, type: sn.type, title: sn.title, message: sn.message,
              professorId: sn.professor_id, professorName: sn.professor_name,
              studentId: sn.student_id || '', studentName: sn.student_name || '',
              timestamp: sn.timestamp, read: sn.read
            });
          });
          PCU.notificationQueue.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
        }
      } catch (e) {
        // Server unreachable — filter localStorage queue to avoid cross-user leaks
        console.warn('Failed to fetch notifications from server:', e);
        var currentStudentId = filters.studentId || null;
        var currentProfId = filters.professorId || null;
        PCU.notificationQueue = PCU.notificationQueue.filter(function (n) {
          if (currentStudentId) return n.studentId === currentStudentId;
          if (currentProfId) return n.professorId === currentProfId;
          return false;
        });
      }
    }

    PCU.renderNotificationPanel();
    PCU.updateBellBadge();
  };

  // ─── Populate Faculty Select in Quick-Book Form ────
  function populateFacultySelect() {
    var select = document.getElementById('faculty-select');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>&mdash; Choose a faculty member &mdash;</option>';

    var deptMap = {};
    PCU.PROFESSORS.forEach(function (p) {
      if (!deptMap[p.department]) deptMap[p.department] = [];
      deptMap[p.department].push(p);
    });

    Object.keys(deptMap).sort().forEach(function (dept) {
      var group = document.createElement('optgroup');
      group.label = dept;
      deptMap[dept].forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name + ' \u2013 ' + p.specialization;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });
  }

  // ─── Populate Featured Faculty Sidebar ─────────────
  function populateFeaturedFaculty() {
    var container = document.querySelector('.featured-list');
    if (!container) return;

    var today = PCU.todayStr();
    var dayName = PCU.getDayOfWeek(today);

    var availableToday = PCU.PROFESSORS.filter(function (p) {
      return p.consultationHours && p.consultationHours.some(function (ch) {
        return ch.day === dayName;
      });
    }).slice(0, 3);

    if (availableToday.length === 0 && PCU.PROFESSORS.length > 0) {
      availableToday = PCU.PROFESSORS.slice(0, 3);
    }

    container.innerHTML = '';
    availableToday.forEach(function (p) {
      var isAvailToday = p.consultationHours && p.consultationHours.some(function (ch) {
        return ch.day === dayName;
      });
      var badge = isAvailToday
        ? '<span class="featured-item__badge">Available Today</span>'
        : '<span class="featured-item__badge featured-item__badge--limited">View Profile</span>';

      var item = document.createElement('div');
      item.className = 'featured-item';
      item.innerHTML =
        '<div class="featured-item__avatar" style="background:' + p.color + '">' + p.initials + '</div>' +
        '<div class="featured-item__info">' +
          '<p class="featured-item__name">' + p.name + '</p>' +
          '<p class="featured-item__dept">' + p.department + '</p>' +
        '</div>' +
        badge;
      container.appendChild(item);
    });
  }

  // ─── Auto-fill Quick-Book Form Student Info ────────
  function autoFillStudentInfo() {
    if (!PCU.currentUser || PCU.currentUser.role !== 'student') return;

    var nameInput = document.getElementById('student-name');
    var idInput = document.getElementById('student-id');
    var emailInput = document.getElementById('student-email');
    var courseInput = document.getElementById('student-course');

    if (nameInput) {
      nameInput.value = PCU.currentUser.name || '';
      nameInput.readOnly = true;
      nameInput.style.background = '#f0f0f0';
    }
    if (idInput) {
      idInput.value = (PCU.currentUser.user_id || '').replace(/^S/, '');
      idInput.readOnly = true;
      idInput.style.background = '#f0f0f0';
    }
    if (emailInput) {
      emailInput.value = PCU.currentUser.email || '';
      emailInput.readOnly = true;
      emailInput.style.background = '#f0f0f0';
    }
    if (courseInput) {
      courseInput.value = PCU.currentUser.course || '';
      courseInput.readOnly = true;
      courseInput.style.background = '#f0f0f0';
    }
  }

  // ─── Init ──────────────────────────────────────────
  PCU.init = async function () {
    PCU.loadState();

    // Initialize authentication
    var isLoggedIn = await PCU.initAuth();

    if (isLoggedIn) {
      PCU.showMainApp();
      PCU.initApp();
    } else {
      PCU.hideMainApp();
    }

    attachEventListeners();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PCU.init);
  } else {
    PCU.init();
  }
})();
