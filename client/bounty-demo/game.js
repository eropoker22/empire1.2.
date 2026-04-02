(function () {
  "use strict";

  const { createDemoState, HUNT_MODE_THRESHOLD, BOUNTY_TYPES } = window.EmpireBountyDemoData;
  const { createBountyService, calculateBountyTotalValue, isHuntModeActive } = window.EmpireBountySystem;
  const { createDistrictMap } = window.EmpireBountyMap;

  const state = createDemoState();
  const elements = {};
  let bountyService;
  let districtMap;
  let selectedTargetId = null;

  function getPlayerById(playerId) {
    return state.players.find((player) => player.id === playerId) || null;
  }

  function getCurrentPlayer() {
    return getPlayerById(state.currentPlayerId);
  }

  function getDistrictCountForPlayer(playerId) {
    return state.districts.filter((district) => district.ownerPlayerId === playerId).length;
  }

  function pushFeedMessage(text) {
    state.feed.unshift({
      id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: String(text || ""),
      createdAt: Date.now()
    });
    state.feed = state.feed.slice(0, 18);
    renderFeed();
  }

  function formatCurrency(value) {
    return `$${Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("cs-CZ")}`;
  }

  function formatBountyTypeLabel(bountyType) {
    if (bountyType === BOUNTY_TYPES.CAPTURE_DISTRICT) return "Za obsazení districtu";
    if (bountyType === BOUNTY_TYPES.SUCCESSFUL_ATTACK) return "Za úspěšný útok";
    if (bountyType === BOUNTY_TYPES.DESTROY_UNITS) return "Za zničení jednotek";
    return bountyType;
  }

  function resolveThreatLabel(threatLevel) {
    if (threatLevel >= 85) return { label: "EXTREME", tone: "extreme" };
    if (threatLevel >= 70) return { label: "HIGH", tone: "high" };
    if (threatLevel >= 45) return { label: "MEDIUM", tone: "medium" };
    return { label: "LOW", tone: "low" };
  }

  function resetModalForm() {
    elements.rewardCash.value = "0";
    elements.rewardDrugs.value = "0";
    elements.rewardMaterials.value = "0";
    elements.bountyAnonymous.checked = true;
    elements.bountyTypeInputs[0].checked = true;
    elements.bountyDurationInputs[1].checked = true;
  }

  function closeModal() {
    elements.bountyModal.classList.add("hidden");
    elements.bountyModal.setAttribute("aria-hidden", "true");
    selectedTargetId = null;
    resetModalForm();
  }

  function openBountyModal(targetPlayerId) {
    selectedTargetId = targetPlayerId;
    syncModal();
    elements.bountyModal.classList.remove("hidden");
    elements.bountyModal.setAttribute("aria-hidden", "false");
  }

  function getSelectedBountyType() {
    const selected = elements.bountyTypeInputs.find((input) => input.checked);
    return String(selected ? selected.value : BOUNTY_TYPES.CAPTURE_DISTRICT);
  }

  function getSelectedDurationHours() {
    const selected = elements.bountyDurationInputs.find((input) => input.checked);
    return Math.max(1, Math.floor(Number(selected ? selected.value : 12)));
  }

  function syncModal() {
    const currentPlayer = getCurrentPlayer();
    const targetPlayer = getPlayerById(selectedTargetId);
    if (!currentPlayer || !targetPlayer) return;

    const threat = resolveThreatLabel(targetPlayer.threatLevel);
    elements.targetAvatar.textContent = targetPlayer.avatarLabel;
    elements.targetName.textContent = targetPlayer.name;
    elements.targetAlliance.textContent = `[${targetPlayer.allianceTag}]`;
    elements.targetDistrictCount.textContent = `Districtů: ${getDistrictCountForPlayer(targetPlayer.id)}`;
    elements.targetLastActivity.textContent = `Poslední aktivita: ${targetPlayer.lastActivity}`;
    elements.targetThreatLevel.textContent = threat.label;
    elements.targetThreatLevel.dataset.tone = threat.tone;

    elements.rewardCashAvailable.textContent = `Máš: ${formatCurrency(currentPlayer.resources.cash)}`;
    elements.rewardDrugsAvailable.textContent = `Máš: ${currentPlayer.resources.drugs} ks`;
    elements.rewardMaterialsAvailable.textContent = `Máš: ${currentPlayer.resources.materials} ks`;

    const rewardCash = Math.max(0, Math.floor(Number(elements.rewardCash.value || 0)));
    const rewardDrugs = Math.max(0, Math.floor(Number(elements.rewardDrugs.value || 0)));
    const rewardMaterials = Math.max(0, Math.floor(Number(elements.rewardMaterials.value || 0)));
    const totalValue = calculateBountyTotalValue(rewardCash, rewardDrugs, rewardMaterials);
    const huntModeActive = isHuntModeActive(totalValue);

    elements.previewTargetName.textContent = targetPlayer.name;
    elements.previewTotalValue.textContent = formatCurrency(totalValue);
    elements.previewType.textContent = formatBountyTypeLabel(getSelectedBountyType());
    elements.previewDuration.textContent = `${getSelectedDurationHours()}h`;
    elements.previewAuthor.textContent = elements.bountyAnonymous.checked ? "Anonymní" : currentPlayer.name;

    if (huntModeActive) {
      elements.huntModeState.textContent = "HUNT MODE AKTIVNÍ";
      elements.huntModeBar.style.width = "100%";
      elements.huntModeLabel.textContent = "Celé město vidí extrémně cenný cíl.";
    } else {
      const progress = Math.min(100, Math.round((totalValue / HUNT_MODE_THRESHOLD) * 100));
      elements.huntModeState.textContent = "Hunt mode se plní";
      elements.huntModeBar.style.width = `${progress}%`;
      elements.huntModeLabel.textContent = `Do HUNT MODE zbývá ${formatCurrency(HUNT_MODE_THRESHOLD - totalValue)}.`;
    }
  }

  function renderPlayers() {
    const currentPlayer = getCurrentPlayer();
    elements.currentPlayerBadge.textContent = `Jsi: ${currentPlayer.name}`;

    elements.playerList.innerHTML = state.players.map((player) => {
      const isCurrent = player.id === state.currentPlayerId;
      return `
        <article class="player-card ${isCurrent ? "player-card--current" : ""}">
          <div class="player-card__avatar">${player.avatarLabel}</div>
          <div class="player-card__body">
            <div class="player-card__top">
              <strong>${player.name}</strong>
              <span class="alliance-tag">[${player.allianceTag}]</span>
            </div>
            <div class="player-card__meta">Districtů: ${getDistrictCountForPlayer(player.id)} • Threat: ${player.threatLevel}</div>
            <div class="player-card__meta">Cash ${formatCurrency(player.resources.cash)} • Drogy ${player.resources.drugs} • Materiály ${player.resources.materials}</div>
            <div class="player-card__meta">${player.lastActivity}</div>
          </div>
          <div class="player-card__actions">
            ${isCurrent ? '<span class="player-card__self">Aktuální hráč</span>' : `<button class="btn btn--danger" type="button" data-bounty-target="${player.id}">Vypsat bounty</button>`}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderFeed() {
    elements.eventFeed.innerHTML = state.feed.map((entry) => `
      <article class="feed-item">
        <div class="feed-item__time">${new Date(entry.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
        <div>${entry.text}</div>
      </article>
    `).join("");
  }

  function renderActiveBounties() {
    const activeBounties = state.bounties.filter((bounty) => bounty.status === "active");
    elements.activeBounties.innerHTML = activeBounties.length
      ? activeBounties.map((bounty) => {
          const target = getPlayerById(bounty.targetPlayerId);
          const issuer = getPlayerById(bounty.issuerPlayerId);
          return `
            <article class="bounty-card ${bounty.huntModeActive ? "bounty-card--hunt" : ""}">
              <div class="bounty-card__top">
                <div>
                  <div class="eyebrow">${bounty.huntModeActive ? "Hunt mode" : "Bounty"}</div>
                  <strong>${target ? target.name : "Unknown"}</strong>
                </div>
                <div class="bounty-card__value">${formatCurrency(bounty.totalValue)}</div>
              </div>
              <div class="bounty-card__meta">Typ: ${formatBountyTypeLabel(bounty.bountyType)}</div>
              <div class="bounty-card__meta">Issuer: ${bounty.isAnonymous ? "Anonymní" : (issuer ? issuer.name : "Unknown")}</div>
              <div class="bounty-card__meta">Expires: ${new Date(bounty.expiresAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}</div>
            </article>
          `;
        }).join("")
      : '<div class="empty-state">Zatím není vypsaná žádná bounty.</div>';
  }

  function syncSimulatorDistrictOptions() {
    const targetId = String(elements.simTarget.value || "");
    const targetDistricts = state.districts.filter((district) => district.ownerPlayerId === targetId);
    elements.simDistrict.innerHTML = targetDistricts.map((district) => `<option value="${district.id}">${district.name}</option>`).join("");
  }

  function renderSimulatorOptions() {
    const enemyPlayers = state.players.filter((player) => player.id !== state.currentPlayerId);
    elements.simAttacker.innerHTML = state.players.map((player) => `<option value="${player.id}">${player.name}</option>`).join("");
    elements.simTarget.innerHTML = enemyPlayers.map((player) => `<option value="${player.id}">${player.name}</option>`).join("");
    syncSimulatorDistrictOptions();
  }

  function renderAll() {
    bountyService.expireBounties();
    renderPlayers();
    renderActiveBounties();
    districtMap.renderDistricts(state);
    districtMap.applyBountyVisualsToMap(state);
    renderSimulatorOptions();
    if (!elements.bountyModal.classList.contains("hidden")) {
      syncModal();
    }
  }

  function handleCreateBounty() {
    const result = bountyService.createBounty({
      issuerPlayerId: state.currentPlayerId,
      targetPlayerId: selectedTargetId,
      isAnonymous: elements.bountyAnonymous.checked,
      rewardCash: Number(elements.rewardCash.value || 0),
      rewardDrugs: Number(elements.rewardDrugs.value || 0),
      rewardMaterials: Number(elements.rewardMaterials.value || 0),
      bountyType: getSelectedBountyType(),
      durationHours: getSelectedDurationHours()
    });

    if (!result.ok) {
      pushFeedMessage(result.error);
      return;
    }

    renderAll();
    closeModal();
  }

  function handleAttackSimulation(event) {
    event.preventDefault();
    const attackType = String(elements.simType.value || BOUNTY_TYPES.SUCCESSFUL_ATTACK);
    const attackResult = {
      attackerId: String(elements.simAttacker.value || ""),
      targetPlayerId: String(elements.simTarget.value || ""),
      bountyType: attackType,
      success: true,
      contributionValue: Math.max(1, Math.floor(Number(elements.simDamage.value || 0))),
      destroyedUnits: Math.max(0, Math.floor(Number(elements.simUnits.value || 0))),
      capturedDistrictId: attackType === BOUNTY_TYPES.CAPTURE_DISTRICT ? String(elements.simDistrict.value || "") : null,
      createdAt: Date.now()
    };

    const attacker = getPlayerById(attackResult.attackerId);
    const target = getPlayerById(attackResult.targetPlayerId);
    const resolution = bountyService.resolveBountyAfterAttack(attackResult);
    pushFeedMessage(`${attacker ? attacker.name : "Unknown"} provedl útok na ${target ? target.name : "Unknown"}.`);
    if (resolution.resolvedBounties.length) {
      pushFeedMessage(`Vyřešené bounty: ${resolution.resolvedBounties.length}.`);
    }
    renderAll();
  }

  function cacheDom() {
    elements.playerList = document.getElementById("player-list");
    elements.currentPlayerBadge = document.getElementById("current-player-badge");
    elements.activeBounties = document.getElementById("active-bounties");
    elements.eventFeed = document.getElementById("event-feed");
    elements.districtMap = document.getElementById("district-map");
    elements.attackSimulator = document.getElementById("attack-simulator");
    elements.simAttacker = document.getElementById("sim-attacker");
    elements.simTarget = document.getElementById("sim-target");
    elements.simType = document.getElementById("sim-type");
    elements.simDamage = document.getElementById("sim-damage");
    elements.simUnits = document.getElementById("sim-units");
    elements.simDistrict = document.getElementById("sim-district");
    elements.bountyModal = document.getElementById("bounty-modal");
    elements.rewardCash = document.getElementById("reward-cash");
    elements.rewardDrugs = document.getElementById("reward-drugs");
    elements.rewardMaterials = document.getElementById("reward-materials");
    elements.rewardCashAvailable = document.getElementById("reward-cash-available");
    elements.rewardDrugsAvailable = document.getElementById("reward-drugs-available");
    elements.rewardMaterialsAvailable = document.getElementById("reward-materials-available");
    elements.targetAvatar = document.getElementById("target-avatar");
    elements.targetName = document.getElementById("target-name");
    elements.targetAlliance = document.getElementById("target-alliance");
    elements.targetDistrictCount = document.getElementById("target-district-count");
    elements.targetLastActivity = document.getElementById("target-last-activity");
    elements.targetThreatLevel = document.getElementById("target-threat-level");
    elements.previewTargetName = document.getElementById("preview-target-name");
    elements.previewTotalValue = document.getElementById("preview-total-value");
    elements.previewType = document.getElementById("preview-type");
    elements.previewDuration = document.getElementById("preview-duration");
    elements.previewAuthor = document.getElementById("preview-author");
    elements.huntModeState = document.getElementById("hunt-mode-state");
    elements.huntModeBar = document.getElementById("hunt-mode-bar");
    elements.huntModeLabel = document.getElementById("hunt-mode-label");
    elements.bountyAnonymous = document.getElementById("bounty-anonymous");
    elements.bountyTypeInputs = Array.from(document.querySelectorAll('input[name="bounty-type"]'));
    elements.bountyDurationInputs = Array.from(document.querySelectorAll('input[name="bounty-duration"]'));
    elements.bountyCloseBtn = document.getElementById("bounty-close-btn");
    elements.bountyCancelBtn = document.getElementById("bounty-cancel-btn");
    elements.bountySubmitBtn = document.getElementById("bounty-submit-btn");
  }

  function bindEvents() {
    elements.playerList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-bounty-target]");
      if (!button) return;
      openBountyModal(String(button.getAttribute("data-bounty-target") || ""));
    });

    districtMap = createDistrictMap({
      container: elements.districtMap,
      onOpenBounty: openBountyModal
    });

    elements.bountyCloseBtn.addEventListener("click", closeModal);
    elements.bountyCancelBtn.addEventListener("click", closeModal);
    elements.bountyModal.addEventListener("click", (event) => {
      if (event.target && event.target.getAttribute("data-close-modal") === "true") {
        closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.bountyModal.classList.contains("hidden")) {
        closeModal();
      }
    });

    [elements.rewardCash, elements.rewardDrugs, elements.rewardMaterials, elements.bountyAnonymous].forEach((input) => {
      input.addEventListener("input", syncModal);
      input.addEventListener("change", syncModal);
    });
    elements.bountyTypeInputs.forEach((input) => input.addEventListener("change", syncModal));
    elements.bountyDurationInputs.forEach((input) => input.addEventListener("change", syncModal));
    elements.bountySubmitBtn.addEventListener("click", handleCreateBounty);
    elements.simTarget.addEventListener("change", syncSimulatorDistrictOptions);
    elements.attackSimulator.addEventListener("submit", handleAttackSimulation);
  }

  function init() {
    cacheDom();
    bountyService = createBountyService({
      state,
      pushFeedMessage
    });
    bindEvents();
    pushFeedMessage("Demo bounty systém je připraven.");
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
