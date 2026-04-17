window.Empire = window.Empire || {};
window.Empire.UIModals = window.Empire.UIModals || {};

window.Empire.UIModals.createDistrictActionsController = function createDistrictActionsController(deps = {}) {
  const state = {
    spyConfirmModalState: { districtId: null },
    raidConfirmModalState: { districtId: null },
    occupyConfirmModalState: { districtId: null },
    trapConfirmModalState: { districtId: null }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function closeSpyConfirmModal() {
    const root = byId("spy-confirm-modal");
    if (root) root.classList.add("hidden");
    state.spyConfirmModalState = { districtId: null };
  }

  function closeRaidConfirmModal() {
    const root = byId("raid-confirm-modal");
    if (root) root.classList.add("hidden");
    state.raidConfirmModalState = { districtId: null };
  }

  function renderSpyConfirmModal() {
    const root = byId("spy-confirm-modal");
    const districtEl = byId("spy-confirm-modal-district");
    const countEl = byId("spy-confirm-modal-count");
    const noteEl = byId("spy-confirm-modal-note");
    const confirmBtn = byId("spy-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !countEl || !noteEl || !confirmBtn) return;

    const district = deps.resolveDistrictById(state.spyConfirmModalState.districtId);
    deps.processSpyRecoveryQueue({ notify: true });
    const availableSpies = deps.getSpyCount();
    const availability = deps.evaluateDistrictActionAvailability(district, "spy");
    const demoMode = deps.scenarioVisionEnabled() && !deps.hasToken();
    countEl.textContent = String(availableSpies);
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;

    let noteText = "Každé špehování spotřebuje 1 špeha.";
    let canConfirm = true;

    if (!district) {
      noteText = "Nejprve vyber distrikt.";
      canConfirm = false;
    } else if (!availability.allowed) {
      noteText = availability.reason;
      canConfirm = false;
    } else if (availableSpies <= 0) {
      noteText = "Nemáš žádné dostupné špehy.";
      canConfirm = false;
    } else {
      const durationMs = deps.resolveOnboardingActionDurationMs(deps.spyActionDurationMs);
      noteText = `Akce potrvá ${Math.floor(durationMs / 1000)}s. Po ${Math.floor(deps.spyRecoveryCooldownMs / 1000)}s se 1 špeh vrátí zpět.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openSpyConfirmModal(district) {
    const root = byId("spy-confirm-modal");
    if (!root) return;
    state.spyConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderSpyConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:spy-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
  }

  function renderRaidConfirmModal() {
    const root = byId("raid-confirm-modal");
    const districtEl = byId("raid-confirm-modal-district");
    const durationEl = byId("raid-confirm-modal-duration");
    const noteEl = byId("raid-confirm-modal-note");
    const confirmBtn = byId("raid-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !durationEl || !noteEl || !confirmBtn) return;

    const district = deps.resolveDistrictById(state.raidConfirmModalState.districtId);
    const availability = deps.evaluateDistrictActionAvailability(district, "raid");
    const durationMs = deps.resolveRaidDurationWithBoosts();
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    durationEl.textContent = deps.formatAttackDurationLabel(durationMs);

    let noteText = "Opravdu chceš spustit krádež tohoto distriktu?";
    let canConfirm = true;
    if (!district) {
      noteText = "Nejprve vyber distrikt.";
      canConfirm = false;
    } else if (!availability.allowed) {
      noteText = availability.reason;
      canConfirm = false;
    } else if (deps.isRaidActionRunning()) {
      noteText = "Krádež už právě probíhá. Současně může běžet jen jedna.";
      canConfirm = false;
    } else {
      const cooldownMs = deps.getRaidCooldownRemainingMs();
      if (cooldownMs > 0) {
        noteText = `Krádež je na cooldownu ještě ${deps.formatRaidCooldownLabel(cooldownMs)}.`;
        canConfirm = false;
      } else {
        noteText = `Akce potrvá ${deps.formatAttackDurationLabel(durationMs)}. Po dokončení se district zamkne na 2h pro další krádež.`;
      }
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openRaidConfirmModal(district) {
    const root = byId("raid-confirm-modal");
    if (!root) return;
    state.raidConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderRaidConfirmModal();
  }

  async function startRaidActionFromModal() {
    const district = deps.resolveDistrictById(state.raidConfirmModalState.districtId);
    const noteEl = byId("raid-confirm-modal-note");
    const confirmBtn = byId("raid-confirm-modal-confirm");
    if (!district) {
      renderRaidConfirmModal();
      return;
    }
    const availability = deps.evaluateDistrictActionAvailability(district, "raid");
    if (!availability.allowed) {
      deps.pushEvent(availability.reason);
      renderRaidConfirmModal();
      return;
    }
    if (deps.isRaidActionRunning()) {
      deps.pushEvent("Krádež už právě probíhá. Současně může běžet jen jedna.");
      renderRaidConfirmModal();
      return;
    }
    const cooldownMs = deps.getRaidCooldownRemainingMs();
    if (cooldownMs > 0) {
      deps.pushEvent(`Krádež je na cooldownu ještě ${deps.formatRaidCooldownLabel(cooldownMs)}.`);
      renderRaidConfirmModal();
      return;
    }

    const demoMode = deps.scenarioVisionEnabled() && !deps.hasToken();
    if (demoMode || !deps.hasToken()) {
      closeRaidConfirmModal();
      deps.startRaidAction(district);
      deps.showActionConfirmPopup({
        tone: "raid",
        title: "KRÁDEŽ POTVRZENA",
        subtitle: district?.name || `Distrikt #${district?.id ?? "-"}`
      });
      return;
    }

    if (confirmBtn) confirmBtn.disabled = true;
    if (noteEl) noteEl.textContent = "Po potvrzení se krádež spouští...";
    try {
      const result = await deps.raidDistrictApi(district.id);
      if (result?.error) {
        const errorMessage = result.error === "cooldown" && Number(result?.cooldownMs || 0) > 0
          ? `Krádež je na cooldownu ještě ${deps.formatRaidCooldownLabel(Number(result.cooldownMs || 0))}.`
          : (result.error === "district_locked" && Number(result?.districtLockMs || 0) > 0
            ? `Distrikt je po krádeži zamčený ještě ${deps.formatAttackDurationLabel(Number(result.districtLockMs || 0))}.`
            : deps.formatRaidError(result.error));
        if (noteEl) noteEl.textContent = errorMessage;
        if (confirmBtn) confirmBtn.disabled = false;
        deps.pushEvent(errorMessage);
        return;
      }

      closeRaidConfirmModal();
      deps.startRaidActionFromServerResult(district, result);
      deps.showActionConfirmPopup({
        tone: "raid",
        title: "KRÁDEŽ POTVRZENA",
        subtitle: district?.name || `Distrikt #${district?.id ?? "-"}`
      });
    } catch (error) {
      const message = error?.message || "Krádež se nepodařilo spustit.";
      if (noteEl) noteEl.textContent = message;
      if (confirmBtn) confirmBtn.disabled = false;
      deps.pushEvent(message);
    }
  }

  function initRaidConfirmModal() {
    if (deps.bindConfirmModal) {
      deps.bindConfirmModal({
        rootId: "raid-confirm-modal",
        backdropId: "raid-confirm-modal-backdrop",
        closeId: "raid-confirm-modal-close",
        cancelId: "raid-confirm-modal-cancel",
        confirmId: "raid-confirm-modal-confirm",
        onClose: closeRaidConfirmModal,
        onConfirm: startRaidActionFromModal
      });
      return;
    }
  }

  function startSpyActionFromModal() {
    const district = deps.resolveDistrictById(state.spyConfirmModalState.districtId);
    if (!district) {
      renderSpyConfirmModal();
      return;
    }

    const availability = deps.evaluateDistrictActionAvailability(district, "spy");
    if (!availability.allowed) {
      deps.pushEvent(availability.reason);
      renderSpyConfirmModal();
      return;
    }
    const demoMode = deps.scenarioVisionEnabled() && !deps.hasToken();
    deps.processSpyRecoveryQueue({ notify: true });
    if (!deps.consumeSpyAgents(1)) {
      deps.pushEvent("Nemáš žádné dostupné špehy.");
      renderSpyConfirmModal();
      return;
    }

    const durationMs = deps.resolveOnboardingActionDurationMs(deps.spyActionDurationMs);
    deps.pushEvent(`Špehování distriktu ${district.name || `#${district.id}`} bylo zahájeno na ${Math.floor(durationMs / 1000)}s.`);
    window.Empire.Map?.markDistrictSpyAction?.(district.id, {
      durationMs,
      source: demoMode ? "scenario-spy" : "player-spy"
    });
    deps.recordVerifiedIntelEvent({ type: "spy_started", districtId: district.id });
    document.dispatchEvent(new CustomEvent("empire:spy-started", {
      detail: { districtId: district.id, district }
    }));
    deps.scheduleSpyActionResult(district.id);
    closeSpyConfirmModal();
    const districtModal = byId("district-modal");
    if (districtModal) districtModal.classList.add("hidden");
    deps.showActionConfirmPopup({
      tone: "spy",
      title: "ŠPEHOVÁNÍ POTVRZENO",
      subtitle: district?.name || `Distrikt #${district?.id ?? "-"}`
    });
  }

  function initSpyConfirmModal() {
    if (deps.bindConfirmModal) {
      deps.bindConfirmModal({
        rootId: "spy-confirm-modal",
        backdropId: "spy-confirm-modal-backdrop",
        closeId: "spy-confirm-modal-close",
        cancelId: "spy-confirm-modal-cancel",
        confirmId: "spy-confirm-modal-confirm",
        onClose: closeSpyConfirmModal,
        onConfirm: startSpyActionFromModal
      });
      return;
    }
  }

  function closeOccupyConfirmModal() {
    const root = byId("occupy-confirm-modal");
    if (root) root.classList.add("hidden");
    state.occupyConfirmModalState = { districtId: null };
  }

  function renderOccupyConfirmModal() {
    const root = byId("occupy-confirm-modal");
    const districtEl = byId("occupy-confirm-modal-district");
    const availableEl = byId("occupy-confirm-modal-members-available");
    const requiredEl = byId("occupy-confirm-modal-members-required");
    const noteEl = byId("occupy-confirm-modal-note");
    const confirmBtn = byId("occupy-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !availableEl || !requiredEl || !noteEl || !confirmBtn) return;

    const district = deps.resolveDistrictById(state.occupyConfirmModalState.districtId);
    const spyIntel = deps.resolveCompleteSpyIntel(district?.id);
    const requiredMembers = deps.resolveOccupationRequiredMembers(district, spyIntel);
    const availableMembers = deps.countPlayerControlledPopulation(deps.getProfileSnapshot());
    const availability = deps.evaluateDistrictActionAvailability(district, "occupy");
    const demoMode = deps.scenarioVisionEnabled() && !deps.hasToken();

    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    availableEl.textContent = String(availableMembers);
    requiredEl.textContent = String(requiredMembers);

    let canConfirm = true;
    const durationMs = deps.resolveOnboardingActionDurationMs(deps.occupyActionDurationMs);
    let noteText = `Akce potrvá ${Math.floor(durationMs / 1000)}s.`;
    if (!district) {
      canConfirm = false;
      noteText = "Nejprve vyber distrikt.";
    } else if (!availability.allowed) {
      canConfirm = false;
      noteText = availability.reason;
    } else if (!deps.hasToken() && !demoMode) {
      canConfirm = false;
      noteText = "Pro obsazení je nutné přihlášení.";
    } else if (availableMembers < requiredMembers) {
      canConfirm = false;
      noteText = `Na obsazení chybí ${requiredMembers - availableMembers} členů gangu.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openOccupyConfirmModal(district) {
    const root = byId("occupy-confirm-modal");
    if (!root) return;
    state.occupyConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderOccupyConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:occupy-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
  }

  function startOccupyActionFromModal() {
    const district = deps.resolveDistrictById(state.occupyConfirmModalState.districtId);
    if (!district) {
      renderOccupyConfirmModal();
      return;
    }

    const availability = deps.evaluateDistrictActionAvailability(district, "occupy");
    if (!availability.allowed) {
      deps.pushEvent(availability.reason);
      renderOccupyConfirmModal();
      return;
    }

    const demoMode = deps.scenarioVisionEnabled() && !deps.hasToken();
    if (!deps.hasToken() && !demoMode) {
      deps.pushEvent("Pro obsazení je nutné přihlášení.");
      renderOccupyConfirmModal();
      return;
    }

    const requiredMembers = deps.resolveOccupationRequiredMembers(district, deps.resolveCompleteSpyIntel(district.id));
    const availableMembers = deps.countPlayerControlledPopulation(deps.getProfileSnapshot());
    if (availableMembers < requiredMembers) {
      deps.pushEvent(`Na obsazení chybí ${requiredMembers - availableMembers} členů gangu.`);
      renderOccupyConfirmModal();
      return;
    }

    deps.consumeGangMembers(requiredMembers);
    const durationMs = deps.resolveOnboardingActionDurationMs(deps.occupyActionDurationMs);
    window.Empire.Map?.markDistrictUnderAttack?.(district.id, {
      durationMs,
      source: demoMode ? "scenario-occupy" : "player-occupy"
    });
    deps.pushEvent(`Obsazení distriktu ${district.name || `#${district.id}`} bylo zahájeno na ${Math.floor(durationMs / 1000)}s.`);
    document.dispatchEvent(new CustomEvent("empire:occupy-started", {
      detail: { districtId: district.id, district, requiredMembers }
    }));
    deps.scheduleOccupationActionResult(district.id, requiredMembers);
    closeOccupyConfirmModal();
    const districtModal = byId("district-modal");
    if (districtModal) districtModal.classList.add("hidden");
  }

  function initOccupyConfirmModal() {
    if (deps.bindConfirmModal) {
      deps.bindConfirmModal({
        rootId: "occupy-confirm-modal",
        backdropId: "occupy-confirm-modal-backdrop",
        closeId: "occupy-confirm-modal-close",
        cancelId: "occupy-confirm-modal-cancel",
        confirmId: "occupy-confirm-modal-confirm",
        onClose: closeOccupyConfirmModal,
        onConfirm: startOccupyActionFromModal
      });
      return;
    }
  }

  function closeTrapConfirmModal() {
    const root = byId("trap-confirm-modal");
    if (root) root.classList.add("hidden");
    state.trapConfirmModalState = { districtId: null };
  }

  function renderTrapConfirmModal() {
    const root = byId("trap-confirm-modal");
    const districtEl = byId("trap-confirm-modal-district");
    const cooldownEl = byId("trap-confirm-modal-cooldown");
    const noteEl = byId("trap-confirm-modal-note");
    const confirmBtn = byId("trap-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !cooldownEl || !noteEl || !confirmBtn) return;

    const district = deps.resolveDistrictById(state.trapConfirmModalState.districtId);
    const trapState = deps.getDistrictTrapControlState(district);
    const currentPlacement = deps.getCurrentPlayerTrapPlacement();
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    cooldownEl.textContent = `${Math.floor(deps.trapMoveCooldownMs / 1000)}s`;

    let canConfirm = true;
    let noteText = "Opravdu chceš vložit past do tohoto districtu? Po nastražení ji nebude možné 20s přesunout.";
    if (!district) {
      canConfirm = false;
      noteText = "Nejprve vyber distrikt.";
    } else if (!deps.isDistrictDefendableByPlayer(district)) {
      canConfirm = false;
      noteText = "Past lze nastražit jen do vlastního nebo aliančního districtu.";
    } else if (deps.isDistrictDestroyed(district)) {
      canConfirm = false;
      noteText = "Do zničeného districtu nelze nastražit past.";
    } else if (trapState?.isActiveHere) {
      canConfirm = false;
      noteText = trapState.moveLocked
        ? `Past už v tomto districtu běží. Přesun bude možný za ${trapState.countdownLabel}.`
        : "Past už je v tomto districtu aktivní.";
    } else if (trapState?.moveLocked) {
      canConfirm = false;
      noteText = `Past je zamčená v ${currentPlacement?.districtName || `distriktu #${currentPlacement?.districtId ?? "-"}`}. Přesun bude možný za ${trapState.countdownLabel}.`;
    } else if (trapState?.hasTrapElsewhere) {
      noteText = `Přesuneš svou jedinou past z ${currentPlacement?.districtName || `distriktu #${currentPlacement?.districtId ?? "-"}`} do tohoto districtu. Po potvrzení poběží nový cooldown 20s.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openTrapConfirmModal(district) {
    const root = byId("trap-confirm-modal");
    if (!root) return;
    state.trapConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderTrapConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:trap-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
  }

  function placeTrapFromModal() {
    const district = deps.resolveDistrictById(state.trapConfirmModalState.districtId);
    if (!district) {
      renderTrapConfirmModal();
      return;
    }
    if (!deps.isDistrictDefendableByPlayer(district)) {
      deps.pushEvent("Past lze nastražit jen do vlastního nebo aliančního districtu.");
      renderTrapConfirmModal();
      return;
    }
    if (deps.isDistrictDestroyed(district)) {
      deps.pushEvent("Do zničeného districtu nelze nastražit past.");
      renderTrapConfirmModal();
      return;
    }
    const result = deps.setCurrentPlayerTrapDistrict(district);
    if (!result?.ok) {
      if (result?.reason === "move_locked") {
        deps.pushEvent(`Past nelze přesunout ještě ${deps.formatTrapMoveCooldownLabel(result.moveCooldownRemainingMs)}.`);
      } else {
        deps.pushEvent("Past se nepodařilo nastražit.");
      }
      renderTrapConfirmModal();
      return;
    }
    const districtLabel = district?.name || `Distrikt #${district?.id ?? "-"}`;
    deps.pushEvent(
      result.moved
        ? `Past přesunuta do districtu ${districtLabel}. Přesun bude znovu možný za 20s.`
        : `Past nastražena do districtu ${districtLabel}. Přesun bude znovu možný za 20s.`
    );
    deps.showActionConfirmPopup({
      tone: "trap",
      title: result.moved ? "PAST PŘESUNUTA" : "PAST POTVRZENA",
      subtitle: districtLabel
    });
    document.dispatchEvent(new CustomEvent("empire:trap-placed", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null,
        moved: Boolean(result.moved)
      }
    }));
    closeTrapConfirmModal();
    window.Empire.Map?.closeSelectedDistrictModal?.();
  }

  function initTrapConfirmModal() {
    if (deps.bindConfirmModal) {
      deps.bindConfirmModal({
        rootId: "trap-confirm-modal",
        backdropId: "trap-confirm-modal-backdrop",
        closeId: "trap-confirm-modal-close",
        cancelId: "trap-confirm-modal-cancel",
        confirmId: "trap-confirm-modal-confirm",
        onClose: closeTrapConfirmModal,
        onConfirm: placeTrapFromModal
      });
      return;
    }
  }

  return {
    closeSpyConfirmModal,
    closeRaidConfirmModal,
    renderSpyConfirmModal,
    openSpyConfirmModal,
    renderRaidConfirmModal,
    openRaidConfirmModal,
    startRaidActionFromModal,
    initRaidConfirmModal,
    startSpyActionFromModal,
    initSpyConfirmModal,
    closeOccupyConfirmModal,
    renderOccupyConfirmModal,
    openOccupyConfirmModal,
    startOccupyActionFromModal,
    initOccupyConfirmModal,
    closeTrapConfirmModal,
    renderTrapConfirmModal,
    openTrapConfirmModal,
    placeTrapFromModal,
    initTrapConfirmModal
  };
};
