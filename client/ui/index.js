window.Empire = window.Empire || {};
window.Empire.UIIndex = window.Empire.UIIndex || {};

window.Empire.UIIndex.createFeatureRegistry = function createFeatureRegistry(deps = {}) {
  const formatHelpers = window.Empire.UIHelpers?.createFormatHelpers?.() || null;
  const renderHelpers = window.Empire.UIHelpers?.createRenderHelpers?.({
    escapeHtml: formatHelpers?.escapeHtml,
    onError: deps.onRenderError
  }) || null;
  const storageHelpers = window.Empire.UIHelpers?.createStorageHelpers?.({
    storage: deps.storage || null
  }) || null;
  const runtimeFacade = window.Empire.UIHelpers?.createRuntimeFacade?.(deps.runtime || {}) || null;
  const combatHelpers = window.Empire.UICombat?.createHelperController?.(deps.combat || {}) || null;
  const combatFacade = window.Empire.UICombat?.createFacade?.(deps.combatFacade || {}) || null;
  const playerPopulation = window.Empire.UIPlayer?.createPopulationController?.(deps.player || {}) || null;
  const buildingShortcuts = window.Empire.UIBuildings?.createShortcutController?.(deps.buildings || {}) || null;
  const notificationsFacade = window.Empire.UINotifications?.createFacade?.(deps.notifications || {}) || null;
  const playerFacade = window.Empire.UIPlayer?.createFacade?.(deps.playerFacade || {}) || null;
  const marketFacade = window.Empire.UIMarket?.createFacade?.(deps.market || {}) || null;
  const modalsFacade = window.Empire.UIModals?.createFacade?.(deps.modalsFacade || {}) || null;
  const districtWarnings = window.Empire.UIModals?.createDistrictWarningController?.(deps.modals || {}) || null;
  const allianceFacade = window.Empire.UIAlliance?.createFacade?.(deps.alliance || {}) || null;

  return {
    formatHelpers,
    renderHelpers,
    storageHelpers,
    runtimeFacade,
    combatHelpers,
    combatFacade,
    playerPopulation,
    buildingShortcuts,
    notificationsFacade,
    playerFacade,
    marketFacade,
    modalsFacade,
    districtWarnings,
    allianceFacade
  };
};
