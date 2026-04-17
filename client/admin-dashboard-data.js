window.EmpireAdminData = (() => {
  const runtimeConfig = window.Empire?.RuntimeConfig || null;
  const apiBaseUrl = runtimeConfig?.apiBaseUrl || "http://localhost:3000";

  function normalizeSource(source) {
    const raw = String(source || "").trim().toLowerCase();
    if (raw === "live" || raw === "demo" || raw === "mock" || raw === "auto") {
      return raw === "mock" ? "demo" : raw;
    }
    return "auto";
  }

  function resolveGameMode(mode) {
    return window.Empire?.GameModes?.normalizeMode?.(mode) || "war";
  }

  async function loadDashboardPayload({ dashboardMode = "auto", source = "auto", mode = "war" } = {}) {
    const normalizedSource = normalizeSource(dashboardMode || source);

    const gameMode = resolveGameMode(mode);
    const params = new URLSearchParams({
      dashboardMode: normalizedSource,
      source: normalizedSource,
      mode: gameMode
    });

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 4000) : null;

    try {
      const response = await fetch(`${apiBaseUrl}/admin/dashboard?${params.toString()}`, {
        headers: {
          "X-Game-Mode": gameMode
        },
        cache: "no-store",
        signal: controller?.signal
      });

      if (!response.ok) {
        throw new Error(`admin_dashboard_http_${response.status}`);
      }

      const payload = await response.json();
      return payload && typeof payload === "object"
        ? payload
        : { source: "demo", effectiveMode: "demo", requestedMode: normalizedSource };
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  return Object.freeze({
    loadDashboardPayload,
    normalizeSource,
    resolveGameMode
  });
})();
