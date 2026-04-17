window.Empire = window.Empire || {};
window.Empire.UICombat = window.Empire.UICombat || {};

window.Empire.UICombat.createModalController = function createModalController(deps = {}) {
  const {
    attackWeaponStats = [],
    defenseWeaponStats = [],
    getCachedProfile = () => null,
    getPlayer = () => window.Empire.player || {},
    countPlayerControlledPopulation = () => 0,
    resolveDistrictById = () => null,
    resolveWeaponCounts = () => ({}),
    getAttackWeaponTotal = () => 0,
    resolveDefenseCounts = () => ({}),
    getDefenseWeaponTotal = () => 0,
    resolveCombatWeaponAccess = () => ({ weapon: null }),
    getAttackTargetCooldownRemainingMs = () => 0,
    getActiveAttackCooldownRemainingMs = () => 0,
    formatAttackCooldownLabel = (ms) => String(ms || 0),
    resolveAttackWeaponSpecialText = () => "",
    resolveDefenseWeaponSpecialText = () => "",
    sanitizeDefenseSelection = (selection) => selection || {},
    getDistrictDefenseAssignmentForCurrentPlayer = () => null,
    saveDistrictDefenseAssignment = () => null,
    addGangMembers = () => {},
    consumeDefenseWeaponCounts = () => ({}),
    consumeGangMembers = () => {},
    pushEvent = () => {},
    refreshSelectedDistrictModal = () => {},
    getAttackResultDetails = () => ({}),
    getAttackDefensePowerEstimate = () => 0,
    openAttackConfirmModal = () => {},
    scenarioVisionEnabled = () => false,
    hasToken = () => Boolean(window.Empire.token)
  } = deps;

  let attackModalRefreshTimer = null;
  let lastAttackStepperInteractionAt = 0;
  let defenseModalRefreshTimer = null;
  let attackModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
  let defenseModalState = {
    districtId: null,
    message: "",
    selectedWeaponCounts: {},
    initialAssignmentSelection: {},
    hasInitialAssignment: false
  };

  function getAttackModalAvailability(district = null) {
    const counts = resolveWeaponCounts();
    const availableWeapons = getAttackWeaponTotal(counts);
    const actualMembers = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(getCachedProfile() || getPlayer() || {})) || 0));
    const weaponAccess = resolveCombatWeaponAccess("attack", actualMembers);
    const cooldownTargetOwner = String(district?.owner || "").trim().toLowerCase();
    const targetCooldownMs = getAttackTargetCooldownRemainingMs(cooldownTargetOwner);
    const activeAttackCooldownMs = getActiveAttackCooldownRemainingMs();
    return {
      availableWeapons,
      actualMembers,
      weaponCounts: counts,
      weaponAccess,
      unlockedWeapon: weaponAccess.weapon || null,
      cooldownMs: Math.max(targetCooldownMs, activeAttackCooldownMs)
    };
  }

  function getAttackSelectionSummary(availability, selectionCounts = attackModalState.selectedWeaponCounts || {}) {
    const actualMembers = Math.max(0, Math.floor(Number(availability?.actualMembers || 0)));
    const weaponCounts = availability?.weaponCounts || resolveWeaponCounts();
    const selection = attackWeaponStats.reduce((acc, item) => {
      const count = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      acc[item.name] = count;
      return acc;
    }, {});
    const totalUsedMembers = attackWeaponStats.reduce((sum, item) => {
      const count = Number(selection[item.name] || 0);
      return sum + (Number.isFinite(count) ? count * Number(item.requiredMembers || 0) : 0);
    }, 0);
    const remainingMembers = Math.max(0, actualMembers - totalUsedMembers);
    const remainingWeaponCounts = attackWeaponStats.reduce((acc, item) => {
      const stock = Math.max(0, Math.floor(Number(weaponCounts[item.name] || 0)));
      const selected = Math.max(0, Math.floor(Number(selection[item.name] || 0)));
      acc[item.name] = Math.max(0, stock - selected);
      return acc;
    }, {});
    return {
      actualMembers,
      remainingMembers,
      totalUsedMembers,
      weaponCounts,
      remainingWeaponCounts,
      selection
    };
  }

  function getAttackWeaponMaxCount(item, summary, availability) {
    const stock = Math.max(0, Math.floor(Number(summary?.weaponCounts?.[item.name] ?? availability?.weaponCounts?.[item.name] ?? 0)));
    const current = Math.max(0, Math.floor(Number(summary?.selection?.[item.name] || 0)));
    const otherUsedMembers = Math.max(0, Number(summary?.totalUsedMembers || 0) - current * Number(item.requiredMembers || 0));
    const remainingForThisWeapon = Math.max(0, Number(summary?.actualMembers || 0) - otherUsedMembers);
    const byMembers = Math.floor(remainingForThisWeapon / Math.max(1, Number(item.requiredMembers || 0)));
    return Math.max(0, Math.min(stock, byMembers));
  }

  function setAttackModalNote(message) {
    attackModalState.message = String(message || "");
    const note = document.getElementById("attack-modal-note");
    if (note) note.textContent = attackModalState.message;
  }

  function renderAttackWeaponButtons(container, availability) {
    if (!container) return;
    const summary = getAttackSelectionSummary(availability);
    const weaponCards = attackWeaponStats.map((item) => {
      const amount = Math.max(0, Math.floor(Number(summary.selection[item.name] || 0)));
      const stock = Math.max(0, Math.floor(Number(summary.remainingWeaponCounts[item.name] || 0)));
      const maxCount = getAttackWeaponMaxCount(item, summary, availability);
      const unlocked = stock > 0 && maxCount > 0;
      const specialText = String(resolveAttackWeaponSpecialText(item.name) || "").trim();
      return `
        <div class="attack-modal__weapon ${amount > 0 ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}">
          <div class="attack-modal__weapon-body">
            <span class="attack-modal__weapon-name">${item.name}</span>
            <span class="attack-modal__weapon-meta">Síla ${item.power} • Min. ${item.requiredMembers} členů • ${stock} ks skladem</span>
            ${specialText ? `<span class="attack-modal__weapon-meta attack-modal__weapon-meta--special">${specialText}</span>` : ""}
          </div>
          <div class="attack-modal__weapon-stepper">
            <button type="button" class="attack-modal__step-btn" data-attack-weapon="${item.name}" data-attack-action="decrease" ${amount <= 0 ? "disabled" : ""}>−</button>
            <strong class="attack-modal__weapon-count">×${amount}</strong>
            <button type="button" class="attack-modal__step-btn" data-attack-weapon="${item.name}" data-attack-action="increase" ${!unlocked ? "disabled" : ""}>+</button>
          </div>
        </div>
      `;
    }).join("");
    const selectedDistrict = resolveDistrictById(attackModalState.districtId);
    const nextAvailability = availability || getAttackModalAvailability(selectedDistrict);
    const nextSummary = getAttackSelectionSummary(nextAvailability);
    const isReady = Number(nextAvailability?.cooldownMs || 0) <= 0
      && nextSummary.totalUsedMembers > 0
      && (scenarioVisionEnabled() && !hasToken() || hasToken());
    container.innerHTML = `${weaponCards}
      <div class="attack-modal__weapon attack-modal__weapon--launch ${isReady ? "" : "is-locked"}">
        <div class="attack-modal__weapon-body">
          <span class="attack-modal__weapon-name">Spustit útok</span>
          <span class="attack-modal__weapon-meta">Potvrdí vybranou sestavu a otevře finální potvrzení útoku.</span>
        </div>
        <div class="attack-modal__weapon-stepper attack-modal__weapon-stepper--launch">
          <button type="button" class="btn btn--danger attack-modal__launch-inline-btn" data-attack-launch="1" ${isReady ? "" : "disabled"}>Spustit útok</button>
        </div>
      </div>
    `;
  }

  function renderAttackModal() {
    const root = document.getElementById("attack-modal");
    if (!root || root.classList.contains("hidden")) return;
    const district = resolveDistrictById(attackModalState.districtId);
    const districtLabel = document.getElementById("attack-modal-district");
    const membersCountEl = document.getElementById("attack-modal-members-count");
    const usedMembersEl = document.getElementById("attack-modal-used-members");
    const powerEl = document.getElementById("attack-modal-power");
    const weaponButtons = document.getElementById("attack-modal-weapons");
    const cooldownEl = document.getElementById("attack-modal-cooldown");
    const startBtn = document.getElementById("attack-modal-start");
    const note = document.getElementById("attack-modal-note");
    if (!districtLabel || !membersCountEl || !usedMembersEl || !powerEl || !weaponButtons || !cooldownEl || !startBtn || !note) return;

    const availability = getAttackModalAvailability(district);
    const demoMode = scenarioVisionEnabled() && !hasToken();
    const selectionSummary = getAttackSelectionSummary(availability);
    if (!attackModalState.districtId && district?.id != null) {
      attackModalState = { districtId: district.id, message: attackModalState.message || "", selectedWeaponCounts: attackModalState.selectedWeaponCounts || {} };
    }

    districtLabel.textContent = district ? (district.name || `Distrikt #${district.id}`) : "-";
    membersCountEl.textContent = String(selectionSummary.remainingMembers);
    usedMembersEl.textContent = String(selectionSummary.totalUsedMembers);
    powerEl.textContent = String(attackWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
      return sum + (count * Number(item.power || 0));
    }, 0));
    renderAttackWeaponButtons(weaponButtons, availability);

    const cooldownMs = availability.cooldownMs;
    cooldownEl.textContent = cooldownMs > 0 ? formatAttackCooldownLabel(cooldownMs) : "Připraveno";
    let noteText = attackModalState.message || "";
    if (!hasToken() && !demoMode) {
      noteText = "Bez přihlášení lze v této verzi útok jen připravit.";
    } else if (cooldownMs > 0) {
      noteText = `Útok je na cooldownu ještě ${formatAttackCooldownLabel(cooldownMs)}.`;
    } else if (availability.availableWeapons <= 0) {
      noteText = "Ve skladu nejsou žádné zbraně.";
    } else if (selectionSummary.remainingMembers < 0) {
      noteText = "Nemáš dost členů gangu pro tuto kombinaci.";
    }
    note.textContent = noteText;
    const isReady = cooldownMs <= 0 && selectionSummary.totalUsedMembers > 0 && (demoMode || hasToken());
    startBtn.disabled = !isReady;
    startBtn.textContent = "Spustit útok";
  }

  function closeAttackModal() {
    const root = document.getElementById("attack-modal");
    if (root) root.classList.add("hidden");
    attackModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
    if (attackModalRefreshTimer) {
      clearInterval(attackModalRefreshTimer);
      attackModalRefreshTimer = null;
    }
  }

  function openAttackModal(district) {
    const root = document.getElementById("attack-modal");
    if (!root) return;
    attackModalState = { districtId: district?.id ?? null, message: "", selectedWeaponCounts: {} };
    setAttackModalNote("");
    root.classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("empire:attack-modal-opened", {
      detail: { districtId: district?.id ?? null, district: district || null }
    }));
    renderAttackModal();
    if (attackModalRefreshTimer) clearInterval(attackModalRefreshTimer);
    attackModalRefreshTimer = setInterval(() => {
      const modal = document.getElementById("attack-modal");
      if (!modal || modal.classList.contains("hidden")) {
        closeAttackModal();
        return;
      }
      renderAttackModal();
    }, 250);
  }

  function initAttackModal() {
    const root = document.getElementById("attack-modal");
    const backdrop = document.getElementById("attack-modal-backdrop");
    const closeBtn = document.getElementById("attack-modal-close");
    const startBtn = document.getElementById("attack-modal-start");
    const weaponButtons = document.getElementById("attack-modal-weapons");
    if (!root || root.dataset.combatModalBound === "1") return;
    root.dataset.combatModalBound = "1";

    if (backdrop) backdrop.addEventListener("click", closeAttackModal);
    if (closeBtn) closeBtn.addEventListener("click", closeAttackModal);
    if (weaponButtons) {
      const handleAttackStepperInteraction = (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const launchButton = target.closest("[data-attack-launch]");
        if (launchButton) {
          if (startBtn && !startBtn.disabled) startBtn.click();
          return;
        }
        const button = target.closest("[data-attack-weapon][data-attack-action]");
        if (!button) return;
        const now = Date.now();
        if (event.type === "click" && now - lastAttackStepperInteractionAt < 120) return;
        lastAttackStepperInteractionAt = now;
        if (event.type === "pointerdown") event.preventDefault();
        const name = String(button.getAttribute("data-attack-weapon") || "").trim();
        const action = String(button.getAttribute("data-attack-action") || "").trim();
        if (!name || (action !== "increase" && action !== "decrease")) return;
        const selectedDistrict = resolveDistrictById(attackModalState.districtId);
        const availability = getAttackModalAvailability(selectedDistrict);
        const summary = getAttackSelectionSummary(availability);
        const item = attackWeaponStats.find((entry) => entry.name === name);
        if (!item) return;
        const current = Math.max(0, Math.floor(Number(summary.selection[name] || 0)));
        const maxCount = getAttackWeaponMaxCount(item, summary, availability);
        let nextCount = current;
        if (action === "increase") nextCount = current < maxCount ? current + 1 : current;
        if (action === "decrease") nextCount = current > 0 ? current - 1 : 0;
        attackModalState.selectedWeaponCounts = { ...(attackModalState.selectedWeaponCounts || {}), [name]: nextCount };
        if (nextCount <= 0) delete attackModalState.selectedWeaponCounts[name];
        setAttackModalNote("");
        renderAttackModal();
      };
      weaponButtons.addEventListener("dblclick", (event) => event.preventDefault());
      weaponButtons.addEventListener("pointerdown", handleAttackStepperInteraction);
      weaponButtons.addEventListener("click", handleAttackStepperInteraction);
    }
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const district = resolveDistrictById(attackModalState.districtId);
        if (!district) {
          setAttackModalNote("Nejprve vyber cíl útoku.");
          return;
        }
        const availability = getAttackModalAvailability(district);
        const demoMode = scenarioVisionEnabled() && !hasToken();
        if (availability.cooldownMs > 0) {
          setAttackModalNote(`Útok je na cooldownu ještě ${formatAttackCooldownLabel(availability.cooldownMs)}.`);
          renderAttackModal();
          return;
        }
        const selectionSummary = getAttackSelectionSummary(availability);
        if (selectionSummary.totalUsedMembers <= 0) {
          setAttackModalNote("");
          renderAttackModal();
          return;
        }
        if (selectionSummary.remainingMembers < 0) {
          setAttackModalNote("Nemáš dost členů gangu pro tuto kombinaci.");
          renderAttackModal();
          return;
        }
        const baseDetails = getAttackResultDetails(district, { ...availability, ...selectionSummary });
        const defensePowerEstimate = getAttackDefensePowerEstimate(district, selectionSummary?.selection);
        if (!hasToken() && !demoMode) {
          setAttackModalNote("Bez přihlášení lze útok jen připravit v ukázkovém stavu.");
          renderAttackModal();
          return;
        }
        openAttackConfirmModal({
          districtId: district.id,
          availability,
          selectionSummary,
          baseDetails,
          defensePowerEstimate
        });
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAttackModal();
    });
  }

  function getDefenseModalAvailability() {
    const counts = resolveDefenseCounts();
    const initialSelection = sanitizeDefenseSelection(defenseModalState.initialAssignmentSelection || {});
    const mergedCounts = defenseWeaponStats.reduce((acc, item) => {
      const inStorage = Math.max(0, Math.floor(Number(counts[item.name] || 0)));
      const alreadyAssignedHere = Math.max(0, Math.floor(Number(initialSelection[item.name] || 0)));
      acc[item.name] = inStorage + alreadyAssignedHere;
      return acc;
    }, {});
    const availableWeapons = getDefenseWeaponTotal(mergedCounts);
    const baseMembers = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(getCachedProfile() || getPlayer() || {})) || 0));
    const initialUsedMembers = defenseWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(initialSelection[item.name] || 0)));
      return sum + count * Math.max(0, Math.floor(Number(item.requiredMembers || 0)));
    }, 0);
    const actualMembers = Math.max(0, baseMembers + initialUsedMembers);
    const weaponAccess = resolveCombatWeaponAccess("defense", actualMembers);
    return {
      availableWeapons,
      actualMembers,
      weaponCounts: mergedCounts,
      weaponAccess,
      unlockedWeapon: weaponAccess.weapon || null,
      initialSelection,
      initialUsedMembers
    };
  }

  function getDefenseSelectionSummary(availability, selectionCounts = defenseModalState.selectedWeaponCounts || {}) {
    const actualMembers = Math.max(0, Math.floor(Number(availability?.actualMembers || 0)));
    const weaponCounts = availability?.weaponCounts || resolveDefenseCounts();
    const selection = defenseWeaponStats.reduce((acc, item) => {
      const count = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      acc[item.name] = count;
      return acc;
    }, {});
    const totalUsedMembers = defenseWeaponStats.reduce((sum, item) => {
      const count = Number(selection[item.name] || 0);
      return sum + (Number.isFinite(count) ? count * Number(item.requiredMembers || 0) : 0);
    }, 0);
    const remainingMembers = Math.max(0, actualMembers - totalUsedMembers);
    const remainingWeaponCounts = defenseWeaponStats.reduce((acc, item) => {
      const stock = Math.max(0, Math.floor(Number(weaponCounts[item.name] || 0)));
      const selected = Math.max(0, Math.floor(Number(selection[item.name] || 0)));
      acc[item.name] = Math.max(0, stock - selected);
      return acc;
    }, {});
    return {
      actualMembers,
      remainingMembers,
      totalUsedMembers,
      weaponCounts,
      remainingWeaponCounts,
      selection
    };
  }

  function getDefenseWeaponMaxCount(item, summary, availability) {
    const stock = Math.max(0, Math.floor(Number(summary?.weaponCounts?.[item.name] ?? availability?.weaponCounts?.[item.name] ?? 0)));
    const current = Math.max(0, Math.floor(Number(summary?.selection?.[item.name] || 0)));
    const otherUsedMembers = Math.max(0, Number(summary?.totalUsedMembers || 0) - current * Number(item.requiredMembers || 0));
    const remainingForThisWeapon = Math.max(0, Number(summary?.actualMembers || 0) - otherUsedMembers);
    const byMembers = Math.floor(remainingForThisWeapon / Math.max(1, Number(item.requiredMembers || 0)));
    return Math.max(0, Math.min(stock, byMembers));
  }

  function renderDefenseWeaponButtons(container, availability) {
    if (!container) return;
    const summary = getDefenseSelectionSummary(availability);
    const weaponCards = defenseWeaponStats.map((item) => {
      const amount = Math.max(0, Math.floor(Number(summary.selection[item.name] || 0)));
      const stock = Math.max(0, Math.floor(Number(summary.remainingWeaponCounts[item.name] || 0)));
      const maxCount = getDefenseWeaponMaxCount(item, summary, availability);
      const unlocked = stock > 0 && maxCount > 0;
      const specialText = String(resolveDefenseWeaponSpecialText(item.name) || "").trim();
      return `
        <div class="attack-modal__weapon ${amount > 0 ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}">
          <div class="attack-modal__weapon-body">
            <span class="attack-modal__weapon-name">${item.name}</span>
            <span class="attack-modal__weapon-meta">Síla ${item.power} • Min. ${item.requiredMembers} členů • ${stock} ks skladem</span>
            ${specialText ? `<span class="attack-modal__weapon-meta attack-modal__weapon-meta--special">${specialText}</span>` : ""}
          </div>
          <div class="attack-modal__weapon-stepper">
            <button type="button" class="attack-modal__step-btn" data-defense-weapon="${item.name}" data-defense-action="decrease" ${amount <= 0 ? "disabled" : ""}>−</button>
            <strong class="attack-modal__weapon-count">×${amount}</strong>
            <button type="button" class="attack-modal__step-btn" data-defense-weapon="${item.name}" data-defense-action="increase" ${!unlocked ? "disabled" : ""}>+</button>
          </div>
        </div>
      `;
    }).join("");
    const isReady = summary.totalUsedMembers > 0 || Boolean(defenseModalState.hasInitialAssignment);
    container.innerHTML = `${weaponCards}
      <div class="attack-modal__weapon attack-modal__weapon--launch ${isReady ? "" : "is-locked"}">
        <div class="attack-modal__weapon-body">
          <span class="attack-modal__weapon-name">Nastavit obranu</span>
          <span class="attack-modal__weapon-meta">Uloží aktuální rozložení obranných zbraní do districtu.</span>
        </div>
        <div class="attack-modal__weapon-stepper attack-modal__weapon-stepper--launch">
          <button type="button" class="btn btn--primary attack-modal__launch-inline-btn" data-defense-launch="1" ${isReady ? "" : "disabled"}>Nastavit obranu</button>
        </div>
      </div>
    `;
  }

  function setDefenseModalNote(message) {
    defenseModalState.message = String(message || "");
    const note = document.getElementById("defense-modal-note");
    if (note) note.textContent = defenseModalState.message;
  }

  function renderDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    if (!root || root.classList.contains("hidden")) return;
    const district = resolveDistrictById(defenseModalState.districtId);
    const districtLabel = document.getElementById("defense-modal-district");
    const membersCountEl = document.getElementById("defense-modal-members-count");
    const usedMembersEl = document.getElementById("defense-modal-used-members");
    const powerEl = document.getElementById("defense-modal-power");
    const weaponButtons = document.getElementById("defense-modal-weapons");
    const startBtn = document.getElementById("defense-modal-start");
    const note = document.getElementById("defense-modal-note");
    if (!districtLabel || !membersCountEl || !usedMembersEl || !powerEl || !weaponButtons || !startBtn || !note) return;

    const availability = getDefenseModalAvailability();
    const selectionSummary = getDefenseSelectionSummary(availability);
    const hasExistingDefense = Boolean(defenseModalState.hasInitialAssignment);
    districtLabel.textContent = district ? (district.name || `Distrikt #${district.id}`) : "-";
    membersCountEl.textContent = String(selectionSummary.remainingMembers);
    usedMembersEl.textContent = String(selectionSummary.totalUsedMembers);
    powerEl.textContent = String(defenseWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
      return sum + (count * Number(item.power || 0));
    }, 0));
    renderDefenseWeaponButtons(weaponButtons, availability);

    let noteText = defenseModalState.message || "";
    if (hasExistingDefense) {
      noteText = defenseModalState.message || "Uprava obrany je aktivní. Odebrané zbraně a členové se po uložení vrátí zpět.";
    }
    if (availability.availableWeapons <= 0) {
      noteText = "Ve skladu nejsou žádné obranné zbraně.";
    } else if (selectionSummary.remainingMembers < 0) {
      noteText = "Nemáš dost členů gangu pro tuto kombinaci.";
    }
    note.textContent = noteText;
    startBtn.textContent = hasExistingDefense ? "Upravit obranu" : "Nastavit obranu";
    startBtn.disabled = selectionSummary.totalUsedMembers <= 0 && !hasExistingDefense;
  }

  function closeDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    if (root) root.classList.add("hidden");
    defenseModalState = {
      districtId: null,
      message: "",
      selectedWeaponCounts: {},
      initialAssignmentSelection: {},
      hasInitialAssignment: false
    };
    if (defenseModalRefreshTimer) {
      clearInterval(defenseModalRefreshTimer);
      defenseModalRefreshTimer = null;
    }
  }

  function openDistrictDefenseModal(district) {
    const root = document.getElementById("district-defense-modal");
    const districtLabel = document.getElementById("defense-modal-district");
    if (!root) return;
    const currentAssignment = getDistrictDefenseAssignmentForCurrentPlayer(district?.id);
    const initialSelection = currentAssignment?.selection || {};
    defenseModalState = {
      districtId: district?.id ?? null,
      message: "",
      selectedWeaponCounts: { ...initialSelection },
      initialAssignmentSelection: { ...initialSelection },
      hasInitialAssignment: Boolean(currentAssignment?.hasDefense)
    };
    if (districtLabel) districtLabel.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    root.classList.remove("hidden");
    renderDefenseModal();
    if (defenseModalRefreshTimer) clearInterval(defenseModalRefreshTimer);
    defenseModalRefreshTimer = setInterval(() => {
      const modal = document.getElementById("district-defense-modal");
      if (!modal || modal.classList.contains("hidden")) {
        closeDefenseModal();
        return;
      }
      renderDefenseModal();
    }, 250);
  }

  function initDistrictDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    const backdrop = document.getElementById("district-defense-modal-backdrop");
    const closeBtn = document.getElementById("district-defense-modal-close");
    const startBtn = document.getElementById("defense-modal-start");
    const weaponButtons = document.getElementById("defense-modal-weapons");
    if (!root || root.dataset.defenseModalBound === "1") return;
    root.dataset.defenseModalBound = "1";

    if (backdrop) backdrop.addEventListener("click", closeDefenseModal);
    if (closeBtn) closeBtn.addEventListener("click", closeDefenseModal);
    if (weaponButtons) {
      const handleDefenseStepperInteraction = (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const launchButton = target.closest("[data-defense-launch]");
        if (launchButton) {
          if (startBtn && !startBtn.disabled) startBtn.click();
          return;
        }
        const button = target.closest("[data-defense-weapon][data-defense-action]");
        if (!button) return;
        if (event.type === "pointerdown") event.preventDefault();
        const name = String(button.getAttribute("data-defense-weapon") || "").trim();
        const action = String(button.getAttribute("data-defense-action") || "").trim();
        if (!name || (action !== "increase" && action !== "decrease")) return;
        const availability = getDefenseModalAvailability();
        const summary = getDefenseSelectionSummary(availability);
        const item = defenseWeaponStats.find((entry) => entry.name === name);
        if (!item) return;
        const current = Math.max(0, Math.floor(Number(summary.selection[name] || 0)));
        const maxCount = getDefenseWeaponMaxCount(item, summary, availability);
        let nextCount = current;
        if (action === "increase") nextCount = current < maxCount ? current + 1 : current;
        if (action === "decrease") nextCount = current > 0 ? current - 1 : 0;
        defenseModalState.selectedWeaponCounts = { ...(defenseModalState.selectedWeaponCounts || {}), [name]: nextCount };
        if (nextCount <= 0) delete defenseModalState.selectedWeaponCounts[name];
        setDefenseModalNote("");
        renderDefenseModal();
      };
      weaponButtons.addEventListener("pointerdown", handleDefenseStepperInteraction);
      weaponButtons.addEventListener("click", handleDefenseStepperInteraction);
    }
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const district = resolveDistrictById(defenseModalState.districtId);
        const availability = getDefenseModalAvailability();
        const selectionSummary = getDefenseSelectionSummary(availability);
        const previousSelection = sanitizeDefenseSelection(defenseModalState.initialAssignmentSelection || {});
        const hadPreviousDefense = Boolean(defenseModalState.hasInitialAssignment);
        const hasAnySelectedDefense = selectionSummary.totalUsedMembers > 0;
        const previouslyUsedMembers = defenseWeaponStats.reduce((sum, item) => {
          const count = Math.max(0, Math.floor(Number(previousSelection[item.name] || 0)));
          return sum + count * Math.max(0, Math.floor(Number(item.requiredMembers || 0)));
        }, 0);
        const consumeWeapons = {};
        const releasedWeapons = {};
        defenseWeaponStats.forEach((item) => {
          const previousCount = Math.max(0, Math.floor(Number(previousSelection[item.name] || 0)));
          const nextCount = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
          if (nextCount > previousCount) consumeWeapons[item.name] = nextCount - previousCount;
          if (previousCount > nextCount) releasedWeapons[item.name] = previousCount - nextCount;
        });
        const releasedMembers = Math.max(0, previouslyUsedMembers - selectionSummary.totalUsedMembers);
        const consumedMembers = Math.max(0, selectionSummary.totalUsedMembers - previouslyUsedMembers);
        const defensePower = defenseWeaponStats.reduce((sum, item) => {
          const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
          return sum + count * Math.max(0, Math.floor(Number(item.power || 0)));
        }, 0);
        if (selectionSummary.remainingMembers < 0) {
          setDefenseModalNote("Nemáš dost členů gangu pro tuto kombinaci.");
          renderDefenseModal();
          return;
        }
        if (Object.keys(releasedWeapons).length > 0) {
          const restored = resolveDefenseCounts();
          Object.entries(releasedWeapons).forEach(([name, amount]) => {
            restored[name] = Math.max(0, Math.floor(Number(restored[name] || 0))) + Math.max(0, Math.floor(Number(amount || 0)));
          });
          deps.persistDefenseCounts?.(restored);
        }
        if (releasedMembers > 0) addGangMembers(releasedMembers);
        if (Object.keys(consumeWeapons).length > 0) consumeDefenseWeaponCounts(consumeWeapons);
        if (consumedMembers > 0) consumeGangMembers(consumedMembers);
        saveDistrictDefenseAssignment(district, hasAnySelectedDefense ? selectionSummary.selection : {}, hasAnySelectedDefense ? selectionSummary.totalUsedMembers : 0, hasAnySelectedDefense ? defensePower : 0);
        refreshSelectedDistrictModal();
        if (!hasAnySelectedDefense && hadPreviousDefense) {
          pushEvent(`Obrana distriktu ${district?.name || `#${district?.id}`} byla zrušena. Zbraně i členové se vrátili do skladu.`);
        } else {
          const selectedWeapons = defenseWeaponStats
            .map((item) => {
              const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
              return count > 0 ? `${count}× ${item.name}` : "";
            })
            .filter(Boolean);
          pushEvent(`Obrana distriktu ${district?.name || `#${district?.id}`} byla ${hadPreviousDefense ? "upravena" : "nastavena"}. Zbraně: ${selectedWeapons.length ? selectedWeapons.join(", ") : "žádné"}. Členové gangu: ${selectionSummary.totalUsedMembers}. Síla obrany: ${defensePower}.`);
        }
        closeDefenseModal();
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDefenseModal();
    });
  }

  return {
    initAttackModal,
    openAttackModal,
    renderAttackModal,
    closeAttackModal,
    getAttackModalAvailability,
    getAttackSelectionSummary,
    renderAttackWeaponButtons,
    setAttackModalNote,
    initDistrictDefenseModal,
    openDistrictDefenseModal,
    renderDefenseModal,
    closeDefenseModal,
    getDefenseModalAvailability,
    getDefenseSelectionSummary,
    renderDefenseWeaponButtons,
    setDefenseModalNote
  };
};
