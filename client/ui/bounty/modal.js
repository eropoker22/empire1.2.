window.Empire = window.Empire || {};
window.Empire.UIBounty = window.Empire.UIBounty || {};

window.Empire.UIBounty.createModalController = function createModalController(deps = {}) {
  const {
    storageDrugTypes = [],
    factorySupplyTypes = [],
    escapeHtml = (value) => String(value ?? ""),
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase(),
    resolveCurrentPlayerOwnerKey = () => "",
    getPlayerOwnerNameSet = () => [],
    getActiveAllianceOwnerNames = () => [],
    getLocalAllianceState = () => null,
    extractAllianceDisplayName = (value) => String(value || "").trim(),
    getCachedProfile = () => null,
    getPlayer = () => window.Empire.player || {},
    isBlackoutLikeScenario = () => false,
    getLiveBountyEconomySnapshot = () => ({}),
    getGuestBlackoutLiveBalances = () => ({}),
    getEconomySnapshotFromDom = () => ({}),
    readFactoryPlayerSuppliesState = () => ({}),
    resolveMoneyBreakdown = () => ({ cleanMoney: 0 }),
    isGuestBlackoutScenarioActive = () => false,
    spendBountyResource = () => ({ ok: false }),
    restoreBountyResource = () => {},
    createPersistedBounty = async () => ({}),
    loadPersistedBounties = async () => [],
    readBountyEntries = () => [],
    syncBountyDistrictMarkers = () => {},
    formatBountyExpiryLabel = () => "-",
    setMobileTopbarCoveredByPrimaryModal = () => {},
    pushEvent = () => {}
  } = deps;

  const BOUNTY_HUNT_MODE_THRESHOLD = 10000;
  const bountyUnitValueMap = {
    clean_cash: 1,
    neonDust: 180,
    pulseShot: 220,
    velvetSmoke: 260,
    ghostSerum: 320,
    overdriveX: 420,
    metalParts: 120,
    techCore: 220,
    combatModule: 340
  };

  function formatBountyMoneyValue(value) {
    return `$${Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("cs-CZ")}`;
  }

  function formatBountyObjectiveLabel(value) {
    const safeValue = String(value || "").trim();
    if (safeValue === "successful-attack") return "Za úspěšný útok";
    if (safeValue === "destroy-units") return "Za zničení jednotek";
    return "Za obsazení districtu";
  }

  function resolveBountyThreatLevel(districtCount) {
    const safeCount = Math.max(0, Math.floor(Number(districtCount || 0)));
    if (safeCount >= 18) return { label: "Extreme threat", tone: "extreme" };
    if (safeCount >= 10) return { label: "High threat", tone: "high" };
    if (safeCount >= 5) return { label: "Medium threat", tone: "medium" };
    return { label: "Low threat", tone: "low" };
  }

  function resolveBountyLastActivityLabel(player) {
    const explicitValue = String(player?.lastActivity || player?.lastActivityLabel || player?.activity || "").trim();
    if (explicitValue) return explicitValue;
    return Math.max(0, Math.floor(Number(player?.districtCount || 0))) > 0
      ? "Aktivní na mapě"
      : "Bez potvrzené aktivity";
  }

  function getBountyUnitValue(resourceKey) {
    return Math.max(0, Math.floor(Number(bountyUnitValueMap[String(resourceKey || "").trim()] || 0)));
  }

  function collectBountyEligiblePlayers() {
    const ownOwnerNames = new Set(getPlayerOwnerNameSet());
    const ownOwnerKey = resolveCurrentPlayerOwnerKey();
    if (ownOwnerKey) ownOwnerNames.add(ownOwnerKey);
    const alliedOwnerNames = new Set(getActiveAllianceOwnerNames());
    const localAllianceState = !window.Empire.token ? getLocalAllianceState() : null;
    const activeAlliance = localAllianceState?.activeAlliance || null;
    (Array.isArray(activeAlliance?.members) ? activeAlliance.members : [])
      .map((member) => normalizeOwnerName(member?.username))
      .filter(Boolean)
      .forEach((key) => alliedOwnerNames.add(key));
    const ownAllianceName = extractAllianceDisplayName(
      activeAlliance?.name || getCachedProfile()?.alliance || getPlayer()?.alliance || "Bez aliance"
    );
    const shouldFilterAllianceByName = ownAllianceName && ownAllianceName !== "Žádná" && ownAllianceName !== "Bez aliance";
    const byName = new Map();
    (Array.isArray(window.Empire.districts) ? window.Empire.districts : []).forEach((district) => {
      const ownerName = String(district?.ownerNick || district?.owner_username || district?.ownerUsername || district?.owner || "").trim();
      const ownerKey = normalizeOwnerName(ownerName);
      if (!ownerKey || ownOwnerNames.has(ownerKey) || alliedOwnerNames.has(ownerKey)) return;
      const allianceName = String(district?.ownerAllianceName || district?.owner_alliance_name || "").trim() || "Bez aliance";
      if (shouldFilterAllianceByName && extractAllianceDisplayName(allianceName) === ownAllianceName) return;
      const current = byName.get(ownerKey) || {
        name: ownerName,
        allianceName,
        districtCount: 0,
        avatar: String(district?.ownerAvatar || "").trim()
      };
      current.districtCount += 1;
      if (!current.avatar) current.avatar = String(district?.ownerAvatar || "").trim();
      if (!current.allianceName || current.allianceName === "Bez aliance") current.allianceName = allianceName;
      byName.set(ownerKey, current);
    });
    let result = Array.from(byName.values())
      .filter((entry) => Math.max(0, Math.floor(Number(entry?.districtCount || 0))) > 0)
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "cs"));
    if (!result.length && isBlackoutLikeScenario()) {
      result = [{ name: "Mariah", allianceName: "Bez aliance", districtCount: 1, avatar: "" }];
    }
    return result;
  }

  function getBountyModalResourceAvailability() {
    const economy = getLiveBountyEconomySnapshot();
    const marketBalances = getGuestBlackoutLiveBalances() || {};
    const domEconomy = getEconomySnapshotFromDom();
    const factoryState = readFactoryPlayerSuppliesState();
    const drugInventory = economy?.drugInventory && typeof economy.drugInventory === "object" ? economy.drugInventory : {};
    const economyMoney = resolveMoneyBreakdown(economy || {});
    const marketMoney = resolveMoneyBreakdown(marketBalances || {});
    const domMoney = resolveMoneyBreakdown(domEconomy || {});
    const availability = {
      cash: Math.max(0, Math.floor(
        isGuestBlackoutScenarioActive()
          ? Math.max(economyMoney.cleanMoney || 0, marketMoney.cleanMoney || 0, domMoney.cleanMoney || 0)
          : Math.max(economyMoney.cleanMoney || 0, domMoney.cleanMoney || 0)
      ))
    };
    storageDrugTypes.forEach((item) => {
      availability[item.key] = Math.max(0, Math.floor(
        Number(drugInventory[item.key] || 0) || Number(economy?.[item.key] || 0) || Number(marketBalances[item.key] || 0)
      ));
    });
    factorySupplyTypes.forEach((item) => {
      availability[item.key] = Math.max(0, Math.floor(
        Number(factoryState?.[item.key] || 0) || Number(economy?.[item.key] || 0) || Number(marketBalances[item.key] || 0)
      ));
    });
    return availability;
  }

  function formatBountyRewardSummary(rewards) {
    return (Array.isArray(rewards) ? rewards : [])
      .map((reward) => `${Math.max(0, Math.floor(Number(reward?.amount || 0)))}x ${String(reward?.label || "").trim()}`)
      .filter(Boolean)
      .join(", ");
  }

  function ensureBountyModalShell() {
    let root = document.getElementById("bounty-modal");
    if (root && !root.querySelector(".bounty-board__content")) {
      root.remove();
      root = null;
    }
    if (!root) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div id="bounty-modal" class="modal hidden bounty-board-modal">
          <div id="bounty-modal-backdrop" class="modal__backdrop"></div>
          <div class="modal__content bounty-board__content">
            <header class="bounty-board__header">
              <div class="bounty-board__header-copy"><div class="bounty-board__eyebrow">Bounty board</div><h3>VYPSAT ODMĚNU</h3><p>Označ hráče a vystav ho celému městu.</p></div>
              <button id="bounty-modal-close" class="modal__close" type="button" aria-label="Zavřít">×</button>
            </header>
            <div class="bounty-board__layout">
              <section class="bounty-board__column bounty-board__column--left">
                <div class="bounty-board__panel"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Target</span></div><label class="bounty-board__field"><span>Hráč</span><select id="bounty-modal-target" class="bounty-board__input"></select></label><div class="bounty-board__target-card"><div class="bounty-board__avatar-wrap"><img id="bounty-target-avatar" class="bounty-board__avatar is-empty" alt="Target avatar" /><span id="bounty-target-avatar-fallback" class="bounty-board__avatar-fallback">??</span></div><div class="bounty-board__target-copy"><div id="bounty-target-name" class="bounty-board__target-name">Nevybrán cíl</div><div id="bounty-target-alliance" class="bounty-board__target-meta">Aliance: Bez aliance</div><div id="bounty-target-districts" class="bounty-board__target-meta">Districtů: 0</div><div id="bounty-target-activity" class="bounty-board__target-meta">Poslední aktivita: -</div></div><div id="bounty-target-threat" class="bounty-board__threat" data-tone="low">Low threat</div></div></div>
                <div class="bounty-board__panel"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Nastavení odměny</span></div><div class="bounty-board__resource-list"><div class="bounty-board__resource-row"><div class="bounty-board__resource-head"><span class="bounty-board__resource-icon">💵</span><div><div class="bounty-board__resource-name">Cash</div><div id="bounty-cash-available" class="bounty-board__resource-have">Máš: 0</div></div></div><div class="bounty-board__resource-controls"><input id="bounty-cash-range" class="bounty-board__input" type="range" min="0" max="0" step="100" value="0" /><input id="bounty-cash-input" class="bounty-board__input bounty-board__input--number" type="number" min="0" max="0" step="100" value="0" /></div></div><div class="bounty-board__resource-row"><div class="bounty-board__resource-head"><span class="bounty-board__resource-icon">💊</span><div><div class="bounty-board__resource-name">Drogy</div><div id="bounty-drugs-available" class="bounty-board__resource-have">Máš: 0 ks</div></div></div><div class="bounty-board__resource-controls"><select id="bounty-drug-type" class="bounty-board__input"></select><input id="bounty-drugs-input" class="bounty-board__input bounty-board__input--number" type="number" min="0" max="0" step="1" value="0" /></div></div><div class="bounty-board__resource-row"><div class="bounty-board__resource-head"><span class="bounty-board__resource-icon">🧱</span><div><div class="bounty-board__resource-name">Materiály</div><div id="bounty-materials-available" class="bounty-board__resource-have">Máš: 0 ks</div></div></div><div class="bounty-board__resource-controls"><select id="bounty-material-type" class="bounty-board__input"></select><input id="bounty-materials-input" class="bounty-board__input bounty-board__input--number" type="number" min="0" max="0" step="1" value="0" /></div></div></div></div>
                <div class="bounty-board__panel"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Typ bounty</span></div><div class="bounty-board__choice-grid"><label class="bounty-board__choice"><input type="radio" name="bounty-objective" value="occupy-sector" checked /><span>Obsazení districtu</span></label><label class="bounty-board__choice"><input type="radio" name="bounty-objective" value="successful-attack" /><span>Úspěšný útok</span></label><label class="bounty-board__choice"><input type="radio" name="bounty-objective" value="destroy-units" /><span>Zničení jednotek</span></label></div><label id="bounty-district-field" class="bounty-board__field"><span>District</span><select id="bounty-modal-district" class="bounty-board__input"></select></label></div>
                <div class="bounty-board__settings"><div class="bounty-board__panel bounty-board__panel--compact"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Trvání</span></div><div class="bounty-board__segment-grid"><label class="bounty-board__segment"><input type="radio" name="bounty-duration" value="6" /><span>6h</span></label><label class="bounty-board__segment"><input type="radio" name="bounty-duration" value="12" checked /><span>12h</span></label><label class="bounty-board__segment"><input type="radio" name="bounty-duration" value="24" /><span>24h</span></label></div></div><div class="bounty-board__panel bounty-board__panel--compact"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Anonymita</span></div><label class="bounty-board__toggle"><input id="bounty-anonymous-input" type="checkbox" checked /><span>Anonymní zadavatel</span></label></div></div>
              </section>
              <section class="bounty-board__column bounty-board__column--right">
                <div class="bounty-board__panel bounty-board__preview"><div id="bounty-preview-target" class="bounty-board__preview-target">Nevybrán cíl</div><div id="bounty-preview-value" class="bounty-board__preview-value">$0</div><div class="bounty-board__preview-grid"><div><span>Typ</span><strong id="bounty-preview-type">Za obsazení districtu</strong></div><div><span>Trvání</span><strong id="bounty-preview-duration">12h</strong></div><div><span>Anonymita</span><strong id="bounty-preview-anonymous">Anonymní</strong></div></div></div>
                <div class="bounty-board__panel"><div id="bounty-hunt-state" class="bounty-board__hunt-state" data-mode="charging">Hunt mode se plní</div><div class="bounty-board__progress"><div id="bounty-hunt-progress-fill" class="bounty-board__progress-fill"></div></div><div id="bounty-hunt-progress-label" class="bounty-board__progress-label">Do HUNT MODE zbývá $10,000.</div></div>
                <div class="bounty-board__panel bounty-board__warning"><strong>Pozor</strong><div>Po potvrzení nelze bounty zrušit.</div></div>
                <div class="bounty-board__panel bounty-board__table-panel"><div class="bounty-board__panel-head"><span class="bounty-board__kicker">Aktivní odměny</span></div><div class="bounty-board__table-wrap"><table class="bounty-board__table"><thead><tr><th>Cíl</th><th>District</th><th>Odměna</th><th>Typ</th><th>Konec</th></tr></thead><tbody id="bounty-board-body"></tbody></table><div id="bounty-board-empty" class="bounty-board__empty">Zatím tu není žádná aktivní bounty.</div></div></div>
                <div class="bounty-board__actions"><button id="bounty-modal-cancel" class="btn bounty-board__cancel" type="button">Zrušit</button><button id="bounty-modal-submit" class="btn bounty-board__submit" type="button">VYPSAT ODMĚNU</button></div>
              </section>
            </div>
          </div>
        </div>`;
      document.body.appendChild(wrapper.firstElementChild);
      root = document.getElementById("bounty-modal");
    }
    return {
      root,
      backdrop: document.getElementById("bounty-modal-backdrop"),
      closeBtn: document.getElementById("bounty-modal-close"),
      cancelBtn: document.getElementById("bounty-modal-cancel"),
      targetSelect: document.getElementById("bounty-modal-target"),
      districtSelect: document.getElementById("bounty-modal-district"),
      submitBtn: document.getElementById("bounty-modal-submit"),
      targetName: document.getElementById("bounty-target-name"),
      targetAlliance: document.getElementById("bounty-target-alliance"),
      targetDistricts: document.getElementById("bounty-target-districts"),
      targetActivity: document.getElementById("bounty-target-activity"),
      targetThreat: document.getElementById("bounty-target-threat"),
      targetAvatar: document.getElementById("bounty-target-avatar"),
      targetAvatarFallback: document.getElementById("bounty-target-avatar-fallback"),
      cashRange: document.getElementById("bounty-cash-range"),
      cashInput: document.getElementById("bounty-cash-input"),
      cashAvailable: document.getElementById("bounty-cash-available"),
      drugTypeSelect: document.getElementById("bounty-drug-type"),
      drugsInput: document.getElementById("bounty-drugs-input"),
      drugsAvailable: document.getElementById("bounty-drugs-available"),
      materialTypeSelect: document.getElementById("bounty-material-type"),
      materialsInput: document.getElementById("bounty-materials-input"),
      materialsAvailable: document.getElementById("bounty-materials-available"),
      anonymousInput: document.getElementById("bounty-anonymous-input"),
      previewTarget: document.getElementById("bounty-preview-target"),
      previewValue: document.getElementById("bounty-preview-value"),
      previewType: document.getElementById("bounty-preview-type"),
      previewDuration: document.getElementById("bounty-preview-duration"),
      previewAnonymous: document.getElementById("bounty-preview-anonymous"),
      huntModeState: document.getElementById("bounty-hunt-state"),
      huntModeProgressFill: document.getElementById("bounty-hunt-progress-fill"),
      huntModeProgressLabel: document.getElementById("bounty-hunt-progress-label"),
      districtField: document.getElementById("bounty-district-field"),
      boardBody: document.getElementById("bounty-board-body"),
      boardEmpty: document.getElementById("bounty-board-empty")
    };
  }

  function initBountyModalV2() {
    const shell = ensureBountyModalShell();
    const {
      root, backdrop, closeBtn, cancelBtn, targetSelect, districtSelect, submitBtn,
      targetName, targetAlliance, targetDistricts, targetActivity, targetThreat,
      targetAvatar, targetAvatarFallback, cashRange, cashInput, cashAvailable,
      drugTypeSelect, drugsInput, drugsAvailable, materialTypeSelect, materialsInput,
      materialsAvailable, anonymousInput, previewTarget, previewValue, previewType,
      previewDuration, previewAnonymous, huntModeState, huntModeProgressFill,
      huntModeProgressLabel, districtField, boardBody, boardEmpty
    } = shell;
    if (!root || !targetSelect || !districtSelect || !submitBtn || !boardBody || !boardEmpty) return;
    const objectiveInputs = Array.from(root.querySelectorAll('input[name="bounty-objective"]'));
    const durationInputs = Array.from(root.querySelectorAll('input[name="bounty-duration"]'));
    if (!objectiveInputs.length || !durationInputs.length) return;
    const modalState = root.__bountyV2State || { players: [], bounties: [], openLock: 0 };
    root.__bountyV2State = modalState;
    const getSelectedObjectiveType = () => String(objectiveInputs.find((input) => input.checked)?.value || "occupy-sector").trim() || "occupy-sector";
    const getSelectedDurationHours = () => Math.max(1, Math.min(24, Math.floor(Number(durationInputs.find((input) => input.checked)?.value || 12))));
    const clampIntInput = (input, maxValue) => { const safeMax = Math.max(0, Math.floor(Number(maxValue || 0))); const nextValue = Math.min(safeMax, Math.max(0, Math.floor(Number(input?.value || 0)))); input.max = String(safeMax); input.value = String(nextValue); return nextValue; };
    const selectedPlayer = () => modalState.players.find((player) => String(player?.name || "").trim() === String(targetSelect.value || "").trim()) || null;
    const selectedDrug = () => storageDrugTypes.find((item) => item.key === String(drugTypeSelect.value || "").trim()) || null;
    const selectedMaterial = () => factorySupplyTypes.find((item) => item.key === String(materialTypeSelect.value || "").trim()) || null;
    const renderTargetOptions = () => {
      const previous = String(targetSelect.value || "").trim();
      targetSelect.innerHTML = modalState.players.length
        ? ['<option value="">Vyber hráče</option>', ...modalState.players.map((player) => `<option value="${escapeHtml(String(player?.name || "").trim())}">${escapeHtml(`${String(player?.name || "").trim()} • ${Math.max(0, Math.floor(Number(player?.districtCount || 0)))} districtů`)}</option>`)].join("")
        : '<option value="">Žádný dostupný cíl</option>';
      if (modalState.players.some((player) => String(player?.name || "").trim() === previous)) targetSelect.value = previous;
      else if (modalState.players[0]?.name) targetSelect.value = String(modalState.players[0].name).trim();
    };
    const renderDistrictOptions = () => {
      const target = selectedPlayer();
      const previous = String(districtSelect.value || "").trim();
      const districts = (Array.isArray(window.Empire.districts) ? window.Empire.districts : [])
        .filter((district) => normalizeOwnerName(district?.ownerNick || district?.owner_username || district?.ownerUsername || district?.owner) === normalizeOwnerName(target?.name))
        .sort((a, b) => String(a?.id || "").localeCompare(String(b?.id || ""), "cs", { numeric: true }));
      districtSelect.innerHTML = ['<option value="">Jakýkoli district</option>', ...districts.map((district) => `<option value="${escapeHtml(String(district?.id || "").trim())}">#${escapeHtml(String(district?.id || "").trim())} • ${escapeHtml(String(district?.name || "Distrikt").trim())}</option>`)].join("");
      if (previous && districts.some((district) => String(district?.id || "").trim() === previous)) districtSelect.value = previous;
    };
    const renderResourceOptions = () => {
      const availability = getBountyModalResourceAvailability();
      const currentDrugKey = String(drugTypeSelect.value || "").trim();
      const currentMaterialKey = String(materialTypeSelect.value || "").trim();
      drugTypeSelect.innerHTML = storageDrugTypes.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.name)} • ${Math.max(0, Math.floor(Number(availability[item.key] || 0)))} ks</option>`).join("");
      materialTypeSelect.innerHTML = factorySupplyTypes.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.name)} • ${Math.max(0, Math.floor(Number(availability[item.key] || 0)))} ks</option>`).join("");
      drugTypeSelect.value = storageDrugTypes.some((item) => item.key === currentDrugKey) ? currentDrugKey : (storageDrugTypes[0]?.key || "");
      materialTypeSelect.value = factorySupplyTypes.some((item) => item.key === currentMaterialKey) ? currentMaterialKey : (factorySupplyTypes[0]?.key || "");
    };
    const syncInputs = () => {
      const availability = getBountyModalResourceAvailability();
      const cashMax = Math.max(0, Math.floor(Number(availability.cash || 0)));
      cashRange.max = String(cashMax);
      cashInput.max = String(cashMax);
      const cashValue = Math.min(cashMax, Math.max(Math.floor(Number(cashRange.value || 0)), Math.floor(Number(cashInput.value || 0))));
      cashRange.value = String(cashValue);
      cashInput.value = String(cashValue);
      clampIntInput(drugsInput, Number(availability[String(drugTypeSelect.value || "").trim()] || 0));
      clampIntInput(materialsInput, Number(availability[String(materialTypeSelect.value || "").trim()] || 0));
      cashAvailable.textContent = `Máš: ${cashMax.toLocaleString("cs-CZ")}$`;
      drugsAvailable.textContent = `Máš: ${Math.max(0, Math.floor(Number(availability[String(drugTypeSelect.value || "").trim()] || 0))).toLocaleString("cs-CZ")} ks`;
      materialsAvailable.textContent = `Máš: ${Math.max(0, Math.floor(Number(availability[String(materialTypeSelect.value || "").trim()] || 0))).toLocaleString("cs-CZ")} ks`;
    };
    const syncTargetCard = () => {
      const target = selectedPlayer();
      if (!target) {
        targetName.textContent = "Nevybrán cíl"; targetAlliance.textContent = "Aliance: Bez aliance"; targetDistricts.textContent = "Districtů: 0"; targetActivity.textContent = "Poslední aktivita: -"; targetThreat.textContent = "Low threat"; targetThreat.dataset.tone = "low"; targetAvatar.src = ""; targetAvatar.classList.add("is-empty"); targetAvatarFallback.textContent = "??"; return null;
      }
      const threat = resolveBountyThreatLevel(Math.max(0, Math.floor(Number(target?.districtCount || 0))));
      targetName.textContent = String(target?.name || "Hráč");
      targetAlliance.textContent = `Aliance: ${String(target?.allianceName || "").trim() || "Bez aliance"}`;
      targetDistricts.textContent = `Districtů: ${Math.max(0, Math.floor(Number(target?.districtCount || 0)))}`;
      targetActivity.textContent = `Poslední aktivita: ${resolveBountyLastActivityLabel(target)}`;
      targetThreat.textContent = threat.label;
      targetThreat.dataset.tone = threat.tone;
      targetAvatarFallback.textContent = String(target?.name || "??").trim().slice(0, 2).toUpperCase() || "??";
      if (String(target?.avatar || "").trim()) { targetAvatar.src = String(target.avatar).trim(); targetAvatar.classList.remove("is-empty"); } else { targetAvatar.src = ""; targetAvatar.classList.add("is-empty"); }
      return target;
    };
    const collectRewards = () => {
      const rewards = [];
      const cashAmount = Math.max(0, Math.floor(Number(cashInput.value || cashRange.value || 0)));
      const drugAmount = Math.max(0, Math.floor(Number(drugsInput.value || 0)));
      const materialAmount = Math.max(0, Math.floor(Number(materialsInput.value || 0)));
      if (cashAmount > 0) rewards.push({ key: "cash_bundle", label: "Cash", amount: cashAmount });
      if (selectedDrug() && drugAmount > 0) rewards.push({ key: selectedDrug().key, label: selectedDrug().name, amount: drugAmount });
      if (selectedMaterial() && materialAmount > 0) rewards.push({ key: selectedMaterial().key, label: selectedMaterial().name, amount: materialAmount });
      return rewards;
    };
    const syncPreview = () => {
      const target = syncTargetCard();
      const rewards = collectRewards();
      const totalValue = rewards.reduce((sum, reward) => sum + (reward.key === "cash_bundle" ? reward.amount : reward.amount * getBountyUnitValue(reward.key)), 0);
      const progressPct = Math.max(0, Math.min(100, Math.round((totalValue / BOUNTY_HUNT_MODE_THRESHOLD) * 100)));
      previewTarget.textContent = target?.name || "Nevybrán cíl";
      previewValue.textContent = formatBountyMoneyValue(totalValue);
      previewType.textContent = formatBountyObjectiveLabel(getSelectedObjectiveType());
      previewDuration.textContent = `${getSelectedDurationHours()}h`;
      previewAnonymous.textContent = anonymousInput.checked ? "Anonymní" : "Veřejné";
      if (totalValue >= BOUNTY_HUNT_MODE_THRESHOLD) {
        huntModeState.textContent = "HUNT MODE AKTIVNÍ";
        huntModeState.dataset.mode = "active";
        huntModeProgressFill.style.width = "100%";
        huntModeProgressLabel.textContent = "Celé město dostalo důvod jít po cíli.";
      } else {
        huntModeState.textContent = "Hunt mode se plní";
        huntModeState.dataset.mode = "charging";
        huntModeProgressFill.style.width = `${progressPct}%`;
        huntModeProgressLabel.textContent = `Do HUNT MODE zbývá ${formatBountyMoneyValue(BOUNTY_HUNT_MODE_THRESHOLD - totalValue)}.`;
      }
      districtField.hidden = getSelectedObjectiveType() !== "occupy-sector";
      districtSelect.disabled = getSelectedObjectiveType() !== "occupy-sector";
      submitBtn.disabled = !target || rewards.length === 0;
      return { target, rewards };
    };
    const renderBoard = () => {
      const activeEntries = (Array.isArray(modalState.bounties) ? modalState.bounties : [])
        .filter((entry) => String(entry?.status || "active").trim() === "active")
        .slice(0, 8);
      boardBody.innerHTML = activeEntries.map((entry) => `
        <tr>
          <td>${escapeHtml(String(entry?.targetName || "-").trim() || "-")}</td>
          <td>${String(entry?.districtId || "").trim() ? `#${escapeHtml(String(entry.districtId).trim())}` : "Jakýkoli"}</td>
          <td>${escapeHtml(formatBountyRewardSummary(entry?.rewards) || "-")}</td>
          <td>${entry?.isAnonymous === false ? "Veřejná" : "Anonymní"}</td>
          <td>${escapeHtml(formatBountyExpiryLabel(entry?.expiresAt) || "-")}</td>
        </tr>`).join("");
      boardEmpty.hidden = activeEntries.length > 0;
    };
    const refreshView = () => {
      modalState.players = collectBountyEligiblePlayers();
      renderTargetOptions();
      renderDistrictOptions();
      renderResourceOptions();
      syncInputs();
      syncPreview();
      renderBoard();
    };
    const reloadBoard = async () => {
      try {
        modalState.bounties = await loadPersistedBounties();
      } catch {
        modalState.bounties = readBountyEntries();
      }
      renderBoard();
    };
    const closeModal = () => {
      root.classList.add("hidden");
      setMobileTopbarCoveredByPrimaryModal(false);
    };
    const openModal = async () => {
      root.classList.remove("hidden");
      setMobileTopbarCoveredByPrimaryModal(true);
      try {
        refreshView();
        await reloadBoard();
      } catch (error) {
        console.error("Bounty open failed", error);
        pushEvent("Bounty kartu se nepodařilo načíst.");
      }
    };
    if (root.dataset.bountyV2Bound !== "1") {
      root.dataset.bountyV2Bound = "1";
      const openFromTrigger = (event) => {
        if (event?.preventDefault) event.preventDefault();
        const now = Date.now();
        if (now - modalState.openLock < 220) return;
        modalState.openLock = now;
        void openModal().catch(() => pushEvent("Bounty kartu se nepodařilo načíst."));
      };
      const trigger = document.getElementById("map-bounty-open");
      if (trigger && trigger.dataset.bountyBoundV2 !== "1") {
        trigger.dataset.bountyBoundV2 = "1";
        trigger.addEventListener("click", openFromTrigger);
        trigger.addEventListener("pointerdown", openFromTrigger);
      }
      window.Empire.openBountyModalShortcut = () => openFromTrigger();
      document.addEventListener("empire:open-bounty-modal", openFromTrigger);
      backdrop?.addEventListener("click", closeModal);
      closeBtn?.addEventListener("click", closeModal);
      cancelBtn?.addEventListener("click", closeModal);
      targetSelect.addEventListener("change", () => { renderDistrictOptions(); syncPreview(); });
      districtSelect.addEventListener("change", syncPreview);
      cashRange.addEventListener("input", () => { cashInput.value = String(Math.max(0, Math.floor(Number(cashRange.value || 0)))); syncPreview(); });
      cashInput.addEventListener("input", () => { cashRange.value = String(clampIntInput(cashInput, Number(cashInput.max || 0))); syncPreview(); });
      drugsInput.addEventListener("input", () => { clampIntInput(drugsInput, Number(drugsInput.max || 0)); syncPreview(); });
      materialsInput.addEventListener("input", () => { clampIntInput(materialsInput, Number(materialsInput.max || 0)); syncPreview(); });
      drugTypeSelect.addEventListener("change", () => { syncInputs(); syncPreview(); });
      materialTypeSelect.addEventListener("change", () => { syncInputs(); syncPreview(); });
      anonymousInput.addEventListener("change", syncPreview);
      objectiveInputs.forEach((input) => input.addEventListener("change", syncPreview));
      durationInputs.forEach((input) => input.addEventListener("change", syncPreview));
      document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !root.classList.contains("hidden")) closeModal(); });
      submitBtn.addEventListener("click", async () => {
        const preview = syncPreview();
        if (!preview.target) return pushEvent("Vyber cílového hráče pro bounty.");
        if (!preview.rewards.length) return pushEvent("Bounty musí obsahovat alespoň jednu odměnu.");
        const spentRewards = [];
        for (const reward of preview.rewards) {
          const spendResult = spendBountyResource(reward.key, reward.amount);
          if (!spendResult?.ok) {
            spentRewards.forEach((entry) => restoreBountyResource(entry.key, entry.amount));
            pushEvent(`Nedostatek zdroje pro bounty: ${reward.label}.`);
            syncInputs();
            syncPreview();
            return;
          }
          spentRewards.push(reward);
        }
        try {
          await createPersistedBounty({
            targetUsername: preview.target.name,
            targetDistrictId: getSelectedObjectiveType() === "occupy-sector" ? (String(districtSelect.value || "").trim() || null) : null,
            rewards: preview.rewards,
            objectiveType: getSelectedObjectiveType(),
            isAnonymous: Boolean(anonymousInput.checked),
            durationHours: getSelectedDurationHours()
          });
          pushEvent(String(districtSelect.value || "").trim() ? `Bounty vypsána na ${preview.target.name} za #${String(districtSelect.value || "").trim()}.` : `Bounty vypsána na ${preview.target.name}.`);
          refreshView();
          await reloadBoard();
        } catch (error) {
          preview.rewards.forEach((reward) => restoreBountyResource(reward.key, reward.amount));
          const errorCode = String(error?.message || error?.error || "").trim();
          if (errorCode === "allied_target") pushEvent("Na členy vlastní aliance nelze bounty vypsat.");
          else if (errorCode === "invalid_target_district") pushEvent("Vybraný district už cíli nepatří.");
          else if (errorCode === "missing_target") pushEvent("Cílový hráč už není dostupný.");
          else pushEvent("Bounty se nepodařilo uložit.");
          syncInputs();
          syncPreview();
        }
      });
    }
    refreshView();
    void loadPersistedBounties().then((entries) => { modalState.bounties = entries; renderBoard(); syncBountyDistrictMarkers(entries); }).catch(() => syncBountyDistrictMarkers([]));
  }

  return {
    initBountyModalV2,
    resolveBountyThreatLevel,
    resolveBountyLastActivityLabel,
    collectBountyEligiblePlayers,
    getBountyModalResourceAvailability,
    formatBountyRewardSummary,
    ensureBountyModalShell
  };
};
