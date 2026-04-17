window.Empire = window.Empire || {};
window.Empire.UIProfile = window.Empire.UIProfile || {};

window.Empire.UIProfile.createProfileStateController = function createProfileStateController(deps = {}) {
  const {
    getCachedProfile = () => null,
    setCachedProfile = () => {},
    getCachedEconomy = () => null,
    setCachedEconomy = () => {},
    getCachedSpyCount = () => null,
    resolveSpyCountFromPayload = () => null,
    setSpyCount = () => {},
    resolveFactionBaseSpyCount = () => 0,
    readStoredStructure = () => "",
    renderInfluenceSpyTopbarStat = () => {},
    normalizeHexColor = (value) => value,
    writeStoredGangColor = () => {},
    formatFactionLabel = () => "-",
    formatWantedHeat = (value) => String(value || 0),
    resolveWantedLevel = () => 0,
    countPlayerControlledPopulation = () => 0,
    formatAllianceProfileSummary = () => "Žádná",
    setAllianceButtonState = () => {},
    updateProfileWantedStars = () => {},
    refreshGangColorDisplays = () => {},
    hydrateProfileModal = () => {},
    updateWeaponsPopover = () => {},
    updateDefensePopover = () => {},
    renderGangHeatModal = () => {},
    syncMapVisionContext = () => {},
    refreshMarketBuildingShortcuts = () => {},
    storageDrugTypes = [],
    normalizeSpyCount = (value) => value,
    getSpyCount = () => 0,
    resolveMoneyBreakdown = () => ({ cleanMoney: 0, dirtyMoney: 0 }),
    syncMoneyStatToCachedValue = () => {},
    animateMoneyStatCounter = () => {},
    animateMoneyStatValue = () => {},
    getLastRenderedCleanMoney = () => null,
    setLastRenderedCleanMoney = () => {},
    getLastRenderedDirtyMoney = () => null,
    setLastRenderedDirtyMoney = () => {},
    syncWeaponStatCounter = () => {},
    syncDefenseStatCounter = () => {},
    hydrateStorageModalValues = () => {}
  } = deps;

  function updateProfile(profile) {
    setCachedProfile(profile);
    const profileSpyCount = resolveSpyCountFromPayload(profile);
    if (profileSpyCount != null) {
      setSpyCount(profileSpyCount, { persist: true });
    } else if (getCachedSpyCount() == null) {
      const defaultSpies = resolveFactionBaseSpyCount(profile?.structure || readStoredStructure());
      setSpyCount(defaultSpies, { persist: true });
    } else {
      renderInfluenceSpyTopbarStat();
    }
    const profileGangColor = normalizeHexColor(profile?.gangColor || profile?.gang_color);
    if (profileGangColor) {
      writeStoredGangColor(profileGangColor);
    }
    window.Empire.player = {
      ...(window.Empire.player || {}),
      ...(profile || {})
    };
    const factionLabel = formatFactionLabel(profile.structure || readStoredStructure());
    const wantedLevel = resolveWantedLevel(profile);
    const profileGang = document.getElementById("profile-gang");
    const profileDistricts = document.getElementById("profile-districts");
    const profileAlliance = document.getElementById("profile-alliance");
    const structure = document.getElementById("profile-structure");
    const statStructure = document.getElementById("stat-structure");
    const faction = document.getElementById("profile-faction");
    if (profileGang) profileGang.textContent = countPlayerControlledPopulation(profile).toLocaleString("cs-CZ");
    if (profileDistricts) profileDistricts.textContent = profile.districts || 0;
    if (profileAlliance) profileAlliance.textContent = formatAllianceProfileSummary(profile);
    setAllianceButtonState(profile.alliance || "Žádná");
    if (structure) structure.textContent = formatWantedHeat(wantedLevel);
    if (statStructure) statStructure.textContent = formatWantedHeat(wantedLevel);
    updateProfileWantedStars(wantedLevel);
    if (faction) faction.textContent = factionLabel;
    refreshGangColorDisplays();
    hydrateProfileModal(profile);
    updateWeaponsPopover();
    updateDefensePopover();
    renderGangHeatModal();
    syncMapVisionContext();
    refreshMarketBuildingShortcuts();
    window.Empire.Map?.render?.();
  }

  function refreshProfilePopulation() {
    const profileSource = getCachedProfile() || window.Empire.player || {};
    updateProfile(profileSource);
    return countPlayerControlledPopulation(profileSource);
  }

  function updateEconomy(economy, { instant = false } = {}) {
    const safeEconomy = economy && typeof economy === "object" ? { ...economy } : {};
    const rawDrugInventory = safeEconomy.drugInventory && typeof safeEconomy.drugInventory === "object"
      ? safeEconomy.drugInventory
      : {};
    const normalizedDrugInventory = storageDrugTypes.reduce((acc, item) => {
      const directValue = Number(rawDrugInventory[item.key]);
      const fallbackValue = Number(safeEconomy[item.key]);
      const value = Number.isFinite(directValue) ? directValue : fallbackValue;
      acc[item.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
    const totalDrugs = storageDrugTypes.reduce((sum, item) => sum + Number(normalizedDrugInventory[item.key] || 0), 0);
    safeEconomy.drugInventory = normalizedDrugInventory;
    safeEconomy.drugs = Number.isFinite(Number(safeEconomy.drugs))
      ? Math.max(0, Math.floor(Number(safeEconomy.drugs)))
      : totalDrugs;
    safeEconomy.influence = normalizeSpyCount(safeEconomy.influence || 0, 0);
    const economySpyCount = resolveSpyCountFromPayload(safeEconomy);
    if (economySpyCount != null) {
      setSpyCount(economySpyCount, { persist: true });
    } else {
      getSpyCount();
    }
    safeEconomy.spyCount = getSpyCount();
    safeEconomy.spies = getSpyCount();
    setCachedEconomy(safeEconomy);

    const money = resolveMoneyBreakdown(safeEconomy || {});
    const cleanMoney = document.getElementById("stat-clean-money");
    const dirtyMoney = document.getElementById("stat-dirty-money");
    const lastRenderedCleanMoney = getLastRenderedCleanMoney();
    const lastRenderedDirtyMoney = getLastRenderedDirtyMoney();
    if (cleanMoney) {
      if (instant || lastRenderedCleanMoney == null) syncMoneyStatToCachedValue(cleanMoney, money.cleanMoney);
      else animateMoneyStatCounter(cleanMoney, money.cleanMoney);
    }
    if (dirtyMoney) {
      if (instant || lastRenderedDirtyMoney == null) syncMoneyStatToCachedValue(dirtyMoney, money.dirtyMoney);
      else animateMoneyStatCounter(dirtyMoney, money.dirtyMoney);
    }
    if (!instant && cleanMoney && lastRenderedCleanMoney != null && money.cleanMoney !== lastRenderedCleanMoney) {
      animateMoneyStatValue(cleanMoney, money.cleanMoney - lastRenderedCleanMoney);
    }
    if (!instant && dirtyMoney && lastRenderedDirtyMoney != null && money.dirtyMoney !== lastRenderedDirtyMoney) {
      animateMoneyStatValue(dirtyMoney, money.dirtyMoney - lastRenderedDirtyMoney);
    }
    setLastRenderedCleanMoney(money.cleanMoney);
    setLastRenderedDirtyMoney(money.dirtyMoney);
    renderInfluenceSpyTopbarStat({ instant });
    const drugs = document.getElementById("stat-drugs");
    const storage = document.getElementById("stat-storage");
    const weapons = document.getElementById("stat-weapons");
    const defense = document.getElementById("stat-defense");
    if (drugs) drugs.textContent = safeEconomy.drugs || 0;
    if (storage) storage.textContent = safeEconomy.materials || 0;
    if (weapons) weapons.textContent = safeEconomy.weapons || 0;
    syncWeaponStatCounter();
    if (defense) defense.textContent = safeEconomy.defense || 0;
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    if (getCachedProfile()) hydrateProfileModal(getCachedProfile());
    updateWeaponsPopover();
    updateDefensePopover();
  }

  return {
    updateProfile,
    refreshProfilePopulation,
    updateEconomy
  };
};
