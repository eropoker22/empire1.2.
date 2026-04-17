window.Empire = window.Empire || {};
window.Empire.UIMarket = window.Empire.UIMarket || {};

window.Empire.UIMarket.createModalController = function createModalController(deps = {}) {
  const {
    uiDom,
    MARKET_BLACK_RESOURCES = [],
    MARKET_SERVER_RESOURCES = [],
    MARKET_BLACK_RESOURCE_GROUPS = [],
    getCachedMarket = () => null,
    setCachedMarket = () => {},
    getLocalMarketState = () => ({}),
    renderMarketState = () => {},
    pushEvent = () => {},
    createLocalMarketOrder = () => ({ error: "unavailable" }),
    cancelLocalMarketOrder = () => ({ error: "unavailable" }),
    recordVerifiedIntelEvent = () => {},
    syncGuestEconomyFromMarket = () => {},
    updateEconomy = () => {},
    setMobileTopbarCoveredByPrimaryModal = () => {},
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase(),
    isDistrictOwnedByPlayer = () => false,
    isOnboardingDemoScenarioActive = () => false,
    resolveDistrictById = () => null
  } = deps;

  function initMarketModal(handlers = {}) {
    const { setMarketRefreshHandler = () => {}, setMarketModalOpenHandler = () => {} } = handlers;
    const openBtn = uiDom.byId("market-open");
    const root = uiDom.byId("market-modal");
    const backdrop = uiDom.byId("market-modal-backdrop");
    const closeBtn = uiDom.byId("market-modal-close");
    const resourceSelect = uiDom.byId("market-resource-select");
    const sideSelect = uiDom.byId("market-side-select");
    const quantityInput = uiDom.byId("market-quantity-input");
    const priceInput = uiDom.byId("market-price-input");
    const createBtn = uiDom.byId("market-create-order");
    if (!root || !openBtn || !resourceSelect || !sideSelect || !quantityInput || !priceInput || !createBtn) return;
    const heroTitle = uiDom.query(root, ".market-modal__hero-title");
    const heroCopy = uiDom.query(root, ".market-modal__hero-copy");
    const state = { tab: "server" };
    const getResourcesForActiveTab = () => state.tab === "black" ? MARKET_BLACK_RESOURCES : MARKET_SERVER_RESOURCES;
    const ensureSelectedResource = () => {
      const resources = getResourcesForActiveTab();
      const selected = String(resourceSelect.value || "").trim();
      if (resources.some((item) => item.resourceKey === selected)) return selected;
      return resources[0]?.resourceKey || "";
    };
    const renderResourceOptions = () => {
      if (state.tab === "black") {
        resourceSelect.innerHTML = MARKET_BLACK_RESOURCE_GROUPS.map((group) => `
            <optgroup label="${group.label}">
              ${group.options.map((item) => `<option value="${item.resourceKey}">${item.name}</option>`).join("")}
            </optgroup>
          `).join("");
      } else {
        resourceSelect.innerHTML = MARKET_SERVER_RESOURCES.map((item) => `<option value="${item.resourceKey}">${item.name}</option>`).join("");
      }
      resourceSelect.value = ensureSelectedResource();
      root.dataset.marketTab = state.tab;
      createBtn.textContent = state.tab === "black" ? "Vložit kontrakt" : "Vložit příkaz";
      uiDom.queryAll(root, "[data-market-tab]").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-market-tab") === state.tab);
      });
      if (heroTitle) heroTitle.textContent = state.tab === "black" ? "Black Market kontrakty" : "Server Exchange";
      if (heroCopy) heroCopy.textContent = state.tab === "black"
        ? "Podpultové obchody s látkami, továrními díly a jednotlivými kusy výzbroje. Vyšší riziko, rychlejší marže."
        : "Sleduj serverovou nabídku, poptávku a poslední obchody. Vlož příkaz dřív, než tě ostatní předběhnou.";
    };
    const refreshMarket = async () => {
      const marketBody = uiDom.query(root, ".market-modal__body");
      const marketScrollTop = marketBody?.scrollTop || 0;
      if (!window.Empire.token) {
        setCachedMarket(getLocalMarketState());
        renderResourceOptions();
        renderMarketState(resourceSelect.value, state.tab);
        requestAnimationFrame(() => { if (marketBody) marketBody.scrollTop = marketScrollTop; });
        return;
      }
      const market = await window.Empire.API.getMarket();
      if (market.error) {
        pushEvent(`Market: ${market.error}`);
        return;
      }
      setCachedMarket(market);
      renderResourceOptions();
      renderMarketState(resourceSelect.value, state.tab);
      requestAnimationFrame(() => { if (marketBody) marketBody.scrollTop = marketScrollTop; });
    };
    setMarketRefreshHandler(refreshMarket);
    const openMarketModal = async (tab = "server") => {
      state.tab = tab === "black" ? "black" : "server";
      setMobileTopbarCoveredByPrimaryModal(false);
      root.classList.remove("hidden");
      document.dispatchEvent(new CustomEvent("empire:market-modal-opened", { detail: { open: true } }));
      await refreshMarket();
    };
    setMarketModalOpenHandler(openMarketModal);
    openBtn.addEventListener("click", async () => openMarketModal("server"));
    resourceSelect.addEventListener("change", () => renderMarketState(resourceSelect.value, state.tab));
    createBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const result = createLocalMarketOrder({ resourceKey: resourceSelect.value, side: sideSelect.value, quantity: Number(quantityInput.value), pricePerUnit: Number(priceInput.value) });
        if (result.error) return pushEvent(`Market: ${result.error}`);
        pushEvent("Lokální market příkaz byl vložen.");
        recordVerifiedIntelEvent({ type: "market_order_created", districtId: window.Empire.selectedDistrict?.id ?? null, resourceKey: resourceSelect.value, side: sideSelect.value, quantity: Number(quantityInput.value), pricePerUnit: Number(priceInput.value) });
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.createMarketOrder({ resourceKey: resourceSelect.value, side: sideSelect.value, quantity: Number(quantityInput.value), pricePerUnit: Number(priceInput.value) });
      if (result.error) return pushEvent(`Market: ${result.error}`);
      pushEvent("Příkaz byl vložen na trh.");
      recordVerifiedIntelEvent({ type: "market_order_created", districtId: window.Empire.selectedDistrict?.id ?? null, resourceKey: resourceSelect.value, side: sideSelect.value, quantity: Number(quantityInput.value), pricePerUnit: Number(priceInput.value) });
      await refreshMarket();
      updateEconomy(await window.Empire.API.getEconomy());
    });
    root.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tabButton = target.closest("[data-market-tab]");
      if (tabButton instanceof HTMLElement) {
        const nextTab = String(tabButton.dataset.marketTab || "").trim();
        if ((nextTab === "server" || nextTab === "black") && nextTab !== state.tab) {
          state.tab = nextTab;
          renderResourceOptions();
          renderMarketState(resourceSelect.value, state.tab);
        }
        return;
      }
      const cancelButton = target.closest("[data-market-cancel]");
      if (!(cancelButton instanceof HTMLElement)) return;
      const orderId = cancelButton.dataset.marketCancel;
      if (!orderId) return;
      if (!window.Empire.token) {
        const result = cancelLocalMarketOrder(orderId);
        if (result.error) return pushEvent(`Market: ${result.error}`);
        const cachedMarket = getCachedMarket();
        if (cachedMarket) {
          cachedMarket.myOrders = (cachedMarket.myOrders || []).filter((order) => order.id !== orderId);
          cachedMarket.orderBook = (cachedMarket.orderBook || []).filter((order) => order.id !== orderId);
          renderMarketState(resourceSelect.value, state.tab);
        }
        pushEvent("Lokální market příkaz byl zrušen.");
        recordVerifiedIntelEvent({ type: "market_order_cancelled", districtId: window.Empire.selectedDistrict?.id ?? null, resourceKey: resourceSelect.value });
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.cancelMarketOrder(orderId);
      if (result.error) return pushEvent(`Market: ${result.error}`);
      const cachedMarket = getCachedMarket();
      if (cachedMarket) {
        cachedMarket.myOrders = (cachedMarket.myOrders || []).filter((order) => order.id !== orderId);
        cachedMarket.orderBook = (cachedMarket.orderBook || []).filter((order) => order.id !== orderId);
        renderMarketState(resourceSelect.value, state.tab);
      }
      pushEvent("Příkaz byl zrušen.");
      recordVerifiedIntelEvent({ type: "market_order_cancelled", districtId: window.Empire.selectedDistrict?.id ?? null, resourceKey: resourceSelect.value });
      await refreshMarket();
      updateEconomy(await window.Empire.API.getEconomy());
    });
    const close = () => {
      root.classList.add("hidden");
      setMobileTopbarCoveredByPrimaryModal(false);
    };
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  }

  async function openMarketModal(preferredTab = "server", marketModalOpenHandler = null) {
    if (typeof marketModalOpenHandler === "function") {
      await marketModalOpenHandler(preferredTab);
      return true;
    }
    const fallbackRoot = uiDom.byId("market-modal");
    if (fallbackRoot) {
      fallbackRoot.classList.remove("hidden");
      return true;
    }
    return false;
  }

  function initMarketBuildingShortcuts(handlers = {}) {
    const { setMarketBuildingShortcutRefreshHandler = () => {} } = handlers;
    const root = document.getElementById("market-building-shortcuts");
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll("[data-market-building-base-name]"));
    if (!buttons.length) return;
    const lockFlashTimers = new WeakMap();
    const onboardingShortcutNames = new Set(["lekarna","drug lab","druglab","tovarna","zbrojovka","fitness club","fitness centrum","kasino","casino","herna","arcade","autosalon","auto salon","smenarna","exchange","restaurace","restaurant","vecerka","convenience store"]);
    const normalizeBuildingName = (value) => normalizeOwnerName(String(value || "").replace(/\s+/g, " ").trim());
    const findBuildingIndexInDistrict = (district, baseName) => {
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const target = normalizeBuildingName(baseName);
      if (!target) return -1;
      for (let index = 0; index < buildings.length; index += 1) {
        if (normalizeBuildingName(buildings[index]) === target) return index;
      }
      return -1;
    };
    const getOwnedDistricts = () => (Array.isArray(window.Empire.districts) ? window.Empire.districts : []).filter((district) => isDistrictOwnedByPlayer(district));
    const resolveOnboardingShortcutFallback = (baseName, options = {}) => {
      if (!isOnboardingDemoScenarioActive()) return null;
      const normalizedBaseName = normalizeBuildingName(baseName);
      if (!onboardingShortcutNames.has(normalizedBaseName)) return null;
      const ownedDistricts = Array.isArray(options.ownedDistricts) ? options.ownedDistricts : getOwnedDistricts();
      const district = ownedDistricts[0] || null;
      if (!district) return null;
      return { district, buildingIndex: -1, onboardingFallback: true };
    };
    const resolveOwnedBuildingInstance = (baseName, options = {}) => {
      const ownedDistricts = Array.isArray(options.ownedDistricts) ? options.ownedDistricts : getOwnedDistricts();
      if (!ownedDistricts.length) return null;
      const targetBaseName = normalizeBuildingName(baseName);
      const forceFirstOwnedMatch = targetBaseName === "drug lab" || targetBaseName === "druglab";
      const selectedRaw = window.Empire.selectedDistrict;
      const selected = selectedRaw?.id != null ? resolveDistrictById(selectedRaw.id, window.Empire.districts) || selectedRaw : selectedRaw;
      const preferredDistricts = [];
      const preferredIds = new Set();
      if (!forceFirstOwnedMatch && selected && isDistrictOwnedByPlayer(selected)) {
        preferredDistricts.push(selected);
        preferredIds.add(String(selected.id));
      }
      const scanDistricts = [...preferredDistricts, ...ownedDistricts.filter((district) => !preferredIds.has(String(district?.id)))];
      for (let i = 0; i < scanDistricts.length; i += 1) {
        const district = scanDistricts[i];
        const buildingIndex = findBuildingIndexInDistrict(district, baseName);
        if (buildingIndex >= 0) return { district, buildingIndex };
      }
      return null;
    };
    const refreshState = () => {
      const ownedDistricts = getOwnedDistricts();
      const hasOwnedTerritory = ownedDistricts.length > 0;
      buttons.forEach((button) => {
        const label = String(button.dataset.marketBuildingLabel || button.dataset.marketBuildingBaseName || "Budova");
        const baseName = String(button.dataset.marketBuildingBaseName || "").trim();
        const instance = resolveOwnedBuildingInstance(baseName, { ownedDistricts }) || resolveOnboardingShortcutFallback(baseName, { ownedDistricts });
        const unlocked = Boolean(instance);
        const buildingIndex = unlocked ? Number(instance.buildingIndex) : -1;
        const usesOnboardingFallback = Boolean(instance?.onboardingFallback);
        button.disabled = false;
        button.setAttribute("aria-disabled", unlocked ? "false" : "true");
        button.classList.toggle("is-unlocked", unlocked);
        button.classList.toggle("is-locked", !unlocked);
        button.dataset.marketBuildingUnlocked = unlocked ? "1" : "0";
        button.dataset.marketBuildingIndex = unlocked && buildingIndex >= 0 ? String(buildingIndex) : "";
        button.dataset.marketBuildingDistrictId = unlocked ? String(instance.district?.id ?? "") : "";
        button.dataset.marketBuildingOnboardingFallback = usesOnboardingFallback ? "1" : "0";
        if (unlocked) button.title = usesOnboardingFallback ? `${label}: Otevřít onboarding detail budovy` : `${label}: Otevřít detail budovy z tvého území`;
        else if (!hasOwnedTerritory) button.title = `${label}: Neovládáš žádný distrikt`;
        else button.title = `${label}: Tuto budovu ve svém území nevlastníš`;
      });
    };
    setMarketBuildingShortcutRefreshHandler(refreshState);
    refreshState();
    const flashLockedShortcut = (button) => {
      if (!button) return;
      const existingTimer = lockFlashTimers.get(button);
      if (existingTimer) window.clearTimeout(existingTimer);
      button.classList.add("is-lock-flash");
      const timer = window.setTimeout(() => {
        button.classList.remove("is-lock-flash");
        lockFlashTimers.delete(button);
      }, 2000);
      lockFlashTimers.set(button, timer);
    };
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        refreshState();
        if (button.dataset.marketBuildingUnlocked !== "1") return flashLockedShortcut(button);
        const baseName = String(button.dataset.marketBuildingBaseName || "").trim();
        const cachedDistrictId = String(button.dataset.marketBuildingDistrictId || "").trim();
        const cachedIndexText = String(button.dataset.marketBuildingIndex || "").trim();
        const cachedIndexRaw = cachedIndexText === "" ? Number.NaN : Number(cachedIndexText);
        const cachedBuildingIndex = Number.isFinite(cachedIndexRaw) ? Math.max(0, Math.floor(cachedIndexRaw)) : -1;
        let district = cachedDistrictId ? resolveDistrictById(cachedDistrictId, window.Empire.districts) : null;
        let buildingIndex = cachedBuildingIndex;
        const onboardingFallbackActive = button.dataset.marketBuildingOnboardingFallback === "1";
        if (!district || buildingIndex < 0) {
          const instance = resolveOwnedBuildingInstance(baseName) || resolveOnboardingShortcutFallback(baseName);
          if (instance?.district) district = instance.district;
          if (Number.isFinite(Number(instance?.buildingIndex))) buildingIndex = Math.max(0, Math.floor(Number(instance.buildingIndex)));
        }
        const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
        const resolvedBaseName = String((buildingIndex >= 0 && buildings[buildingIndex]) || baseName || "Neznámá budova");
        const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
        const variantRaw = buildingIndex >= 0 ? String(overrides[buildingIndex] || "").trim() : "";
        const detailInput = { baseName: resolvedBaseName, variantName: variantRaw && variantRaw !== resolvedBaseName ? variantRaw : null, districtId: district?.id ?? null, buildingIndex: buildingIndex >= 0 ? buildingIndex : (onboardingFallbackActive ? null : buildingIndex) };
        if (window.Empire.Map?.showBuildingDetail) {
          try {
            window.Empire.Map.showBuildingDetail(detailInput, district);
            return;
          } catch (error) {
            return pushEvent(`Detail budovy se nepodařilo otevřít: ${error instanceof Error ? error.message : "neznámá chyba"}`);
          }
        }
        pushEvent("Detail budovy není dostupný.");
      });
    });
  }

  function refreshMarketBuildingShortcuts(marketBuildingShortcutRefreshHandler = null) {
    if (typeof marketBuildingShortcutRefreshHandler === "function") marketBuildingShortcutRefreshHandler();
  }

  return {
    initMarketModal,
    openMarketModal,
    initMarketBuildingShortcuts,
    refreshMarketBuildingShortcuts
  };
};
