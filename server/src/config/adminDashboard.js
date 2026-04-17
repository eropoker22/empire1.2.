const VALID_DASHBOARD_MODES = new Set(["live", "demo", "auto"]);

function normalizeDashboardMode(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "mock") return "demo";
  return VALID_DASHBOARD_MODES.has(raw) ? raw : "auto";
}

function getDefaultDashboardMode() {
  return normalizeDashboardMode(process.env.ADMIN_DASHBOARD_MODE || "auto");
}

function resolveDashboardMode(value) {
  const normalized = normalizeDashboardMode(value);
  return normalized === "auto" && !String(value || "").trim()
    ? getDefaultDashboardMode()
    : normalized;
}

module.exports = {
  normalizeDashboardMode,
  getDefaultDashboardMode,
  resolveDashboardMode
};
