(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.EmpireSharedGameplayRules = api;
    root.Empire = root.Empire || {};
    root.Empire.SharedGameplayRules = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SERVER_DEFAULTS = Object.freeze({
    war: Object.freeze({
      mapPreview: "/img/mapanoc.png",
      serverLaunchOffsetMinutes: 75,
      starterState: Object.freeze({
        money: 12000,
        cleanMoney: 12000,
        dirtyMoney: 0,
        drugs: 80,
        drugNeonDust: 44,
        drugPulseShot: 14,
        drugVelvetSmoke: 12,
        drugGhostSerum: 7,
        drugOverdriveX: 3,
        weapons: 30,
        materials: 120,
        dataShards: 18
      })
    }),
    free: Object.freeze({
      mapPreview: "/img/mapaden2.png",
      serverLaunchOffsetMinutes: 35,
      starterState: Object.freeze({
        money: 12000,
        cleanMoney: 12000,
        dirtyMoney: 0,
        drugs: 80,
        drugNeonDust: 44,
        drugPulseShot: 14,
        drugVelvetSmoke: 12,
        drugGhostSerum: 7,
        drugOverdriveX: 3,
        weapons: 30,
        materials: 120,
        dataShards: 18
      })
    })
  });

  const COMBAT_RULES = Object.freeze({
    weaponTiers: Object.freeze({
      attack: Object.freeze([
        Object.freeze({ name: "Baseballová pálka", requiredMembers: 50, power: 10 }),
        Object.freeze({ name: "Pouliční pistole", requiredMembers: 100, power: 20 }),
        Object.freeze({ name: "Granát", requiredMembers: 150, power: 30 }),
        Object.freeze({ name: "Samopal", requiredMembers: 200, power: 40 }),
        Object.freeze({ name: "Bazuka", requiredMembers: 250, power: 50 })
      ]),
      defense: Object.freeze([
        Object.freeze({ name: "Neprůstřelná vesta", requiredMembers: 50, power: 10 }),
        Object.freeze({ name: "Ocelové barikády", requiredMembers: 100, power: 20 }),
        Object.freeze({ name: "Bezpečnostní kamery", requiredMembers: 150, power: 30 }),
        Object.freeze({ name: "Automatické kulometné stanoviště", requiredMembers: 200, power: 40 }),
        Object.freeze({ name: "Alarm", requiredMembers: 250, power: 50 })
      ])
    }),
    weaponMeta: Object.freeze({
      attack: Object.freeze({
        "Baseballová pálka": Object.freeze({
          resourceKey: "baseballBat",
          craftDurationSeconds: 8,
          specialText: ""
        }),
        "Pouliční pistole": Object.freeze({
          resourceKey: "streetPistol",
          craftDurationSeconds: 10,
          specialText: ""
        }),
        Granát: Object.freeze({
          resourceKey: "grenade",
          craftDurationSeconds: 15,
          specialText: "Ignoruje 0.3 % obrany za ks"
        }),
        Samopal: Object.freeze({
          resourceKey: "smg",
          craftDurationSeconds: 20,
          specialText: "+0.2 power za ks při použití všech 5 attack zbraní"
        }),
        Bazuka: Object.freeze({
          resourceKey: "bazooka",
          craftDurationSeconds: 35,
          specialText: "+0.5 % šance na totální destrukci districtu za ks"
        })
      }),
      defense: Object.freeze({
        "Neprůstřelná vesta": Object.freeze({
          resourceKey: "bulletproofVest",
          craftDurationSeconds: 8,
          specialText: "-0.5 % ztráty obránců za ks"
        }),
        "Ocelové barikády": Object.freeze({
          resourceKey: "steelBarricades",
          craftDurationSeconds: 15,
          specialText: "+0.02 % délka útoku za ks"
        }),
        "Bezpečnostní kamery": Object.freeze({
          resourceKey: "securityCameras",
          craftDurationSeconds: 18,
          specialText: "5+ ks = velká šance odhalit špeha"
        }),
        "Automatické kulometné stanoviště": Object.freeze({
          resourceKey: "autoMgNest",
          craftDurationSeconds: 25,
          specialText: "-0.3 % síla útoku útočníka za ks"
        }),
        Alarm: Object.freeze({
          resourceKey: "alarmSystem",
          craftDurationSeconds: 12,
          specialText: "5+ ks = velká šance selhání vykradení"
        })
      })
    })
  });

  const SERVER_RULES = Object.freeze({
    "war-alpha": Object.freeze({ mode: "war", mapPreview: "/img/mapanoc.png", serverLaunchOffsetMinutes: 75 }),
    "war-bravo": Object.freeze({ mode: "war", mapPreview: "/img/mapanoc.png", serverLaunchOffsetMinutes: 210 }),
    "war-charlie": Object.freeze({ mode: "war", mapPreview: "/img/mapanoc.png", serverLaunchOffsetMinutes: 420 }),
    "free-alpha": Object.freeze({ mode: "free", mapPreview: "/img/mapaden2.png", serverLaunchOffsetMinutes: 35 }),
    "free-bravo": Object.freeze({ mode: "free", mapPreview: "/img/mapaden2.png", serverLaunchOffsetMinutes: 95 }),
    "free-charlie": Object.freeze({ mode: "free", mapPreview: "/img/mapaden2.png", serverLaunchOffsetMinutes: 190 })
  });

  function normalizeMode(mode) {
    const raw = String(mode || "").trim().toLowerCase();
    return raw === "free" ? "free" : "war";
  }

  function normalizeServerKey(serverKey) {
    return String(serverKey || "").trim().toLowerCase();
  }

  function cloneStarterState(state) {
    return {
      money: Number(state?.money || 0),
      cleanMoney: Number(state?.cleanMoney || 0),
      dirtyMoney: Number(state?.dirtyMoney || 0),
      drugs: Number(state?.drugs || 0),
      drugNeonDust: Number(state?.drugNeonDust || 0),
      drugPulseShot: Number(state?.drugPulseShot || 0),
      drugVelvetSmoke: Number(state?.drugVelvetSmoke || 0),
      drugGhostSerum: Number(state?.drugGhostSerum || 0),
      drugOverdriveX: Number(state?.drugOverdriveX || 0),
      weapons: Number(state?.weapons || 0),
      materials: Number(state?.materials || 0),
      dataShards: Number(state?.dataShards || 0)
    };
  }

  function buildStarterResourceLines(starterState) {
    const state = cloneStarterState(starterState);
    return Object.freeze([
      `Clean cash: $${state.cleanMoney.toLocaleString("cs-CZ")}`,
      `Dirty cash: $${state.dirtyMoney.toLocaleString("cs-CZ")}`,
      `Drogy: ${state.drugs.toLocaleString("cs-CZ")} ks`,
      `Zbraně: ${state.weapons.toLocaleString("cs-CZ")} ks`,
      `Materiály: ${state.materials.toLocaleString("cs-CZ")} ks`,
      `Data shards: ${state.dataShards.toLocaleString("cs-CZ")} ks`
    ]);
  }

  function resolveGameplayRules({ gameMode = "war", serverKey = "" } = {}) {
    const normalizedServerKey = normalizeServerKey(serverKey);
    const serverRule = SERVER_RULES[normalizedServerKey] || null;
    const mode = normalizeMode(serverRule?.mode || gameMode);
    const modeDefaults = SERVER_DEFAULTS[mode] || SERVER_DEFAULTS.war;
    const starterState = cloneStarterState(serverRule?.starterState || modeDefaults.starterState);
    return Object.freeze({
      mode,
      serverKey: normalizedServerKey || "",
      mapPreview: String(serverRule?.mapPreview || modeDefaults.mapPreview || "").trim(),
      serverLaunchOffsetMinutes: Number(serverRule?.serverLaunchOffsetMinutes ?? modeDefaults.serverLaunchOffsetMinutes ?? 0),
      starterState: Object.freeze(starterState),
      starterResourceLines: buildStarterResourceLines(starterState),
      combat: COMBAT_RULES
    });
  }

  function getCombatWeaponTiers(options = {}) {
    return resolveGameplayRules(options).combat.weaponTiers;
  }

  function getCombatWeaponMeta(options = {}) {
    return resolveGameplayRules(options).combat.weaponMeta;
  }

  function getStarterState(options = {}) {
    return resolveGameplayRules(options).starterState;
  }

  return Object.freeze({
    SERVER_RULES,
    resolveGameplayRules,
    getCombatWeaponTiers,
    getCombatWeaponMeta,
    getStarterState,
    buildStarterResourceLines
  });
});
