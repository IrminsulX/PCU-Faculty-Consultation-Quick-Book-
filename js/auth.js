/* ============================================
   PCU Quick-Book — Authentication System
   Login, Register, Session Management
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU || {};

  // ─── Current User Session ────────────────────────
  PCU.currentUser = null;

  // ─── Show / Hide Auth Page ───────────────────────
  PCU.showAuthPage = function () {
    var authPage = document.getElementById('auth-page');
    if (authPage) authPage.classList.remove('auth-page--hidden');
  };

  PCU.hideAuthPage = function () {
    var authPage = document.getElementById('auth-page');
    if (authPage) authPage.classList.add('auth-page--hidden');
  };

  // ─── Show / Hide Main App ────────────────────────
  PCU.showMainApp = function () {
    document.getElementById('top-bar').style.display = '';
    document.querySelector('.brand-header').style.display = '';
    document.querySelector('.page-title-bar').style.display = '';
    document.querySelector('.main-container').style.display = '';
    document.querySelector('.site-footer').style.display = '';
  };

  PCU.hideMainApp = function () {
    document.getElementById('top-bar').style.display = 'none';
    document.querySelector('.brand-header').style.display = 'none';
    document.querySelector('.page-title-bar').style.display = 'none';
    document.querySelector('.main-container').style.display = 'none';
    document.querySelector('.site-footer').style.display = 'none';
  };

  // ─── Switch Auth Tab ─────────────────────────────
  PCU.switchAuthTab = function (tab) {
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('auth-tab--active', t.getAttribute('data-auth-tab') === tab);
    });
    document.querySelectorAll('.auth-form').forEach(function (f) {
      f.classList.toggle('auth-form--hidden', f.getAttribute('data-auth-form') !== tab);
    });
    // Clear errors
    document.querySelectorAll('.auth-form__error').forEach(function (e) { e.classList.remove('auth-form__error--visible'); });
    document.querySelectorAll('.auth-form__success').forEach(function (e) { e.classList.remove('auth-form__success--visible'); });
  };

  // ─── Toggle Faculty Fields on Role Select ────────
  PCU.toggleRoleFields = function (role) {
    var facultyFields = document.querySelector('.auth-faculty-fields');
    if (facultyFields) {
      facultyFields.classList.toggle('auth-faculty-fields--visible', role === 'faculty');
    }
  };

  // ─── Register Student ────────────────────────────
  PCU.registerStudent = function (data) {
    var studentId = data.studentId.trim();
    var name = data.name.trim();
    var email = data.email.trim().toLowerCase();
    var password = data.password.trim();
    var course = data.course.trim();

    // Validate 10-digit ID
    if (!/^[0-9]{10}$/.test(studentId)) {
      return { success: false, error: 'Student ID must be exactly 10 digits.' };
    }
    if (!name || !email || !password) {
      return { success: false, error: 'Please fill all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check if student ID already exists in users
    var existing = PCU.dbGetUserByUserId(studentId);
    if (existing) {
      return { success: false, error: 'This Student ID is already registered.' };
    }

    // Check if email already exists
    var existingEmail = PCU.dbGetUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'This email is already registered.' };
    }

    // Create user account
    var userId = 'S' + studentId;
    PCU.dbAddUser({
      user_id: userId,
      name: name,
      email: email,
      password: password,
      role: 'student',
      status: 'approved',
      department: '',
      specialization: '',
      course: course
    });

    // Also add to students table for compatibility
    PCU.dbAddStudent(studentId, name, email, course, '');

    return { success: true };
  };

  // ─── Register Faculty ────────────────────────────
  PCU.registerFaculty = function (data) {
    var name = data.name.trim();
    var email = data.email.trim().toLowerCase();
    var password = data.password.trim();
    var department = data.department.trim();
    var specialization = data.specialization.trim();

    if (!name || !email || !password || !department) {
      return { success: false, error: 'Please fill all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check if email already exists
    var existingEmail = PCU.dbGetUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'This email is already registered.' };
    }

    // Generate faculty ID
    var count = PCU.dbGetPendingFacultyCount() + PCU.dbGetApprovedFacultyCount() + 1;
    var facultyId = 'F' + String(count).padStart(3, '0');

    // Create user account with pending status
    PCU.dbAddUser({
      user_id: facultyId,
      name: name,
      email: email,
      password: password,
      role: 'faculty',
      status: 'pending',
      department: department,
      specialization: specialization,
      course: ''
    });

    return { success: true, pending: true };
  };

  // ─── Login ───────────────────────────────────────
  PCU.login = function (userId, password) {
    userId = userId.trim();
    password = password.trim();

    if (!userId || !password) {
      return { success: false, error: 'Please enter your credentials.' };
    }

    var user = PCU.dbAuthenticateUser(userId, password);
    if (!user) {
      return { success: false, error: 'Invalid credentials. Please check your ID and password.' };
    }

    if (user.status === 'pending') {
      return { success: false, pending: true, error: 'Your account is pending admin approval. Please wait for an administrator to approve your registration.' };
    }

    if (user.status === 'rejected') {
      return { success: false, error: 'Your account has been rejected. Please contact the administrator.' };
    }

    // Set current user session
    PCU.currentUser = {
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department || '',
      specialization: user.specialization || '',
      course: user.course || '',
      initials: user.name.split(' ').map(function (n) { return n[0]; }).join('').substr(0, 2).toUpperCase()
    };

    // Save session
    localStorage.setItem('pcu_current_user', JSON.stringify(PCU.currentUser));

    return { success: true, user: PCU.currentUser };
  };

  // ─── Logout ──────────────────────────────────────
  PCU.logout = function () {
    PCU.currentUser = null;
    localStorage.removeItem('pcu_current_user');
    PCU.showAuthPage();
    PCU.hideMainApp();
    // Close any open portals
    if (PCU.closePortal) PCU.closePortal();
    if (PCU.closeFacultyPortal) PCU.closeFacultyPortal();
    if (PCU.closeAdminPortal) PCU.closeAdminPortal();
  };

  // ─── Check Session ───────────────────────────────
  PCU.checkSession = function () {
    var saved = localStorage.getItem('pcu_current_user');
    if (saved) {
      try {
        PCU.currentUser = JSON.parse(saved);
        // Verify user still exists in DB
        var user = PCU.dbGetUserByUserId(PCU.currentUser.user_id);
        if (user && user.status === 'approved') {
          return true;
        } else {
          PCU.currentUser = null;
          localStorage.removeItem('pcu_current_user');
          return false;
        }
      } catch (e) {
        PCU.currentUser = null;
        localStorage.removeItem('pcu_current_user');
        return false;
      }
    }
    return false;
  };

  // ─── Is Admin ────────────────────────────────────
  PCU.isAdmin = function () {
    return PCU.currentUser && PCU.currentUser.role === 'admin';
  };

  // ─── Is Faculty ──────────────────────────────────
  PCU.isFaculty = function () {
    return PCU.currentUser && PCU.currentUser.role === 'faculty';
  };

  // ─── Is Student ──────────────────────────────────
  PCU.isStudent = function () {
    return PCU.currentUser && PCU.currentUser.role === 'student';
  };

  // ─── Render Auth Page ────────────────────────────
  PCU.renderAuthPage = function () {
    var authPage = document.getElementById('auth-page');
    if (!authPage) return;

    authPage.innerHTML =
      '<div class="auth-container">' +
        '<div class="auth-card">' +
          '<div class="auth-card__header">' +
            '<img src="images/pcu-logo.png" alt="PCU Logo" class="auth-card__logo" onerror="this.style.display=\'none\'">' +
            '<h1 class="auth-card__title">PCU Quick-Book</h1>' +
            '<p class="auth-card__subtitle">Faculty Consultation Booking System</p>' +
          '</div>' +
          '<div class="auth-tabs">' +
            '<button class="auth-tab auth-tab--active" data-auth-tab="login">Sign In</button>' +
            '<button class="auth-tab" data-auth-tab="register">Register</button>' +
          '</div>' +
          '<div class="auth-card__body">' +
            // Login Form
            '<form class="auth-form" data-auth-form="login" id="auth-login-form">' +
              '<div class="auth-form__group">' +
                '<label class="auth-form__label">User ID</label>' +
                '<input type="text" class="auth-form__input" id="auth-login-id" placeholder="Student ID or Faculty ID" required>' +
              '</div>' +
              '<div class="auth-form__group">' +
                '<label class="auth-form__label">Password</label>' +
                '<input type="password" class="auth-form__input" id="auth-login-password" placeholder="Enter your password" required>' +
              '</div>' +
              '<div class="auth-form__error" id="auth-login-error"></div>' +
              '<div class="auth-form__success" id="auth-login-success"></div>' +
              '<button type="submit" class="auth-form__submit">Sign In</button>' +
              '<div class="auth-divider"><span class="auth-divider__text">Demo: admin / admin123</span></div>' +
            '</form>' +
            // Register Form
            '<form class="auth-form auth-form--hidden" data-auth-form="register" id="auth-register-form">' +
              '<div class="auth-role-select">' +
                '<label class="auth-role-option">' +
                  '<input type="radio" name="reg_role" value="student" class="auth-role-option__radio" checked>' +
                  '<span class="auth-role-option__card">' +
                    '<span class="auth-role-option__icon">&#x1F393;</span>' +
                    '<span class="auth-role-option__label">Student</span>' +
                    '<span class="auth-role-option__desc">Book consultations</span>' +
                  '</span>' +
                '</label>' +
                '<label class="auth-role-option">' +
                  '<input type="radio" name="reg_role" value="faculty" class="auth-role-option__radio">' +
                  '<span class="auth-role-option__card">' +
                    '<span class="auth-role-option__icon">&#x1F468;&#x200D;&#x1F3EB;</span>' +
                    '<span class="auth-role-option__label">Faculty</span>' +
                    '<span class="auth-role-option__desc">Manage consultations</span>' +
                  '</span>' +
                '</label>' +
              '</div>' +
              '<div class="auth-form__group">' +
                '<label class="auth-form__label">Full Name *</label>' +
                '<input type="text" class="auth-form__input" id="reg-name" placeholder="e.g., Juan Miguel R. Santos" required>' +
              '</div>' +
              '<div class="auth-form__group">' +
                '<label class="auth-form__label">Email Address *</label>' +
                '<input type="email" class="auth-form__input" id="reg-email" placeholder="your.email@pcu.edu.ph" required>' +
              '</div>' +
              '<div class="auth-form__group">' +
                '<label class="auth-form__label">Password *</label>' +
                '<input type="password" class="auth-form__input" id="reg-password" placeholder="At least 6 characters" required minlength="6">' +
              '</div>' +
              // Student-specific fields
              '<div class="auth-form__row student-fields" id="reg-student-fields">' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Student ID *</label>' +
                  '<input type="text" class="auth-form__input" id="reg-student-id" placeholder="e.g., 202232946" maxlength="10" pattern="[0-9]{10}">' +
                '</div>' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Course</label>' +
                  '<input type="text" class="auth-form__input" id="reg-course" placeholder="e.g., BS Computer Science">' +
                '</div>' +
              '</div>' +
              // Faculty-specific fields (hidden by default)
              '<div class="auth-faculty-fields" id="reg-faculty-fields">' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Department *</label>' +
                  '<select class="auth-form__select" id="reg-department">' +
                    '<option value="">-- Select Department --</option>' +
                    '<option value="College of Business Administration">College of Business Administration</option>' +
                    '<option value="College of Education">College of Education</option>' +
                    '<option value="College of Computer Studies">College of Computer Studies</option>' +
                    '<option value="College of Arts & Sciences">College of Arts & Sciences</option>' +
                    '<option value="College of Nursing">College of Nursing</option>' +
                    '<option value="College of Engineering">College of Engineering</option>' +
                  '</select>' +
                '</div>' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Specialization</label>' +
                  '<input type="text" class="auth-form__input" id="reg-specialization" placeholder="e.g., Software Engineering">' +
                '</div>' +
              '</div>' +
              '<div class="auth-form__error" id="auth-register-error"></div>' +
              '<div class="auth-form__success" id="auth-register-success"></div>' +
              '<button type="submit" class="auth-form__submit">Create Account</button>' +
            '</form>' +
          '</div>' +
          '<div class="auth-card__footer">' +
            '<p class="auth-card__footer-text">Philippine Christian University &mdash; Faculty Consultation System</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Attach event listeners
    PCU.attachAuthListeners();
  };

  // ─── Attach Auth Event Listeners ─────────────────
  PCU.attachAuthListeners = function () {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        PCU.switchAuthTab(this.getAttribute('data-auth-tab'));
      });
    });

    // Role selection
    document.querySelectorAll('input[name="reg_role"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        PCU.toggleRoleFields(this.value);
      });
    });

    // Login form
    var loginForm = document.getElementById('auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var userId = document.getElementById('auth-login-id').value;
        var password = document.getElementById('auth-login-password').value;
        var errorEl = document.getElementById('auth-login-error');
        var successEl = document.getElementById('auth-login-success');

        errorEl.classList.remove('auth-form__error--visible');
        successEl.classList.remove('auth-form__success--visible');

        var result = PCU.login(userId, password);
        if (result.success) {
          successEl.textContent = 'Login successful! Redirecting...';
          successEl.classList.add('auth-form__success--visible');
          setTimeout(function () {
            PCU.hideAuthPage();
            PCU.showMainApp();
            PCU.initApp();
          }, 500);
        } else {
          errorEl.textContent = result.error;
          errorEl.classList.add('auth-form__error--visible');
        }
      });
    }

    // Register form
    var registerForm = document.getElementById('auth-register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var role = document.querySelector('input[name="reg_role"]:checked').value;
        var name = document.getElementById('reg-name').value;
        var email = document.getElementById('reg-email').value;
        var password = document.getElementById('reg-password').value;
        var errorEl = document.getElementById('auth-register-error');
        var successEl = document.getElementById('auth-register-success');

        errorEl.classList.remove('auth-form__error--visible');
        successEl.classList.remove('auth-form__success--visible');

        var result;
        if (role === 'student') {
          var studentId = document.getElementById('reg-student-id').value;
          var course = document.getElementById('reg-course').value;
          result = PCU.registerStudent({ studentId: studentId, name: name, email: email, password: password, course: course });
        } else {
          var department = document.getElementById('reg-department').value;
          var specialization = document.getElementById('reg-specialization').value;
          result = PCU.registerFaculty({ name: name, email: email, password: password, department: department, specialization: specialization });
        }

        if (result.success) {
          if (result.pending) {
            successEl.innerHTML = 'Registration submitted! Your account is <strong>pending admin approval</strong>. You will be able to log in once an administrator approves your account.';
          } else {
            successEl.textContent = 'Registration successful! You can now sign in.';
          }
          successEl.classList.add('auth-form__success--visible');
          registerForm.reset();
          // Reset role to student
          document.querySelector('input[name="reg_role"][value="student"]').checked = true;
          PCU.toggleRoleFields('student');
          // Switch to login tab after delay
          setTimeout(function () { PCU.switchAuthTab('login'); }, 2000);
        } else {
          errorEl.textContent = result.error;
          errorEl.classList.add('auth-form__error--visible');
        }
      });
    }
  };

  // ─── Init Auth System ────────────────────────────
  PCU.initAuth = function () {
    PCU.renderAuthPage();

    if (PCU.checkSession()) {
      PCU.hideAuthPage();
      PCU.showMainApp();
      return true;
    } else {
      PCU.showAuthPage();
      PCU.hideMainApp();
      return false;
    }
  };

  window.PCU = PCU;
})();
