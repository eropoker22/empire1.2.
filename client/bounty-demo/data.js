(function () {
  "use strict";

  const HUNT_MODE_THRESHOLD = 10000;
  const BOUNTY_CREATION_COOLDOWN_MS = 30 * 60 * 1000;
  const DRUG_UNIT_VALUE = 180;
  const MATERIAL_UNIT_VALUE = 120;
  const BOUNTY_TYPES = Object.freeze({
    CAPTURE_DISTRICT: "capture_district",
    SUCCESSFUL_ATTACK: "successful_attack",
    DESTROY_UNITS: "destroy_units"
  });
  const BOUNTY_DURATION_OPTIONS = Object.freeze([6, 12, 24]);

  /**
   * @typedef {Object} Player
   * @property {string} id
   * @property {string} name
   * @property {string} allianceTag
   * @property {string} avatarLabel
   * @property {string} lastActivity
   * @property {number} threatLevel
   * @property {{cash:number,drugs:number,materials:number}} resources
   */

  /**
   * @typedef {Object} District
   * @property {string} id
   * @property {string} name
   * @property {string} ownerPlayerId
   * @property {string} zone
   */

  /**
   * @typedef {Object} BountyContribution
   * @property {string} playerId
   * @property {number} contributionDamage
   * @property {number} contributionScore
   */

  /**
   * @typedef {Object} AttackResult
   * @property {string} attackerId
   * @property {string} targetPlayerId
   * @property {string} bountyType
   * @property {boolean} success
   * @property {number} contributionValue
   * @property {number} destroyedUnits
   * @property {string|null} capturedDistrictId
   * @property {number} createdAt
   */

  const demoPlayers = Object.freeze([
    {
      id: "player-1",
      name: "Vex",
      allianceTag: "VOID",
      avatarLabel: "VX",
      lastActivity: "Přesun jednotek před 3 min",
      threatLevel: 82,
      resources: { cash: 26000, drugs: 74, materials: 88 }
    },
    {
      id: "player-2",
      name: "Mariah",
      allianceTag: "LUX",
      avatarLabel: "MR",
      lastActivity: "Raid na market před 11 min",
      threatLevel: 64,
      resources: { cash: 18000, drugs: 49, materials: 53 }
    },
    {
      id: "player-3",
      name: "Ghostline",
      allianceTag: "NULL",
      avatarLabel: "GH",
      lastActivity: "Obsazení districtu před 7 min",
      threatLevel: 91,
      resources: { cash: 22000, drugs: 58, materials: 61 }
    }
  ]);

  const demoDistricts = Object.freeze([
    { id: "d-101", name: "Neon Ward", ownerPlayerId: "player-1", zone: "Downtown" },
    { id: "d-102", name: "Black Pier", ownerPlayerId: "player-1", zone: "Industrial" },
    { id: "d-103", name: "Chrome Alley", ownerPlayerId: "player-1", zone: "Commercial" },
    { id: "d-104", name: "Velvet Mile", ownerPlayerId: "player-2", zone: "Downtown" },
    { id: "d-105", name: "Sable Court", ownerPlayerId: "player-2", zone: "Residential" },
    { id: "d-106", name: "Oracle Strip", ownerPlayerId: "player-2", zone: "Commercial" },
    { id: "d-107", name: "Rust Garden", ownerPlayerId: "player-3", zone: "Industrial" },
    { id: "d-108", name: "Signal Hill", ownerPlayerId: "player-3", zone: "Park" },
    { id: "d-109", name: "Dead Pixel", ownerPlayerId: "player-3", zone: "Downtown" }
  ]);

  function createDemoState() {
    return {
      currentPlayerId: "player-1",
      players: demoPlayers.map((player) => ({
        ...player,
        resources: { ...player.resources }
      })),
      districts: demoDistricts.map((district) => ({ ...district })),
      bounties: [],
      feed: []
    };
  }

  window.EmpireBountyDemoData = {
    HUNT_MODE_THRESHOLD,
    BOUNTY_CREATION_COOLDOWN_MS,
    DRUG_UNIT_VALUE,
    MATERIAL_UNIT_VALUE,
    BOUNTY_TYPES,
    BOUNTY_DURATION_OPTIONS,
    demoPlayers,
    demoDistricts,
    createDemoState
  };
})();
