window.Empire = window.Empire || {};
window.Empire.UIHelpers = window.Empire.UIHelpers || {};

window.Empire.UIHelpers.createFormatHelpers = function createFormatHelpers() {
  function formatDecimalValue(value, maxFractions = 2) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "0";
    const safeFractions = Math.max(0, Math.floor(Number(maxFractions) || 0));
    return parsed.toLocaleString("cs-CZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: safeFractions
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  return {
    formatDecimalValue,
    escapeHtml
  };
};
