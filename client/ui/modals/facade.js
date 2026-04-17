window.Empire = window.Empire || {};
window.Empire.UIModals = window.Empire.UIModals || {};

window.Empire.UIModals.createFacade = function createFacade(deps = {}) {
  const {
    createDistrictActionsController = null,
    districtActionsDeps = {},
    actionConfirmPopupController = null
  } = deps;

  let districtActionsController = null;

  function getDistrictActionsController() {
    if (districtActionsController) return districtActionsController;
    if (typeof createDistrictActionsController !== "function") return null;
    districtActionsController = createDistrictActionsController(districtActionsDeps);
    return districtActionsController;
  }

  function showActionConfirmPopup(payload = {}) {
    actionConfirmPopupController?.show?.({
      tone: payload.tone || "attack",
      title: payload.title || "AKCE POTVRZENA",
      subtitle: payload.subtitle || "",
      durationMs: 2600
    });
  }

  return {
    getDistrictActionsController,
    showActionConfirmPopup
  };
};
