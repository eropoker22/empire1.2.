window.Empire = window.Empire || {};
window.Empire.UINotifications = window.Empire.UINotifications || {};

window.Empire.UINotifications.createFacade = function createFacade(deps = {}) {
  const {
    createCenter = null,
    infoWindowHistoryModule = null,
    eventFeedModule = null
  } = deps;

  let notificationCenter = null;

  function getNotificationCenter() {
    if (notificationCenter) return notificationCenter;
    if (typeof createCenter !== "function") return null;
    notificationCenter = createCenter({
      infoWindowHistoryModule,
      eventFeedModule
    });
    return notificationCenter;
  }

  function loadInfoWindowHistory() {
    getNotificationCenter()?.loadInfoWindowHistory?.();
  }

  function renderInfoWindowHistory() {
    getNotificationCenter()?.renderInfoWindowHistory?.();
  }

  function pushInfoWindowHistoryEntry(payload = {}) {
    getNotificationCenter()?.pushInfoWindowHistoryEntry?.(payload);
  }

  function removeInfoWindowHistoryEntry(entryId) {
    getNotificationCenter()?.removeInfoWindowHistoryEntry?.(entryId);
  }

  function clearInfoWindowHistory() {
    getNotificationCenter()?.clearInfoWindowHistory?.();
  }

  function initInfoWindowHistoryControls() {
    getNotificationCenter()?.initInfoWindowHistoryControls?.();
  }

  function pushEvent(text) {
    getNotificationCenter()?.pushEvent?.(text);
  }

  function clearEventFeed() {
    getNotificationCenter()?.clearEventFeed?.();
  }

  function initEventFeedControls() {
    getNotificationCenter()?.initEventFeedControls?.();
  }

  return {
    getNotificationCenter,
    loadInfoWindowHistory,
    renderInfoWindowHistory,
    pushInfoWindowHistoryEntry,
    removeInfoWindowHistoryEntry,
    clearInfoWindowHistory,
    initInfoWindowHistoryControls,
    pushEvent,
    clearEventFeed,
    initEventFeedControls
  };
};
