window.Empire = window.Empire || {};
window.Empire.UIMarket = window.Empire.UIMarket || {};

window.Empire.UIMarket.createEconomyController = function createEconomyController(deps = {}) {
  const {
    LOCAL_MARKET_KEY,
    GUEST_DEFAULT_DIRTY_MONEY,
    storageDrugTypes = [],
    resolveMoneyBreakdown = () => ({ cleanMoney: 0, dirtyMoney: 0, totalMoney: 0 }),
    normalizeSpyCount = (value) => value,
    getSpyCount = () => 0,
    resolveSpyCountFromPayload = () => null,
    setSpyCount = () => {},
    updateEconomy = () => {},
    getCachedEconomy = () => null,
    setCachedEconomy = () => {},
    getCachedProfile = () => null,
    setCachedProfile = () => {},
    applyMoneyToProfileSnapshot = (profile) => profile,
    isBlackoutLikeScenario = () => false,
    buildBlackoutPlayerSourcesSnapshot = () => null,
    resolveActiveScenarioOwnerName = () => "",
    updateProfile = () => {},
    makeSeedOrder = () => ({}),
    resourceKeyToBalanceKey = (key) => key
  } = deps;

  function getLocalMarketState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_MARKET_KEY) || "null");
      if (parsed && parsed.balances && Array.isArray(parsed.orderBook) && Array.isArray(parsed.myOrders) && Array.isArray(parsed.recentTrades)) {
        normalizeLocalMarketBalances(parsed.balances);
        let normalizedChanged = false;
        ["metalParts", "techCore", "combatModule"].forEach((key) => {
          if (Number(parsed.balances[key] || 0) !== 20) {
            parsed.balances[key] = 20;
            normalizedChanged = true;
          }
        });
        const dirty = Number(parsed.balances.dirtyMoney || 0);
        if (!Number.isFinite(dirty) || dirty < GUEST_DEFAULT_DIRTY_MONEY) {
          parsed.balances.dirtyMoney = GUEST_DEFAULT_DIRTY_MONEY;
          parsed.balances.money = Number(parsed.balances.cleanMoney || 0) + Number(parsed.balances.dirtyMoney || 0);
          normalizedChanged = true;
        }
        if (normalizedChanged) saveLocalMarketState(parsed);
        return parsed;
      }
    } catch {}
    const seeded = {
      balances: {
        money: 17000, cleanMoney: 12000, dirtyMoney: GUEST_DEFAULT_DIRTY_MONEY, drugs: 80,
        chemicals: 36, biomass: 28, stimPack: 12, neonDust: 44, pulseShot: 14, velvetSmoke: 12, ghostSerum: 7, overdriveX: 3,
        metalParts: 20, techCore: 20, combatModule: 20, weapons: 30, baseballBat: 8, streetPistol: 6, grenade: 4, smg: 3, bazooka: 1,
        bulletproofVest: 7, steelBarricades: 5, securityCameras: 4, autoMgNest: 2, alarmSystem: 3, materials: 120, dataShards: 18
      },
      orderBook: [
        makeSeedOrder("neon_dust", "sell", 35, 92, "Neon Vipers"),
        makeSeedOrder("pulse_shot", "buy", 8, 245, "Black Sun Pact"),
        makeSeedOrder("velvet_smoke", "sell", 6, 310, "Velvet Circuit"),
        makeSeedOrder("ghost_serum", "buy", 4, 420, "Ghost Wire"),
        makeSeedOrder("overdrive_x", "sell", 2, 650, "Crimson Apex"),
        makeSeedOrder("weapons", "sell", 12, 260, "Chrome Cartel"),
        makeSeedOrder("weapons", "buy", 10, 235, "Raven"),
        makeSeedOrder("materials", "sell", 60, 78, "Factory 9"),
        makeSeedOrder("materials", "buy", 40, 70, "Steel Dogs"),
        makeSeedOrder("chemicals", "sell", 18, 48, "Cold Script"),
        makeSeedOrder("biomass", "buy", 14, 42, "Bio Verge"),
        makeSeedOrder("stim_pack", "sell", 6, 130, "White Vein"),
        makeSeedOrder("metal_parts", "sell", 28, 66, "Forge Lane"),
        makeSeedOrder("tech_core", "buy", 10, 158, "Helix Nine"),
        makeSeedOrder("combat_module", "sell", 4, 420, "Core Hammer"),
        makeSeedOrder("street_pistol", "sell", 5, 220, "Brass Echo"),
        makeSeedOrder("smg", "buy", 3, 460, "Riot Thread"),
        makeSeedOrder("bulletproof_vest", "sell", 4, 210, "Shield Loop"),
        makeSeedOrder("alarm_system", "buy", 2, 320, "Zero Ward"),
        makeSeedOrder("data_shards", "sell", 8, 420, "Hex"),
        makeSeedOrder("data_shards", "buy", 6, 390, "Ghost Wire")
      ],
      myOrders: [],
      recentTrades: [
        { resourceKey: "neon_dust", quantity: 18, pricePerUnit: 96, feePaid: 86, createdAt: Date.now() - 200000 },
        { resourceKey: "pulse_shot", quantity: 3, pricePerUnit: 236, feePaid: 35, createdAt: Date.now() - 150000 },
        { resourceKey: "weapons", quantity: 4, pricePerUnit: 248, feePaid: 49, createdAt: Date.now() - 120000 },
        { resourceKey: "metal_parts", quantity: 16, pricePerUnit: 64, feePaid: 51, createdAt: Date.now() - 90000 },
        { resourceKey: "street_pistol", quantity: 2, pricePerUnit: 214, feePaid: 21, createdAt: Date.now() - 60000 }
      ],
      marketFeePct: 5
    };
    saveLocalMarketState(seeded);
    return seeded;
  }

  function enforceLocalGuestStorageDefaults() {
    if (window.Empire.token) return;
    const state = getLocalMarketState();
    if (!state?.balances) return;
    normalizeLocalMarketBalances(state.balances);
    state.balances.metalParts = 20;
    state.balances.techCore = 20;
    state.balances.combatModule = 20;
    if (Array.isArray(state.myOrders) && state.myOrders.length) {
      state.myOrders = [];
    }
    saveLocalMarketState(state);
  }

  function saveLocalMarketState(state) {
    normalizeLocalMarketBalances(state.balances || {});
    localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(state));
  }

  function normalizeLocalMarketBalances(balances) {
    if (!balances) return;
    const money = resolveMoneyBreakdown(balances);
    balances.cleanMoney = money.cleanMoney;
    balances.dirtyMoney = money.dirtyMoney;
    balances.money = money.totalMoney;
    const legacyDrugTotal = Number.isFinite(Number(balances.drugs)) ? Math.max(0, Math.floor(Number(balances.drugs))) : 0;
    storageDrugTypes.forEach((drug) => {
      const value = Number(balances[drug.key] || 0);
      balances[drug.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    });
    let drugTotal = storageDrugTypes.reduce((sum, drug) => sum + Number(balances[drug.key] || 0), 0);
    if (drugTotal === 0 && legacyDrugTotal > 0) {
      const split = [0.55, 0.18, 0.15, 0.08, 0.04];
      let used = 0;
      storageDrugTypes.forEach((drug, index) => {
        if (index === storageDrugTypes.length - 1) {
          balances[drug.key] = Math.max(0, legacyDrugTotal - used);
          return;
        }
        const part = Math.floor(legacyDrugTotal * split[index]);
        balances[drug.key] = part;
        used += part;
      });
      drugTotal = storageDrugTypes.reduce((sum, drug) => sum + Number(balances[drug.key] || 0), 0);
    }
    balances.drugs = Math.max(0, Math.floor(drugTotal));
    ["chemicals","biomass","stimPack","metalParts","techCore","combatModule","weapons","materials","dataShards","baseballBat","streetPistol","grenade","smg","bazooka","bulletproofVest","steelBarricades","securityCameras","autoMgNest","alarmSystem"].forEach((key) => {
      const value = Number(balances[key] || 0);
      balances[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    });
  }

  function spendLocalMoney(balances, amount) {
    normalizeLocalMarketBalances(balances);
    if (!Number.isInteger(amount) || amount < 0) return false;
    let remaining = amount;
    const fromClean = Math.min(Number(balances.cleanMoney || 0), remaining);
    balances.cleanMoney -= fromClean;
    remaining -= fromClean;
    const fromDirty = Math.min(Number(balances.dirtyMoney || 0), remaining);
    balances.dirtyMoney -= fromDirty;
    remaining -= fromDirty;
    balances.money = Number(balances.cleanMoney || 0) + Number(balances.dirtyMoney || 0);
    return remaining === 0;
  }

  function addLocalMoney(balances, amount, bucket = "clean") {
    normalizeLocalMarketBalances(balances);
    const value = Number(amount || 0);
    if (value <= 0) return;
    if (bucket === "dirty") balances.dirtyMoney += value;
    else balances.cleanMoney += value;
    balances.money = Number(balances.cleanMoney || 0) + Number(balances.dirtyMoney || 0);
  }

  function getEconomySnapshotFromDom() {
    const parseMoney = (id) => {
      const text = document.getElementById(id)?.textContent || "0";
      const parsed = Number(String(text).replace(/[^\d-]/g, "") || 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const parseStat = (id) => {
      const text = document.getElementById(id)?.textContent || "0";
      const parsed = Number(String(text).replace(/[^\d-]/g, "") || 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const influenceEl = document.getElementById("stat-influence");
    const influenceFromDataset = Number(influenceEl?.dataset?.influenceValue);
    const influenceValue = Number.isFinite(influenceFromDataset) ? normalizeSpyCount(influenceFromDataset, 0) : parseStat("stat-influence");
    return { cleanMoney: parseMoney("stat-clean-money"), dirtyMoney: parseMoney("stat-dirty-money"), influence: influenceValue, spyCount: getSpyCount(), spies: getSpyCount(), drugs: 0, drugInventory: {}, weapons: 0, defense: 0, materials: 0 };
  }

  function ensureEconomyCache() {
    let cachedEconomy = getCachedEconomy();
    if (!cachedEconomy || typeof cachedEconomy !== "object") {
      cachedEconomy = getEconomySnapshotFromDom();
      setCachedEconomy(cachedEconomy);
    }
    const currentInventory = cachedEconomy.drugInventory && typeof cachedEconomy.drugInventory === "object" ? cachedEconomy.drugInventory : {};
    const normalizedDrugInventory = storageDrugTypes.reduce((acc, item) => {
      const value = Number(currentInventory[item.key] ?? cachedEconomy[item.key] ?? 0);
      acc[item.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
    cachedEconomy.drugInventory = normalizedDrugInventory;
    cachedEconomy.drugs = storageDrugTypes.reduce((sum, item) => sum + Number(normalizedDrugInventory[item.key] || 0), 0);
    const money = resolveMoneyBreakdown(cachedEconomy || {});
    cachedEconomy.cleanMoney = money.cleanMoney;
    cachedEconomy.dirtyMoney = money.dirtyMoney;
    cachedEconomy.balance = money.totalMoney;
    const economySpyCount = resolveSpyCountFromPayload(cachedEconomy);
    if (economySpyCount != null) setSpyCount(economySpyCount, { persist: true });
    cachedEconomy.spyCount = getSpyCount();
    cachedEconomy.spies = getSpyCount();
    setCachedEconomy(cachedEconomy);
    return cachedEconomy;
  }

  function getEconomySnapshot() {
    return JSON.parse(JSON.stringify(ensureEconomyCache()));
  }

  function trySpendCash(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    if (money.totalMoney < required) return { ok: false, reason: "insufficient_cash", available: money.totalMoney };
    let remaining = required;
    const fromClean = Math.min(money.cleanMoney, remaining);
    money.cleanMoney -= fromClean;
    remaining -= fromClean;
    const fromDirty = Math.min(money.dirtyMoney, remaining);
    money.dirtyMoney -= fromDirty;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return { ok: true, spent: required, cleanSpent: fromClean, dirtySpent: fromDirty };
  }

  function trySpendCleanCash(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    if (money.cleanMoney < required) return { ok: false, reason: "insufficient_clean_cash", available: money.cleanMoney };
    money.cleanMoney -= required;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return { ok: true, spent: required, cleanSpent: required, dirtySpent: 0 };
  }

  function addCleanCash(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.cleanMoney = Number(economy.cleanMoney || 0) + value;
    economy.balance = Number(economy.cleanMoney || 0) + Number(economy.dirtyMoney || 0);
    updateEconomy(economy);
    return value;
  }

  function addDirtyCash(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.dirtyMoney = Number(economy.dirtyMoney || 0) + value;
    economy.balance = Number(economy.cleanMoney || 0) + Number(economy.dirtyMoney || 0);
    updateEconomy(economy);
    return value;
  }

  function trySpendMaterials(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const removed = removeEconomyResource("materials", required);
    if (removed < required) {
      if (removed > 0) addEconomyResource("materials", removed);
      return { ok: false, reason: "insufficient_materials", available: removed };
    }
    return { ok: true, spent: required };
  }

  function addMaterials(amount) { return addEconomyResource("materials", amount); }

  function addInfluence(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.influence = Math.max(0, Number(economy.influence || 0) + value);
    updateEconomy(economy);
    return value;
  }

  function launderDirtyCash(portion) {
    const ratioRaw = Number(portion);
    if (!Number.isFinite(ratioRaw)) return 0;
    const ratio = Math.max(0, Math.min(1, ratioRaw > 1 ? ratioRaw / 100 : ratioRaw));
    if (ratio <= 0) return 0;
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    const laundered = Math.max(0, Math.floor(money.dirtyMoney * ratio));
    if (laundered <= 0) return 0;
    money.dirtyMoney = Math.max(0, money.dirtyMoney - laundered);
    money.cleanMoney += laundered;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return laundered;
  }

  function addEconomyResource(resourceKey, amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    economy[balanceKey] = Math.max(0, Math.floor(Number(economy[balanceKey] || 0) + value));
    if (["metalParts", "techCore", "combatModule"].includes(balanceKey)) economy.materials = Math.max(0, Math.floor(Number(economy.materials || 0) + value));
    else if (storageDrugTypes.some((item) => item.key === balanceKey)) {
      economy.drugInventory = economy.drugInventory || {};
      economy.drugInventory[balanceKey] = Math.max(0, Math.floor(Number(economy.drugInventory[balanceKey] || 0) + value));
      economy.drugs = Math.max(0, Math.floor(Number(economy.drugs || 0) + value));
    } else if (["baseballBat", "streetPistol", "grenade", "smg", "bazooka"].includes(balanceKey)) {
      economy.weapons = Math.max(0, Math.floor(Number(economy.weapons || 0) + value));
    }
    updateEconomy(economy);
    return value;
  }

  function removeEconomyResource(resourceKey, amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    const available = Math.max(0, Math.floor(Number(economy[balanceKey] || 0)));
    const removed = Math.min(available, value);
    if (removed <= 0) return 0;
    economy[balanceKey] = Math.max(0, available - removed);
    if (["metalParts", "techCore", "combatModule"].includes(balanceKey)) economy.materials = Math.max(0, Math.floor(Number(economy.materials || 0) - removed));
    else if (storageDrugTypes.some((item) => item.key === balanceKey)) {
      economy.drugInventory = economy.drugInventory || {};
      economy.drugInventory[balanceKey] = Math.max(0, Math.floor(Number(economy.drugInventory[balanceKey] || 0) - removed));
      economy.drugs = Math.max(0, Math.floor(Number(economy.drugs || 0) - removed));
    } else if (["baseballBat", "streetPistol", "grenade", "smg", "bazooka"].includes(balanceKey)) {
      economy.weapons = Math.max(0, Math.floor(Number(economy.weapons || 0) - removed));
    }
    updateEconomy(economy);
    return removed;
  }

  function createLocalMarketOrder({ resourceKey, side, quantity, pricePerUnit }) {
    const state = getLocalMarketState();
    normalizeLocalMarketBalances(state.balances || {});
    if (!["buy", "sell"].includes(side)) return { error: "invalid_side" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { error: "invalid_quantity" };
    if (!Number.isInteger(pricePerUnit) || pricePerUnit <= 0) return { error: "invalid_price" };
    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    if (side === "sell" && Number(state.balances[balanceKey] || 0) < quantity) return { error: "insufficient_resource" };
    const orderCost = quantity * pricePerUnit;
    if (side === "buy" && Number(state.balances.money || 0) < orderCost) return { error: "insufficient_money" };
    if (side === "sell") state.balances[balanceKey] -= quantity;
    else if (!spendLocalMoney(state.balances, orderCost)) return { error: "insufficient_money" };
    const order = { id: `local-${Date.now()}`, resourceKey, side, quantity, remainingQuantity: quantity, pricePerUnit, status: "open", createdAt: Date.now() };
    state.myOrders.unshift(order);
    matchLocalMarketOrder(state, order);
    saveLocalMarketState(state);
    return { ok: true };
  }

  function cancelLocalMarketOrder(orderId) {
    const state = getLocalMarketState();
    normalizeLocalMarketBalances(state.balances || {});
    const order = state.myOrders.find((item) => item.id === orderId && item.status === "open");
    if (!order) return { error: "order_not_found" };
    const balanceKey = resourceKeyToBalanceKey(order.resourceKey);
    if (order.side === "sell") state.balances[balanceKey] += order.remainingQuantity;
    else addLocalMoney(state.balances, order.remainingQuantity * order.pricePerUnit, "clean");
    state.myOrders = (state.myOrders || []).filter((item) => item.id !== orderId);
    state.orderBook = (state.orderBook || []).filter((item) => item.id !== orderId);
    saveLocalMarketState(state);
    return { ok: true };
  }

  function matchLocalMarketOrder(state, order) {
    normalizeLocalMarketBalances(state.balances || {});
    const candidates = (state.orderBook || []).filter((entry) => entry.resourceKey === order.resourceKey && entry.side !== order.side && ((order.side === "buy" && entry.pricePerUnit <= order.pricePerUnit) || (order.side === "sell" && entry.pricePerUnit >= order.pricePerUnit)));
    const sorted = candidates.sort((a, b) => order.side === "buy" ? a.pricePerUnit - b.pricePerUnit : b.pricePerUnit - a.pricePerUnit);
    const balanceKey = resourceKeyToBalanceKey(order.resourceKey);
    sorted.forEach((entry) => {
      if (order.remainingQuantity <= 0) return;
      const traded = Math.min(order.remainingQuantity, entry.remainingQuantity);
      const gross = traded * entry.pricePerUnit;
      const feePaid = Math.floor(gross * 0.05);
      if (order.side === "buy") {
        state.balances[balanceKey] += traded;
        addLocalMoney(state.balances, traded * Math.max(0, order.pricePerUnit - entry.pricePerUnit), "clean");
      } else {
        addLocalMoney(state.balances, gross - feePaid, "dirty");
      }
      order.remainingQuantity -= traded;
      entry.remainingQuantity -= traded;
      state.recentTrades.unshift({ resourceKey: order.resourceKey, quantity: traded, pricePerUnit: entry.pricePerUnit, feePaid, createdAt: Date.now() });
    });
    state.orderBook = (state.orderBook || []).filter((entry) => entry.remainingQuantity > 0);
    state.recentTrades = state.recentTrades.slice(0, 30);
    order.status = order.remainingQuantity === 0 ? "filled" : "open";
  }

  function syncGuestEconomyFromMarket() {
    if (window.Empire.token) return;
    const state = getLocalMarketState();
    const money = resolveMoneyBreakdown(state.balances || {});
    const currentProfile = getCachedProfile() || window.Empire.player || null;
    const currentEconomy = getCachedEconomy();
    const currentInfluence = Math.max(0, Math.floor(Number(currentProfile?.influence ?? currentEconomy?.influence ?? 0) || 0));
    if (currentProfile && typeof currentProfile === "object") {
      const nextProfile = applyMoneyToProfileSnapshot(currentProfile, money);
      nextProfile.influence = currentInfluence;
      if (isBlackoutLikeScenario()) {
        nextProfile.sources = buildBlackoutPlayerSourcesSnapshot(window.Empire.districts, resolveActiveScenarioOwnerName());
        nextProfile.source = nextProfile.sources;
      }
      setCachedProfile(nextProfile);
      window.Empire.player = { ...(window.Empire.player || {}), ...nextProfile };
    }
    const drugInventory = storageDrugTypes.reduce((acc, item) => {
      acc[item.key] = Number(state.balances[item.key] || 0);
      return acc;
    }, {});
    updateEconomy({
      balance: money.totalMoney, cleanMoney: money.cleanMoney, dirtyMoney: money.dirtyMoney, influence: currentInfluence,
      drugs: Number(state.balances.drugs || 0), neonDust: Number(state.balances.neonDust || 0), pulseShot: Number(state.balances.pulseShot || 0),
      velvetSmoke: Number(state.balances.velvetSmoke || 0), ghostSerum: Number(state.balances.ghostSerum || 0), overdriveX: Number(state.balances.overdriveX || 0),
      drugInventory, weapons: Number(state.balances.weapons || 0), defense: 0, materials: Number(state.balances.materials || 0),
      metalParts: Number(state.balances.metalParts || 0), techCore: Number(state.balances.techCore || 0), combatModule: Number(state.balances.combatModule || 0), dataShards: Number(state.balances.dataShards || 0)
    });
    if (currentProfile && typeof currentProfile === "object") updateProfile(window.Empire.player);
  }

  return {
    getLocalMarketState,
    enforceLocalGuestStorageDefaults,
    saveLocalMarketState,
    normalizeLocalMarketBalances,
    spendLocalMoney,
    addLocalMoney,
    getEconomySnapshotFromDom,
    ensureEconomyCache,
    getEconomySnapshot,
    trySpendCash,
    trySpendCleanCash,
    addCleanCash,
    addDirtyCash,
    trySpendMaterials,
    addMaterials,
    addInfluence,
    launderDirtyCash,
    addEconomyResource,
    removeEconomyResource,
    createLocalMarketOrder,
    cancelLocalMarketOrder,
    matchLocalMarketOrder,
    syncGuestEconomyFromMarket
  };
};
