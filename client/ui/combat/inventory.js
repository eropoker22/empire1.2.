window.Empire = window.Empire || {};
window.Empire.UICombat = window.Empire.UICombat || {};

window.Empire.UICombat.createInventoryController = function createInventoryController(deps = {}) {
  const {
    attackWeaponStats = [],
    defenseWeaponStats = [],
    weaponCatalog = [],
    defenseCatalog = [],
    LEGACY_ATTACK_WEAPON_ALIASES = {},
    readStoredObject = () => ({}),
    writeStoredObject = () => {},
    getCachedProfile = () => null,
    getCachedEconomy = () => null,
    updateEconomy = () => {},
    hydrateStorageModalValues = () => {},
    countPlayerControlledPopulation = () => 0
  } = deps;

  function normalizeAttackWeaponLabel(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    const mapped = LEGACY_ATTACK_WEAPON_ALIASES[raw];
    if (mapped) return mapped;
    const compactKey = raw.toLowerCase().replace(/[\s_-]+/g, "");
    switch (compactKey) {
      case "baseballovapalka":
      case "baseballbat": return "Baseballová pálka";
      case "poulicnipistole":
      case "streetpistol":
      case "pistole": return "Pouliční pistole";
      case "granat":
      case "grenade": return "Granát";
      case "samopal":
      case "smg":
      case "utocnapuska": return "Samopal";
      case "bazuka":
      case "bazooka": return "Bazuka";
      default: return raw;
    }
  }

  function readLocalWeaponCounts() { try { return readStoredObject("empire_weapons_detail"); } catch {} return {}; }
  function writeLocalWeaponCounts(store) { writeStoredObject("empire_weapons_detail", store); }
  function readLocalDefenseCounts() { try { return readStoredObject("empire_defense_detail"); } catch {} return {}; }
  function writeLocalDefenseCounts(store) { writeStoredObject("empire_defense_detail", store); }

  function resolveWeaponCounts() {
    const cachedProfile = getCachedProfile();
    const cachedEconomy = getCachedEconomy();
    const sources = [
      cachedProfile?.weaponsDetail,
      cachedEconomy?.weaponsDetail,
      readLocalWeaponCounts(),
      cachedEconomy && typeof cachedEconomy === "object" ? {
        baseballBat: cachedEconomy.baseballBat,
        streetPistol: cachedEconomy.streetPistol,
        grenade: cachedEconomy.grenade,
        smg: cachedEconomy.smg,
        bazooka: cachedEconomy.bazooka
      } : null
    ].filter((source) => source && typeof source === "object");
    const normalized = {};
    sources.forEach((source) => {
      Object.entries(source).forEach(([name, value]) => {
        const mappedName = normalizeAttackWeaponLabel(name);
        if (!mappedName) return;
        const parsed = Number(value || 0);
        const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        if (!safe) return;
        normalized[mappedName] = Math.max(Math.max(0, Math.floor(Number(normalized[mappedName] || 0))), safe);
      });
    });
    attackWeaponStats.forEach((item) => {
      if (!Number.isFinite(Number(normalized[item.name]))) normalized[item.name] = Math.max(0, Math.floor(Number(normalized[item.name] || 0)));
    });
    return normalized;
  }

  function getAttackWeaponTotal(counts = {}) {
    return attackWeaponStats.reduce((sum, item) => {
      const key = Object.keys(counts).find((name) => name.toLowerCase() === item.name.toLowerCase());
      const value = key ? Number(counts[key] || 0) : 0;
      return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
    }, 0);
  }

  function resolveDefenseCounts() {
    const cachedProfile = getCachedProfile();
    const cachedEconomy = getCachedEconomy();
    const sources = [
      cachedProfile?.defenseDetail,
      cachedEconomy?.defenseDetail,
      readLocalDefenseCounts(),
      cachedEconomy && typeof cachedEconomy === "object" ? {
        "Neprůstřelná vesta": cachedEconomy.bulletproofVest,
        "Ocelové barikády": cachedEconomy.steelBarricades,
        "Bezpečnostní kamery": cachedEconomy.securityCameras,
        "Automatické kulometné stanoviště": cachedEconomy.autoMgNest,
        Alarm: cachedEconomy.alarmSystem
      } : null
    ].filter((source) => source && typeof source === "object");
    const normalized = {};
    sources.forEach((source) => {
      Object.entries(source).forEach(([name, value]) => {
        const safeName = String(name || "").trim();
        if (!safeName) return;
        const parsed = Number(value || 0);
        const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        if (!safe) return;
        normalized[safeName] = Math.max(Math.max(0, Math.floor(Number(normalized[safeName] || 0))), safe);
      });
    });
    defenseWeaponStats.forEach((item) => {
      if (!Number.isFinite(Number(normalized[item.name]))) normalized[item.name] = Math.max(0, Math.floor(Number(normalized[item.name] || 0)));
    });
    return normalized;
  }

  function getDefenseWeaponTotal(counts = {}) {
    return defenseWeaponStats.reduce((sum, item) => {
      const key = Object.keys(counts).find((name) => name.toLowerCase() === item.name.toLowerCase());
      const value = key ? Number(counts[key] || 0) : 0;
      return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
    }, 0);
  }

  function syncWeaponStatCounter() {
    const weapons = document.getElementById("stat-weapons");
    if (!weapons) return;
    weapons.textContent = Math.max(Math.max(0, Math.floor(Number(getCachedEconomy()?.weapons || 0))), getAttackWeaponTotal(resolveWeaponCounts()));
  }

  function syncDefenseStatCounter() {
    const defense = document.getElementById("stat-defense");
    if (!defense) return;
    defense.textContent = Math.max(Math.max(0, Math.floor(Number(getCachedEconomy()?.defense || 0))), getDefenseWeaponTotal(resolveDefenseCounts()));
  }

  function updateWeaponsPopover() {
    const list = document.getElementById("weapons-popover-list");
    if (!list) return;
    const counts = resolveWeaponCounts();
    list.innerHTML = weaponCatalog.map((name) => {
      const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
      const value = key ? counts[key] : 0;
      return `<div class="stat__popover-item"><span>${name}</span><strong>${value}</strong></div>`;
    }).join("");
  }

  function updateDefensePopover() {
    const list = document.getElementById("defense-popover-list");
    if (!list) return;
    const counts = resolveDefenseCounts();
    list.innerHTML = defenseCatalog.map((name) => {
      const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
      const value = key ? counts[key] : 0;
      return `<div class="stat__popover-item"><span>${name}</span><strong>${value}</strong></div>`;
    }).join("");
  }

  function openWeaponsModal(mode) {
    const root = document.getElementById("weapons-modal");
    const list = document.getElementById("weapons-modal-list");
    const title = document.getElementById("weapons-modal-title");
    if (!root || !list || !title) return;
    const currentGangMembers = countPlayerControlledPopulation(getCachedProfile() || window.Empire.player || {});
    const isAttack = mode === "attack";
    const stats = isAttack ? attackWeaponStats : defenseWeaponStats;
    const counts = isAttack ? resolveWeaponCounts() : resolveDefenseCounts();
    title.textContent = isAttack ? "Útočné zbraně" : "Obranné zbraně";
    list.innerHTML = stats.map((item) => {
      const key = Object.keys(counts).find((k) => k.toLowerCase() === item.name.toLowerCase());
      const value = key ? counts[key] : 0;
      const unlocked = currentGangMembers >= item.requiredMembers;
      return `<div class="weapons-modal__item ${unlocked ? "" : "is-locked"}"><span class="weapons-modal__name">${item.name}</span><span class="weapons-modal__count">${value} ks</span><span class="weapons-modal__power">Síla ${item.power} • Min. ${item.requiredMembers} členů${unlocked ? "" : " • Nelze použít"}</span></div>`;
    }).join("");
    root.classList.remove("hidden");
  }

  function initWeaponsModal() {
    const root = document.getElementById("weapons-modal");
    const backdrop = document.getElementById("weapons-modal-backdrop");
    const closeBtn = document.getElementById("weapons-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") root.classList.add("hidden"); });
  }

  function initWeaponsPopover() {
    const wrap = document.getElementById("stat-weapons-wrap");
    const popover = document.getElementById("weapons-popover");
    if (!wrap || !popover) return;
    let isOpen = false;
    const open = () => { popover.classList.add("is-open"); isOpen = true; };
    const close = () => { popover.classList.remove("is-open"); isOpen = false; };
    wrap.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Node && popover.contains(target)) return;
      event.stopPropagation();
      if (isOpen) close(); else open();
    });
    popover.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-weapon-action]");
      if (!button) return;
      const action = button.dataset.weaponAction;
      if (!action) return;
      openWeaponsModal(action);
    });
  }

  function persistWeaponCounts(store) {
    const safeStore = store && typeof store === "object" ? { ...store } : {};
    writeLocalWeaponCounts(safeStore);
    const cachedProfile = getCachedProfile();
    const cachedEconomy = getCachedEconomy();
    if (cachedProfile && typeof cachedProfile === "object") {
      cachedProfile.weaponsDetail = { ...safeStore };
      cachedProfile.weapons = getAttackWeaponTotal(safeStore);
    }
    if (cachedEconomy && typeof cachedEconomy === "object") {
      cachedEconomy.weaponsDetail = { ...safeStore };
      cachedEconomy.weapons = getAttackWeaponTotal(safeStore);
      updateEconomy(cachedEconomy);
      return;
    }
    syncWeaponStatCounter();
    updateWeaponsPopover();
    hydrateStorageModalValues();
  }

  function persistDefenseCounts(store) {
    const safeStore = store && typeof store === "object" ? { ...store } : {};
    writeLocalDefenseCounts(safeStore);
    const cachedProfile = getCachedProfile();
    const cachedEconomy = getCachedEconomy();
    if (cachedProfile && typeof cachedProfile === "object") {
      cachedProfile.defenseDetail = { ...safeStore };
      cachedProfile.defense = getDefenseWeaponTotal(safeStore);
    }
    if (cachedEconomy && typeof cachedEconomy === "object") {
      cachedEconomy.defenseDetail = { ...safeStore };
      cachedEconomy.defense = getDefenseWeaponTotal(safeStore);
      updateEconomy(cachedEconomy);
      return;
    }
    syncDefenseStatCounter();
    updateDefensePopover();
    hydrateStorageModalValues();
  }

  function consumeAttackWeaponCounts(selectionCounts = {}) {
    const current = resolveWeaponCounts();
    const next = { ...current };
    attackWeaponStats.forEach((item) => {
      const delta = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      if (!delta) return;
      next[item.name] = Math.max(0, Math.floor(Number(next[item.name] || 0) - delta));
    });
    persistWeaponCounts(next);
    updateWeaponsPopover();
    syncWeaponStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) openWeaponsModal("attack");
    return next;
  }

  function restoreAttackWeaponCounts(selectionCounts = {}) {
    const restored = {};
    attackWeaponStats.forEach((item) => {
      const delta = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      if (!delta) return;
      restored[item.name] = delta;
    });
    if (!Object.keys(restored).length) return resolveWeaponCounts();
    return addCraftedWeapons(restored);
  }

  function consumeDefenseWeaponCounts(selectionCounts = {}) {
    const current = resolveDefenseCounts();
    const next = { ...current };
    defenseWeaponStats.forEach((item) => {
      const delta = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      if (!delta) return;
      next[item.name] = Math.max(0, Math.floor(Number(next[item.name] || 0) - delta));
    });
    persistDefenseCounts(next);
    updateDefensePopover();
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) openWeaponsModal("defense");
    return next;
  }

  function addCraftedWeapons(weaponMap = {}) {
    const source = weaponMap && typeof weaponMap === "object" ? weaponMap : {};
    const store = readLocalWeaponCounts();
    Object.entries(source).forEach(([rawName, amount]) => {
      const name = normalizeAttackWeaponLabel(rawName);
      if (!name) return;
      const delta = Math.max(0, Math.floor(Number(amount) || 0));
      if (!delta) return;
      store[name] = Math.max(0, Math.floor(Number(store[name] || 0) + delta));
    });
    writeLocalWeaponCounts(store);
    updateWeaponsPopover();
    syncWeaponStatCounter();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) openWeaponsModal("attack");
    return store;
  }

  function addCraftedDefense(weaponMap = {}) {
    const source = weaponMap && typeof weaponMap === "object" ? weaponMap : {};
    const store = readLocalDefenseCounts();
    Object.entries(source).forEach(([rawName, amount]) => {
      const name = String(rawName || "").trim();
      if (!name) return;
      const delta = Math.max(0, Math.floor(Number(amount) || 0));
      if (!delta) return;
      store[name] = Math.max(0, Math.floor(Number(store[name] || 0) + delta));
    });
    writeLocalDefenseCounts(store);
    updateDefensePopover();
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) openWeaponsModal("defense");
    return store;
  }

  return {
    normalizeAttackWeaponLabel, readLocalWeaponCounts, writeLocalWeaponCounts, persistWeaponCounts, consumeAttackWeaponCounts,
    restoreAttackWeaponCounts, readLocalDefenseCounts, writeLocalDefenseCounts, persistDefenseCounts, consumeDefenseWeaponCounts,
    resolveWeaponCounts, getAttackWeaponTotal, syncWeaponStatCounter, getDefenseWeaponTotal, syncDefenseStatCounter,
    addCraftedWeapons, addCraftedDefense, updateWeaponsPopover, resolveDefenseCounts, updateDefensePopover,
    openWeaponsModal, initWeaponsModal, initWeaponsPopover
  };
};
