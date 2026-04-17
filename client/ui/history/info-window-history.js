window.Empire = window.Empire || {};
window.Empire.UIHistory = window.Empire.UIHistory || {};

window.Empire.UIHistory.createInfoWindowHistory = function createInfoWindowHistory(options = {}) {
  const storageKey = String(options.storageKey || "empire_info_windows_history_v1");
  const limit = Math.max(1, Math.floor(Number(options.limit) || 80));
  const itemsContainerId = String(options.itemsContainerId || "info-history-items");
  const clearButtonId = String(options.clearButtonId || "info-history-clear-btn");
  let entries = [];

  function normalizeEntries(rawEntries) {
    const source = Array.isArray(rawEntries) ? rawEntries : [];
    return source
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const title = String(entry.title || "").trim();
        const text = String(entry.text || "").trim();
        const createdAt = Number(entry.createdAt || 0);
        if (!title || !text || !Number.isFinite(createdAt) || createdAt <= 0) return null;
        return {
          id: String(entry.id || `${createdAt}-${Math.random().toString(36).slice(2, 8)}`),
          title: title.slice(0, 160),
          text: text.slice(0, 420),
          createdAt
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
      .slice(0, limit);
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      entries = normalizeEntries(parsed);
    } catch {
      entries = [];
    }
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }

  function formatTime(timestamp) {
    const date = new Date(Number(timestamp || Date.now()));
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function render() {
    const container = document.getElementById(itemsContainerId);
    if (!container) return;
    container.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "info-history__empty";
      empty.textContent = "Zatím žádná informační okna.";
      container.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "info-history__item";
      item.dataset.entryId = String(entry.id);

      const meta = document.createElement("div");
      meta.className = "info-history__item-meta";

      const time = document.createElement("span");
      time.className = "info-history__item-time";
      time.textContent = formatTime(entry.createdAt);

      const title = document.createElement("strong");
      title.className = "info-history__item-title";
      title.textContent = entry.title;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "info-history__item-delete-btn";
      deleteBtn.dataset.infoHistoryDelete = String(entry.id);
      deleteBtn.setAttribute("aria-label", "Smazat informační okno");
      deleteBtn.title = "Smazat";
      deleteBtn.textContent = "×";

      const text = document.createElement("p");
      text.className = "info-history__item-text";
      text.textContent = entry.text;

      meta.append(time, title, deleteBtn);
      item.append(meta, text);
      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function push(payload = {}) {
    const title = payload.title;
    const text = payload.text;
    const rows = payload.rows;
    const safeTitle = String(title || "").trim();
    const summaryText = String(text || "").trim();
    const fallbackText = Array.isArray(rows)
      ? rows
        .map((row) => {
          const label = String(row?.label || "").trim();
          const value = String(row?.value || "").trim();
          if (!label || !value) return "";
          return `${label}: ${value}`;
        })
        .filter(Boolean)
        .join(" • ")
      : "";
    const safeText = summaryText || fallbackText;
    if (!safeTitle || !safeText) return;

    const now = Date.now();
    const entry = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      title: safeTitle.slice(0, 160),
      text: safeText.slice(0, 420),
      createdAt: now
    };

    const lastEntry = entries[0];
    if (
      lastEntry
      && lastEntry.title === entry.title
      && lastEntry.text === entry.text
      && Math.abs(Number(lastEntry.createdAt || 0) - now) < 1500
    ) {
      return;
    }

    entries = [entry, ...entries].slice(0, limit);
    persist();
    render();
  }

  function remove(entryId) {
    const safeId = String(entryId || "").trim();
    if (!safeId) return;
    entries = entries.filter((entry) => String(entry?.id) !== safeId);
    persist();
    render();
  }

  function clear() {
    entries = [];
    persist();
    render();
  }

  function initControls() {
    const clearBtn = document.getElementById(clearButtonId);
    const items = document.getElementById(itemsContainerId);
    if (clearBtn && clearBtn.dataset.bound !== "1") {
      clearBtn.dataset.bound = "1";
      clearBtn.addEventListener("click", clear);
    }
    if (items && items.dataset.bound !== "1") {
      items.dataset.bound = "1";
      items.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const removeBtn = target.closest("[data-info-history-delete]");
        if (!(removeBtn instanceof HTMLElement)) return;
        remove(removeBtn.dataset.infoHistoryDelete || "");
      });
    }
  }

  return {
    load,
    render,
    push,
    initControls,
    clear,
    remove
  };
};
