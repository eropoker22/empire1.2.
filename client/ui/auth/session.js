window.Empire = window.Empire || {};
window.Empire.UIAuth = window.Empire.UIAuth || {};

window.Empire.UIAuth.createSessionController = function createSessionController(deps = {}) {
  const {
    getGuestModeActive = () => false,
    setGuestModeActive = () => {},
    setScenarioVisionMode = () => {},
    setScenarioAllianceOwners = () => {},
    setScenarioEnemyOwners = () => {},
    updateEconomy = () => {},
    setLiveAllianceOwnersFromAlliance = () => {},
    updateProfile = () => {},
    resolveFactionBaseSpyCount = () => 0,
    getCachedProfile = () => null,
    readStoredStructure = () => "",
    writeSpyRecoveryQueue = () => {},
    syncSpyRecoveryTicker = () => {},
    setSpyCount = () => {},
    getLocalAllianceState = () => ({}),
    renderAllianceChat = () => {},
    renderGlobalServerChat = () => {},
    syncGuestAllianceLabel = () => {},
    syncGuestEconomyFromMarket = () => {},
    clearLiveAllianceOwners = () => {}
  } = deps;

  async function hydrateAfterAuth() {
    setScenarioVisionMode(false);
    setScenarioAllianceOwners([]);
    setScenarioEnemyOwners([]);
    const [profile, economy, districtData, allianceData] = await Promise.all([
      window.Empire.API.getProfile(),
      window.Empire.API.getEconomy(),
      window.Empire.API.getDistricts(),
      window.Empire.API.getAlliance().catch(() => ({ alliance: null }))
    ]);

    window.Empire.player = profile;
    updateEconomy(economy);
    setLiveAllianceOwnersFromAlliance(allianceData?.alliance || null);

    if (districtData && districtData.districts) {
      window.Empire.Map.clearUnderAttackDistricts?.();
      window.Empire.Map.clearPoliceActions?.();
      window.Empire.Map.setDistricts(districtData.districts);
    }

    updateProfile(profile);
    window.Empire.WS.connect();
  }

  function refreshGuestBannerVisibility() {
    const banner = document.getElementById("guest-banner");
    if (!banner) return;
    const hasSelectedScenario = Boolean(document.querySelector("[data-player-scenario].is-active"));
    banner.classList.toggle("hidden", !getGuestModeActive() || hasSelectedScenario);
  }

  function setGuestMode(isGuest) {
    setGuestModeActive(Boolean(isGuest));
    refreshGuestBannerVisibility();
    if (isGuest) {
      const baseSpies = resolveFactionBaseSpyCount(getCachedProfile()?.structure || readStoredStructure());
      writeSpyRecoveryQueue([]);
      syncSpyRecoveryTicker();
      setSpyCount(baseSpies, { persist: true });
      const state = getLocalAllianceState();
      renderAllianceChat(state.chat);
      renderGlobalServerChat();
      syncGuestAllianceLabel(state.activeAlliance?.name || "Žádná");
      setLiveAllianceOwnersFromAlliance(state.activeAlliance || null);
      syncGuestEconomyFromMarket();
    } else {
      clearLiveAllianceOwners();
    }
  }

  return {
    hydrateAfterAuth,
    refreshGuestBannerVisibility,
    setGuestMode
  };
};
