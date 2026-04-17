window.Empire = window.Empire || {};
window.Empire.UICombat = window.Empire.UICombat || {};

window.Empire.UICombat.createFacade = function createFacade(deps = {}) {
  const {
    createInventoryController = null,
    inventoryDeps = {}
  } = deps;

  let inventoryController = null;

  function getInventoryController() {
    if (inventoryController) return inventoryController;
    if (typeof createInventoryController !== "function") return null;
    inventoryController = createInventoryController(inventoryDeps);
    return inventoryController;
  }

  return {
    getInventoryController
  };
};
