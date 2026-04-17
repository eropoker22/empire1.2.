window.Empire = window.Empire || {};
window.Empire.UIProfile = window.Empire.UIProfile || {};

window.Empire.UIProfile.createProfileModalController = function createProfileModalController(deps = {}) {
  const {
    getCachedEconomy = () => null,
    getCachedProfile = () => null,
    getLastValidBlackoutSources = () => null,
    setLastValidBlackoutSources = () => {},
    resolveMoneyBreakdown = () => ({ cleanMoney: 0, dirtyMoney: 0 }),
    readStoredGuestUsername = () => "",
    readStoredGangName = () => "",
    readStoredStructure = () => "",
    formatFactionLabel = () => "-",
    resolveWantedLevel = () => 0,
    resolveActiveProfileAvatar = () => null,
    applyProfileModalVisuals = () => {},
    formatPoliceRaidProtectionLabel = () => "Bez ochrany",
    resolvePoliceRaidProtectionUntil = () => 0,
    formatDurationLabel = () => "0 s",
    formatWantedHeat = (value) => String(value || 0),
    formatDecimalValue = (value, digits = 2) => Number(value || 0).toFixed(digits),
    extractAllianceDisplayName = () => "",
    isBlackoutLikeScenario = () => false,
    buildBlackoutPlayerSourcesSnapshot = () => null,
    resolveActiveScenarioOwnerName = () => "",
    hasMeaningfulBlackoutSources = () => false,
    collectBlackoutMapPlayerSummaries = () => [],
    refreshGangColorDisplays = () => {}
  } = deps;

  function hydrateProfileModal(profile) {
    if (!profile) return;
    const economy = getCachedEconomy() || {};
    const moneyFromProfile = resolveMoneyBreakdown(profile || {});
    const moneyFromEconomy = resolveMoneyBreakdown(economy || {});
    const guestUsername = String(readStoredGuestUsername() || "").trim();
    const guestGangName = String(readStoredGangName() || "").trim();
    const factionLabel = formatFactionLabel(profile.structure || readStoredStructure());
    const wantedLevel = resolveWantedLevel(profile);
    const influenceRaw = Number(profile.influence ?? economy.influence ?? 0);
    const influenceValue = Number.isFinite(influenceRaw) ? Math.max(0, Math.floor(influenceRaw)) : 0;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    const avatar = resolveActiveProfileAvatar();
    const avatarImg = document.getElementById("profile-avatar");
    if (avatarImg) {
      if (avatar) {
        avatarImg.src = avatar;
        avatarImg.classList.remove("hidden");
      } else {
        avatarImg.removeAttribute("src");
        avatarImg.classList.add("hidden");
      }
    }
    applyProfileModalVisuals(avatar);
    setText("profile-modal-username", profile.username || guestUsername || "-");
    setText("profile-modal-gang", profile.gangName || guestGangName || "-");
    setText("profile-modal-faction", factionLabel);
    setText("profile-modal-influence", influenceValue);
    const wantedText = formatWantedHeat(wantedLevel);
    setText("profile-modal-wanted", wantedText);
    const wantedEl = document.getElementById("profile-modal-wanted");
    if (wantedEl) {
      wantedEl.title = `Hledanost: ${wantedText} | ${formatPoliceRaidProtectionLabel(profile)}`;
    }
    const wantedLockEl = document.getElementById("profile-modal-wanted-lock");
    if (wantedLockEl) {
      const until = resolvePoliceRaidProtectionUntil(profile);
      const active = until > Date.now();
      wantedLockEl.classList.toggle("hidden", !active);
      wantedLockEl.title = active ? `Aktivní ochrana po razii: ${formatDurationLabel(until - Date.now())}` : "Bez aktivní ochrany po razii";
    }
    setText("profile-modal-raid-protection", formatPoliceRaidProtectionLabel(profile));
    const allianceLabel = extractAllianceDisplayName(profile.alliance) || "Žádná";
    const districtCount = Number.isFinite(Number(profile.districts)) ? Math.max(0, Math.floor(Number(profile.districts))) : 0;
    setText("profile-modal-alliance", allianceLabel !== "Žádná" ? `${allianceLabel} • ${districtCount}` : "Žádná");
    setText("profile-modal-districts", profile.districts || 0);
    const blackoutSourceRow = document.getElementById("profile-modal-blackout-source-row");
    const blackoutSourceValue = document.getElementById("profile-modal-blackout-source");
    const blackoutPlayersRow = document.getElementById("profile-modal-blackout-players-row");
    const blackoutPlayersValue = document.getElementById("profile-modal-blackout-players");
    try {
      const rawBlackoutSources = isBlackoutLikeScenario()
        ? buildBlackoutPlayerSourcesSnapshot(window.Empire.districts, resolveActiveScenarioOwnerName())
        : null;
      const rememberedSources = getLastValidBlackoutSources();
      const liveBlackoutSources = hasMeaningfulBlackoutSources(rawBlackoutSources)
        ? rawBlackoutSources
        : rememberedSources || rawBlackoutSources;
      if (hasMeaningfulBlackoutSources(rawBlackoutSources)) {
        setLastValidBlackoutSources(rawBlackoutSources);
      }
      const blackoutSources = liveBlackoutSources || (profile.sources && typeof profile.sources === "object" ? profile.sources : null);
      const districtMinuteIncome = blackoutSources?.districtIncomePerMinute || {};
      const buildingMinuteIncome = blackoutSources?.buildingIncomePerMinute || {};
      const showBlackoutSource =
        isBlackoutLikeScenario()
        && blackoutSources
        && typeof blackoutSources === "object";
      if (blackoutSourceRow) blackoutSourceRow.classList.toggle("hidden", !showBlackoutSource);
      if (blackoutPlayersRow) blackoutPlayersRow.classList.toggle("hidden", !showBlackoutSource);
      if (blackoutSourceValue && showBlackoutSource) {
        const districtCleanPerHour = Number(districtMinuteIncome.clean || 0) * 60;
        const districtDirtyPerHour = Number(districtMinuteIncome.dirty || 0) * 60;
        const districtInfluencePerHour = Number(blackoutSources?.districtInfluencePerMinute || 0) * 60;
        const buildingCleanPerHour = Number(buildingMinuteIncome.clean || 0) * 60;
        const buildingDirtyPerHour = Number(buildingMinuteIncome.dirty || 0) * 60;
        const buildingInfluencePerHour = Number(blackoutSources?.buildingInfluencePerMinute?.total || 0) * 60;
        const buildingHeatPerDay = Number(blackoutSources?.buildingHeatPerMinute?.total || 0) * 1440;
        blackoutSourceValue.textContent =
          `Districts C${formatDecimalValue(districtCleanPerHour, 2)}/D${formatDecimalValue(districtDirtyPerHour, 2)} / hod`
          + ` • Buildings C${formatDecimalValue(buildingCleanPerHour, 2)}/D${formatDecimalValue(buildingDirtyPerHour, 2)} / hod`
          + ` • Vliv ${formatDecimalValue(districtInfluencePerHour + buildingInfluencePerHour, 2)} / hod`
          + ` • Heat ${formatDecimalValue(buildingHeatPerDay, 2)} / den`;
      }
      if (blackoutPlayersValue && showBlackoutSource) {
        const playersLabel = collectBlackoutMapPlayerSummaries()
          .map((entry) => `${entry.name} (${entry.districtCount})`)
          .join(", ");
        blackoutPlayersValue.textContent = playersLabel || "-";
      }
      if (liveBlackoutSources && profile && typeof profile === "object") {
        profile.sources = liveBlackoutSources;
        profile.source = liveBlackoutSources;
      }
    } catch (error) {
      console.error("Profile blackout source render failed", error);
      if (blackoutSourceRow) blackoutSourceRow.classList.add("hidden");
      if (blackoutPlayersRow) blackoutPlayersRow.classList.add("hidden");
    }
    const profileHasMoneyData =
      profile.cleanMoney !== undefined ||
      profile.clean_money !== undefined ||
      profile.dirtyMoney !== undefined ||
      profile.dirty_money !== undefined ||
      profile.money !== undefined ||
      profile.balance !== undefined;
    const modalMoney = profileHasMoneyData ? moneyFromProfile : moneyFromEconomy;
    setText("profile-modal-clean-money", `$${modalMoney.cleanMoney}`);
    setText("profile-modal-dirty-money", `$${modalMoney.dirtyMoney}`);
    refreshGangColorDisplays();
  }

  function showProfileModal() {
    const root = document.getElementById("profile-modal");
    if (!root) return;
    const liveProfile = window.Empire.player || getCachedProfile();
    if (liveProfile && typeof liveProfile === "object") {
      try {
        hydrateProfileModal(liveProfile);
      } catch (error) {
        console.error("Profile modal hydrate failed", error);
      }
    }
    root.classList.remove("hidden");
  }

  function initProfileModal() {
    const root = document.getElementById("profile-modal");
    const backdrop = document.getElementById("profile-modal-backdrop");
    const closeBtn = document.getElementById("profile-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  return {
    hydrateProfileModal,
    showProfileModal,
    initProfileModal
  };
};
