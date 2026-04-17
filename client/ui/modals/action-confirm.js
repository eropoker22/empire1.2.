window.Empire = window.Empire || {};
window.Empire.UIModals = window.Empire.UIModals || {};

window.Empire.UIModals.createActionConfirmPopupController = function createActionConfirmPopupController(options = {}) {
  const rootId = String(options.rootId || "empire-action-confirm-popup");
  const titleId = String(options.titleId || "empire-action-confirm-popup-title");
  const subtitleId = String(options.subtitleId || "empire-action-confirm-popup-subtitle");
  const defaultDurationMs = Math.max(200, Number(options.durationMs || 2600));
  let hideTimer = null;

  function ensureRoot() {
    let root = document.getElementById(rootId);
    if (root) return root;
    root = document.createElement("div");
    root.id = rootId;
    root.className = "empire-action-confirm-popup hidden";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="empire-action-confirm-popup__card" data-tone="attack">
        <div id="${titleId}" class="empire-action-confirm-popup__title">AKCE POTVRZENA</div>
        <div id="${subtitleId}" class="empire-action-confirm-popup__subtitle">District: -</div>
      </div>
    `;
    root.addEventListener("click", hide);
    document.body.appendChild(root);
    return root;
  }

  function hide() {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.classList.add("hidden");
    root.setAttribute("aria-hidden", "true");
  }

  function show(payload = {}) {
    const tone = String(payload.tone || "attack").trim().toLowerCase() || "attack";
    const title = String(payload.title || "AKCE POTVRZENA").trim() || "AKCE POTVRZENA";
    const subtitle = String(payload.subtitle || "").trim();
    const durationMs = Math.max(200, Number(payload.durationMs || defaultDurationMs));
    const root = ensureRoot();
    const card = root.querySelector(".empire-action-confirm-popup__card");
    const titleEl = document.getElementById(titleId);
    const subtitleEl = document.getElementById(subtitleId);
    if (card) card.dataset.tone = tone;
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    root.classList.remove("hidden");
    root.setAttribute("aria-hidden", "false");
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(hide, durationMs);
  }

  return {
    ensureRoot,
    show,
    hide
  };
};

window.Empire.UIModals.bindConfirmModal = function bindConfirmModal(config = {}) {
  const rootId = String(config.rootId || "");
  if (!rootId) return false;
  const root = document.getElementById(rootId);
  if (!root) return false;
  const safeSuffix = rootId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const boundAttr = `data-confirm-bound-${safeSuffix || "modal"}`;
  if (root.hasAttribute(boundAttr)) return true;
  root.setAttribute(boundAttr, "1");

  const onClose = typeof config.onClose === "function" ? config.onClose : () => {};
  const onConfirm = typeof config.onConfirm === "function" ? config.onConfirm : () => {};
  const backdrop = config.backdropId ? document.getElementById(String(config.backdropId)) : null;
  const closeBtn = config.closeId ? document.getElementById(String(config.closeId)) : null;
  const cancelBtn = config.cancelId ? document.getElementById(String(config.cancelId)) : null;
  const confirmBtn = config.confirmId ? document.getElementById(String(config.confirmId)) : null;

  if (backdrop) backdrop.addEventListener("click", onClose);
  if (closeBtn) closeBtn.addEventListener("click", onClose);
  if (cancelBtn) cancelBtn.addEventListener("click", onClose);
  if (confirmBtn) confirmBtn.addEventListener("click", onConfirm);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.classList.contains("hidden")) {
      onClose();
    }
  });

  return true;
};
