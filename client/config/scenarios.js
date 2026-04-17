window.Empire = window.Empire || {};
window.Empire.Config = window.Empire.Config || {};

window.Empire.Config.scenarios = Object.freeze({
  card: Object.freeze({
    title: "Ukázkové stavy hráče",
    description: "Klikni a zobrazí se, jak vypadá profil a mapa v dané situaci."
  }),
  order: Object.freeze([
    "full-map",
    "alliance-ten-blackout",
    "night-20-war",
    "onboarding-20-edge"
  ]),
  items: Object.freeze({
    "full-map": Object.freeze({
      key: "full-map",
      topbarLabel: "ALL",
      cardLabel: "ALL",
      shortLabel: "ALL",
      preferredMapMode: "night",
      scenarioVisionEnabled: false,
      scenarioUniqueOwnerColors: false,
      onboarding: false,
      blackoutLike: false
    }),
    "alliance-ten-blackout": Object.freeze({
      key: "alliance-ten-blackout",
      topbarLabel: "HRA",
      cardLabel: "HRA",
      shortLabel: "HRA",
      preferredMapMode: "blackout",
      scenarioVisionEnabled: true,
      scenarioUniqueOwnerColors: true,
      onboarding: false,
      blackoutLike: true
    }),
    "night-20-war": Object.freeze({
      key: "night-20-war",
      topbarLabel: "NOC 20",
      cardLabel: "NOC 20",
      shortLabel: "N20",
      preferredMapMode: "night",
      scenarioVisionEnabled: true,
      scenarioUniqueOwnerColors: true,
      onboarding: false,
      blackoutLike: true
    }),
    "onboarding-20-edge": Object.freeze({
      key: "onboarding-20-edge",
      topbarLabel: "ONBOARDING",
      cardLabel: "ONBOARDING!!",
      shortLabel: "ONB",
      preferredMapMode: "night",
      scenarioVisionEnabled: true,
      scenarioUniqueOwnerColors: true,
      onboarding: true,
      blackoutLike: false
    })
  })
});

window.Empire.Config.getScenarioConfig = function getScenarioConfig() {
  return window.Empire.Config.scenarios;
};
