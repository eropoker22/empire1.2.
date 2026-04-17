window.Empire = window.Empire || {};

window.Empire.GameModeRules = (() => {
  const sharedRules = window.Empire?.SharedGameplayRules || window.EmpireSharedGameplayRules || null;
  const runtimeConfig = window.Empire?.RuntimeConfig || null;
  const storage = window.Empire?.Storage || null;

  function normalizeMode(mode) {
    return runtimeConfig?.normalizeMode?.(mode) || window.Empire?.GameModes?.normalizeMode?.(mode) || "war";
  }

  function resolveServerKey(serverKey = "") {
    const explicit = String(serverKey || "").trim();
    if (explicit) return explicit;
    return String(storage?.getItem?.("selectedServer") || "").trim();
  }

  function getModeRules(mode, serverKey = "") {
    return sharedRules?.resolveGameplayRules?.({
      gameMode: normalizeMode(mode),
      serverKey: resolveServerKey(serverKey)
    }) || {
      mode: normalizeMode(mode),
      serverKey: resolveServerKey(serverKey),
      mapPreview: "/img/mapaden2.png",
      serverLaunchOffsetMinutes: 75,
      starterState: Object.freeze({}),
      starterResourceLines: Object.freeze([]),
      combat: Object.freeze({ weaponTiers: Object.freeze({ attack: Object.freeze([]), defense: Object.freeze([]) }) })
    };
  }

  function getServerRules(serverKey, mode) {
    return getModeRules(mode, serverKey);
  }

  function getStarterState(serverKey = "", mode = "war") {
    return getModeRules(mode, serverKey).starterState;
  }

  function getCombatRules(serverKey = "", mode = "war") {
    return getModeRules(mode, serverKey).combat;
  }

  return Object.freeze({
    getModeRules,
    getServerRules,
    getStarterState,
    getCombatRules
  });
})();
