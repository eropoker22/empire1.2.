window.Empire = window.Empire || {};
window.Empire.UIScenarios = window.Empire.UIScenarios || {};

window.Empire.UIScenarios.createScenarioRenderer = function createScenarioRenderer(deps = {}) {
  const {
    config = window.Empire.Config?.getScenarioConfig?.() || { order: [], items: {}, card: {} },
    escapeHtml = (value) => String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;"),
    topbarMountId = "scenario-topbar-mount",
    cardMountId = "scenario-card-mount"
  } = deps;

  function getScenarioList() {
    return (Array.isArray(config.order) ? config.order : [])
      .map((key) => config.items?.[key])
      .filter(Boolean);
  }

  function buildTopbarMarkup() {
    return getScenarioList()
      .map((scenario) => {
        const label = escapeHtml(scenario.topbarLabel || scenario.cardLabel || scenario.key);
        const key = escapeHtml(scenario.key);
        return `<button class="topbar__scenario-btn" type="button" data-player-scenario="${key}">${label}</button>`;
      })
      .join("");
  }

  function buildCardButtonsMarkup() {
    return getScenarioList()
      .map((scenario) => {
        const key = escapeHtml(scenario.key);
        const fullLabel = escapeHtml(scenario.cardLabel || scenario.topbarLabel || scenario.key);
        const shortLabel = escapeHtml(scenario.shortLabel || scenario.topbarLabel || scenario.cardLabel || scenario.key);
        const needsShortLabel = fullLabel !== shortLabel;
        if (!needsShortLabel) {
          return `<button class="btn btn--ghost scenario-preview__btn" type="button" data-player-scenario="${key}">${fullLabel}</button>`;
        }
        return `<button class="btn btn--ghost scenario-preview__btn" type="button" data-player-scenario="${key}"><span class="scenario-preview__label scenario-preview__label--full">${fullLabel}</span><span class="scenario-preview__label scenario-preview__label--short">${shortLabel}</span></button>`;
      })
      .join("");
  }

  function renderTopbar() {
    const mount = document.getElementById(topbarMountId);
    if (!mount) return null;
    mount.innerHTML = buildTopbarMarkup();
    return mount;
  }

  function renderCard() {
    const mount = document.getElementById(cardMountId);
    if (!mount) return null;
    mount.innerHTML = `
      <h2>${escapeHtml(config.card?.title || "")}</h2>
      <p class="muted">${escapeHtml(config.card?.description || "")}</p>
      <div class="scenario-preview">
        ${buildCardButtonsMarkup()}
      </div>
    `;
    return mount;
  }

  function syncActiveState(activeScenarioKey = "") {
    const safeKey = String(activeScenarioKey || "").trim().toLowerCase();
    document.querySelectorAll("[data-player-scenario]").forEach((button) => {
      const key = String(button.getAttribute("data-player-scenario") || "").trim().toLowerCase();
      const isActive = Boolean(safeKey) && key === safeKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderAll(activeScenarioKey = "") {
    renderTopbar();
    renderCard();
    syncActiveState(activeScenarioKey);
  }

  return {
    renderTopbar,
    renderCard,
    renderAll,
    syncActiveState
  };
};
