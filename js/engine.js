/* ============================================
   PCU Quick-Book — Conflict Engine & Booking
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  /**
   * Check if a proposed slot conflicts with existing bookings (buffer-aware).
   */
  PCU.hasConflict = function (profId, date, startTime, endTime, excludeBookingId) {
    var prof = PCU.getProfessor(profId);
    var buffer = prof ? prof.bufferTime : 15;
    var existing = PCU.getProfessorBookingsOnDate(profId, date);
    var pStart = PCU.timeToMinutes(startTime);
    var pEnd = PCU.timeToMinutes(endTime);

    for (var i = 0; i < existing.length; i++) {
      var b = existing[i];
      if (excludeBookingId && b.id === excludeBookingId) continue;
      var eStart = PCU.timeToMinutes(b.startTime);
      var eEnd = PCU.timeToMinutes(b.endTime);
      var blockStart = eStart - buffer;
      var blockEnd = eEnd + buffer;
      if (pStart < blockEnd && pEnd > blockStart) {
        return { conflict: true, conflictingBooking: b };
      }
    }
    return { conflict: false, conflictingBooking: null };
  };

  /**
   * Get consultation hours for a professor on a given day.
   * If date is provided, also filters by specific date.
   */
  PCU.getConsultationHoursForDay = function (profId, dayName, date) {
    var prof = PCU.getProfessor(profId);
    if (!prof) return [];
    return prof.consultationHours.filter(function (ch) {
      if (ch.day !== dayName) return false;
      if (date && ch.date && ch.date !== date) return false;
      return true;
    });
  };

  /**
   * Generate available time slots for a professor on a date.
   */
  PCU.getAvailableSlots = function (profId, date, duration) {
    duration = duration || 30;
    var dayName = PCU.getDayOfWeek(date);
    var hours = PCU.getConsultationHoursForDay(profId, dayName, date);
    var allSlots = [];

    for (var h = 0; h < hours.length; h++) {
      var start = PCU.timeToMinutes(hours[h].start);
      var end = PCU.timeToMinutes(hours[h].end);
      for (var t = start; t + duration <= end; t += duration) {
        allSlots.push({ startTime: PCU.minutesToTime(t), endTime: PCU.minutesToTime(t + duration) });
      }
    }

    var available = [];
    for (var s = 0; s < allSlots.length; s++) {
      var slot = allSlots[s];
      var result = PCU.hasConflict(profId, date, slot.startTime, slot.endTime);
      slot.available = !result.conflict;
      slot.conflictingBooking = result.conflictingBooking;
      available.push(slot);
    }
    return available;
  };

  /**
   * Process a meeting request. Returns { success, booking } or { success:false, autoDeclined, alternatives, ... }.
   */
  PCU.requestMeeting = function (data) {
    var prof = PCU.getProfessor(data.professorId);
    if (!prof) return { success: false, reason: 'Professor not found.' };

    var date = data.date, startTime = data.startTime, endTime = data.endTime;
    var dayName = PCU.getDayOfWeek(date);
    var dayHours = PCU.getConsultationHoursForDay(data.professorId, dayName, date);

    if (dayHours.length === 0) {
      return { success: false, reason: prof.name + ' does not hold consultation hours on ' + dayName + '.' };
    }

    var inHours = dayHours.some(function (ch) {
      return PCU.timeToMinutes(startTime) >= PCU.timeToMinutes(ch.start) &&
             PCU.timeToMinutes(endTime) <= PCU.timeToMinutes(ch.end);
    });
    if (!inHours) {
      return { success: false, reason: 'Time outside ' + prof.name + '\'s hours on ' + dayName + '.' };
    }

    var conflictResult = PCU.hasConflict(data.professorId, date, startTime, endTime);

    if (conflictResult.conflict) {
      var declinedBooking = {
        id: PCU.generateId(), professorId: data.professorId,
        studentName: data.studentName || 'Unknown', studentId: data.studentId || '',
        studentEmail: data.studentEmail || '', date: date,
        startTime: startTime, endTime: endTime,
        purpose: data.purpose || '', consultationType: data.consultationType || 'other',
        mode: data.mode || 'face-to-face', status: 'declined',
        createdAt: new Date().toISOString()
      };
      PCU.bookings.push(declinedBooking);
      PCU.saveBookings();

      // Save to local SQLite database
      if (PCU.dbReady && PCU.db) {
        PCU.dbAddBooking({
          id: declinedBooking.id, professorId: declinedBooking.professorId,
          studentId: declinedBooking.studentId, studentName: declinedBooking.studentName,
          studentEmail: declinedBooking.studentEmail, date: declinedBooking.date,
          startTime: declinedBooking.startTime, endTime: declinedBooking.endTime,
          purpose: declinedBooking.purpose, consultationType: declinedBooking.consultationType,
          mode: declinedBooking.mode, status: declinedBooking.status
        });
      }

      // Save to server API so faculty portal can see it
      if (PCU.apiCreateBooking) {
        PCU.apiCreateBooking({
          id: declinedBooking.id, professorId: declinedBooking.professorId,
          studentId: declinedBooking.studentId, studentName: declinedBooking.studentName,
          studentEmail: declinedBooking.studentEmail, date: declinedBooking.date,
          startTime: declinedBooking.startTime, endTime: declinedBooking.endTime,
          purpose: declinedBooking.purpose, consultationType: declinedBooking.consultationType,
          mode: declinedBooking.mode, status: declinedBooking.status
        }).catch(function () {});
      }

      PCU.addNotification({
        type: 'decline',
        title: 'Request Auto-Declined — Scheduling Conflict',
        message: 'Meeting with ' + prof.name + ' on ' + PCU.formatDate(date) + ' at ' + PCU.formatTime12(startTime) +
          ' auto-declined. Conflicts with ' + conflictResult.conflictingBooking.studentName +
          ' (' + PCU.formatTime12(conflictResult.conflictingBooking.startTime) + '–' +
          PCU.formatTime12(conflictResult.conflictingBooking.endTime) + '). Buffer: ' + prof.bufferTime + ' min.',
        professorId: '', professorName: prof.name,
        studentId: data.studentId, studentName: data.studentName || ''
      });

      var slots = PCU.getAvailableSlots(data.professorId, date, 30);
      var alternatives = slots.filter(function (s) { return s.available; }).slice(0, 4);

      return {
        success: false, autoDeclined: true,
        reason: 'Time slot conflicts with existing booking. Buffer: ' + prof.bufferTime + ' min.',
        conflictingWith: conflictResult.conflictingBooking.studentName,
        alternatives: alternatives
      };
    }

    // No conflict — create pending request for faculty approval
    var pendingBooking = {
      id: PCU.generateId(), professorId: data.professorId,
      studentName: data.studentName || 'Unknown', studentId: data.studentId || '',
      studentEmail: data.studentEmail || '', date: date,
      startTime: startTime, endTime: endTime,
      purpose: data.purpose || '', consultationType: data.consultationType || 'other',
      mode: data.mode || 'face-to-face', status: 'pending',
      createdAt: new Date().toISOString()
    };
    PCU.bookings.push(pendingBooking);
    PCU.saveBookings();

    // Save to local SQLite database
    if (PCU.dbReady && PCU.db) {
      PCU.dbAddBooking({
        id: pendingBooking.id, professorId: pendingBooking.professorId,
        studentId: pendingBooking.studentId, studentName: pendingBooking.studentName,
        studentEmail: pendingBooking.studentEmail, date: pendingBooking.date,
        startTime: pendingBooking.startTime, endTime: pendingBooking.endTime,
        purpose: pendingBooking.purpose, consultationType: pendingBooking.consultationType,
        mode: pendingBooking.mode, status: pendingBooking.status
      });
    }

    // Save to server API so faculty portal can see it
    if (PCU.apiCreateBooking) {
      PCU.apiCreateBooking({
        id: pendingBooking.id, professorId: pendingBooking.professorId,
        studentId: pendingBooking.studentId, studentName: pendingBooking.studentName,
        studentEmail: pendingBooking.studentEmail, date: pendingBooking.date,
        startTime: pendingBooking.startTime, endTime: pendingBooking.endTime,
        purpose: pendingBooking.purpose, consultationType: pendingBooking.consultationType,
        mode: pendingBooking.mode, status: pendingBooking.status
      }).catch(function () {});
    }

    // Notify student that request is pending (student only)
    PCU.addNotification({
      type: 'request',
      title: 'Booking Request Sent',
      message: 'Your consultation request with ' + prof.name + ' on ' + PCU.formatDate(date) +
        ' at ' + PCU.formatTime12(startTime) + '–' + PCU.formatTime12(endTime) +
        ' is pending faculty approval.',
      professorId: '', professorName: prof.name,
      studentId: data.studentId, studentName: data.studentName || ''
    });

    // Notify faculty of the new request (faculty only)
    PCU.addNotification({
      type: 'request',
      title: 'New Consultation Request',
      message: (data.studentName || 'A student') + ' has requested a consultation on ' + PCU.formatDate(date) +
        ' at ' + PCU.formatTime12(startTime) + '–' + PCU.formatTime12(endTime) + '. Please review.',
      professorId: data.professorId, professorName: prof.name,
      studentId: '', studentName: data.studentName || ''
    });

    return { success: true, booking: pendingBooking };
  };
})();
