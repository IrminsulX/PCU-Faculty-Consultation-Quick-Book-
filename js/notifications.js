/* ============================================
   PCU Quick-Book — Notification Queue
   ============================================ */
(function () {
  'use strict';

  var PCU = window.PCU;

  PCU.addNotification = function (data) {
    var notif = {
      id: PCU.generateId(),
      type: data.type || 'info',
      title: data.title || 'Notification',
      message: data.message || '',
      professorId: data.professorId || '',
      professorName: data.professorName || '',
      timestamp: new Date().toISOString(),
      read: false
    };
    PCU.notificationQueue.unshift(notif);
    PCU.saveNotifications();
    if (PCU.renderNotificationPanel) PCU.renderNotificationPanel();
    if (PCU.updateBellBadge) PCU.updateBellBadge();
    if (PCU.showToast) PCU.showToast(data.title, data.type);
  };

  PCU.markAllRead = function () {
    PCU.notificationQueue.forEach(function (n) { n.read = true; });
    PCU.saveNotifications();
    if (PCU.updateBellBadge) PCU.updateBellBadge();
    if (PCU.renderNotificationPanel) PCU.renderNotificationPanel();
  };

  PCU.getUnreadCount = function () {
    return PCU.notificationQueue.filter(function (n) { return !n.read; }).length;
  };

  PCU.timeAgo = function (isoStr) {
    var diff = Date.now() - new Date(isoStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  };

  PCU.renderNotificationPanel = function () {
    var list = document.getElementById('notif-list');
    if (!list) return;
    if (PCU.notificationQueue.length === 0) {
      list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }
    var icons = { confirmation: '\u2705', decline: '\u274C', request: '\uD83D\uDCE9', reminder: '\u23F0', info: '\u2139\uFE0F' };
    list.innerHTML = PCU.notificationQueue.map(function (n) {
      var icon = icons[n.type] || '\uD83D\uDD14';
      return '<div class="notif-item' + (n.read ? '' : ' notif-item--unread') + '">' +
        '<span class="notif-item__icon">' + icon + '</span>' +
        '<div class="notif-item__body">' +
          '<p class="notif-item__title">' + n.title + '</p>' +
          '<p class="notif-item__msg">' + n.message + '</p>' +
          '<span class="notif-item__time">' + PCU.timeAgo(n.timestamp) + '</span>' +
        '</div></div>';
    }).join('');
    list.insertAdjacentHTML('beforeend', '<button class="notif-clear-btn" id="notif-clear-btn">Mark All as Read</button>');
    var btn = document.getElementById('notif-clear-btn');
    if (btn) btn.addEventListener('click', PCU.markAllRead);
  };

  PCU.updateBellBadge = function () {
    var badge = document.getElementById('notif-badge');
    if (!badge) return;
    var count = PCU.getUnreadCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  };
})();
