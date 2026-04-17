window.Empire = window.Empire || {};
window.Empire.UISettings = window.Empire.UISettings || {};

window.Empire.UISettings.createModalController = function createModalController(deps = {}) {
  const {
    SETTINGS_STORAGE_KEY = "empire_settings_v1",
    DEFAULT_SETTINGS = {},
    resolveStoredUnknownNeutralFillEnabled = () => false,
    setUnknownNeutralFillEnabled = () => {},
    writeStoredValue = () => {},
    MAP_UNKNOWN_NEUTRAL_FILL_STORAGE_KEY = "empire_map_unknown_neutral_fill",
    applyMapBorderSwitchVisuals = () => {},
    syncMapVisionContext = () => {},
    pushEvent = () => {}
  } = deps;

  function normalizeMapVisibilityMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "all" || mode === "hide-enemies" || mode === "only-player") return mode;
    return DEFAULT_SETTINGS.mapVisibilityMode;
  }

  function getSettingsState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      const settings = { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
      const forced = { ...settings, mapVisibilityMode: "all", mapAllianceSymbols: true };
      if (forced.mapVisibilityMode !== settings.mapVisibilityMode || forced.mapAllianceSymbols !== settings.mapAllianceSymbols) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(forced));
      }
      return forced;
    } catch {
      const forced = { ...DEFAULT_SETTINGS, mapVisibilityMode: "all", mapAllianceSymbols: true };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(forced));
      return forced;
    }
  }

  function showSettingsModal() {
    const root = document.getElementById("settings-modal");
    if (!root) return;
    root.dispatchEvent(new CustomEvent("settings:open"));
    root.classList.remove("hidden");
  }

  function initSettingsModal() {
    const root = document.getElementById("settings-modal");
    const backdrop = document.getElementById("settings-modal-backdrop");
    const closeBtn = document.getElementById("settings-modal-close");
    const saveBtn = document.getElementById("settings-save-btn");
    const soundInput = document.getElementById("settings-sound");
    const musicInput = document.getElementById("settings-music");
    const effectsQualitySelect = document.getElementById("settings-effects-quality");
    const languageSelect = document.getElementById("settings-language");
    const mapDistrictBordersInput = document.getElementById("settings-map-district-borders");
    const mapAllianceSymbolsInput = document.getElementById("settings-map-alliance-symbols");
    const mapUnknownNeutralFillBtn = document.getElementById("settings-map-unknown-neutral-fill-btn");
    const mapVisibilitySelect = document.getElementById("settings-map-visibility");
    if (!root) return;
    const mobileMedia = window.matchMedia("(max-width: 720px)");
    let settingsSnapshot = null;
    let unknownNeutralFillSnapshot = null;

    const syncMobileSettingsBackdropState = (open) => {
      document.body.classList.toggle("mobile-settings-modal-open", Boolean(open) && mobileMedia.matches);
    };
    const renderUnknownNeutralFillButton = () => {
      if (!mapUnknownNeutralFillBtn) return;
      const active = resolveStoredUnknownNeutralFillEnabled();
      mapUnknownNeutralFillBtn.dataset.active = active ? "true" : "false";
      mapUnknownNeutralFillBtn.setAttribute("aria-pressed", active ? "true" : "false");
      mapUnknownNeutralFillBtn.textContent = active ? "Zapnuto" : "Vypnuto";
    };
    const applySettingsToForm = () => {
      const settings = getSettingsState();
      if (soundInput) soundInput.checked = settings.sound;
      if (musicInput) musicInput.checked = settings.music;
      if (effectsQualitySelect) effectsQualitySelect.value = settings.effectsQuality;
      if (languageSelect) languageSelect.value = settings.language;
      if (mapDistrictBordersInput) mapDistrictBordersInput.checked = Boolean(settings.mapDistrictBorders);
      if (mapAllianceSymbolsInput) mapAllianceSymbolsInput.checked = Boolean(settings.mapAllianceSymbols);
      renderUnknownNeutralFillButton();
      if (mapVisibilitySelect) mapVisibilitySelect.value = normalizeMapVisibilityMode(settings.mapVisibilityMode);
    };
    const applyUnknownNeutralFillFromSettings = (nextEnabled) => {
      const enabled = typeof nextEnabled === "boolean" ? nextEnabled : resolveStoredUnknownNeutralFillEnabled();
      setUnknownNeutralFillEnabled(Boolean(enabled));
      writeStoredValue(MAP_UNKNOWN_NEUTRAL_FILL_STORAGE_KEY, Boolean(enabled) ? "1" : "0");
      applyMapBorderSwitchVisuals();
      syncMapVisionContext();
      renderUnknownNeutralFillButton();
    };
    const captureFormSettings = () => ({
      sound: soundInput ? Boolean(soundInput.checked) : Boolean(getSettingsState().sound),
      music: musicInput ? Boolean(musicInput.checked) : Boolean(getSettingsState().music),
      notifications: Boolean(getSettingsState().notifications),
      effectsQuality: effectsQualitySelect?.value || getSettingsState().effectsQuality || DEFAULT_SETTINGS.effectsQuality,
      language: languageSelect?.value || getSettingsState().language || DEFAULT_SETTINGS.language,
      mapDistrictBorders: Boolean(mapDistrictBordersInput?.checked),
      mapAllianceSymbols: true,
      mapVisibilityMode: "all"
    });
    const writeFormSettings = () => {
      const settings = captureFormSettings();
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      applyUnknownNeutralFillFromSettings();
      syncMapVisionContext();
    };
    const revertSettingsPreview = () => {
      if (!settingsSnapshot) return;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsSnapshot));
      if (typeof unknownNeutralFillSnapshot === "boolean") {
        applyUnknownNeutralFillFromSettings(unknownNeutralFillSnapshot);
      }
      syncMapVisionContext();
      applySettingsToForm();
    };
    const closeSettingsModal = (options = {}) => {
      if (Boolean(options.revert)) revertSettingsPreview();
      settingsSnapshot = null;
      unknownNeutralFillSnapshot = null;
      root.classList.add("hidden");
      syncMobileSettingsBackdropState(false);
    };
    const saveSettings = () => {
      const settings = { ...captureFormSettings() };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      applyUnknownNeutralFillFromSettings(resolveStoredUnknownNeutralFillEnabled());
      syncMapVisionContext();
      settingsSnapshot = settings;
      unknownNeutralFillSnapshot = resolveStoredUnknownNeutralFillEnabled();
      root.classList.add("hidden");
      syncMobileSettingsBackdropState(false);
      pushEvent("Nastavení bylo uloženo.");
    };
    const onLiveChange = () => writeFormSettings();

    applySettingsToForm();
    if (soundInput) soundInput.addEventListener("change", onLiveChange);
    if (musicInput) musicInput.addEventListener("change", onLiveChange);
    if (effectsQualitySelect) effectsQualitySelect.addEventListener("change", onLiveChange);
    if (languageSelect) languageSelect.addEventListener("change", onLiveChange);
    if (mapDistrictBordersInput) mapDistrictBordersInput.addEventListener("change", onLiveChange);
    if (mapAllianceSymbolsInput) mapAllianceSymbolsInput.addEventListener("change", onLiveChange);
    if (mapUnknownNeutralFillBtn) {
      mapUnknownNeutralFillBtn.addEventListener("click", () => {
        const current = resolveStoredUnknownNeutralFillEnabled();
        applyUnknownNeutralFillFromSettings(!current);
      });
    }
    if (mapVisibilitySelect) mapVisibilitySelect.addEventListener("change", onLiveChange);
    if (backdrop) backdrop.addEventListener("click", () => closeSettingsModal({ revert: true }));
    if (closeBtn) closeBtn.addEventListener("click", () => closeSettingsModal({ revert: true }));
    if (saveBtn) saveBtn.addEventListener("click", saveSettings);
    root.addEventListener("settings:open", () => {
      settingsSnapshot = getSettingsState();
      unknownNeutralFillSnapshot = resolveStoredUnknownNeutralFillEnabled();
      applySettingsToForm();
      syncMobileSettingsBackdropState(true);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeSettingsModal({ revert: true });
      }
    });
  }

  return {
    normalizeMapVisibilityMode,
    getSettingsState,
    showSettingsModal,
    initSettingsModal
  };
};
