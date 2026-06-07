/* ============================================
   PCU Quick-Book — Admin Portal
   User management, faculty approval
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Admin Portal Open / Close ───────────────────
  PCU.openAdminPortal = function () {
    document.getElementById('admin-portal-overlay').classList.add('admin-portal-overlay--open');
    document.body.style.overflow = 'hidden';
    PCU.renderAdminPortal();
  };

  PCU.closeAdminPortal = function () {
    document.getElementById('admin-portal-overlay').classList.remove('admin-portal-overlay--open');
    document.body.style.overflow = '';
  };

  // ─── Render Admin Portal ─────────────────────────
  PCU.renderAdminPortal = function () {
    var body = document.getElementById('admin-portal-body');
    if (!body) return;

    // Update header
    var userEl = document.getElementById('admin-portal-header-user');
    if (userEl) userEl.textContent = PCU.currentUser ? PCU.currentUser.name : '';
    var logoutBtn = document.getElementById('admin-portal-logout-btn');
    if (logoutBtn) logoutBtn.style.display = PCU.currentUser ? 'inline-block' : 'none';

    var html = '<div class="portal-dashboard">';

    // Stats
    var allUsers = PCU.dbGetAllUsers();
    var pendingFaculty = allUsers.filter(function (u) { return u.role === 'faculty' && u.status === 'pending'; });
    var approvedFaculty = allUsers.filter(function (u) { return u.role === 'faculty' && u.status === 'approved'; });
    var students = allUsers.filter(function (u) { return u.role === 'student'; });
    var admins = allUsers.filter(function (u) { return u.role === 'admin'; });
    var stats = PCU.dbGetStats ? PCU.dbGetStats() : { students: 0, faculty: 0, bookings: 0, confirmed: 0, declined: 0, cancelled: 0 };

    html += '<div class="admin-stats-grid">' +
      '<div class="admin-stat-card">' +
        '<div class="admin-stat-card__number">' + allUsers.length + '</div>' +
        '<div class="admin-stat-card__label">Total Users</div>' +
      '</div>' +
      '<div class="admin-stat-card admin-stat-card--warning">' +
        '<div class="admin-stat-card__number">' + pendingFaculty.length + '</div>' +
        '<div class="admin-stat-card__label">Pending Approvals</div>' +
      '</div>' +
      '<div class="admin-stat-card admin-stat-card--success">' +
        '<div class="admin-stat-card__number">' + approvedFaculty.length + '</div>' +
        '<div class="admin-stat-card__label">Active Faculty</div>' +
      '</div>' +
      '<div class="admin-stat-card admin-stat-card--info">' +
        '<div class="admin-stat-card__number">' + students.length + '</div>' +
        '<div class="admin-stat-card__label">Students</div>' +
      '</div>' +
      '<div class="admin-stat-card">' +
        '<div class="admin-stat-card__number">' + stats.bookings + '</div>' +
        '<div class="admin-stat-card__label">Total Bookings</div>' +
      '</div>' +
    '</div>';

    // Pending Faculty Approvals
    html += '<div class="admin-section">' +
      '<div class="admin-section__header">' +
        '<h3 class="admin-section__title">&#x23F3; Pending Faculty Approvals (' + pendingFaculty.length + ')</h3>' +
      '</div>';

    if (pendingFaculty.length === 0) {
      html += '<div class="admin-empty">No pending faculty registrations.</div>';
    } else {
      html += '<div class="admin-table-wrapper"><table class="admin-table">' +
        '<thead><tr>' +
          '<th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Specialization</th><th>Registered</th><th>Actions</th>' +
        '</tr></thead><tbody>';

      pendingFaculty.forEach(function (u) {
        html += '<tr>' +
          '<td><strong>' + u.user_id + '</strong></td>' +
          '<td>' + u.name + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td>' + (u.department || '-') + '</td>' +
          '<td>' + (u.specialization || '-') + '</td>' +
          '<td>' + PCU.formatDate(u.created_at ? u.created_at.split(' ')[0] : '') + '</td>' +
          '<td>' +
            '<button class="admin-action-btn admin-action-btn--approve" data-action="approve" data-user-id="' + u.user_id + '">Approve</button> ' +
            '<button class="admin-action-btn admin-action-btn--reject" data-action="reject" data-user-id="' + u.user_id + '">Reject</button>' +
          '</td>' +
        '</tr>';
      });

      html += '</tbody></table></div>';
    }
    html += '</div>';

    // All Users
    html += '<div class="admin-section">' +
      '<div class="admin-section__header">' +
        '<h3 class="admin-section__title">&#x1F465; All Users (' + allUsers.length + ')</h3>' +
      '</div>';

    if (allUsers.length === 0) {
      html += '<div class="admin-empty">No users found.</div>';
    } else {
      html += '<div class="admin-table-wrapper"><table class="admin-table">' +
        '<thead><tr>' +
          '<th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Department</th><th>Actions</th>' +
        '</tr></thead><tbody>';

      allUsers.forEach(function (u) {
        var statusBadge = 'admin-badge--' + u.status;
        var roleBadge = 'admin-badge--' + u.role;
        var canDelete = u.user_id !== 'admin'; // Don't allow deleting the main admin

        html += '<tr>' +
          '<td><strong>' + u.user_id + '</strong></td>' +
          '<td>' + u.name + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td><span class="admin-badge ' + roleBadge + '">' + u.role.charAt(0).toUpperCase() + u.role.slice(1) + '</span></td>' +
          '<td><span class="admin-badge ' + statusBadge + '">' + u.status.charAt(0).toUpperCase() + u.status.slice(1) + '</span></td>' +
          '<td>' + (u.department || '-') + '</td>' +
          '<td>' +
            (canDelete ? '<button class="admin-action-btn admin-action-btn--delete" data-action="delete" data-user-id="' + u.user_id + '">Delete</button>' : '<span style="color:#999;font-size:0.8rem;">Protected</span>') +
          '</td>' +
        '</tr>';
      });

      html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '</div>';
    body.innerHTML = html;

    // Attach action listeners
    body.querySelectorAll('.admin-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        var userId = this.getAttribute('data-user-id');
        PCU.handleAdminAction(action, userId);
      });
    });
  };

  // ─── Handle Admin Actions ────────────────────────
  PCU.handleAdminAction = function (action, userId) {
    switch (action) {
      case 'approve':
        if (confirm('Approve this faculty member? They will be able to log in.')) {
          PCU.dbUpdateUserStatus(userId, 'approved');
          PCU.addNotification({
            type: 'confirmation',
            title: 'Faculty Approved',
            message: 'Faculty account for ' + userId + ' has been approved.',
            professorId: '', professorName: ''
          });
          PCU.renderAdminPortal();
        }
        break;
      case 'reject':
        if (confirm('Reject this faculty member? They will not be able to log in.')) {
          PCU.dbUpdateUserStatus(userId, 'rejected');
          PCU.addNotification({
            type: 'decline',
            title: 'Faculty Rejected',
            message: 'Faculty account for ' + userId + ' has been rejected.',
            professorId: '', professorName: ''
          });
          PCU.renderAdminPortal();
        }
        break;
      case 'delete':
        if (confirm('Delete this user? This action cannot be undone.')) {
          PCU.dbDeleteUser(userId);
          PCU.renderAdminPortal();
        }
        break;
    }
  };
})();
