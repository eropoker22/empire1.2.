function resolveFaction(factionCatalog = {}, factionId = "mafian") {
  return factionCatalog?.[factionId] || factionCatalog?.mafian || {};
}

export function createFactionPreviewViewModel(faction = {}) {
  const specialAction = faction?.specialAction || null;
  return {
    name: faction?.name || "",
    tagline: faction?.tagline || "",
    description: faction?.description || "",
    playstyleLabel: faction?.playstyleSummary || "",
    cleanMoneyLabel: faction?.playstyleSummary || "Frakce upravuje styl hry",
    dirtyMoneyLabel: "Start je globální pro všechny hráče",
    influenceLabel: "Pasivy jsou oddělené od startu",
    heatLabel: specialAction ? `${specialAction.name}: preview-only` : "Schopnost je preview-only",
    advantages: [
      ...(Array.isArray(faction?.advantages) ? faction.advantages.map((item) => `${item} (core-backed)`) : []),
      ...(Array.isArray(faction?.plannedAdvantages) ? faction.plannedAdvantages.map((item) => `${item} (planned/display-only)`) : [])
    ],
    disadvantages: [
      ...(Array.isArray(faction?.disadvantages) ? faction.disadvantages.map((item) => `${item} (core-backed)`) : []),
      ...(Array.isArray(faction?.plannedDisadvantages) ? faction.plannedDisadvantages.map((item) => `${item} (planned/display-only)`) : [])
    ],
    coreBackedEffects: Array.isArray(faction?.coreBackedEffects) ? faction.coreBackedEffects : [],
    plannedEffects: Array.isArray(faction?.plannedEffects) ? faction.plannedEffects : [],
    specialActionLabel: specialAction?.name || "",
    specialActionDescription: specialAction?.description || "",
    specialActionStatus: specialAction?.status || ""
  };
}

export function createExistingRegistrationViewModel(existingRegistration = null, factionCatalog = {}) {
  if (!existingRegistration?.factionId || !factionCatalog?.[existingRegistration.factionId]) {
    return {
      locked: false,
      activeFactionId: "mafian",
      identityValue: "",
      identityReadOnly: false,
      optionsDisabled: false,
      statusTitle: "Výběr frakce",
      statusNote: "Vyber frakci před registrací. Po vstupu na server se volba uzamkne a určí styl hry, pasivní výhody a nevýhody."
    };
  }

  const faction = resolveFaction(factionCatalog, existingRegistration.factionId);
  const identity = existingRegistration.identity || "Host";
  return {
    locked: true,
    activeFactionId: existingRegistration.factionId,
    identityValue: identity,
    identityReadOnly: true,
    optionsDisabled: true,
    statusTitle: "Frakce uzamčena",
    statusNote: `Účet ${identity} už vstoupil do serveru jako ${faction.name}. Frakci už nelze změnit.`
  };
}

export function createLockedRegistrationStatusViewModel(registration = null, factionCatalog = {}) {
  const faction = resolveFaction(factionCatalog, registration?.factionId);
  return {
    title: "Frakce uzamčena",
    note: `Účet ${registration?.identity || "Host"} už má pevně zvolenou frakci ${faction.name}.`
  };
}

export function createCompletedRegistrationStatusViewModel({
  identity = "Host",
  factionId = "mafian",
  lockedAt = "",
  factionCatalog = {}
} = {}) {
  const faction = resolveFaction(factionCatalog, factionId);
  return {
    title: "Registrace dokončena",
    note: `${identity || "Host"} vstoupil do serveru jako ${faction.name}. Frakce je od ${lockedAt} pevně uzamčená.`
  };
}
