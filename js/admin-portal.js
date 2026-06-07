/* ============================================
   PCU Quick-Book — Admin Portal
   User management, faculty approval (uses API)
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── Render Admin Portal ─────────────────────────
  PCU.renderAdminPortal = async function () {
    var body = document.getElementById('admin-portal-body');
    if (!body) return;

    var userEl = document.getElementById('admin-portal-header-user');
    if (userEl) userEl.textContent = PCU.currentUser ? PCU.currentUser.name : '';
    var logoutBtn = document.getElementById('admin-portal-logout-btn');
    if (logoutBtn) logoutBtn.style.display = PCU.currentUser ? 'inline-block' : 'none';

    // Fetch data from API
    var allUsers = await PCU.apiGetAllUsers();
    var stats = await PCU.apiGetStats();

    var pendingFaculty = allUsers.filter(function (u) { return u.role === 'faculty' && u.status === 'pending'; });
    var approvedFaculty = allUsers.filter(function (u) { return u.role === 'faculty' && u.status === 'approved'; });
    var students = allUsers.filter(function (u) { return u.role === 'student'; });

    var html = '<div class="portal-dashboard">';

    // Stats
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

    // Reset Database
    html += '<div class="admin-section">' +
      '<div class="admin-section__header">' +
        '<h3 class="admin-section__title">&#x1F504; Database Management</h3>' +
      '</div>' +
      '<div style="padding:1rem;">' +
        '<button class="admin-action-btn admin-action-btn--delete" id="admin-reset-db-btn" style="padding:0.6rem 1.2rem;font-size:0.95rem;">Reset Database</button>' +
        '<span style="margin-left:0.8rem;color:#888;font-size:0.85rem;">This will delete all data and reload with fresh demo data.</span>' +
      '</div>' +
    '</div>';

    // Pending Faculty
    html += '<div class="admin-section">' +
      '<div class="admin-section__header">' +
        '<h3 class="admin-section__title">&#x23F3; Pending Faculty Approvals (' + pendingFaculty.length + ')</h3>' +
      '</div>';

    if (pendingFaculty.length === 0) {
      html += '<div class="admin-empty">No pending faculty registrations.</div>';
    } else {
      html += '<div class="admin-table-wrapper"><table class="admin-table">' +
        '<thead><tr><th>#</th><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Specialization</th><th>Actions</th></tr></thead><tbody>';
      pendingFaculty.forEach(function (u, idx) {
        html += '<tr>' +
          '<td class="admin-table__row-num">' + (idx + 1) + '</td>' +
          '<td><strong>' + u.user_id + '</strong></td>' +
          '<td>' + u.name + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td>' + (u.department || '-') + '</td>' +
          '<td>' + (u.specialization || '-') + '</td>' +
          '<td>' +
            '<button class="admin-action-btn admin-action-btn--approve" data-action="approve" data-user-id="' + u.user_id + '">Approve</button> ' +
            '<button class="admin-action-btn admin-action-btn--reject" data-action="reject" data-user-id="' + u.user_id + '">Reject</button>' +
          '</td></tr>';
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
        '<thead><tr><th>#</th><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Department</th><th>Actions</th></tr></thead><tbody>';
      allUsers.forEach(function (u, idx) {
        var statusBadge = 'admin-badge--' + u.status;
        var roleBadge = 'admin-badge--' + u.role;
        var canDelete = u.user_id !== 'admin';
        html += '<tr>' +
          '<td class="admin-table__row-num">' + (idx + 1) + '</td>' +
          '<td><strong>' + u.user_id + '</strong></td>' +
          '<td>' + u.name + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td><span class="admin-badge ' + roleBadge + '">' + u.role.charAt(0).toUpperCase() + u.role.slice(1) + '</span></td>' +
          '<td><span class="admin-badge ' + statusBadge + '">' + u.status.charAt(0).toUpperCase() + u.status.slice(1) + '</span></td>' +
          '<td>' + (u.department || '-') + '</td>' +
          '<td>' + (canDelete ? '<button class="admin-action-btn admin-action-btn--delete" data-action="delete" data-user-id="' + u.user_id + '">Delete</button>' : '<span class="admin-table__protected">Protected</span>') + '</td>' +
        '</tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div></div>';

    body.innerHTML = html;

    // Attach action listeners
    body.querySelectorAll('.admin-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        var userId = this.getAttribute('data-user-id');
        PCU.handleAdminAction(action, userId);
      });
    });

    // Reset DB button
    var resetBtn = document.getElementById('admin-reset-db-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async function () {
        if (confirm('Are you sure you want to reset the database? All data except the Admin account will be deleted and demo data will be restored.')) {
          var result = await fetch('/api/reset', { method: 'POST' });
          var data = await result.json();
          if (data.success) {
            alert('Database has been reset. Demo data restored.');
            PCU.renderAdminPortal();
          } else {
            alert('Failed to reset database: ' + (data.error || 'Unknown error'));
          }
        }
      });
    }
  };

  // ─── Handle Admin Actions ────────────────────────
  PCU.handleAdminAction = async function (action, userId) {
    switch (action) {
      case 'approve':
        if (confirm('Approve this faculty member?')) {
          await PCU.apiUpdateUserStatus(userId, 'approved');
          PCU.renderAdminPortal();
        }
        break;
      case 'reject':
        if (confirm('Reject this faculty member?')) {
          await PCU.apiUpdateUserStatus(userId, 'rejected');
          PCU.renderAdminPortal();
        }
        break;
      case 'delete':
        if (confirm('Delete this user? This cannot be undone.')) {
          await PCU.apiDeleteUser(userId);
          PCU.renderAdminPortal();
        }
        break;
    }
  };
})();
