window.Empire = window.Empire || {};
window.Empire.MapModules = window.Empire.MapModules || {};

window.Empire.MapModules.createTooltipModule = function createTooltipModule(deps = {}) {
  const { state = {} } = deps;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function placeTooltipWithinMap(clientX, clientY) {
    if (!state.tooltip) return;
    const margin = 12;
    const inset = 6;
    let left = Number(clientX || 0) + margin;
    let top = Number(clientY || 0) + margin;
    const mapRect = state.canvas?.getBoundingClientRect?.();
    if (!mapRect) {
      state.tooltip.style.left = `${left}px`;
      state.tooltip.style.top = `${top}px`;
      return;
    }
    const tooltipRect = state.tooltip.getBoundingClientRect();
    const minLeft = mapRect.left + inset;
    const maxLeft = mapRect.right - tooltipRect.width - inset;
    const minTop = mapRect.top + inset;
    const maxTop = mapRect.bottom - tooltipRect.height - inset;
    left = maxLeft < minLeft ? minLeft : Math.min(maxLeft, Math.max(minLeft, left));
    top = maxTop < minTop ? minTop : Math.min(maxTop, Math.max(minTop, top));
    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top}px`;
  }

  return {
    escapeHtml,
    placeTooltipWithinMap
  };
};
