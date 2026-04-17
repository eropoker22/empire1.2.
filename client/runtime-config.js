window.Empire = window.Empire || {};

window.Empire.RuntimeConfig = (() => {
  const DEFAULT_API_BASE_URL = "http://localhost:3000";
  const DEFAULT_WS_BASE_URL = "ws://localhost:3000";
  const DEFAULT_STORAGE_PREFIX = "empire";
  const DEFAULT_MODE_QUERY_KEY = "mode";

  function normalizeMode(mode) {
    return window.Empire?.GameModes?.normalizeMode?.(mode) || "war";
  }

  function sanitizeBaseUrl(value, fallback) {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    return raw.replace(/\/+$/, "");
  }

  function detectEnvironment() {
    const explicit = String(window.__EMPIRE_CONFIG__?.environment || window.EMPIRE_ENV || "").trim().toLowerCase();
    if (explicit === "production" || explicit === "prod") return "production";
    if (explicit === "staging") return "staging";
    if (explicit === "test") return "test";
    if (explicit === "development" || explicit === "dev") return "development";

    const host = String(window.location.hostname || "").toLowerCase();
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
    return isLocal ? "development" : "production";
  }

  const environment = detectEnvironment();

  const apiBaseUrl = sanitizeBaseUrl(
    window.__EMPIRE_CONFIG__?.apiBaseUrl || window.EMPIRE_API_BASE_URL,
    DEFAULT_API_BASE_URL
  );

  const wsBaseUrl = sanitizeBaseUrl(
    window.__EMPIRE_CONFIG__?.wsBaseUrl || window.EMPIRE_WS_BASE_URL,
    DEFAULT_WS_BASE_URL
  );

  const storageKeys = Object.freeze({
    prefix: DEFAULT_STORAGE_PREFIX,
    token: "empire_token",
    guestUsername: "empire_guest_username",
    gangName: "empire_gang_name",
    structure: "empire_structure",
    gangColor: "empire_gang_color",
    avatar: "empire_avatar",
    selectedServer: "empire_selected_server",
    serverSpawnSelection: "empire_server_spawn_selection_v1",
    lastMode: "empire:last_mode"
  });

  const queryKeys = Object.freeze({
    mode: DEFAULT_MODE_QUERY_KEY
  });

  function modeHeader(mode) {
    return { "X-Game-Mode": normalizeMode(mode) };
  }

  function buildApiUrl(path) {
    return `${apiBaseUrl}${path}`;
  }

  function buildWsUrl(params = {}) {
    const query = new URLSearchParams(params);
    return `${wsBaseUrl}?${query.toString()}`;
  }

  return Object.freeze({
    environment,
    apiBaseUrl,
    wsBaseUrl,
    storageKeys,
    queryKeys,
    normalizeMode,
    modeHeader,
    buildApiUrl,
    buildWsUrl
  });
})();
