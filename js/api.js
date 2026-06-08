/* ============================================
   PCU Quick-Book — API Client
   Communicates with Express backend
   ============================================ */
(function () {
    'use strict';

    var PCU = window.PCU || {};

    var API_BASE = '';

    // Helper: make API request
    PCU.api = async function (method, url, data) {
        var options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        var response = await fetch(API_BASE + url, options);
        return await response.json();
    };

    // Auth API
    PCU.apiLogin = function (userId, password) {
        return PCU.api('POST', '/api/auth/login', { userId: userId, password: password });
    };

    PCU.apiLogout = function (sessionId) {
        return PCU.api('POST', '/api/auth/logout', { sessionId: sessionId });
    };

    PCU.apiCheckSession = function (sessionId) {
        return PCU.api('GET', '/api/auth/session/' + sessionId);
    };

    // Users API
    PCU.apiGetAllUsers = function () {
        return PCU.api('GET', '/api/users');
    };

    PCU.apiGetUser = function (userId) {
        return PCU.api('GET', '/api/users/' + userId);
    };

    PCU.apiCreateUser = function (userData) {
        return PCU.api('POST', '/api/users', userData);
    };

    PCU.apiUpdateUserStatus = function (userId, status) {
        return PCU.api('PUT', '/api/users/' + userId + '/status', { status: status });
    };

    PCU.apiDeleteUser = function (userId) {
        return PCU.api('DELETE', '/api/users/' + userId);
    };

    // Blacklist API
    PCU.apiGetBlacklist = function () {
        return PCU.api('GET', '/api/blacklist');
    };

    PCU.apiCheckBlacklist = function (userId) {
        return PCU.api('GET', '/api/blacklist/check/' + userId);
    };

    // Bookings API
    PCU.apiGetAllBookings = function () {
        return PCU.api('GET', '/api/bookings');
    };

    PCU.apiGetBookingsByProfessor = function (profId) {
        return PCU.api('GET', '/api/bookings/professor/' + profId);
    };

    PCU.apiGetBookingsByStudent = function (studentId) {
        return PCU.api('GET', '/api/bookings/student/' + studentId);
    };

    PCU.apiCreateBooking = function (booking) {
        return PCU.api('POST', '/api/bookings', booking);
    };

    PCU.apiUpdateBookingStatus = function (bookingId, status) {
        return PCU.api('PUT', '/api/bookings/' + bookingId + '/status', { status: status });
    };

    // Notifications API
    PCU.apiGetNotifications = function (filters) {
        var url = '/api/notifications';
        if (filters) {
            var params = [];
            if (filters.professorId) params.push('professor_id=' + encodeURIComponent(filters.professorId));
            if (filters.studentId) params.push('student_id=' + encodeURIComponent(filters.studentId));
            if (params.length > 0) url += '?' + params.join('&');
        }
        return PCU.api('GET', url);
    };

    PCU.apiCreateNotification = function (notif) {
        return PCU.api('POST', '/api/notifications', notif);
    };

    PCU.apiMarkAllRead = function (studentId, professorId) {
        return PCU.api('PUT', '/api/notifications/read', { student_id: studentId || '', professor_id: professorId || '' });
    };

    PCU.apiClearOldNotifications = function () {
        return PCU.api('POST', '/api/notifications/clear-old');
    };

    PCU.apiDeleteAllNotifications = function (studentId, professorId) {
        var params = [];
        if (studentId) params.push('student_id=' + encodeURIComponent(studentId));
        if (professorId) params.push('professor_id=' + encodeURIComponent(professorId));
        var qs = params.length > 0 ? '?' + params.join('&') : '';
        return PCU.api('DELETE', '/api/notifications' + qs);
    };

    // Stats API
    PCU.apiGetStats = function () {
        return PCU.api('GET', '/api/stats');
    };

    // Reset API
    PCU.apiResetDatabase = function () {
        return PCU.api('POST', '/api/reset');
    };

    window.PCU = PCU;
})();
