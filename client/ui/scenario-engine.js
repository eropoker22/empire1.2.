window.Empire = window.Empire || {};
window.Empire.UIScenarios = window.Empire.UIScenarios || {};

window.Empire.UIScenarios.createScenarioEngine = function createScenarioEngine(deps = {}) {
  const {
    config = window.Empire.Config?.getScenarioConfig?.() || { order: [], items: {} },
    storage = window.localStorage,
    storageKey = "empire_active_player_scenario",
    renderer = null,
    getPlayer = () => window.Empire?.player || {},
    getCachedProfile = () => null,
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase(),
    normalizeAllianceNameKey = (value) => String(value || "").trim().toLowerCase(),
    normalizeAllianceIconKey = (value) => String(value || "").trim() || "lightning",
    onScenarioActivated = () => ({}),
    onScenarioStateChanged = () => {}
  } = deps;

  const state = {
    activeScenarioKey: "",
    scenarioVisionEnabled: false,
    scenarioUniqueOwnerColors: false,
    scenarioProfileAvatarOverride: null,
    activeScenarioOwnerName: "",
    liveAllianceOwnerNames: new Set(),
    liveAllianceTrapGraceByOwnerName: new Map(),
    liveAllianceIconByName: new Map(),
    scenarioAllianceOwnerNames: new Set(),
    scenarioAllianceIconByName: new Map(),
    scenarioEnemyOwnerNames: new Set(),
    bound: false
  };

  function getScenario(key) {
    const safeKey = String(key || "").trim().toLowerCase();
    return config.items?.[safeKey] || null;
  }

  function normalizeScenarioKey(key) {
    const safeKey = String(key || "").trim().toLowerCase();
    return getScenario(safeKey) ? safeKey : "";
  }

  function resolveStoredScenarioKey() {
    try {
      return normalizeScenarioKey(storage?.getItem?.(storageKey) || "");
    } catch {
      return "";
    }
  }

  function persistActiveScenarioKey(key) {
    try {
      if (!key) {
        storage?.removeItem?.(storageKey);
        return;
      }
      storage?.setItem?.(storageKey, key);
    } catch {}
  }

  function updateBodyScenarioClass(activeScenarioKey) {
    const body = document.body;
    if (!body) return;
    (Array.isArray(config.order) ? config.order : []).forEach((key) => {
      body.classList.remove(`scenario-${key}`);
    });
    if (activeScenarioKey) {
      body.classList.add(`scenario-${activeScenarioKey}`);
      body.dataset.playerScenario = activeScenarioKey;
    } else {
      delete body.dataset.playerScenario;
    }
  }

  function setAllianceIconEntries(targetMap, entries) {
    targetMap.clear();
    const safeEntries = entries instanceof Map
      ? Array.from(entries.entries())
      : Array.isArray(entries) ? entries : [];
    safeEntries.forEach(([allianceName, iconKey]) => {
      const nameKey = normalizeAllianceNameKey(allianceName);
      if (!nameKey) return;
      targetMap.set(nameKey, normalizeAllianceIconKey(iconKey));
    });
  }

  function setScenarioVisionMode(enabled, options = {}) {
    state.scenarioVisionEnabled = Boolean(enabled);
    state.scenarioUniqueOwnerColors = Boolean(options.uniqueOwnerColors);
    state.scenarioProfileAvatarOverride = options.profileAvatarOverride || null;
    if (options.ownerName != null) {
      state.activeScenarioOwnerName = String(options.ownerName || "").trim();
    }
    onScenarioStateChanged(getState());
    return getState();
  }

  function setScenarioAllianceOwners(owners = [], options = {}) {
    state.scenarioAllianceOwnerNames = new Set(
      (Array.isArray(owners) ? owners : [])
        .map((owner) => normalizeOwnerName(owner))
        .filter(Boolean)
    );
    setAllianceIconEntries(state.scenarioAllianceIconByName, options.iconByName);
    onScenarioStateChanged(getState());
    return Array.from(state.scenarioAllianceOwnerNames);
  }

  function setScenarioEnemyOwners(owners = []) {
    state.scenarioEnemyOwnerNames = new Set(
      (Array.isArray(owners) ? owners : [])
        .map((owner) => normalizeOwnerName(owner))
        .filter(Boolean)
    );
    onScenarioStateChanged(getState());
    return Array.from(state.scenarioEnemyOwnerNames);
  }

  function resolveActiveScenarioOwnerName() {
    return String(
      state.activeScenarioOwnerName
      || getPlayer()?.gangName
      || getPlayer()?.username
      || getCachedProfile()?.gangName
      || getCachedProfile()?.username
      || ""
    ).trim();
  }

  function getActiveAllianceOwnerNames() {
    return Array.from(new Set([
      ...Array.from(state.liveAllianceOwnerNames),
      ...Array.from(state.scenarioAllianceOwnerNames)
    ]));
  }

  function getActiveEnemyOwnerNames() {
    return Array.from(state.scenarioEnemyOwnerNames);
  }

  function setLiveAllianceOwnersFromAlliance(alliance) {
    state.liveAllianceOwnerNames = new Set(
      (Array.isArray(alliance?.members) ? alliance.members : [])
        .map((member) => normalizeOwnerName(member?.username || member?.name))
        .filter(Boolean)
    );
    const allianceName = String(alliance?.name || "").trim();
    const iconKey = normalizeAllianceIconKey(alliance?.icon_key || alliance?.iconKey);
    setAllianceIconEntries(
      state.liveAllianceIconByName,
      allianceName && state.liveAllianceOwnerNames.size ? [[allianceName, iconKey]] : []
    );
    state.liveAllianceTrapGraceByOwnerName = new Map(
      (Array.isArray(alliance?.members) ? alliance.members : [])
        .map((member) => {
          const ownerKey = normalizeOwnerName(member?.username || member?.name);
          const readyAt = Date.parse(String(member?.alliance_ready_at || member?.allianceReadyAt || ""));
          if (!ownerKey) return null;
          return [ownerKey, Number.isFinite(readyAt) ? readyAt + (20 * 1000) : 0];
        })
        .filter(Boolean)
    );
    onScenarioStateChanged(getState());
    return Array.from(state.liveAllianceOwnerNames);
  }

  function clearLiveAllianceOwners() {
    state.liveAllianceOwnerNames = new Set();
    state.liveAllianceTrapGraceByOwnerName = new Map();
    state.liveAllianceIconByName = new Map();
    onScenarioStateChanged(getState());
  }

  function resolveAllianceIconKeyByName(allianceName) {
    const nameKey = normalizeAllianceNameKey(allianceName);
    if (!nameKey) return null;
    return state.scenarioAllianceIconByName.get(nameKey)
      || state.liveAllianceIconByName.get(nameKey)
      || null;
  }

  function getAllianceTrapGraceRemainingMs(ownerName) {
    const ownerKey = normalizeOwnerName(ownerName);
    if (!ownerKey) return 0;
    return Math.max(0, Number(state.liveAllianceTrapGraceByOwnerName.get(ownerKey) || 0) - Date.now());
  }

  function getState() {
    return {
      activeScenarioKey: state.activeScenarioKey,
      scenarioVisionEnabled: state.scenarioVisionEnabled,
      scenarioUniqueOwnerColors: state.scenarioUniqueOwnerColors,
      scenarioProfileAvatarOverride: state.scenarioProfileAvatarOverride,
      activeScenarioOwnerName: resolveActiveScenarioOwnerName(),
      liveAllianceOwnerNames: new Set(state.liveAllianceOwnerNames),
      liveAllianceTrapGraceByOwnerName: new Map(state.liveAllianceTrapGraceByOwnerName),
      liveAllianceIconByName: new Map(state.liveAllianceIconByName),
      scenarioAllianceOwnerNames: new Set(state.scenarioAllianceOwnerNames),
      scenarioAllianceIconByName: new Map(state.scenarioAllianceIconByName),
      scenarioEnemyOwnerNames: new Set(state.scenarioEnemyOwnerNames)
    };
  }

  function isBlackoutLikeScenario(scenarioKey = state.activeScenarioKey) {
    return Boolean(getScenario(scenarioKey)?.blackoutLike);
  }

  function applyScenario(scenarioKey, options = {}) {
    const nextKey = normalizeScenarioKey(scenarioKey);
    const scenario = getScenario(nextKey);
    const previousScenarioKey = state.activeScenarioKey;
    state.activeScenarioKey = nextKey;
    persistActiveScenarioKey(nextKey);
    updateBodyScenarioClass(nextKey);
    if (renderer?.syncActiveState) renderer.syncActiveState(nextKey);
    if (scenario) {
      setScenarioVisionMode(Boolean(scenario.scenarioVisionEnabled), {
        uniqueOwnerColors: Boolean(scenario.scenarioUniqueOwnerColors),
        profileAvatarOverride: scenario.onboarding ? "../img/onboarding.jpg" : null
      });
    } else {
      setScenarioVisionMode(false, {
        uniqueOwnerColors: false,
        profileAvatarOverride: null
      });
    }
    const payload = typeof onScenarioActivated === "function"
      ? onScenarioActivated(scenario || null, {
        previousScenarioKey,
        source: options.source || "user"
      }) || {}
      : {};
    if (options.dispatch !== false) {
      document.dispatchEvent(new CustomEvent("empire:scenario-applied", {
        detail: {
          scenarioKey: nextKey,
          previousScenarioKey,
          source: options.source || "user",
          ...payload
        }
      }));
    }
    onScenarioStateChanged(getState());
    return getState();
  }

  function handleScenarioButtonClick(event) {
    const button = event.target instanceof Element
      ? event.target.closest("[data-player-scenario]")
      : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const scenarioKey = String(button.getAttribute("data-player-scenario") || "").trim().toLowerCase();
    if (!scenarioKey) return;
    event.preventDefault();
    applyScenario(scenarioKey, { source: "user" });
  }

  function initPlayerScenarioButtons() {
    if (!state.bound) {
      document.addEventListener("click", handleScenarioButtonClick);
      state.bound = true;
    }
    renderer?.renderAll?.(state.activeScenarioKey);
    const storedScenarioKey = resolveStoredScenarioKey();
    if (storedScenarioKey && storedScenarioKey !== "onboarding-20-edge") {
      state.activeScenarioKey = storedScenarioKey;
      renderer?.syncActiveState?.(storedScenarioKey);
    } else {
      state.activeScenarioKey = "";
      renderer?.syncActiveState?.("");
      updateBodyScenarioClass("");
    }
    onScenarioStateChanged(getState());
  }

  return {
    initPlayerScenarioButtons,
    applyScenario,
    getState,
    getScenario,
    isBlackoutLikeScenario,
    setScenarioVisionMode,
    setScenarioAllianceOwners,
    setScenarioEnemyOwners,
    resolveActiveScenarioOwnerName,
    getActiveAllianceOwnerNames,
    getActiveEnemyOwnerNames,
    setLiveAllianceOwnersFromAlliance,
    clearLiveAllianceOwners,
    resolveAllianceIconKeyByName,
    getAllianceTrapGraceRemainingMs
  };
};
