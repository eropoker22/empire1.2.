window.Empire = window.Empire || {};
window.Empire.UIHelpers = window.Empire.UIHelpers || {};

window.Empire.UIHelpers.createRenderHelpers = function createRenderHelpers(deps = {}) {
  const {
    escapeHtml = (value) => String(value ?? ""),
    onError = (label, error) => {
      try {
        console.error(label, error);
      } catch {}
    }
  } = deps;

  function safeRun(label, callback, fallback = null) {
    try {
      return typeof callback === "function" ? callback() : fallback;
    } catch (error) {
      onError(label, error);
      return fallback;
    }
  }

  function safeSetHtml(element, html) {
    if (!(element instanceof Element)) return false;
    element.innerHTML = String(html ?? "");
    return true;
  }

  function safeRenderList(element, items = [], renderItem = null, emptyHtml = "") {
    if (!(element instanceof Element)) return false;
    if (!Array.isArray(items) || !items.length) {
      element.innerHTML = String(emptyHtml || "");
      return true;
    }
    const html = typeof renderItem === "function"
      ? items.map((item, index) => String(renderItem(item, index) || "")).join("")
      : "";
    element.innerHTML = html;
    return true;
  }

  return {
    escapeHtml,
    safeRun,
    safeSetHtml,
    safeRenderList
  };
};
