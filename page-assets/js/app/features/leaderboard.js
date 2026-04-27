import { getAuthoritySession } from "../model/authority-state.js";

const DEFAULT_LEADERBOARD_SERVER_ID = "preview-server";
const LEADERBOARD_POPUP_OPEN_SELECTOR = "[data-leaderboard-popup-open]";
const LEADERBOARD_POPUP_SELECTOR = "[data-leaderboard-popup]";
const LEADERBOARD_POPUP_CLOSE_SELECTOR = "[data-leaderboard-popup-close]";
const LEADERBOARD_TAB_SELECTOR = "[data-leaderboard-tab]";
const LEADERBOARD_COPY_SELECTOR = "[data-leaderboard-copy]";
const LEADERBOARD_LIST_SELECTOR = "[data-leaderboard-list]";
const LEADERBOARD_STATS_SELECTOR = "[data-leaderboard-stats]";
const LEADERBOARD_SERVER_BADGE_SELECTOR = "[data-leaderboard-server-badge]";

const LEADERBOARD_SEEDED_ENTRIES = Object.freeze([
  { id: "raven", name: "Raven", gang: "Northline Syndicate", serverId: "war-eu-01", serverLabel: "Vortex City WAR-01", districts: 22, influence: 440, cleanMoney: 82000, dirtyMoney: 128000, heat: 48, legacyBonus: 28000 },
  { id: "hex", name: "Hex", gang: "Chrome Rats", serverId: "war-eu-01", serverLabel: "Vortex City WAR-01", districts: 18, influence: 392, cleanMoney: 64000, dirtyMoney: 96000, heat: 57, legacyBonus: 22000 },
  { id: "lira", name: "Lira", gang: "Velvet Knives", serverId: "war-eu-01", serverLabel: "Vortex City WAR-01", districts: 15, influence: 356, cleanMoney: 71000, dirtyMoney: 68000, heat: 41, legacyBonus: 20500 },
  { id: "mako", name: "Mako", gang: "Black Harbor Crew", serverId: "war-eu-02", serverLabel: "Black Harbor WAR-02", districts: 17, influence: 318, cleanMoney: 53000, dirtyMoney: 87000, heat: 44, legacyBonus: 18000 },
  { id: "zero", name: "Zero", gang: "Afterglow Circuit", serverId: "free-eu-02", serverLabel: "Afterglow FREE-02", districts: 14, influence: 284, cleanMoney: 76000, dirtyMoney: 42000, heat: 26, legacyBonus: 15400 },
  { id: "nova", name: "Nova", gang: "Neon Drift", serverId: "free-eu-01", serverLabel: "Neon Drift FREE-01", districts: 12, influence: 246, cleanMoney: 59000, dirtyMoney: 31000, heat: 18, legacyBonus: 13200 },
  { id: "kade", name: "Kade", gang: "Ghost Ledger", serverId: "war-eu-02", serverLabel: "Black Harbor WAR-02", districts: 11, influence: 232, cleanMoney: 46000, dirtyMoney: 58000, heat: 32, legacyBonus: 12000 },
  { id: "sable", name: "Sable", gang: "Silver Static", serverId: "free-eu-02", serverLabel: "Afterglow FREE-02", districts: 9, influence: 210, cleanMoney: 62000, dirtyMoney: 24000, heat: 16, legacyBonus: 10500 },
  { id: "vex", name: "Vex", gang: "Metro Saints", serverId: "war-eu-01", serverLabel: "Vortex City WAR-01", districts: 8, influence: 188, cleanMoney: 41000, dirtyMoney: 53000, heat: 34, legacyBonus: 9200 }
]);

function normalizeServerId(serverId) {
  const normalized = String(serverId || "").trim();
  return normalized || DEFAULT_LEADERBOARD_SERVER_ID;
}

function getServerScope(session = getAuthoritySession()) {
  const registration = session.registration || {};
  const serverId = normalizeServerId(registration.serverId);
  const serverLabel = String(registration.serverLabel || registration.serverId || "Preview server").trim() || "Preview server";
  return { serverId, serverLabel };
}

function formatLeaderboardMoney(value) {
  return `$${Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("cs-CZ")}`;
}

function getLeaderboardScore(entry, mode = "server") {
  const districts = Math.max(0, Number(entry.districts || 0) || 0);
  const influence = Math.max(0, Number(entry.influence || 0) || 0);
  const cleanMoney = Math.max(0, Number(entry.cleanMoney || 0) || 0);
  const dirtyMoney = Math.max(0, Number(entry.dirtyMoney || 0) || 0);
  const heatPenalty = Math.max(0, Number(entry.heat || 0) || 0) * (mode === "global" ? 3 : 4);
  const legacyBonus = mode === "global" ? Math.max(0, Number(entry.legacyBonus || 0) || 0) : 0;

  return Math.max(0, Math.round(
    (districts * 780)
    + (influence * 18)
    + ((cleanMoney + dirtyMoney) / 18)
    - heatPenalty
    + legacyBonus
  ));
}

function getCurrentLeaderboardEntry() {
  const session = getAuthoritySession();
  const registration = session.registration || {};
  const serverScope = getServerScope(session);
  const identity = String(registration.identity || "Ty").trim() || "Ty";
  const gangName = String(registration.gangName || (identity ? `${identity} Crew` : "Guest Crew")).trim() || "Guest Crew";
  const districtCount = Math.max(0, Number(session.world?.ownedDistrictIds?.length || 0) || 0);

  return {
    id: "current-player",
    isCurrent: true,
    name: identity,
    gang: gangName,
    serverId: serverScope.serverId,
    serverLabel: serverScope.serverLabel,
    districts: districtCount,
    influence: Math.max(0, Number(session.gang?.influence || 0) || 0),
    cleanMoney: Math.max(0, Number(session.economy?.cleanMoney || 0) || 0),
    dirtyMoney: Math.max(0, Number(session.economy?.dirtyMoney || 0) || 0),
    heat: Math.max(0, Number(session.gang?.heat || 0) || 0),
    legacyBonus: districtCount * 900
  };
}

