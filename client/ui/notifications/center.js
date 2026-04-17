window.Empire = window.Empire || {};
window.Empire.UINotifications = window.Empire.UINotifications || {};

window.Empire.UINotifications.createCenter = function createCenter(deps = {}) {
  const {
    infoWindowHistoryModule = null,
    eventFeedModule = null
  } = deps;

  return {
    loadInfoWindowHistory() {
      infoWindowHistoryModule?.load?.();
    },
    renderInfoWindowHistory() {
      infoWindowHistoryModule?.render?.();
    },
    pushInfoWindowHistoryEntry(payload = {}) {
      infoWindowHistoryModule?.push?.(payload);
    },
    removeInfoWindowHistoryEntry(entryId) {
      infoWindowHistoryModule?.remove?.(entryId);
    },
    clearInfoWindowHistory() {
      infoWindowHistoryModule?.clear?.();
    },
    initInfoWindowHistoryControls() {
      infoWindowHistoryModule?.initControls?.();
    },
    pushEvent(text) {
      eventFeedModule?.pushEvent?.(text);
    },
    clearEventFeed() {
      eventFeedModule?.clearEventFeed?.();
    },
    initEventFeedControls() {
      eventFeedModule?.initEventFeedControls?.();
    }
  };
};
