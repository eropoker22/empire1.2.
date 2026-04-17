window.Empire = window.Empire || {};
window.Empire.UIPlayer = window.Empire.UIPlayer || {};

window.Empire.UIPlayer.createFacade = function createFacade(deps = {}) {
  const {
    createProfileModalController = null,
    createProfileStateController = null,
    createSessionController = null,
    profileModalDeps = {},
    profileStateDeps = {},
    authSessionDeps = {}
  } = deps;

  let profileModalController = null;
  let profileStateController = null;
  let authSessionController = null;

  function getProfileModalController() {
    if (profileModalController) return profileModalController;
    if (typeof createProfileModalController !== "function") return null;
    profileModalController = createProfileModalController(profileModalDeps);
    return profileModalController;
  }

  function getProfileStateController() {
    if (profileStateController) return profileStateController;
    if (typeof createProfileStateController !== "function") return null;
    profileStateController = createProfileStateController({
      ...profileStateDeps,
      hydrateProfileModal: (profile) => getProfileModalController()?.hydrateProfileModal?.(profile)
    });
    return profileStateController;
  }

  function getAuthSessionController() {
    if (authSessionController) return authSessionController;
    if (typeof createSessionController !== "function") return null;
    authSessionController = createSessionController(authSessionDeps);
    return authSessionController;
  }

  return {
    getProfileModalController,
    getProfileStateController,
    getAuthSessionController
  };
};