function getLeaderboardEntries(mode = "server") {
  const currentEntry = getCurrentLeaderboardEntry();
  const baseEntries = mode === "server"
    ? LEADERBOARD_SEEDED_ENTRIES.filter((entry) => entry.serverId === currentEntry.serverId)
    : LEADERBOARD_SEEDED_ENTRIES;
  const entries = [
    ...baseEntries.filter((entry) => entry.id !== currentEntry.id),
    currentEntry
  ];

  return entries
    .map((entry) => ({
      ...entry,
      score: getLeaderboardScore(entry, mode),
      totalMoney: Math.max(0, Number(entry.cleanMoney || 0) + Number(entry.dirtyMoney || 0))
    }))
    .sort((left, right) => right.score - left.score || right.influence - left.influence || right.districts - left.districts)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}

function createLeaderboardStat(label, value) {
  const stat = document.createElement("span");
  stat.className = "leaderboard-popup-stat";

  const labelElement = document.createElement("small");
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = value;

  stat.append(labelElement, valueElement);
  return stat;
}

function createLeaderboardRow(entry) {
  const row = document.createElement("article");
  row.className = `leaderboard-popup-row${entry.isCurrent ? " is-current" : ""}${entry.rank <= 3 ? " is-podium" : ""}`;

  const rank = document.createElement("span");
  rank.className = "leaderboard-popup-rank";
  rank.textContent = `#${entry.rank}`;

  const info = document.createElement("div");
  info.className = "leaderboard-popup-row__info";

  const name = document.createElement("strong");
  name.className = "leaderboard-popup-row__name";
  name.textContent = entry.isCurrent ? `${entry.name} (ty)` : entry.name;

  const meta = document.createElement("span");
  meta.className = "leaderboard-popup-row__meta";
  meta.textContent = `${entry.gang} · ${entry.serverLabel}`;

  info.append(name, meta);

  const metrics = document.createElement("div");
  metrics.className = "leaderboard-popup-row__metrics";

  const metricMap = [
    ["Score", entry.score.toLocaleString("cs-CZ")],
    ["Districty", String(entry.districts)],
    ["Vliv", String(entry.influence)],
    ["Cash", formatLeaderboardMoney(entry.totalMoney)]
  ];

  for (const [label, value] of metricMap) {
    const chip = document.createElement("span");
    chip.className = "leaderboard-popup-chip";
    chip.textContent = `${label}: ${value}`;
    metrics.append(chip);
  }

  row.append(rank, info, metrics);
  return row;
}

export function bindLeaderboardPopup(root) {
  const openButton = root.querySelector(LEADERBOARD_POPUP_OPEN_SELECTOR);
  const popup = root.querySelector(LEADERBOARD_POPUP_SELECTOR);
  const closeElements = Array.from(root.querySelectorAll(LEADERBOARD_POPUP_CLOSE_SELECTOR));
  const tabs = Array.from(root.querySelectorAll(LEADERBOARD_TAB_SELECTOR));
  const copyElement = root.querySelector(LEADERBOARD_COPY_SELECTOR);
  const listElement = root.querySelector(LEADERBOARD_LIST_SELECTOR);
  const statsElement = root.querySelector(LEADERBOARD_STATS_SELECTOR);
  const serverBadgeElement = root.querySelector(LEADERBOARD_SERVER_BADGE_SELECTOR);

  if (!openButton || !popup || closeElements.length === 0 || tabs.length === 0 || !copyElement || !listElement || !statsElement) {
    return;
  }

  let activeTab = "server";

  const renderLeaderboard = () => {
    const currentEntry = getCurrentLeaderboardEntry();
    const entries = getLeaderboardEntries(activeTab);
    const currentRank = entries.find((entry) => entry.isCurrent)?.rank || entries.length;
    const isServerTab = activeTab === "server";

    popup.dataset.leaderboardMode = activeTab;
    copyElement.textContent = isServerTab
      ? "Příčky všech hráčů na aktuálním serveru. Hodnotí se district kontrola, vliv, cash a heat tlak."
      : "Celkové žebříčky všech hráčů, kteří hráli EmpireStreets. Do skóre vstupuje i historický legacy výkon.";

    if (serverBadgeElement) {
      serverBadgeElement.textContent = isServerTab
        ? `Server: ${currentEntry.serverLabel}`
        : "EmpireStreets global";
    }

    statsElement.replaceChildren(
      createLeaderboardStat(isServerTab ? "Server hráči" : "Celkem hráči", String(entries.length)),
      createLeaderboardStat("Tvoje příčka", `#${currentRank}`),
      createLeaderboardStat("Shard", isServerTab ? currentEntry.serverLabel : "All-time")
    );

    listElement.replaceChildren(...entries.map(createLeaderboardRow));

    for (const tab of tabs) {
      tab.classList.toggle("is-active", tab.dataset.leaderboardTab === activeTab);
    }
  };

  const openPopup = () => {
    renderLeaderboard();
    popup.hidden = false;
  };

  const closePopup = () => {
    popup.hidden = true;
  };

  openButton.addEventListener("click", openPopup);

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      if (!tab.dataset.leaderboardTab) {
        return;
      }

      activeTab = tab.dataset.leaderboardTab === "global" ? "global" : "server";
      renderLeaderboard();
    });
  }

  for (const closeElement of closeElements) {
    closeElement.addEventListener("click", closePopup);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.hidden) {
      closePopup();
    }
  });
}
