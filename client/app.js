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
    const guestUsername = String(localStorage.getItem("empire_guest_username") || "").trim();
    const guestGangName = String(localStorage.getItem("empire_gang_name") || "").trim();
    window.Empire.UI.updateProfile({
      username: guestUsername || "Host",
      gangName: guestGangName || "Guest Crew",
      structure: localStorage.getItem("empire_structure") || "-",
      alliance: "Žádná",
      districts: 0,
      influence: 0
    });
  }
});
