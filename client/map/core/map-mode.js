window.Empire = window.Empire || {};
window.Empire.MapModules = window.Empire.MapModules || {};

window.Empire.MapModules.createMapModeModule = function createMapModeModule(deps) {
  const state = deps.state;
  const mapModeStorageKey = deps.mapModeStorageKey;
  const mapModeImageByKey = deps.mapModeImageByKey;
  const render = deps.render;

  function normalizeMapMode(value) {
    const key = String(value || "").trim().toLowerCase();
    if (key === "day") return "day";
    if (key === "blackout") return "blackout";
    return "night";
  }

  function resolveStoredMapMode() {
    try {
      return normalizeMapMode(localStorage.getItem(mapModeStorageKey) || "night");
    } catch {
      return "night";
    }
  }

  function loadMapImage() {
    const img = new Image();
    img.src = mapModeImageByKey[state.mapMode] || mapModeImageByKey.night;
    img.onload = () => {
      document.dispatchEvent(new CustomEvent("empire:map-mode-changed", {
        detail: { mapMode: state.mapMode }
      }));
      render();
    };
    state.mapImage = img;
  }

  function setMapMode(mode) {
    const nextMode = normalizeMapMode(mode);
    if (state.mapMode === nextMode) return;
    state.mapMode = nextMode;
    try {
      localStorage.setItem(mapModeStorageKey, nextMode);
    } catch {}
    const img = new Image();
    img.src = mapModeImageByKey[nextMode] || mapModeImageByKey.night;
    img.onload = () => {
      state.mapImage = img;
      document.dispatchEvent(new CustomEvent("empire:map-mode-changed", {
        detail: { mapMode: nextMode }
      }));
      render();
    };
    img.onerror = () => {
      render();
    };
  }

  function getMapMode() {
    return normalizeMapMode(state.mapMode);
  }

  return {
    loadMapImage,
    normalizeMapMode,
    resolveStoredMapMode,
    setMapMode,
    getMapMode
  };
};
