window.Empire = window.Empire || {};
window.Empire.UIMarket = window.Empire.UIMarket || {};

window.Empire.UIMarket.createFacade = function createFacade(deps = {}) {
  const {
    createRenderer = null,
    createEconomyController = null,
    createModalController = null,
    getShortcutController = () => null,
    uiDom = null,
    marketResourceLabels = {},
    resolveMoneyBreakdown = () => ({}),
    resourceKeyToBalanceKey = () => "",
    getCachedMarket = () => null,
    setCachedMarket = () => {},
    economyControllerDeps = {},
    modalControllerDeps = {},
    getMarketRefreshHandler = () => null,
    setMarketRefreshHandler = () => {},
    getMarketModalOpenHandler = () => null,
    setMarketModalOpenHandler = () => {},
    getMarketBuildingShortcutRefreshHandler = () => null,
    setMarketBuildingShortcutRefreshHandler = () => {}
  } = deps;

  let marketRenderer = null;
  let marketEconomyController = null;
  let marketModalController = null;

  function getMarketRenderer() {
    if (marketRenderer) return marketRenderer;
    if (typeof createRenderer !== "function") return null;
    marketRenderer = createRenderer({
      resourceLabels: marketResourceLabels,
      resolveMoneyBreakdown,
      resourceKeyToBalanceKey,
      dom: uiDom
    });
    return marketRenderer;
  }

  function getMarketEconomyController() {
    if (marketEconomyController) return marketEconomyController;
    if (typeof createEconomyController !== "function") return null;
    marketEconomyController = createEconomyController(economyControllerDeps);
    return marketEconomyController;
  }

  function getMarketModalController() {
    if (marketModalController) return marketModalController;
    if (typeof createModalController !== "function") return null;
    marketModalController = createModalController(modalControllerDeps);
    return marketModalController;
  }

  function initMarketModal() {
    return getMarketModalController()?.initMarketModal?.({
      setMarketRefreshHandler: (handler) => {
        setMarketRefreshHandler(typeof handler === "function" ? handler : null);
      },
      setMarketModalOpenHandler: (handler) => {
        setMarketModalOpenHandler(typeof handler === "function" ? handler : null);
      }
    });
  }

  async function openMarketModal(preferredTab = "server") {
    return getMarketModalController()?.openMarketModal?.(preferredTab, getMarketModalOpenHandler());
  }

  function refreshMarketBuildingShortcuts() {
    return getShortcutController()?.refreshMarketBuildingShortcuts?.(getMarketBuildingShortcutRefreshHandler());
  }

  function initMarketBuildingShortcuts() {
    return getShortcutController()?.initMarketBuildingShortcuts?.({
      setMarketBuildingShortcutRefreshHandler: (handler) => {
        setMarketBuildingShortcutRefreshHandler(typeof handler === "function" ? handler : null);
      }
    });
  }

  function formatMarketResourceName(resourceKey) {
    const renderer = getMarketRenderer();
    if (renderer?.formatMarketResourceName) {
      return renderer.formatMarketResourceName(resourceKey);
    }
    return marketResourceLabels[resourceKey] || String(resourceKey || "").replace(/_/g, " ");
  }

  function formatCompactMarketResourceName(resourceKey) {
    const renderer = getMarketRenderer();
    if (renderer?.formatCompactMarketResourceName) {
      return renderer.formatCompactMarketResourceName(resourceKey);
    }
    return formatMarketResourceName(resourceKey);
  }

  function renderMarketState(resourceKey, marketTab = "server") {
    const renderer = getMarketRenderer();
    if (renderer?.renderMarketState) {
      renderer.renderMarketState(resourceKey, marketTab, getCachedMarket());
      return;
    }
    void resourceKey;
    void marketTab;
  }

  async function handleMarketUpdate() {
    const root = uiDom?.byId?.("market-modal");
    if (!root || root.classList.contains("hidden") || !getMarketRefreshHandler()) return;
    await getMarketRefreshHandler()();
  }

  function getLocalMarketState() {
    return getMarketEconomyController()?.getLocalMarketState?.() || {};
  }

  function enforceLocalGuestStorageDefaults() {
    return getMarketEconomyController()?.enforceLocalGuestStorageDefaults?.();
  }

  function saveLocalMarketState(state) {
    return getMarketEconomyController()?.saveLocalMarketState?.(state);
  }

  function normalizeLocalMarketBalances(balances) {
    return getMarketEconomyController()?.normalizeLocalMarketBalances?.(balances);
  }

  function spendLocalMoney(balances, amount) {
    return getMarketEconomyController()?.spendLocalMoney?.(balances, amount) || false;
  }

  function addLocalMoney(balances, amount, bucket = "clean") {
    return getMarketEconomyController()?.addLocalMoney?.(balances, amount, bucket);
  }

  function getEconomySnapshotFromDom() {
    return getMarketEconomyController()?.getEconomySnapshotFromDom?.() || {};
  }

  function ensureEconomyCache() {
    return getMarketEconomyController()?.ensureEconomyCache?.() || {};
  }

  function getEconomySnapshot() {
    return getMarketEconomyController()?.getEconomySnapshot?.() || {};
  }

  function trySpendCash(amount) {
    return getMarketEconomyController()?.trySpendCash?.(amount) || { ok: false, reason: "unavailable" };
  }

  function trySpendCleanCash(amount) {
    return getMarketEconomyController()?.trySpendCleanCash?.(amount) || { ok: false, reason: "unavailable" };
  }

  function addCleanCash(amount) {
    return getMarketEconomyController()?.addCleanCash?.(amount) || 0;
  }

  function addDirtyCash(amount) {
    return getMarketEconomyController()?.addDirtyCash?.(amount) || 0;
  }

  function trySpendMaterials(amount) {
    return getMarketEconomyController()?.trySpendMaterials?.(amount) || { ok: false, reason: "unavailable" };
  }

  function addMaterials(amount) {
    return getMarketEconomyController()?.addMaterials?.(amount) || 0;
  }

  function addInfluence(amount) {
    return getMarketEconomyController()?.addInfluence?.(amount) || 0;
  }

  function launderDirtyCash(amount) {
    return getMarketEconomyController()?.launderDirtyCash?.(amount) || { ok: false, reason: "unavailable" };
  }

  return {
    getMarketRenderer,
    getMarketEconomyController,
    getMarketModalController,
    initMarketModal,
    openMarketModal,
    refreshMarketBuildingShortcuts,
    initMarketBuildingShortcuts,
    formatMarketResourceName,
    formatCompactMarketResourceName,
    renderMarketState,
    handleMarketUpdate,
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
    launderDirtyCash
  };
};
