/* ============================================
   PCU Quick-Book — Help Desk Panel
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  // ─── FAQ Data ──────────────────────────────────────
  var FAQ_DATA = [
    { q: 'How do I book a consultation with a faculty member?',
      a: 'You can book through the <strong>Professor Directory</strong> tab by clicking <em>Request Meeting</em> on any professor card, or use the <strong>Quick-Book Form</strong> to fill out your details and select a time slot directly.' },
    { q: 'What happens if my preferred time slot is already taken?',
      a: 'The system automatically checks for conflicts and enforces buffer time between meetings. If your chosen slot conflicts with an existing booking, the request is <strong>auto-declined</strong> and you\'ll see suggested alternative slots. You can also pick a different date or time.' },
    { q: 'How do I cancel or reschedule a booking?',
      a: 'Log in to the <strong>Student Portal</strong> using your Student ID and email. Under <em>Upcoming Consultations</em>, click <strong>Cancel</strong> on the booking you wish to remove. To reschedule, cancel the existing booking and create a new one with your preferred time.' },
    { q: 'What is the buffer time policy?',
      a: 'Buffer time (10\u201320 minutes depending on the professor) is automatically enforced between back-to-back consultations. This ensures faculty members have time to prepare and wrap up between meetings. The system will not allow booking a slot that overlaps with existing bookings plus their buffer window.' },
    { q: 'Can I choose between face-to-face and online consultation?',
      a: 'Yes. When filling out the Quick-Book form, you can select either <strong>Face-to-Face</strong> (on-campus meeting) or <strong>Online</strong> (via Google Meet / Zoom). The professor will receive your preference and send a meeting link if online is chosen.' },
    { q: 'How do I access the Student Portal?',
      a: 'Click <strong>Student Portal</strong> in the top navigation bar. Enter your Student ID Number and PCU email address. Once logged in, you can view your upcoming and past consultations, cancel bookings, and check notifications.' },
    { q: 'What are the consultation hours?',
      a: 'Standard consultation hours are <strong>Monday\u2013Friday, 8:00 AM\u20135:00 PM</strong> and <strong>Saturday, 8:00 AM\u201312:00 PM</strong>. The university is closed on Sundays and holidays. Individual faculty hours may vary\u2014check their card in the directory for exact schedules.' },
    { q: 'I didn\'t receive a confirmation email. What should I do?',
      a: 'First, check your spam/junk folder. Confirmation emails come from the PCU Faculty Consultation System. If you still can\'t find it, log into the <strong>Student Portal</strong> to verify your booking status. For persistent issues, contact the Office of Academic Affairs at the details below.' },
    { q: 'How do notifications work?',
      a: 'The notification bell (&#x1F514;) in the top bar shows unread notifications. Click it to open the panel and view booking confirmations, auto-declines, and reminders. Notifications are also accessible inside the Student Portal under <em>Your Notifications</em>.' },
    { q: 'Who do I contact for technical issues?',
      a: 'For system problems or bugs, email <strong>itsupport@pcu.edu.ph</strong> or call <strong>(02) 8524-6789 local 245</strong>. For questions about consultation policies, contact the Office of Academic Affairs.' }
  ];

  // ─── Render Help Desk Panel ────────────────────────
  PCU.renderHelpDesk = function () {
    var body = document.getElementById('helpdesk-body');
    if (!body) return;

    var html = '';

    // Search bar
    html += '<div class="helpdesk-search">' +
      '<span class="helpdesk-search__icon">&#x1F50D;</span>' +
      '<input type="text" class="helpdesk-search__input" id="helpdesk-search-input" placeholder="Search FAQs...">' +
      '<div class="helpdesk-search__results" id="helpdesk-search-results"></div>' +
    '</div>';

    // Quick Guide section
    html += '<div class="helpdesk-section" id="helpdesk-guide">' +
      '<h3 class="helpdesk-section__title">&#x1F4D6; Quick Guide</h3>' +
      '<ol class="helpdesk-steps">' +
        '<li class="helpdesk-steps__item"><span class="helpdesk-steps__num">1</span><span>Browse the <strong>Professor Directory</strong> to find your faculty member by name, department, or availability.</span></li>' +
        '<li class="helpdesk-steps__item"><span class="helpdesk-steps__num">2</span><span>Click <strong>Request Meeting</strong> on a professor card or switch to the <strong>Quick-Book Form</strong> for a detailed booking.</span></li>' +
        '<li class="helpdesk-steps__item"><span class="helpdesk-steps__num">3</span><span>Fill in your details, select a date and time slot. The system checks for <strong>conflicts automatically</strong>.</span></li>' +
        '<li class="helpdesk-steps__item"><span class="helpdesk-steps__num">4</span><span>Receive instant confirmation or alternative suggestions. Track your bookings via the <strong>Student Portal</strong>.</span></li>' +
      '</ol>' +
    '</div>';

    // FAQ section
    html += '<div class="helpdesk-section" id="helpdesk-faqs">' +
      '<h3 class="helpdesk-section__title">&#x2753; Frequently Asked Questions</h3>';

    FAQ_DATA.forEach(function (faq, idx) {
      html += '<div class="helpdesk-faq" data-faq-idx="' + idx + '">' +
        '<button class="helpdesk-faq__question" data-faq-toggle="' + idx + '">' +
          '<span>' + faq.q + '</span>' +
          '<span class="helpdesk-faq__chevron">&#x25BC;</span>' +
        '</button>' +
        '<div class="helpdesk-faq__answer">' + faq.a + '</div>' +
      '</div>';
    });

    html += '</div>';

    // Contact section
    html += '<div class="helpdesk-section" id="helpdesk-contact-section">' +
      '<h3 class="helpdesk-section__title">&#x1F4DE; Contact Support</h3>' +
      '<div class="helpdesk-contact">' +
        '<p class="helpdesk-contact__title">&#x1F3EB; Office of Academic Affairs</p>' +
        '<div class="helpdesk-contact__row"><span class="helpdesk-contact__icon">&#x1F4E7;</span><span>academics@pcu.edu.ph</span></div>' +
        '<div class="helpdesk-contact__row"><span class="helpdesk-contact__icon">&#x1F4DE;</span><span>(02) 8524-6789 local 201</span></div>' +
      '</div>' +
      '<div class="helpdesk-contact" style="margin-top:0.8rem;">' +
        '<p class="helpdesk-contact__title">&#x1F6E0;&#xFE0F; IT Support</p>' +
        '<div class="helpdesk-contact__row"><span class="helpdesk-contact__icon">&#x1F4E7;</span><span>itsupport@pcu.edu.ph</span></div>' +
        '<div class="helpdesk-contact__row"><span class="helpdesk-contact__icon">&#x1F4DE;</span><span>(02) 8524-6789 local 245</span></div>' +
      '</div>' +
    '</div>';

    body.innerHTML = html;

    // Attach FAQ accordion toggles
    body.querySelectorAll('.helpdesk-faq__question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var faq = this.closest('.helpdesk-faq');
        if (!faq) return;
        var wasOpen = faq.classList.contains('helpdesk-faq--open');
        // Close all others
        body.querySelectorAll('.helpdesk-faq--open').forEach(function (f) { f.classList.remove('helpdesk-faq--open'); });
        // Toggle clicked (open if it was closed)
        if (!wasOpen) faq.classList.add('helpdesk-faq--open');
      });
    });

    // Search
    var searchInput = document.getElementById('helpdesk-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        PCU.helpdeskSearch(this.value.trim().toLowerCase());
      });
    }
  };

  // ─── FAQ Search ─────────────────────────────────────
  PCU.helpdeskSearch = function (query) {
    var body = document.getElementById('helpdesk-body');
    var resultsEl = document.getElementById('helpdesk-search-results');
    if (!body || !resultsEl) return;

    if (query.length === 0) {
      resultsEl.textContent = '';
      // Show all sections and FAQs
      body.querySelectorAll('.helpdesk-section').forEach(function (s) { s.style.display = ''; });
      body.querySelectorAll('.helpdesk-faq').forEach(function (f) { f.style.display = ''; });
      return;
    }

    var matchCount = 0;
    body.querySelectorAll('.helpdesk-faq').forEach(function (faq) {
      var q = faq.querySelector('.helpdesk-faq__question span:first-child');
      var a = faq.querySelector('.helpdesk-faq__answer');
      var qText = q ? q.textContent.toLowerCase() : '';
      var aText = a ? a.textContent.toLowerCase() : '';

      if (qText.indexOf(query) !== -1 || aText.indexOf(query) !== -1) {
        faq.style.display = '';
        matchCount++;
      } else {
        faq.style.display = 'none';
      }
    });

    // Show/hide sections based on whether they have visible FAQs
    body.querySelectorAll('.helpdesk-section').forEach(function (section) {
      var visibleFaqs = section.querySelectorAll('.helpdesk-faq[style=""]').length +
                        section.querySelectorAll('.helpdesk-faq:not([style])').length -
                        section.querySelectorAll('.helpdesk-faq[style*="display: none"]').length;
      if (section.querySelector('.helpdesk-section__title') && section.querySelector('.helpdesk-section__title').textContent.indexOf('Frequently Asked') !== -1) {
        // FAQ section: hide if no matching FAQs AND query exists
        // Check visible count more carefully
        var allFaqs = section.querySelectorAll('.helpdesk-faq');
        var visible = 0;
        allFaqs.forEach(function (f) {
          if (f.style.display !== 'none') visible++;
        });
        section.style.display = visible > 0 ? '' : 'none';
      }
    });

    resultsEl.textContent = matchCount + ' result' + (matchCount !== 1 ? 's' : '') + ' found';
  };

  // ─── Toggle Panel ───────────────────────────────────
  PCU.toggleHelpDesk = function () {
    var panel = document.getElementById('helpdesk-panel');
    if (!panel) return;
    var isOpen = panel.classList.contains('helpdesk-panel--open');
    if (isOpen) {
      panel.classList.remove('helpdesk-panel--open');
    } else {
      PCU.renderHelpDesk();
      panel.classList.add('helpdesk-panel--open');
    }
  };
})();
