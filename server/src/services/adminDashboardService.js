const { buildDemoPayload } = require("./adminDashboard/demoPayload");
const { buildLivePayload } = require("./adminDashboard/livePayload");
const { normalizeDashboardMode, resolveDashboardMode } = require("../config/adminDashboard");

function attachDashboardModeMeta(payload, { requestedMode, effectiveMode, liveAvailable, detail = "" }) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const label = effectiveMode === "live" ? "Live data" : "Demo data";
  return {
    ...safePayload,
    source: effectiveMode,
    requestedMode,
    effectiveMode,
    liveAvailable: Boolean(liveAvailable),
    modeIndicator: {
      label,
      detail
    }
  };
}

async function getAdminDashboardPayload({ gameMode, source = "auto", dashboardMode = "" }) {
  const requestedMode = resolveDashboardMode(dashboardMode || source);

  if (requestedMode === "demo") {
    return attachDashboardModeMeta(buildDemoPayload(gameMode), {
      requestedMode,
      effectiveMode: "demo",
      liveAvailable: true,
      detail: "Explicitní demo režim"
    });
  }

  if (requestedMode === "live") {
    const livePayload = await buildLivePayload(gameMode);
    return attachDashboardModeMeta(livePayload, {
      requestedMode,
      effectiveMode: "live",
      liveAvailable: true,
      detail: "Explicitní live telemetrie"
    });
  }

  try {
    const livePayload = await buildLivePayload(gameMode);
    return attachDashboardModeMeta(livePayload, {
      requestedMode: normalizeDashboardMode("auto"),
      effectiveMode: "live",
      liveAvailable: true,
      detail: "Auto režim • live telemetrie"
    });
  } catch (error) {
    return attachDashboardModeMeta(buildDemoPayload(gameMode), {
      requestedMode: normalizeDashboardMode("auto"),
      effectiveMode: "demo",
      liveAvailable: false,
      detail: "Auto fallback • demo payload"
    });
  }
}

module.exports = {
  getAdminDashboardPayload
};
