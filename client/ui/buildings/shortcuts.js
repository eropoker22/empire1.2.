window.Empire = window.Empire || {};
window.Empire.UIBuildings = window.Empire.UIBuildings || {};

window.Empire.UIBuildings.createShortcutController = function createShortcutController(deps = {}) {
  const {
    getMarketModalController = () => null
  } = deps;

  function refreshMarketBuildingShortcuts(refreshHandler) {
    return getMarketModalController()?.refreshMarketBuildingShortcuts?.(refreshHandler);
  }

  function initMarketBuildingShortcuts(handlers = {}) {
    return getMarketModalController()?.initMarketBuildingShortcuts?.(handlers);
  }

  return {
    refreshMarketBuildingShortcuts,
    initMarketBuildingShortcuts
  };
};
