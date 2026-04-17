window.Empire = window.Empire || {};
window.Empire.UIPolice = window.Empire.UIPolice || {};

window.Empire.UIPolice.createHeatController = function createHeatController(deps = {}) {
  const {
    getCachedProfile = () => null,
    resolveWantedLevel = () => 0,
    resolveWantedStars = () => 1,
    formatDurationLabel = () => "0 s",
    buildPoliceRaidImpactKey = () => "",
    getPoliceRaidImpactMap = () => new Map(),
    resolveStoredPoliceRaidSpecialty = () => null,
    resolvePoliceRaidSpecialtyFromOperationType = () => null,
    resolvePoliceRaidSpecialty = () => ({ label: "-", icon: "" }),
    openPoliceActionResultModal = () => {},
    spendDirtyCash = () => ({ ok: false }),
    trySpendCleanCash = () => ({ ok: false }),
    setPlayerWantedHeat = () => 0,
    pushEvent = () => {},
    registerDirtyHeatReductionAndMaybeTriggerPolice = () => ({}),
    renderGangHeatModal = () => {},
    clearGangHeatJournal = () => {},
    closeGangHeatModal = () => {},
    GANG_HEAT_DIRTY_COST = 0,
    GANG_HEAT_DIRTY_REDUCTION = 0,
    GANG_HEAT_CLEAN_COST = 0,
    GANG_HEAT_CLEAN_REDUCTION = 0,
    GANG_HEAT_DIRTY_TRIGGER_COUNT = 0,
    POLICE_RAID_TIER1 = {},
    POLICE_RAID_TIER2 = {},
    POLICE_RAID_TIER3 = {},
    POLICE_RAID_TIER4 = {},
    POLICE_RAID_TIER5 = {},
    POLICE_RAID_TIER6 = {}
  } = deps;

  function getActiveOwnedPoliceRaidContext() {
    const snapshot = window.Empire.Map?.getPoliceActionSnapshot?.();
    if (!snapshot || !Array.isArray(snapshot.actions) || !snapshot.actions.length) return null;
    const nowMs = Math.max(0, Math.floor(Number(snapshot.now) || Date.now()));
    const impactMap = getPoliceRaidImpactMap();
    impactMap.forEach((value, key) => {
      if (!value || Number(value.expiresAt || 0) <= nowMs) impactMap.delete(key);
    });
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const actions = snapshot.actions.map((action) => {
      const districtId = Number(action?.districtId);
      if (!Number.isFinite(districtId)) return null;
      const district = districts.find((entry) => Number(entry?.id) === districtId);
      if (!district || !window.Empire.UI?.isDistrictOwnedByPlayer?.(district)) return null;
      return { ...action, district };
    }).filter(Boolean);
    if (!actions.length) return null;
    actions.sort((a, b) => Number(b.remainingMs || 0) - Number(a.remainingMs || 0));
    return {
      action: actions[0],
      actions,
      activeCount: actions.length,
      incomePenaltyPct: Math.max(0, Math.floor(Number(snapshot.incomePenaltyPct || 0)))
    };
  }

  function openGangHeatPanelOrRaidImpactModal() {
    const raidContext = getActiveOwnedPoliceRaidContext();
    if (!raidContext) {
      window.Empire.UI?.openGangHeatModal?.();
      return;
    }
    const wantedHeat = resolveWantedLevel(getCachedProfile() || window.Empire.player || {});
    const wantedTier = resolveWantedStars(wantedHeat);
    const district = raidContext.action?.district || null;
    const districtName = String(district?.name || "").trim() || `District #${raidContext.action?.districtId || "-"}`;
    const remainingMs = Math.max(0, Math.floor(Number(raidContext.action?.remainingMs || 0)));
    const activeCount = Math.max(1, Math.floor(Number(raidContext.activeCount || 1)));
    const affectedLabel = activeCount === 1 ? "1 district" : `${activeCount} districty`;
    const impactKey = buildPoliceRaidImpactKey(raidContext.action || {});
    const impact = impactKey ? getPoliceRaidImpactMap().get(impactKey) : null;
    const tier = Math.max(1, Math.floor(Number(impact?.tier || wantedTier)));
    const specialty =
      resolveStoredPoliceRaidSpecialty(raidContext?.action || {})
      || resolveStoredPoliceRaidSpecialty(impact || {})
      || resolvePoliceRaidSpecialtyFromOperationType(raidContext?.action?.operationType, impact)
      || resolvePoliceRaidSpecialty(tier, impact || {});
    const incomePenaltyPct = Math.max(0, Math.floor(Number(impact?.incomePenaltyPct || raidContext.incomePenaltyPct || POLICE_RAID_TIER1.incomePenaltyPct)));
    const tierRows = tier === 1
      ? [
        { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER1.cleanConfiscationPct)))}%)` },
        { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER1.dirtyConfiscationPctMin)))}%)` },
        { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER1.arrestsPct)))}%)` },
        { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER1.influencePenaltyPct)))}%)` },
        { label: "Špehování", value: "ZAKÁZÁNO" }
      ]
      : [{ label: "Tier", value: `Stupeň ${tier}` }];
    const toneClass = tier >= 6 ? "is-tier-6" : tier === 5 ? "is-tier-5" : tier === 4 ? "is-tier-4" : tier === 3 ? "is-tier-3" : tier === 2 ? "is-tier-2" : "is-tier-1";
    openPoliceActionResultModal({
      title: "Dopady razie",
      badge: `Razia aktivní • ${specialty.label} • Stupeň ${wantedTier}/6 • Tier ${tier}`,
      tone: toneClass,
      summary: "",
      rows: [
        { label: "Zasažený district", value: districtName },
        { label: "Aktivně zasaženo", value: affectedLabel },
        { label: "Typ razie", value: `${specialty.icon} ${specialty.label}` },
        { label: "Snížení income", value: `-${incomePenaltyPct}% (1h)` },
        ...tierRows,
        { label: "Zbývající čas", value: formatDurationLabel(remainingMs) }
      ]
    });
  }

  function handleGangHeatReduction(mode) {
    const currentHeat = resolveWantedLevel(getCachedProfile() || window.Empire.player || {});
    if (mode === "dirty") {
      const spendResult = spendDirtyCash(GANG_HEAT_DIRTY_COST);
      if (!spendResult.ok) {
        pushEvent("Nemáš dost špinavých peněz na snížení heatu.");
        renderGangHeatModal();
        return;
      }
      const nextHeat = Math.max(0, currentHeat - GANG_HEAT_DIRTY_REDUCTION);
      setPlayerWantedHeat(nextHeat, "Uplacení tlaku špinavými penězi", "fall");
      pushEvent(`Heat snížen o ${GANG_HEAT_DIRTY_REDUCTION} za $${GANG_HEAT_DIRTY_COST} dirty.`);
      const reductionState = registerDirtyHeatReductionAndMaybeTriggerPolice();
      document.dispatchEvent(new CustomEvent("empire:gang-heat-dirty-reduced", {
        detail: {
          count: Math.max(0, Number(reductionState?.count || 0)),
          required: GANG_HEAT_DIRTY_TRIGGER_COUNT,
          triggered: Boolean(reductionState?.triggered),
          districtId: reductionState?.districtId ?? null
        }
      }));
      renderGangHeatModal();
      return;
    }
    const spendResult = trySpendCleanCash(GANG_HEAT_CLEAN_COST);
    if (!spendResult.ok) {
      pushEvent("Nemáš dost čistých peněz na snížení heatu.");
      renderGangHeatModal();
      return;
    }
    const nextHeat = Math.max(0, currentHeat - GANG_HEAT_CLEAN_REDUCTION);
    setPlayerWantedHeat(nextHeat, "Legální krytí a zahlazení stop", "fall");
    pushEvent(`Heat snížen o ${GANG_HEAT_CLEAN_REDUCTION} za $${GANG_HEAT_CLEAN_COST} clean.`);
    renderGangHeatModal();
  }

  function initGangHeatModal() {
    const trigger = document.getElementById("profile-heat-panel");
    const root = document.getElementById("gang-heat-modal");
    const backdrop = document.getElementById("gang-heat-modal-backdrop");
    const closeBtn = document.getElementById("gang-heat-modal-close");
    const dirtyBtn = document.getElementById("gang-heat-dirty-btn");
    const cleanBtn = document.getElementById("gang-heat-clean-btn");
    const clearLogBtn = document.getElementById("gang-heat-clear-log-btn");
    if (trigger) {
      trigger.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("empire:wanted-row-clicked", { detail: { source: "click" } }));
        openGangHeatPanelOrRaidImpactModal();
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("empire:wanted-row-clicked", { detail: { source: event.key === " " ? "space" : "enter" } }));
        openGangHeatPanelOrRaidImpactModal();
      });
    }
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeGangHeatModal);
    if (closeBtn) closeBtn.addEventListener("click", closeGangHeatModal);
    if (dirtyBtn) dirtyBtn.addEventListener("click", () => handleGangHeatReduction("dirty"));
    if (cleanBtn) cleanBtn.addEventListener("click", () => handleGangHeatReduction("clean"));
    if (clearLogBtn) clearLogBtn.addEventListener("click", () => {
      clearGangHeatJournal();
      renderGangHeatModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) closeGangHeatModal();
    });
  }

  return {
    getActiveOwnedPoliceRaidContext,
    openGangHeatPanelOrRaidImpactModal,
    handleGangHeatReduction,
    initGangHeatModal
  };
};
