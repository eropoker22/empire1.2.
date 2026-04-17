window.Empire = window.Empire || {};
window.Empire.UINotifications = window.Empire.UINotifications || {};

window.Empire.UINotifications.createEventFeed = function createEventFeed(options = {}) {
  const containerId = String(options.containerId || "event-items");
  const clearButtonId = String(options.clearButtonId || "event-clear-btn");
  const emptyMessage = String(options.emptyMessage || "Čekám na rozkazy...");

  function pushEvent(text) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const div = document.createElement("div");
    div.className = "ticker__item";
    div.textContent = String(text || "");
    container.prepend(div);
  }

  function clearEventFeed() {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="ticker__item">${emptyMessage}</div>`;
  }

  function initEventFeedControls() {
    const clearBtn = document.getElementById(clearButtonId);
    if (!clearBtn || clearBtn.dataset.bound === "1") return;
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", clearEventFeed);
  }

  return {
    pushEvent,
    clearEventFeed,
    initEventFeedControls
  };
};
