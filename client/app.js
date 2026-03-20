window.Empire = {
  token: null,
  player: null,
  districts: [],
  selectedDistrict: null
};

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("empire_token");
  if (token) {
    window.Empire.token = token;
  }

  window.Empire.UI.init();
  window.Empire.UI.initProfileModal();
  window.Empire.UI.initSettingsModal();
  window.Empire.Map.init();
  window.Empire.API.init();
  window.Empire.WS.init();

  if (token) {
    window.Empire.UI.hydrateAfterAuth();
    window.Empire.UI.setGuestMode(false);
  } else {
    window.Empire.UI.setGuestMode(true);
  }
});
