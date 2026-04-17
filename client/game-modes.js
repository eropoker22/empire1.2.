window.Empire = window.Empire || {};

window.Empire.GameModes = (() => {
  const fallbackModes = Object.freeze({
    war: Object.freeze({ key: "war", label: "WAR", displayName: "Placená verze", routeSlug: "war", servers: [] }),
    free: Object.freeze({ key: "free", label: "FREE", displayName: "Zrychlená free verze", routeSlug: "free", servers: [] })
  });
  const modes = window.Empire?.GameModeConfig?.modes || fallbackModes;

  function normalizeMode(mode) {
    const raw = String(mode || "").trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(modes, raw) ? raw : "war";
  }

  function getConfig(mode) {
    return modes[normalizeMode(mode)] || modes.war;
  }

  return { modes, normalizeMode, getConfig };
})();
