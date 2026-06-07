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

  // ─── Department-Course Mapping ────────────────────
  PCU.DEPARTMENT_COURSES = {
    'College of Arts and Sciences': [
      'Bachelor of Arts in English Language Studies',
      'Bachelor of Arts in Broadcasting',
      'Bachelor of Arts in Political Science',
      'Bachelor of Science in Biology',
      'Bachelor of Science in Psychology',
      'Bachelor of Arts in Psychology',
      'Bachelor of Arts in Philosophy'
    ],
    'College of Business Administration and Accountancy': [
      'Bachelor of Science in Accountancy',
      'Bachelor of Science in Business Administration - Major in Marketing Management',
      'Bachelor of Science in Business Administration - Major in Operations Management',
      'Bachelor of Science in Business Administration - Major in Financial Management',
      'Bachelor of Science in Customs Administration',
      'Bachelor of Science in Real Estate Management'
    ],
    'College of Criminal Justice': [
      'Bachelor of Science in Criminology'
    ],
    'College of Education': [
      'Bachelor of Early Childhood Education',
      'Bachelor of Elementary Education',
      'Bachelor of Secondary Education - Major in English',
      'Bachelor of Secondary Education - Major in General Science',
      'Bachelor of Secondary Education - Major in Mathematics',
      'Bachelor of Secondary Education - Major in Social Studies',
      'Bachelor of Physical Education'
    ],
    'College of Informatics': [
      'Bachelor of Science in Computer Engineering',
      'Bachelor of Science in Computer Science',
      'Bachelor of Science in Information Technology',
      'Bachelor of Science in Information System',
      'Bachelor of Multimedia Arts'
    ],
    'College of Hospitality and Tourism Management': [
      'Bachelor of Science in Hospitality Management',
      'Bachelor of Science in Tourism Management'
    ],
    'College of Nursing and Health Sciences': [
      'Bachelor of Science in Nursing',
      'Bachelor of Science in Nutrition and Dietetics'
    ],
    'College of Social Work': [
      'Bachelor of Science in Social Work'
    ],
    'College of Law': [
      'Juris Doctor'
    ],
    'Institute of Philosophy and Religious Studies': [
      'Bachelor of Arts in Church Management'
    ]
  };

  // ─── Update Course Dropdown Based on Department ──
  PCU.updateCourseOptions = function (department) {
    var courseSelect = document.getElementById('reg-course');
    if (!courseSelect) return;

    courseSelect.innerHTML = '<option value="">-- Select Course --</option>';

    if (department && PCU.DEPARTMENT_COURSES[department]) {
      PCU.DEPARTMENT_COURSES[department].forEach(function (course) {
        var option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
      });
    }
  };

  // ─── Toggle Faculty Fields on Role Select ────────
  PCU.toggleRoleFields = function (role) {
    var facultyFields = document.querySelector('.auth-faculty-fields');
    var studentFields = document.querySelector('.student-fields');
    if (facultyFields) {
      facultyFields.classList.toggle('auth-faculty-fields--visible', role === 'faculty');
    }
    if (studentFields) {
      studentFields.style.display = role === 'student' ? '' : 'none';
    }
  };

  // ─── Register Student ────────────────────────────
  PCU.registerStudent = async function (data) {
    var studentId = data.studentId.trim();
    var name = data.name.trim();
    var email = data.email.trim().toLowerCase();
    var password = data.password.trim();
    var department = data.department.trim();
    var course = data.course.trim();

    // Validate 9-digit ID
    if (!/^[0-9]{9}$/.test(studentId)) {
      return { success: false, error: 'Student ID must be exactly 9 digits.' };
    }
    if (!name || !email || !password || !department || !course) {
      return { success: false, error: 'Please fill all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Create user account via API
    var userId = 'S' + studentId;
    var result = await PCU.apiCreateUser({
      user_id: userId,
      name: name,
      email: email,
      password: password,
      role: 'student',
      status: 'approved',
      department: department,
      specialization: '',
      course: course
    });

    return result;
  };

  // ─── Register Faculty ────────────────────────────
  PCU.registerFaculty = async function (data) {
    var name = data.name.trim();
    var email = data.email.trim().toLowerCase();
    var password = data.password.trim();
    var department = data.department.trim();
    var specialization = data.specialization.trim();
    var facultyIdInput = data.facultyId ? data.facultyId.trim() : '';

    if (!name || !email || !password || !department) {
      return { success: false, error: 'Please fill all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check if email already exists
    var existingEmail = await PCU.apiGetUser(email);
    if (existingEmail) {
      return { success: false, error: 'This email is already registered.' };
    }

    // Use provided faculty ID or generate one
    var facultyId;
    if (facultyIdInput && /^[0-9]{9}$/.test(facultyIdInput)) {
      var existingId = await PCU.apiGetUser(facultyIdInput);
      if (existingId) {
        return { success: false, error: 'This Faculty ID is already registered.' };
      }
      var blacklisted = await PCU.apiCheckBlacklist(facultyIdInput);
      if (blacklisted.blacklisted) {
        return { success: false, error: 'This Faculty ID has been previously deleted and cannot be reused.' };
      }
      facultyId = facultyIdInput;
    } else {
      var allUsers = await PCU.apiGetAllUsers();
      var count = allUsers.filter(function(u) { return u.role === 'faculty'; }).length + 1;
      facultyId = 'F' + String(count).padStart(3, '0');
    }

    // Create user account with pending status
    var result = await PCU.apiCreateUser({
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

    if (result.success) {
      return { success: true, pending: true };
    }
    return result;
  };

  // ─── Login ───────────────────────────────────────
  PCU.login = async function (userId, password) {
    userId = userId.trim();
    password = password.trim();

    if (!userId || !password) {
      return { success: false, error: 'Please enter your credentials.' };
    }

    // Use API
    var result = await PCU.apiLogin(userId, password);
    if (!result.success) {
      return result;
    }

    // Set current user session
    PCU.currentUser = result.user;
    PCU.sessionId = result.sessionId;

    // Save to localStorage for portal pages
    localStorage.setItem('pcu_current_user', JSON.stringify(PCU.currentUser));
    localStorage.setItem('pcu_session_id', PCU.sessionId);

    return { success: true, user: PCU.currentUser };
  };

  // ─── Logout ──────────────────────────────────────
  PCU.logout = async function () {
    var sessionId = localStorage.getItem('pcu_session_id');
    if (sessionId) {
      await PCU.apiLogout(sessionId);
    }
    PCU.currentUser = null;
    PCU.sessionId = null;
    localStorage.removeItem('pcu_current_user');
    localStorage.removeItem('pcu_session_id');
    PCU.showAuthPage();
    PCU.hideMainApp();
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
              '<div class="student-fields" id="reg-student-fields">' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Student ID *</label>' +
                  '<input type="text" class="auth-form__input" id="reg-student-id" placeholder="e.g., 20223294" maxlength="9" pattern="[0-9]{9}">' +
                '</div>' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Department *</label>' +
                  '<select class="auth-form__select" id="reg-student-department">' +
                    '<option value="">-- Select Department --</option>' +
                    '<option value="College of Arts and Sciences">College of Arts and Sciences</option>' +
                    '<option value="College of Business Administration and Accountancy">College of Business Administration and Accountancy</option>' +
                    '<option value="College of Criminal Justice">College of Criminal Justice</option>' +
                    '<option value="College of Education">College of Education</option>' +
                    '<option value="College of Informatics">College of Informatics</option>' +
                    '<option value="College of Hospitality and Tourism Management">College of Hospitality and Tourism Management</option>' +
                    '<option value="College of Nursing and Health Sciences">College of Nursing and Health Sciences</option>' +
                    '<option value="College of Social Work">College of Social Work</option>' +
                    '<option value="College of Law">College of Law</option>' +
                    '<option value="Institute of Philosophy and Religious Studies">Institute of Philosophy and Religious Studies</option>' +
                  '</select>' +
                '</div>' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Course / Program *</label>' +
                  '<select class="auth-form__select" id="reg-course">' +
                    '<option value="">-- Select Department First --</option>' +
                  '</select>' +
                '</div>' +
              '</div>' +
              // Faculty-specific fields (hidden by default)
              '<div class="auth-faculty-fields" id="reg-faculty-fields">' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Faculty ID *</label>' +
                  '<input type="text" class="auth-form__input" id="reg-faculty-id" placeholder="e.g., 201900123" maxlength="9" pattern="[0-9]{9}">' +
                '</div>' +
                '<div class="auth-form__group">' +
                  '<label class="auth-form__label">Department *</label>' +
                  '<select class="auth-form__select" id="reg-department">' +
                    '<option value="">-- Select Department --</option>' +
                    '<option value="College of Arts and Sciences">College of Arts and Sciences</option>' +
                    '<option value="College of Business Administration and Accountancy">College of Business Administration and Accountancy</option>' +
                    '<option value="College of Criminal Justice">College of Criminal Justice</option>' +
                    '<option value="College of Education">College of Education</option>' +
                    '<option value="College of Informatics">College of Informatics</option>' +
                    '<option value="College of Hospitality and Tourism Management">College of Hospitality and Tourism Management</option>' +
                    '<option value="College of Nursing and Health Sciences">College of Nursing and Health Sciences</option>' +
                    '<option value="College of Social Work">College of Social Work</option>' +
                    '<option value="College of Law">College of Law</option>' +
                    '<option value="Institute of Philosophy and Religious Studies">Institute of Philosophy and Religious Studies</option>' +
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

    // Student department change → update course dropdown
    var deptSelect = document.getElementById('reg-student-department');
    if (deptSelect) {
      deptSelect.addEventListener('change', function () {
        PCU.updateCourseOptions(this.value);
      });
    }

    // Login form
    var loginForm = document.getElementById('auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var userId = document.getElementById('auth-login-id').value;
        var password = document.getElementById('auth-login-password').value;
        var errorEl = document.getElementById('auth-login-error');
        var successEl = document.getElementById('auth-login-success');

        errorEl.classList.remove('auth-form__error--visible');
        successEl.classList.remove('auth-form__success--visible');

        var result = await PCU.login(userId, password);
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
      registerForm.addEventListener('submit', async function (e) {
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
          var department = document.getElementById('reg-student-department').value;
          var course = document.getElementById('reg-course').value;
          result = PCU.registerStudent({ studentId: studentId, name: name, email: email, password: password, department: department, course: course });
        } else {
          var facultyId = document.getElementById('reg-faculty-id').value;
          var department = document.getElementById('reg-department').value;
          var specialization = document.getElementById('reg-specialization').value;
          result = PCU.registerFaculty({ facultyId: facultyId, name: name, email: email, password: password, department: department, specialization: specialization });
        }

        if (result.success) {
          if (result.pending) {
            successEl.innerHTML = 'Registration submitted! Your account is <strong>pending admin approval</strong>. You will be able to log in once an administrator approves your account.';
          } else {
            successEl.textContent = 'Registration successful! You can now sign in.';
          }
          successEl.classList.add('auth-form__success--visible');
          registerForm.reset();
          // Reset role to student and clear course dropdown
          document.querySelector('input[name="reg_role"][value="student"]').checked = true;
          PCU.toggleRoleFields('student');
          PCU.updateCourseOptions('');
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
