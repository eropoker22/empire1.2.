window.Empire = window.Empire || {};
window.Empire.UIAlliance = window.Empire.UIAlliance || {};

window.Empire.UIAlliance.createFacade = function createFacade(deps = {}) {
  const {
    createAllianceModalController = null,
    allianceModalDeps = {}
  } = deps;

  let allianceModalController = null;

  function getAllianceModalController() {
    if (allianceModalController) return allianceModalController;
    if (typeof createAllianceModalController !== "function") return null;
    allianceModalController = createAllianceModalController(allianceModalDeps);
    return allianceModalController;
  }

  function initAllianceModal() {
    return getAllianceModalController()?.initAllianceModal?.();
  }

  return {
    getAllianceModalController,
    initAllianceModal
  };
};
