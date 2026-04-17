window.Empire = window.Empire || {};
window.Empire.UIHelpers = window.Empire.UIHelpers || {};

window.Empire.UIHelpers.createRuntimeFacade = function createRuntimeFacade(deps = {}) {
  const {
    createStatusController = null,
    createSettingsModalController = null,
    createHeatController = null,
    roundDeps = {},
    settingsDeps = {},
    policeDeps = {}
  } = deps;

  let roundStatusController = null;
  let settingsModalController = null;
  let policeHeatController = null;

  function getRoundStatusController() {
    if (roundStatusController) return roundStatusController;
    if (typeof createStatusController !== "function") return null;
    roundStatusController = createStatusController(roundDeps);
    return roundStatusController;
  }

  function getSettingsModalController() {
    if (settingsModalController) return settingsModalController;
    if (typeof createSettingsModalController !== "function") return null;
    settingsModalController = createSettingsModalController(settingsDeps);
    return settingsModalController;
  }

  function getPoliceHeatController() {
    if (policeHeatController) return policeHeatController;
    if (typeof createHeatController !== "function") return null;
    policeHeatController = createHeatController(policeDeps);
    return policeHeatController;
  }

  return {
    getRoundStatusController,
    getSettingsModalController,
    getPoliceHeatController
  };
};
