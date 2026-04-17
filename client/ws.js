window.Empire = window.Empire || {};

window.Empire.WS = (() => {
  const SOCKET_STATES = Object.freeze({
    CONNECTING: 0,
    OPEN: 1
  });
  const RECONNECT_BASE_DELAY_MS = 1000;
  const RECONNECT_MAX_DELAY_MS = 15000;
  const RECONNECT_JITTER_MS = 500;
  const AUTH_HANDSHAKE_TIMEOUT_MS = 5000;

  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let manuallyDisconnected = false;
  let lifecycleBound = false;
  let authTimer = null;
  let isAuthenticated = false;
  const runtimeConfig = window.Empire?.RuntimeConfig || null;
  const buildWsUrl = runtimeConfig?.buildWsUrl || ((params = {}) => {
    const query = new URLSearchParams(params);
    return `ws://localhost:3000?${query.toString()}`;
  });
  const subscriptions = new Set(["map:subscribe", "market:subscribe"]);

  const featureHandlers = Object.create(null);
  featureHandlers["map:update"] = (payload) => {
    window.Empire.Map?.applyUpdate?.(payload.data);
  };
  featureHandlers["market:update"] = (payload) => {
    window.Empire.UI?.handleMarketUpdate?.(payload.data);
  };

  function resolveMode() {
    return runtimeConfig?.normalizeMode?.(window.Empire.mode) || window.Empire.mode || "war";
  }

  function clearReconnectTimer() {
    if (!reconnectTimer) return;
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function clearAuthTimer() {
    if (!authTimer) return;
    window.clearTimeout(authTimer);
    authTimer = null;
  }

  function canReconnect() {
    return Boolean(window.Empire.token) && !manuallyDisconnected;
  }

  function computeReconnectDelayMs() {
    const exponential = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * (2 ** reconnectAttempts));
    const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS);
    return exponential + jitter;
  }

  function scheduleReconnect() {
    if (!canReconnect() || reconnectTimer) return;
    const delayMs = computeReconnectDelayMs();
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect({ reason: "reconnect" });
    }, delayMs);
  }

  function send(payload) {
    if (!socket || socket.readyState !== SOCKET_STATES.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }

  function sendAuth() {
    if (!window.Empire.token) return false;
    return send({ type: "auth", token: window.Empire.token });
  }

  function replaySubscriptions() {
    if (!isAuthenticated) return;
    for (const eventType of subscriptions) {
      send({ type: eventType, mode: resolveMode() });
    }
  }

  function handleOpen() {
    clearReconnectTimer();
    clearAuthTimer();
    isAuthenticated = false;
    sendAuth();
    authTimer = window.setTimeout(() => {
      if (socket && socket.readyState === SOCKET_STATES.OPEN && !isAuthenticated) {
        try {
          socket.close(1000, "auth_timeout");
        } catch (err) {
          // Ignore close errors.
        }
      }
    }, AUTH_HANDSHAKE_TIMEOUT_MS);
  }

  function handleMessage(event) {
    let payload = null;
    try {
      payload = JSON.parse(event.data);
    } catch (err) {
      return;
    }
    if (!payload || typeof payload.type !== "string") return;
    if (payload.type === "auth:required") {
      sendAuth();
      return;
    }
    if (payload.type === "auth:ok") {
      reconnectAttempts = 0;
      isAuthenticated = true;
      clearAuthTimer();
      replaySubscriptions();
      return;
    }
    if (payload.type === "error" && (payload.error === "auth_required" || payload.error === "auth_failed" || payload.error === "auth_timeout")) {
      return;
    }
    const featureHandler = featureHandlers[payload.type];
    if (typeof featureHandler === "function") {
      featureHandler(payload);
    }
  }

  function handleClose() {
    clearAuthTimer();
    isAuthenticated = false;
    socket = null;
    if (!canReconnect()) return;
    reconnectAttempts += 1;
    scheduleReconnect();
  }

  function handleError() {
    // Keep behavior conservative: rely on close event for reconnect.
  }

  function bindLifecycleEvents() {
    if (lifecycleBound) return;
    lifecycleBound = true;

    window.addEventListener("online", () => {
      if (!socket || socket.readyState !== SOCKET_STATES.OPEN) {
        connect({ reason: "online" });
      }
    });

    window.addEventListener("beforeunload", () => {
      disconnect({ permanent: true });
    });
  }

  function init() {
    bindLifecycleEvents();
  }

  function connect(options = {}) {
    const { force = false } = options;
    if (!window.Empire.token) return;
    if (!force && socket && (socket.readyState === SOCKET_STATES.OPEN || socket.readyState === SOCKET_STATES.CONNECTING)) {
      return;
    }
    if (force && socket && (socket.readyState === SOCKET_STATES.OPEN || socket.readyState === SOCKET_STATES.CONNECTING)) {
      disconnect();
    }

    manuallyDisconnected = false;
    clearReconnectTimer();

    if (socket && socket.readyState === SOCKET_STATES.CONNECTING) {
      return;
    }

    const mode = resolveMode();
    const url = buildWsUrl({ mode });
    socket = new WebSocket(url);

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);
  }

  function subscribeMap() {
    subscriptions.add("map:subscribe");
    send({ type: "map:subscribe", mode: resolveMode() });
  }

  function subscribeMarket() {
    subscriptions.add("market:subscribe");
    send({ type: "market:subscribe", mode: resolveMode() });
  }

  function unsubscribeMap() {
    subscriptions.delete("map:subscribe");
    send({ type: "map:unsubscribe", mode: resolveMode() });
  }

  function unsubscribeMarket() {
    subscriptions.delete("market:subscribe");
    send({ type: "market:unsubscribe", mode: resolveMode() });
  }

  function disconnect(options = {}) {
    const { permanent = false } = options;
    manuallyDisconnected = true;
    clearReconnectTimer();
    clearAuthTimer();
    isAuthenticated = false;
    if (!socket) return;
    try {
      if (socket.readyState === SOCKET_STATES.OPEN || socket.readyState === SOCKET_STATES.CONNECTING) {
        socket.close(1000, permanent ? "shutdown" : "manual_disconnect");
      }
    } catch (err) {
      // Ignore close errors to keep disconnect safe in all browsers.
    }
    socket = null;
  }

  function setFeatureHandler(eventType, handler) {
    if (typeof eventType !== "string" || !eventType.trim()) return;
    if (typeof handler !== "function") return;
    featureHandlers[eventType] = handler;
  }

  return {
    init,
    connect,
    disconnect,
    subscribeMap,
    unsubscribeMap,
    subscribeMarket,
    unsubscribeMarket,
    setFeatureHandler
  };
})();
