const path = require("path");

const sharedGameplayRules = require(path.resolve(__dirname, "../../../client/shared/gameplay-rules.js"));

function resolveGameplayRules({ gameMode = "war", serverKey = "" } = {}) {
  return sharedGameplayRules.resolveGameplayRules({ gameMode, serverKey });
}

function getStarterPlayerState({ gameMode = "war", serverKey = "" } = {}) {
  return resolveGameplayRules({ gameMode, serverKey }).starterState;
}

function getCombatWeaponTiers({ gameMode = "war", serverKey = "" } = {}) {
  return resolveGameplayRules({ gameMode, serverKey }).combat.weaponTiers;
}

function getCombatWeaponMeta({ gameMode = "war", serverKey = "" } = {}) {
  return resolveGameplayRules({ gameMode, serverKey }).combat.weaponMeta;
}

function getPublicGameplayRules({ gameMode = "war", serverKey = "" } = {}) {
  const rules = resolveGameplayRules({ gameMode, serverKey });
  return {
    mode: rules.mode,
    serverKey: rules.serverKey,
    mapPreview: rules.mapPreview,
    serverLaunchOffsetMinutes: rules.serverLaunchOffsetMinutes,
    starterState: rules.starterState,
    starterResourceLines: rules.starterResourceLines,
    combat: rules.combat
  };
}

module.exports = {
  resolveGameplayRules,
  getStarterPlayerState,
  getCombatWeaponTiers,
  getCombatWeaponMeta,
  getPublicGameplayRules
};
