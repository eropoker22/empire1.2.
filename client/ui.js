window.Empire = window.Empire || {};

window.Empire.UI = (() => {
  const weaponCatalog = [
    "Baseballová pálka",
    "Pouliční pistole",
    "Granát",
    "Samopal",
    "Bazuka"
  ];

  const BASE_WEAPON_POWER = Object.freeze({
    attack: Object.freeze({
      "Baseballová pálka": 5,
      "Pouliční pistole": 10,
      Granát: 14,
      Samopal: 18,
      Bazuka: 30
    }),
    defense: Object.freeze({
      "Neprůstřelná vesta": 6,
      "Ocelové barikády": 12,
      "Bezpečnostní kamery": 6,
      "Automatické kulometné stanoviště": 20,
      Alarm: 10
    })
  });
  const BASE_WEAPON_POPULATION_REQUIREMENTS = Object.freeze({
    attack: Object.freeze({
      "Baseballová pálka": 50,
      "Pouliční pistole": 100,
      Granát: 150,
      Samopal: 200,
      Bazuka: 250
    }),
    defense: Object.freeze({
      "Neprůstřelná vesta": 50,
      "Ocelové barikády": 100,
      "Bezpečnostní kamery": 150,
      "Automatické kulometné stanoviště": 200,
      Alarm: 250
    })
  });

  const attackWeaponStats = [
    { name: "Baseballová pálka", power: BASE_WEAPON_POWER.attack["Baseballová pálka"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.attack["Baseballová pálka"] },
    { name: "Pouliční pistole", power: BASE_WEAPON_POWER.attack["Pouliční pistole"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.attack["Pouliční pistole"] },
    { name: "Granát", power: BASE_WEAPON_POWER.attack["Granát"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.attack["Granát"] },
    { name: "Samopal", power: BASE_WEAPON_POWER.attack.Samopal, requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.attack.Samopal },
    { name: "Bazuka", power: BASE_WEAPON_POWER.attack.Bazuka, requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.attack.Bazuka }
  ];

  const LEGACY_ATTACK_WEAPON_ALIASES = Object.freeze({
    Pistole: "Pouliční pistole",
    "Samopal (SMG)": "Samopal",
    "Útočná puška": "Samopal",
    "Explozivní nálož": "Granát"
  });

  const defenseCatalog = [
    "Neprůstřelná vesta",
    "Ocelové barikády",
    "Bezpečnostní kamery",
    "Automatické kulometné stanoviště",
    "Alarm"
  ];

  const defenseWeaponStats = [
    { name: "Neprůstřelná vesta", power: BASE_WEAPON_POWER.defense["Neprůstřelná vesta"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.defense["Neprůstřelná vesta"] },
    { name: "Ocelové barikády", power: BASE_WEAPON_POWER.defense["Ocelové barikády"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.defense["Ocelové barikády"] },
    { name: "Bezpečnostní kamery", power: BASE_WEAPON_POWER.defense["Bezpečnostní kamery"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.defense["Bezpečnostní kamery"] },
    { name: "Automatické kulometné stanoviště", power: BASE_WEAPON_POWER.defense["Automatické kulometné stanoviště"], requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.defense["Automatické kulometné stanoviště"] },
    { name: "Alarm", power: BASE_WEAPON_POWER.defense.Alarm, requiredMembers: BASE_WEAPON_POPULATION_REQUIREMENTS.defense.Alarm }
  ];

  function resolveAttackWeaponSpecialText(name) {
    switch (String(name || "").trim()) {
      case "Granát":
        return "Ignoruje 0.3 % obrany za ks";
      case "Samopal":
        return "+0.2 power za ks při použití všech 5 attack zbraní";
      case "Bazuka":
        return "+0.5 % šance na totální destrukci districtu za ks";
      default:
        return "";
    }
  }

  function resolveDefenseWeaponSpecialText(name) {
    switch (String(name || "").trim()) {
      case "Neprůstřelná vesta":
        return "-0.5 % ztráty obránců za ks";
      case "Bezpečnostní kamery":
        return "5+ ks = velká šance odhalit špeha";
      case "Automatické kulometné stanoviště":
        return "-0.3 % síla útoku útočníka za ks";
      case "Alarm":
        return "5+ ks = velká šance selhání vykradení";
      default:
        return "";
    }
  }

  function getDistrictDefenseWeaponCounts(districtId) {
    const districtKey = String(Number(districtId));
    if (!districtKey || districtKey === "NaN") return {};
    const store = readLocalDistrictDefenseAssignments();
    const districtStore = store[districtKey] && typeof store[districtKey] === "object"
      ? store[districtKey]
      : {};
    return Object.values(districtStore).reduce((acc, entry) => {
      const weaponCounts = entry?.weaponCounts && typeof entry.weaponCounts === "object"
        ? entry.weaponCounts
        : {};
      Object.entries(weaponCounts).forEach(([weaponName, amount]) => {
        const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
        if (safeAmount > 0) acc[weaponName] = Math.max(0, Math.floor(Number(acc[weaponName] || 0) + safeAmount));
      });
      return acc;
    }, {});
  }

  function resolveDistrictDefenseSpecialModifiers(districtId) {
    const weaponCounts = getDistrictDefenseWeaponCounts(districtId);
    const vestCount = Math.max(0, Math.floor(Number(weaponCounts["Neprůstřelná vesta"] || 0)));
    const barricadeCount = Math.max(0, Math.floor(Number(weaponCounts["Ocelové barikády"] || 0)));
    const cameraCount = Math.max(0, Math.floor(Number(weaponCounts["Bezpečnostní kamery"] || 0)));
    const mgNestCount = Math.max(0, Math.floor(Number(weaponCounts["Automatické kulometné stanoviště"] || 0)));
    const alarmCount = Math.max(0, Math.floor(Number(weaponCounts.Alarm || 0)));
    return {
      weaponCounts,
      vestCount,
      barricadeCount,
      cameraCount,
      mgNestCount,
      alarmCount,
      defenderMemberLossReductionPct: vestCount * 0.5,
      attackDurationIncreasePct: barricadeCount * 0.02,
      attackerAttackPenaltyPct: mgNestCount * 0.3,
      spyDetectionBoostActive: cameraCount >= 5,
      raidAlarmBoostActive: alarmCount >= 5
    };
  }

  function resolveAttackDurationMsForDistrict(district) {
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const durationMultiplier = 1 + Math.max(0, Number(defenseSpecial.attackDurationIncreasePct || 0)) / 100;
    return Math.max(1000, Math.round(ATTACK_ACTION_DURATION_MS * durationMultiplier));
  }

  function resolveActivatedAttackSpecialEffects(selection, district) {
    const attackSpecial = getAttackSpecialModifiers(selection);
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const effects = [];
    if (Number(attackSpecial.grenadeDefenseIgnorePct || 0) > 0) {
      effects.push(`Granát ignoroval ${formatDecimalValue(attackSpecial.grenadeDefenseIgnorePct, 2)} % obrany`);
    }
    if (Number(attackSpecial.smgBonusPower || 0) > 0 && attackSpecial.fullSetUsed) {
      effects.push(`Samopal přidal +${formatDecimalValue(attackSpecial.smgBonusPower, 2)} power za full set`);
    }
    if (Number(attackSpecial.bazookaCatastropheChancePct || 0) > 0) {
      effects.push(`Bazuka přidala +${formatDecimalValue(attackSpecial.bazookaCatastropheChancePct, 2)} % šance na totální destrukci`);
    }
    if (Number(defenseSpecial.attackerAttackPenaltyPct || 0) > 0) {
      effects.push(`Kulometná stanoviště snížila sílu útoku o ${formatDecimalValue(defenseSpecial.attackerAttackPenaltyPct, 2)} %`);
    }
    if (Number(defenseSpecial.attackDurationIncreasePct || 0) > 0) {
      effects.push(`Barikády prodloužily útok o ${formatDecimalValue(defenseSpecial.attackDurationIncreasePct, 2)} %`);
    }
    if (Number(defenseSpecial.defenderMemberLossReductionPct || 0) > 0) {
      effects.push(`Vesty snížily ztráty obránců o ${formatDecimalValue(defenseSpecial.defenderMemberLossReductionPct, 2)} %`);
    }
    return effects;
  }

  function getSelectedAttackWeaponCount(selection, weaponName) {
    return Math.max(0, Math.floor(Number(selection?.[weaponName] || 0)));
  }

  function hasFullAttackWeaponSet(selection) {
    return attackWeaponStats.every((item) => getSelectedAttackWeaponCount(selection, item.name) > 0);
  }

  function getAttackSpecialModifiers(selection) {
    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const grenadeCount = getSelectedAttackWeaponCount(safeSelection, "Granát");
    const smgCount = getSelectedAttackWeaponCount(safeSelection, "Samopal");
    const bazookaCount = getSelectedAttackWeaponCount(safeSelection, "Bazuka");
    const fullSetUsed = hasFullAttackWeaponSet(safeSelection);
    return {
      grenadeDefenseIgnorePct: grenadeCount * 0.3,
      smgBonusPower: fullSetUsed ? smgCount * 0.2 : 0,
      bazookaCatastropheChancePct: bazookaCount * 0.5,
      fullSetUsed
    };
  }

  function calculateAttackPowerFromSelection(selection) {
    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const special = getAttackSpecialModifiers(safeSelection);
    const rawPower = attackWeaponStats.reduce((sum, item) => {
      const count = getSelectedAttackWeaponCount(safeSelection, item.name);
      return sum + (count * Number(item.power || 0));
    }, 0) + special.smgBonusPower;
    return {
      rawPower,
      special
    };
  }
  const DEMO_WEAPON_STACK_SIZE = 10;
  const DEMO_OWNER_AVATAR_POOL = Object.freeze([
    "../img/avatars/Mafia/2854d1df-0f7c-4fe4-aa85-7a70dfe299db.jpg",
    "../img/avatars/Mafia/8d2dcbe6-00d3-4b6f-98a0-53dc914346c5.jpg",
    "../img/avatars/Kartel/0f3d68b6-79b0-4bdd-9856-2491cd66cb78.jpg",
    "../img/avatars/Kartel/37b9a32a-4710-4060-a1a9-5cf2e2c924c7.jpg",
    "../img/avatars/Hacker/379f566a-18b8-457e-83ee-ee9ee114cb7a.jpg",
    "../img/avatars/Hacker/53867e7d-cc7e-4f92-b391-88f44bf7e349.jpg",
    "../img/avatars/Korporat/094f576f-646f-4ec9-9786-63019d07cdfe.jpg",
    "../img/avatars/Korporat/2ef61d31-c01c-44a3-bca5-6171166352b0.jpg",
    "../img/avatars/Motogang/grok_image_1773621173474.jpg",
    "../img/avatars/Motogang/grok_image_1773621230721.jpg",
    "../img/avatars/polucnigang/5f1bbe02-e437-43b6-b9ed-c453e34ca622.jpg",
    "../img/avatars/polucnigang/f9b2211e-30fb-46ab-aa4c-16913d8a92c6.jpg",
    "../img/avatars/SoukromaArmada/17912d57-dfc8-49fc-9a90-44121c298975.jpg",
    "../img/avatars/SoukromaArmada/bbe6342a-cf92-4459-af42-dbb7beba19f6.jpg",
    "../img/avatars/Tajnaorganizace/0099fc13-4774-459a-b1a9-ea507a6c0526.jpg",
    "../img/avatars/Tajnaorganizace/0870f362-b2ce-4607-ad3f-a96b59afcc8d.jpg",
    "../img/avatars/Mafia/grok_image_1773619750005.jpg",
    "../img/avatars/Kartel/f7281b4a-f79f-4d76-b975-5153d414208f.jpg",
    "../img/avatars/Hacker/grok_image_1773621797044.jpg",
    "../img/avatars/Korporat/e4286e80-0587-4e0e-afe4-70c348ee59dd.jpg"
  ]);
  const ONBOARDING_PROFILE_AVATAR = "../img/onboarding.jpg";
  const DEMO_OWNER_FACTIONS = Object.freeze([
    "Mafián",
    "Kartel",
    "Hackeři",
    "Korporace",
    "Motorkářský gang",
    "Pouliční gang",
    "Soukromá armáda",
    "Tajná organizace"
  ]);
  const DEMO_DISTRICT_ATMOSPHERES = Object.freeze({
    downtown: [
      "Luxusní a pod kontrolou",
      "Sterilní a vypjatá",
      "Neonově přepychová"
    ],
    commercial: [
      "Rušná a obchodní",
      "Přelidněná a hlučná",
      "Výdělečná a napjatá"
    ],
    residential: [
      "Napjatá a osobní",
      "Přeplněná a neklidná",
      "Tichá jen na oko"
    ],
    industrial: [
      "Drsná a kovová",
      "Špinavá a těžká",
      "Kouřová a unavená"
    ],
    park: [
      "Temná a podsvětní",
      "Neonová a opuštěná",
      "Divoká a neklidná"
    ],
    default: [
      "Neonová a pod kontrolou",
      "Napjatá a živá",
      "Chladná a ostražitá"
    ]
  });

  const storageDrugTypes = [
    { key: "neonDust", resourceKey: "neon_dust", name: "Neon Dust" },
    { key: "pulseShot", resourceKey: "pulse_shot", name: "Pulse Shot" },
    { key: "velvetSmoke", resourceKey: "velvet_smoke", name: "Velvet Smoke" },
    { key: "ghostSerum", resourceKey: "ghost_serum", name: "Ghost Serum" },
    { key: "overdriveX", resourceKey: "overdrive_x", name: "Overdrive X" }
  ];
  const pharmacySupplyTypes = [
    { key: "chemicals", name: "Chemicals" },
    { key: "biomass", name: "Biomass" },
    { key: "stimPack", name: "Stim Pack" }
  ];
  const factorySupplyTypes = [
    { key: "metalParts", name: "Metal Parts" },
    { key: "techCore", name: "Tech Core" },
    { key: "combatModule", name: "Combat Module" }
  ];
  const ALLIANCE_ICON_OPTIONS = Object.freeze([
    { key: "crown_skull", label: "Lebka s korunou", symbol: "☠" },
    { key: "crossed_knives", label: "Zkřížené nože", symbol: "⚔" },
    { key: "broken_shield", label: "Štít", symbol: "⛨" },
    { key: "snake_dagger", label: "Had kolem nože", symbol: "🐍" },
    { key: "eye_triangle", label: "Oko", symbol: "◉" },
    { key: "flame", label: "Plamen", symbol: "🔥" },
    { key: "spider", label: "Pavouk", symbol: "🕷" },
    { key: "lightning", label: "Blesk", symbol: "⚡" },
    { key: "wolf_head", label: "Vlčí hlava", symbol: "🐺" },
    { key: "broken_mask", label: "Maska", symbol: "🎭" }
  ]);
  const DEFAULT_ALLIANCE_ICON_KEY = "crown_skull";
  const ALLIANCE_MAX_MEMBERS = 4;
  const LOCAL_ALLIANCE_REQUEST_PLAYER_ID = "guest-player";
  const LOCAL_SCENARIO_DISTRICT_INCOME_RULES = Object.freeze({
    commercial: Object.freeze({ clean: 3, dirty: 1 }),
    industrial: Object.freeze({ clean: 3, dirty: 1 }),
    park: Object.freeze({ clean: 2, dirty: 1 }),
    residential: Object.freeze({ clean: 2, dirty: 0.5 }),
    downtown: Object.freeze({ clean: 5, dirty: 2 })
  });
  const BLACKOUT_PLAYER_FALLBACK_DISTRICT_IDS = Object.freeze([84, 95, 92, 120, 126]);
  const BLACKOUT_SCENARIO_INCOME_STORAGE_KEY = "blackoutDistrictIncomeLastAppliedAt";
  const ALLIANCE_READY_WINDOW_MS = 6 * 60 * 60 * 1000;
  const DEFAULT_ALLIANCE_DESCRIPTION = "Aliance která všechny zabije";
  const PLAYER_SCENARIO_STORAGE_KEY = "empire_active_player_scenario";
  const DISTRICT_RAID_LOCK_STORAGE_KEY = "empire_district_raid_lock_until_v1";
  const HEAT_JOURNAL_STORAGE_KEY = "empire_heat_journal_v1";
  const HEAT_DIRTY_REDUCTION_STORAGE_KEY = "empire_heat_dirty_reduction_v1";
  const MARKET_SERVER_RESOURCES = Object.freeze([
    { resourceKey: "neon_dust", name: "Neon Dust" },
    { resourceKey: "pulse_shot", name: "Pulse Shot" },
    { resourceKey: "velvet_smoke", name: "Velvet Smoke" },
    { resourceKey: "ghost_serum", name: "Ghost Serum" },
    { resourceKey: "overdrive_x", name: "Overdrive X" },
    { resourceKey: "weapons", name: "Zbraně" },
    { resourceKey: "materials", name: "Materiály" },
    { resourceKey: "data_shards", name: "Data" }
  ]);
  const MARKET_BLACK_RESOURCE_GROUPS = Object.freeze([
    Object.freeze({
      label: "Lékárna",
      options: pharmacySupplyTypes.map((item) => ({
        resourceKey: item.key === "stimPack" ? "stim_pack" : item.key,
        name: item.name
      }))
    }),
    Object.freeze({
      label: "Drug Lab",
      options: storageDrugTypes.map((item) => ({
        resourceKey: item.resourceKey,
        name: item.name
      }))
    }),
    Object.freeze({
      label: "Továrna",
      options: factorySupplyTypes.map((item) => ({
        resourceKey:
          item.key === "metalParts" ? "metal_parts"
          : item.key === "techCore" ? "tech_core"
          : "combat_module",
        name: item.name
      }))
    }),
    Object.freeze({
      label: "Útočné zbraně",
      options: [
        { resourceKey: "baseball_bat", name: "Baseballová pálka" },
        { resourceKey: "street_pistol", name: "Pouliční pistole" },
        { resourceKey: "grenade", name: "Granát" },
        { resourceKey: "smg", name: "Samopal" },
        { resourceKey: "bazooka", name: "Bazuka" }
      ]
    }),
    Object.freeze({
      label: "Obranné zbraně",
      options: [
        { resourceKey: "bulletproof_vest", name: "Neprůstřelná vesta" },
        { resourceKey: "steel_barricades", name: "Ocelové barikády" },
        { resourceKey: "security_cameras", name: "Bezpečnostní kamery" },
        { resourceKey: "auto_mg_nest", name: "Automatické kulometné stanoviště" },
        { resourceKey: "alarm_system", name: "Alarm" }
      ]
    })
  ]);
  const MARKET_BLACK_RESOURCES = Object.freeze(MARKET_BLACK_RESOURCE_GROUPS.flatMap((group) => group.options));
  const MARKET_RESOURCE_LABELS = Object.freeze(
    [...MARKET_SERVER_RESOURCES, ...MARKET_BLACK_RESOURCES].reduce((acc, item) => {
      if (!acc[item.resourceKey]) acc[item.resourceKey] = item.name;
      return acc;
    }, {})
  );

  const SETTINGS_STORAGE_KEY = "empire_settings";
  const ATTACK_COOLDOWN_STORAGE_KEY = "empire_attack_cooldown_until_v1";
  const ATTACK_COOLDOWN_MS = 20 * 1000;
  const ATTACK_ACTION_DURATION_MS = 20 * 1000;
  const DISTRICT_TRAP_STORAGE_KEY = "empire_district_trap_state_v1";
  const ATTACK_TARGET_LOCK_STORAGE_KEY = "empire_attack_target_lock_state_v1";
  const TRAP_ATTACK_TARGET_LOCK_MS = 5 * 60 * 60 * 1000;
  const TRAP_MOVE_COOLDOWN_MS = 20 * 1000;
  const RAID_COOLDOWN_STORAGE_KEY = "empire_raid_cooldown_until_v1";
  const RAID_BASE_COOLDOWN_MS = 30 * 1000;
  const RAID_ACTION_DURATION_MS = 20 * 1000;
  const DISTRICT_RAID_LOCK_MS = 2 * 60 * 60 * 1000;
  const GANG_HEAT_DIRTY_COST = 500;
  const GANG_HEAT_DIRTY_REDUCTION = 10;
  const GANG_HEAT_CLEAN_COST = 300;
  const GANG_HEAT_CLEAN_REDUCTION = 15;
  const GANG_HEAT_DIRTY_TRIGGER_WINDOW_MS = 30 * 60 * 1000;
  const GANG_HEAT_DIRTY_TRIGGER_COUNT = 3;
  const GANG_HEAT_POLICE_DURATION_MS = 60 * 60 * 1000;
  const POLICE_RAID_TIER1 = Object.freeze({
    cleanConfiscationPct: 2,
    dirtyConfiscationPctMin: 8,
    dirtyConfiscationPctMax: 15,
    arrestsPct: 12,
    influencePenaltyPct: 5,
    incomePenaltyPct: 10
  });
  const POLICE_RAID_TIER2 = Object.freeze({
    cleanConfiscationPctMin: 2,
    cleanConfiscationPctMax: 7,
    dirtyConfiscationPctMin: 16,
    dirtyConfiscationPctMax: 20,
    drugLossPct: 5,
    arrestsPctMin: 3,
    arrestsPctMax: 7,
    attackWeaponLossPct: 3,
    influencePenaltyPctMin: 6,
    influencePenaltyPctMax: 8,
    incomePenaltyPct: 20,
    productionPenaltyPct: 10
  });
  const POLICE_RAID_TIER3 = Object.freeze({
    incomePenaltyPctMin: 21,
    incomePenaltyPctMax: 26,
    cleanConfiscationPctMin: 2,
    cleanConfiscationPctMax: 7,
    dirtyConfiscationPctMin: 16,
    dirtyConfiscationPctMax: 20,
    drugLossPctMin: 6,
    drugLossPctMax: 9,
    arrestsPctMin: 7,
    arrestsPctMax: 12,
    attackWeaponLossPctMin: 3,
    attackWeaponLossPctMax: 8,
    defenseWeaponLossPctMin: 3,
    defenseWeaponLossPctMax: 8,
    influencePenaltyPctMin: 8,
    influencePenaltyPctMax: 12,
    labProductionPenaltyPctMin: 11,
    labProductionPenaltyPctMax: 13,
    armoryProductionPenaltyPctMin: 8,
    armoryProductionPenaltyPctMax: 13
  });
  const POLICE_RAID_TIER4 = Object.freeze({
    incomePenaltyPctMin: 26,
    incomePenaltyPctMax: 33,
    cleanConfiscationPctMin: 7,
    cleanConfiscationPctMax: 12,
    dirtyConfiscationPctMin: 18,
    dirtyConfiscationPctMax: 23,
    drugLossPctMin: 10,
    drugLossPctMax: 15,
    arrestsPctMin: 11,
    arrestsPctMax: 17,
    attackWeaponLossPct: 11,
    defenseWeaponLossPct: 11,
    attackPowerPenaltyPct: 8,
    defensePowerPenaltyPct: 10,
    influencePenaltyPctMin: 11,
    influencePenaltyPctMax: 14,
    labProductionPenaltyPctMin: 13,
    labProductionPenaltyPctMax: 15,
    armoryProductionPenaltyPctMin: 12,
    armoryProductionPenaltyPctMax: 16
  });
  const POLICE_RAID_TIER5 = Object.freeze({
    incomePenaltyPctMin: 32,
    incomePenaltyPctMax: 40,
    cleanConfiscationPctMin: 14,
    cleanConfiscationPctMax: 18,
    dirtyConfiscationPctMin: 23,
    dirtyConfiscationPctMax: 28,
    materialLossPct: 30,
    drugLossPctMin: 15,
    drugLossPctMax: 17,
    arrestsPctMin: 18,
    arrestsPctMax: 23,
    attackWeaponLossPct: 13,
    defenseWeaponLossPct: 14,
    attackPowerPenaltyPct: 15,
    defensePowerPenaltyPct: 15,
    influencePenaltyPctMin: 14,
    influencePenaltyPctMax: 17,
    productionFreezePct: 100
  });
  const POLICE_RAID_TIER6 = Object.freeze({
    incomePenaltyPct: 100,
    cleanConfiscationPct: 25,
    dirtyConfiscationPct: 45,
    drugLossPct: 23,
    materialLossPct: 35,
    arrestsPct: 30,
    attackWeaponLossPct: 20,
    defenseWeaponLossPct: 20,
    attackPowerPenaltyPct: 30,
    defensePowerPenaltyPct: 30,
    influencePenaltyPct: 25,
    productionFreezePct: 100
  });
  const POLICE_RAID_SPECIALTIES = Object.freeze({
    financial: Object.freeze({ label: "Finanční zásah", icon: "💰" }),
    drug: Object.freeze({ label: "Drogová razie", icon: "🧪" }),
    weapons: Object.freeze({ label: "Zbrojní zásah", icon: "🛡️" }),
    arrests: Object.freeze({ label: "Zatýkací vlna", icon: "👥" }),
    total: Object.freeze({ label: "Celková razie", icon: "⚠️" })
  });
  const POLICE_RAID_SPECIALTY_RANDOM_WEIGHTS = Object.freeze([
    Object.freeze({ key: "total", weight: 55 }),
    Object.freeze({ key: "financial", weight: 11.25 }),
    Object.freeze({ key: "drug", weight: 11.25 }),
    Object.freeze({ key: "weapons", weight: 11.25 }),
    Object.freeze({ key: "arrests", weight: 11.25 })
  ]);
  const POLICE_RAID_SPECIALTY_LOSS_MULTIPLIERS = Object.freeze({
    total: Object.freeze({
      clean: 1,
      dirty: 1,
      income: 1,
      influence: 1,
      arrests: 1,
      drugs: 1,
      attackWeapons: 1,
      defenseWeapons: 1,
      materials: 1,
      labProduction: 1,
      armoryProduction: 1,
      factoryProduction: 1,
      attackPower: 1,
      defensePower: 1
    }),
    financial: Object.freeze({
      clean: 1.35,
      dirty: 1.35,
      income: 1.2,
      influence: 1.15,
      arrests: 0.7,
      drugs: 0.55,
      attackWeapons: 0.6,
      defenseWeapons: 0.6,
      materials: 0.65,
      labProduction: 0.65,
      armoryProduction: 0.6,
      factoryProduction: 0.7,
      attackPower: 0.7,
      defensePower: 0.7
    }),
    drug: Object.freeze({
      clean: 0.75,
      dirty: 1.05,
      income: 1.1,
      influence: 0.9,
      arrests: 0.9,
      drugs: 1.55,
      attackWeapons: 0.7,
      defenseWeapons: 0.7,
      materials: 0.75,
      labProduction: 1.45,
      armoryProduction: 0.7,
      factoryProduction: 0.75,
      attackPower: 0.8,
      defensePower: 0.8
    }),
    weapons: Object.freeze({
      clean: 0.8,
      dirty: 0.95,
      income: 1.05,
      influence: 0.95,
      arrests: 0.85,
      drugs: 0.7,
      attackWeapons: 1.45,
      defenseWeapons: 1.45,
      materials: 1.35,
      labProduction: 0.75,
      armoryProduction: 1.45,
      factoryProduction: 1.35,
      attackPower: 1.25,
      defensePower: 1.25
    }),
    arrests: Object.freeze({
      clean: 0.7,
      dirty: 0.8,
      income: 1,
      influence: 1.05,
      arrests: 1.55,
      drugs: 0.6,
      attackWeapons: 0.7,
      defenseWeapons: 0.7,
      materials: 0.7,
      labProduction: 0.7,
      armoryProduction: 0.7,
      factoryProduction: 0.7,
      attackPower: 0.9,
      defensePower: 0.95
    })
  });
  const POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY = "empire_police_raid_prod_penalty_until_v1";
  const POLICE_RAID_INCOME_PENALTY_STORAGE_KEY = "empire_police_raid_income_penalty_map_v1";
  const POLICE_RAID_COMBAT_PENALTY_STORAGE_KEY = "empire_police_raid_combat_penalty_v1";
  const POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY = "empire_police_raid_building_action_lock_v1";
  const POLICE_RAID_FACTORY_SUPPLIES_STORAGE_KEY = "empire_factory_player_supplies_v1";
  const appliedPoliceRaidImpactKeys = new Set();
  const POLICE_ACTION_TIER_MESSAGES = Object.freeze({
    1: Object.freeze({
      title: "LEHKÁ KONTROLA",
      tone: "is-tier-1",
      text: "Policie se tu jen motá. Pár otázek, pár pohledů zatím nic, co by tě mělo rozhodit."
    }),
    2: Object.freeze({
      title: "🟡 PODEZŘENÍ",
      tone: "is-tier-2",
      text: "Začínají čmuchat víc, než je zdrávo. Někdo něco řekl a oni to berou vážně."
    }),
    3: Object.freeze({
      title: "🟠 TLAK NA DISTRICT",
      tone: "is-tier-3",
      text: "Už to není náhoda. Kontroly, výslechy, lidi mizí z ulic. Policie tlačí a začíná to smrdět průserem."
    }),
    4: Object.freeze({
      title: "🔴 AKTIVNÍ RAZIE",
      tone: "is-tier-4",
      text: "Vlítli tam bez varování. Dveře v hajzlu, lidi na zemi. Berou všechno, co najdou a neptají se."
    }),
    5: Object.freeze({
      title: "🔴 BRUTÁLNÍ ZÁTAH",
      tone: "is-tier-5",
      text: "Tohle už není razie, to je masakr. Mlátí, berou, ničí. Kdo se pohne blbě, skončí v pytli."
    }),
    6: Object.freeze({
      title: "TOTÁLNÍ ČISTKA",
      tone: "is-tier-6",
      text: "Vlítli tam naplno. Sebrali cash, lidi i výbavu. District je vyčištěnej do mrtva a nikdo už tam nic neuhájí."
    })
  });
  const POLICE_ACTION_TIER_QUOTES = Object.freeze({
    1: Object.freeze([
      "Klídek, jen rutina ale ty mi tu nějak smrdíš.",
      "Dneska nic nehledám. Zatím. Ale pamatuju si ksichty.",
      "Hezký místo. Byla by škoda, kdybych se sem musel vrátit s partou.",
      "Ukaž, co tu schováváš nebo si to najdu sám příště.",
      "Neboj, dneska jen koukám. Zítra už možná beru.",
      "Máš štěstí, že mám dneska dobrou náladu.",
      "Zatím to nechám být ale něco mi říká, že se ještě uvidíme.",
      "Nedělej blbosti a možná tě nechám žít v klidu.",
      "Jen si tu dělám obrázek. A věř mi, že se rychle skládá.",
      "Dneska odcházím. Příště už nemusím."
    ]),
    2: Object.freeze([
      "Někdo začal mluvit a tvoje jméno padlo víc než jednou.",
      "Už to není jen rutina. Něco tu nesedí a ty víš co.",
      "Řekni mi to rovnou ušetříš si problémy. Možná.",
      "Začínáš mě fakt zajímat. A to nechceš.",
      "Vidím, jak se tu hýbou věci. A někdo za tím stojí.",
      "Ještě nejdu po tobě naplno ale blíž už být nemůžu.",
      "Stačí jedna chyba. A já tu nebudu sám.",
      "Máš kolem sebe dost bordelu. Dřív nebo později se v tom utopíš.",
      "Já už vím dost. Teď čekám, kolik toho najdu.",
      "Zatím tě jen sleduju ale věř mi, že to rychle skončí."
    ]),
    3: Object.freeze([
      "Už to tu máme pod kontrolou. Ty tu jen čekáš, až tě sundáme.",
      "Lidi mizí, obchody zavírají a ty jsi uprostřed toho bordelu.",
      "Každej kout tady znám. Nemáš se kam schovat.",
      "Tvoje malý impérium se začíná rozpadat. Slyšíš to praskání?",
      "Zatím jen tlačím. A ty už sotva dýcháš.",
      "Každej tvůj krok sledujem. Jedna chyba a končíš.",
      "Ulice už nejsou tvoje. Jen jsi poslední, kdo to ještě nepochopil.",
      "Tvoje lidi začínají mluvit. A věř mi, že rádi.",
      "Není to otázka jestli ale kdy tě rozkopeme na kusy.",
      "Tohle místo už patří nám. Ty jsi tu jen dočasnej problém."
    ]),
    4: Object.freeze([
      "Na zem! Teď hned, nebo tě tam dostanu já!",
      "Konec hry. Všechno jde ven lidi, prachy, zbraně.",
      "Dveře jsou v hajzlu a ty jdeš s nima.",
      "Ruce kde je vidím! Jedna blbost a končíš!",
      "Tohle jsme ti říkali. Teď už jen sklízíš, cos zasel.",
      "Bal to. Tady už nic nepatří tobě.",
      "Každej kout projdeme. Každou krysu vytáhnem.",
      "Už nejsi boss. Teď jsi jen další případ.",
      "Naložit všechno! Nic tu nezůstane!",
      "Měl jsi šanci to držet v klidu. Teď už je pozdě."
    ]),
    5: Object.freeze([
      "Na zem, kurva! Hned, nebo tě složím!",
      "Tohle už neřešíme v klidu. Tohle se řeší silou!",
      "Všechno bereme! Co se nevejde, rozbijem!",
      "Hýbneš se blbě a jdeš k zemi, jasný?!",
      "Tvoje hra skončila. Teď už jen počítáš ztráty!",
      "Nikdo neuteče! Zavřít to tady celý!",
      "Vytáhněte je ven! Každýho jednoho!",
      "Tady už se neptáme. Tady se bere!",
      "Podívej se kolem tohle je konec tvýho malýho království!",
      "Měl jsi odejít včas. Teď už tě jen roznesem na kusy!"
    ]),
    6: Object.freeze([
      "Hotovo. Tady už nic není.",
      "Vyčištěno do posledního šroubu. Můžeš začít znova jestli na to máš.",
      "Tohle místo skončilo. A ty s ním.",
      "Žádný lidi, žádný prachy, žádná moc. Jen prázdno.",
      "Tvoje impérium? Teď je to jen hromada sraček.",
      "Zbylo ti hovno. A to je ještě víc, než sis zasloužil.",
      "Ticho. Přesně takhle to tu má vypadat.",
      "Konec hry. Resetni se a zkus to znova líp.",
      "Tohle město si tě vyplivlo. A ani si toho nevšimlo.",
      "Zapomeň na to, co tu bylo. Už to neexistuje."
    ])
  });
  const POLICE_ACTION_SPECIALTY_QUOTES = Object.freeze({
    financial: Object.freeze([
      "Kde máš prachy? Protože já je teď beru.",
      "Účty zamražený. Cash zabavenej. Gratuluju.",
      "Tvoje peníze právě změnily majitele.",
      "Hraješ si na krále? Bez peněz jsi jen další nula.",
      "Všechno spočítaný, všechno zabavený. Nic ti nezbyde.",
      "Každej špinavej cent jde pryč. Do posledního.",
      "Můžeš si to vydělat znova. My ti to zase vezmem.",
      "Vidím, že jsi vydělával dobře. Škoda, že to nebylo tvoje.",
      "Tvoje impérium stojí na prachách. A ty právě zmizely.",
      "Hotovost, účty, zásoby všechno jde s náma."
    ]),
    drug: Object.freeze([
      "Cítím to už od dveří. A teď to všechno mizí.",
      "Vařil jsi velký věci. Teď to skončilo.",
      "Všechno bereme. Co nevezmem, zničíme.",
      "Tvoje výroba? Už jen odpad.",
      "Každej gram jde pryč. Do posledního.",
      "Tenhle bordel tu končí. Hned.",
      "Dneska nic neprodáš. Nemáš co.",
      "Zkoušel jsi jet ve velkým. Teď jdeš dolů.",
      "Tvoje laby už nejedou. Už nikdy.",
      "Tohle město ti tenhle byznys nenechá."
    ]),
    weapons: Object.freeze([
      "Kolik toho tu máš? Nevadí, všechno jde pryč.",
      "Bez zbraní nejsi nic. A přesně tam tě vracíme.",
      "Všechno zabavit. Nechci tu vidět ani nábojnici.",
      "Tvoje armáda právě přišla o zuby.",
      "Konec hraní na vojáky. Tohle není tvoje válka.",
      "Tyhle hračky ti nepatří. Už vůbec ne.",
      "Seberte to. Každou zbraň, každej kus.",
      "Teď jsi neozbrojenej. A dost zranitelnej.",
      "Zbraně pryč. Teď jsi jen cíl.",
      "Zkus to teď bez nich. Hodně štěstí."
    ]),
    arrests: Object.freeze([
      "Berem všechny. Jednoho po druhým.",
      "Tvoje lidi? Už nejsou tvoji.",
      "Do aut s nima. Všichni.",
      "Kdo tu zůstane, ten má sakra štěstí.",
      "Rozpadne se ti to pod rukama. Sleduj.",
      "Bez lidí nejsi nic. A přesně to teď jsi.",
      "Každýho naložit. Nechci tu nikoho vidět.",
      "Tvůj gang se právě rozpadl.",
      "Konec party. Jedete s náma.",
      "Zbyde ti pár krys jestli vůbec."
    ]),
    total: Object.freeze([
      "Probíhá razie. Drž hlavu dole a počítej ztráty.",
      "Razie je v běhu. Teď už jen sleduješ, co všechno zmizí.",
      "Policie je uvnitř. Tohle nebude levný.",
      "Běží celková razie. Všechno je teď pod tlakem.",
      "Razie právě začala. Nic kolem tebe není v bezpečí."
    ])
  });
  const POLICE_DISTRICT_CLICK_WARNING_QUOTES = Object.freeze([
    "Tady teď ne. Policie to tu právě rozjebává.",
    "Zapomeň na to. District je plnej policajtů."
  ]);
  const SPY_SUCCESS_EMPTY_DISTRICT_QUOTES = Object.freeze([
    "Špehování hotovo. Tvůj špeh je zpátky - prázdno jak v hrobě.",
    "Zpátky bez škrábnutí. Nikdo tam není, můžeš to sebrat.",
    "Špeh se vrátil. District úplně v píči prázdnej.",
    "Hotovo. Nula lidí, nula odporu. Free teritorium.",
    "Tvůj špeh žije a hlásí - nikdo to nedrží.",
    "Čistý průchod. District leží ladem, vezmi si ho.",
    "Špehování OK. Prázdno. Tohle je zadarmo, kurva.",
    "Zpátky v bezpečí. Nikdo tam není, jen čeká na tebe.",
    "Potvrzeno - prázdnej district. Stačí přijít a je tvůj.",
    "Špeh to projel a vrátil se. Nic tam není, žádný sračky."
  ]);
  const SPY_SUCCESS_OCCUPIED_DISTRICT_QUOTES = Object.freeze([
    "Špeh zpátky. Máš je přečtený do poslední sračky.",
    "Hotovo. Všechno víš - lidi, zbraně, slabiny. Jsou odkrytí.",
    "Špeh se vrátil. Vidíš jim do všeho. Jsou v píči.",
    "Plný info. Každej kout, každej detail. Nemají šanci.",
    "Špehování čistý. Máš kompletní obraz - teď je roztrhej.",
    "Špeh zpátky. Obrana má díry jak kráva. Využij to.",
    "Všechno odkrytý. Víš přesně, kde je zlomit.",
    "Špeh donesl všechno. Jsou nahý jak svině.",
    "Hotovo. Máš jejich slabiny na talíři.",
    "Špeh žije a ví všechno. Teď jsi o krok před nima ve všem."
  ]);
  const SPY_MEDIUM_FAIL_EMPTY_DISTRICT_QUOTES = Object.freeze([
    "Špeh zpátky. Vypadá to prázdně ale něco tam smrdí.",
    "Nula lidí, ale nebylo to čistý. Špeh se stáhnul včas.",
    "District prázdnej, ale špeh měl namále. Něco tam nesedí.",
    "Špeh to projel napůl. Prázdno ale divnej pocit z toho místa.",
    "Nikdo tam není, ale nebylo to safe. Špeh radši zdrhnul.",
    "Prázdnej district, ale něco se tam hnulo. Špeh se stáhnul.",
    "Vypadá to čistě, ale špeh si není jistej. Něco tam nesedí.",
    "Špeh zpátky. Prázdno ale až moc tichý na tohle město.",
    "Nikdo tam není, ale špeh skoro narazil. Bacha na to.",
    "District bez lidí, ale nebyl to clean run. Něco tam může být."
  ]);
  const SPY_MEDIUM_FAIL_OCCUPIED_DISTRICT_QUOTES = Object.freeze([
    "Špeh něco vytáhl, ale zdaleka ne všechno. Můžeš je sundat nebo to totálně posrat.",
    "Nejsou úplně odkrytý. Něco tušíš, ale zbytek je pořádná mlha.",
    "Špeh je zpátky. Máš půlku pravdy a ta druhá půlka ti může pěkně zlomit vaz.",
    "Máš jen částečný info. Stačí to na pořádný risk, ale na jistotu to rozhodně není.",
    "Vidíš jim do karet jen napůl. Ten zbytek tě může pěkně kousnout do zadku."
  ]);
  const SPY_MAJOR_FAIL_EMPTY_DISTRICT_QUOTES = Object.freeze([
    "Prázdno jak svině a stejně jsi o špeha přišel. To je solidní průser.",
    "Nikdo tam není, ale špeh je v prdeli. Něco tam nehraje.",
    "Free teritorium? Možná. Špeh už to neřekne.",
    "Špeh se nevrátil. Prázdno, ale kurevsky divný.",
    "District prázdnej a špeh v hajzlu. Gratuluju."
  ]);
  const SPY_MAJOR_FAIL_OCCUPIED_DISTRICT_QUOTES = Object.freeze([
    "Špeh v prdeli. Chytli ho. Teď už vědí i o tobě.",
    "Průser. Špeha mají. A už vědí, kdo jim leze po rajónu.",
    "Zatkli ho. Nemáš žádný info - a oni mají tebe.",
    "Špeh v hajzlu. Chytli ho a teď je máš na krku.",
    "Chytli ho při práci. Teď už jen čekej, až si dojdou pro tebe.",
    "Špeh padl. A tvoje jméno už mezi nima koluje.",
    "Zajali ho. Nejenže nic nevíš, oni teď vědí o tobě až moc.",
    "Totální průser. Špeha mají a celý district je ve střehu.",
    "Špeh to totálně posral a teď je v jejich rukách. Gratuluju, jsi na řadě ty.",
    "Nemáš info. Oni mají tvýho člověka. Docela blbá rovnice, co?"
  ]);
  const SPY_DETECTION_WARNING_QUOTES = Object.freeze([
    "Chytili jsme jim špeha. Teď víš, kdo se ti hrabe v rajónu.",
    "Někdo tě zkoušel projet - nevyšlo mu to. Máš ho.",
    "Špeh chycený. Teď je na tobě, co s ním uděláš.",
    "Zachytili jsme krysu. A ví, pro koho makala.",
    "Někdo si na tebe dovolil. Teď máš jeho člověka v rukách.",
    "Špeh je u tebe. Oni chtěli info - teď jsi ho dostal ty.",
    "Zkusili tě projet potichu. Teď držíš jejich špinavou práci.",
    "Chytil jsi ho při činu. Teď víš, kdo po tobě jde.",
    "Nepřítel udělal chybu. A ty ji právě držíš v rukách.",
    "Špeh odhalen a zajat. Teď máš výhodu ty."
  ]);
  const SPY_ALLIANCE_DETECTION_WARNING_QUOTES = Object.freeze([
    "[ALLY] chytil nepřátelskýho špeha. Někdo si na nás dovolil.",
    "U [ALLY] odhalen špeh. Aliance je ve střehu.",
    "Zachycena krysa u [ALLY]. Víme, kdo po nás jde.",
    "[ALLY] má jejich špeha. Někdo nás zkoušel projet potichu.",
    "Špeh odhalen u [ALLY]. Držte se, někdo nás sleduje.",
    "[ALLY] zachytil infiltrace. Máme stopu na nepřítele.",
    "Nepřítel udělal chybu u [ALLY]. Teď máme výhodu.",
    "U [ALLY] chycen špeh. Aliance má oči otevřený.",
    "[ALLY] drží jejich člověka. Někdo se hrabe v našem rajónu.",
    "Špeh skončil u [ALLY]. Teď víme, odkud fouká vítr."
  ]);
  const OWNER_RAID_STORAGE_KEY = "empire_owner_raid_storage_v1";
  const DISTRICT_RAID_STASH_STORAGE_KEY = "empire_district_raid_stash_v1";
  const OCCUPY_ACTION_DURATION_MS = 20 * 1000;
  const SPY_ACTION_DURATION_MS = 20 * 1000;
  const SPY_RECOVERY_COOLDOWN_MS = 30 * 1000;
  const SPY_RECOVERY_TICK_MS = 1000;
  const GUEST_DEFAULT_DIRTY_MONEY = 5000;
  const DEFAULT_SETTINGS = Object.freeze({
    sound: true,
    music: true,
    notifications: true,
    effectsQuality: "high",
    language: "cs",
    mapDistrictBorders: true,
    mapAllianceSymbols: true,
    mapVisibilityMode: "all"
  });

  const districtBuildingCatalog = {
    downtown: [
      "Centrální banka",
      "Magistrát",
      "Lobby klub",
      "Burza",
      "Soud",
      "VIP salonek",
      "Letiště",
      "Přístav",
      "Parlament"
    ],
    commercial: [
      "Obchodní centrum",
      "Restaurace",
      "Herna",
      "Lékárna",
      "Kasino",
      "Autosalon",
      "Fitness club",
      "Směnárna",
      "Kancelářský blok"
    ],
    residential: [
      "Bytový blok",
      "Rekrutační centrum",
      "Brainwash centrum",
      "Garage",
      "Taxi služba",
      "Klinika",
      "Škola"
    ],
    industrial: [
      "Továrna",
      "Zbrojovka",
      "Sklad",
      "Energetická stanice",
      "Datové centrum"
    ],
    park: [
      "Drug lab",
      "Pašovací tunel",
      "Večerka",
      "Strip club",
      "Pouliční dealeři"
    ]
  };

  const buildingDistrictTypes = [
    { key: "commercial", label: "Commercial" },
    { key: "industrial", label: "Industrial" },
    { key: "residential", label: "Resident" },
    { key: "park", label: "Park" },
    { key: "downtown", label: "Downtown" }
  ];

  const districtTypeBackgrounds = {
    commercial: "../img/commercial/1.png",
    industrial: "../img/industrial/1.png",
    residential: "../img/residental/1.png",
    park: "../img/park/1.png",
    downtown: "../img/downtown/1.png"
  };

  const namedDowntownExchanges = [
    "Vortex Exchange"
  ];

  const namedDowntownCentralBanks = [
    "Iron Reserve Bank",
    "Obsidian Central Vault"
  ];

  const namedDowntownAirports = [
    "Neon Skyport"
  ];

  const namedDowntownLobbyClubs = [
    "Velvet Influence Club",
    "Shadow Lobby Lounge",
    "Golden Circle Club"
  ];

  const namedDowntownCityHalls = [
    "City Dominion Hall",
    "Urban Control Center"
  ];

  const namedDowntownParliaments = [
    "The Vortex Council"
  ];

  const namedDowntownPorts = [
    "Black Tide Port",
    "Ironsea Dockyard",
    "Shadow Harbor"
  ];

  const namedDowntownCourts = [
    "High Justice Court",
    "Iron Verdict Hall",
    "Obsidian Tribunal"
  ];

  const namedDowntownVipLounges = [
    "Platinum Lounge",
    "Eclipse VIP Gold Room"
  ];

  const namedCommercialMalls = [
    "Neon Mall",
    "Iron Market Plaza",
    "Karina shopping center"
  ];

  const namedCommercialRestaurants = [
    "Neon Bite",
    "Black Plate",
    "Street Fuel",
    "Blood & Grill",
    "Midnight Diner",
    "Iron Taste",
    "Shadow Kitchen",
    "Dirty Spoon",
    "Vice Kitchen",
    "Urban Hunger",
    "Smoke & Meat",
    "The Last Bite",
    "Gangster Grill",
    "Concrete Kitchen",
    "Dark Appetite",
    "Night Feast",
    "The Hungry Syndicate",
    "Rusty Fork",
    "Back Alley Bistro",
    "Sinful Kitchen",
    "Underground Taste",
    "Savage Kitchen",
    "Chrome Diner",
    "Heat Kitchen",
    "No Mercy Meals",
    "Broken Plate",
    "Elite Hunger"
  ];

  const namedCommercialPharmacies = [
    "Neon Medics",
    "Pulse Pharmacy",
    "Black Cross Pharma",
    "Street Remedy",
    "NightCare Clinic",
    "Iron Vein Pharmacy",
    "QuickFix Med",
    "Shadow Medics",
    "Urban Cure",
    "Last Chance Pharmacy"
  ];

  const namedCommercialAutoSalons = [
    "Neon Motors",
    "Iron Wheels Garage",
    "Blackline Autos",
    "Street Kings Motors",
    "Midnight Drive Showroom",
    "Chrome Syndicate Cars",
    "Ghost Ride Autos",
    "Velocity X Garage"
  ];

  const namedCommercialFitnessClubs = [
    "Iron District Gym",
    "Beast Factory",
    "Street Power Club",
    "No Mercy Fitness"
  ];

  const namedCommercialOfficeBlocks = [
    "Iron Tower Offices",
    "Blackline Corporate Hub",
    "Neon Business Center",
    "Vortex Office Complex",
    "Skyline Syndicate Offices",
    "ShadowCorp Tower"
  ];

  const namedCommercialExchanges = [
    "ZeroSum Vault",
    "Neon Arbitrage",
    "Phantom Rates",
    "Cashflow Mirage",
    "Obsidian Exchange",
    "Flux Currency Lab",
    "DeadDrop Finance",
    "Parallax Exchange",
    "Ghost Ledger",
    "Black Circuit Exchange"
  ];

  const namedCommercialArcades = [
    "Neon Jackpots",
    "Lucky Circuit",
    "Black Reel Club",
    "Midnight Slots",
    "Spin Syndicate",
    "Velvet Jackpot Lounge",
    "Ghost Spin Arcade"
  ];

  const namedCommercialCasinos = [
    "Dominion Prime Casino",
    "High Rollers Sanctum",
    "Velvet Eric XxX"
  ];

  const namedIndustrialDataCenters = [
    "NeuroGrid Core",
    "Black Node Nexus",
    "DataForge Complex",
    "Synapse Vault",
    "Quantum Relay Hub",
    "GhostNet Core",
    "Iron Pulse Servers",
    "DeepCode Facility",
    "CipherStack Center",
    "Neon Matrix Node"
  ];

  const namedIndustrialPowerStations = [
    "Neon Power Grid",
    "IronVolt Station",
    "BlackCore Energy",
    "Pulse Reactor",
    "Voltage Nexus",
    "Dark Energy Hub",
    "GridLock Station",
    "Quantum Power Plant",
    "Overcharge Facility",
    "ThunderCore Station",
    "Nova Energy Complex",
    "Static Surge Plant",
    "Flux Power Systems",
    "Obsidian Reactor",
    "HyperGrid Control"
  ];

  const namedIndustrialStorages = [
    "IronVault Storage",
    "BlackCrate Depot",
    "Shadow Storage Hub",
    "CargoCore Warehouse",
    "Ghost Stockpile",
    "SteelBox Depot",
    "NightStorage Facility",
    "Hidden Goods Warehouse",
    "VaultLine Storage",
    "Obsidian Depot",
    "DeadDrop Warehouse",
    "Lockdown Storage",
    "Backroom Stockpile",
    "SecureHold Facility",
    "SteelNest Depot",
    "GridSafe Storage",
    "NightCrate Complex",
    "CargoLock Hub",
    "SilentVault Depot",
    "IronGate Warehouse",
    "DarkReserve Storage"
  ];

  const namedIndustrialFactories = [
    "IronWorks Factory",
    "BlackSmoke Industries",
    "RustCore Plant",
    "SteelPulse Factory",
    "GrimeWorks Facility",
    "DarkForge Industrial",
    "Vortex Manufacturing",
    "HeavyGear Plant",
    "SmokeLine Industries",
    "Obsidian Production",
    "Dust & Steel Works",
    "NightShift Factory",
    "CoreMechanix Plant",
    "Ashline Industries",
    "BruteForce Manufacturing",
    "IronClad Works",
    "GritFactory Complex",
    "SteelHive Plant",
    "ToxicFlow Industries",
    "ShadowMachina Works",
    "HyperSteel Production",
    "GrindCore Factory",
    "MassDrive Industries",
    "DirtyWorks Plant",
    "Overload Manufacturing"
  ];

  const namedIndustrialArmories = [
    "Iron Arsenal",
    "BlackForge Armory",
    "WarCore Factory",
    "Steel Reaper Works",
    "Crimson Armory",
    "Bullet Syndicate",
    "Deadshot Industries",
    "Obsidian Weapons Lab",
    "Vortex Arms Facility",
    "Nightfall Armory",
    "RapidFire Complex",
    "HellTrigger Works",
    "Ghost Weapon Systems",
    "Bloodline Arsenal",
    "Savage Arms Co.",
    "Zero Mercy Armory",
    "Titan Forge Weapons",
    "DarkSteel Industries",
    "Recoil Factory",
    "Phantom Arms Lab",
    "Iron Rain Arsenal"
  ];

  const namedResidentialBrainwashCenters = [
    "NeuroControl Lab",
    "MindHack Facility",
    "BlackMind Institute",
    "Synapse Override Center",
    "GhostMind Program",
    "PsyCore Lab",
    "Oblivion Mind Center",
    "Neural Dominion Hub",
    "ThoughtForge Facility",
    "Cortex Manipulation Lab"
  ];

  const namedResidentialApartmentBlocks = Array.from(
    { length: 36 },
    (_, index) => `Blok ${index + 1}`
  );

  const namedResidentialGarages = [
    "Iron Garage",
    "Street Wheels Hub",
    "BlackTorque Garage",
    "Ghost Garage",
    "NightRide Workshop",
    "SteelDrive Garage",
    "BackAlley Garage",
    "Velocity Garage",
    "Shadow Wheels"
  ];

  const namedResidentialClinics = [
    "NightCare Clinic",
    "BlackCross Medical",
    "PulseFix Clinic",
    "StreetMed Center",
    "Iron Health Unit",
    "GhostCare Facility",
    "RapidAid Clinic",
    "ShadowMed Center",
    "LastHope Clinic",
    "Urban Recovery"
  ];

  const namedResidentialRecruitCenters = [
    "Iron Recruit Hub",
    "Street Army Center",
    "BlackFlag Recruitment",
    "Shadow Enlistment",
    "Warborn Center",
    "Ghost Recruit Station",
    "Bloodline Recruitment",
    "Urban Soldiers Hub",
    "Vortex Recruit Base",
    "Frontline Enlistment",
    "No Mercy Recruitment"
  ];

  const namedResidentialSchools = [
    "Street Academy",
    "Neon Learning Center",
    "Urban Knowledge Hub",
    "IronMind School",
    "Shadow Education",
    "Vortex Academy",
    "CoreSkill Institute",
    "Future Minds School",
    "BlackBoard Academy",
    "City Knowledge Center",
    "BrainCore School",
    "NextGen Academy",
    "StreetWise Institute",
    "LogicLab School"
  ];

  const namedResidentialTaxiServices = [
    "NightRide Taxi",
    "Neon Cab Co.",
    "GhostDrive Taxi",
    "StreetMove Transport",
    "RapidRide Taxi",
    "Shadow Cab Service",
    "Urban Wheels Taxi",
    "BlackRoute Taxi",
    "Velocity Cab",
    "Backstreet Taxi",
    "FlashRide Taxi"
  ];

  const namedParkDrugLabs = [
    "Neon Chem Lab",
    "BlackDust Factory",
    "GhostCook Lab",
    "Shadow Chemistry",
    "CrystalForge",
    "NightBatch Lab",
    "Toxic Synthesis",
    "DarkMix Facility",
    "StreetLab X",
    "PureRush Lab",
    "SilentCook Lab"
  ];

  const namedParkSmugglingTunnels = [
    "Ghost Tunnel",
    "BlackRoute Passage",
    "Shadow Transit",
    "Silent Tunnel Network",
    "Underground Flow",
    "DarkPath Tunnel",
    "Hidden Route X",
    "Night Tunnel Line",
    "Smugglers Vein",
    "Phantom Passage",
    "DeepRoute Tunnel",
    "Backline Tunnel",
    "ZeroTrace Route",
    "Iron Tunnel"
  ];

  const namedParkStreetDealers = [
    "Corner Dealers",
    "Night Sellers",
    "Ghost Pushers",
    "Street Hustlers",
    "Shadow Dealers",
    "QuickDrop Crew",
    "BackAlley Sellers",
    "Neon Push",
    "Silent Dealers",
    "FastCash Crew",
    "Dirty Hands",
    "Block Hustlers",
    "Dark Trade Crew",
    "Urban Pushers",
    "NoFace Dealers"
  ];

  const namedParkStripClubs = [
    "Velvet Nights",
    "Neon Desire",
    "Midnight Dolls",
    "Crimson Lounge",
    "Silk & Sin",
    "Shadow Seduction",
    "Dark Angels Club",
    "Electric Temptation",
    "Night Velvet",
    "Obsidian Desire",
    "RedLight Palace",
    "Forbidden Lounge",
    "Lust District",
    "Golden Sinners",
    "Vice Lounge"
  ];

  const namedParkConvenienceStores = [
    "QuickStop Market",
    "NightMart",
    "Urban MiniShop",
    "Street Corner Store",
    "24/7 Neon Shop",
    "FastBuy Market",
    "Backstreet Market",
    "GhostMart",
    "QuickPick Store",
    "City MiniMarket",
    "FlashMart",
    "Night Supply",
    "Urban Grab Shop",
    "RapidBuy Store",
    "Street Essentials",
    "MiniCore Market",
    "InstantShop",
    "Shadow Mart",
    "EasyBuy Corner",
    "Daily Needs Shop"
  ];

  const commercialDistrictPools = {
    early: [
      {
        key: "early-stable-1",
        tier: "early",
        title: "Stabilní provoz",
        buildings: ["Restaurace", "Fitness club"]
      },
      {
        key: "early-stable-2",
        tier: "early",
        title: "Civilní utility",
        buildings: ["Restaurace", "Lékárna"]
      },
      {
        key: "early-cash",
        tier: "early",
        title: "Lehký cashflow",
        buildings: ["Restaurace", "Směnárna"]
      },
      {
        key: "early-safe-3",
        tier: "early",
        title: "Bezpečný mix",
        buildings: ["Restaurace", "Lékárna", "Fitness club"]
      },
      {
        key: "early-launder",
        tier: "early",
        title: "Startovní laundering",
        buildings: ["Autosalon", "Restaurace"]
      }
    ],
    mid: [
      {
        key: "mid-balance-1",
        tier: "mid",
        title: "Utility growth",
        buildings: ["Autosalon", "Lékárna"]
      },
      {
        key: "mid-balance-2",
        tier: "mid",
        title: "Finanční uzel",
        buildings: ["Autosalon", "Směnárna"]
      },
      {
        key: "mid-corp-1",
        tier: "mid",
        title: "Korporátní stabilita",
        buildings: ["Kancelářský blok", "Restaurace"]
      },
      {
        key: "mid-corp-2",
        tier: "mid",
        title: "Administrativní utility",
        buildings: ["Kancelářský blok", "Lékárna", "Restaurace"]
      },
      {
        key: "mid-mall-1",
        tier: "mid",
        title: "Hlavní retail",
        buildings: ["Obchodní centrum", "Restaurace"]
      },
      {
        key: "mid-mix-1",
        tier: "mid",
        title: "Vyvážený obchod",
        buildings: ["Restaurace", "Lékárna", "Směnárna"]
      },
      {
        key: "mid-mix-2",
        tier: "mid",
        title: "Prací front",
        buildings: ["Autosalon", "Směnárna", "Restaurace"]
      }
    ],
    top: [
      {
        key: "top-casino-1",
        tier: "top",
        title: "Kasino hotspot",
        buildings: ["Kasino", "Restaurace"]
      },
      {
        key: "top-casino-2",
        tier: "top",
        title: "Shady premium",
        buildings: ["Kasino", "Restaurace", "Lékárna"]
      },
      {
        key: "top-casino-3",
        tier: "top",
        title: "Black cash engine",
        buildings: ["Kasino", "Směnárna", "Autosalon"]
      },
      {
        key: "top-mall-1",
        tier: "top",
        title: "Prémiový retail",
        buildings: ["Obchodní centrum", "Lékárna", "Restaurace"]
      },
      {
        key: "top-mall-2",
        tier: "top",
        title: "Financial boulevard",
        buildings: ["Obchodní centrum", "Směnárna", "Restaurace"]
      }
    ]
  };

  const residentialDistrictPools = {
    early: [
      {
        key: "res-early-1",
        tier: "early",
        title: "Startovní růst",
        buildings: ["Bytový blok", "Garage"]
      },
      {
        key: "res-early-2",
        tier: "early",
        title: "Stabilní základna",
        buildings: ["Bytový blok", "Brainwash centrum"]
      },
      {
        key: "res-early-3",
        tier: "early",
        title: "První nábor",
        buildings: ["Bytový blok", "Rekrutační centrum"]
      },
      {
        key: "res-early-4",
        tier: "early",
        title: "Obytná kontrola",
        buildings: ["Bytový blok", "Brainwash centrum", "Garage"]
      }
    ],
    mid: [
      {
        key: "res-mid-1",
        tier: "mid",
        title: "Mobilní posily",
        buildings: ["Bytový blok", "Rekrutační centrum", "Garage"]
      },
      {
        key: "res-mid-2",
        tier: "mid",
        title: "Udržitelný růst",
        buildings: ["Bytový blok", "Klinika"]
      },
      {
        key: "res-mid-3",
        tier: "mid",
        title: "Disciplína a kvalita",
        buildings: ["Bytový blok", "Škola"]
      },
      {
        key: "res-mid-4",
        tier: "mid",
        title: "Loajalita a výcvik",
        buildings: ["Brainwash centrum", "Škola"]
      },
      {
        key: "res-mid-5",
        tier: "mid",
        title: "Regenerace fronty",
        buildings: ["Rekrutační centrum", "Klinika"]
      },
      {
        key: "res-mid-6",
        tier: "mid",
        title: "Kontrolovaný development",
        buildings: ["Bytový blok", "Brainwash centrum", "Škola"]
      }
    ],
    late: [
      {
        key: "res-late-1",
        tier: "late",
        title: "Válečné zázemí",
        buildings: ["Bytový blok", "Rekrutační centrum", "Klinika"]
      },
      {
        key: "res-late-2",
        tier: "late",
        title: "Mobilní tlak",
        buildings: ["Rekrutační centrum", "Garage", "Klinika"]
      },
      {
        key: "res-late-3",
        tier: "late",
        title: "Loajální populace",
        buildings: ["Bytový blok", "Brainwash centrum", "Klinika"]
      },
      {
        key: "res-late-4",
        tier: "late",
        title: "Elitní rezidenční zóna",
        buildings: ["Bytový blok", "Škola", "Klinika"]
      },
      {
        key: "res-late-5",
        tier: "late",
        title: "Strategická mobilizace",
        buildings: ["Bytový blok", "Rekrutační centrum", "Škola"]
      }
    ]
  };

  const parkDistrictPools = {
    early: [
      {
        key: "park-early-1",
        tier: "early",
        title: "Street cash",
        buildings: ["Pouliční dealeři", "Večerka"]
      },
      {
        key: "park-early-2",
        tier: "early",
        title: "Quick runners",
        buildings: ["Pouliční dealeři", "Pašovací tunel"]
      },
      {
        key: "park-early-3",
        tier: "early",
        title: "Night cover",
        buildings: ["Strip club", "Večerka"]
      }
    ],
    mid: [
      {
        key: "park-mid-1",
        tier: "mid",
        title: "Distribution lane",
        buildings: ["Drug lab", "Pašovací tunel"]
      },
      {
        key: "park-mid-2",
        tier: "mid",
        title: "Vice market",
        buildings: ["Strip club", "Pouliční dealeři"]
      },
      {
        key: "park-mid-3",
        tier: "mid",
        title: "Covered traffic",
        buildings: ["Pašovací tunel", "Večerka"]
      },
      {
        key: "park-mid-4",
        tier: "mid",
        title: "Hidden production",
        buildings: ["Drug lab", "Večerka"]
      },
      {
        key: "park-mid-5",
        tier: "mid",
        title: "Night logistics",
        buildings: ["Strip club", "Pašovací tunel"]
      }
    ],
    top: [
      {
        key: "park-top-1",
        tier: "top",
        title: "Chaos corridor",
        buildings: ["Drug lab", "Pašovací tunel", "Pouliční dealeři"]
      },
      {
        key: "park-top-2",
        tier: "top",
        title: "Vice empire",
        buildings: ["Drug lab", "Strip club"]
      },
      {
        key: "park-top-3",
        tier: "top",
        title: "Black nightlife",
        buildings: ["Strip club", "Pouliční dealeři", "Večerka"]
      },
      {
        key: "park-top-4",
        tier: "top",
        title: "Hot route",
        buildings: ["Drug lab", "Pašovací tunel", "Večerka"]
      }
    ]
  };

  const industrialDistrictPools = {
    early: [
      {
        key: "ind-early-1",
        tier: "early",
        title: "Základní výroba",
        buildings: ["Továrna", "Sklad"]
      },
      {
        key: "ind-early-2",
        tier: "early",
        title: "Napájená produkce",
        buildings: ["Továrna", "Energetická stanice"]
      },
      {
        key: "ind-early-3",
        tier: "early",
        title: "První militarizace",
        buildings: ["Továrna", "Zbrojovka"]
      },
      {
        key: "ind-early-4",
        tier: "early",
        title: "Zásobovací uzel",
        buildings: ["Sklad", "Energetická stanice"]
      }
    ],
    mid: [
      {
        key: "ind-mid-1",
        tier: "mid",
        title: "Vojenská výroba",
        buildings: ["Zbrojovka", "Sklad"]
      },
      {
        key: "ind-mid-2",
        tier: "mid",
        title: "Technický provoz",
        buildings: ["Továrna", "Datové centrum"]
      },
      {
        key: "ind-mid-3",
        tier: "mid",
        title: "Efektivní řetězec",
        buildings: ["Továrna", "Sklad", "Energetická stanice"]
      },
      {
        key: "ind-mid-4",
        tier: "mid",
        title: "Zbrojní logistika",
        buildings: ["Zbrojovka", "Sklad", "Energetická stanice"]
      },
      {
        key: "ind-mid-5",
        tier: "mid",
        title: "Datová výroba",
        buildings: ["Sklad", "Datové centrum"]
      }
    ],
    top: [
      {
        key: "ind-top-1",
        tier: "top",
        title: "Arms grid",
        buildings: ["Továrna", "Zbrojovka", "Sklad"]
      },
      {
        key: "ind-top-2",
        tier: "top",
        title: "Power forge",
        buildings: ["Továrna", "Zbrojovka", "Energetická stanice"]
      },
      {
        key: "ind-top-3",
        tier: "top",
        title: "Hack foundry",
        buildings: ["Zbrojovka", "Datové centrum", "Sklad"]
      },
      {
        key: "ind-top-4",
        tier: "top",
        title: "Critical infrastructure",
        buildings: ["Energetická stanice", "Datové centrum", "Sklad"]
      }
    ]
  };

  const downtownDistrictPools = {
    mid: [
      {
        key: "down-mid-1",
        tier: "mid",
        title: "Městské finance",
        buildings: ["Centrální banka", "Magistrát"]
      },
      {
        key: "down-mid-2",
        tier: "mid",
        title: "Politický vliv",
        buildings: ["Lobby klub", "Magistrát"]
      },
      {
        key: "down-mid-3",
        tier: "mid",
        title: "Právní tlak",
        buildings: ["Soud", "Lobby klub"]
      },
      {
        key: "down-mid-4",
        tier: "mid",
        title: "Volatilní kapitál",
        buildings: ["Burza", "VIP salonek"]
      }
    ],
    high: [
      {
        key: "down-high-1",
        tier: "high",
        title: "Korporátní kontrola",
        buildings: ["Centrální banka", "Lobby klub"]
      },
      {
        key: "down-high-2",
        tier: "high",
        title: "Státní pevnost",
        buildings: ["Magistrát", "Soud"]
      },
      {
        key: "down-high-3",
        tier: "high",
        title: "Elitní arbitráž",
        buildings: ["Soud", "VIP salonek"]
      },
      {
        key: "down-high-4",
        tier: "high",
        title: "Burzovní manipulace",
        buildings: ["Burza", "Lobby klub"]
      },
      {
        key: "down-high-5",
        tier: "high",
        title: "Executive chamber",
        buildings: ["Magistrát", "VIP salonek"]
      }
    ],
    core: [
      {
        key: "down-core-1",
        tier: "core",
        title: "Capital nexus",
        buildings: ["Centrální banka", "Magistrát", "VIP salonek"]
      },
      {
        key: "down-core-2",
        tier: "core",
        title: "Shadow exchange",
        buildings: ["Burza", "Lobby klub", "VIP salonek"]
      },
      {
        key: "down-core-3",
        tier: "core",
        title: "Judicial machine",
        buildings: ["Magistrát", "Soud", "Lobby klub"]
      },
      {
        key: "down-core-4",
        tier: "core",
        title: "System override",
        buildings: ["Centrální banka", "Soud", "Lobby klub"]
      }
    ]
  };

  let cachedProfile = null;
  let cachedEconomy = null;
  let cachedMarket = null;
  let marketRefreshHandler = null;
  let marketBuildingShortcutRefreshHandler = null;
  let allianceRefreshHandler = null;
  let allianceCountdownIntervalId = null;
  let scenarioIncomeTimer = null;
  const LOCAL_ALLIANCE_KEY = "empire_local_alliance_state";
  const LOCAL_MARKET_KEY = "empire_local_market_state";
  const LOCAL_GANG_MEMBERS_KEY = "empire_local_gang_members";
  const LOCAL_GANG_MEMBERS_SPENT_KEY = "empire_local_gang_members_spent";
  const LOCAL_DISTRICT_DEFENSE_ASSIGNMENTS_KEY = "empire_local_district_defense_assignments_v1";
  const LOCAL_SPY_COUNT_KEY = "empire_local_spy_count_v1";
  const LOCAL_SPY_RECOVERY_QUEUE_KEY = "empire_spy_recovery_queue_v1";
  const LOCAL_DISTRICT_SPY_INTEL_KEY = "empire_district_spy_intel_v1";
  const DISTRICT_SPY_INTEL_RESET_ONCE_KEY = "empire_spy_intel_reset_114_142_v1";
  const DISTRICT_SPY_INTEL_RESET_IDS = Object.freeze([114, 142]);
  const DEFAULT_BASE_SPY_COUNT = 2;
  const BASE_SPY_COUNT_BY_FACTION = Object.freeze({
    "mafian": 2,
    "mafián": 2,
    "kartel": 2,
    "poulicni gang": 2,
    "pouliční gang": 2,
    "tajna organizace": 2,
    "tajná organizace": 2,
    "hackeri": 2,
    "hackeři": 2,
    "motorkarsky gang": 2,
    "motorkářský gang": 2,
    "soukroma armada": 2,
    "soukromá armáda": 2,
    "korporace": 2
  });
  const MAP_BORDER_MODE_STORAGE_KEY = "empire_map_border_mode";
  const MAP_UNKNOWN_NEUTRAL_FILL_STORAGE_KEY = "empire_map_unknown_neutral_fill";
  const MAP_BORDER_MODE_PLAYER = "player";
  const MAP_BORDER_MODE_WHITE = "white";
  const MAP_BORDER_MODE_BLACK = "black";
  const ONBOARDING_TUTORIAL_SPY_DISTRICT_ID = 25;
  const ONBOARDING_TUTORIAL_ATTACK_DISTRICT_ID = 6;
  let scenarioVisionEnabled = false;
  let scenarioUniqueOwnerColors = false;
  let scenarioProfileAvatarOverride = null;
  let activePlayerScenarioKey = "";
  let activeScenarioOwnerName = "";
  let lastValidBlackoutSources = null;
  let selectedMapBorderMode = MAP_BORDER_MODE_PLAYER;
  let unknownNeutralFillEnabled = false;
  let liveAllianceOwnerNames = new Set();
  let liveAllianceIconByName = new Map();
  let scenarioAllianceOwnerNames = new Set();
  let scenarioAllianceIconByName = new Map();
  let scenarioEnemyOwnerNames = new Set();
  let guestModeActive = false;
  let attackModalRefreshTimer = null;
  let attackResultTimer = null;
  let raidActionTimeoutId = null;
  let raidActionState = { districtId: null, startedAt: 0, endsAt: 0 };
  let attackModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
  let attackConfirmModalState = {
    districtId: null,
    availability: null,
    selectionSummary: null,
    baseDetails: null,
    defensePowerEstimate: 0
  };
  let attackResultModalState = { visible: false };
  let defenseModalRefreshTimer = null;
  let defenseModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
  let spyConfirmModalState = { districtId: null };
  let raidConfirmModalState = { districtId: null };
  let occupyConfirmModalState = { districtId: null };
  let trapConfirmModalState = { districtId: null };
  const GANG_HEAT_LEVELS = Object.freeze([
    { stars: 1, label: "Stupeň 1", title: "Základní dohled", description: "Jsi skoro pod radarem. Jen lehké sledování a občasná pozornost." },
    { stars: 2, label: "Stupeň 2", title: "Podezřelý", description: "Policie tě začíná vnímat. Přibývají kontroly a drobný tlak." },
    { stars: 3, label: "Stupeň 3", title: "Známý problém", description: "Tvoje síť je viditelná. Hrozí častější zásahy a sledování." },
    { stars: 4, label: "Stupeň 4", title: "Rizikový cíl", description: "Jsi konkrétní cíl. Razie a blokace jsou výrazně pravděpodobnější." },
    { stars: 5, label: "Stupeň 5", title: "Prioritní cíl", description: "Bezpečnostní složky se na tebe soustředí. Tlak je trvalý a agresivní." },
    { stars: 6, label: "Stupeň 6", title: "Totální hon", description: "Nejtěžší stupeň. Tvůj gang je veřejný nepřítel a systém po tobě jde naplno." }
  ]);
  let cachedSpyCount = null;
  let isSpyCountShownInTopbar = false;
  let topbarStatSwitchTimer = null;
  let roundPhaseTimer = null;
  let policeRaidProtectionTimer = null;
  let roundStatusState = null;
  let roundStatusOverride = null;
  let spyRecoveryIntervalId = null;
  const spyActionResultTimeouts = new Set();
  const occupyActionResultTimeouts = new Set();
  const pendingResultModalQueue = [];
  let suppressResultModalQueueAdvance = false;
  const moneyStatAnimationTimers = new WeakMap();
  const moneyStatCountIntervals = new WeakMap();
  const MONEY_STAT_COUNT_TICK_MS = 26;
  let lastRenderedCleanMoney = null;
  let lastRenderedDirtyMoney = null;
  let lastRenderedStorageTotal = null;
  let lastRenderedInfluenceValue = null;
  let lastRenderedTopbarMode = "influence";
  let storageStatPulseTimer = null;
  const districtSpyIntelCache = new Map();
  const EMPTY_OWNER_NAMES = new Set();
  const WANTED_HEAT_MAX = 1000;
  const WANTED_HEAT_TIERS = [
    { stars: 1, min: 0, max: 24 },
    { stars: 2, min: 25, max: 74 },
    { stars: 3, min: 75, max: 149 },
    { stars: 4, min: 150, max: 299 },
    { stars: 5, min: 300, max: 499 },
    { stars: 6, min: 500, max: Number.POSITIVE_INFINITY }
  ];

  function init() {
    selectedMapBorderMode = resolveStoredMapBorderMode();
    unknownNeutralFillEnabled = resolveStoredUnknownNeutralFillEnabled();
    readStoredDistrictSpyIntel();
    applyOneTimeDistrictSpyIntelReset();
    processSpyRecoveryQueue({ notify: false });
    syncSpyRecoveryTicker();
    bindActions();
    initMobileTopbarScrollState();
    initMobileScenarioCardPlacement();
    initMobileLeaderboardCardPlacement();
    initMobileMarketBuildingShortcutsPlacement();
    initMobilePrimaryActionCardsPlacement();
    initMobileModalTopbarResourceVisibility();
    initMobileTapFocusCleanup();
    initGlobalModalScrollLock();
    initDoubleTapZoomLock();
    initMapModeControls();
    startPoliceRaidProtectionTicker();
    startScenarioIncomeTicker();
    if (!window.Empire.token) {
      enforceLocalGuestStorageDefaults();
      syncGuestEconomyFromMarket();
    }
    syncMapVisionContext();
    refreshGangColorDisplays();
  }

  function initMobileTapFocusCleanup() {
    const media = window.matchMedia("(max-width: 720px)");
    document.addEventListener("click", (event) => {
      if (!media.matches) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const interactive = target.closest(
        "button, .btn, .nav-btn, .events-hero, .market-building-shortcut, .scenario-preview__btn, .ticker__clear-btn"
      );
      if (!(interactive instanceof HTMLElement)) return;
      window.setTimeout(() => {
        if (interactive instanceof HTMLButtonElement) {
          interactive.blur();
          return;
        }
        if (typeof interactive.blur === "function") {
          interactive.blur();
        }
      }, 0);
    }, true);
  }

  function initGlobalModalScrollLock() {
    const modalNodes = Array.from(document.querySelectorAll(".modal"));
    if (!modalNodes.length) return;
    const body = document.body;
    if (!body) return;
    const html = document.documentElement;

    const applyLock = (locked) => {
      if (locked) {
        if (body.classList.contains("modal-scroll-locked")) return;
        const scrollbarCompensation = Math.max(0, window.innerWidth - (html?.clientWidth || window.innerWidth));
        body.classList.add("modal-scroll-locked");
        body.style.overflow = "hidden";
        if (html) {
          html.style.overflow = "hidden";
        }
        body.style.paddingRight = scrollbarCompensation > 0 ? `${scrollbarCompensation}px` : "";
        return;
      }

      if (!body.classList.contains("modal-scroll-locked")) return;
      body.classList.remove("modal-scroll-locked");
      body.style.overflow = "";
      if (html) {
        html.style.overflow = "";
      }
      body.style.paddingRight = "";
    };

    const applyState = () => {
      const hasOpenModal = modalNodes.some((modal) => !modal.classList.contains("hidden"));
      applyLock(hasOpenModal);
    };

    const observer = new MutationObserver((mutations) => {
      if (!mutations?.length) return;
      applyState();
    });
    modalNodes.forEach((modal) => {
      observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
    });
    window.addEventListener("resize", applyState);
    applyState();
  }

  function initDoubleTapZoomLock() {
    const target = document.documentElement;
    if (!target) return;
    let lastTapAt = 0;
    let lastTapTarget = null;
    let multiTouchActive = false;

    const updateMultiTouchState = (event) => {
      multiTouchActive = Boolean(event?.touches && event.touches.length > 1);
    };

    target.addEventListener("touchstart", updateMultiTouchState, { passive: true });
    target.addEventListener("touchmove", updateMultiTouchState, { passive: true });
    target.addEventListener("touchend", (event) => {
      if (multiTouchActive) {
        multiTouchActive = false;
        return;
      }
      const changedTouches = event?.changedTouches;
      if (!changedTouches || changedTouches.length !== 1) return;
      const now = Date.now();
      const tappedTarget = event.target;
      const isDoubleTap = tappedTarget === lastTapTarget && (now - lastTapAt) < 320;
      lastTapAt = now;
      lastTapTarget = tappedTarget;
      if (!isDoubleTap) return;
      event.preventDefault();
    }, { passive: false });
  }

  function stopRoundPhaseTicker() {
    if (!roundPhaseTimer) return;
    clearInterval(roundPhaseTimer);
    roundPhaseTimer = null;
  }

  function resolveRoundPhaseSnapshot(round) {
    if (!round?.roundStartedAt || !round?.phaseDurationMs) return null;
    const startedAtMs = new Date(round.roundStartedAt).getTime();
    const phaseDurationMs = Math.max(1, Math.floor(Number(round.phaseDurationMs) || 0));
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(phaseDurationMs)) return null;
    const nowMs = Date.now();
    const elapsedMs = Math.max(0, nowMs - startedAtMs);
    const phaseIndex = Math.floor(elapsedMs / phaseDurationMs);
    const phaseKey = phaseIndex % 2 === 0 ? "day" : "night";
    const phaseLabel = phaseKey === "day" ? "DEN" : "NOC";
    const currentGameDay = Math.max(1, Math.floor(elapsedMs / (phaseDurationMs * 2)) + 1);
    const totalGameDays = Math.max(1, Math.floor(Number(round.totalGameDays) || 0));
    return {
      phaseKey,
      phaseLabel,
      currentGameDay: Math.min(totalGameDays, currentGameDay)
    };
  }

  function buildRoundStatusPresetForMode(mode) {
    const normalizedMode = String(mode || "").trim().toLowerCase();
    if (normalizedMode === "day") {
      return {
        currentGameDay: 1,
        timeLabel: "09:15",
        phaseKey: "day",
        phaseLabel: "DEN",
        phaseStartedAt: Date.now()
      };
    }
    if (normalizedMode === "blackout") {
      return {
        currentGameDay: 3,
        timeLabel: "20:30",
        phaseKey: "night",
        subPhaseKey: "blackout",
        phaseLabel: "NOC-BLACKOUT",
        phaseStartedAt: Date.now()
      };
    }
    return {
      currentGameDay: 3,
      timeLabel: "20:30",
      phaseKey: "night",
      phaseLabel: "NOC",
      phaseStartedAt: Date.now()
    };
  }

  function resolveEffectiveRoundMode(phaseKey, subPhaseKey = "") {
    const normalizedPhaseKey = String(phaseKey || "").trim().toLowerCase();
    const normalizedSubPhaseKey = String(subPhaseKey || "").trim().toLowerCase();
    if (normalizedSubPhaseKey === "blackout" && normalizedPhaseKey === "night") {
      return {
        mapMode: "blackout",
        phaseLabel: "NOC-BLACKOUT"
      };
    }
    return {
      mapMode: normalizedPhaseKey === "day" ? "day" : "night",
      phaseLabel: normalizedPhaseKey === "day" ? "DEN" : "NOC"
    };
  }

  function formatRoundClockLabel(minutesInDay) {
    const safeMinutes = ((Math.floor(Number(minutesInDay) || 0) % 1440) + 1440) % 1440;
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function resolveRoundClockSnapshot(round) {
    if (!round?.roundStartedAt) return null;
    const startedAtMs = new Date(round.roundStartedAt).getTime();
    const gameClockStartHour = Math.max(0, Math.floor(Number(round.gameClockStartHour) || 6));
    const gameMinutesPerRealMinute = Math.max(1, Number(round.gameMinutesPerRealMinute) || 3);
    if (!Number.isFinite(startedAtMs)) return null;
    const elapsedMs = Math.max(0, Date.now() - startedAtMs);
    const elapsedGameMinutes = Math.floor((elapsedMs / (60 * 1000)) * gameMinutesPerRealMinute);
    const minutesInDay = (gameClockStartHour * 60 + elapsedGameMinutes) % 1440;
    return {
      minutesInDay,
      label: formatRoundClockLabel(minutesInDay)
    };
  }

  function renderRoundStatusState() {
    const override = roundStatusOverride && typeof roundStatusOverride === "object" ? roundStatusOverride : null;
    const fallbackTotalGameDays = 30;
    if (!roundStatusState && !override) return;
    const roundEnds = document.getElementById("round-ends");
    const roundDays = document.getElementById("round-days");
    const roundGameDay = document.getElementById("round-game-day");
    const roundGameTime = document.getElementById("round-game-time");
    const roundPhase = document.getElementById("round-phase");
    const phaseSnapshot = roundStatusState ? resolveRoundPhaseSnapshot(roundStatusState) : null;
    const clockSnapshot = roundStatusState ? resolveRoundClockSnapshot(roundStatusState) : null;
    const basePhaseKey = override?.phaseKey || phaseSnapshot?.phaseKey || roundStatusState?.currentPhaseKey || "";
    const activeSubPhaseKey = override?.subPhaseKey || roundStatusState?.currentSubPhaseKey || "";
    const effectiveMode = resolveEffectiveRoundMode(basePhaseKey, activeSubPhaseKey);
    const displayPhaseKey = effectiveMode.mapMode || "";
    const displayPhaseLabel = override?.phaseLabel || roundStatusState?.currentSubPhaseLabel || effectiveMode.phaseLabel || "-";
    const displayGameDay = override?.currentGameDay || phaseSnapshot?.currentGameDay || 1;
    const displayClockLabel = override?.timeLabel || clockSnapshot?.label || roundStatusState?.currentGameTimeLabel || "09:15";
    const totalGameDays = Math.max(1, Math.floor(Number(roundStatusState?.totalGameDays) || fallbackTotalGameDays));
    if (roundEnds) {
      roundEnds.textContent = roundStatusState?.roundEndsAt || "-";
    }
    if (roundDays) {
      roundDays.textContent = roundStatusState?.daysRemaining != null ? roundStatusState.daysRemaining : "-";
    }
    if (roundGameDay) {
      if (phaseSnapshot || override) {
        roundGameDay.textContent = `${displayGameDay}/${totalGameDays}`;
      } else {
        roundGameDay.textContent = "-";
      }
    }
    if (roundGameTime) {
      roundGameTime.textContent = displayClockLabel;
    }
    if (roundPhase) {
      roundPhase.textContent = displayPhaseLabel;
    }
    if (displayPhaseKey) {
      window.Empire.Map?.setMapMode?.(displayPhaseKey);
    }
  }

  function startRoundPhaseTicker() {
    stopRoundPhaseTicker();
    if (!roundStatusState?.roundStartedAt || !roundStatusState?.phaseDurationMs) return;
    renderRoundStatusState();
    roundPhaseTimer = setInterval(() => {
      renderRoundStatusState();
    }, 1000);
  }

  function stopScenarioIncomeTicker() {
    if (!scenarioIncomeTimer) return;
    clearInterval(scenarioIncomeTimer);
    scenarioIncomeTimer = null;
  }

  function isDistrictOwnedByScenarioPlayer(district, ownerName) {
    if (isDistrictOwnedByPlayer(district)) return true;
    const ownerKey = normalizeOwnerName(ownerName);
    if (!ownerKey) return false;
    return normalizeOwnerName(district?.owner) === ownerKey;
  }

  function computeDistrictMinuteIncomeFromOwnedDistricts(districts) {
    let clean = 0;
    let dirty = 0;
    (Array.isArray(districts) ? districts : []).forEach((district) => {
      if (Boolean(district?.isDestroyed)) return;
      const typeKey = String(district?.type || "").trim().toLowerCase();
      const config = LOCAL_SCENARIO_DISTRICT_INCOME_RULES[typeKey];
      if (!config) return;
      clean += Number(config.clean || 0);
      dirty += Number(config.dirty || 0);
    });
    return { clean, dirty };
  }

  function computeOwnedDistrictMinuteIncome(districts, ownerName) {
    if (!ownerName && !Array.isArray(districts)) return { clean: 0, dirty: 0 };

    let clean = 0;
    let dirty = 0;
    (Array.isArray(districts) ? districts : []).forEach((district) => {
      if (!isDistrictOwnedByScenarioPlayer(district, ownerName)) return;
      if (Boolean(district?.isDestroyed)) return;
      const typeKey = String(district?.type || "").trim().toLowerCase();
      const config = LOCAL_SCENARIO_DISTRICT_INCOME_RULES[typeKey];
      if (!config) return;
      clean += config.clean;
      dirty += config.dirty;
    });
    return { clean, dirty };
  }

  const BLACKOUT_BUILDING_MINUTE_INCOME_RULES = Object.freeze({
    "Autosalon": Object.freeze({ clean: 5, dirty: 1 }),
    "Fitness club": Object.freeze({ clean: 6, dirty: 0.5 }),
    "Herna": Object.freeze({ clean: 6, dirty: 1.2 }),
    "Kancelářský blok": Object.freeze({ clean: 6, dirty: 1 }),
    "Kasino": Object.freeze({ clean: 8, dirty: 2.2 }),
    "Lékárna": Object.freeze({ clean: 3, dirty: 0.4 }),
    "Obchodní centrum": Object.freeze({ clean: 8, dirty: 1 }),
    "Restaurace": Object.freeze({ clean: 5, dirty: 0.5 }),
    "Směnárna": Object.freeze({ clean: 5.5, dirty: 1.3 }),
    "Datové centrum": Object.freeze({ clean: 5, dirty: 0.4 }),
    "Energetická stanice": Object.freeze({ clean: 4, dirty: 0.3 }),
    "Sklad": Object.freeze({ clean: 2, dirty: 0.2 }),
    "Továrna": Object.freeze({ clean: 1, dirty: 0.2 }),
    "Zbrojovka": Object.freeze({ clean: 1.2, dirty: 0.5 }),
    "Brainwash centrum": Object.freeze({ clean: 8, dirty: 1.5 }),
    "Bytový blok": Object.freeze({ clean: 1.5, dirty: 0.5 }),
    Garage: Object.freeze({ clean: 3, dirty: 0.5 }),
    Klinika: Object.freeze({ clean: 2.5, dirty: 0.3 }),
    "Rekrutační centrum": Object.freeze({ clean: 2, dirty: 0.3 }),
    "Škola": Object.freeze({ clean: 4.4, dirty: 1 }),
    "Drug lab": Object.freeze({ clean: 1.5, dirty: 2 }),
    "Pašovací tunel": Object.freeze({ clean: 0.2, dirty: 3 }),
    "Pouliční dealeři": Object.freeze({ clean: 0.1, dirty: 4.5 }),
    "Strip club": Object.freeze({ clean: 8, dirty: 2 }),
    "Večerka": Object.freeze({ clean: 3.5, dirty: 1.3 }),
    "Burza": Object.freeze({ clean: 18, dirty: 1 }),
    "Centrální banka": Object.freeze({ clean: 26, dirty: 1 }),
    "Letiště": Object.freeze({ clean: 19, dirty: 1 }),
    "Lobby klub": Object.freeze({ clean: 3, dirty: 22 }),
    "Magistrát": Object.freeze({ clean: 25, dirty: 6 }),
    "Parlament": Object.freeze({ clean: 22, dirty: 3 }),
    "Přístav": Object.freeze({ clean: 26, dirty: 8.5 }),
    "Soud": Object.freeze({ clean: 20, dirty: 10 }),
    "VIP salonek": Object.freeze({ clean: 8, dirty: 22 }),
    "Taxi služba": Object.freeze({ clean: 5.5, dirty: 1.5 })
  });

  function computeOwnedBuildingMinuteIncome(districts, ownerName) {
    if (!ownerName && !Array.isArray(districts)) return { clean: 0, dirty: 0, byBuilding: {} };

    let clean = 0;
    let dirty = 0;
    const byBuilding = {};
    (Array.isArray(districts) ? districts : []).forEach((district) => {
      if (!isDistrictOwnedByScenarioPlayer(district, ownerName)) return;
      if (Boolean(district?.isDestroyed)) return;
      (Array.isArray(district?.buildings) ? district.buildings : []).forEach((building) => {
        const rule = BLACKOUT_BUILDING_MINUTE_INCOME_RULES[String(building || "").trim()];
        if (!rule) return;
        clean += Number(rule.clean || 0);
        dirty += Number(rule.dirty || 0);
        byBuilding[building] = byBuilding[building] || { clean: 0, dirty: 0, count: 0 };
        byBuilding[building].clean += Number(rule.clean || 0);
        byBuilding[building].dirty += Number(rule.dirty || 0);
        byBuilding[building].count += 1;
      });
    });
    return { clean, dirty, byBuilding };
  }

  function computeBuildingMinuteIncomeFromOwnedDistricts(districts) {
    let clean = 0;
    let dirty = 0;
    const byBuilding = {};
    (Array.isArray(districts) ? districts : []).forEach((district) => {
      if (Boolean(district?.isDestroyed)) return;
      (Array.isArray(district?.buildings) ? district.buildings : []).forEach((building) => {
        const rule = BLACKOUT_BUILDING_MINUTE_INCOME_RULES[String(building || "").trim()];
        if (!rule) return;
        clean += Number(rule.clean || 0);
        dirty += Number(rule.dirty || 0);
        byBuilding[building] = byBuilding[building] || { clean: 0, dirty: 0, count: 0 };
        byBuilding[building].clean += Number(rule.clean || 0);
        byBuilding[building].dirty += Number(rule.dirty || 0);
        byBuilding[building].count += 1;
      });
    });
    return { clean, dirty, byBuilding };
  }

  function buildBlackoutPlayerSourcesSnapshot(districts, ownerName) {
    const districtSource = getBlackoutIncomeDistricts(districts);
    const districtIncome = districtSource.length
      ? computeDistrictMinuteIncomeFromOwnedDistricts(districtSource)
      : computeOwnedDistrictMinuteIncome(districts, ownerName);
    const buildingIncome = districtSource.length
      ? computeBuildingMinuteIncomeFromOwnedDistricts(districtSource)
      : computeOwnedBuildingMinuteIncome(districts, ownerName);
    return {
      districtIncomePerMinute: districtIncome,
      buildingIncomePerMinute: {
        clean: buildingIncome.clean,
        dirty: buildingIncome.dirty,
        byBuilding: buildingIncome.byBuilding
      },
      totalPerMinute: {
        clean: districtIncome.clean + buildingIncome.clean,
        dirty: districtIncome.dirty + buildingIncome.dirty
      }
    };
  }

  function hasMeaningfulBlackoutSources(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return false;
    const district = snapshot.districtIncomePerMinute || {};
    const building = snapshot.buildingIncomePerMinute || {};
    return Number(district.clean || 0) > 0
      || Number(district.dirty || 0) > 0
      || Number(building.clean || 0) > 0
      || Number(building.dirty || 0) > 0;
  }

  function syncBlackoutScenarioDistrictIncome(now = Date.now()) {
    if (window.Empire.token || activePlayerScenarioKey !== "alliance-ten-blackout") return;
    const marketState = getLocalMarketState();
    if (!marketState || typeof marketState !== "object") return;

    const scenarioIncomeState = marketState.scenarioIncome && typeof marketState.scenarioIncome === "object"
      ? marketState.scenarioIncome
      : {};
    let lastAppliedAt = Number(scenarioIncomeState[BLACKOUT_SCENARIO_INCOME_STORAGE_KEY] || now);
    let cleanRemainder = Number(scenarioIncomeState.cleanRemainder || 0);
    let dirtyRemainder = Number(scenarioIncomeState.dirtyRemainder || 0);
    let buildingCleanRemainder = Number(scenarioIncomeState.buildingCleanRemainder || 0);
    let buildingDirtyRemainder = Number(scenarioIncomeState.buildingDirtyRemainder || 0);
    if (!Number.isFinite(lastAppliedAt) || lastAppliedAt > now) {
      lastAppliedAt = now;
    }
    if (!Number.isFinite(cleanRemainder) || cleanRemainder < 0) {
      cleanRemainder = 0;
    }
    if (!Number.isFinite(dirtyRemainder) || dirtyRemainder < 0) {
      dirtyRemainder = 0;
    }
    if (!Number.isFinite(buildingCleanRemainder) || buildingCleanRemainder < 0) {
      buildingCleanRemainder = 0;
    }
    if (!Number.isFinite(buildingDirtyRemainder) || buildingDirtyRemainder < 0) {
      buildingDirtyRemainder = 0;
    }

    const elapsedMs = Math.max(0, now - lastAppliedAt);
    if (elapsedMs <= 0) {
      if (scenarioIncomeState[BLACKOUT_SCENARIO_INCOME_STORAGE_KEY] == null) {
        marketState.scenarioIncome = {
          ...scenarioIncomeState,
          [BLACKOUT_SCENARIO_INCOME_STORAGE_KEY]: now
        };
        saveLocalMarketState(marketState);
      }
      syncGuestEconomyFromMarket();
      return;
    }

    const liveBlackoutSources = buildBlackoutPlayerSourcesSnapshot(window.Empire.districts, resolveActiveScenarioOwnerName());
    if (hasMeaningfulBlackoutSources(liveBlackoutSources)) {
      lastValidBlackoutSources = liveBlackoutSources;
    }
    const activeBlackoutSources = hasMeaningfulBlackoutSources(liveBlackoutSources)
      ? liveBlackoutSources
      : lastValidBlackoutSources || liveBlackoutSources;
    const incomePerMinute = activeBlackoutSources.districtIncomePerMinute || { clean: 0, dirty: 0 };
    const buildingIncomePerMinute = activeBlackoutSources.buildingIncomePerMinute || { clean: 0, dirty: 0, byBuilding: {} };
    const elapsedMinutes = elapsedMs / 60000;
    if (incomePerMinute.clean > 0) {
      const cleanRaw = incomePerMinute.clean * elapsedMinutes + cleanRemainder;
      const cleanWhole = Math.floor(cleanRaw);
      cleanRemainder = Math.max(0, cleanRaw - cleanWhole);
      if (cleanWhole > 0) {
        addLocalMoney(marketState.balances, cleanWhole, "clean");
      }
    }
    if (incomePerMinute.dirty > 0) {
      const dirtyRaw = incomePerMinute.dirty * elapsedMinutes + dirtyRemainder;
      const dirtyWhole = Math.floor(dirtyRaw);
      dirtyRemainder = Math.max(0, dirtyRaw - dirtyWhole);
      if (dirtyWhole > 0) {
        addLocalMoney(marketState.balances, dirtyWhole, "dirty");
      }
    }
    if (buildingIncomePerMinute.clean > 0) {
      const cleanRaw = buildingIncomePerMinute.clean * elapsedMinutes + buildingCleanRemainder;
      const cleanWhole = Math.floor(cleanRaw);
      buildingCleanRemainder = Math.max(0, cleanRaw - cleanWhole);
      if (cleanWhole > 0) {
        addLocalMoney(marketState.balances, cleanWhole, "clean");
      }
    }
    if (buildingIncomePerMinute.dirty > 0) {
      const dirtyRaw = buildingIncomePerMinute.dirty * elapsedMinutes + buildingDirtyRemainder;
      const dirtyWhole = Math.floor(dirtyRaw);
      buildingDirtyRemainder = Math.max(0, dirtyRaw - dirtyWhole);
      if (dirtyWhole > 0) {
        addLocalMoney(marketState.balances, dirtyWhole, "dirty");
      }
    }

    marketState.scenarioIncome = {
      ...scenarioIncomeState,
      [BLACKOUT_SCENARIO_INCOME_STORAGE_KEY]: now,
      cleanRemainder,
      dirtyRemainder,
      buildingCleanRemainder,
      buildingDirtyRemainder,
      buildingIncome: {
        cleanPerMinute: buildingIncomePerMinute.clean,
        dirtyPerMinute: buildingIncomePerMinute.dirty,
        byBuilding: buildingIncomePerMinute.byBuilding
      }
    };
    saveLocalMarketState(marketState);
    syncGuestEconomyFromMarket();
  }

  function startScenarioIncomeTicker() {
    stopScenarioIncomeTicker();
    syncBlackoutScenarioDistrictIncome();
    scenarioIncomeTimer = setInterval(() => {
      syncBlackoutScenarioDistrictIncome();
    }, 10000);
  }

  function stopPoliceRaidProtectionTicker() {
    if (!policeRaidProtectionTimer) return;
    clearInterval(policeRaidProtectionTimer);
    policeRaidProtectionTimer = null;
  }

  function syncPoliceRaidProtectionDisplays() {
    const profile = cachedProfile || window.Empire.player || {};
    const protectionText = `Ochrana po razii: ${formatPoliceRaidProtectionLabel(profile)}`;
    const gangHeatProtection = document.getElementById("gang-heat-modal-protection");
    if (gangHeatProtection && !gangHeatProtection.closest(".hidden")) {
      gangHeatProtection.textContent = protectionText;
    }
    const profileProtection = document.getElementById("profile-modal-raid-protection");
    if (profileProtection && !profileProtection.closest(".hidden")) {
      profileProtection.textContent = formatPoliceRaidProtectionLabel(profile);
    }
    const wantedEl = document.getElementById("profile-modal-wanted");
    const wantedLockEl = document.getElementById("profile-modal-wanted-lock");
    if (wantedEl && !wantedEl.closest(".hidden")) {
      wantedEl.title = `Hledanost: ${formatWantedHeat(resolveWantedLevel(profile))} | ${formatPoliceRaidProtectionLabel(profile)}`;
    }
    if (wantedLockEl) {
      const until = resolvePoliceRaidProtectionUntil(profile);
      const active = until > Date.now();
      wantedLockEl.classList.toggle("hidden", !active);
      wantedLockEl.title = active ? `Aktivní ochrana po razii: ${formatDurationLabel(until - Date.now())}` : "Bez aktivní ochrany po razii";
    }
  }

  function startPoliceRaidProtectionTicker() {
    stopPoliceRaidProtectionTicker();
    syncPoliceRaidProtectionDisplays();
    policeRaidProtectionTimer = setInterval(() => {
      syncPoliceRaidProtectionDisplays();
    }, 1000);
  }

  function initMapModeControls() {
    const root = document.getElementById("map-mode-switch");
    const buttons = Array.from(document.querySelectorAll("[data-map-mode]"));
    if (!root || !buttons.length) return;

    const syncVisibility = () => {
      root.classList.toggle("hidden", activePlayerScenarioKey === "alliance-ten-blackout");
    };

    const syncState = () => {
      const activeMode = String(window.Empire.Map?.getMapMode?.() || "night").trim().toLowerCase();
      if (!activePlayerScenarioKey || activePlayerScenarioKey === "alliance-ten-blackout") {
        roundStatusOverride = buildRoundStatusPresetForMode(activeMode);
        renderRoundStatusState();
      }
      buttons.forEach((button) => {
        const mode = String(button.getAttribute("data-map-mode") || "").trim().toLowerCase();
        button.classList.toggle("is-active", mode === activeMode);
        button.setAttribute("aria-pressed", mode === activeMode ? "true" : "false");
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = String(button.getAttribute("data-map-mode") || "").trim().toLowerCase();
        if (!mode) return;
        roundStatusOverride = buildRoundStatusPresetForMode(mode);
        window.Empire.Map?.setMapMode?.(mode);
        renderRoundStatusState();
        syncState();
      });
    });

    document.addEventListener("empire:map-mode-changed", syncState);
    document.addEventListener("empire:scenario-applied", syncVisibility);
    syncState();
    syncVisibility();
  }

  function initMobileTopbarScrollState() {
    const media = window.matchMedia("(max-width: 720px)");
    const topbar = document.querySelector(".topbar");
    let ticking = false;
    let condensed = false;

    const applyState = () => {
      ticking = false;
      if (media.matches) {
        const scrollY = Math.max(0, window.scrollY || 0);
        if (!condensed && scrollY > 44) {
          condensed = true;
        } else if (condensed && scrollY < 18) {
          condensed = false;
        }
      } else {
        condensed = false;
      }
      document.body.classList.toggle("is-mobile-topbar-condensed", condensed);
      if (topbar && media.matches) {
        document.documentElement.style.setProperty("--mobile-topbar-offset", `${Math.ceil(topbar.offsetHeight)}px`);
      } else {
        document.documentElement.style.removeProperty("--mobile-topbar-offset");
      }
      if (topbar && !media.matches) {
        document.documentElement.style.setProperty("--desktop-topbar-offset", `${Math.ceil(topbar.offsetHeight)}px`);
      } else {
        document.documentElement.style.removeProperty("--desktop-topbar-offset");
      }
    };

    const requestApply = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyState);
    };

    applyState();
    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", requestApply);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", requestApply);
      window.visualViewport.addEventListener("scroll", requestApply);
    }
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", requestApply);
    } else if (typeof media.addListener === "function") {
      media.addListener(requestApply);
    }
  }

  function setMobileTopbarCoveredByPrimaryModal(covered) {
    const media = window.matchMedia("(max-width: 720px)");
    document.body.classList.toggle("mobile-primary-modal-covers-topbar", Boolean(covered) && media.matches);
  }

  function initMobileScenarioCardPlacement() {
    const scenarioCard = document.getElementById("scenario-card");
    const scenarioAnchor = document.getElementById("scenario-card-anchor");
    const main = document.querySelector(".main");
    if (!scenarioCard || !scenarioAnchor || !main) return;

    const media = window.matchMedia("(max-width: 720px)");
    const restoreToPanel = () => {
      if (scenarioCard.parentElement === scenarioAnchor.parentElement && scenarioCard.previousElementSibling === scenarioAnchor) {
        return;
      }
      scenarioAnchor.insertAdjacentElement("afterend", scenarioCard);
    };

    const moveUnderResources = () => {
      if (scenarioCard.parentElement === main && scenarioCard === main.firstElementChild) {
        return;
      }
      main.insertAdjacentElement("afterbegin", scenarioCard);
    };

    const applyPlacement = () => {
      if (media.matches) {
        moveUnderResources();
        return;
      }
      restoreToPanel();
    };

    applyPlacement();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyPlacement);
    } else if (typeof media.addListener === "function") {
      media.addListener(applyPlacement);
    }
    window.addEventListener("resize", applyPlacement);
  }

  function initMobileLeaderboardCardPlacement() {
    const leaderboardCard = document.getElementById("leaderboard-card");
    const leaderboardAnchor = document.getElementById("leaderboard-card-anchor");
    const allianceChatCard = document.getElementById("alliance-chat-card");
    if (!leaderboardCard || !leaderboardAnchor || !allianceChatCard) return;

    const media = window.matchMedia("(max-width: 1200px)");

    const restoreToLeftPanel = () => {
      if (
        leaderboardCard.parentElement === leaderboardAnchor.parentElement
        && leaderboardCard.previousElementSibling === leaderboardAnchor
      ) {
        return;
      }
      leaderboardAnchor.insertAdjacentElement("afterend", leaderboardCard);
    };

    const moveUnderAllianceChat = () => {
      if (
        leaderboardCard.parentElement === allianceChatCard.parentElement
        && leaderboardCard.previousElementSibling === allianceChatCard
      ) {
        return;
      }
      allianceChatCard.insertAdjacentElement("afterend", leaderboardCard);
    };

    const applyPlacement = () => {
      if (media.matches) {
        moveUnderAllianceChat();
        return;
      }
      restoreToLeftPanel();
    };

    applyPlacement();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyPlacement);
    } else if (typeof media.addListener === "function") {
      media.addListener(applyPlacement);
    }
    window.addEventListener("resize", applyPlacement);
  }

  function initMobileMarketBuildingShortcutsPlacement() {
    const shortcuts = document.getElementById("market-building-shortcuts");
    const homeAnchor = document.getElementById("market-building-shortcuts-anchor");
    const mobileAnchor = document.getElementById("mobile-market-shortcuts-anchor");
    if (!shortcuts || !homeAnchor || !mobileAnchor) return;

    const media = window.matchMedia("(max-width: 720px)");

    const restoreToLeftPanel = () => {
      if (
        shortcuts.parentElement === homeAnchor.parentElement
        && shortcuts.previousElementSibling === homeAnchor
      ) {
        return;
      }
      homeAnchor.insertAdjacentElement("afterend", shortcuts);
    };

    const moveUnderProfile = () => {
      if (
        shortcuts.parentElement === mobileAnchor.parentElement
        && shortcuts.previousElementSibling === mobileAnchor
      ) {
        return;
      }
      mobileAnchor.insertAdjacentElement("afterend", shortcuts);
    };

    const applyPlacement = () => {
      if (media.matches) {
        moveUnderProfile();
        return;
      }
      restoreToLeftPanel();
    };

    applyPlacement();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyPlacement);
    } else if (typeof media.addListener === "function") {
      media.addListener(applyPlacement);
    }
    window.addEventListener("resize", applyPlacement);
  }

  function initMobilePrimaryActionCardsPlacement() {
    const shortcuts = document.getElementById("market-building-shortcuts");
    const cityEventsCard = document.getElementById("city-events-open")?.closest(".card");
    const buildingsCard = document.getElementById("buildings-open")?.closest(".card");
    const marketCard = document.getElementById("market-open")?.closest(".card");
    const cityEventsAnchor = document.getElementById("city-events-card-anchor");
    const buildingsAnchor = document.getElementById("buildings-card-anchor");
    const marketAnchor = document.getElementById("market-card-anchor");
    if (
      !shortcuts
      || !cityEventsCard
      || !buildingsCard
      || !marketCard
      || !cityEventsAnchor
      || !buildingsAnchor
      || !marketAnchor
    ) {
      return;
    }

    const media = window.matchMedia("(max-width: 720px)");

    const restoreToLeftPanel = () => {
      cityEventsAnchor.insertAdjacentElement("afterend", cityEventsCard);
      buildingsAnchor.insertAdjacentElement("afterend", buildingsCard);
      marketAnchor.insertAdjacentElement("afterend", marketCard);
    };

    const moveUnderShortcuts = () => {
      let insertAfter = shortcuts;
      [cityEventsCard, buildingsCard, marketCard].forEach((card) => {
        insertAfter.insertAdjacentElement("afterend", card);
        insertAfter = card;
      });
    };

    const applyPlacement = () => {
      if (media.matches) {
        moveUnderShortcuts();
        return;
      }
      restoreToLeftPanel();
    };

    applyPlacement();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyPlacement);
    } else if (typeof media.addListener === "function") {
      media.addListener(applyPlacement);
    }
    window.addEventListener("resize", applyPlacement);
  }

  function initMobileModalTopbarResourceVisibility() {
    const media = window.matchMedia("(max-width: 720px)");
    const modalNodes = Array.from(document.querySelectorAll(".modal"));
    const topbarHiddenModalIds = new Set([
      "events-modal",
      "buildings-modal",
      "storage-modal",
      "leaderboard-modal",
      "profile-modal",
      "gang-heat-modal",
      "alliance-modal",
      "alliance-create-modal",
      "alliance-management-modal",
      "settings-modal",
      "district-modal",
      "district-defense-modal",
      "spy-confirm-modal",
      "raid-confirm-modal",
      "occupy-confirm-modal",
      "spy-result-modal",
      "spy-warning-modal",
      "raid-result-modal",
      "police-action-result-modal",
      "boost-modal",
      "attack-modal",
      "attack-confirm-modal",
      "attack-result-modal"
    ]);
    if (!modalNodes.length) return;

    const applyState = () => {
      if (!media.matches) {
        document.body.classList.remove("mobile-hide-topbar");
        document.body.classList.remove("mobile-hide-topbar-stats");
        document.body.classList.remove("mobile-police-modal-open");
        document.body.classList.remove("mobile-boost-modal-open");
        return;
      }

      const openModals = modalNodes.filter((modal) => !modal.classList.contains("hidden"));
      const shouldHideTopbar = openModals.some((modal) => topbarHiddenModalIds.has(modal.id));
      const policeModalOpen = openModals.some((modal) => modal.id === "police-action-result-modal");
      const boostModalOpen = openModals.some((modal) => modal.id === "boost-modal");
      const keepStatsVisible = openModals.some((modal) => (
        modal.id === "building-detail-modal"
        || modal.id === "market-modal"
        || modal.id === "alliance-modal"
      ));
      const shouldHideStats = openModals.length > 0 && !keepStatsVisible;
      document.body.classList.toggle("mobile-hide-topbar", shouldHideTopbar);
      document.body.classList.toggle("mobile-hide-topbar-stats", shouldHideStats);
      document.body.classList.toggle("mobile-police-modal-open", policeModalOpen);
      document.body.classList.toggle("mobile-boost-modal-open", boostModalOpen);
    };

    const observer = new MutationObserver((mutations) => {
      if (!mutations?.length) return;
      applyState();
    });

    modalNodes.forEach((modal) => {
      observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
    });

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyState);
    } else if (typeof media.addListener === "function") {
      media.addListener(applyState);
    }
    window.addEventListener("resize", applyState);
    applyState();
  }

  function recordVerifiedIntelEvent(payload = {}) {
    const record = window.Empire.Map?.recordIntelEvent;
    if (typeof record !== "function") return;
    try {
      record({
        ...payload,
        intelLevel: "verified"
      });
    } catch {}
  }

  function normalizeSpyIntelKnownFields(rawEntry) {
    const rawKnownFields = rawEntry?.knownFields && typeof rawEntry.knownFields === "object"
      ? rawEntry.knownFields
      : null;
    return {
      weapons: rawKnownFields
        ? rawKnownFields.weapons !== false
        : rawEntry?.weapons !== null && rawEntry?.weapons !== undefined && rawEntry?.weapons !== "",
      powerRangeLabel: rawKnownFields
        ? rawKnownFields.powerRangeLabel !== false
        : Boolean(String(rawEntry?.powerRangeLabel || "").trim()),
      districtType: rawKnownFields
        ? rawKnownFields.districtType !== false
        : Boolean(String(rawEntry?.districtType || "").trim()),
      atmosphere: rawKnownFields
        ? rawKnownFields.atmosphere !== false
        : Boolean(String(rawEntry?.atmosphere || "").trim()),
      buildings: rawKnownFields
        ? rawKnownFields.buildings !== false
        : Array.isArray(rawEntry?.buildings)
    };
  }

  function normalizeDistrictSpyIntelEntry(districtId, rawEntry) {
    const id = Number(districtId);
    if (!Number.isFinite(id)) return null;
    if (!rawEntry || typeof rawEntry !== "object") return null;

    const knownFields = normalizeSpyIntelKnownFields(rawEntry);
    const rawWeapons = Number(rawEntry.weapons);
    const weapons = knownFields.weapons && Number.isFinite(rawWeapons)
      ? Math.max(0, Math.floor(rawWeapons))
      : null;
    const powerRangeLabel = knownFields.powerRangeLabel
      ? (String(rawEntry.powerRangeLabel || "").trim() || "Neznámá")
      : null;
    const buildings = knownFields.buildings && Array.isArray(rawEntry.buildings)
      ? rawEntry.buildings
        .map((item) => String(item || "").trim())
        .filter(Boolean)
      : [];
    const districtType = knownFields.districtType
      ? (String(rawEntry.districtType || "").trim() || "Neznámý")
      : null;
    const atmosphere = knownFields.atmosphere
      ? (String(rawEntry.atmosphere || "").trim() || "Neznámá")
      : null;
    const createdAt = Number(rawEntry.createdAt);

    return {
      districtId: id,
      weapons,
      powerRangeLabel,
      buildings,
      districtType,
      atmosphere,
      knownFields,
      createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt) : Date.now()
    };
  }

  function readStoredDistrictSpyIntel() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_DISTRICT_SPY_INTEL_KEY) || "{}");
      if (!parsed || typeof parsed !== "object") return;
      Object.entries(parsed).forEach(([districtId, rawEntry]) => {
        const normalized = normalizeDistrictSpyIntelEntry(districtId, rawEntry);
        if (!normalized) return;
        districtSpyIntelCache.set(String(normalized.districtId), normalized);
      });
    } catch {}
  }

  function writeStoredDistrictSpyIntel() {
    const serialized = {};
    districtSpyIntelCache.forEach((entry, districtId) => {
      serialized[String(districtId)] = {
        weapons: entry.weapons,
        powerRangeLabel: entry.powerRangeLabel,
        buildings: Array.isArray(entry.buildings) ? [...entry.buildings] : [],
        districtType: entry.districtType,
        atmosphere: entry.atmosphere,
        knownFields: { ...(entry.knownFields || {}) },
        createdAt: entry.createdAt
      };
    });
    localStorage.setItem(LOCAL_DISTRICT_SPY_INTEL_KEY, JSON.stringify(serialized));
  }

  function clearDistrictSpyIntel(districtId) {
    const key = String(Number(districtId));
    if (!districtSpyIntelCache.has(key)) return false;
    districtSpyIntelCache.delete(key);
    writeStoredDistrictSpyIntel();
    return true;
  }

  function applyOneTimeDistrictSpyIntelReset() {
    const alreadyApplied = localStorage.getItem(DISTRICT_SPY_INTEL_RESET_ONCE_KEY) === "1";
    if (alreadyApplied) return;
    DISTRICT_SPY_INTEL_RESET_IDS.forEach((districtId) => {
      clearDistrictSpyIntel(districtId);
    });
    localStorage.setItem(DISTRICT_SPY_INTEL_RESET_ONCE_KEY, "1");
  }

  function setDistrictSpyIntel(districtId, intelData, options = {}) {
    const persist = options?.persist !== false;
    const normalized = normalizeDistrictSpyIntelEntry(districtId, intelData);
    if (!normalized) return null;
    districtSpyIntelCache.set(String(normalized.districtId), normalized);
    if (persist) {
      writeStoredDistrictSpyIntel();
    }
    return { ...normalized, buildings: [...normalized.buildings] };
  }

  function getDistrictSpyIntel(districtId) {
    const key = String(Number(districtId));
    if (!districtSpyIntelCache.has(key)) return null;
    const value = districtSpyIntelCache.get(key);
    if (!value) return null;
    return { ...value, buildings: [...value.buildings] };
  }

  function normalizeSpyCount(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return Math.max(0, Math.floor(Number(fallback) || 0));
    return Math.max(0, Math.floor(parsed));
  }

  function resolveFactionBaseSpyCount(structureValue) {
    const factionKey = String(structureValue || "").trim().toLowerCase();
    const configured = BASE_SPY_COUNT_BY_FACTION[factionKey];
    return Number.isFinite(Number(configured))
      ? normalizeSpyCount(configured, DEFAULT_BASE_SPY_COUNT)
      : DEFAULT_BASE_SPY_COUNT;
  }

  function readStoredSpyCount() {
    const parsed = Number(localStorage.getItem(LOCAL_SPY_COUNT_KEY));
    if (!Number.isFinite(parsed)) return null;
    return normalizeSpyCount(parsed, null);
  }

  function resolveSpyCountFromPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    const candidates = [
      payload.spyCount,
      payload.spy_count,
      payload.spies,
      payload.spyAgents,
      payload.spy_agents,
      payload.availableSpies,
      payload.available_spies
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const parsed = Number(candidates[i]);
      if (Number.isFinite(parsed)) return normalizeSpyCount(parsed, 0);
    }
    return null;
  }

  function getSpyCount() {
    if (cachedSpyCount != null) return cachedSpyCount;
    const fromStorage = readStoredSpyCount();
    if (fromStorage != null) {
      cachedSpyCount = fromStorage;
      return cachedSpyCount;
    }
    const fallbackFaction = cachedProfile?.structure || localStorage.getItem("empire_structure");
    cachedSpyCount = resolveFactionBaseSpyCount(fallbackFaction);
    localStorage.setItem(LOCAL_SPY_COUNT_KEY, String(cachedSpyCount));
    return cachedSpyCount;
  }

  function renderInfluenceSpyTopbarStat({ animate = false } = {}) {
    const wrap = document.getElementById("stat-influence-wrap");
    const label = document.getElementById("stat-influence-label");
    const value = document.getElementById("stat-influence");
    if (!wrap || !label || !value) return;

    const influenceValue = normalizeSpyCount(cachedEconomy?.influence || 0, 0);
    const spyCount = getSpyCount();
    const topbarMode = isSpyCountShownInTopbar ? "spies" : "influence";

    value.dataset.influenceValue = String(influenceValue);
    value.dataset.spyValue = String(spyCount);
    label.textContent = topbarMode === "spies" ? "Špeh" : "Vliv";
    if (topbarMode === "spies") {
      stopMoneyStatCounter(value);
      value.textContent = String(spyCount);
    } else if (lastRenderedTopbarMode === "influence" && lastRenderedInfluenceValue != null) {
      animateMoneyStatCounter(value, influenceValue, { prefix: "" });
      if (influenceValue !== lastRenderedInfluenceValue) {
        animateMoneyStatValue(value, influenceValue - lastRenderedInfluenceValue);
      }
    } else {
      stopMoneyStatCounter(value);
      value.textContent = String(influenceValue);
    }
    lastRenderedInfluenceValue = influenceValue;
    lastRenderedTopbarMode = topbarMode;
    wrap.classList.toggle("is-spies", isSpyCountShownInTopbar);

    const shownLabel = isSpyCountShownInTopbar ? `${spyCount} špehů` : `${influenceValue} vlivu`;
    const hiddenLabel = isSpyCountShownInTopbar ? `${influenceValue} vlivu` : `${spyCount} špehů`;
    wrap.setAttribute("aria-label", `${shownLabel}. Klikni pro přepnutí na ${hiddenLabel}.`);

    if (!animate) return;
    wrap.classList.remove("is-switching");
    void wrap.offsetWidth;
    wrap.classList.add("is-switching");
    if (topbarStatSwitchTimer) clearTimeout(topbarStatSwitchTimer);
    topbarStatSwitchTimer = setTimeout(() => {
      wrap.classList.remove("is-switching");
      topbarStatSwitchTimer = null;
    }, 340);
  }

  function setSpyCount(value, { persist = true, animate = false } = {}) {
    cachedSpyCount = normalizeSpyCount(value, 0);
    if (persist) {
      localStorage.setItem(LOCAL_SPY_COUNT_KEY, String(cachedSpyCount));
    }
    if (cachedEconomy && typeof cachedEconomy === "object") {
      cachedEconomy.spyCount = cachedSpyCount;
      cachedEconomy.spies = cachedSpyCount;
    }
    renderInfluenceSpyTopbarStat({ animate });
    const spyModal = document.getElementById("spy-confirm-modal");
    if (spyModal && !spyModal.classList.contains("hidden")) {
      renderSpyConfirmModal();
    }
    return cachedSpyCount;
  }

  function consumeSpyAgents(amount = 1) {
    const required = normalizeSpyCount(amount, 0);
    if (required <= 0) return true;
    const available = getSpyCount();
    if (available < required) return false;
    setSpyCount(available - required, { persist: true, animate: isSpyCountShownInTopbar });
    return true;
  }

  function normalizeSpyRecoveryQueue(value) {
    if (!Array.isArray(value)) return [];
    const now = Date.now();
    return value
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry) && entry > now - 24 * 60 * 60 * 1000)
      .map((entry) => Math.max(0, Math.floor(entry)))
      .sort((a, b) => a - b);
  }

  function readSpyRecoveryQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_SPY_RECOVERY_QUEUE_KEY) || "[]");
      return normalizeSpyRecoveryQueue(parsed);
    } catch {
      return [];
    }
  }

  function writeSpyRecoveryQueue(queue) {
    localStorage.setItem(LOCAL_SPY_RECOVERY_QUEUE_KEY, JSON.stringify(normalizeSpyRecoveryQueue(queue)));
  }

  function syncSpyRecoveryTicker() {
    const queue = readSpyRecoveryQueue();
    if (!queue.length) {
      if (spyRecoveryIntervalId != null) {
        clearInterval(spyRecoveryIntervalId);
        spyRecoveryIntervalId = null;
      }
      return;
    }
    if (spyRecoveryIntervalId != null) return;
    spyRecoveryIntervalId = setInterval(() => {
      processSpyRecoveryQueue({ notify: true });
    }, SPY_RECOVERY_TICK_MS);
  }

  function processSpyRecoveryQueue({ notify = false } = {}) {
    const queue = readSpyRecoveryQueue();
    if (!queue.length) {
      syncSpyRecoveryTicker();
      return 0;
    }

    const now = Date.now();
    let recovered = 0;
    const pending = [];
    queue.forEach((entry) => {
      if (entry <= now) {
        recovered += 1;
      } else {
        pending.push(entry);
      }
    });
    writeSpyRecoveryQueue(pending);
    if (recovered > 0) {
      setSpyCount(getSpyCount() + recovered, { persist: true, animate: isSpyCountShownInTopbar });
      if (notify) {
        pushEvent(
          recovered === 1
            ? "1 špeh je opět dostupný."
            : `${recovered} špehové jsou opět dostupní.`
        );
      }
    }
    syncSpyRecoveryTicker();
    return recovered;
  }

  function enqueueSpyRecovery(amount = 1, cooldownMs = SPY_RECOVERY_COOLDOWN_MS) {
    const count = normalizeSpyCount(amount, 0);
    if (count <= 0) return;
    const delay = Math.max(0, Math.floor(Number(cooldownMs) || SPY_RECOVERY_COOLDOWN_MS));
    const now = Date.now();
    const queue = readSpyRecoveryQueue();
    for (let i = 0; i < count; i += 1) {
      queue.push(now + delay);
    }
    writeSpyRecoveryQueue(queue);
    syncSpyRecoveryTicker();
  }

  function initInfluenceSpyToggle() {
    const wrap = document.getElementById("stat-influence-wrap");
    if (!wrap || wrap.dataset.spyToggleBound === "1") return;
    wrap.dataset.spyToggleBound = "1";

    const toggle = () => {
      isSpyCountShownInTopbar = !isSpyCountShownInTopbar;
      renderInfluenceSpyTopbarStat({ animate: true });
    };

    wrap.addEventListener("click", toggle);
    wrap.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle();
    });

    renderInfluenceSpyTopbarStat();
  }

  function bindActions() {
    initEventsModal();
    initBuildingsModal();
    initAllianceModal();
    initMarketModal();
    initBoostModal();
    initMapBorderModeControls();
    initMarketBuildingShortcuts();
    initLeaderboardModal();
    initStorageModal();
    initMoneyStatSkipControls();
    initInfluenceSpyToggle();
    initWeaponsModal();
    initWeaponsPopover();
    initDistrictDefenseModal();
    initAttackModal();
    initAttackConfirmModal();
    initAttackResultModal();
    initRaidResultModal();
    initPoliceActionResultModal();
    initSpyConfirmModal();
    initRaidConfirmModal();
    initOccupyConfirmModal();
    initTrapConfirmModal();
    initSpyResultModal();
    initSpyDetectionAlertModal();
    initGangHeatModal();
    initEventFeedControls();
    initPlayerScenarioButtons();
    document.getElementById("attack-btn").addEventListener("click", async () => {
      if (!window.Empire.selectedDistrict) return;
      const attackBtn = document.getElementById("attack-btn");
      const actionMode = attackBtn?.dataset?.actionMode === "occupy" ? "occupy" : "attack";
      const availability = evaluateDistrictActionAvailability(window.Empire.selectedDistrict, actionMode);
      if (!availability.allowed) {
        pushEvent(availability.reason);
        return;
      }
      if (actionMode === "occupy") {
        openOccupyConfirmModal(window.Empire.selectedDistrict);
        return;
      }
      openAttackModal(window.Empire.selectedDistrict);
    });

    const raidBtn = document.getElementById("raid-btn");
    if (raidBtn) {
      raidBtn.addEventListener("click", () => {
        if (!window.Empire.selectedDistrict) return;
        const availability = evaluateDistrictActionAvailability(window.Empire.selectedDistrict, "raid");
        if (!availability.allowed) {
          pushEvent(availability.reason);
          return;
        }
        if (isRaidActionRunning()) {
          pushEvent("Krádež už právě probíhá. Současně může běžet jen jedna.");
          return;
        }
        const cooldownMs = getRaidCooldownRemainingMs();
        if (cooldownMs > 0) {
          pushEvent(`Krádež je na cooldownu ještě ${formatRaidCooldownLabel(cooldownMs)}.`);
          return;
        }
        openRaidConfirmModal(window.Empire.selectedDistrict);
      });
    }

    const spyBtn = document.getElementById("spy-btn");
    if (spyBtn) {
      spyBtn.addEventListener("click", () => {
        if (!window.Empire.selectedDistrict) return;
        const availability = evaluateDistrictActionAvailability(window.Empire.selectedDistrict, "spy");
        if (!availability.allowed) {
          pushEvent(availability.reason);
          return;
        }
        openSpyConfirmModal(window.Empire.selectedDistrict);
      });
    }

    const defenseBtn = document.getElementById("defense-btn");
    if (defenseBtn) {
      defenseBtn.addEventListener("click", () => {
        if (!window.Empire.selectedDistrict) return;
        if (!isDistrictDefendableByPlayer(window.Empire.selectedDistrict)) {
          pushEvent("Obranu lze nastavovat jen ve vlastním nebo aliančním distriktu.");
          return;
        }
        const weaponAccess = resolveCombatWeaponAccess("defense");
        if (!weaponAccess.allowed) {
          pushEvent("Pro obranu potřebuješ alespoň 50 členů gangu.");
          return;
        }
        openDistrictDefenseModal(window.Empire.selectedDistrict);
      });
    }

    const trapBtn = document.getElementById("trap-btn");
    if (trapBtn) {
      trapBtn.addEventListener("click", () => {
        const district = window.Empire.selectedDistrict;
        if (!district) return;
        if (!isDistrictDefendableByPlayer(district)) {
          pushEvent("Past lze nastražit jen do vlastního nebo aliančního districtu.");
          return;
        }
        if (isDistrictDestroyed(district)) {
          pushEvent("Do zničeného districtu nelze nastražit past.");
          return;
        }
        const trapState = getDistrictTrapControlState(district);
        if (trapState?.isActiveHere || trapState?.moveLocked) {
          if (trapState?.moveLocked) {
            pushEvent(`Past nelze přesunout ještě ${formatTrapMoveCooldownLabel(trapState.moveCooldownRemainingMs)}.`);
          }
          return;
        }
        openTrapConfirmModal(district);
      });
    }

    const refreshRoundBtn = document.getElementById("refresh-round");
    if (refreshRoundBtn) {
      refreshRoundBtn.addEventListener("click", () => {
        window.Empire.API.refreshRound();
      });
    }

    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.addEventListener("click", () => {
        showProfileModal();
      });
    }

    document.querySelectorAll("[data-nav-settings]").forEach((button) => {
      button.addEventListener("click", () => {
        showSettingsModal();
      });
    });

    document.querySelectorAll("[data-nav-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem("empire_token");
        localStorage.removeItem("empire_structure");
        window.location.href = "login.html";
      });
    });

    const weaponsAttackBtn = document.getElementById("weapons-attack-btn");
    if (weaponsAttackBtn) {
      weaponsAttackBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openWeaponsModal("attack");
      });
    }

    const weaponsDefenseBtn = document.getElementById("weapons-defense-btn");
    if (weaponsDefenseBtn) {
      weaponsDefenseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openWeaponsModal("defense");
      });
    }
  }

  function initBoostModal() {
    const openBtn = document.getElementById("map-boost-btn");
    const root = document.getElementById("boost-modal");
    const backdrop = document.getElementById("boost-modal-backdrop");
    const closeBtn = document.getElementById("boost-modal-close");
    const modalBody = root?.querySelector(".boost-modal__body") || null;
    const tabButtons = Array.from(root?.querySelectorAll("[data-boost-tab]") || []);
    const actionsPanel = document.getElementById("boost-modal-panel-actions");
    const infoPanel = document.getElementById("boost-modal-panel-info");
    const content = document.getElementById("boost-modal-content");
    const status = document.getElementById("boost-modal-status");
    if (!openBtn || !root || !content) return;
    let activeTab = "actions";
    let swipeState = null;

    const isMobileSwipeViewport = () => window.matchMedia("(max-width: 720px)").matches;

    const setTab = (tab) => {
      activeTab = tab === "info" ? "info" : "actions";
      root.classList.toggle("is-info-tab", activeTab === "info");
      if (actionsPanel) actionsPanel.classList.toggle("hidden", activeTab !== "actions");
      if (infoPanel) infoPanel.classList.toggle("hidden", activeTab !== "info");
      tabButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.boostTab === activeTab);
      });
    };

    const resetSwipeState = () => {
      swipeState = null;
    };

    const finalizeSwipe = () => {
      if (!swipeState) return;
      const {
        startX, startY, lastX, lastY, startedAt
      } = swipeState;
      resetSwipeState();
      if (!isMobileSwipeViewport()) return;
      const deltaX = lastX - startX;
      const deltaY = lastY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const duration = Date.now() - startedAt;
      if (duration > 700 || absX < 34 || absX < absY * 1.15 || absY > 90) return;
      if (deltaX < 0 && activeTab === "actions") setTab("info");
      if (deltaX > 0 && activeTab === "info") setTab("actions");
    };

    const pharmacyBoostDefinitions = [
      {
        key: "recon",
        label: "Ghost Serum boost",
        resourceKey: "ghostSerum",
        resourceLabel: "Ghost Serum",
        cost: 1,
        className: "btn boost-modal__boost-btn boost-modal__boost-btn--ghost",
        description: "+50 % spy speed, +30 % info quality, +25 % attack speed, +25 % steal speed, 2h"
      },
      {
        key: "neuro",
        label: "Overdrive X boost",
        resourceKey: "overdriveX",
        resourceLabel: "Overdrive X",
        cost: 1,
        className: "btn boost-modal__boost-btn boost-modal__boost-btn--overdrive",
        description: "+20 % aktivní akce, 2h, +3 heat"
      }
    ];

    const factoryBoostDefinitions = [
      {
        key: "assault",
        label: "Assault Protocol",
        cost: 2,
        className: "btn boost-modal__factory-btn boost-modal__factory-btn--assault",
        description: "+30 % attack síla, 2h, +3 heat"
      },
      {
        key: "rapid",
        label: "Rapid Strike",
        cost: 3,
        className: "btn boost-modal__factory-btn boost-modal__factory-btn--rapid",
        description: "+40 % rychlost útoku, +25 % rychlost vykrádání, 1.5h, +4 heat"
      },
      {
        key: "breach",
        label: "Breach Mode",
        cost: 4,
        className: "btn boost-modal__factory-btn boost-modal__factory-btn--breach",
        description: "+20 % šance zničit budovu, +15 % ignorování obrany, 2h, +5 heat"
      }
    ];

    const renderPharmacyStatus = (snapshot, ghostSerum, overdriveX) => {
      const effective = snapshot?.effective || {};
      const longestByType = new Map();
      if (Array.isArray(snapshot?.activeEffects)) {
        snapshot.activeEffects.forEach((entry) => {
          const rawType = String(entry?.type || "").trim().toLowerCase();
          const normalizedType = rawType === "neuro" ? "overdrive" : "ghost";
          const remainingMs = Math.max(0, Number(entry?.remainingMs || 0));
          const current = Number(longestByType.get(normalizedType) || 0);
          if (remainingMs > current) {
            longestByType.set(normalizedType, remainingMs);
          }
        });
      }
      const effectParts = [];
      if (longestByType.has("ghost")) {
        effectParts.push(`Ghost Serum boost: ${formatDurationLabel(longestByType.get("ghost"))}`);
      }
      if (longestByType.has("overdrive")) {
        effectParts.push(`Overdrive X boost: ${formatDurationLabel(longestByType.get("overdrive"))}`);
      }
      const effectsLabel = effectParts.length ? effectParts.join(", ") : "žádné";
      return (
        `Ghost Serum: ${ghostSerum} ks • Overdrive X: ${overdriveX} ks • Aktivní boosty: ${effectsLabel}. `
        + `Spy +${Math.max(0, Math.round(Number(effective.spySpeedPct || 0)))}%, `
        + `Info +${Math.max(0, Math.round(Number(effective.infoQualityPct || 0)))}%, `
        + `Attack +${Math.max(0, Math.round(Number(effective.attackSpeedPct || 0)))}%, `
        + `Steal +${Math.max(0, Math.round(Number(effective.stealSpeedPct || 0)))}%`
      );
    };

    const renderFactoryStatus = (snapshot, modules) => {
      const effective = snapshot?.effective || {};
      const labels = { assault: "Assault", rapid: "Rapid", breach: "Breach" };
      const effectParts = Array.isArray(snapshot?.activeEffects)
        ? snapshot.activeEffects
          .slice(0, 4)
          .map((entry) => `${labels[entry.type] || entry.type}: ${formatDurationLabel(entry.remainingMs)}`)
        : [];
      const effectsLabel = effectParts.length ? effectParts.join(", ") : "žádné";
      return (
        `Továrna • Combat Module: ${modules} ks • Aktivní: ${effectsLabel}. `
        + `ATK síla +${Math.max(0, Math.round(Number(effective.attackPowerPct || 0)))}%, `
        + `ATK rychlost +${Math.max(0, Math.round(Number(effective.attackSpeedPct || 0)))}%, `
        + `Raid rychlost +${Math.max(0, Math.round(Number(effective.raidSpeedPct || 0)))}%, `
        + `Destroy +${Math.max(0, Math.round(Number(effective.destroyBuildingChancePct || 0)))}%, `
        + `Ignore DEF +${Math.max(0, Math.round(Number(effective.defenseIgnorePct || 0)))}%, `
        + `DEF -${Math.max(0, Math.round(Number(effective.defensePenaltyPct || 0)))}%, `
        + `Police risk +${Math.max(0, Math.round(Number(effective.policeInterventionRiskPct || 0)))}%`
      );
    };

    const render = () => {
      const pharmacySnapshot = window.Empire.Map?.getPharmacyBoostSnapshot?.();
      const factorySnapshot = window.Empire.Map?.getFactoryBoostSnapshot?.();
      if (!pharmacySnapshot && !factorySnapshot) {
        content.innerHTML = '<div class="boost-modal__empty">Boost panel není dostupný.</div>';
        if (status) status.textContent = "";
        return;
      }

      const ghostSerum = Math.max(0, Math.floor(Number(pharmacySnapshot?.drugInventory?.ghostSerum || 0)));
      const overdriveX = Math.max(0, Math.floor(Number(pharmacySnapshot?.drugInventory?.overdriveX || 0)));
      const combatModule = Math.max(0, Math.floor(Number(factorySnapshot?.supplies?.combatModule || 0)));
      const pharmacyButtons = pharmacyBoostDefinitions
        .map((entry) => {
          const availableAmount = Math.max(0, Math.floor(Number(
            entry.resourceKey === "overdriveX" ? overdriveX : ghostSerum
          )));
          const canAfford = availableAmount >= entry.cost;
          return `
            <button
              class="${entry.className}"
              type="button"
              data-boost-building="pharmacy"
              data-boost-action="${entry.key}"
              title="${entry.description}"
              ${canAfford ? "" : "disabled"}
            >
              ${entry.label}
            </button>
          `;
        })
        .join("");
      const factoryButtons = factoryBoostDefinitions
        .map((entry) => {
          const canAfford = combatModule >= entry.cost;
          return `
            <button
              class="${entry.className}"
              type="button"
              data-boost-building="factory"
              data-boost-action="${entry.key}"
              title="${entry.description}"
              ${canAfford ? "" : "disabled"}
            >
              ${entry.label}
            </button>
          `;
        })
        .join("");

      const pharmacyCard = pharmacySnapshot
        ? `
          <section class="boost-modal__building">
            <div class="boost-modal__head">
              <div class="boost-modal__name">Drug lab</div>
              <div class="boost-modal__value">Boost drogy: <strong>Ghost Serum ${ghostSerum} ks • Overdrive X ${overdriveX} ks</strong></div>
            </div>
            <div class="boost-modal__actions">
              ${pharmacyButtons}
            </div>
          </section>
        `
        : '<div class="boost-modal__empty">Lékárna boosty nejsou dostupné.</div>';
      const factoryCard = factorySnapshot
        ? `
          <section class="boost-modal__building">
            <div class="boost-modal__head">
              <div class="boost-modal__name">Továrna</div>
              <div class="boost-modal__value">Combat Module: <strong>${combatModule} ks</strong></div>
            </div>
            <div class="boost-modal__actions">
              ${factoryButtons}
            </div>
          </section>
        `
        : '<div class="boost-modal__empty">Továrna boosty nejsou dostupné.</div>';

      content.innerHTML = `${pharmacyCard}${factoryCard}`;

      if (status) {
        const lines = [];
        if (pharmacySnapshot) lines.push(renderPharmacyStatus(pharmacySnapshot, ghostSerum, overdriveX));
        if (factorySnapshot) lines.push(renderFactoryStatus(factorySnapshot, combatModule));
        status.textContent = lines.join(" | ");
      }
    };

    const close = () => {
      root.classList.add("hidden");
      setTab("actions");
      resetSwipeState();
    };
    const open = () => {
      render();
      setTab("actions");
      root.classList.remove("hidden");
    };

    openBtn.addEventListener("click", open);
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setTab(button.dataset.boostTab || "actions");
      });
    });
    if (modalBody) {
      modalBody.addEventListener("touchstart", (event) => {
        if (root.classList.contains("hidden")) return;
        if (!isMobileSwipeViewport()) return;
        if (!event.touches || event.touches.length !== 1) {
          resetSwipeState();
          return;
        }
        const touch = event.touches[0];
        swipeState = {
          startX: touch.clientX,
          startY: touch.clientY,
          lastX: touch.clientX,
          lastY: touch.clientY,
          startedAt: Date.now()
        };
      }, { passive: true });
      modalBody.addEventListener("touchmove", (event) => {
        if (!swipeState) return;
        if (!event.touches || event.touches.length !== 1) {
          resetSwipeState();
          return;
        }
        const touch = event.touches[0];
        swipeState.lastX = touch.clientX;
        swipeState.lastY = touch.clientY;
      }, { passive: true });
      modalBody.addEventListener("touchend", (event) => {
        if (!swipeState) return;
        if (event.changedTouches && event.changedTouches.length) {
          const touch = event.changedTouches[0];
          swipeState.lastX = touch.clientX;
          swipeState.lastY = touch.clientY;
        }
        finalizeSwipe();
      }, { passive: true });
      modalBody.addEventListener("touchcancel", resetSwipeState, { passive: true });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const actionBtn = target.closest("[data-boost-action]");
      if (!(actionBtn instanceof HTMLButtonElement)) return;
      const boostKey = String(actionBtn.dataset.boostAction || "").trim();
      const building = String(actionBtn.dataset.boostBuilding || "").trim().toLowerCase();
      if (!boostKey) return;
      let result = null;
      if (building === "factory") {
        result = window.Empire.Map?.useFactoryBoost?.(boostKey);
      } else {
        result = window.Empire.Map?.usePharmacyBoost?.(boostKey);
      }
      if (result?.message) {
        pushEvent(result.message);
      } else {
        pushEvent("Boost akce se nepodařila.");
      }
      render();
    });
  }

  function formatAttackError(errorCode) {
    switch (String(errorCode || "").trim().toLowerCase()) {
      case "cooldown":
        return "Útok je na cooldownu.";
      case "insufficient_funds":
        return "Na útok nemáš dostatek prostředků.";
      case "insufficient_weapons":
        return "Nemáš žádné zbraně, které by šlo použít.";
      case "insufficient_members":
        return "Nemáš dost členů gangu pro odemčení použitelné zbraně.";
      case "not_found":
        return "Cílový distrikt nebyl nalezen.";
      case "own_district":
        return "Vlastní distrikt nelze napadnout.";
      case "allied_district":
        return "Alianční distrikt nelze napadnout.";
      case "destroyed_district":
        return "Distrikt je zničený a nelze na něj útočit.";
      case "not_adjacent":
        return "Útočit můžeš jen na distrikt, který sousedí s tvým dobytým distriktem.";
      case "attack_failed":
        return "Útok se nepodařilo zpracovat.";
      default:
        return "Útok se nepodařilo provést.";
    }
  }

  function initLeaderboardModal() {
    const openBtn = document.getElementById("leaderboard-open");
    const root = document.getElementById("leaderboard-modal");
    const backdrop = document.getElementById("leaderboard-modal-backdrop");
    const closeBtn = document.getElementById("leaderboard-modal-close");
    const content = document.getElementById("leaderboard-modal-content");
    if (!openBtn || !root || !content) return;

    const avatarPool = [
      "../img/avatars/Mafia/2854d1df-0f7c-4fe4-aa85-7a70dfe299db.jpg",
      "../img/avatars/Mafia/8d2dcbe6-00d3-4b6f-98a0-53dc914346c5.jpg",
      "../img/avatars/Kartel/0f3d68b6-79b0-4bdd-9856-2491cd66cb78.jpg",
      "../img/avatars/Kartel/37b9a32a-4710-4060-a1a9-5cf2e2c924c7.jpg",
      "../img/avatars/Hacker/379f566a-18b8-457e-83ee-ee9ee114cb7a.jpg",
      "../img/avatars/Hacker/53867e7d-cc7e-4f92-b391-88f44bf7e349.jpg",
      "../img/avatars/Korporat/094f576f-646f-4ec9-9786-63019d07cdfe.jpg",
      "../img/avatars/Korporat/2ef61d31-c01c-44a3-bca5-6171166352b0.jpg",
      "../img/avatars/Motogang/grok_image_1773621173474.jpg",
      "../img/avatars/Motogang/grok_image_1773621230721.jpg",
      "../img/avatars/polucnigang/5f1bbe02-e437-43b6-b9ed-c453e34ca622.jpg",
      "../img/avatars/polucnigang/f9b2211e-30fb-46ab-aa4c-16913d8a92c6.jpg",
      "../img/avatars/SoukromaArmada/17912d57-dfc8-49fc-9a90-44121c298975.jpg",
      "../img/avatars/SoukromaArmada/bbe6342a-cf92-4459-af42-dbb7beba19f6.jpg",
      "../img/avatars/Tajnaorganizace/0099fc13-4774-459a-b1a9-ea507a6c0526.jpg",
      "../img/avatars/Tajnaorganizace/0870f362-b2ce-4607-ad3f-a96b59afcc8d.jpg",
      "../img/avatars/Mafia/grok_image_1773619750005.jpg",
      "../img/avatars/Kartel/f7281b4a-f79f-4d76-b975-5153d414208f.jpg",
      "../img/avatars/Hacker/grok_image_1773621797044.jpg",
      "../img/avatars/Korporat/e4286e80-0587-4e0e-afe4-70c348ee59dd.jpg"
    ];

    const nickPool = [
      "RazorVlk", "GhostMara", "NyxPrime", "IronShade", "VortexAce",
      "BlackComet", "NeonRiot", "CobraUnit", "UrbanHex", "SteelDrift",
      "ZeroPulse", "NightCipher", "CrimsonDot", "VoltRaven", "SilentBrick",
      "AlphaDock", "ChromeLynx", "DeltaWolf", "ShadowMint", "MetroHawk",
      "ApexNova", "ToxicRay", "RetroKane", "FrostMamba", "StreetRune",
      "KiloGhost", "RustQueen", "NovaPilot", "BetaVenom", "PixelVandal",
      "OnyxRoad", "DarkMirage", "TurboSable", "ViperCrown", "CoreHunter",
      "PlasmaRook", "RiftRunner", "FlintByte", "HydraLoop", "CipherFox"
    ];

    const alliancePool = [
      "Neon Syndicate",
      "Iron Wolves",
      "Black Harbor",
      "Vortex Pact",
      "Street Dominion",
      "Shadow Cartel",
      "Chrome Circuit",
      "Night Crown",
      "Obsidian Order",
      "Steel Mirage",
      "Urban Serpents",
      "Ghost Collective"
    ];

    const currentServerEntries = Array.from({ length: 20 }, (_, index) => ({
      rank: index + 1,
      nick: nickPool[index],
      influenceRate: 980 - index * 28 + (index % 3) * 9,
      capturedSectors: 48 - index * 2 + (index % 4),
      alliance: alliancePool[index % alliancePool.length],
      avatar: avatarPool[index % avatarPool.length]
    }));

    window.Empire = window.Empire || {};
    window.Empire.leaderboardServerPlayers = currentServerEntries.map((entry) => ({
      id: `leaderboard-${entry.rank}-${entry.nick}`,
      name: entry.nick,
      nick: entry.nick,
      avatar: entry.avatar,
      totalHeat: Math.max(0, Math.floor(Number(entry.influenceRate || 0) / 4)),
      heat: Math.max(0, Math.floor(Number(entry.influenceRate || 0) / 4)),
      influence: Math.max(0, Math.floor(Number(entry.influenceRate || 0))),
      ownedDistrictCount: Math.max(0, Math.floor(Number(entry.capturedSectors || 0) / 4)),
      districtCount: Math.max(0, Math.floor(Number(entry.capturedSectors || 0) / 4)),
      cash: Math.max(0, Math.floor(Number(entry.influenceRate || 0) * 120)),
      dirtyCash: Math.max(0, Math.floor(Number(entry.influenceRate || 0) * 70)),
      lastIllegalActionAt: Date.now() - Math.max(1, entry.rank) * 20 * 60 * 1000,
      policePressure: Math.max(0, Math.floor(Number(entry.influenceRate || 0) / 12))
    }));

    const monthlyEntries = Array.from({ length: 40 }, (_, index) => ({
      rank: index + 1,
      nick: nickPool[index],
      score: 18750 - index * 245 + (index % 4) * 19,
      capturedSectors: 62 - index + (index % 5)
    }));

    const state = {
      tab: "server"
    };

    const renderServerEntries = () =>
      currentServerEntries
        .map(
          (entry) => `
            <div class="leaderboard-entry leaderboard-entry--server">
              <div class="leaderboard-rank">#${entry.rank}</div>
              <img class="leaderboard-avatar" src="${entry.avatar}" alt="Avatar ${entry.nick}" loading="lazy" />
              <div class="leaderboard-main">
                <div class="leaderboard-nick">${entry.nick}</div>
                <div class="leaderboard-sub">Aliance: ${entry.alliance}</div>
              </div>
              <div class="leaderboard-values">
                <div class="leaderboard-value">
                  <span>Míra vlivu</span>
                  <strong>${entry.influenceRate}</strong>
                </div>
                <div class="leaderboard-value leaderboard-value--sector">
                  <span>Dobyté sektory</span>
                  <strong>${entry.capturedSectors}</strong>
                </div>
              </div>
            </div>
          `
        )
        .join("");

    const renderMonthlyEntries = () =>
      monthlyEntries
        .map(
          (entry) => `
            <div class="leaderboard-entry leaderboard-entry--monthly">
              <div class="leaderboard-rank">#${entry.rank}</div>
              <div class="leaderboard-main">
                <div class="leaderboard-nick">${entry.nick}</div>
                <div class="leaderboard-sub">Měsíční výkon</div>
              </div>
              <div class="leaderboard-values">
                <div class="leaderboard-value">
                  <span>Body</span>
                  <strong>${entry.score}</strong>
                </div>
                <div class="leaderboard-value leaderboard-value--sector">
                  <span>Dobyté sektory</span>
                  <strong>${entry.capturedSectors}</strong>
                </div>
              </div>
            </div>
          `
        )
        .join("");

    const render = () => {
      const isServer = state.tab === "server";
      const podiumEntries = (isServer ? currentServerEntries : monthlyEntries)
        .slice(0, 3)
        .sort((a, b) => {
          const aValue = isServer ? Number(a.influenceRate || 0) : Number(a.score || 0);
          const bValue = isServer ? Number(b.influenceRate || 0) : Number(b.score || 0);
          return bValue - aValue;
        });
      content.innerHTML = `
        <div class="leaderboard-tabs">
          <button class="leaderboard-tab ${isServer ? "is-active" : ""}" type="button" data-leaderboard-tab="server">
            Aktuální server
          </button>
          <button class="leaderboard-tab ${!isServer ? "is-active" : ""}" type="button" data-leaderboard-tab="monthly">
            Měsíční
          </button>
        </div>
        <div class="leaderboard-board">
          <div class="leaderboard-hero">
            <div class="leaderboard-hero__eyebrow">Top 3</div>
            <div class="leaderboard-hero__title">${isServer ? "Dominance serveru" : "Měsíční podium"}</div>
            <div class="leaderboard-podium">
              ${podiumEntries
                .map((entry, index) => {
                  const place = index + 1;
                  const metricValue = isServer ? entry.influenceRate : entry.score;
                  return `
                    <div class="leaderboard-podium__entry leaderboard-podium__entry--place-${place}">
                      <div class="leaderboard-podium__place">#${place}</div>
                      <img class="leaderboard-podium__avatar" src="${entry.avatar || podiumEntries[0]?.avatar || ""}" alt="Avatar ${entry.nick}" loading="lazy" />
                      <div class="leaderboard-podium__nick">${entry.nick}</div>
                      <div class="leaderboard-podium__metric">${metricValue}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
          <div class="leaderboard-board__meta">
            ${isServer
              ? "Top 20 hráčů na aktuálním serveru."
              : "Top 40 hráčů v měsíční statistice."}
          </div>
          <div class="leaderboard-list">
            ${isServer ? renderServerEntries() : renderMonthlyEntries()}
          </div>
        </div>
      `;
    };

    content.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tabButton = target.closest("[data-leaderboard-tab]");
      if (!(tabButton instanceof HTMLElement)) return;
      const tab = tabButton.dataset.leaderboardTab;
      if (tab !== "server" && tab !== "monthly") return;
      if (state.tab === tab) return;
      state.tab = tab;
      render();
    });

    const close = () => root.classList.add("hidden");
    const open = () => {
      state.tab = "server";
      render();
      root.classList.remove("hidden");
    };

    openBtn.addEventListener("click", open);
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function initStorageModal() {
    const trigger = document.getElementById("stat-storage-wrap");
    const root = document.getElementById("storage-modal");
    const backdrop = document.getElementById("storage-modal-backdrop");
    const closeBtn = document.getElementById("storage-modal-close");
    if (!trigger || !root) return;
    const mobileMedia = window.matchMedia("(max-width: 720px)");

    const setStorageScrollLock = (locked) => {
      const body = document.body;
      const html = document.documentElement;
      if (!body || !html) return;

      if (!mobileMedia.matches) {
        body.classList.remove("mobile-storage-modal-open");
        html.classList.remove("mobile-storage-modal-open");
        delete body.dataset.storageScrollLockY;
        return;
      }

      if (locked) {
        if (body.classList.contains("mobile-storage-modal-open")) return;
        body.classList.add("mobile-storage-modal-open");
        html.classList.add("mobile-storage-modal-open");
        return;
      }

      body.classList.remove("mobile-storage-modal-open");
      html.classList.remove("mobile-storage-modal-open");
      delete body.dataset.storageScrollLockY;
    };

    const close = () => {
      root.classList.add("hidden");
      setStorageScrollLock(false);
    };
    const open = () => {
      hydrateStorageModalValues();
      root.classList.remove("hidden");
      setStorageScrollLock(true);
    };

    trigger.addEventListener("click", open);
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    root.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-use-drug]");
      if (!(button instanceof HTMLButtonElement)) return;
      const drugKey = String(button.dataset.useDrug || "").trim();
      if (!drugKey) return;
      if (!window.Empire.token) {
        pushEvent("Použití drog je dostupné jen po přihlášení.");
        return;
      }
      button.disabled = true;
      try {
        const result = await window.Empire.API.useDrug(drugKey, 1);
        if (result?.error) {
          pushEvent(`Drogy: ${result.error}`);
          return;
        }
        const economy = await window.Empire.API.getEconomy();
        updateEconomy(economy);
        const profile = await window.Empire.API.getProfile();
        updateProfile(profile);
        pushEvent(`Aktivováno: ${storageDrugTypes.find((item) => item.resourceKey === drugKey)?.name || drugKey}`);
      } finally {
        button.disabled = false;
      }
    });
  }

  function initMoneyStatSkipControls() {
    const cleanWrap = document.getElementById("stat-clean-wrap");
    const dirtyWrap = document.getElementById("stat-dirty-wrap");
    const cleanMoney = document.getElementById("stat-clean-money");
    const dirtyMoney = document.getElementById("stat-dirty-money");
    if (!cleanWrap && !dirtyWrap && !cleanMoney && !dirtyMoney) return;

    const skipToLatest = (kind) => {
      const money = resolveMoneyBreakdown(cachedEconomy || {});
      if (kind === "clean") {
        syncMoneyStatToCachedValue(cleanMoney || cleanWrap, money.cleanMoney);
        return;
      }
      syncMoneyStatToCachedValue(dirtyMoney || dirtyWrap, money.dirtyMoney);
    };

    const bind = (element, kind) => {
      if (!element || element.dataset.moneySkipBound === "1") return;
      element.dataset.moneySkipBound = "1";
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        skipToLatest(kind);
      });
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        skipToLatest(kind);
      });
      if (!element.hasAttribute("role")) element.setAttribute("role", "button");
      if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "0");
    };

    bind(cleanWrap, "clean");
    bind(cleanMoney, "clean");
    bind(dirtyWrap, "dirty");
    bind(dirtyMoney, "dirty");
  }

  function hydrateStorageModalValues() {
    const economy = cachedEconomy || {};
    const player = window.Empire.player || {};
    const currentGangMembers = countPlayerControlledPopulation(cachedProfile || player);
    const pharmacySnapshot = window.Empire.Map?.getPharmacyBoostSnapshot?.() || null;
    const factorySnapshot = window.Empire.Map?.getFactoryBoostSnapshot?.() || null;
    const attackCounts = resolveWeaponCounts();
    const defenseCounts = resolveDefenseCounts();
    const pharmacySupplies = pharmacySnapshot?.supplies || player.labSupplies || {};
    const factorySupplies = factorySnapshot?.supplies || {};
    const attackEntries = attackWeaponStats.map((item) => ({
      name: item.name,
      value: findInventoryValueByName(attackCounts, item.name),
      metaLabel: `Síla ${item.power}`,
      unlocked: currentGangMembers >= item.requiredMembers
    }));
    const defenseEntries = defenseWeaponStats.map((item) => ({
      name: item.name,
      value: findInventoryValueByName(defenseCounts, item.name),
      metaLabel: `Síla ${item.power}`,
      unlocked: currentGangMembers >= item.requiredMembers
    }));
    const pharmacyEntries = pharmacySupplyTypes.map((item) => ({
      name: item.name,
      value: Math.max(0, Math.floor(Number(pharmacySupplies[item.key] || 0))),
      tone: item.key === "chemicals"
        ? "chemicals"
        : (item.key === "biomass" ? "biomass" : (item.key === "stimPack" ? "stim" : ""))
    }));
    const factoryEntries = factorySupplyTypes.map((item) => {
      const rawValue = Math.max(0, Math.floor(Number(factorySupplies[item.key] || 0)));
      const value = window.Empire.token ? rawValue : Math.max(20, rawValue);
      return {
        name: item.name,
        value
      };
    });
    const totalDrugs = Number(economy.drugs ?? player.drugs ?? 0);
    const drugInventory = economy.drugInventory || player.drugInventory || null;
    const activeDrugs = economy.activeDrugs || player.activeDrugs || null;
    const drugEntries = resolveStorageDrugEntries(totalDrugs, drugInventory, activeDrugs);
    const attackTotal = getAttackWeaponTotal(attackCounts);
    const defenseTotal = getDefenseWeaponTotal(defenseCounts);
    const pharmacyTotal = pharmacyEntries.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.value || 0))), 0);
    const factoryTotal = factoryEntries.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.value || 0))), 0);
    const drugTotal = drugEntries.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.value || 0))), 0);
    const storageTotal = attackTotal + defenseTotal + pharmacyTotal + factoryTotal + drugTotal;

    renderStorageList("storage-modal-attack-list", attackEntries, "ks");
    renderStorageList("storage-modal-defense-list", defenseEntries, "ks");
    renderStorageList("storage-modal-pharmacy-list", pharmacyEntries, "ks");
    renderStorageList("storage-modal-factory-list", factoryEntries, "ks");
    renderStorageList("storage-modal-drugs-list", drugEntries, "bal.", { allowDrugUse: true });
    pulseStorageStat(storageTotal);
  }

  function pulseStorageStat(nextTotal) {
    const wrap = document.getElementById("stat-storage-wrap");
    const safeTotal = Math.max(0, Math.floor(Number(nextTotal || 0)));
    if (!wrap) {
      lastRenderedStorageTotal = safeTotal;
      return;
    }
    if (lastRenderedStorageTotal == null) {
      lastRenderedStorageTotal = safeTotal;
      return;
    }
    const delta = safeTotal - lastRenderedStorageTotal;
    lastRenderedStorageTotal = safeTotal;
    if (!delta) return;
    wrap.classList.remove("is-storage-up", "is-storage-down");
    void wrap.offsetWidth;
    wrap.classList.add(delta > 0 ? "is-storage-up" : "is-storage-down");
    if (storageStatPulseTimer) {
      window.clearTimeout(storageStatPulseTimer);
    }
    storageStatPulseTimer = window.setTimeout(() => {
      wrap.classList.remove("is-storage-up", "is-storage-down");
      storageStatPulseTimer = null;
    }, 1100);
  }

  function findInventoryValueByName(source, name) {
    const safeSource = source && typeof source === "object" ? source : {};
    const key = Object.keys(safeSource).find((candidate) => candidate.toLowerCase() === String(name || "").toLowerCase());
    if (!key) return 0;
    const value = Number(safeSource[key] || 0);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  function resolveStorageDrugEntries(totalDrugs, drugInventory, activeDrugs) {
    const parsedTotal = Number(totalDrugs || 0);
    const safeTotal = Number.isFinite(parsedTotal) ? Math.max(0, Math.floor(parsedTotal)) : 0;
    const safeInventory = drugInventory && typeof drugInventory === "object" ? drugInventory : {};
    const safeActive = activeDrugs && typeof activeDrugs === "object" ? activeDrugs : {};

    let used = 0;
    const entries = storageDrugTypes.map((item) => {
      const count = Math.max(0, Math.floor(Number(safeInventory[item.key] || 0)));
      used += count;
      const effect = safeActive[item.key] || {};
      const remainingSeconds = Math.max(0, Math.floor(Number(effect.remainingSeconds || 0)));
      return {
        key: item.resourceKey,
        name: item.name,
        value: count,
        active: Boolean(effect.active),
        activeLabel: remainingSeconds > 0
          ? `aktivní ${formatDurationLabel(remainingSeconds * 1000)}`
          : ""
      };
    });

    const remainder = Math.max(0, safeTotal - used);
    if (entries.length > 0 && remainder > 0) entries[0].value += remainder;
    return entries;
  }

  function renderStorageList(containerId, entries, suffix = "", options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const safeEntries = Array.isArray(entries) ? entries : [];
    const allowDrugUse = Boolean(options.allowDrugUse && window.Empire.token);
    container.innerHTML = safeEntries
      .map((entry) => {
        const valueLabel = suffix
          ? `${entry.value} ${suffix}`
          : `${entry.value}`;
        const metaParts = [entry.metaLabel, entry.requirementLabel, entry.activeLabel]
          .map((value) => String(value || "").trim())
          .filter(Boolean)
          .map((value) => `<span class="storage-modal__meta">${value}</span>`)
          .join("");
        const useButton = allowDrugUse && entry.key
          ? `<button class="btn btn--ghost" data-use-drug="${entry.key}" ${entry.value <= 0 ? "disabled" : ""}>Použít</button>`
          : "";
        const toneClass = entry.tone ? ` storage-modal__item--${entry.tone}` : "";
        const toneValueClass = entry.tone ? ` storage-modal__value--${entry.tone}` : "";
        return `
          <div class="storage-modal__item ${entry.unlocked === false ? "is-locked" : ""}${toneClass}">
            <span>${entry.name} ${metaParts}</span>
            <strong class="storage-modal__value${toneValueClass}">${valueLabel}</strong>
            ${useButton}
          </div>
        `;
      })
      .join("");
  }

  function initDistrictDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    const backdrop = document.getElementById("district-defense-modal-backdrop");
    const closeBtn = document.getElementById("district-defense-modal-close");
    const startBtn = document.getElementById("defense-modal-start");
    const weaponButtons = document.getElementById("defense-modal-weapons");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeDefenseModal);
    if (closeBtn) closeBtn.addEventListener("click", closeDefenseModal);
    if (weaponButtons) {
      weaponButtons.addEventListener("dblclick", (event) => {
        event.preventDefault();
      });
      weaponButtons.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest("[data-defense-weapon][data-defense-action]");
        if (!button) return;
        const name = String(button.getAttribute("data-defense-weapon") || "").trim();
        const action = String(button.getAttribute("data-defense-action") || "").trim();
        if (!name) return;
        if (action !== "increase" && action !== "decrease") return;
        const availability = getDefenseModalAvailability();
        const summary = getDefenseSelectionSummary(availability);
        const item = defenseWeaponStats.find((entry) => entry.name === name);
        if (!item) return;
        const current = Math.max(0, Math.floor(Number(summary.selection[name] || 0)));
        const maxCount = getDefenseWeaponMaxCount(item, summary, availability);
        let nextCount = current;
        if (action === "increase") {
          nextCount = current < maxCount ? current + 1 : current;
        } else if (action === "decrease") {
          nextCount = current > 0 ? current - 1 : 0;
        }
        defenseModalState.selectedWeaponCounts = {
          ...(defenseModalState.selectedWeaponCounts || {}),
          [name]: nextCount
        };
        if (nextCount <= 0) {
          delete defenseModalState.selectedWeaponCounts[name];
        }
        setDefenseModalNote("");
        renderDefenseModal();
      });
    }
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const district = resolveDistrictById(defenseModalState.districtId);
        if (!district) {
          setDefenseModalNote("Nejprve vyber distrikt.");
          return;
        }
        const availability = getDefenseModalAvailability();
        const selectionSummary = getDefenseSelectionSummary(availability);
        if (selectionSummary.totalUsedMembers <= 0) {
          setDefenseModalNote("Pro obranu potřebuješ alespoň 50 členů gangu.");
          renderDefenseModal();
          return;
        }
        const selectedWeapons = defenseWeaponStats
          .map((item) => {
            const count = Math.max(0, Math.floor(Number(selectionSummary.selection?.[item.name] || 0)));
            return count > 0 ? `${count}× ${item.name}` : "";
          })
          .filter(Boolean);
        const defensePower = defenseWeaponStats.reduce((sum, item) => {
          const count = Math.max(0, Math.floor(Number(selectionSummary.selection?.[item.name] || 0)));
          return sum + (count * Number(item.power || 0));
        }, 0);
        consumeDefenseWeaponCounts(selectionSummary.selection);
        consumeGangMembers(selectionSummary.totalUsedMembers);
        saveDistrictDefenseAssignment(
          district,
          selectionSummary.selection,
          selectionSummary.totalUsedMembers,
          defensePower
        );
        window.Empire.Map?.refreshSelectedDistrictModal?.();
        pushEvent(`Obrana distriktu ${district.name || `#${district.id}`} byla nastavena. Zbraně: ${selectedWeapons.length ? selectedWeapons.join(", ") : "žádné"}. Členové gangu: ${selectionSummary.totalUsedMembers}. Síla obrany: ${defensePower}.`);
        closeDefenseModal();
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDefenseModal();
    });
  }

  function openDistrictDefenseModal(district) {
    const root = document.getElementById("district-defense-modal");
    const districtLabel = document.getElementById("defense-modal-district");
    if (!root) return;
    defenseModalState = { districtId: district?.id ?? null, message: "", selectedWeaponCounts: {} };
    if (districtLabel) {
      districtLabel.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    }
    root.classList.remove("hidden");
    renderDefenseModal();
    if (defenseModalRefreshTimer) clearInterval(defenseModalRefreshTimer);
    defenseModalRefreshTimer = setInterval(() => {
      const modal = document.getElementById("district-defense-modal");
      if (!modal || modal.classList.contains("hidden")) {
        closeDefenseModal();
        return;
      }
      renderDefenseModal();
    }, 250);
  }

  function setDefenseModalNote(message) {
    defenseModalState.message = String(message || "");
    const note = document.getElementById("defense-modal-note");
    if (!note) return;
    note.textContent = defenseModalState.message;
  }

  function renderDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    if (!root || root.classList.contains("hidden")) return;
    const district = resolveDistrictById(defenseModalState.districtId);
    const districtLabel = document.getElementById("defense-modal-district");
    const membersCountEl = document.getElementById("defense-modal-members-count");
    const usedMembersEl = document.getElementById("defense-modal-used-members");
    const powerEl = document.getElementById("defense-modal-power");
    const weaponButtons = document.getElementById("defense-modal-weapons");
    const startBtn = document.getElementById("defense-modal-start");
    const note = document.getElementById("defense-modal-note");
    if (!districtLabel || !membersCountEl || !usedMembersEl || !powerEl || !weaponButtons || !startBtn || !note) return;

    const availability = getDefenseModalAvailability();
    const selectionSummary = getDefenseSelectionSummary(availability);
    if (district) {
      districtLabel.textContent = district.name || `Distrikt #${district.id}`;
    } else {
      districtLabel.textContent = "-";
    }
    membersCountEl.textContent = String(selectionSummary.remainingMembers);
    usedMembersEl.textContent = String(selectionSummary.totalUsedMembers);
    powerEl.textContent = String(defenseWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
      return sum + (count * Number(item.power || 0));
    }, 0));
    renderDefenseWeaponButtons(weaponButtons, availability);
    let noteText = defenseModalState.message || "Šipkou doprava přidáváš, šipkou doleva ubíráš. Členové gangu se přepočítají automaticky.";
    if (availability.availableWeapons <= 0) {
      noteText = "Ve skladu nejsou žádné obranné zbraně.";
    } else if (selectionSummary.totalUsedMembers <= 0) {
      noteText = "Pro obranu potřebuješ alespoň 50 členů gangu.";
    } else if (selectionSummary.remainingMembers < 0) {
      noteText = "Nemáš dost členů gangu pro tuto kombinaci.";
    }
    note.textContent = noteText;
    startBtn.disabled = selectionSummary.totalUsedMembers <= 0;
  }

  function closeDefenseModal() {
    const root = document.getElementById("district-defense-modal");
    if (root) root.classList.add("hidden");
    defenseModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
    if (defenseModalRefreshTimer) {
      clearInterval(defenseModalRefreshTimer);
      defenseModalRefreshTimer = null;
    }
  }

  function getAttackCooldownUntil() {
    const parsed = Number(localStorage.getItem(ATTACK_COOLDOWN_STORAGE_KEY) || 0);
    if (!Number.isFinite(parsed)) return 0;
    const safeValue = Math.max(0, Math.floor(parsed));
    const now = Date.now();
    const maxAllowed = now + ATTACK_COOLDOWN_MS;
    if (safeValue > maxAllowed) {
      localStorage.setItem(ATTACK_COOLDOWN_STORAGE_KEY, String(maxAllowed));
      return maxAllowed;
    }
    return safeValue;
  }

  function setAttackCooldownUntil(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    localStorage.setItem(ATTACK_COOLDOWN_STORAGE_KEY, String(safeValue));
    return safeValue;
  }

  function getAttackCooldownRemainingMs() {
    return Math.max(0, getAttackCooldownUntil() - Date.now());
  }

  function formatAttackCooldownLabel(ms) {
    const safe = Math.max(0, Math.floor(Number(ms) || 0));
    const seconds = Math.ceil(safe / 1000);
    return seconds > 0 ? `${seconds}s` : "Připraveno";
  }

  function formatAttackDurationLabel(ms) {
    const safe = Math.max(0, Math.floor(Number(ms) || 0));
    const seconds = Math.ceil(safe / 1000);
    if (seconds <= 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (remainder > 0) return `${minutes}m ${remainder}s`;
    return `${minutes}m`;
  }

  function getRaidCooldownUntil() {
    const parsed = Number(localStorage.getItem(RAID_COOLDOWN_STORAGE_KEY) || 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }

  function setRaidCooldownUntil(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    localStorage.setItem(RAID_COOLDOWN_STORAGE_KEY, String(safeValue));
    return safeValue;
  }

  function getRaidCooldownRemainingMs() {
    return Math.max(0, getRaidCooldownUntil() - Date.now());
  }

  function readDistrictTrapState() {
    try {
      const raw = localStorage.getItem(DISTRICT_TRAP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.entries(parsed).reduce((acc, [ownerKey, entry]) => {
        const safeOwnerKey = normalizeOwnerName(ownerKey);
        const safeDistrictId = Number(entry?.districtId);
        if (!safeOwnerKey || !Number.isFinite(safeDistrictId)) return acc;
        acc[safeOwnerKey] = {
          districtId: Math.max(0, Math.floor(safeDistrictId)),
          targetOwnerKey: normalizeOwnerName(entry?.targetOwnerKey),
          targetOwnerLabel: String(entry?.targetOwnerLabel || "").trim(),
          districtName: String(entry?.districtName || "").trim(),
          placedAt: Math.max(0, Math.floor(Number(entry?.placedAt || 0))),
          moveLockedUntil: Math.max(0, Math.floor(Number(entry?.moveLockedUntil || 0)))
        };
        return acc;
      }, {});
    } catch (_) {
      return {};
    }
  }

  function saveDistrictTrapState(nextState) {
    const safeState = !nextState || typeof nextState !== "object"
      ? {}
      : Object.entries(nextState).reduce((acc, [ownerKey, entry]) => {
          const safeOwnerKey = normalizeOwnerName(ownerKey);
          const safeDistrictId = Number(entry?.districtId);
          if (!safeOwnerKey || !Number.isFinite(safeDistrictId)) return acc;
          acc[safeOwnerKey] = {
            districtId: Math.max(0, Math.floor(safeDistrictId)),
            targetOwnerKey: normalizeOwnerName(entry?.targetOwnerKey),
            targetOwnerLabel: String(entry?.targetOwnerLabel || "").trim(),
            districtName: String(entry?.districtName || "").trim(),
            placedAt: Math.max(0, Math.floor(Number(entry?.placedAt || 0))),
            moveLockedUntil: Math.max(0, Math.floor(Number(entry?.moveLockedUntil || 0)))
          };
          return acc;
        }, {});
    localStorage.setItem(DISTRICT_TRAP_STORAGE_KEY, JSON.stringify(safeState));
    return safeState;
  }

  function getCurrentPlayerTrapPlacement() {
    const ownerKey = resolveCurrentPlayerOwnerKey();
    const state = readDistrictTrapState();
    const entry = state[ownerKey];
    return entry ? { ownerKey, ...entry } : null;
  }

  function getDistrictTrapEntry(districtId) {
    const safeDistrictId = Number(districtId);
    if (!Number.isFinite(safeDistrictId)) return null;
    const state = readDistrictTrapState();
    for (const [ownerKey, entry] of Object.entries(state)) {
      if (Number(entry?.districtId) === safeDistrictId) {
        return { ownerKey, ...entry };
      }
    }
    return null;
  }

  function getTrapMoveCooldownRemainingMs(entry) {
    return Math.max(0, Number(entry?.moveLockedUntil || 0) - Date.now());
  }

  function formatTrapMoveCooldownLabel(ms) {
    const safe = Math.max(0, Math.ceil(Number(ms) || 0));
    const totalSeconds = Math.max(0, Math.ceil(safe / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function setCurrentPlayerTrapDistrict(district) {
    const safeDistrictId = Number(district?.id);
    if (!Number.isFinite(safeDistrictId)) {
      return { ok: false, reason: "invalid_district" };
    }
    const ownerKey = resolveCurrentPlayerOwnerKey();
    const state = readDistrictTrapState();
    const previous = state[ownerKey] || null;
    const moveCooldownRemainingMs = getTrapMoveCooldownRemainingMs(previous);
    if (previous && Number(previous.districtId) !== safeDistrictId && moveCooldownRemainingMs > 0) {
      return {
        ok: false,
        reason: "move_locked",
        moveCooldownRemainingMs
      };
    }
    state[ownerKey] = {
      districtId: Math.max(0, Math.floor(safeDistrictId)),
      targetOwnerKey: normalizeOwnerName(district?.owner),
      targetOwnerLabel: String(district?.ownerNick || district?.owner || "").trim(),
      districtName: String(district?.name || `Distrikt #${safeDistrictId}`).trim(),
      placedAt: Date.now(),
      moveLockedUntil: Date.now() + TRAP_MOVE_COOLDOWN_MS
    };
    saveDistrictTrapState(state);
    return {
      ok: true,
      moved: Boolean(previous && Number(previous.districtId) !== safeDistrictId),
      previousDistrictId: previous?.districtId ?? null,
      isActiveHere: Number(previous?.districtId) === safeDistrictId,
      moveLockedUntil: Number(state[ownerKey]?.moveLockedUntil || 0)
    };
  }

  function consumeDistrictTrap(districtId) {
    const safeDistrictId = Number(districtId);
    if (!Number.isFinite(safeDistrictId)) return null;
    const state = readDistrictTrapState();
    const foundEntry = Object.entries(state).find(([, entry]) => Number(entry?.districtId) === safeDistrictId);
    if (!foundEntry) return null;
    const [ownerKey, entry] = foundEntry;
    delete state[ownerKey];
    saveDistrictTrapState(state);
    return { ownerKey, ...entry };
  }

  function getDistrictTrapControlState(district) {
    if (!district || !isDistrictDefendableByPlayer(district) || isDistrictDestroyed(district)) {
      return {
        visible: false,
        label: "Past",
        title: "",
        isActiveHere: false,
        hasTrapElsewhere: false,
        moveLocked: false,
        moveCooldownRemainingMs: 0,
        countdownLabel: "",
        buildingVisible: false,
        buttonDisabled: true
      };
    }
    const currentPlacement = getCurrentPlayerTrapPlacement();
    const isActiveHere = Number(currentPlacement?.districtId) === Number(district?.id);
    const hasTrapElsewhere = Boolean(currentPlacement && !isActiveHere);
    const moveCooldownRemainingMs = getTrapMoveCooldownRemainingMs(currentPlacement);
    const moveLocked = moveCooldownRemainingMs > 0;
    const countdownLabel = moveLocked ? formatTrapMoveCooldownLabel(moveCooldownRemainingMs) : "";
    const sourceDistrictLabel = currentPlacement?.districtName || `distriktu #${currentPlacement?.districtId ?? "-"}`;
    const title = isActiveHere
      ? (moveLocked
          ? `Past je aktivní v tomto districtu. Přesun bude možný za ${countdownLabel}.`
          : "V tomto districtu je nastražená tvoje past.")
      : hasTrapElsewhere
        ? (moveLocked
            ? `Past je dočasně zamčená v ${sourceDistrictLabel}. Přesun bude možný za ${countdownLabel}.`
            : `Máš jen 1 past. Kliknutím ji přesuneš z ${sourceDistrictLabel}.`)
        : "Nastraž 1 past do svého nebo aliančního districtu.";
    return {
      visible: true,
      isActiveHere,
      hasTrapElsewhere,
      moveLocked,
      moveCooldownRemainingMs,
      countdownLabel,
      buttonDisabled: isActiveHere || moveLocked,
      label: isActiveHere ? "Past aktivní" : (hasTrapElsewhere ? "Přesunout past" : "Past"),
      subtitle: moveLocked ? countdownLabel : "",
      title,
      buildingVisible: isActiveHere,
      buildingLabel: "Past",
      buildingMeta: "Aktivní"
    };
  }

  function readAttackTargetLockState() {
    try {
      const raw = localStorage.getItem(ATTACK_TARGET_LOCK_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const now = Date.now();
      return Object.entries(parsed).reduce((acc, [attackerKey, targets]) => {
        const safeAttackerKey = normalizeOwnerName(attackerKey);
        if (!safeAttackerKey || !targets || typeof targets !== "object" || Array.isArray(targets)) return acc;
        const sanitizedTargets = Object.entries(targets).reduce((targetAcc, [targetKey, until]) => {
          const safeTargetKey = normalizeOwnerName(targetKey);
          const safeUntil = Number(until);
          if (!safeTargetKey || !Number.isFinite(safeUntil) || safeUntil <= now) return targetAcc;
          targetAcc[safeTargetKey] = Math.floor(safeUntil);
          return targetAcc;
        }, {});
        if (Object.keys(sanitizedTargets).length) {
          acc[safeAttackerKey] = sanitizedTargets;
        }
        return acc;
      }, {});
    } catch (_) {
      return {};
    }
  }

  function saveAttackTargetLockState(nextState) {
    const now = Date.now();
    const safeState = !nextState || typeof nextState !== "object"
      ? {}
      : Object.entries(nextState).reduce((acc, [attackerKey, targets]) => {
          const safeAttackerKey = normalizeOwnerName(attackerKey);
          if (!safeAttackerKey || !targets || typeof targets !== "object" || Array.isArray(targets)) return acc;
          const sanitizedTargets = Object.entries(targets).reduce((targetAcc, [targetKey, until]) => {
            const safeTargetKey = normalizeOwnerName(targetKey);
            const safeUntil = Number(until);
            if (!safeTargetKey || !Number.isFinite(safeUntil) || safeUntil <= now) return targetAcc;
            targetAcc[safeTargetKey] = Math.floor(safeUntil);
            return targetAcc;
          }, {});
          if (Object.keys(sanitizedTargets).length) {
            acc[safeAttackerKey] = sanitizedTargets;
          }
          return acc;
        }, {});
    localStorage.setItem(ATTACK_TARGET_LOCK_STORAGE_KEY, JSON.stringify(safeState));
    return safeState;
  }

  function getAttackTargetLockRemainingMs(targetOwnerKey) {
    const attackerKey = resolveCurrentPlayerOwnerKey();
    const safeTargetKey = normalizeOwnerName(targetOwnerKey);
    if (!safeTargetKey) return 0;
    const state = readAttackTargetLockState();
    const until = Number(state?.[attackerKey]?.[safeTargetKey] || 0);
    if (!Number.isFinite(until) || until <= Date.now()) return 0;
    return Math.max(0, until - Date.now());
  }

  function setAttackTargetLockUntil(targetOwnerKey, until) {
    const attackerKey = resolveCurrentPlayerOwnerKey();
    const safeTargetKey = normalizeOwnerName(targetOwnerKey);
    const safeUntil = Number(until);
    if (!safeTargetKey || !Number.isFinite(safeUntil) || safeUntil <= Date.now()) return 0;
    const state = readAttackTargetLockState();
    state[attackerKey] = state[attackerKey] && typeof state[attackerKey] === "object" ? state[attackerKey] : {};
    state[attackerKey][safeTargetKey] = Math.floor(safeUntil);
    saveAttackTargetLockState(state);
    return state[attackerKey][safeTargetKey];
  }

  function readDistrictRaidLockState() {
    try {
      const raw = localStorage.getItem(DISTRICT_RAID_LOCK_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const now = Date.now();
      return Object.entries(parsed).reduce((acc, [districtId, until]) => {
        const safeDistrictId = Number(districtId);
        const safeUntil = Number(until);
        if (!Number.isFinite(safeDistrictId) || !Number.isFinite(safeUntil) || safeUntil <= now) return acc;
        acc[String(safeDistrictId)] = Math.floor(safeUntil);
        return acc;
      }, {});
    } catch (_) {
      return {};
    }
  }

  function saveDistrictRaidLockState(nextState) {
    const safeState = !nextState || typeof nextState !== "object"
      ? {}
      : Object.entries(nextState).reduce((acc, [districtId, until]) => {
          const safeDistrictId = Number(districtId);
          const safeUntil = Number(until);
          if (!Number.isFinite(safeDistrictId) || !Number.isFinite(safeUntil) || safeUntil <= Date.now()) return acc;
          acc[String(safeDistrictId)] = Math.floor(safeUntil);
          return acc;
        }, {});
    localStorage.setItem(DISTRICT_RAID_LOCK_STORAGE_KEY, JSON.stringify(safeState));
    return safeState;
  }

  function setDistrictRaidLockUntil(districtId, until) {
    const safeDistrictId = Number(districtId);
    if (!Number.isFinite(safeDistrictId)) return 0;
    const safeUntil = Number(until);
    const currentState = readDistrictRaidLockState();
    if (!Number.isFinite(safeUntil) || safeUntil <= Date.now()) {
      delete currentState[String(safeDistrictId)];
      saveDistrictRaidLockState(currentState);
      return 0;
    }
    currentState[String(safeDistrictId)] = Math.floor(safeUntil);
    saveDistrictRaidLockState(currentState);
    return currentState[String(safeDistrictId)];
  }

  function getDistrictRaidLockRemainingMs(districtId) {
    const safeDistrictId = Number(districtId);
    if (!Number.isFinite(safeDistrictId)) return 0;
    const currentState = readDistrictRaidLockState();
    const until = Number(currentState[String(safeDistrictId)] || 0);
    if (!Number.isFinite(until) || until <= Date.now()) {
      if (currentState[String(safeDistrictId)]) {
        delete currentState[String(safeDistrictId)];
        saveDistrictRaidLockState(currentState);
      }
      return 0;
    }
    return Math.max(0, until - Date.now());
  }

  function isRaidActionRunning() {
    return Number(raidActionState.endsAt || 0) > Date.now();
  }

  function resolveRaidDurationWithBoosts() {
    const pharmacySnapshot = window.Empire.Map?.getPharmacyBoostSnapshot?.();
    const factorySnapshot = window.Empire.Map?.getFactoryBoostSnapshot?.();
    const stealSpeedPct = Math.max(0, Number(pharmacySnapshot?.effective?.stealSpeedPct || 0));
    const raidSpeedPct = Math.max(0, Number(factorySnapshot?.effective?.raidSpeedPct || 0));
    const totalSpeedPct = stealSpeedPct + raidSpeedPct;
    const multiplier = Math.max(0.2, 1 - totalSpeedPct / 100);
    return Math.max(5000, Math.round(RAID_ACTION_DURATION_MS * multiplier));
  }

  function formatRaidCooldownLabel(ms) {
    return formatAttackCooldownLabel(ms);
  }

  function getAttackModalAvailability() {
    const counts = resolveWeaponCounts();
    const availableWeapons = getAttackWeaponTotal(counts);
    const actualMembers = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(cachedProfile || window.Empire.player || {})) || 0));
    const weaponAccess = resolveCombatWeaponAccess("attack", actualMembers);
    return {
      availableWeapons,
      actualMembers,
      weaponCounts: counts,
      weaponAccess,
      unlockedWeapon: weaponAccess.weapon || null,
      cooldownMs: getAttackCooldownRemainingMs()
    };
  }

  function getAttackSelectionSummary(availability, selectionCounts = attackModalState.selectedWeaponCounts || {}) {
    const actualMembers = Math.max(0, Math.floor(Number(availability?.actualMembers || 0)));
    const weaponCounts = availability?.weaponCounts || resolveWeaponCounts();
    const selection = attackWeaponStats.reduce((acc, item) => {
      const count = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      acc[item.name] = count;
      return acc;
    }, {});
    const totalUsedMembers = attackWeaponStats.reduce((sum, item) => {
      const count = Number(selection[item.name] || 0);
      return sum + (Number.isFinite(count) ? count * Number(item.requiredMembers || 0) : 0);
    }, 0);
    const remainingMembers = Math.max(0, actualMembers - totalUsedMembers);
    const remainingWeaponCounts = attackWeaponStats.reduce((acc, item) => {
      const stock = Math.max(0, Math.floor(Number(weaponCounts[item.name] || 0)));
      const selected = Math.max(0, Math.floor(Number(selection[item.name] || 0)));
      acc[item.name] = Math.max(0, stock - selected);
      return acc;
    }, {});
    return {
      actualMembers,
      remainingMembers,
      totalUsedMembers,
      weaponCounts,
      remainingWeaponCounts,
      selection
    };
  }

  function getAttackWeaponMaxCount(item, summary, availability) {
    const stock = Math.max(0, Math.floor(Number(summary?.weaponCounts?.[item.name] ?? availability?.weaponCounts?.[item.name] ?? 0)));
    const current = Math.max(0, Math.floor(Number(summary?.selection?.[item.name] || 0)));
    const otherUsedMembers = Math.max(0, Number(summary?.totalUsedMembers || 0) - current * Number(item.requiredMembers || 0));
    const remainingForThisWeapon = Math.max(0, Number(summary?.actualMembers || 0) - otherUsedMembers);
    const byMembers = Math.floor(remainingForThisWeapon / Math.max(1, Number(item.requiredMembers || 0)));
    return Math.max(0, Math.min(stock, byMembers));
  }

  function setAttackModalNote(message) {
    attackModalState.message = String(message || "");
    const note = document.getElementById("attack-modal-note");
    if (!note) return;
    note.textContent = attackModalState.message;
  }

  function getPopupRoots() {
    return Array.from(document.querySelectorAll(".modal"));
  }

  function closeAllPopupWindows() {
    suppressResultModalQueueAdvance = true;
    try {
      closeAttackModal();
      closeAttackConfirmModal();
      closeAttackResultModal();
      closeRaidResultModal();
      closePoliceActionResultModal();
      closeDefenseModal();
      closeSpyConfirmModal();
      closeOccupyConfirmModal();
      closeSpyResultModal();
    } finally {
      suppressResultModalQueueAdvance = false;
    }
    getPopupRoots().forEach((root) => {
      if (root instanceof HTMLElement) {
        root.classList.add("hidden");
      }
    });
    document.querySelectorAll(".stat__popover.is-open").forEach((popover) => {
      popover.classList.remove("is-open");
    });
  }

  function getAttackResultDetails(district, availability) {
    const nick = String(district?.ownerNick || district?.owner_username || district?.ownerUsername || district?.owner || "Neznámý").trim() || "Neznámý";
    const factionRaw = String(
      district?.ownerFaction ||
      district?.ownerStructure ||
      district?.owner_structure ||
      district?.ownerRole ||
      district?.owner_role ||
      "Neznámá"
    ).trim();
    const alliance = String(district?.ownerAllianceName || district?.owner_alliance_name || "Bez aliance").trim() || "Bez aliance";
    const selectedWeapons = attackWeaponStats
      .map((item) => {
        const count = Math.max(0, Math.floor(Number(availability?.selection?.[item.name] || 0)));
        return count > 0 ? `${count}× ${item.name}` : "";
      })
      .filter(Boolean);
    const members = Math.max(0, Math.floor(Number(availability?.totalUsedMembers || 0)));
    const powerCalc = calculateAttackPowerFromSelection(availability?.selection);
    const attackPowerRaw = powerCalc.rawPower;
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const combatPenalty = getPoliceRaidCombatPenalty();
    const attackPenaltyPct = Math.max(
      0,
      Number(combatPenalty.attackPct || 0) + Number(defenseSpecial.attackerAttackPenaltyPct || 0)
    );
    const attackPower = Math.max(0, Math.floor(attackPowerRaw * (1 - attackPenaltyPct / 100)));
    const durationMs = resolveAttackDurationMsForDistrict(district);
    return {
      nickname: nick,
      faction: formatFactionLabel(factionRaw),
      alliance,
      weapons: selectedWeapons.length ? selectedWeapons.join(", ") : "Žádná zbraň",
      attackPower,
      specialModifiers: powerCalc.special,
      defenseSpecialModifiers: defenseSpecial,
      members,
      durationMs,
      durationLabel: formatAttackDurationLabel(durationMs),
      summary: `Spustil jsi útok na hráče ${nick}.`
    };
  }

  function formatAttackSelectionSummary(selectionSummary) {
    const items = attackWeaponStats
      .map((item) => {
        const count = Math.max(0, Math.floor(Number(selectionSummary?.selection?.[item.name] || 0)));
        return count > 0 ? `${count}× ${item.name}` : "";
      })
      .filter(Boolean);
    return items.length > 0 ? items.join(", ") : "Žádná zbraň";
  }

  function getAttackDefensePowerEstimate(district, selection = null) {
    const snapshot = window.Empire.UI?.getDistrictDefenseSnapshot?.(district?.id) || null;
    const special = getAttackSpecialModifiers(selection);
    const defenseIgnoreMultiplier = Math.max(0, 1 - Math.max(0, Number(special.grenadeDefenseIgnorePct || 0)) / 100);
    const knownPower = [
      Number(snapshot?.self?.power || 0),
      Number(snapshot?.ally?.power || 0)
    ].reduce((max, value) => Math.max(max, Number.isFinite(value) ? value : 0), 0);
    const combatPenalty = getPoliceRaidCombatPenalty();
    if (knownPower > 0) {
      const reduced = knownPower
        * (1 - Math.max(0, Number(combatPenalty.defensePct || 0)) / 100)
        * defenseIgnoreMultiplier;
      return Math.max(0, Math.floor(reduced));
    }
    const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
    const influence = Math.max(0, Math.floor(Number(district?.influence || district?.influence_level || 0)));
    const fallback = Math.max(26, Math.floor(influence * 1.5 + buildings.length * 26 + (district?.owner ? 48 : 12)));
    const reducedFallback = fallback
      * (1 - Math.max(0, Number(combatPenalty.defensePct || 0)) / 100)
      * defenseIgnoreMultiplier;
    return Math.max(26, Math.floor(reducedFallback));
  }

  function resolveAttackOutcomeMeta(outcomeKey) {
    const key = String(outcomeKey || "").trim().toLowerCase();
    switch (key) {
      case "total_success":
        return {
          key,
          title: "TOTÁLNÍ ÚSPĚCH",
          tone: "success",
          badge: "District je tvůj",
          summary: "Rozjebali jste je na kusy. District je tvůj. Kdo tam ještě dýchá, už maká pro tebe nebo chcípne do rána."
        };
      case "pyrrhic_victory":
        return {
          key,
          title: "PYRRHOVO VÍTĚZSTVÍ",
          tone: "warning",
          badge: "Obrana zničená",
          summary: "Sejmul jsi jejich obranu, ale tvoji lidi šli do sraček s nima. Půlka chcípla, zbraně v hajzlu. District pořád stojí ale sotva."
        };
      case "catastrophe":
        return {
          key,
          title: "KATASTROFA",
          tone: "critical",
          badge: "District shořel",
          summary: "Všechno shořelo do prdele. Baráky, lidi, zásoby. Jen popel a smrad. Tady už není co brát, jen prázdná díra."
        };
      case "failure":
      default:
        return {
          key: "failure",
          title: "NEÚSPĚCH",
          tone: "danger",
          badge: "Útok odražen",
          summary: "Totální průser. Vběhli jste tam jak idioti a nechali tam krev i výbavu. Oni taky něco ztratili, ale ty jsi ten, co dostal přes držku."
        };
    }
  }

  function buildAttackOutcomeDetails(district, availability, selectionSummary, attackResult = null) {
    const base = getAttackResultDetails(district, {
      ...availability,
      ...selectionSummary
    });
    const attackPower = Math.max(0, Math.floor(Number(attackResult?.attackPower ?? base.attackPower ?? 0)));
    const defensePower = Math.max(0, Math.floor(Number(
      attackResult?.defensePower ?? getAttackDefensePowerEstimate(district, selectionSummary?.selection)
    )));
    const outcomeMeta = resolveAttackOutcomeMeta(attackResult?.outcomeKey || "");
    const districtDestroyed = Boolean(attackResult?.destroyed || outcomeMeta.key === "catastrophe");
    const attackerLossPct = Math.max(0, Math.floor(Number(attackResult?.attackerLossPct || 0)));
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const defenderLossBasePct = Math.max(0, Math.floor(Number(attackResult?.defenderLossPct || 0)));
    const defenderLossPct = Math.max(
      0,
      Math.floor(defenderLossBasePct * (1 - Math.max(0, Number(defenseSpecial.defenderMemberLossReductionPct || 0)) / 100))
    );
    const districtLossPct = Math.max(0, Math.floor(Number(attackResult?.districtLossPct || 0)));
    const selectedWeaponLosses = {};
    attackWeaponStats.forEach((item) => {
      const selected = Math.max(0, Math.floor(Number(selectionSummary?.selection?.[item.name] || 0)));
      if (!selected) return;
      let lost = selected;
      if (outcomeMeta.key === "total_success") {
        lost = 0;
      } else if (outcomeMeta.key === "pyrrhic_victory") {
        lost = Math.ceil(selected * 0.5);
      }
      selectedWeaponLosses[item.name] = lost;
    });
    const lostMembers = outcomeMeta.key === "total_success"
      ? 0
      : outcomeMeta.key === "pyrrhic_victory"
        ? Math.ceil(Number(selectionSummary?.totalUsedMembers || 0) * 0.5)
        : Math.max(0, Math.floor(Number(selectionSummary?.totalUsedMembers || 0)));

    const availableRows = {
      attackPower: `${attackPower}`,
      defensePower: `${defensePower}`,
      attackerLosses: `${attackerLossPct}%`,
      defenderLosses: `${defenderLossPct}%`,
      districtState: districtDestroyed
        ? "Zničený"
        : outcomeMeta.key === "total_success"
          ? "Obsazený"
          : "Stojí"
    };

    return {
      ...base,
      districtId: district?.id ?? null,
      districtName: district?.name || `Distrikt #${district?.id ?? "-"}`,
      title: outcomeMeta.title,
      outcomeBadge: outcomeMeta.badge,
      outcomeTone: outcomeMeta.tone,
      summary: outcomeMeta.summary,
      outcomeKey: outcomeMeta.key,
      attackPower,
      defensePower,
      winChancePct: Math.round(calculateAttackWinChancePct(attackPower, defensePower)),
      attackerLossPct,
      defenderLossPct,
      districtLossPct,
      districtDestroyed,
      selectedWeaponLosses,
      lostMembers,
      attackRowValue: availableRows.attackPower,
      defenseRowValue: availableRows.defensePower,
      attackerLossesRowValue: availableRows.attackerLosses,
      defenderLossesRowValue: availableRows.defenderLosses,
      districtStateValue: districtDestroyed ? "Zničený" : (outcomeMeta.key === "total_success" ? "Obsazený" : "Stojí"),
      durationValue: base.durationLabel,
      activatedSpecialEffects: resolveActivatedAttackSpecialEffects(selectionSummary?.selection, district)
    };
  }

  function scheduleAttackResultModal(details, selectionSummary) {
    if (attackResultTimer) {
      clearTimeout(attackResultTimer);
      attackResultTimer = null;
    }
    const safeDetails = { ...(details || {}) };
    const safeSelectionSummary = selectionSummary ? { ...selectionSummary } : null;
    attackResultTimer = setTimeout(() => {
      attackResultTimer = null;
      applyAttackOutcomeLosses(safeSelectionSummary, safeDetails.outcomeKey);
      if (String(safeDetails.outcomeKey || "").trim().toLowerCase() === "total_success") {
        const district = resolveDistrictById(safeDetails.districtId);
        if (district) {
          claimDistrictForPlayer(district);
        }
      }
      openAttackResultModal(safeDetails);
    }, Math.max(1000, Math.floor(Number(safeDetails.durationMs || ATTACK_ACTION_DURATION_MS))));
  }

  function calculateAttackWinChancePct(attackPower, defensePower) {
    const attack = Math.max(0, Math.floor(Number(attackPower) || 0));
    const defense = Math.max(0, Math.floor(Number(defensePower) || 0));
    const total = attack + defense;
    if (total <= 0) return 0;
    return (attack / total) * 100;
  }

  function resolveAttackOutcomeFromPower(attackPower, defensePower, options = {}) {
    const attack = Math.max(0, Math.floor(Number(attackPower) || 0));
    const defense = Math.max(0, Math.floor(Number(defensePower) || 0));
    const bonusCatastropheChancePct = Math.max(0, Number(options?.bonusCatastropheChancePct || 0));
    const catastrophe = Math.random() < ((8 + bonusCatastropheChancePct) / 100);
    const winChancePct = calculateAttackWinChancePct(attack, defense);
    if (catastrophe) {
      return {
        outcomeKey: "catastrophe",
        winChancePct,
        attackerLossPct: 100,
        defenderLossPct: 100,
        districtLossPct: 100,
        destroyed: true
      };
    }
    if ((Math.random() * 100) < winChancePct) {
      const total = Math.max(1, attack + defense);
      const marginPct = ((attack - defense) / total) * 100;
      const totalSuccessChancePct = Math.max(35, Math.min(85, 55 + marginPct));
      if ((Math.random() * 100) < totalSuccessChancePct) {
        return {
          outcomeKey: "total_success",
          winChancePct,
          attackerLossPct: 0,
          defenderLossPct: 100,
          districtLossPct: 100,
          destroyed: false
        };
      }
      return {
        outcomeKey: "pyrrhic_victory",
        winChancePct,
        attackerLossPct: 50,
        defenderLossPct: 100,
        districtLossPct: 25,
        destroyed: false
      };
    }
    return {
      outcomeKey: "failure",
      winChancePct,
      attackerLossPct: 100,
      defenderLossPct: 20,
      districtLossPct: 20,
      destroyed: false
    };
  }

  function applyAttackOutcomeLosses(selectionSummary, outcomeKey) {
    const key = String(outcomeKey || "").trim().toLowerCase();
    if (key === "total_success") {
      return { weaponLosses: {}, lostMembers: 0 };
    }
    const weaponLosses = {};
    attackWeaponStats.forEach((item) => {
      const selected = Math.max(0, Math.floor(Number(selectionSummary?.selection?.[item.name] || 0)));
      if (!selected) return;
      const lost = key === "pyrrhic_victory"
        ? Math.ceil(selected * 0.5)
        : selected;
      if (lost > 0) weaponLosses[item.name] = lost;
    });
    const lostMembers = key === "pyrrhic_victory"
      ? Math.ceil(Math.max(0, Number(selectionSummary?.totalUsedMembers || 0)) * 0.5)
      : Math.max(0, Math.floor(Number(selectionSummary?.totalUsedMembers || 0)));
    if (Object.keys(weaponLosses).length > 0) {
      consumeAttackWeaponCounts(weaponLosses);
    }
    if (lostMembers > 0) {
      consumeGangMembers(lostMembers);
    }
    return { weaponLosses, lostMembers };
  }

  function isOnboardingDemoScenarioActive() {
    return activePlayerScenarioKey === "onboarding-20-edge" && scenarioVisionEnabled && !window.Empire.token;
  }

  function renderAttackResultModal(details) {
    const root = document.getElementById("attack-result-modal");
    const content = document.getElementById("attack-result-modal-content");
    const badge = document.getElementById("attack-result-modal-badge");
    const summary = document.getElementById("attack-result-modal-summary");
    const title = document.querySelector("#attack-result-modal .modal__header h3");
    const nickname = document.getElementById("attack-result-modal-nickname");
    const faction = document.getElementById("attack-result-modal-faction");
    const alliance = document.getElementById("attack-result-modal-alliance");
    const weapons = document.getElementById("attack-result-modal-weapons");
    const power = document.getElementById("attack-result-modal-power");
    const members = document.getElementById("attack-result-modal-members");
    const duration = document.getElementById("attack-result-modal-duration");
    const targetLabel = document.getElementById("attack-result-modal-label-target");
    const attackLabel = document.getElementById("attack-result-modal-label-attack");
    const defenseLabel = document.getElementById("attack-result-modal-label-defense");
    const attackLossLabel = document.getElementById("attack-result-modal-label-attack-losses");
    const defenseLossLabel = document.getElementById("attack-result-modal-label-defense-losses");
    const stateLabel = document.getElementById("attack-result-modal-label-state");
    const durationLabel = document.getElementById("attack-result-modal-label-duration");
    if (content) {
      content.classList.remove("is-total-success", "is-pyrrhic-victory", "is-failure", "is-catastrophe");
      const outcomeClass = details?.outcomeKey
        ? `is-${String(details.outcomeKey).replace(/_/g, "-")}`
        : "is-failure";
      content.classList.add(outcomeClass);
    }
    if (badge) badge.textContent = details.outcomeBadge || "Výsledek útoku";
    if (title) title.textContent = details.title || "Výsledek útoku";
    if (summary) {
      const specialLines = Array.isArray(details?.activatedSpecialEffects)
        ? details.activatedSpecialEffects.filter(Boolean)
        : [];
      summary.textContent = specialLines.length
        ? `${details.summary || ""} Aktivované efekty: ${specialLines.join(" • ")}`
        : (details.summary || "");
    }
    if (targetLabel) targetLabel.textContent = "Cíl";
    if (attackLabel) attackLabel.textContent = "Útočná síla";
    if (defenseLabel) defenseLabel.textContent = "Obranná síla";
    if (attackLossLabel) attackLossLabel.textContent = "Ztráty útočníka";
    if (defenseLossLabel) defenseLossLabel.textContent = "Ztráty obránce";
    if (stateLabel) stateLabel.textContent = "Stav districtu";
    if (durationLabel) durationLabel.textContent = "Trvání";
    if (nickname) nickname.textContent = details.districtName || `Distrikt #${details.districtId ?? "-"}`;
    if (faction) faction.textContent = `${details.attackPower ?? 0}`;
    if (alliance) alliance.textContent = `${details.defensePower ?? 0}`;
    if (weapons) weapons.textContent = `${details.attackerLossPct ?? 0}%`;
    if (power) power.textContent = `${details.defenderLossPct ?? 0}%`;
    if (members) members.textContent = details.districtStateValue || "-";
    if (duration) duration.textContent = details.durationValue || details.durationLabel || "-";
    if (!root) return;
  }

  function renderAttackWeaponButtons(container, availability) {
    if (!container) return;
    const summary = getAttackSelectionSummary(availability);
    container.innerHTML = attackWeaponStats
      .map((item) => {
        const amount = Math.max(0, Math.floor(Number(summary.selection[item.name] || 0)));
        const stock = Math.max(0, Math.floor(Number(summary.remainingWeaponCounts[item.name] || 0)));
        const maxCount = getAttackWeaponMaxCount(item, summary, availability);
        const unlocked = stock > 0 && maxCount > 0;
        return `
          <div class="attack-modal__weapon ${amount > 0 ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}">
            <div class="attack-modal__weapon-body">
              <span class="attack-modal__weapon-name">${item.name}</span>
              <span class="attack-modal__weapon-meta">Síla ${item.power} • Min. ${item.requiredMembers} členů • ${stock} ks skladem</span>
              ${resolveAttackWeaponSpecialText(item.name) ? `<span class="attack-modal__weapon-meta attack-modal__weapon-meta--special">${resolveAttackWeaponSpecialText(item.name)}</span>` : ""}
            </div>
            <div class="attack-modal__weapon-stepper">
              <button
                type="button"
                class="attack-modal__step-btn"
                data-attack-weapon="${item.name}"
                data-attack-action="decrease"
                ${amount <= 0 ? "disabled" : ""}
              >−</button>
              <strong class="attack-modal__weapon-count">×${amount}</strong>
              <button
                type="button"
                class="attack-modal__step-btn"
                data-attack-weapon="${item.name}"
                data-attack-action="increase"
                ${!unlocked ? "disabled" : ""}
              >+</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function getDefenseModalAvailability() {
    const counts = resolveDefenseCounts();
    const availableWeapons = getDefenseWeaponTotal(counts);
    const actualMembers = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(cachedProfile || window.Empire.player || {})) || 0));
    const weaponAccess = resolveCombatWeaponAccess("defense", actualMembers);
    return {
      availableWeapons,
      actualMembers,
      weaponCounts: counts,
      weaponAccess,
      unlockedWeapon: weaponAccess.weapon || null
    };
  }

  function getDefenseSelectionSummary(availability, selectionCounts = defenseModalState.selectedWeaponCounts || {}) {
    const actualMembers = Math.max(0, Math.floor(Number(availability?.actualMembers || 0)));
    const weaponCounts = availability?.weaponCounts || resolveDefenseCounts();
    const selection = defenseWeaponStats.reduce((acc, item) => {
      const count = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      acc[item.name] = count;
      return acc;
    }, {});
    const totalUsedMembers = defenseWeaponStats.reduce((sum, item) => {
      const count = Number(selection[item.name] || 0);
      return sum + (Number.isFinite(count) ? count * Number(item.requiredMembers || 0) : 0);
    }, 0);
    const remainingMembers = Math.max(0, actualMembers - totalUsedMembers);
    const remainingWeaponCounts = defenseWeaponStats.reduce((acc, item) => {
      const stock = Math.max(0, Math.floor(Number(weaponCounts[item.name] || 0)));
      const selected = Math.max(0, Math.floor(Number(selection[item.name] || 0)));
      acc[item.name] = Math.max(0, stock - selected);
      return acc;
    }, {});
    return {
      actualMembers,
      remainingMembers,
      totalUsedMembers,
      weaponCounts,
      remainingWeaponCounts,
      selection
    };
  }

  function getDefenseWeaponMaxCount(item, summary, availability) {
    const stock = Math.max(0, Math.floor(Number(summary?.weaponCounts?.[item.name] ?? availability?.weaponCounts?.[item.name] ?? 0)));
    const current = Math.max(0, Math.floor(Number(summary?.selection?.[item.name] || 0)));
    const otherUsedMembers = Math.max(0, Number(summary?.totalUsedMembers || 0) - current * Number(item.requiredMembers || 0));
    const remainingForThisWeapon = Math.max(0, Number(summary?.actualMembers || 0) - otherUsedMembers);
    const byMembers = Math.floor(remainingForThisWeapon / Math.max(1, Number(item.requiredMembers || 0)));
    return Math.max(0, Math.min(stock, byMembers));
  }

  function renderDefenseWeaponButtons(container, availability) {
    if (!container) return;
    const summary = getDefenseSelectionSummary(availability);
    container.innerHTML = defenseWeaponStats
      .map((item) => {
        const amount = Math.max(0, Math.floor(Number(summary.selection[item.name] || 0)));
        const stock = Math.max(0, Math.floor(Number(summary.remainingWeaponCounts[item.name] || 0)));
        const maxCount = getDefenseWeaponMaxCount(item, summary, availability);
        const unlocked = stock > 0 && maxCount > 0;
        return `
          <div class="attack-modal__weapon ${amount > 0 ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}">
            <div class="attack-modal__weapon-body">
              <span class="attack-modal__weapon-name">${item.name}</span>
              <span class="attack-modal__weapon-meta">Síla ${item.power} • Min. ${item.requiredMembers} členů • ${stock} ks skladem</span>
              ${resolveDefenseWeaponSpecialText(item.name) ? `<span class="attack-modal__weapon-meta attack-modal__weapon-meta--special">${resolveDefenseWeaponSpecialText(item.name)}</span>` : ""}
            </div>
            <div class="attack-modal__weapon-stepper">
              <button
                type="button"
                class="attack-modal__step-btn"
                data-defense-weapon="${item.name}"
                data-defense-action="decrease"
                ${amount <= 0 ? "disabled" : ""}
              >−</button>
              <strong class="attack-modal__weapon-count">×${amount}</strong>
              <button
                type="button"
                class="attack-modal__step-btn"
                data-defense-weapon="${item.name}"
                data-defense-action="increase"
                ${!unlocked ? "disabled" : ""}
              >+</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function openAttackResultModal(details) {
    const root = document.getElementById("attack-result-modal");
    if (!root) return;
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "attack", payload: details });
      return;
    }
    const nextState = {
      ...(details || {}),
      visible: true
    };
    attackResultModalState = nextState;
    renderAttackResultModal(attackResultModalState);
    root.classList.remove("hidden");
  }

  function closeAttackResultModal() {
    const root = document.getElementById("attack-result-modal");
    if (root) root.classList.add("hidden");
    attackResultModalState = { visible: false };
    if (suppressResultModalQueueAdvance) return;
    if (!pendingResultModalQueue.length) return;
    setTimeout(() => {
      renderNextPendingResultModal();
    }, 80);
  }

  function closeAttackConfirmModal() {
    const root = document.getElementById("attack-confirm-modal");
    if (root) root.classList.add("hidden");
    attackConfirmModalState = {
      districtId: null,
      availability: null,
      selectionSummary: null,
      baseDetails: null,
      defensePowerEstimate: 0
    };
  }

  function renderAttackConfirmModal() {
    const root = document.getElementById("attack-confirm-modal");
    const districtEl = document.getElementById("attack-confirm-modal-district");
    const defenseRowEl = document.getElementById("attack-confirm-modal-defense-row");
    const defenseEl = document.getElementById("attack-confirm-modal-defense");
    const weaponsEl = document.getElementById("attack-confirm-modal-weapons");
    const membersEl = document.getElementById("attack-confirm-modal-members");
    const powerEl = document.getElementById("attack-confirm-modal-power");
    const noteEl = document.getElementById("attack-confirm-modal-note");
    const confirmBtn = document.getElementById("attack-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !defenseRowEl || !defenseEl || !weaponsEl || !membersEl || !powerEl || !noteEl || !confirmBtn) return;

    const district = resolveDistrictById(attackConfirmModalState.districtId);
    const availability = attackConfirmModalState.availability || getAttackModalAvailability();
    const selectionSummary = attackConfirmModalState.selectionSummary || getAttackSelectionSummary(availability);
    const baseDetails = attackConfirmModalState.baseDetails || getAttackResultDetails(district, {
      ...availability,
      ...selectionSummary
    });
    const spyIntel = getDistrictSpyIntel(district?.id);
    const usedMembers = Math.max(0, Math.floor(Number(selectionSummary?.totalUsedMembers || 0)));
    const attackPower = Math.max(0, Math.floor(Number(baseDetails.attackPower || 0)));
    const defensePowerEstimate = Math.max(0, Math.floor(Number(
      attackConfirmModalState.defensePowerEstimate || getAttackDefensePowerEstimate(district, selectionSummary?.selection)
    )));
    const winChancePct = Math.round(calculateAttackWinChancePct(attackPower, defensePowerEstimate));

    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    if (spyIntel && String(spyIntel.powerRangeLabel || "").trim()) {
      defenseRowEl.classList.remove("hidden");
      const range = String(spyIntel.powerRangeLabel).trim();
      defenseEl.innerHTML = `${range} <span class="attack-confirm-modal__intel-chip">ze špehování</span>`;
    } else {
      defenseRowEl.classList.add("hidden");
      defenseEl.textContent = "-";
    }
    weaponsEl.textContent = formatAttackSelectionSummary(selectionSummary);
    membersEl.textContent = String(usedMembers);
    powerEl.textContent = String(attackPower);
    noteEl.textContent = `Po potvrzení se útok spustí na ${baseDetails.durationLabel || formatAttackDurationLabel(ATTACK_ACTION_DURATION_MS)}. Odhad šance na výhru: ${winChancePct} %. Výsledek se ukáže až po doběhnutí plamenů.`;

    confirmBtn.disabled = !district || usedMembers <= 0 || attackPower <= 0;
  }

  function openAttackConfirmModal(payload) {
    const root = document.getElementById("attack-confirm-modal");
    if (!root) return;
    attackConfirmModalState = {
      districtId: payload?.districtId ?? null,
      availability: payload?.availability || null,
      selectionSummary: payload?.selectionSummary || null,
      baseDetails: payload?.baseDetails || null,
      defensePowerEstimate: Math.max(0, Math.floor(Number(payload?.defensePowerEstimate || 0)))
    };
    root.classList.remove("hidden");
    renderAttackConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:attack-confirm-modal-opened", {
      detail: {
        districtId: attackConfirmModalState.districtId,
        district: resolveDistrictById(attackConfirmModalState.districtId) || null
      }
    }));
  }

  function startAttackActionFromConfirmModal() {
    const district = resolveDistrictById(attackConfirmModalState.districtId);
    if (!district) {
      closeAttackConfirmModal();
      closeAttackModal();
      return;
    }

    const availability = attackConfirmModalState.availability || getAttackModalAvailability();
    const selectionSummary = attackConfirmModalState.selectionSummary || getAttackSelectionSummary(availability);
    const baseDetails = attackConfirmModalState.baseDetails || getAttackResultDetails(district, {
      ...availability,
      ...selectionSummary
    });
    const defensePowerEstimate = Math.max(0, Math.floor(Number(
      attackConfirmModalState.defensePowerEstimate || getAttackDefensePowerEstimate(district, selectionSummary?.selection)
    )));
    const attackSpecial = getAttackSpecialModifiers(selectionSummary?.selection);
    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    const trapEntry = getDistrictTrapEntry(district?.id);

    if (trapEntry) {
      const consumedTrap = consumeDistrictTrap(district?.id);
      const lockUntil = setAttackTargetLockUntil(district?.owner, Date.now() + TRAP_ATTACK_TARGET_LOCK_MS);
      const lockMs = Math.max(0, Number(lockUntil || 0) - Date.now());
      const targetLabel = String(district?.ownerNick || district?.owner || consumedTrap?.targetOwnerLabel || "Neznámý").trim() || "Neznámý";
      closeAllPopupWindows();
      setAttackCooldownUntil(Date.now() + ATTACK_COOLDOWN_MS);
      pushEvent(`Past v districtu ${district?.name || `#${district?.id ?? "-"}`} zrušila útok. Na hráče ${targetLabel} máš cooldown ${formatDurationLabel(lockMs || TRAP_ATTACK_TARGET_LOCK_MS)}.`);
      openAttackResultModal({
        districtId: district?.id ?? null,
        districtName: district?.name || `Distrikt #${district?.id ?? "-"}`,
        title: "PAST AKTIVOVÁNA",
        outcomeBadge: "Útok zrušen",
        outcomeTone: "critical",
        outcomeKey: "failure",
        summary: `V districtu byla nastražená past. Útok se rozpadl dřív, než začal. Na hráče ${targetLabel} nemůžeš znovu zaútočit ${formatDurationLabel(lockMs || TRAP_ATTACK_TARGET_LOCK_MS)}.`,
        attackPower: baseDetails.attackPower,
        defensePower: defensePowerEstimate,
        attackerLossPct: 0,
        defenderLossPct: 0,
        districtStateValue: "Past spuštěna",
        durationValue: formatDurationLabel(lockMs || TRAP_ATTACK_TARGET_LOCK_MS),
        activatedSpecialEffects: ["Past zrušila útok a spustila 5h cooldown na další útok proti tomuto hráči."]
      });
      return;
    }

    closeAllPopupWindows();
    setAttackCooldownUntil(Date.now() + ATTACK_COOLDOWN_MS);

    const outcomeRoll = resolveAttackOutcomeFromPower(baseDetails.attackPower, defensePowerEstimate, {
      bonusCatastropheChancePct: attackSpecial.bazookaCatastropheChancePct
    });
    const details = buildAttackOutcomeDetails(district, availability, selectionSummary, {
      ...outcomeRoll,
      attackPower: baseDetails.attackPower,
      defensePower: defensePowerEstimate
    });

    pushEvent(`${details.title}: ${details.summary}`);
    window.Empire.Map?.markDistrictUnderAttack?.(district.id, {
      attackerDistrictId: district.id,
      durationMs: Math.max(1000, Math.floor(Number(baseDetails.durationMs || ATTACK_ACTION_DURATION_MS))),
      source: demoMode ? "scenario-attack" : "player-attack"
    });
    recordVerifiedIntelEvent({
      type: "attack_outcome",
      districtId: district.id,
      message: details.summary
    });
    scheduleAttackResultModal(details, selectionSummary);
  }

  function initAttackConfirmModal() {
    const root = document.getElementById("attack-confirm-modal");
    const backdrop = document.getElementById("attack-confirm-modal-backdrop");
    const closeBtn = document.getElementById("attack-confirm-modal-close");
    const cancelBtn = document.getElementById("attack-confirm-modal-cancel");
    const confirmBtn = document.getElementById("attack-confirm-modal-confirm");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeAttackConfirmModal);
    if (closeBtn) closeBtn.addEventListener("click", closeAttackConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeAttackConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener("click", startAttackActionFromConfirmModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeAttackConfirmModal();
      }
    });
  }

  function renderAttackModal() {
    const root = document.getElementById("attack-modal");
    if (!root || root.classList.contains("hidden")) return;
    const district = resolveDistrictById(attackModalState.districtId);
    const districtLabel = document.getElementById("attack-modal-district");
    const membersCountEl = document.getElementById("attack-modal-members-count");
    const usedMembersEl = document.getElementById("attack-modal-used-members");
    const powerEl = document.getElementById("attack-modal-power");
    const weaponButtons = document.getElementById("attack-modal-weapons");
    const cooldownEl = document.getElementById("attack-modal-cooldown");
    const startBtn = document.getElementById("attack-modal-start");
    const note = document.getElementById("attack-modal-note");
    if (!districtLabel || !membersCountEl || !usedMembersEl || !powerEl || !weaponButtons || !cooldownEl || !startBtn || !note) {
      return;
    }

    const availability = getAttackModalAvailability();
    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    const selectionSummary = getAttackSelectionSummary(availability);

    if (!attackModalState.districtId && district?.id != null) {
      attackModalState = { districtId: district.id, message: attackModalState.message || "", selectedWeaponCounts: attackModalState.selectedWeaponCounts || {} };
    }

    if (district) {
      districtLabel.textContent = district.name || `Distrikt #${district.id}`;
    } else {
      districtLabel.textContent = "-";
    }

    membersCountEl.textContent = String(selectionSummary.remainingMembers);
    usedMembersEl.textContent = String(selectionSummary.totalUsedMembers);
    powerEl.textContent = String(attackWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(selectionSummary.selection[item.name] || 0)));
      return sum + (count * Number(item.power || 0));
    }, 0));
    renderAttackWeaponButtons(weaponButtons, availability);

    const cooldownMs = availability.cooldownMs;
    cooldownEl.textContent = cooldownMs > 0
      ? formatAttackCooldownLabel(cooldownMs)
      : "Připraveno";

    let noteText = attackModalState.message || (demoMode
      ? "Šipkou doprava přidáváš, šipkou doleva ubíráš. Členové gangu se přepočítají automaticky."
      : "Šipkou doprava přidáváš, šipkou doleva ubíráš. Členové gangu se přepočítají automaticky.");
    if (!window.Empire.token && !demoMode) {
      noteText = "Bez přihlášení lze v této verzi útok jen připravit.";
    } else if (cooldownMs > 0) {
      noteText = `Útok je na cooldownu ještě ${formatAttackCooldownLabel(cooldownMs)}.`;
    } else if (availability.availableWeapons <= 0) {
      noteText = "Ve skladu nejsou žádné zbraně.";
    } else if (selectionSummary.totalUsedMembers <= 0) {
      noteText = "Pro útok potřebuješ alespoň 50 členů gangu.";
    } else if (selectionSummary.remainingMembers < 0) {
      noteText = "Nemáš dost členů gangu pro tuto kombinaci.";
    }
    note.textContent = noteText;

    const isReady = cooldownMs <= 0
      && selectionSummary.totalUsedMembers > 0
      && (demoMode || Boolean(window.Empire.token));
    startBtn.disabled = !isReady;
    startBtn.textContent = demoMode ? "Spustit ukázkový útok" : "Spustit útok";
  }

  function closeAttackModal() {
    const root = document.getElementById("attack-modal");
    if (root) root.classList.add("hidden");
    attackModalState = { districtId: null, message: "", selectedWeaponCounts: {} };
    if (attackModalRefreshTimer) {
      clearInterval(attackModalRefreshTimer);
      attackModalRefreshTimer = null;
    }
  }

  function openAttackModal(district) {
    const root = document.getElementById("attack-modal");
    if (!root) return;

    attackModalState = { districtId: district?.id ?? null, message: "", selectedWeaponCounts: {} };
    setAttackModalNote("");
    root.classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("empire:attack-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
    renderAttackModal();

    if (attackModalRefreshTimer) clearInterval(attackModalRefreshTimer);
    attackModalRefreshTimer = setInterval(() => {
      const modal = document.getElementById("attack-modal");
      if (!modal || modal.classList.contains("hidden")) {
        closeAttackModal();
        return;
      }
      renderAttackModal();
    }, 250);
  }

  function initAttackModal() {
    const root = document.getElementById("attack-modal");
    const backdrop = document.getElementById("attack-modal-backdrop");
    const closeBtn = document.getElementById("attack-modal-close");
    const startBtn = document.getElementById("attack-modal-start");
    const weaponButtons = document.getElementById("attack-modal-weapons");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeAttackModal);
    if (closeBtn) closeBtn.addEventListener("click", closeAttackModal);
    if (weaponButtons) {
      weaponButtons.addEventListener("dblclick", (event) => {
        event.preventDefault();
      });
      weaponButtons.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest("[data-attack-weapon][data-attack-action]");
        if (!button) return;
        const name = String(button.getAttribute("data-attack-weapon") || "").trim();
        const action = String(button.getAttribute("data-attack-action") || "").trim();
        if (!name) return;
        if (action !== "increase" && action !== "decrease") return;
        const availability = getAttackModalAvailability();
        const summary = getAttackSelectionSummary(availability);
        const item = attackWeaponStats.find((entry) => entry.name === name);
        if (!item) return;
        const current = Math.max(0, Math.floor(Number(summary.selection[name] || 0)));
        const maxCount = getAttackWeaponMaxCount(item, summary, availability);
        let nextCount = current;
        if (action === "increase") {
          nextCount = current < maxCount ? current + 1 : current;
        } else if (action === "decrease") {
          nextCount = current > 0 ? current - 1 : 0;
        }
        attackModalState.selectedWeaponCounts = {
          ...(attackModalState.selectedWeaponCounts || {}),
          [name]: nextCount
        };
        if (nextCount <= 0) {
          delete attackModalState.selectedWeaponCounts[name];
        }
        setAttackModalNote("");
        renderAttackModal();
      });
    }
    if (startBtn) {
      startBtn.addEventListener("click", async () => {
        const district = resolveDistrictById(attackModalState.districtId);
        if (!district) {
          setAttackModalNote("Nejprve vyber cíl útoku.");
          return;
        }
        const availability = getAttackModalAvailability();
        const demoMode = scenarioVisionEnabled && !window.Empire.token;
        if (getAttackCooldownRemainingMs() > 0) {
          setAttackModalNote(`Útok je na cooldownu ještě ${formatAttackCooldownLabel(getAttackCooldownRemainingMs())}.`);
          renderAttackModal();
          return;
        }
        const selectionSummary = getAttackSelectionSummary(availability);
        if (selectionSummary.totalUsedMembers <= 0) {
          setAttackModalNote("Pro útok potřebuješ alespoň 50 členů gangu.");
          renderAttackModal();
          return;
        }
        if (selectionSummary.remainingMembers < 0) {
          setAttackModalNote("Nemáš dost členů gangu pro tuto kombinaci.");
          renderAttackModal();
          return;
        }
        const baseDetails = getAttackResultDetails(district, {
          ...availability,
          ...selectionSummary
        });
        const defensePowerEstimate = getAttackDefensePowerEstimate(district, selectionSummary?.selection);

        if (demoMode) {
          openAttackConfirmModal({
            districtId: district.id,
            availability,
            selectionSummary,
            baseDetails,
            defensePowerEstimate
          });
          return;
        }

        if (!window.Empire.token) {
          setAttackModalNote("Bez přihlášení lze útok jen připravit v ukázkovém stavu.");
          renderAttackModal();
          return;
        }

        startBtn.disabled = true;
        setAttackModalNote("Útok probíhá...");
        try {
          const result = await window.Empire.API.attackDistrict(district.id);
          if (result?.error) {
            const errorMessage = formatAttackError(result.error);
            setAttackModalNote(errorMessage);
            pushEvent(errorMessage);
            recordVerifiedIntelEvent({
              type: "attack_failed",
              districtId: district.id,
              message: errorMessage
            });
            renderAttackModal();
            return;
          }
          setAttackCooldownUntil(Date.now() + ATTACK_COOLDOWN_MS);
          const details = buildAttackOutcomeDetails(district, availability, selectionSummary, {
            ...result,
            attackPower: result?.attackPower ?? baseDetails.attackPower,
            defensePower: result?.defensePower ?? defensePowerEstimate
          });
          pushEvent(details.summary);
          window.Empire.Map?.markDistrictUnderAttack?.(district.id, {
            attackerDistrictId: result?.sourceDistrictId ?? result?.attackerDistrictId ?? null,
            durationMs: ATTACK_ACTION_DURATION_MS,
            source: "player-attack"
          });
          recordVerifiedIntelEvent({
            type: "attack_outcome",
            districtId: district.id,
            message: details.summary
          });
          closeAttackModal();
          scheduleAttackResultModal(details, selectionSummary);
        } catch (error) {
          const message = error?.message || "Útok se nepodařilo spustit.";
          setAttackModalNote(message);
          pushEvent(message);
          renderAttackModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAttackModal();
    });
  }

  function initAttackResultModal() {
    const root = document.getElementById("attack-result-modal");
    const backdrop = document.getElementById("attack-result-modal-backdrop");
    const closeBtn = document.getElementById("attack-result-modal-close");
    const okBtn = document.getElementById("attack-result-modal-ok");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeAttackResultModal);
    if (closeBtn) closeBtn.addEventListener("click", closeAttackResultModal);
    if (okBtn) okBtn.addEventListener("click", closeAttackResultModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeAttackResultModal();
      }
    });
  }

  function closeRaidResultModal() {
    const root = document.getElementById("raid-result-modal");
    if (root) root.classList.add("hidden");
    if (suppressResultModalQueueAdvance) return;
    if (!pendingResultModalQueue.length) return;
    setTimeout(() => {
      renderNextPendingResultModal();
    }, 80);
  }

  function openRaidResultModal(payload = {}) {
    const root = document.getElementById("raid-result-modal");
    const content = document.getElementById("raid-result-modal-content");
    const title = document.getElementById("raid-result-modal-title");
    const summary = document.getElementById("raid-result-modal-summary");
    const details = document.getElementById("raid-result-modal-details");
    if (!root || !content || !title || !summary || !details) return;
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "raid", payload });
      return;
    }

    const tone = String(payload.tone || "").trim();
    content.classList.remove("is-clean-success", "is-dirty-fail", "is-disaster", "is-alert");
    if (tone) content.classList.add(tone);
    title.textContent = String(payload.title || "Výsledek krádeže").trim() || "Výsledek krádeže";
    const summaryText = String(payload.summary || "").trim();
    summary.textContent = summaryText;
    summary.hidden = !summaryText;
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    details.innerHTML = rows.map((row) => `
      <div class="modal__row">
        <span>${row.label}</span>
        <strong>${row.value}</strong>
      </div>
    `).join("");
    root.classList.remove("hidden");
  }

  function initRaidResultModal() {
    const root = document.getElementById("raid-result-modal");
    const backdrop = document.getElementById("raid-result-modal-backdrop");
    const closeBtn = document.getElementById("raid-result-modal-close");
    const okBtn = document.getElementById("raid-result-modal-ok");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeRaidResultModal);
    if (closeBtn) closeBtn.addEventListener("click", closeRaidResultModal);
    if (okBtn) okBtn.addEventListener("click", closeRaidResultModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeRaidResultModal();
      }
    });
  }

  function closePoliceActionResultModal() {
    const root = document.getElementById("police-action-result-modal");
    if (root) {
      root.classList.add("hidden");
      root.style.zIndex = "";
    }
    if (suppressResultModalQueueAdvance) return;
    if (!pendingResultModalQueue.length) return;
    setTimeout(() => {
      renderNextPendingResultModal();
    }, 80);
  }

  function openPoliceActionResultModal(payload = {}) {
    const root = document.getElementById("police-action-result-modal");
    const content = document.getElementById("police-action-result-modal-content");
    const title = document.getElementById("police-action-result-modal-title");
    const badge = document.getElementById("police-action-result-modal-badge");
    const summary = document.getElementById("police-action-result-modal-summary");
    const details = document.getElementById("police-action-result-modal-details");
    if (!root || !content || !title || !badge || !summary || !details) return;
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "police", payload });
      return;
    }

    const tone = String(payload.tone || "").trim();
    content.classList.remove(
      "is-tier-1", "is-tier-2", "is-tier-3", "is-tier-4", "is-tier-5", "is-tier-6",
      "is-specialty-financial", "is-specialty-drug", "is-specialty-weapons", "is-specialty-arrests", "is-specialty-total"
    );
    if (tone) content.classList.add(tone);

    title.textContent = String(payload.title || "Policejní akce").trim() || "Policejní akce";
    badge.textContent = String(payload.badge || "").trim() || "Policejní zásah";
    const summaryText = String(payload.summary || "").trim();
    summary.textContent = summaryText;
    summary.hidden = !summaryText;
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    details.innerHTML = rows.map((row) => `
      <div class="modal__row">
        <span>${row.label}</span>
        <strong>${row.value}</strong>
      </div>
    `).join("");
    root.style.zIndex = "9999";
    root.classList.remove("hidden");
  }

  function openDistrictPoliceRaidWarningModal(district = null, policeAction = {}) {
    const districtName = String(district?.name || "").trim() || `District #${district?.id ?? "-"}`;
    const ownerNick = String(
      district?.ownerNick
      || district?.owner_username
      || district?.ownerUsername
      || district?.owner
      || "Neznámý"
    ).trim() || "Neznámý";
    const raidSpecialty = resolveStoredPoliceRaidSpecialty(policeAction)
      || resolvePoliceRaidSpecialtyFromOperationType(policeAction?.operationType, policeAction)
      || POLICE_RAID_SPECIALTIES.total;
    const raidSpecialtyKey = String(
      policeAction?.raidSpecialtyKey
      || Object.entries(POLICE_RAID_SPECIALTIES).find(([, meta]) => meta === raidSpecialty)?.[0]
      || "total"
    ).trim().toLowerCase();
    const raidTypeLabel = String(raidSpecialty?.label || "Celková razie").trim() || "Celková razie";
    const normalizedOwnerNick = normalizeOwnerName(ownerNick);
    const warningSummary = normalizedOwnerNick === normalizeOwnerName("Sněhulák")
      ? "Tady teď ne. Policie to tu právě rozjebává."
      : normalizedOwnerNick === normalizeOwnerName("Zabijak")
        ? "Zapomeň na to. District je plnej policajtů."
        : "Tady teď ne. Policie to tu právě rozjebává.";
    const resolvedWarningSummary = warningSummary;
    const specialtyTone = ({
      financial: "is-specialty-financial",
      drug: "is-specialty-drug",
      weapons: "is-specialty-weapons",
      arrests: "is-specialty-arrests",
      total: "is-specialty-total"
    })[raidSpecialtyKey] || "is-specialty-total";

    openPoliceActionResultModal({
      tone: specialtyTone,
      title: "Policejní razie v districtu",
      badge: raidTypeLabel,
      summary: resolvedWarningSummary,
      rows: [
        { label: "Hráč", value: ownerNick },
        { label: "Typ razie", value: raidTypeLabel }
      ]
    });
  }

  function initPoliceActionResultModal() {
    const root = document.getElementById("police-action-result-modal");
    const backdrop = document.getElementById("police-action-result-modal-backdrop");
    const closeBtn = document.getElementById("police-action-result-modal-close");
    const okBtn = document.getElementById("police-action-result-modal-ok");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closePoliceActionResultModal);
    if (closeBtn) closeBtn.addEventListener("click", closePoliceActionResultModal);
    if (okBtn) okBtn.addEventListener("click", closePoliceActionResultModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closePoliceActionResultModal();
      }
    });

      document.addEventListener("empire:police-action-started", (event) => {
        const detail = event?.detail && typeof event.detail === "object" ? event.detail : {};
        const source = String(detail.source || "").trim().toLowerCase();
        if (source.startsWith("scenario-")) return;

      const wantedHeat = resolveWantedLevel(cachedProfile || window.Empire.player || {});
      const wantedTier = resolveWantedStars(wantedHeat);
      const tierEntry = POLICE_ACTION_TIER_MESSAGES[wantedTier] || POLICE_ACTION_TIER_MESSAGES[1];
      const policeQuote = resolvePoliceActionTierQuote(wantedTier);
      const districtId = Number(detail.districtId);
      const district = Number.isFinite(districtId)
        ? (Array.isArray(window.Empire.districts) ? window.Empire.districts.find((item) => Number(item?.id) === districtId) : null)
        : null;
      const districtName = String(district?.name || "").trim() || `District #${detail.districtId ?? "-"}`;
      if (district && isDistrictOwnedByPlayer(district)) {
        if (wantedTier === 1) {
          applyPoliceRaidTier1Impacts(detail, district);
        } else if (wantedTier === 2) {
          applyPoliceRaidTier2Impacts(detail, district);
        } else if (wantedTier === 3) {
          applyPoliceRaidTier3Impacts(detail, district);
        } else if (wantedTier === 4) {
          applyPoliceRaidTier4Impacts(detail, district);
        } else if (wantedTier === 5) {
          applyPoliceRaidTier5Impacts(detail, district);
        } else if (wantedTier === 6) {
          applyPoliceRaidTier6Impacts(detail, district);
        }
      }
      const specialty =
        resolveStoredPoliceRaidSpecialty(detail)
        || resolvePoliceRaidSpecialtyFromOperationType(detail.operationType, detail)
        || resolvePoliceRaidSpecialty(wantedTier, detail);
      const specialtyQuote = resolvePoliceActionSpecialtyQuote(specialty.key);

      openPoliceActionResultModal({
        title: "Policejní akce",
        badge: `Stupeň ${wantedTier}/6 • ${specialty.label}`,
        tone: tierEntry.tone,
        summary: specialtyQuote || policeQuote || tierEntry.text,
        rows: [
          { label: "Hláška", value: tierEntry.title },
          { label: "Policejní hláška", value: specialtyQuote || policeQuote || tierEntry.text },
          { label: "District", value: districtName },
          { label: "Typ razie", value: `${specialty.icon} ${specialty.label}` }
        ]
      });
    });
  }

  function buildPoliceRaidImpactKey(detail = {}) {
    const districtId = String(detail?.districtId ?? "").trim();
    const startedAt = Math.max(0, Math.floor(Number(detail?.startedAt) || 0));
    const source = String(detail?.source || "police-action").trim() || "police-action";
    return `${districtId}:${startedAt}:${source}`;
  }

  function resolvePoliceActionTierQuote(tier) {
    const safeTier = Math.max(1, Math.floor(Number(tier) || 1));
    const quotes = Array.isArray(POLICE_ACTION_TIER_QUOTES[safeTier]) ? POLICE_ACTION_TIER_QUOTES[safeTier] : [];
    if (!quotes.length) return "";
    return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
  }

  function resolvePoliceActionSpecialtyQuote(specialtyKey) {
    const safeKey = String(specialtyKey || "").trim().toLowerCase();
    const quotes = Array.isArray(POLICE_ACTION_SPECIALTY_QUOTES[safeKey]) ? POLICE_ACTION_SPECIALTY_QUOTES[safeKey] : [];
    if (!quotes.length) return "";
    return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
  }

  function getPoliceRaidImpactMap() {
    if (!window.Empire._localPoliceRaidImpacts || !(window.Empire._localPoliceRaidImpacts instanceof Map)) {
      window.Empire._localPoliceRaidImpacts = new Map();
    }
    return window.Empire._localPoliceRaidImpacts;
  }

  function applyPoliceRaidTier1Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 1);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const cleanPct = scalePoliceRaidLossPct(POLICE_RAID_TIER1.cleanConfiscationPct, raidSpecialty.key, "clean");
    const dirtyPctRoll = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER1.dirtyConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER1.dirtyConfiscationPctMax - POLICE_RAID_TIER1.dirtyConfiscationPctMin + 1)
    ), raidSpecialty.key, "dirty");
    const influenceLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER1.influencePenaltyPct, raidSpecialty.key, "influence");
    const arrestsPct = scalePoliceRaidLossPct(POLICE_RAID_TIER1.arrestsPct, raidSpecialty.key, "arrests");
    const incomePenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER1.incomePenaltyPct, raidSpecialty.key, "income");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyPctRoll / 100));

    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;

    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);
    economy.influence = nextInfluence;
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 1,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct: cleanPct,
      dirtyLoss,
      dirtyLossPct: dirtyPctRoll,
      arrested,
      arrestsPct,
      influenceLoss,
      influenceLossPct,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 1: income -${incomePenaltyPct}%, `
      + `zabaveno $${cleanLoss} clean a $${dirtyLoss} dirty, zatčeno ${arrested} lidí, vliv -${influenceLoss}.`
    );
    return impactRecord;
  }

  function setPoliceRaidProductionPenalty(buildingKey, pct, untilTimestamp) {
    const key = String(buildingKey || "").trim().toLowerCase();
    if (!key) return null;
    const safePct = Math.max(0, Math.floor(Number(pct) || 0));
    const safeUntil = Math.max(0, Math.floor(Number(untilTimestamp) || 0));
    let store = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        store = parsed;
      }
    } catch {}
    const nowMs = Date.now();
    Object.keys(store).forEach((entryKey) => {
      const entry = store[entryKey];
      const until = Math.max(0, Math.floor(Number(entry?.until || 0)));
      if (until <= nowMs) delete store[entryKey];
    });
    const currentUntil = Math.max(0, Math.floor(Number(store[key]?.until || 0)));
    if (safeUntil > currentUntil) {
      store[key] = { pct: safePct, until: safeUntil };
      localStorage.setItem(POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY, JSON.stringify(store));
    }
    return store[key] || null;
  }

  function setPoliceRaidIncomePenaltyForDistrict(districtId, pct, untilTimestamp) {
    const key = String(districtId || "").trim();
    if (!key) return null;
    const safePct = Math.max(0, Math.floor(Number(pct) || 0));
    const safeUntil = Math.max(0, Math.floor(Number(untilTimestamp) || 0));
    let store = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_INCOME_PENALTY_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        store = parsed;
      }
    } catch {}
    const nowMs = Date.now();
    Object.keys(store).forEach((entryKey) => {
      const entry = store[entryKey];
      const until = Math.max(0, Math.floor(Number(entry?.until || 0)));
      if (until <= nowMs) delete store[entryKey];
    });
    const currentUntil = Math.max(0, Math.floor(Number(store[key]?.until || 0)));
    if (safeUntil > currentUntil) {
      store[key] = { pct: safePct, until: safeUntil };
      localStorage.setItem(POLICE_RAID_INCOME_PENALTY_STORAGE_KEY, JSON.stringify(store));
    }
    return store[key] || null;
  }

  function setPoliceRaidIncomePenaltyForOwnedDistricts(pct, untilTimestamp) {
    const safePct = Math.max(0, Math.floor(Number(pct) || 0));
    const safeUntil = Math.max(0, Math.floor(Number(untilTimestamp) || 0));
    const ownedDistricts = getOwnedPlayerDistricts();
    if (!ownedDistricts.length || safePct <= 0 || safeUntil <= 0) return 0;
    let applied = 0;
    ownedDistricts.forEach((district) => {
      if (!district?.id) return;
      const entry = setPoliceRaidIncomePenaltyForDistrict(district.id, safePct, safeUntil);
      if (entry) applied += 1;
    });
    return applied;
  }

  function setPoliceRaidCombatPenalty(attackPenaltyPct, defensePenaltyPct, untilTimestamp) {
    const safeUntil = Math.max(0, Math.floor(Number(untilTimestamp) || 0));
    if (safeUntil <= 0) return null;
    const nextAttackPct = Math.max(0, Math.floor(Number(attackPenaltyPct) || 0));
    const nextDefensePct = Math.max(0, Math.floor(Number(defensePenaltyPct) || 0));
    let current = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_COMBAT_PENALTY_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) current = parsed;
    } catch {}
    const currentUntil = Math.max(0, Math.floor(Number(current?.until || 0)));
    if (safeUntil > currentUntil) {
      current = {
        attackPct: nextAttackPct,
        defensePct: nextDefensePct,
        until: safeUntil
      };
      localStorage.setItem(POLICE_RAID_COMBAT_PENALTY_STORAGE_KEY, JSON.stringify(current));
    }
    return current;
  }

  function getPoliceRaidCombatPenalty(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_COMBAT_PENALTY_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { attackPct: 0, defensePct: 0, until: 0 };
      const until = Math.max(0, Math.floor(Number(parsed.until || 0)));
      if (until <= nowMs) {
        localStorage.removeItem(POLICE_RAID_COMBAT_PENALTY_STORAGE_KEY);
        return { attackPct: 0, defensePct: 0, until: 0 };
      }
      return {
        attackPct: Math.max(0, Math.floor(Number(parsed.attackPct || 0))),
        defensePct: Math.max(0, Math.floor(Number(parsed.defensePct || 0))),
        until
      };
    } catch {
      return { attackPct: 0, defensePct: 0, until: 0 };
    }
  }

  function setPoliceRaidBuildingActionLock(lockKey, untilTimestamp) {
    const key = String(lockKey || "").trim().toLowerCase();
    if (!key) return null;
    const safeUntil = Math.max(0, Math.floor(Number(untilTimestamp) || 0));
    if (safeUntil <= 0) return null;
    let store = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) store = parsed;
    } catch {}
    const currentUntil = Math.max(0, Math.floor(Number(store[key] || 0)));
    if (safeUntil > currentUntil) {
      store[key] = safeUntil;
      localStorage.setItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY, JSON.stringify(store));
    }
    return store;
  }

  function applyPoliceRaidMaterialConfiscation(economyRef, lossPct) {
    const safeLossPct = Math.max(0, Math.floor(Number(lossPct) || 0));
    if (safeLossPct <= 0) {
      return { totalLoss: 0, lossPct: 0, byResource: {} };
    }

    const economy = economyRef && typeof economyRef === "object" ? economyRef : ensureEconomyCache();
    const byResource = {};
    let totalLoss = 0;

    const keyMap = {
      metalParts: "metal_parts",
      techCore: "tech_core",
      combatModule: "combat_module"
    };
    Object.keys(keyMap).forEach((economyKey) => {
      const current = Math.max(0, Math.floor(Number(economy[economyKey] || 0)));
      const loss = Math.max(0, Math.floor(current * safeLossPct / 100));
      if (loss <= 0) {
        byResource[economyKey] = 0;
        return;
      }
      economy[economyKey] = Math.max(0, current - loss);
      byResource[economyKey] = loss;
      totalLoss += loss;
    });
    economy.materials = Math.max(
      0,
      Math.floor(Number(economy.metalParts || 0) + Number(economy.techCore || 0) + Number(economy.combatModule || 0))
    );

    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_FACTORY_SUPPLIES_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        ["metalParts", "techCore", "combatModule"].forEach((resourceKey) => {
          const current = Math.max(0, Math.floor(Number(parsed[resourceKey] || 0)));
          const loss = Math.max(0, Math.floor(current * safeLossPct / 100));
          parsed[resourceKey] = Math.max(0, current - loss);
        });
        localStorage.setItem(POLICE_RAID_FACTORY_SUPPLIES_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}

    return { totalLoss, lossPct: safeLossPct, byResource };
  }

  function isPoliceRaidAllActionsBlocked(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
      const lockUntil = Math.max(0, Math.floor(Number(parsed.all_actions_blocked || 0)));
      if (lockUntil <= nowMs) return false;
      return true;
    } catch {
      return false;
    }
  }

  function applyPoliceRaidTier2Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 2);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const cleanLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER2.cleanConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER2.cleanConfiscationPctMax - POLICE_RAID_TIER2.cleanConfiscationPctMin + 1)
    ), raidSpecialty.key, "clean");
    const dirtyLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER2.dirtyConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER2.dirtyConfiscationPctMax - POLICE_RAID_TIER2.dirtyConfiscationPctMin + 1)
    ), raidSpecialty.key, "dirty");
    const drugLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER2.drugLossPct, raidSpecialty.key, "drugs");
    const attackWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER2.attackWeaponLossPct, raidSpecialty.key, "attackWeapons");
    const incomePenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER2.incomePenaltyPct, raidSpecialty.key, "income");
    const productionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER2.productionPenaltyPct, raidSpecialty.key, "labProduction");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanLossPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyLossPct / 100));
    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);

    const drugInventory = economy.drugInventory && typeof economy.drugInventory === "object"
      ? { ...economy.drugInventory }
      : {};
    let totalDrugLoss = 0;
    storageDrugTypes.forEach((drug) => {
      const current = Math.max(0, Math.floor(Number(drugInventory[drug.key] || 0)));
      const loss = Math.max(0, Math.floor(current * drugLossPct / 100));
      if (loss > 0) {
        drugInventory[drug.key] = Math.max(0, current - loss);
        totalDrugLoss += loss;
      } else {
        drugInventory[drug.key] = current;
      }
    });
    const totalDrugs = storageDrugTypes.reduce((sum, drug) => sum + Number(drugInventory[drug.key] || 0), 0);

    const currentWeapons = resolveWeaponCounts();
    const nextWeapons = { ...currentWeapons };
    let attackWeaponLoss = 0;
    attackWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * attackWeaponLossPct / 100));
      if (loss > 0) {
        nextWeapons[item.name] = Math.max(0, current - loss);
        attackWeaponLoss += loss;
      } else {
        nextWeapons[item.name] = current;
      }
    });
    if (attackWeaponLoss > 0) {
      persistWeaponCounts(nextWeapons);
    }

    const influenceLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER2.influencePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER2.influencePenaltyPctMax - POLICE_RAID_TIER2.influencePenaltyPctMin + 1)
    ), raidSpecialty.key, "influence");
    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    economy.drugInventory = drugInventory;
    economy.drugs = totalDrugs;
    economy.influence = nextInfluence;
    economy.weapons = getAttackWeaponTotal(nextWeapons);
    economy.weaponsDetail = { ...nextWeapons };
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const arrestsPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER2.arrestsPctMin
      + Math.random() * (POLICE_RAID_TIER2.arrestsPctMax - POLICE_RAID_TIER2.arrestsPctMin + 1)
    ), raidSpecialty.key, "arrests");
    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("lab", productionPenaltyPct, expiresAt);

    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 2,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct,
      dirtyLoss,
      dirtyLossPct,
      drugLoss: totalDrugLoss,
      drugLossPct,
      arrested,
      arrestsPct,
      attackWeaponLoss,
      attackWeaponLossPct,
      influenceLoss,
      influenceLossPct,
      productionPenaltyPct,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true,
      raidBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 2: income -${incomePenaltyPct}%, `
      + `clean -${cleanLossPct}% ($${cleanLoss}), dirty -${dirtyLossPct}% ($${dirtyLoss}), `
      + `drogy -${drugLossPct}% (${totalDrugLoss}), zatčeno ${arrested} (${arrestsPct}%), `
      + `út. zbraně -${attackWeaponLossPct}% (${attackWeaponLoss}), vliv -${influenceLossPct}% (${influenceLoss}).`
    );
    return impactRecord;
  }

  function applyPoliceRaidTier3Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 3);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const cleanLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.cleanConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER3.cleanConfiscationPctMax - POLICE_RAID_TIER3.cleanConfiscationPctMin + 1)
    ), raidSpecialty.key, "clean");
    const dirtyLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.dirtyConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER3.dirtyConfiscationPctMax - POLICE_RAID_TIER3.dirtyConfiscationPctMin + 1)
    ), raidSpecialty.key, "dirty");
    const incomePenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.incomePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER3.incomePenaltyPctMax - POLICE_RAID_TIER3.incomePenaltyPctMin + 1)
    ), raidSpecialty.key, "income");
    const drugLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.drugLossPctMin
      + Math.random() * (POLICE_RAID_TIER3.drugLossPctMax - POLICE_RAID_TIER3.drugLossPctMin + 1)
    ), raidSpecialty.key, "drugs");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanLossPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyLossPct / 100));
    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);

    const drugInventory = economy.drugInventory && typeof economy.drugInventory === "object"
      ? { ...economy.drugInventory }
      : {};
    let totalDrugLoss = 0;
    storageDrugTypes.forEach((drug) => {
      const current = Math.max(0, Math.floor(Number(drugInventory[drug.key] || 0)));
      const loss = Math.max(0, Math.floor(current * drugLossPct / 100));
      if (loss > 0) {
        drugInventory[drug.key] = Math.max(0, current - loss);
        totalDrugLoss += loss;
      } else {
        drugInventory[drug.key] = current;
      }
    });
    const totalDrugs = storageDrugTypes.reduce((sum, drug) => sum + Number(drugInventory[drug.key] || 0), 0);

    const attackLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.attackWeaponLossPctMin
      + Math.random() * (POLICE_RAID_TIER3.attackWeaponLossPctMax - POLICE_RAID_TIER3.attackWeaponLossPctMin + 1)
    ), raidSpecialty.key, "attackWeapons");
    const defenseLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.defenseWeaponLossPctMin
      + Math.random() * (POLICE_RAID_TIER3.defenseWeaponLossPctMax - POLICE_RAID_TIER3.defenseWeaponLossPctMin + 1)
    ), raidSpecialty.key, "defenseWeapons");
    const currentAttackWeapons = resolveWeaponCounts();
    const nextAttackWeapons = { ...currentAttackWeapons };
    let attackWeaponLoss = 0;
    attackWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextAttackWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * attackLossPct / 100));
      if (loss > 0) {
        nextAttackWeapons[item.name] = Math.max(0, current - loss);
        attackWeaponLoss += loss;
      } else {
        nextAttackWeapons[item.name] = current;
      }
    });
    if (attackWeaponLoss > 0) {
      persistWeaponCounts(nextAttackWeapons);
    }

    const currentDefenseWeapons = resolveDefenseCounts();
    const nextDefenseWeapons = { ...currentDefenseWeapons };
    let defenseWeaponLoss = 0;
    defenseWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextDefenseWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * defenseLossPct / 100));
      if (loss > 0) {
        nextDefenseWeapons[item.name] = Math.max(0, current - loss);
        defenseWeaponLoss += loss;
      } else {
        nextDefenseWeapons[item.name] = current;
      }
    });
    if (defenseWeaponLoss > 0) {
      persistDefenseCounts(nextDefenseWeapons);
    }

    const influenceLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.influencePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER3.influencePenaltyPctMax - POLICE_RAID_TIER3.influencePenaltyPctMin + 1)
    ), raidSpecialty.key, "influence");
    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    economy.drugInventory = drugInventory;
    economy.drugs = totalDrugs;
    economy.influence = nextInfluence;
    economy.weapons = getAttackWeaponTotal(nextAttackWeapons);
    economy.weaponsDetail = { ...nextAttackWeapons };
    economy.defense = getDefenseWeaponTotal(nextDefenseWeapons);
    economy.defenseDetail = { ...nextDefenseWeapons };
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const arrestsPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.arrestsPctMin
      + Math.random() * (POLICE_RAID_TIER3.arrestsPctMax - POLICE_RAID_TIER3.arrestsPctMin + 1)
    ), raidSpecialty.key, "arrests");
    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const labProductionPenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.labProductionPenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER3.labProductionPenaltyPctMax - POLICE_RAID_TIER3.labProductionPenaltyPctMin + 1)
    ), raidSpecialty.key, "labProduction");
    const armoryProductionPenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER3.armoryProductionPenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER3.armoryProductionPenaltyPctMax - POLICE_RAID_TIER3.armoryProductionPenaltyPctMin + 1)
    ), raidSpecialty.key, "armoryProduction");

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("lab", labProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("armory", armoryProductionPenaltyPct, expiresAt);

    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 3,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct,
      dirtyLoss,
      dirtyLossPct,
      drugLoss: totalDrugLoss,
      drugLossPct,
      arrested,
      arrestsPct,
      attackWeaponLoss,
      attackWeaponLossPct: attackLossPct,
      defenseWeaponLoss,
      defenseWeaponLossPct: defenseLossPct,
      influenceLoss,
      influenceLossPct,
      labProductionPenaltyPct,
      armoryProductionPenaltyPct,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true,
      raidBlocked: true,
      attackBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 3: income -${incomePenaltyPct}%, `
      + `clean -${cleanLossPct}% ($${cleanLoss}), dirty -${dirtyLossPct}% ($${dirtyLoss}), `
      + `drogy -${drugLossPct}% (${totalDrugLoss}), zatčeno ${arrested} (${arrestsPct}%), `
      + `út. zbraně -${attackLossPct}% (${attackWeaponLoss}), obr. zbraně -${defenseLossPct}% (${defenseWeaponLoss}), `
      + `vliv -${influenceLossPct}% (${influenceLoss}), lab/drug -${labProductionPenaltyPct}%, zbrojovka -${armoryProductionPenaltyPct}%.`
    );
    return impactRecord;
  }

  function applyPoliceRaidTier4Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 4);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const cleanLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.cleanConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER4.cleanConfiscationPctMax - POLICE_RAID_TIER4.cleanConfiscationPctMin + 1)
    ), raidSpecialty.key, "clean");
    const dirtyLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.dirtyConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER4.dirtyConfiscationPctMax - POLICE_RAID_TIER4.dirtyConfiscationPctMin + 1)
    ), raidSpecialty.key, "dirty");
    const incomePenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.incomePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER4.incomePenaltyPctMax - POLICE_RAID_TIER4.incomePenaltyPctMin + 1)
    ), raidSpecialty.key, "income");
    const drugLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.drugLossPctMin
      + Math.random() * (POLICE_RAID_TIER4.drugLossPctMax - POLICE_RAID_TIER4.drugLossPctMin + 1)
    ), raidSpecialty.key, "drugs");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanLossPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyLossPct / 100));
    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);

    const drugInventory = economy.drugInventory && typeof economy.drugInventory === "object"
      ? { ...economy.drugInventory }
      : {};
    let totalDrugLoss = 0;
    storageDrugTypes.forEach((drug) => {
      const current = Math.max(0, Math.floor(Number(drugInventory[drug.key] || 0)));
      const loss = Math.max(0, Math.floor(current * drugLossPct / 100));
      if (loss > 0) {
        drugInventory[drug.key] = Math.max(0, current - loss);
        totalDrugLoss += loss;
      } else {
        drugInventory[drug.key] = current;
      }
    });
    const totalDrugs = storageDrugTypes.reduce((sum, drug) => sum + Number(drugInventory[drug.key] || 0), 0);

    const currentAttackWeapons = resolveWeaponCounts();
    const nextAttackWeapons = { ...currentAttackWeapons };
    let attackWeaponLoss = 0;
    attackWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextAttackWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * scalePoliceRaidLossPct(POLICE_RAID_TIER4.attackWeaponLossPct, raidSpecialty.key, "attackWeapons") / 100));
      if (loss > 0) {
        nextAttackWeapons[item.name] = Math.max(0, current - loss);
        attackWeaponLoss += loss;
      } else {
        nextAttackWeapons[item.name] = current;
      }
    });
    if (attackWeaponLoss > 0) {
      persistWeaponCounts(nextAttackWeapons);
    }

    const currentDefenseWeapons = resolveDefenseCounts();
    const nextDefenseWeapons = { ...currentDefenseWeapons };
    let defenseWeaponLoss = 0;
    defenseWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextDefenseWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * scalePoliceRaidLossPct(POLICE_RAID_TIER4.defenseWeaponLossPct, raidSpecialty.key, "defenseWeapons") / 100));
      if (loss > 0) {
        nextDefenseWeapons[item.name] = Math.max(0, current - loss);
        defenseWeaponLoss += loss;
      } else {
        nextDefenseWeapons[item.name] = current;
      }
    });
    if (defenseWeaponLoss > 0) {
      persistDefenseCounts(nextDefenseWeapons);
    }

    const attackWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER4.attackWeaponLossPct, raidSpecialty.key, "attackWeapons");
    const defenseWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER4.defenseWeaponLossPct, raidSpecialty.key, "defenseWeapons");
    const attackPowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER4.attackPowerPenaltyPct, raidSpecialty.key, "attackPower");
    const defensePowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER4.defensePowerPenaltyPct, raidSpecialty.key, "defensePower");
    const influenceLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.influencePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER4.influencePenaltyPctMax - POLICE_RAID_TIER4.influencePenaltyPctMin + 1)
    ), raidSpecialty.key, "influence");
    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    economy.drugInventory = drugInventory;
    economy.drugs = totalDrugs;
    economy.influence = nextInfluence;
    economy.weapons = getAttackWeaponTotal(nextAttackWeapons);
    economy.weaponsDetail = { ...nextAttackWeapons };
    economy.defense = getDefenseWeaponTotal(nextDefenseWeapons);
    economy.defenseDetail = { ...nextDefenseWeapons };
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const arrestsPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.arrestsPctMin
      + Math.random() * (POLICE_RAID_TIER4.arrestsPctMax - POLICE_RAID_TIER4.arrestsPctMin + 1)
    ), raidSpecialty.key, "arrests");
    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const labProductionPenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.labProductionPenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER4.labProductionPenaltyPctMax - POLICE_RAID_TIER4.labProductionPenaltyPctMin + 1)
    ), raidSpecialty.key, "labProduction");
    const armoryProductionPenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER4.armoryProductionPenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER4.armoryProductionPenaltyPctMax - POLICE_RAID_TIER4.armoryProductionPenaltyPctMin + 1)
    ), raidSpecialty.key, "armoryProduction");

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("lab", labProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("armory", armoryProductionPenaltyPct, expiresAt);
    setPoliceRaidCombatPenalty(
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      expiresAt
    );
    setPoliceRaidBuildingActionLock("pharmacy_factory_special", expiresAt);

    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 4,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct,
      dirtyLoss,
      dirtyLossPct,
      drugLoss: totalDrugLoss,
      drugLossPct,
      arrested,
      arrestsPct,
      attackWeaponLoss,
      attackWeaponLossPct,
      defenseWeaponLoss,
      defenseWeaponLossPct,
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      influenceLoss,
      influenceLossPct,
      labProductionPenaltyPct,
      armoryProductionPenaltyPct,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true,
      raidBlocked: true,
      attackBlocked: true,
      occupyBlocked: true,
      pharmacyFactorySpecialBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 4: income -${incomePenaltyPct}%, `
      + `clean -${cleanLossPct}% ($${cleanLoss}), dirty -${dirtyLossPct}% ($${dirtyLoss}), `
      + `drogy -${drugLossPct}% (${totalDrugLoss}), zatčeno ${arrested} (${arrestsPct}%), `
      + `út. zbraně -${attackWeaponLossPct}% (${attackWeaponLoss}), `
      + `obr. zbraně -${defenseWeaponLossPct}% (${defenseWeaponLoss}), `
      + `síla útok -${attackPowerPenaltyPct}%, síla obrana -${defensePowerPenaltyPct}%, `
      + `vliv -${influenceLossPct}% (${influenceLoss}), lab/drug -${labProductionPenaltyPct}%, zbrojovka -${armoryProductionPenaltyPct}%.`
    );
    return impactRecord;
  }

  function applyPoliceRaidTier5Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 5);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const cleanLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.cleanConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER5.cleanConfiscationPctMax - POLICE_RAID_TIER5.cleanConfiscationPctMin + 1)
    ), raidSpecialty.key, "clean");
    const dirtyLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.dirtyConfiscationPctMin
      + Math.random() * (POLICE_RAID_TIER5.dirtyConfiscationPctMax - POLICE_RAID_TIER5.dirtyConfiscationPctMin + 1)
    ), raidSpecialty.key, "dirty");
    const incomePenaltyPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.incomePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER5.incomePenaltyPctMax - POLICE_RAID_TIER5.incomePenaltyPctMin + 1)
    ), raidSpecialty.key, "income");
    const drugLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.drugLossPctMin
      + Math.random() * (POLICE_RAID_TIER5.drugLossPctMax - POLICE_RAID_TIER5.drugLossPctMin + 1)
    ), raidSpecialty.key, "drugs");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanLossPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyLossPct / 100));
    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);

    const materialLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.materialLossPct, raidSpecialty.key, "materials");
    const materialLossResult = applyPoliceRaidMaterialConfiscation(economy, materialLossPct);

    const drugInventory = economy.drugInventory && typeof economy.drugInventory === "object"
      ? { ...economy.drugInventory }
      : {};
    let totalDrugLoss = 0;
    storageDrugTypes.forEach((drug) => {
      const current = Math.max(0, Math.floor(Number(drugInventory[drug.key] || 0)));
      const loss = Math.max(0, Math.floor(current * drugLossPct / 100));
      if (loss > 0) {
        drugInventory[drug.key] = Math.max(0, current - loss);
        totalDrugLoss += loss;
      } else {
        drugInventory[drug.key] = current;
      }
    });
    const totalDrugs = storageDrugTypes.reduce((sum, drug) => sum + Number(drugInventory[drug.key] || 0), 0);

    const currentAttackWeapons = resolveWeaponCounts();
    const nextAttackWeapons = { ...currentAttackWeapons };
    let attackWeaponLoss = 0;
    attackWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextAttackWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * scalePoliceRaidLossPct(POLICE_RAID_TIER5.attackWeaponLossPct, raidSpecialty.key, "attackWeapons") / 100));
      if (loss > 0) {
        nextAttackWeapons[item.name] = Math.max(0, current - loss);
        attackWeaponLoss += loss;
      } else {
        nextAttackWeapons[item.name] = current;
      }
    });
    if (attackWeaponLoss > 0) persistWeaponCounts(nextAttackWeapons);

    const currentDefenseWeapons = resolveDefenseCounts();
    const nextDefenseWeapons = { ...currentDefenseWeapons };
    let defenseWeaponLoss = 0;
    defenseWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextDefenseWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * scalePoliceRaidLossPct(POLICE_RAID_TIER5.defenseWeaponLossPct, raidSpecialty.key, "defenseWeapons") / 100));
      if (loss > 0) {
        nextDefenseWeapons[item.name] = Math.max(0, current - loss);
        defenseWeaponLoss += loss;
      } else {
        nextDefenseWeapons[item.name] = current;
      }
    });
    if (defenseWeaponLoss > 0) persistDefenseCounts(nextDefenseWeapons);

    const attackWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.attackWeaponLossPct, raidSpecialty.key, "attackWeapons");
    const defenseWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.defenseWeaponLossPct, raidSpecialty.key, "defenseWeapons");
    const attackPowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.attackPowerPenaltyPct, raidSpecialty.key, "attackPower");
    const defensePowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.defensePowerPenaltyPct, raidSpecialty.key, "defensePower");
    const influenceLossPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.influencePenaltyPctMin
      + Math.random() * (POLICE_RAID_TIER5.influencePenaltyPctMax - POLICE_RAID_TIER5.influencePenaltyPctMin + 1)
    ), raidSpecialty.key, "influence");
    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    economy.drugInventory = drugInventory;
    economy.drugs = totalDrugs;
    economy.influence = nextInfluence;
    economy.weapons = getAttackWeaponTotal(nextAttackWeapons);
    economy.weaponsDetail = { ...nextAttackWeapons };
    economy.defense = getDefenseWeaponTotal(nextDefenseWeapons);
    economy.defenseDetail = { ...nextDefenseWeapons };
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const arrestsPct = scalePoliceRaidLossPct(Math.floor(
      POLICE_RAID_TIER5.arrestsPctMin
      + Math.random() * (POLICE_RAID_TIER5.arrestsPctMax - POLICE_RAID_TIER5.arrestsPctMin + 1)
    ), raidSpecialty.key, "arrests");
    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    const labProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.productionFreezePct, raidSpecialty.key, "labProduction");
    const armoryProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.productionFreezePct, raidSpecialty.key, "armoryProduction");
    const factoryProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER5.productionFreezePct, raidSpecialty.key, "factoryProduction");
    setPoliceRaidProductionPenalty("lab", labProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("armory", armoryProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("factory", factoryProductionPenaltyPct, expiresAt);
    setPoliceRaidCombatPenalty(
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      expiresAt
    );
    setPoliceRaidBuildingActionLock("pharmacy_factory_special", expiresAt);
    setPoliceRaidBuildingActionLock("all_special_buildings", expiresAt);

    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 5,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct,
      dirtyLoss,
      dirtyLossPct,
      materialLoss: materialLossResult.totalLoss,
      materialLossPct: materialLossPct,
      drugLoss: totalDrugLoss,
      drugLossPct,
      arrested,
      arrestsPct,
      attackWeaponLoss,
      attackWeaponLossPct,
      defenseWeaponLoss,
      defenseWeaponLossPct,
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      influenceLoss,
      influenceLossPct,
      labProductionPenaltyPct,
      armoryProductionPenaltyPct,
      factoryProductionPenaltyPct,
      productionFrozen: labProductionPenaltyPct >= 100 && armoryProductionPenaltyPct >= 100 && factoryProductionPenaltyPct >= 100,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true,
      raidBlocked: true,
      attackBlocked: true,
      occupyBlocked: true,
      pharmacyFactorySpecialBlocked: true,
      allSpecialBuildingsBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 5: income -${incomePenaltyPct}%, `
      + `clean -${cleanLossPct}% ($${cleanLoss}), dirty -${dirtyLossPct}% ($${dirtyLoss}), `
      + `materiály -${materialLossPct}% (${materialLossResult.totalLoss}), `
      + `drogy -${drugLossPct}% (${totalDrugLoss}), zatčeno ${arrested} (${arrestsPct}%), `
      + `út. zbraně -${attackWeaponLossPct}% (${attackWeaponLoss}), `
      + `obr. zbraně -${defenseWeaponLossPct}% (${defenseWeaponLoss}), `
      + `síla útok -${attackPowerPenaltyPct}%, síla obrana -${defensePowerPenaltyPct}%, `
      + `vliv -${influenceLossPct}% (${influenceLoss}), lab -${labProductionPenaltyPct}%, zbrojovka -${armoryProductionPenaltyPct}%, továrna -${factoryProductionPenaltyPct}%.`
    );
    return impactRecord;
  }

  function applyPoliceRaidTier6Impacts(detail, district) {
    const impactKey = buildPoliceRaidImpactKey(detail);
    if (!impactKey || appliedPoliceRaidImpactKeys.has(impactKey)) return null;
    appliedPoliceRaidImpactKeys.add(impactKey);

    const currentProfile = cachedProfile || window.Empire.player || {};
    const raidSpecialty = resolvePoliceRaidImpactSpecialty(detail, 6);
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy || {});
    const incomePenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.incomePenaltyPct, raidSpecialty.key, "income");
    const cleanLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.cleanConfiscationPct, raidSpecialty.key, "clean");
    const dirtyLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.dirtyConfiscationPct, raidSpecialty.key, "dirty");
    const drugLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.drugLossPct, raidSpecialty.key, "drugs");
    const materialLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.materialLossPct, raidSpecialty.key, "materials");
    const attackWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.attackWeaponLossPct, raidSpecialty.key, "attackWeapons");
    const defenseWeaponLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.defenseWeaponLossPct, raidSpecialty.key, "defenseWeapons");
    const attackPowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.attackPowerPenaltyPct, raidSpecialty.key, "attackPower");
    const defensePowerPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.defensePowerPenaltyPct, raidSpecialty.key, "defensePower");
    const influenceLossPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.influencePenaltyPct, raidSpecialty.key, "influence");
    const arrestsPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.arrestsPct, raidSpecialty.key, "arrests");
    const cleanLoss = Math.max(0, Math.floor(money.cleanMoney * cleanLossPct / 100));
    const dirtyLoss = Math.max(0, Math.floor(money.dirtyMoney * dirtyLossPct / 100));
    money.cleanMoney = Math.max(0, money.cleanMoney - cleanLoss);
    money.dirtyMoney = Math.max(0, money.dirtyMoney - dirtyLoss);

    const materialLossResult = applyPoliceRaidMaterialConfiscation(economy, materialLossPct);

    const drugInventory = economy.drugInventory && typeof economy.drugInventory === "object"
      ? { ...economy.drugInventory }
      : {};
    let totalDrugLoss = 0;
    storageDrugTypes.forEach((drug) => {
      const current = Math.max(0, Math.floor(Number(drugInventory[drug.key] || 0)));
      const loss = Math.max(0, Math.floor(current * drugLossPct / 100));
      if (loss > 0) {
        drugInventory[drug.key] = Math.max(0, current - loss);
        totalDrugLoss += loss;
      } else {
        drugInventory[drug.key] = current;
      }
    });
    const totalDrugs = storageDrugTypes.reduce((sum, drug) => sum + Number(drugInventory[drug.key] || 0), 0);

    const currentAttackWeapons = resolveWeaponCounts();
    const nextAttackWeapons = { ...currentAttackWeapons };
    let attackWeaponLoss = 0;
    attackWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextAttackWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * attackWeaponLossPct / 100));
      if (loss > 0) {
        nextAttackWeapons[item.name] = Math.max(0, current - loss);
        attackWeaponLoss += loss;
      } else {
        nextAttackWeapons[item.name] = current;
      }
    });
    if (attackWeaponLoss > 0) persistWeaponCounts(nextAttackWeapons);

    const currentDefenseWeapons = resolveDefenseCounts();
    const nextDefenseWeapons = { ...currentDefenseWeapons };
    let defenseWeaponLoss = 0;
    defenseWeaponStats.forEach((item) => {
      const current = Math.max(0, Math.floor(Number(nextDefenseWeapons[item.name] || 0)));
      const loss = Math.max(0, Math.floor(current * defenseWeaponLossPct / 100));
      if (loss > 0) {
        nextDefenseWeapons[item.name] = Math.max(0, current - loss);
        defenseWeaponLoss += loss;
      } else {
        nextDefenseWeapons[item.name] = current;
      }
    });
    if (defenseWeaponLoss > 0) persistDefenseCounts(nextDefenseWeapons);

    const currentInfluence = Math.max(0, Math.floor(Number(economy.influence || 0)));
    const influenceLoss = Math.max(0, Math.floor(currentInfluence * influenceLossPct / 100));
    const nextInfluence = Math.max(0, currentInfluence - influenceLoss);

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    economy.drugInventory = drugInventory;
    economy.drugs = totalDrugs;
    economy.influence = nextInfluence;
    economy.weapons = getAttackWeaponTotal(nextAttackWeapons);
    economy.weaponsDetail = { ...nextAttackWeapons };
    economy.defense = getDefenseWeaponTotal(nextDefenseWeapons);
    economy.defenseDetail = { ...nextDefenseWeapons };
    updateEconomy(economy);

    updateProfile({
      ...currentProfile,
      influence: nextInfluence
    });

    const population = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(currentProfile)) || 0));
    const arrested = Math.max(0, Math.floor(population * arrestsPct / 100));
    if (arrested > 0) consumeGangMembers(arrested);

    const expiresAt = Math.max(0, Math.floor(Number(detail?.startedAt || 0) + Number(detail?.durationMs || GANG_HEAT_POLICE_DURATION_MS)));
    const labProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.productionFreezePct, raidSpecialty.key, "labProduction");
    const armoryProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.productionFreezePct, raidSpecialty.key, "armoryProduction");
    const factoryProductionPenaltyPct = scalePoliceRaidLossPct(POLICE_RAID_TIER6.productionFreezePct, raidSpecialty.key, "factoryProduction");
    setPoliceRaidIncomePenaltyForOwnedDistricts(incomePenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("lab", labProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("armory", armoryProductionPenaltyPct, expiresAt);
    setPoliceRaidProductionPenalty("factory", factoryProductionPenaltyPct, expiresAt);
    setPoliceRaidBuildingActionLock("pharmacy_factory_special", expiresAt);
    setPoliceRaidBuildingActionLock("all_special_buildings", expiresAt);
    setPoliceRaidBuildingActionLock("all_actions_blocked", expiresAt);
    setPoliceRaidCombatPenalty(
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      expiresAt
    );

    const impactRecord = {
      key: impactKey,
      districtId: Number(district?.id),
      startedAt: Math.max(0, Math.floor(Number(detail?.startedAt) || Date.now())),
      expiresAt,
      tier: 6,
      incomePenaltyPct,
      cleanLoss,
      cleanLossPct,
      dirtyLoss,
      dirtyLossPct,
      materialLoss: materialLossResult.totalLoss,
      materialLossPct,
      drugLoss: totalDrugLoss,
      drugLossPct,
      arrested,
      arrestsPct,
      attackWeaponLoss,
      attackWeaponLossPct,
      defenseWeaponLoss,
      defenseWeaponLossPct,
      attackPowerPenaltyPct,
      defensePowerPenaltyPct,
      influenceLoss,
      influenceLossPct,
      labProductionPenaltyPct,
      armoryProductionPenaltyPct,
      factoryProductionPenaltyPct,
      productionFrozen: labProductionPenaltyPct >= 100 && armoryProductionPenaltyPct >= 100 && factoryProductionPenaltyPct >= 100,
      raidSpecialtyKey: raidSpecialty.key,
      raidSpecialtyLabel: raidSpecialty.label,
      spyBlocked: true,
      raidBlocked: true,
      attackBlocked: true,
      occupyBlocked: true,
      pharmacyFactorySpecialBlocked: true,
      allSpecialBuildingsBlocked: true,
      allActionsBlocked: true
    };
    getPoliceRaidImpactMap().set(impactKey, impactRecord);
    pushEvent(
      `Razia (${district?.name || `#${district?.id}`}) - Tier 6: income -${incomePenaltyPct}%, clean -${cleanLossPct}%, `
      + `dirty -${dirtyLossPct}%, materiály -${materialLossPct}%, `
      + `drogy -${drugLossPct}%, zatčeno ${arrested} (${arrestsPct}%), `
      + `út. zbraně -${attackWeaponLossPct}%, obr. zbraně -${defenseWeaponLossPct}%, `
      + `síla útok -${attackPowerPenaltyPct}%, síla obrana -${defensePowerPenaltyPct}%, `
      + `vliv -${influenceLossPct}%, lab -${labProductionPenaltyPct}%, zbrojovka -${armoryProductionPenaltyPct}%, továrna -${factoryProductionPenaltyPct}%.`
    );
    return impactRecord;
  }

  function isDistrictUnownedForSpyOutcome(district) {
    const owner = String(district?.owner || "").trim().toLowerCase();
    if (!owner) return true;
    return owner === "neobsazeno" || owner === "nikdo";
  }

  function districtHasSecurityCameras(district) {
    if (!district?.id || isDistrictUnownedForSpyOutcome(district)) return false;
    const store = readLocalDistrictDefenseAssignments();
    const districtStore = store[String(district.id)] && typeof store[String(district.id)] === "object"
      ? store[String(district.id)]
      : {};
    const ownerKey = normalizeOwnerName(district?.owner);
    const ownerEntry = ownerKey && districtStore[ownerKey] && typeof districtStore[ownerKey] === "object"
      ? districtStore[ownerKey]
      : null;
    const weaponCounts = ownerEntry?.weaponCounts && typeof ownerEntry.weaponCounts === "object"
      ? ownerEntry.weaponCounts
      : {};
    return Math.max(0, Math.floor(Number(weaponCounts["Bezpečnostní kamery"] || 0))) > 0;
  }

  function resolveRaidOutcomeChances(district) {
    const base = isDistrictUnownedForSpyOutcome(district)
      ? { clean_success: 78, dirty_fail: 18, disaster: 4 }
      : { clean_success: 70, dirty_fail: 20, disaster: 10 };
    if (!districtHasSecurityCameras(district)) return base;
    const remaining = 75;
    const nonDisasterBase = Math.max(1, base.clean_success + base.dirty_fail);
    const clean = (base.clean_success / nonDisasterBase) * remaining;
    const dirty = remaining - clean;
    return {
      clean_success: clean,
      dirty_fail: dirty,
      disaster: 25
    };
  }

  function resolveRaidOutcomeKey(district) {
    const chances = { ...resolveRaidOutcomeChances(district) };
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    if (defenseSpecial.raidAlarmBoostActive) {
      const cleanPenalty = Math.min(chances.clean_success - 5, 25);
      chances.clean_success = Math.max(5, chances.clean_success - cleanPenalty);
      chances.dirty_fail += 5;
      chances.disaster += cleanPenalty - 5;
    }
    const roll = Math.random() * 100;
    if (roll < chances.clean_success) return "clean_success";
    if (roll < chances.clean_success + chances.dirty_fail) return "dirty_fail";
    return "disaster";
  }

  function resolveEmptyDistrictRaidStash(district) {
    const buildingCount = Math.max(1, (Array.isArray(district?.buildings) ? district.buildings.length : 0) || 1);
    const tierWeight = resolveOccupationTierRarityWeight(district?.buildingTier);
    const seed = Math.abs(hashDistrictSeed(`raid-empty:${district?.id}:${district?.type || ""}`));
    const materialBase = 24 + buildingCount * 12 + Math.round(tierWeight * 60) + (seed % 16);
    return {
      metal_parts: Math.max(12, Math.floor(materialBase * 0.55)),
      tech_core: Math.max(6, Math.floor(materialBase * 0.28)),
      combat_module: Math.max(1, Math.floor(materialBase * 0.08))
    };
  }

  function applyRaidLootToPlayer(loot = {}) {
    const applied = {};
    Object.entries(loot || {}).forEach(([resourceKey, amount]) => {
      const gained = addEconomyResource(resourceKey, amount);
      if (gained > 0) applied[resourceKey] = gained;
    });
    return applied;
  }

  function formatRaidLootLabel(loot = {}) {
    const labels = {
      metal_parts: "MP",
      tech_core: "TC",
      combat_module: "CM",
      materials: "MAT",
      drugs: "DRG",
      weapons: "WPN"
    };
    const parts = Object.entries(loot)
      .map(([resourceKey, amount]) => {
        const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
        if (safeAmount <= 0) return "";
        return `${labels[resourceKey] || resourceKey} ${safeAmount}`;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" • ") : "Nic";
  }

  function applyRaidGangLoss(lossPct) {
    const totalMembers = Math.max(0, Math.floor(Number(countPlayerControlledPopulation(cachedProfile || window.Empire.player || {})) || 0));
    const loss = Math.max(0, Math.floor(totalMembers * Math.max(0, Number(lossPct) || 0) / 100));
    if (loss > 0) {
      consumeGangMembers(loss);
    }
    return loss;
  }

  function buildRaidResultPayload({ district, outcomeKey, loot, cooldownMs, gangLoss, targetAlerted }) {
    const districtLabel = district?.name || `Distrikt #${district?.id ?? "-"}`;
    if (outcomeKey === "clean_success") {
      return {
        tone: "is-clean-success",
        title: "ČISTÁ KRÁDEŽ",
        summary: "Vlezli jste tam, sebrali co šlo a zmizeli jak duchové. Ani kurva nevěděli, že tam někdo byl. Prachy jsou tvoje.",
        rows: [
          { label: "Cíl", value: districtLabel },
          { label: "Získáno", value: formatRaidLootLabel(loot) },
          { label: "Trvání", value: formatAttackDurationLabel(resolveRaidDurationWithBoosts()) },
          { label: "Cooldown", value: formatRaidCooldownLabel(cooldownMs) }
        ]
      };
    }
    if (outcomeKey === "dirty_fail") {
      return {
        tone: "is-dirty-fail",
        title: "ŠPINAVÁ KRÁDEŽ",
        summary: "Vzali jste lup ale nebylo to čistý. Trochu krve, trochu bordelu. Něco jsi nechal na místě, ale pořád jsi v plusu.",
        rows: [
          { label: "Cíl", value: districtLabel },
          { label: "Ztráta členů", value: `${gangLoss}` },
          { label: "Cooldown", value: formatRaidCooldownLabel(cooldownMs) },
          { label: "Zisk", value: "Nic" }
        ]
      };
    }
    return {
      tone: targetAlerted ? "is-alert" : "is-disaster",
      title: "PRŮSER",
      summary: "Posrali jste to. Chytili vás při činu, někdo to odnesl a zbytek zdrhal jak krysy. Nemáš nic, jen ostudu a ztráty.",
      rows: [
        { label: "Cíl", value: districtLabel },
        { label: "Ztráta členů", value: `${gangLoss}` },
        { label: "Cooldown", value: formatRaidCooldownLabel(cooldownMs) },
        { label: "Upozornění cíle", value: targetAlerted ? "Ano" : "Ne" }
      ]
    };
  }

  function maybeShowRaidTargetAlert(district) {
    const targetOwner = normalizeOwnerName(district?.owner);
    const playerOwners = getPlayerOwnerNameSet();
    if (!targetOwner || !playerOwners.has(targetOwner)) return false;
    openRaidResultModal({
      tone: "is-alert",
      title: "Pokus o krádež",
      summary: `Někdo se pokusil vykrást tvůj distrikt ${district?.name || `#${district?.id ?? "-"}`}.`,
      rows: [
        { label: "District", value: district?.name || `#${district?.id ?? "-"}` },
        { label: "Stav", value: "Pokus odhalen" }
      ]
    });
    return true;
  }

  function finalizeRaidActionResult({ districtId, durationMs }) {
    raidActionTimeoutId = null;
    raidActionState = { districtId: null, startedAt: 0, endsAt: 0 };
    window.Empire.Map?.clearRaidActions?.();

    const district = resolveDistrictById(districtId);
    if (!district) return;
    const outcomeKey = resolveRaidOutcomeKey(district);
    let cooldownMs = RAID_BASE_COOLDOWN_MS;
    let loot = {};
    let gangLoss = 0;
    let targetAlerted = false;

    if (outcomeKey === "clean_success") {
      if (isDistrictUnownedForSpyOutcome(district)) {
        updateDistrictRaidStash(district, (current) => {
          const next = { ...current };
          Object.entries(current).forEach(([resourceKey, amount]) => {
            const available = Math.max(0, Math.floor(Number(amount || 0)));
            const stolen = available > 0
              ? Math.min(available, Math.max(1, Math.floor(available * 0.25)))
              : 0;
            if (stolen > 0) {
              loot[resourceKey] = stolen;
              next[resourceKey] = Math.max(0, available - stolen);
            }
          });
          return next;
        });
      } else {
        const nextLoot = {};
        const stealPct = 2 + Math.floor(Math.random() * 5);
        updateOwnerRaidInventory(district.owner, (current) => {
          const next = { ...current };
          ["metal_parts", "tech_core", "combat_module", "drugs", "weapons"].forEach((resourceKey) => {
            const available = Math.max(0, Math.floor(Number(current[resourceKey] || 0)));
            const stolen = available > 0
              ? Math.min(available, Math.max(1, Math.floor(available * (stealPct / 100))))
              : 0;
            if (stolen > 0) {
              nextLoot[resourceKey] = stolen;
              next[resourceKey] = Math.max(0, available - stolen);
            }
          });
          return next;
        });
        loot = nextLoot;
      }
      applyRaidLootToPlayer(loot);
      pushEvent(`Krádež v districtu ${district.name || `#${district.id}`} dopadla čistě. Zisk: ${formatRaidLootLabel(loot)}.`);
    } else if (outcomeKey === "dirty_fail") {
      cooldownMs = Math.round(RAID_BASE_COOLDOWN_MS * 1.2);
      gangLoss = applyRaidGangLoss(2.5);
      pushEvent(`Špinavá krádež v districtu ${district.name || `#${district.id}`}. Přišel jsi o ${gangLoss} členů gangu.`);
    } else {
      cooldownMs = Math.round(RAID_BASE_COOLDOWN_MS * 1.5);
      gangLoss = applyRaidGangLoss(5);
      targetAlerted = !isDistrictUnownedForSpyOutcome(district);
      if (targetAlerted) {
        maybeShowRaidTargetAlert(district);
      }
      pushEvent(`Krádež v districtu ${district.name || `#${district.id}`} skončila průserem. Ztráta členů: ${gangLoss}.`);
    }

    setRaidCooldownUntil(Date.now() + cooldownMs);
    setDistrictRaidLockUntil(district.id, Date.now() + DISTRICT_RAID_LOCK_MS);
    openRaidResultModal(buildRaidResultPayload({
      district,
      outcomeKey,
      loot,
      cooldownMs,
      gangLoss,
      targetAlerted
    }));
  }

  function startRaidAction(district) {
    if (!district) return;
    const durationMs = resolveRaidDurationWithBoosts();
    raidActionState = {
      districtId: district.id,
      startedAt: Date.now(),
      endsAt: Date.now() + durationMs
    };
    if (raidActionTimeoutId) {
      clearTimeout(raidActionTimeoutId);
    }
    raidActionTimeoutId = setTimeout(() => {
      finalizeRaidActionResult({ districtId: district.id, durationMs });
    }, durationMs);
    window.Empire.Map?.markDistrictRaidAction?.(district.id, {
      durationMs,
      source: "raid-action"
    });
    recordVerifiedIntelEvent({
      type: "raid_started",
      districtId: district.id
    });
    pushEvent(`Krádež v districtu ${district.name || `#${district.id}`} byla spuštěna. Trvání ${formatAttackDurationLabel(durationMs)}.`);
    const districtModal = document.getElementById("district-modal");
    if (districtModal) districtModal.classList.add("hidden");
  }

  function resolveOccupationTierRarityWeight(tierValue) {
    const tier = String(tierValue || "").trim().toLowerCase();
    const weights = {
      early: 0.15,
      mid: 0.38,
      late: 0.64,
      top: 0.72,
      high: 0.78,
      core: 0.9
    };
    return Number.isFinite(weights[tier]) ? weights[tier] : 0.4;
  }

  function resolveOccupationRequiredMembers(district, spyIntel = null) {
    const tierWeight = resolveOccupationTierRarityWeight(district?.buildingTier);
    const districtBuildings = Array.isArray(district?.buildings) ? district.buildings : [];
    const intelBuildings = Array.isArray(spyIntel?.buildings) ? spyIntel.buildings : [];
    const buildingCount = Math.max(districtBuildings.length, intelBuildings.length);
    const buildingWeight = Math.min(1, buildingCount / 4);
    const rarityWeight = Math.min(1, tierWeight * 0.7 + buildingWeight * 0.3);
    const required = Math.round(50 + rarityWeight * 150);
    return Math.max(50, Math.min(200, required));
  }

  function resolvePlayerDistrictOwnerLabel() {
    const playerOwners = getPlayerOwnerNameSet();
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const owned = districts.find((entry) => {
      const ownerName = normalizeOwnerName(entry?.owner);
      return ownerName && playerOwners.has(ownerName);
    });
    if (owned?.owner) return String(owned.owner);
    const fallback = cachedProfile?.gangName
      || cachedProfile?.gang_name
      || cachedProfile?.gang
      || window.Empire.player?.gangName
      || window.Empire.player?.gang_name
      || window.Empire.player?.gang
      || localStorage.getItem("empire_gang_name")
      || localStorage.getItem("empire_guest_username");
    return String(fallback || "Tvůj gang").trim() || "Tvůj gang";
  }

  function resolvePlayerDistrictOwnerColor() {
    const playerOwners = getPlayerOwnerNameSet();
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const owned = districts.find((entry) => {
      const ownerName = normalizeOwnerName(entry?.owner);
      const hasColor = String(entry?.ownerColor || "").trim().length > 0;
      return ownerName && hasColor && playerOwners.has(ownerName);
    });
    return String(owned?.ownerColor || "").trim();
  }

  function resolvePlayerAllianceVisualMeta() {
    const localState = !window.Empire.token ? getLocalAllianceState() : null;
    const activeAlliance = window.Empire.token
      ? null
      : ((localState?.alliances || []).find((item) => item.id === localState?.activeAllianceId) || null);
    const playerOwners = getPlayerOwnerNameSet();
    const ownedDistrict = (Array.isArray(window.Empire.districts) ? window.Empire.districts : []).find((entry) => {
      const ownerName = normalizeOwnerName(entry?.owner);
      return ownerName && playerOwners.has(ownerName) && String(entry?.ownerAllianceName || "").trim();
    });
    const allianceName = String(
      activeAlliance?.name
      || ownedDistrict?.ownerAllianceName
      || ""
    ).trim();
    if (!allianceName) {
      return { name: null, iconKey: null };
    }
    return {
      name: allianceName,
      iconKey: resolveAllianceIconKeyByName(allianceName)
    };
  }

  function claimDistrictForPlayer(district) {
    if (!district || typeof district !== "object") return;
    const ownerLabel = resolvePlayerDistrictOwnerLabel();
    const ownerColor = resolvePlayerDistrictOwnerColor();
    const allianceMeta = resolvePlayerAllianceVisualMeta();
    const ownerNick = String(
      cachedProfile?.username
      || cachedProfile?.name
      || window.Empire.player?.username
      || window.Empire.player?.name
      || "Ty"
    ).trim() || "Ty";
    const ownerFaction = String(
      cachedProfile?.structure
      || window.Empire.player?.structure
      || district?.ownerFaction
      || district?.ownerStructure
      || "Neznámá"
    ).trim() || "Neznámá";

    district.owner = ownerLabel;
    district.ownerNick = ownerNick;
    district.ownerAllianceName = allianceMeta.name || null;
    district.ownerAllianceIconKey = allianceMeta.iconKey || null;
    district.ownerFaction = ownerFaction;
    district.ownerStructure = ownerFaction;
    district.owner_structure = ownerFaction;
    district.ownerPlayerId = window.Empire.player?.id || district.ownerPlayerId || null;
    if (ownerColor) district.ownerColor = ownerColor;

    window.Empire.Map?.refreshSelectedDistrictModal?.();
    window.Empire.Map?.render?.();
    updateDistrict(district);
    refreshProfilePopulation();
  }

  function rollSpyOutcome(district) {
    if (isOnboardingDemoScenarioActive()) {
      return {
        key: "success",
        chances: { success: 100, mediumFail: 0, majorFail: 0 }
      };
    }
    const isUnowned = isDistrictUnownedForSpyOutcome(district);
    const baseChances = isUnowned
      ? { success: 70, mediumFail: 20, majorFail: 10 }
      : { success: 52, mediumFail: 28, majorFail: 20 };
    const spyDefensePenalty = resolveSpyDefensePenalty(district?.id);
    const successPenalty = Math.max(0, Math.min(baseChances.success - 5, Number(spyDefensePenalty.successPenalty || 0)));
    const majorShift = Math.max(0, Math.min(successPenalty, Number(spyDefensePenalty.majorShift || 0)));
    const mediumShift = Math.max(0, successPenalty - majorShift);
    const chances = {
      success: Math.max(5, baseChances.success - successPenalty),
      mediumFail: baseChances.mediumFail + mediumShift,
      majorFail: baseChances.majorFail + majorShift
    };
    const roll = Math.random() * 100;
    if (roll < chances.success) return { key: "success", chances };
    if (roll < chances.success + chances.mediumFail) return { key: "medium_fail", chances };
    return { key: "major_fail", chances };
  }

  function resolveSpyDefensePenalty(districtId) {
    const modifiers = resolveDistrictDefenseSpecialModifiers(districtId);
    const counts = {
      securityCameraCount: modifiers.cameraCount,
      alarmSystemCount: modifiers.alarmCount
    };
    let successPenalty = 0;
    let majorShift = 0;
    if (counts.securityCameraCount >= 5) {
      successPenalty += 8;
      majorShift += 3;
    }
    if (counts.alarmSystemCount >= 5) {
      successPenalty += 8;
      majorShift += 3;
    }
    return {
      ...counts,
      successPenalty,
      majorShift
    };
  }

  function estimateSpyDefenseIntel(district) {
    const snapshot = getDistrictDefenseSnapshot(district?.id);
    const candidates = [snapshot?.self, snapshot?.ally].filter((entry) => entry?.hasData);
    const knownWeapons = candidates.reduce((max, entry) => Math.max(max, Number(entry?.weapons || 0)), 0);
    const knownPower = candidates.reduce((max, entry) => Math.max(max, Number(entry?.power || 0)), 0);
    const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
    const influence = Math.max(0, Math.floor(Number(district?.influence || 0)));
    const fallbackPower = Math.max(26, Math.floor(influence * 1.5 + buildings.length * 26 + (district?.owner ? 48 : 12)));
    const basePower = knownPower > 0 ? knownPower : fallbackPower;
    const baseWeapons = knownWeapons > 0 ? knownWeapons : Math.max(0, Math.round(basePower / 36));
    const lowerPower = Math.max(0, Math.floor(basePower * 0.8));
    const upperPower = Math.max(lowerPower, Math.ceil(basePower * 1.2));
    return {
      weapons: baseWeapons,
      powerEstimate: basePower,
      powerRangeLabel: `${lowerPower} až ${upperPower}`
    };
  }

  function resolveDistrictAtmosphereForSpy(district) {
    const candidates = [
      district?.ownerAtmosphere,
      district?.atmosphere,
      district?.districtAtmosphere,
      district?.vibe
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const value = String(candidates[i] || "").trim();
      if (value) return value;
    }
    return "Neznámá";
  }

  function buildSpyIntelPayload(district) {
    const defenseIntel = estimateSpyDefenseIntel(district);
    const buildings = Array.isArray(district?.buildings)
      ? district.buildings
        .map((building) => String(building || "").trim())
        .filter((building) => {
          const normalized = String(building || "").trim().toLowerCase();
          return normalized && normalized !== "past";
        })
      : [];
    const districtType = formatDistrictType(String(district?.type || ""));
    const atmosphere = resolveDistrictAtmosphereForSpy(district);
    return {
      weapons: defenseIntel.weapons,
      powerRangeLabel: defenseIntel.powerRangeLabel,
      buildings,
      districtType: districtType || "Neznámý",
      atmosphere,
      createdAt: Date.now()
    };
  }

  function buildPartialSpyIntelPayload(district) {
    const fullIntel = buildSpyIntelPayload(district);
    const revealableFields = ["weapons", "powerRangeLabel", "districtType", "atmosphere", "buildings"];
    const shuffledFields = [...revealableFields].sort(() => Math.random() - 0.5);
    const revealedFields = new Set(shuffledFields.slice(0, 2));
    return {
      weapons: revealedFields.has("weapons") ? fullIntel.weapons : null,
      powerRangeLabel: revealedFields.has("powerRangeLabel") ? fullIntel.powerRangeLabel : null,
      districtType: revealedFields.has("districtType") ? fullIntel.districtType : null,
      atmosphere: revealedFields.has("atmosphere") ? fullIntel.atmosphere : null,
      buildings: revealedFields.has("buildings") ? [...fullIntel.buildings] : [],
      knownFields: {
        weapons: revealedFields.has("weapons"),
        powerRangeLabel: revealedFields.has("powerRangeLabel"),
        districtType: revealedFields.has("districtType"),
        atmosphere: revealedFields.has("atmosphere"),
        buildings: revealedFields.has("buildings")
      },
      createdAt: Date.now()
    };
  }

  function buildSpySuccessDetailsMarkup(intel) {
    const knownFields = normalizeSpyIntelKnownFields(intel || {});
    const buildingLabel = knownFields.buildings
      ? ((Array.isArray(intel?.buildings) && intel.buildings.length)
        ? intel.buildings.join(", ")
        : "Bez významných budov")
      : "Nezjištěno";
    const weapons = knownFields.weapons
      ? `${Math.max(0, Math.floor(Number(intel?.weapons) || 0))} ks`
      : "Nezjištěno";
    const powerRangeLabel = knownFields.powerRangeLabel
      ? (String(intel?.powerRangeLabel || "").trim() || "Neznámá")
      : "Nezjištěno";
    const districtType = knownFields.districtType
      ? (String(intel?.districtType || "").trim() || "Neznámý")
      : "Nezjištěno";
    const atmosphere = knownFields.atmosphere
      ? (String(intel?.atmosphere || "").trim() || "Neznámá")
      : "Nezjištěno";
    return `
      <div class="modal__row">
        <span>Odhad obrany (zbraně)</span>
        <strong>${weapons}</strong>
      </div>
      <div class="modal__row">
        <span>Odhad síly obrany (±20 %)</span>
        <strong>${powerRangeLabel}</strong>
      </div>
      <div class="modal__row">
        <span>Typ distriktu</span>
        <strong>${districtType}</strong>
      </div>
      <div class="modal__row">
        <span>Atmosféra</span>
        <strong>${atmosphere}</strong>
      </div>
      <div class="modal__row">
        <span>Budovy</span>
        <strong>${buildingLabel}</strong>
      </div>
    `;
  }

  function resolveSpySuccessSummary(district) {
    if (isDistrictUnownedForSpyOutcome(district)) {
      const quotes = SPY_SUCCESS_EMPTY_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    if (district?.owner) {
      const quotes = SPY_SUCCESS_OCCUPIED_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    return `Špehování distriktu ${districtName} dopadlo úspěšně.`;
  }

  function resolveSpyMediumFailSummary(district) {
    if (isDistrictUnownedForSpyOutcome(district)) {
      const quotes = SPY_MEDIUM_FAIL_EMPTY_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    if (district?.owner) {
      const quotes = SPY_MEDIUM_FAIL_OCCUPIED_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    return `Akce v ${districtName} nedopadla dobře, ale tvůj špeh se vrátil.`;
  }

  function resolveSpyMajorFailSummary(district) {
    if (isDistrictUnownedForSpyOutcome(district)) {
      const quotes = SPY_MAJOR_FAIL_EMPTY_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    if (district?.owner) {
      const quotes = SPY_MAJOR_FAIL_OCCUPIED_DISTRICT_QUOTES;
      if (quotes.length) {
        return String(quotes[Math.floor(Math.random() * quotes.length)] || "").trim();
      }
    }
    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    return `Špeh byl v districtu ${districtName} zajat. Ve zdroji je zamčen na 60 sekund.`;
  }

  function isResultModalVisible() {
    const roots = [
      document.getElementById("spy-result-modal"),
      document.getElementById("spy-warning-modal"),
      document.getElementById("raid-result-modal"),
      document.getElementById("attack-result-modal"),
      document.getElementById("police-action-result-modal")
    ];
    return roots.some((root) => Boolean(root && !root.classList.contains("hidden")));
  }

  function renderNextPendingResultModal() {
    if (!pendingResultModalQueue.length) return;
    const next = pendingResultModalQueue.shift();
    if (!next || typeof next !== "object") return;
    if (next.kind === "occupy") {
      renderOccupationResultModal(next.payload);
      return;
    }
    if (next.kind === "attack") {
      openAttackResultModal(next.payload);
      return;
    }
    if (next.kind === "raid") {
      openRaidResultModal(next.payload);
      return;
    }
    if (next.kind === "spy_alert") {
      openSpyDetectionAlertModal(next.payload);
      return;
    }
    if (next.kind === "police") {
      openPoliceActionResultModal(next.payload);
      return;
    }
    openSpyResultModal(next.payload);
  }

  function closeSpyResultModal() {
    const root = document.getElementById("spy-result-modal");
    if (root) root.classList.add("hidden");
    if (suppressResultModalQueueAdvance) return;
    if (!pendingResultModalQueue.length) return;
    setTimeout(() => {
      renderNextPendingResultModal();
    }, 80);
  }

  function closeSpyDetectionAlertModal() {
    const root = document.getElementById("spy-warning-modal");
    if (root) root.classList.add("hidden");
    if (suppressResultModalQueueAdvance) return;
    if (!pendingResultModalQueue.length) return;
    setTimeout(() => {
      renderNextPendingResultModal();
    }, 80);
  }

  function renderSpyResultModal({ outcomeKey, district, chances, spyIntel = null }) {
    const root = document.getElementById("spy-result-modal");
    const content = document.getElementById("spy-result-modal-content");
    const title = document.getElementById("spy-result-modal-title");
    const summary = document.getElementById("spy-result-modal-summary");
    const details = document.getElementById("spy-result-modal-details");
    if (!root || !content || !title || !summary || !details) return;

    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    content.classList.remove("is-success", "is-medium-fail", "is-major-fail");

    if (outcomeKey === "success") {
      content.classList.add("is-success");
      title.textContent = "Špehování: Úspěch";
      summary.textContent = resolveSpySuccessSummary(district);
      details.innerHTML = buildSpySuccessDetailsMarkup(spyIntel);
    } else if (outcomeKey === "medium_fail") {
      content.classList.add("is-medium-fail");
      title.textContent = "Špehování: Částečný neúspěch";
      summary.textContent = resolveSpyMediumFailSummary(district);
      details.innerHTML = `
        <div class="modal__row">
          <span>Stav špeha</span>
          <strong>Vrátil se</strong>
        </div>
        ${spyIntel ? buildSpySuccessDetailsMarkup(spyIntel) : ""}
      `;
    } else {
      content.classList.add("is-major-fail");
      title.textContent = "Špehování: Velký neúspěch";
      summary.textContent = resolveSpyMajorFailSummary(district);
      details.innerHTML = `
        <div class="modal__row">
          <span>Stav špeha</span>
          <strong>Zajat (60s)</strong>
        </div>
      `;
    }

    root.classList.remove("hidden");
  }

  function openSpyResultModal(payload) {
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "spy", payload });
      return;
    }
    renderSpyResultModal(payload);
  }

  function renderSpyDetectionAlertModal({
    district,
    summary,
    badgeLabel = "Vlastní district pod tlakem",
    alertKind = "player",
    attackerNick = "Neznámý hráč",
    attackerGang = "Neznámý gang",
    attackerAlliance = "Bez aliance",
    detectedAt = Date.now()
  }) {
    const root = document.getElementById("spy-warning-modal");
    const content = document.getElementById("spy-warning-modal-content");
    const title = document.getElementById("spy-warning-modal-title");
    const badge = document.getElementById("spy-warning-modal-badge");
    const summaryEl = document.getElementById("spy-warning-modal-summary");
    const details = document.getElementById("spy-warning-modal-details");
    if (!root || !content || !title || !badge || !summaryEl || !details) return;

    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    const detectedAtLabel = formatSpyDetectionAlertTime(detectedAt);
    content.classList.remove("is-success", "is-medium-fail", "is-major-fail", "is-player-alert", "is-alliance-alert");
    content.classList.add(alertKind === "alliance" ? "is-alliance-alert" : "is-player-alert");
    title.textContent = "Upozornění: Neúspěšné špehování";
    badge.textContent = badgeLabel;
    summaryEl.textContent = String(summary || "").trim() || `Někdo se pokusil neúspěšně špehovat district ${districtName}. Špeha vyslal: ${attackerNick}.`;
    details.innerHTML = `
      <div class="modal__row">
        <span>Cíl</span>
        <strong>${districtName}</strong>
      </div>
      <div class="modal__row">
        <span>Odeslal špeha</span>
        <strong class="spy-warning-modal__identity spy-warning-modal__identity--nick">${attackerNick}</strong>
      </div>
      <div class="modal__row">
        <span>Gang útočníka</span>
        <strong class="spy-warning-modal__identity spy-warning-modal__identity--gang">${attackerGang}</strong>
      </div>
      <div class="modal__row">
        <span>Aliance útočníka</span>
        <strong class="spy-warning-modal__identity spy-warning-modal__identity--alliance">${attackerAlliance}</strong>
      </div>
      <div class="modal__row">
        <span>Čas zachycení</span>
        <strong>${detectedAtLabel}</strong>
      </div>
      <div class="modal__row">
        <span>Stav districtu</span>
        <strong>Špeh byl odhalen</strong>
      </div>
    `;

    root.classList.remove("hidden");
  }

  function openSpyDetectionAlertModal(payload) {
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "spy_alert", payload });
      return;
    }
    renderSpyDetectionAlertModal(payload);
  }

  function initSpyResultModal() {
    const root = document.getElementById("spy-result-modal");
    const backdrop = document.getElementById("spy-result-modal-backdrop");
    const closeBtn = document.getElementById("spy-result-modal-close");
    const okBtn = document.getElementById("spy-result-modal-ok");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeSpyResultModal);
    if (closeBtn) closeBtn.addEventListener("click", closeSpyResultModal);
    if (okBtn) okBtn.addEventListener("click", closeSpyResultModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeSpyResultModal();
      }
    });
  }

  function initSpyDetectionAlertModal() {
    const root = document.getElementById("spy-warning-modal");
    const backdrop = document.getElementById("spy-warning-modal-backdrop");
    const closeBtn = document.getElementById("spy-warning-modal-close");
    const okBtn = document.getElementById("spy-warning-modal-ok");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeSpyDetectionAlertModal);
    if (closeBtn) closeBtn.addEventListener("click", closeSpyDetectionAlertModal);
    if (okBtn) okBtn.addEventListener("click", closeSpyDetectionAlertModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeSpyDetectionAlertModal();
      }
    });
  }

  function notifyDistrictOwnerAboutSpyFailure(district) {
    if (!district || !district.owner || !isDistrictDefendableByPlayer(district)) return;
    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    const isAllianceDistrict = isDistrictOwnedByAlliance(district);
    const detectedAt = Date.now();
    const attackerNick = resolveCurrentPlayerNick();
    const attackerGang = resolveCurrentPlayerGangName();
    const attackerAlliance = resolveCurrentPlayerAllianceName();
    const allianceName = String(
      district?.ownerAllianceName
      || district?.owner_alliance_name
      || resolvePlayerAllianceVisualMeta()?.name
      || "Aliance"
    ).trim() || "Aliance";
    const quotes = isAllianceDistrict
      ? SPY_ALLIANCE_DETECTION_WARNING_QUOTES
      : SPY_DETECTION_WARNING_QUOTES;
    const summary = quotes.length
      ? String(quotes[Math.floor(Math.random() * quotes.length)] || "")
        .replaceAll("[ALLY]", allianceName)
        .concat(` Špeha vyslal: ${attackerNick} • gang ${attackerGang} • aliance ${attackerAlliance}.`)
        .trim()
      : `Někdo se pokusil neúspěšně špehovat district ${districtName}. Špeha vyslal: ${attackerNick} • gang ${attackerGang} • aliance ${attackerAlliance}.`;
    pushEvent(
      isAllianceDistrict
        ? `Varování: ${allianceName} zachytila cizího špeha od ${attackerNick} (${attackerGang} / ${attackerAlliance}).`
        : `Varování: ${districtName} zachytil špeha od ${attackerNick} (${attackerGang} / ${attackerAlliance}).`
    );
    openSpyDetectionAlertModal({
      district,
      summary,
      badgeLabel: isAllianceDistrict ? `Aliance v ohrožení • ${allianceName}` : "Vlastní district pod tlakem",
      alertKind: isAllianceDistrict ? "alliance" : "player",
      attackerNick,
      attackerGang,
      attackerAlliance,
      detectedAt
    });
  }

  function finalizeSpyActionResult({ districtId }) {
    const district = resolveDistrictById(districtId);
    if (!district) return;
    const rolled = rollSpyOutcome(district);
    const outcomeKey = rolled.key;
    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    let discoveredIntel = null;

    if (outcomeKey === "success") {
      discoveredIntel = setDistrictSpyIntel(
        district.id,
        buildSpyIntelPayload(district),
        { persist: !demoMode }
      );
      enqueueSpyRecovery(1, SPY_RECOVERY_COOLDOWN_MS);
      pushEvent(`Špehování distriktu ${district.name || `#${district.id}`} bylo úspěšné.`);
    } else if (outcomeKey === "medium_fail") {
      discoveredIntel = setDistrictSpyIntel(
        district.id,
        buildPartialSpyIntelPayload(district),
        { persist: !demoMode }
      );
      setSpyCount(getSpyCount() + 1, { persist: true, animate: isSpyCountShownInTopbar });
      pushEvent("Špehování nedopadlo dobře, ale špeh se vrátil.");
    } else {
      enqueueSpyRecovery(1, 60 * 1000);
      pushEvent("Špehování selhalo. Špeh byl zajat a je zamčen na 60s.");
      if (!isDistrictUnownedForSpyOutcome(district)) {
        notifyDistrictOwnerAboutSpyFailure(district);
      }
    }

    openSpyResultModal({ outcomeKey, district, chances: rolled.chances, spyIntel: discoveredIntel });
  }

  function scheduleSpyActionResult(districtId) {
    const timeoutId = setTimeout(() => {
      spyActionResultTimeouts.delete(timeoutId);
      finalizeSpyActionResult({ districtId });
    }, SPY_ACTION_DURATION_MS);
    spyActionResultTimeouts.add(timeoutId);
  }

  function closeSpyConfirmModal() {
    const root = document.getElementById("spy-confirm-modal");
    if (root) root.classList.add("hidden");
    spyConfirmModalState = { districtId: null };
  }

  function closeRaidConfirmModal() {
    const root = document.getElementById("raid-confirm-modal");
    if (root) root.classList.add("hidden");
    raidConfirmModalState = { districtId: null };
  }

  function renderSpyConfirmModal() {
    const root = document.getElementById("spy-confirm-modal");
    const districtEl = document.getElementById("spy-confirm-modal-district");
    const countEl = document.getElementById("spy-confirm-modal-count");
    const noteEl = document.getElementById("spy-confirm-modal-note");
    const confirmBtn = document.getElementById("spy-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !countEl || !noteEl || !confirmBtn) return;

    const district = resolveDistrictById(spyConfirmModalState.districtId);
    processSpyRecoveryQueue({ notify: true });
    const availableSpies = getSpyCount();
    const availability = evaluateDistrictActionAvailability(district, "spy");
    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    countEl.textContent = String(availableSpies);
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;

    let noteText = "Každé špehování spotřebuje 1 špeha.";
    let canConfirm = true;

    if (!district) {
      noteText = "Nejprve vyber distrikt.";
      canConfirm = false;
    } else if (!availability.allowed) {
      noteText = availability.reason;
      canConfirm = false;
    } else if (!window.Empire.token && !demoMode) {
      noteText = "Pro špehování je nutné přihlášení.";
      canConfirm = false;
    } else if (availableSpies <= 0) {
      noteText = "Nemáš žádné dostupné špehy.";
      canConfirm = false;
    } else {
      noteText = `Akce potrvá ${Math.floor(SPY_ACTION_DURATION_MS / 1000)}s. Po ${Math.floor(SPY_RECOVERY_COOLDOWN_MS / 1000)}s se 1 špeh vrátí zpět.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openSpyConfirmModal(district) {
    const root = document.getElementById("spy-confirm-modal");
    if (!root) return;
    spyConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderSpyConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:spy-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
  }

  function renderRaidConfirmModal() {
    const root = document.getElementById("raid-confirm-modal");
    const districtEl = document.getElementById("raid-confirm-modal-district");
    const durationEl = document.getElementById("raid-confirm-modal-duration");
    const noteEl = document.getElementById("raid-confirm-modal-note");
    const confirmBtn = document.getElementById("raid-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !durationEl || !noteEl || !confirmBtn) return;

    const district = resolveDistrictById(raidConfirmModalState.districtId);
    const availability = evaluateDistrictActionAvailability(district, "raid");
    const durationMs = resolveRaidDurationWithBoosts();
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    durationEl.textContent = formatAttackDurationLabel(durationMs);

    let noteText = "Opravdu chceš spustit krádež tohoto distriktu?";
    let canConfirm = true;
    if (!district) {
      noteText = "Nejprve vyber distrikt.";
      canConfirm = false;
    } else if (!availability.allowed) {
      noteText = availability.reason;
      canConfirm = false;
    } else if (isRaidActionRunning()) {
      noteText = "Krádež už právě probíhá. Současně může běžet jen jedna.";
      canConfirm = false;
    } else {
      const cooldownMs = getRaidCooldownRemainingMs();
      if (cooldownMs > 0) {
        noteText = `Krádež je na cooldownu ještě ${formatRaidCooldownLabel(cooldownMs)}.`;
        canConfirm = false;
      } else {
        noteText = `Akce potrvá ${formatAttackDurationLabel(durationMs)}. Po dokončení se district zamkne na 2h pro další krádež.`;
      }
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openRaidConfirmModal(district) {
    const root = document.getElementById("raid-confirm-modal");
    if (!root) return;
    raidConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderRaidConfirmModal();
  }

  function startRaidActionFromModal() {
    const district = resolveDistrictById(raidConfirmModalState.districtId);
    if (!district) {
      renderRaidConfirmModal();
      return;
    }
    const availability = evaluateDistrictActionAvailability(district, "raid");
    if (!availability.allowed) {
      pushEvent(availability.reason);
      renderRaidConfirmModal();
      return;
    }
    if (isRaidActionRunning()) {
      pushEvent("Krádež už právě probíhá. Současně může běžet jen jedna.");
      renderRaidConfirmModal();
      return;
    }
    const cooldownMs = getRaidCooldownRemainingMs();
    if (cooldownMs > 0) {
      pushEvent(`Krádež je na cooldownu ještě ${formatRaidCooldownLabel(cooldownMs)}.`);
      renderRaidConfirmModal();
      return;
    }
    closeRaidConfirmModal();
    startRaidAction(district);
  }

  function initRaidConfirmModal() {
    const root = document.getElementById("raid-confirm-modal");
    const backdrop = document.getElementById("raid-confirm-modal-backdrop");
    const closeBtn = document.getElementById("raid-confirm-modal-close");
    const cancelBtn = document.getElementById("raid-confirm-modal-cancel");
    const confirmBtn = document.getElementById("raid-confirm-modal-confirm");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeRaidConfirmModal);
    if (closeBtn) closeBtn.addEventListener("click", closeRaidConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeRaidConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener("click", startRaidActionFromModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeRaidConfirmModal();
      }
    });
  }

  function startSpyActionFromModal() {
    const district = resolveDistrictById(spyConfirmModalState.districtId);
    if (!district) {
      renderSpyConfirmModal();
      return;
    }

    const availability = evaluateDistrictActionAvailability(district, "spy");
    if (!availability.allowed) {
      pushEvent(availability.reason);
      renderSpyConfirmModal();
      return;
    }
    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    if (!window.Empire.token && !demoMode) {
      pushEvent("Pro špehování je nutné přihlášení.");
      renderSpyConfirmModal();
      return;
    }
    processSpyRecoveryQueue({ notify: true });
    if (!consumeSpyAgents(1)) {
      pushEvent("Nemáš žádné dostupné špehy.");
      renderSpyConfirmModal();
      return;
    }

    pushEvent(`Špehování distriktu ${district.name || `#${district.id}`} bylo zahájeno na ${Math.floor(SPY_ACTION_DURATION_MS / 1000)}s.`);
    window.Empire.Map?.markDistrictSpyAction?.(district.id, {
      durationMs: SPY_ACTION_DURATION_MS,
      source: demoMode ? "scenario-spy" : "player-spy"
    });
    recordVerifiedIntelEvent({
      type: "spy_started",
      districtId: district.id
    });
    document.dispatchEvent(new CustomEvent("empire:spy-started", {
      detail: {
        districtId: district.id,
        district
      }
    }));
    scheduleSpyActionResult(district.id);
    closeSpyConfirmModal();
    const districtModal = document.getElementById("district-modal");
    if (districtModal) districtModal.classList.add("hidden");
  }

  function initSpyConfirmModal() {
    const root = document.getElementById("spy-confirm-modal");
    const backdrop = document.getElementById("spy-confirm-modal-backdrop");
    const closeBtn = document.getElementById("spy-confirm-modal-close");
    const cancelBtn = document.getElementById("spy-confirm-modal-cancel");
    const confirmBtn = document.getElementById("spy-confirm-modal-confirm");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeSpyConfirmModal);
    if (closeBtn) closeBtn.addEventListener("click", closeSpyConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeSpyConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener("click", startSpyActionFromModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeSpyConfirmModal();
      }
    });
  }

  function closeOccupyConfirmModal() {
    const root = document.getElementById("occupy-confirm-modal");
    if (root) root.classList.add("hidden");
    occupyConfirmModalState = { districtId: null };
  }

  function renderOccupyConfirmModal() {
    const root = document.getElementById("occupy-confirm-modal");
    const districtEl = document.getElementById("occupy-confirm-modal-district");
    const availableEl = document.getElementById("occupy-confirm-modal-members-available");
    const requiredEl = document.getElementById("occupy-confirm-modal-members-required");
    const noteEl = document.getElementById("occupy-confirm-modal-note");
    const confirmBtn = document.getElementById("occupy-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !availableEl || !requiredEl || !noteEl || !confirmBtn) return;

    const district = resolveDistrictById(occupyConfirmModalState.districtId);
    const spyIntel = getDistrictSpyIntel(district?.id);
    const requiredMembers = resolveOccupationRequiredMembers(district, spyIntel);
    const availableMembers = countPlayerControlledPopulation(cachedProfile || window.Empire.player || {});
    const availability = evaluateDistrictActionAvailability(district, "occupy");
    const demoMode = scenarioVisionEnabled && !window.Empire.token;

    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    availableEl.textContent = String(availableMembers);
    requiredEl.textContent = String(requiredMembers);

    let canConfirm = true;
    let noteText = `Akce potrvá ${Math.floor(OCCUPY_ACTION_DURATION_MS / 1000)}s.`;
    if (!district) {
      canConfirm = false;
      noteText = "Nejprve vyber distrikt.";
    } else if (!availability.allowed) {
      canConfirm = false;
      noteText = availability.reason;
    } else if (!window.Empire.token && !demoMode) {
      canConfirm = false;
      noteText = "Pro obsazení je nutné přihlášení.";
    } else if (availableMembers < requiredMembers) {
      canConfirm = false;
      noteText = `Na obsazení chybí ${requiredMembers - availableMembers} členů gangu.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openOccupyConfirmModal(district) {
    const root = document.getElementById("occupy-confirm-modal");
    if (!root) return;
    occupyConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderOccupyConfirmModal();
    document.dispatchEvent(new CustomEvent("empire:occupy-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district: district || null
      }
    }));
  }

  function renderOccupationResultModal({ outcomeKey, district, requiredMembers, returnedMembers }) {
    const root = document.getElementById("spy-result-modal");
    const content = document.getElementById("spy-result-modal-content");
    const title = document.getElementById("spy-result-modal-title");
    const summary = document.getElementById("spy-result-modal-summary");
    const details = document.getElementById("spy-result-modal-details");
    if (!root || !content || !title || !summary || !details) return;

    const districtName = district?.name || `Distrikt #${district?.id ?? "-"}`;
    content.classList.remove("is-success", "is-medium-fail", "is-major-fail");

    if (outcomeKey === "success") {
      content.classList.add("is-success");
      title.textContent = "Obsazení: Úspěch";
      summary.textContent = `District ${districtName} byl úspěšně obsazen a připadl tvému gangu.`;
      details.innerHTML = `
        <div class="modal__row"><span>Nasazeno členů</span><strong>${requiredMembers}</strong></div>
        <div class="modal__row"><span>Vráceno do profilu</span><strong>${returnedMembers}</strong></div>
      `;
      root.classList.remove("hidden");
      return;
    }

    if (outcomeKey === "medium_fail") {
      content.classList.add("is-medium-fail");
      title.textContent = "Obsazení: Střední neúspěch";
      summary.textContent = "Obsazení nedopadlo dobře, vrátila se pouze polovina členů gangu.";
      details.innerHTML = `
        <div class="modal__row"><span>Nasazeno členů</span><strong>${requiredMembers}</strong></div>
        <div class="modal__row"><span>Vráceno do profilu</span><strong>${returnedMembers}</strong></div>
      `;
      root.classList.remove("hidden");
      return;
    }

    content.classList.add("is-major-fail");
    title.textContent = "Obsazení: Velký neúspěch";
    summary.textContent = "Členové gangu zmizeli neznámo kam a nevrátili se zpět do zdrojů.";
    details.innerHTML = `
      <div class="modal__row"><span>Nasazeno členů</span><strong>${requiredMembers}</strong></div>
      <div class="modal__row"><span>Vráceno do profilu</span><strong>0</strong></div>
    `;
    root.classList.remove("hidden");
  }

  function openOccupationResultModal(payload) {
    if (isResultModalVisible()) {
      pendingResultModalQueue.push({ kind: "occupy", payload });
      return;
    }
    renderOccupationResultModal(payload);
  }

  function finalizeOccupationActionResult({ districtId, requiredMembers }) {
    const district = resolveDistrictById(districtId);
    if (!district) return;
    const rolled = rollSpyOutcome(district);
    const outcomeKey = rolled.key;
    const returnedMembers = Math.floor(Math.max(0, Number(requiredMembers) || 0) / 2);

    if (outcomeKey === "success") {
      if (returnedMembers > 0) addGangMembers(returnedMembers);
      claimDistrictForPlayer(district);
      pushEvent(`Obsazení distriktu ${district.name || `#${district.id}`} bylo úspěšné.`);
      recordVerifiedIntelEvent({ type: "attack_success", districtId: district.id });
    } else if (outcomeKey === "medium_fail") {
      if (returnedMembers > 0) addGangMembers(returnedMembers);
      pushEvent("Obsazení se nepodařilo. Vrátila se pouze polovina členů gangu.");
    } else {
      pushEvent("Obsazení selhalo. Členové gangu zmizeli neznámo kam.");
    }

    openOccupationResultModal({
      outcomeKey,
      district,
      requiredMembers: Math.max(0, Math.floor(Number(requiredMembers) || 0)),
      returnedMembers
    });
  }

  function scheduleOccupationActionResult(districtId, requiredMembers) {
    const timeoutId = setTimeout(() => {
      occupyActionResultTimeouts.delete(timeoutId);
      finalizeOccupationActionResult({ districtId, requiredMembers });
    }, OCCUPY_ACTION_DURATION_MS);
    occupyActionResultTimeouts.add(timeoutId);
  }

  function startOccupyActionFromModal() {
    const district = resolveDistrictById(occupyConfirmModalState.districtId);
    if (!district) {
      renderOccupyConfirmModal();
      return;
    }

    const availability = evaluateDistrictActionAvailability(district, "occupy");
    if (!availability.allowed) {
      pushEvent(availability.reason);
      renderOccupyConfirmModal();
      return;
    }

    const demoMode = scenarioVisionEnabled && !window.Empire.token;
    if (!window.Empire.token && !demoMode) {
      pushEvent("Pro obsazení je nutné přihlášení.");
      renderOccupyConfirmModal();
      return;
    }

    const requiredMembers = resolveOccupationRequiredMembers(district, getDistrictSpyIntel(district.id));
    const availableMembers = countPlayerControlledPopulation(cachedProfile || window.Empire.player || {});
    if (availableMembers < requiredMembers) {
      pushEvent(`Na obsazení chybí ${requiredMembers - availableMembers} členů gangu.`);
      renderOccupyConfirmModal();
      return;
    }

    consumeGangMembers(requiredMembers);
    window.Empire.Map?.markDistrictUnderAttack?.(district.id, {
      durationMs: OCCUPY_ACTION_DURATION_MS,
      source: demoMode ? "scenario-occupy" : "player-occupy"
    });
    pushEvent(`Obsazení distriktu ${district.name || `#${district.id}`} bylo zahájeno na ${Math.floor(OCCUPY_ACTION_DURATION_MS / 1000)}s.`);
    document.dispatchEvent(new CustomEvent("empire:occupy-started", {
      detail: {
        districtId: district.id,
        district,
        requiredMembers
      }
    }));
    scheduleOccupationActionResult(district.id, requiredMembers);
    closeOccupyConfirmModal();
    const districtModal = document.getElementById("district-modal");
    if (districtModal) districtModal.classList.add("hidden");
  }

  function initOccupyConfirmModal() {
    const root = document.getElementById("occupy-confirm-modal");
    const backdrop = document.getElementById("occupy-confirm-modal-backdrop");
    const closeBtn = document.getElementById("occupy-confirm-modal-close");
    const cancelBtn = document.getElementById("occupy-confirm-modal-cancel");
    const confirmBtn = document.getElementById("occupy-confirm-modal-confirm");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeOccupyConfirmModal);
    if (closeBtn) closeBtn.addEventListener("click", closeOccupyConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeOccupyConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener("click", startOccupyActionFromModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeOccupyConfirmModal();
      }
    });
  }

  function closeTrapConfirmModal() {
    const root = document.getElementById("trap-confirm-modal");
    if (root) root.classList.add("hidden");
    trapConfirmModalState = { districtId: null };
  }

  function renderTrapConfirmModal() {
    const root = document.getElementById("trap-confirm-modal");
    const districtEl = document.getElementById("trap-confirm-modal-district");
    const cooldownEl = document.getElementById("trap-confirm-modal-cooldown");
    const noteEl = document.getElementById("trap-confirm-modal-note");
    const confirmBtn = document.getElementById("trap-confirm-modal-confirm");
    if (!root || root.classList.contains("hidden")) return;
    if (!districtEl || !cooldownEl || !noteEl || !confirmBtn) return;

    const district = resolveDistrictById(trapConfirmModalState.districtId);
    const trapState = getDistrictTrapControlState(district);
    const currentPlacement = getCurrentPlayerTrapPlacement();
    districtEl.textContent = district?.name || `Distrikt #${district?.id ?? "-"}`;
    cooldownEl.textContent = `${Math.floor(TRAP_MOVE_COOLDOWN_MS / 1000)}s`;

    let canConfirm = true;
    let noteText = "Opravdu chceš vložit past do tohoto districtu? Po nastražení ji nebude možné 20s přesunout.";
    if (!district) {
      canConfirm = false;
      noteText = "Nejprve vyber distrikt.";
    } else if (!isDistrictDefendableByPlayer(district)) {
      canConfirm = false;
      noteText = "Past lze nastražit jen do vlastního nebo aliančního districtu.";
    } else if (isDistrictDestroyed(district)) {
      canConfirm = false;
      noteText = "Do zničeného districtu nelze nastražit past.";
    } else if (trapState?.isActiveHere) {
      canConfirm = false;
      noteText = trapState.moveLocked
        ? `Past už v tomto districtu běží. Přesun bude možný za ${trapState.countdownLabel}.`
        : "Past už je v tomto districtu aktivní.";
    } else if (trapState?.moveLocked) {
      canConfirm = false;
      noteText = `Past je zamčená v ${currentPlacement?.districtName || `distriktu #${currentPlacement?.districtId ?? "-"}`}. Přesun bude možný za ${trapState.countdownLabel}.`;
    } else if (trapState?.hasTrapElsewhere) {
      noteText = `Přesuneš svou jedinou past z ${currentPlacement?.districtName || `distriktu #${currentPlacement?.districtId ?? "-"}`} do tohoto districtu. Po potvrzení poběží nový cooldown 20s.`;
    }

    noteEl.textContent = noteText;
    confirmBtn.disabled = !canConfirm;
  }

  function openTrapConfirmModal(district) {
    const root = document.getElementById("trap-confirm-modal");
    if (!root) return;
    trapConfirmModalState = { districtId: district?.id ?? null };
    root.classList.remove("hidden");
    renderTrapConfirmModal();
  }

  function placeTrapFromModal() {
    const district = resolveDistrictById(trapConfirmModalState.districtId);
    if (!district) {
      renderTrapConfirmModal();
      return;
    }
    if (!isDistrictDefendableByPlayer(district)) {
      pushEvent("Past lze nastražit jen do vlastního nebo aliančního districtu.");
      renderTrapConfirmModal();
      return;
    }
    if (isDistrictDestroyed(district)) {
      pushEvent("Do zničeného districtu nelze nastražit past.");
      renderTrapConfirmModal();
      return;
    }
    const result = setCurrentPlayerTrapDistrict(district);
    if (!result?.ok) {
      if (result?.reason === "move_locked") {
        pushEvent(`Past nelze přesunout ještě ${formatTrapMoveCooldownLabel(result.moveCooldownRemainingMs)}.`);
      } else {
        pushEvent("Past se nepodařilo nastražit.");
      }
      renderTrapConfirmModal();
      return;
    }
    const districtLabel = district?.name || `Distrikt #${district?.id ?? "-"}`;
    pushEvent(
      result.moved
        ? `Past přesunuta do districtu ${districtLabel}. Přesun bude znovu možný za 20s.`
        : `Past nastražena do districtu ${districtLabel}. Přesun bude znovu možný za 20s.`
    );
    closeTrapConfirmModal();
    window.Empire.Map?.refreshSelectedDistrictModal?.();
  }

  function initTrapConfirmModal() {
    const root = document.getElementById("trap-confirm-modal");
    const backdrop = document.getElementById("trap-confirm-modal-backdrop");
    const closeBtn = document.getElementById("trap-confirm-modal-close");
    const cancelBtn = document.getElementById("trap-confirm-modal-cancel");
    const confirmBtn = document.getElementById("trap-confirm-modal-confirm");
    if (!root) return;

    if (backdrop) backdrop.addEventListener("click", closeTrapConfirmModal);
    if (closeBtn) closeBtn.addEventListener("click", closeTrapConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeTrapConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener("click", placeTrapFromModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeTrapConfirmModal();
      }
    });
  }

  function normalizeOwnerName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getPlayerOwnerNameSet() {
    const player = window.Empire.player || {};
    const names = [
      activeScenarioOwnerName,
      player.gangName,
      player.gang_name,
      player.gang,
      player.username,
      player.name,
      cachedProfile?.gangName,
      cachedProfile?.gang_name,
      cachedProfile?.gang,
      cachedProfile?.username,
      cachedProfile?.name,
      localStorage.getItem("empire_guest_username"),
      localStorage.getItem("empire_gang_name")
    ]
      .map((value) => normalizeOwnerName(value))
      .filter(Boolean);
    return new Set(names);
  }

  function resolveCurrentPlayerOwnerKey() {
    const player = window.Empire.player || {};
    const candidates = [
      activeScenarioOwnerName,
      player.username,
      player.name,
      player.gangName,
      player.gang_name,
      player.gang,
      cachedProfile?.username,
      cachedProfile?.name,
      cachedProfile?.gangName,
      cachedProfile?.gang_name,
      cachedProfile?.gang,
      localStorage.getItem("empire_guest_username"),
      localStorage.getItem("empire_gang_name")
    ];
    return candidates.map((value) => normalizeOwnerName(value)).find(Boolean) || "guest-player";
  }

  function resolveActiveScenarioOwnerName() {
    return String(activeScenarioOwnerName || resolveScenarioOwnerName() || "").trim();
  }

  function isDistrictDestroyed(district) {
    if (!district || typeof district !== "object") return false;
    return Boolean(district.isDestroyed || district.is_destroyed || district.destroyed);
  }

  function isDistrictOwnedByPlayer(district) {
    if (isDistrictDestroyed(district)) return false;
    const owner = normalizeOwnerName(district?.owner);
    if (!owner) return false;
    return getPlayerOwnerNameSet().has(owner);
  }

  function isDistrictOwnedByAlliance(district) {
    if (isDistrictDestroyed(district)) return false;
    const owner = normalizeOwnerName(district?.owner);
    if (!owner) return false;
    if (isDistrictOwnedByPlayer(district)) return false;
    return getActiveAllianceOwnerNames().has(owner);
  }

  function isDistrictDefendableByPlayer(district) {
    return isDistrictOwnedByPlayer(district) || isDistrictOwnedByAlliance(district);
  }

  function resolveDistrictById(districtId, districts = window.Empire.districts) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    if (districtId == null) return null;
    const targetKey = String(districtId);
    return safeDistricts.find((district) => String(district?.id) === targetKey) || null;
  }

  function isDistrictAdjacentToOwnedTerritory(district, { includeAllianceTerritory = false } = {}) {
    const safeDistrict = district || window.Empire.selectedDistrict;
    if (!safeDistrict?.id) return false;
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    if (!districts.length) return false;

    const targetDistrict = resolveDistrictById(safeDistrict.id, districts);
    if (!targetDistrict) return false;

    const adjacency = buildDistrictAdjacency(districts);
    const neighbors = adjacency.get(targetDistrict.id);
    if (!neighbors || !neighbors.size) return false;

    const allowedOwnerNames = new Set(getPlayerOwnerNameSet());
    if (includeAllianceTerritory) {
      getActiveAllianceOwnerNames().forEach((name) => {
        allowedOwnerNames.add(name);
      });
    }

    if (!allowedOwnerNames.size) return false;

    const districtsById = new Map(districts.map((item) => [item.id, item]));
    for (const neighborId of neighbors) {
      const neighbor = districtsById.get(neighborId);
      if (!neighbor) continue;
      const owner = normalizeOwnerName(neighbor.owner);
      if (owner && allowedOwnerNames.has(owner)) {
        return true;
      }
    }

    return false;
  }

  function evaluateRaidAdjacencyAvailability(district) {
    const safeDistrict = district || window.Empire.selectedDistrict;
    if (!safeDistrict?.id) {
      return { allowed: false, reason: "Nejprve vyber distrikt." };
    }
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    if (!districts.length) {
      return { allowed: false, reason: "Nepodařilo se načíst mapu distriktů." };
    }

    const targetDistrict = resolveDistrictById(safeDistrict.id, districts);
    if (!targetDistrict) {
      return { allowed: false, reason: "Vybraný distrikt se nepodařilo dohledat." };
    }

    const adjacency = buildDistrictAdjacency(districts);
    const targetNeighbors = adjacency.get(targetDistrict.id);
    if (!targetNeighbors || !targetNeighbors.size) {
      return { allowed: false, reason: "Vykrást můžeš jen sousední distrikt." };
    }

    const playerOwnerNames = new Set(getPlayerOwnerNameSet());
    const allianceOwnerNames = new Set(
      Array.from(getActiveAllianceOwnerNames()).filter((ownerName) => ownerName && !playerOwnerNames.has(ownerName))
    );
    const districtsById = new Map(districts.map((entry) => [entry.id, entry]));

    for (const neighborId of targetNeighbors) {
      const neighbor = districtsById.get(neighborId);
      const owner = normalizeOwnerName(neighbor?.owner);
      if (owner && playerOwnerNames.has(owner)) {
        return { allowed: true, reason: "", mode: "player" };
      }
    }

    if (!allianceOwnerNames.size) {
      return {
        allowed: false,
        reason: "Vykrást můžeš jen distrikt, který sousedí s tvým distriktem nebo s kvalifikovaným aliančním distriktem."
      };
    }

    const alliedAdjacencyCounts = new Map();
    districts.forEach((entry) => {
      const owner = normalizeOwnerName(entry?.owner);
      if (!owner || !allianceOwnerNames.has(owner) || isDistrictDestroyed(entry)) return;
      const neighbors = adjacency.get(entry.id);
      if (!neighbors || !neighbors.size) return;
      for (const neighborId of neighbors) {
        const neighbor = districtsById.get(neighborId);
        const neighborOwner = normalizeOwnerName(neighbor?.owner);
        if (neighborOwner && playerOwnerNames.has(neighborOwner)) {
          alliedAdjacencyCounts.set(owner, (alliedAdjacencyCounts.get(owner) || 0) + 1);
          break;
        }
      }
    });

    const qualifiedAllianceOwners = new Set(
      Array.from(alliedAdjacencyCounts.entries())
        .filter(([, count]) => Number(count) >= 2)
        .map(([owner]) => owner)
    );

    for (const neighborId of targetNeighbors) {
      const neighbor = districtsById.get(neighborId);
      const owner = normalizeOwnerName(neighbor?.owner);
      if (owner && qualifiedAllianceOwners.has(owner)) {
        return { allowed: true, reason: "", mode: "alliance" };
      }
    }

    return {
      allowed: false,
      reason: "Vykrást můžeš jen distrikt, který sousedí s tvým distriktem nebo s distriktem spojence, který má aspoň 2 sousední distrikty s tvým územím."
    };
  }

  function evaluateDistrictActionAvailability(district, action) {
    if (!district) {
      return { allowed: false, reason: "Nejprve vyber distrikt." };
    }
    const districtId = Number(district?.id);
    const onboardingDemoActive = activePlayerScenarioKey === "onboarding-20-edge" && scenarioVisionEnabled && !window.Empire.token;
    if (isDistrictDestroyed(district)) {
      return { allowed: false, reason: "Distrikt je zničený a nepoužitelný." };
    }

    if (hasActivePoliceRaidImpactLock("allActionsBlocked") || isPoliceRaidAllActionsBlocked()) {
      return { allowed: false, reason: "Během policejní razie jsou všechny akce dočasně zakázány." };
    }

    if (action === "attack" && hasActivePoliceRaidImpactLock("attackBlocked")) {
      return { allowed: false, reason: "Během policejní razie je útok dočasně zakázán." };
    }
    if (action === "occupy" && hasActivePoliceRaidImpactLock("occupyBlocked")) {
      return { allowed: false, reason: "Během policejní razie je obsazování dočasně zakázáno." };
    }

    if (isDistrictDefendableByPlayer(district)) {
      if (action === "attack") {
        return { allowed: false, reason: "Vlastní nebo alianční distrikt nelze napadnout. Použij Obranu." };
      }
      if (action === "raid") {
        return { allowed: false, reason: "Vlastní nebo alianční distrikt nelze vykrást. Použij Obranu." };
      }
      if (action === "spy") {
        return { allowed: false, reason: "Vlastní nebo alianční distrikt nelze špehovat. Použij Obranu." };
      }
    }

    if (action === "attack") {
      if (onboardingDemoActive && districtId === ONBOARDING_TUTORIAL_ATTACK_DISTRICT_ID) {
        return { allowed: true, reason: "" };
      }
      if (isDistrictUnownedForSpyOutcome(district) && !getDistrictSpyIntel(district?.id)) {
        return { allowed: false, reason: "Na neobsazený distrikt musí nejdřív proběhnout úspěšné špehování." };
      }
      if (isDistrictUnownedForSpyOutcome(district) && getDistrictSpyIntel(district?.id)) {
        return { allowed: false, reason: "Pro prázdný vyspěhovaný distrikt použij akci Obsadit." };
      }
      const targetAttackLockMs = getAttackTargetLockRemainingMs(district?.owner);
      if (targetAttackLockMs > 0) {
        return {
          allowed: false,
          reason: `Na hráče ${String(district?.ownerNick || district?.owner || "Neznámý").trim() || "Neznámý"} nemůžeš po aktivaci pasti útočit ještě ${formatDurationLabel(targetAttackLockMs)}.`
        };
      }
      const adjacent = isDistrictAdjacentToOwnedTerritory(district, { includeAllianceTerritory: false });
      return adjacent
        ? { allowed: true, reason: "" }
        : { allowed: false, reason: "Útočit můžeš jen na distrikt, který sousedí s tvým dobytým distriktem." };
    }

    if (action === "occupy") {
      if (onboardingDemoActive && districtId === ONBOARDING_TUTORIAL_SPY_DISTRICT_ID) {
        if (!getDistrictSpyIntel(district?.id)) {
          return { allowed: false, reason: "Nejdřív musí proběhnout úspěšné špehování tohoto distriktu." };
        }
        return { allowed: true, reason: "" };
      }
      if (!isDistrictUnownedForSpyOutcome(district)) {
        return { allowed: false, reason: "Obsadit lze jen neobsazený distrikt." };
      }
      if (!getDistrictSpyIntel(district?.id)) {
        return { allowed: false, reason: "Nejdřív musí proběhnout úspěšné špehování tohoto distriktu." };
      }
      const adjacent = isDistrictAdjacentToOwnedTerritory(district, { includeAllianceTerritory: true });
      return adjacent
        ? { allowed: true, reason: "" }
        : { allowed: false, reason: "Obsadit můžeš jen distrikt sousedící s tvým nebo aliančním distriktem." };
    }

    if (action === "raid" || action === "spy") {
      if (action === "spy" && hasActivePoliceRaidImpactLock("spyBlocked")) {
        return { allowed: false, reason: "Během policejní razie je špehování dočasně zakázáno." };
      }
      if (action === "raid" && hasActivePoliceRaidImpactLock("raidBlocked")) {
        return { allowed: false, reason: "Během policejní razie je vykrádání dočasně zakázáno." };
      }
      if (onboardingDemoActive && districtId === ONBOARDING_TUTORIAL_SPY_DISTRICT_ID) {
        return { allowed: true, reason: "" };
      }
      if (action === "raid") {
        const districtRaidLockMs = getDistrictRaidLockRemainingMs(districtId);
        if (districtRaidLockMs > 0) {
          return {
            allowed: false,
            reason: `Distrikt je po krádeži zamčený ještě ${formatAttackDurationLabel(districtRaidLockMs)}.`
          };
        }
        return evaluateRaidAdjacencyAvailability(district);
      }
      const adjacent = isDistrictAdjacentToOwnedTerritory(district, { includeAllianceTerritory: true });
      return adjacent
        ? { allowed: true, reason: "" }
        : { allowed: false, reason: "Špehovat můžeš jen distrikt, který sousedí s tvým nebo aliančním distriktem." };
    }

    return { allowed: false, reason: "Akci nelze provést." };
  }

  function resolveCombatWeaponAccess(mode, gangMembers = countPlayerControlledPopulation(cachedProfile || window.Empire.player || {})) {
    const stats = mode === "defense" ? defenseWeaponStats : attackWeaponStats;
    const sorted = Array.isArray(stats) ? stats : [];
    const currentMembers = Math.max(0, Math.floor(Number(gangMembers) || 0));
    const unlocked = sorted.filter((item) => currentMembers >= Number(item.requiredMembers || 0));
    return {
      allowed: unlocked.length > 0,
      currentMembers,
      weapon: unlocked.length ? unlocked[unlocked.length - 1] : null,
      nextRequiredMembers: unlocked.length < sorted.length ? Number(sorted[unlocked.length]?.requiredMembers || 0) : null
    };
  }

  function buildWeaponDetailMap(stats, quantity = DEMO_WEAPON_STACK_SIZE) {
    return (Array.isArray(stats) ? stats : []).reduce((acc, item) => {
      if (!item?.name) return acc;
      acc[item.name] = Math.max(0, Math.floor(Number(quantity) || 0));
      return acc;
    }, {});
  }

  function createDemoWeaponLoadout(quantity = DEMO_WEAPON_STACK_SIZE) {
    const attackDetail = buildWeaponDetailMap(attackWeaponStats, quantity);
    const defenseDetail = buildWeaponDetailMap(defenseWeaponStats, quantity);
    return {
      weaponsDetail: attackDetail,
      defenseDetail,
      weapons: getAttackWeaponTotal(attackDetail),
      defense: getDefenseWeaponTotal(defenseDetail)
    };
  }

  function createOnboardingDemoEconomy() {
    const loadout = createDemoWeaponLoadout(1);
    return {
      cleanMoney: 1200,
      dirtyMoney: 800,
      balance: 2000,
      drugs: 6,
      materials: 12,
      influence: 8,
      spyCount: 2,
      spies: 2,
      drugInventory: {
        neonDust: 3,
        pulseShot: 1,
        velvetSmoke: 1,
        ghostSerum: 1,
        overdriveX: 0
      },
      activeDrugs: {},
      ...loadout
    };
  }

  function resolveDemoOwnerFaction(ownerName) {
    const safeOwner = String(ownerName || "").trim();
    if (!safeOwner) return DEMO_OWNER_FACTIONS[0];
    const index = hashDistrictSeed(`${safeOwner}:faction`, safeOwner.length) % DEMO_OWNER_FACTIONS.length;
    return DEMO_OWNER_FACTIONS[index];
  }

  function resolveDemoOwnerAvatar(ownerName) {
    const safeOwner = String(ownerName || "").trim();
    if (!safeOwner) return DEMO_OWNER_AVATAR_POOL[0];
    const index = hashDistrictSeed(`${safeOwner}:avatar`, safeOwner.length) % DEMO_OWNER_AVATAR_POOL.length;
    return DEMO_OWNER_AVATAR_POOL[index];
  }

  function resolveDemoDistrictAtmosphere(district, ownerName) {
    const safeType = String(district?.type || "").trim().toLowerCase();
    const pool = DEMO_DISTRICT_ATMOSPHERES[safeType] || DEMO_DISTRICT_ATMOSPHERES.default;
    const safeOwner = String(ownerName || district?.owner || "").trim();
    const index = hashDistrictSeed(`${safeOwner}:${district?.id ?? ""}:${safeType}`, pool.length) % pool.length;
    return pool[index];
  }

  function buildDemoDistrictOwnerMeta(ownerName, district) {
    const safeOwner = String(ownerName || "").trim();
    if (!safeOwner) {
      return {
        ownerStructure: null,
        ownerFaction: null,
        ownerAvatar: null,
        ownerAtmosphere: null
      };
    }
    const faction = resolveDemoOwnerFaction(safeOwner);
    return {
      ownerStructure: faction,
      ownerFaction: faction,
      ownerAvatar: resolveDemoOwnerAvatar(safeOwner),
      ownerAtmosphere: resolveDemoDistrictAtmosphere(district, safeOwner)
    };
  }

  function getActiveAllianceOwnerNames() {
    return scenarioVisionEnabled ? scenarioAllianceOwnerNames : liveAllianceOwnerNames;
  }

  function getActiveEnemyOwnerNames() {
    return scenarioVisionEnabled ? scenarioEnemyOwnerNames : EMPTY_OWNER_NAMES;
  }

  function setScenarioVisionMode(enabled) {
    scenarioVisionEnabled = Boolean(enabled);
    if (!scenarioVisionEnabled) {
      scenarioUniqueOwnerColors = false;
    } else if (!window.Empire.token) {
      processSpyRecoveryQueue({ notify: false });
      const baseSpies = resolveFactionBaseSpyCount(cachedProfile?.structure || localStorage.getItem("empire_structure"));
      const storedSpyCount = readStoredSpyCount();
      const hasPendingRecoveries = readSpyRecoveryQueue().length > 0;
      if (storedSpyCount == null || (getSpyCount() <= 0 && !hasPendingRecoveries)) {
        setSpyCount(baseSpies, { persist: true });
      } else {
        renderInfluenceSpyTopbarStat();
      }
      syncSpyRecoveryTicker();
    }
    syncMapVisionContext();
  }

  function setScenarioAllianceOwners(ownerNames) {
    const normalized = Array.isArray(ownerNames)
      ? ownerNames.map((value) => normalizeOwnerName(value)).filter(Boolean)
      : [];
    scenarioAllianceOwnerNames = new Set(normalized);
    syncMapVisionContext();
  }

  function setScenarioEnemyOwners(ownerNames) {
    const normalized = Array.isArray(ownerNames)
      ? ownerNames.map((value) => normalizeOwnerName(value)).filter(Boolean)
      : [];
    scenarioEnemyOwnerNames = new Set(normalized);
    syncMapVisionContext();
  }

  function setScenarioAllianceIcons(entries) {
    setAllianceIconMap(scenarioAllianceIconByName, entries);
  }

  function setLiveAllianceOwnersFromAlliance(alliance) {
    const playerNames = getPlayerOwnerNameSet();
    const names = new Set();
    const members = Array.isArray(alliance?.members) ? alliance.members : [];
    members.forEach((member) => {
      const candidates = [member?.gang_name, member?.gangName, member?.username];
      candidates.forEach((candidate) => {
        const normalized = normalizeOwnerName(candidate);
        if (!normalized) return;
        if (playerNames.has(normalized)) return;
        names.add(normalized);
      });
    });
    liveAllianceOwnerNames = names;
    const iconEntries = [];
    const allianceName = String(alliance?.name || "").trim();
    if (allianceName) {
      iconEntries.push([
        allianceName,
        String(alliance?.icon_key || alliance?.iconKey || DEFAULT_ALLIANCE_ICON_KEY).trim() || DEFAULT_ALLIANCE_ICON_KEY
      ]);
    }
    setAllianceIconMap(liveAllianceIconByName, iconEntries);
    syncMapVisionContext();
  }

  function clearLiveAllianceOwners() {
    liveAllianceOwnerNames = new Set();
    liveAllianceIconByName = new Map();
    syncMapVisionContext();
  }

  function normalizeMapBorderMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === MAP_BORDER_MODE_WHITE || mode === MAP_BORDER_MODE_BLACK || mode === MAP_BORDER_MODE_PLAYER) {
      return mode;
    }
    return MAP_BORDER_MODE_PLAYER;
  }

  function resolveStoredMapBorderMode() {
    return normalizeMapBorderMode(localStorage.getItem(MAP_BORDER_MODE_STORAGE_KEY));
  }

  function resolveMapBorderPlayerColor() {
    return normalizeHexColor(localStorage.getItem("empire_gang_color")) || "#22d3ee";
  }

  function resolveStoredUnknownNeutralFillEnabled() {
    return localStorage.getItem(MAP_UNKNOWN_NEUTRAL_FILL_STORAGE_KEY) === "1";
  }

  function applyMapBorderSwitchVisuals() {
    const root = document.getElementById("map-border-switch");
    if (root) {
      root.style.setProperty("--map-border-player-color", resolveMapBorderPlayerColor());
    }
    const swatches = Array.from(document.querySelectorAll("[data-map-border-color]"));
    if (!swatches.length) return;
    swatches.forEach((swatch) => {
      const mode = normalizeMapBorderMode(swatch.dataset.mapBorderColor);
      swatch.classList.toggle("is-active", mode === selectedMapBorderMode);
      swatch.setAttribute("aria-pressed", mode === selectedMapBorderMode ? "true" : "false");
    });
    const neutralToggle = document.getElementById("map-unknown-neutral-fill-toggle");
    if (neutralToggle) {
      neutralToggle.classList.toggle("is-active", unknownNeutralFillEnabled);
      neutralToggle.setAttribute("aria-pressed", unknownNeutralFillEnabled ? "true" : "false");
    }
  }

  function applyMapBorderMode(mode, options = {}) {
    const nextMode = normalizeMapBorderMode(mode);
    selectedMapBorderMode = nextMode;
    if (options.persist !== false) {
      localStorage.setItem(MAP_BORDER_MODE_STORAGE_KEY, nextMode);
    }
    applyMapBorderSwitchVisuals();
    syncMapVisionContext();
  }

  function initMapBorderModeControls() {
    const swatches = Array.from(document.querySelectorAll("[data-map-border-color]"));
    swatches.forEach((swatch) => {
      swatch.addEventListener("click", () => {
        applyMapBorderMode(swatch.dataset.mapBorderColor);
      });
    });
    const neutralToggle = document.getElementById("map-unknown-neutral-fill-toggle");
    if (neutralToggle) {
      neutralToggle.addEventListener("click", () => {
        unknownNeutralFillEnabled = !unknownNeutralFillEnabled;
        localStorage.setItem(
          MAP_UNKNOWN_NEUTRAL_FILL_STORAGE_KEY,
          unknownNeutralFillEnabled ? "1" : "0"
        );
        applyMapBorderSwitchVisuals();
        syncMapVisionContext();
      });
    }
    applyMapBorderMode(selectedMapBorderMode, { persist: false });
  }

  function syncMapVisionContext() {
    if (!window.Empire.Map?.setVisionContext) return;
    const settings = getSettingsState();
    window.Empire.Map.setVisionContext({
      fogPreviewMode: scenarioVisionEnabled,
      alliedOwnerNames: Array.from(getActiveAllianceOwnerNames()),
      enemyOwnerNames: Array.from(getActiveEnemyOwnerNames()),
      allowEnemyModalIntelInFog: scenarioVisionEnabled,
      uniqueOwnerColors: scenarioVisionEnabled && scenarioUniqueOwnerColors,
      districtBorderMode: selectedMapBorderMode,
      unknownNeutralFillEnabled,
      showDistrictBorders: Boolean(settings.mapDistrictBorders),
      showAllianceSymbols: Boolean(settings.mapAllianceSymbols),
      districtVisibilityMode: normalizeMapVisibilityMode(settings.mapVisibilityMode)
    });
  }

  function resolveMoneyBreakdown(source) {
    const fromClean = Number(source?.cleanMoney ?? source?.clean_money ?? 0);
    const fromDirty = Number(source?.dirtyMoney ?? source?.dirty_money ?? 0);
    const fromTotal = Number(source?.balance ?? source?.money ?? 0);
    let cleanMoney = Number.isFinite(fromClean) ? fromClean : 0;
    let dirtyMoney = Number.isFinite(fromDirty) ? fromDirty : 0;
    let totalMoney = cleanMoney + dirtyMoney;

    if (totalMoney === 0 && fromTotal > 0) {
      cleanMoney = fromTotal;
      totalMoney = fromTotal;
    } else if (fromTotal > totalMoney) {
      cleanMoney += fromTotal - totalMoney;
      totalMoney = fromTotal;
    }

    return { cleanMoney, dirtyMoney, totalMoney };
  }

  function applyMoneyToProfileSnapshot(profile, moneySource) {
    const baseProfile = profile && typeof profile === "object" ? profile : {};
    const money = resolveMoneyBreakdown(moneySource);
    return {
      ...baseProfile,
      cleanMoney: money.cleanMoney,
      dirtyMoney: money.dirtyMoney,
      money: money.totalMoney,
      balance: money.totalMoney,
      cash: money.cleanMoney,
      dirtyCash: money.dirtyMoney
    };
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return null;
    if (/^#[0-9a-f]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
    }
    if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
    return null;
  }

  function formatDurationLabel(ms) {
    const safe = Math.max(0, Math.floor(Number(ms) || 0));
    const totalMinutes = Math.ceil(safe / 60000);
    if (totalMinutes <= 1) return "1 min";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  function pickRandomPoliceRaidSpecialtyKey() {
    const weighted = POLICE_RAID_SPECIALTY_RANDOM_WEIGHTS
      .map((entry) => ({
        key: String(entry?.key || "").trim().toLowerCase(),
        weight: Math.max(0, Number(entry?.weight || 0))
      }))
      .filter((entry) => entry.key && entry.weight > 0);
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return "total";
    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.key;
    }
    return weighted[weighted.length - 1]?.key || "total";
  }

  function resolvePoliceRaidSpecialtyKey(tier, detail = {}) {
    const explicitType = String(
      detail?.operationType
      || detail?.operation_type
      || detail?.type
      || detail?.raidSpecialtyKey
      || detail?.raidSpecialty
      || ""
    ).trim().toLowerCase();
    if (explicitType.includes("stealth") || explicitType.includes("shadow") || explicitType.includes("covert")) return "financial";
    if (explicitType.includes("money") || explicitType.includes("cash") || explicitType.includes("bank") || explicitType.includes("finance") || explicitType.includes("economic")) return "financial";
    if (explicitType.includes("drug") || explicitType.includes("narc") || explicitType.includes("chem") || explicitType.includes("dealer") || explicitType.includes("lab")) return "drug";
    if (explicitType.includes("weapon") || explicitType.includes("armory") || explicitType.includes("gun") || explicitType.includes("combat") || explicitType.includes("military")) return "weapons";
    if (explicitType.includes("police") || explicitType.includes("law") || explicitType.includes("order") || explicitType.includes("arrest") || explicitType.includes("control") || explicitType.includes("security")) return "arrests";
    if (explicitType.includes("cash") || explicitType.includes("dirty") || explicitType.includes("money")) return "financial";
    if (explicitType.includes("drug")) return "drug";
    if (explicitType.includes("warehouse") || explicitType.includes("building") || explicitType.includes("weapon")) return "weapons";
    if (explicitType.includes("apartment") || explicitType.includes("district_lock") || explicitType.includes("arrest")) return "arrests";
    return pickRandomPoliceRaidSpecialtyKey();
  }

  function resolvePoliceRaidSpecialty(tier, detail = {}) {
    const key = resolvePoliceRaidSpecialtyKey(tier, detail);
    return {
      key,
      ...(POLICE_RAID_SPECIALTIES[key] || POLICE_RAID_SPECIALTIES.total)
    };
  }

  function resolveStoredPoliceRaidSpecialty(detail = {}) {
    const explicitKey = String(
      detail?.raidSpecialtyKey
      || detail?.raid_specialty_key
      || detail?.raidSpecialty
      || ""
    ).trim().toLowerCase();
    if (!explicitKey) return null;
    const meta = POLICE_RAID_SPECIALTIES[explicitKey];
    if (!meta) return null;
    return { key: explicitKey, ...meta };
  }

  function resolvePoliceRaidSpecialtyFromOperationType(operationType, detail = {}) {
    const stored = resolveStoredPoliceRaidSpecialty(detail);
    if (stored) return stored;
    const normalized = String(
      operationType
      || detail?.operationType
      || detail?.type
      || ""
    ).trim().toLowerCase();
    if (!normalized) return null;
    if (normalized.includes("stealth") || normalized.includes("shadow") || normalized.includes("covert")) return POLICE_RAID_SPECIALTIES.financial;
    if (normalized.includes("cash") || normalized.includes("dirty")) return POLICE_RAID_SPECIALTIES.financial;
    if (normalized.includes("money") || normalized.includes("finance") || normalized.includes("economic") || normalized.includes("bank")) return POLICE_RAID_SPECIALTIES.financial;
    if (normalized.includes("drug") || normalized.includes("warehouse") || normalized.includes("dealer") || normalized.includes("chem") || normalized.includes("lab")) return POLICE_RAID_SPECIALTIES.drug;
    if (normalized.includes("weapon") || normalized.includes("building_shutdown") || normalized.includes("armory") || normalized.includes("gun") || normalized.includes("combat")) return POLICE_RAID_SPECIALTIES.weapons;
    if (normalized.includes("apartment") || normalized.includes("district_lock") || normalized.includes("arrest") || normalized.includes("police") || normalized.includes("law") || normalized.includes("order")) return POLICE_RAID_SPECIALTIES.arrests;
    if (normalized.includes("coordinated")) return POLICE_RAID_SPECIALTIES.total;
    if (normalized.includes("warning") || normalized.includes("control")) return POLICE_RAID_SPECIALTIES.financial;
    return null;
  }

  function resolvePoliceRaidImpactSpecialty(detail = {}, tier = 1) {
    return resolveStoredPoliceRaidSpecialty(detail)
      || resolvePoliceRaidSpecialtyFromOperationType(detail?.operationType, detail)
      || resolvePoliceRaidSpecialty(tier, detail);
  }

  function resolvePoliceRaidLossMultiplier(specialtyKey, lossKey) {
    const specialty = POLICE_RAID_SPECIALTY_LOSS_MULTIPLIERS[String(specialtyKey || "").trim().toLowerCase()]
      || POLICE_RAID_SPECIALTY_LOSS_MULTIPLIERS.total;
    const multiplier = Number(specialty?.[lossKey]);
    return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  }

  function scalePoliceRaidLossPct(value, specialtyKey, lossKey, maxPct = 100) {
    const safeValue = Math.max(0, Number(value) || 0);
    const nextValue = Math.round(safeValue * resolvePoliceRaidLossMultiplier(specialtyKey, lossKey));
    return Math.max(0, Math.min(maxPct, nextValue));
  }

  function resolveStoredGangColor() {
    return normalizeHexColor(localStorage.getItem("empire_gang_color"));
  }

  function resolveActiveProfileAvatar() {
    return scenarioProfileAvatarOverride || localStorage.getItem("empire_avatar") || null;
  }

  function applyProfileModalVisuals(avatarSrc = null) {
    const content = document.querySelector("#profile-modal .modal__content");
    if (!content) return;
    const gangColor = resolveStoredGangColor();
    const fallback = "rgba(34, 211, 238, 0.45)";
    content.style.setProperty("--profile-border-color", gangColor || fallback);
    if (avatarSrc) {
      const safe = String(avatarSrc).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      content.style.setProperty("--profile-avatar-url", `url("${safe}")`);
    } else {
      content.style.setProperty("--profile-avatar-url", "none");
    }
  }

  function formatGangColorText(color) {
    return color ? color.toUpperCase() : "Nevybráno";
  }

  function renderGangColorChipMarkup(color) {
    const label = formatGangColorText(color);
    const dotClass = color ? "gang-color-chip__dot" : "gang-color-chip__dot is-empty";
    const dotStyle = color ? ` style="background:${color}"` : "";
    const textStyle = color ? ` style="color:${color}"` : "";
    return `
      <span class="gang-color-chip">
        <span class="${dotClass}"${dotStyle}></span>
        <span${textStyle}>${label}</span>
      </span>
    `;
  }

  function refreshGangColorDisplays() {
    applyProfileModalVisuals(resolveActiveProfileAvatar());
    applyMapBorderSwitchVisuals();
  }

  function initPlayerScenarioButtons() {
    const scenarioButtons = Array.from(document.querySelectorAll("[data-player-scenario]"));
    if (!scenarioButtons.length) return;
    try {
      localStorage.removeItem(PLAYER_SCENARIO_STORAGE_KEY);
    } catch {}

    const setActiveScenarioButton = (scenarioKey) => {
      scenarioButtons.forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate.dataset.playerScenario === scenarioKey);
      });
    };

    scenarioButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const scenarioKey = button.dataset.playerScenario;
        applyPlayerScenario(scenarioKey);
        setActiveScenarioButton(String(scenarioKey || ""));
        refreshGuestBannerVisibility();
      });
    });
  }

  function cloneScenarioPolygon(polygon) {
    return (Array.isArray(polygon) ? polygon : []).map((point) => [
      Number(point?.[0] || 0),
      Number(point?.[1] || 0)
    ]);
  }

  function resolveScenarioSourceDistricts() {
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    return districts
      .map((district) => {
        const basePolygon = Array.isArray(district?.basePolygon) && district.basePolygon.length
          ? cloneScenarioPolygon(district.basePolygon)
          : cloneScenarioPolygon(district?.polygon);
        return {
          ...district,
          basePolygon,
          polygon: basePolygon
        };
      })
      .sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0));
  }

  function applyPlayerScenario(scenarioKey) {
    const districts = resolveScenarioSourceDistricts();
    if (!districts.length || !window.Empire.Map?.setDistricts) {
      pushEvent("Mapa ještě není připravená.");
      return;
    }
    activePlayerScenarioKey = String(scenarioKey || "");
    activeScenarioOwnerName = "";
    const normalizedScenarioKey = activePlayerScenarioKey === "alliance-ten-blackout"
        ? "alliance-ten"
        : activePlayerScenarioKey;
    const forcedMapMode = activePlayerScenarioKey === "alliance-ten-blackout"
      ? "blackout"
      : "";

    const ownerName = resolveScenarioOwnerName();
    activeScenarioOwnerName = ownerName;
    const allyName = `${ownerName} - spojenec`;
    scenarioUniqueOwnerColors = false;
    scenarioProfileAvatarOverride = normalizedScenarioKey === "onboarding-20-edge" ? ONBOARDING_PROFILE_AVATAR : null;
    setScenarioAllianceIcons([]);
    syncMapVisionContext();
    const mapScenarioDistrictOwner = (district, owner = null) => ({
      ...district,
      owner: owner || null,
      ownerPlayerId: null,
      ownerNick: null,
      ownerAllianceName: null,
      ownerStructure: owner ? resolveDemoOwnerFaction(owner) : null,
      ownerFaction: owner ? resolveDemoOwnerFaction(owner) : null,
      ownerAvatar: owner ? resolveDemoOwnerAvatar(owner) : null,
      ownerAtmosphere: owner ? resolveDemoDistrictAtmosphere(district, owner) : null,
      isDestroyed: false,
      destroyedAt: null
    });
    let nextDistricts = districts.map((district) => mapScenarioDistrictOwner(district));

    const baseProfile = {
      ...(window.Empire.player || {}),
      ...(cachedProfile || {}),
      username: ownerName,
      name: ownerName,
      gangName: cachedProfile?.gangName || ownerName,
      structure: cachedProfile?.structure || localStorage.getItem("empire_structure") || "-",
      alliance: "Žádná",
      districts: 0,
      structure: cachedProfile?.structure || localStorage.getItem("empire_structure") || resolveDemoOwnerFaction(ownerName),
      ...createDemoWeaponLoadout()
    };
    let scenarioAttackIncident = null;
    let scenarioPoliceIncident = null;
    let scenarioPoliceIncidentIds = [];
    let scenarioDestroyedDistrictId = null;
    roundStatusOverride = null;

    if (normalizedScenarioKey === "full-map") {
      setScenarioVisionMode(true);
      setScenarioAllianceOwners([]);
      setScenarioEnemyOwners([]);
      nextDistricts = districts.map((district) => mapScenarioDistrictOwner(district, ownerName));
      baseProfile.districts = districts.length;
      baseProfile.alliance = "Žádná";
      pushEvent(`Ukázka: ${ownerName} ovládá celou mapu (${districts.length} sektorů).`);
    } else if (normalizedScenarioKey === "single-district") {
      setScenarioVisionMode(true);
      setScenarioAllianceOwners([]);
      setScenarioEnemyOwners([]);
      const bounds = getDistrictBounds(districts);
      const selected = [...districts].sort(
        (a, b) => distanceFromMapCenter(a, bounds) - distanceFromMapCenter(b, bounds)
      )[0];
      if (selected) {
        nextDistricts = districts.map((district) => ({
          ...mapScenarioDistrictOwner(district),
          owner: district.id === selected.id ? ownerName : null
        }));
        baseProfile.districts = 1;
      }
      baseProfile.alliance = "Žádná";
      pushEvent("Ukázka: hráč drží pouze jeden distrikt.");
    } else if (normalizedScenarioKey === "alliance-ten") {
      const enemyOneName = "Stínoví vlci A";
      const enemyTwoName = "Stínoví vlci B";
      const enemyOwners = [enemyOneName, enemyTwoName];
      const ownAllianceName = `${ownerName} + spojenec`;
      const blackoutAllyName = "Knedlík";
      const enemyAllianceName = "Stínoví vlci";
      const blackoutAllianceName = `${ownerName} + ${blackoutAllyName}`;
      const blackoutEnemyAllianceName = "Ledová aliance";
      const blackoutSecondEnemyName = "Ledovec";
      const blackoutThirdEnemyName = "Zabijak";
      const blackoutFourthEnemyName = "Sněhulák";
      const blackoutFifthEnemyName = "Pepek";
      setScenarioAllianceIcons([
        [ownAllianceName, "lightning"],
        [enemyAllianceName, "eye_triangle"],
        [blackoutAllianceName, "lightning"],
        [blackoutEnemyAllianceName, "eye_triangle"]
      ]);
      setScenarioVisionMode(true);
      setScenarioAllianceOwners([allyName]);
      setScenarioEnemyOwners(enemyOwners);
      nextDistricts = assignAllianceTenScenarioOwnership(districts, ownerName, allyName, {
        ownAllianceName,
        enemyOwners,
        enemyAllianceName
      });
      const ownDistrictCount = countOwnedDistrictsForOwner(nextDistricts, ownerName);
      const allyDistrictCount = countOwnedDistrictsForOwner(nextDistricts, allyName);
      const enemyDistrictCount = enemyOwners.reduce(
        (sum, enemyOwner) => sum + countOwnedDistrictsForOwner(nextDistricts, enemyOwner),
        0
      );
      const totalOwned = ownDistrictCount + allyDistrictCount;
      baseProfile.districts = ownDistrictCount;
      baseProfile.alliance = `${ownerName} + spojenec (2/4 • ${totalOwned} sektorů)`;
      roundStatusOverride = buildRoundStatusPresetForMode(
        activePlayerScenarioKey === "alliance-ten-blackout" ? "blackout" : "night"
      );
      {
        const blackoutPlayerDistrictIds = new Set([84, 95, 92, 120, 126]);
        setScenarioAllianceOwners([blackoutAllyName]);
        nextDistricts = nextDistricts.map((district) => {
          const districtId = Number(district?.id);
          if (blackoutPlayerDistrictIds.has(districtId)) {
            return {
              ...district,
              owner: ownerName,
              ownerNick: ownerName,
              ownerAllianceName: blackoutAllianceName,
              ...buildDemoDistrictOwnerMeta(ownerName, district)
            };
          }
          if (districtId === 143 || districtId === 121) {
            return {
              ...district,
              owner: blackoutThirdEnemyName,
              ownerNick: blackoutThirdEnemyName,
              ownerAllianceName: null,
              ...buildDemoDistrictOwnerMeta(blackoutThirdEnemyName, district)
            };
          }
          if (districtId === 38 || districtId === 25) {
            return {
              ...district,
              owner: blackoutFourthEnemyName,
              ownerNick: blackoutFourthEnemyName,
              ownerAllianceName: blackoutEnemyAllianceName,
              ...buildDemoDistrictOwnerMeta(blackoutFourthEnemyName, district)
            };
          }
          if (districtId === 82) {
            return {
              ...district,
              owner: blackoutSecondEnemyName,
              ownerNick: blackoutSecondEnemyName,
              ownerAllianceName: blackoutEnemyAllianceName,
              ...buildDemoDistrictOwnerMeta(blackoutSecondEnemyName, district)
            };
          }
          if (districtId === 108 || districtId === 103 || districtId === 89) {
            return {
              ...district,
              owner: blackoutFifthEnemyName,
              ownerNick: blackoutFifthEnemyName,
              ownerAllianceName: null,
              ...buildDemoDistrictOwnerMeta(blackoutFifthEnemyName, district)
            };
          }
          if (districtId === 102) {
            return {
              ...district,
              owner: blackoutAllyName,
              ownerNick: blackoutAllyName,
              ownerAllianceName: blackoutAllianceName,
              ...buildDemoDistrictOwnerMeta(blackoutAllyName, district)
            };
          }
          if (districtId === 109) {
            return {
              ...district,
              owner: blackoutAllyName,
              ownerNick: blackoutAllyName,
              ownerAllianceName: blackoutAllianceName,
              ...buildDemoDistrictOwnerMeta(blackoutAllyName, district)
            };
          }
          if (normalizeOwnerName(district?.owner) === normalizeOwnerName(ownerName)) {
            return {
              ...district,
              ownerAllianceName: blackoutAllianceName
            };
          }
          if (normalizeOwnerName(district?.owner) === normalizeOwnerName(allyName)) {
            return {
              ...district,
              ownerAllianceName: blackoutAllianceName
            };
          }
          return district;
        });
        setScenarioEnemyOwners([enemyOneName, enemyTwoName, blackoutSecondEnemyName, blackoutThirdEnemyName, blackoutFourthEnemyName, blackoutFifthEnemyName]);
        baseProfile.alliance = `${blackoutAllianceName} (2/4)`;
        baseProfile.districts = countOwnedDistrictsForOwner(nextDistricts, ownerName);
      }
      if (activePlayerScenarioKey === "alliance-ten-blackout") {
        scenarioPoliceIncidentIds = [143, 38];
      }
      pushEvent(`Ukázka: ${ownerName} drží ${ownDistrictCount} sektorů, spojenec ${allyDistrictCount}.`);
      pushEvent(`Hrozba: nepřátelská aliance (${enemyOneName} + ${enemyTwoName}) drží ${enemyDistrictCount} sousedních sektorů.`);
    } else if (normalizedScenarioKey === "alliance-war") {
      const allyOneName = `${ownerName} - spojenec A`;
      const allyTwoName = `${ownerName} - spojenec B`;
      const enemyAllianceOne = ["Stínoví vlci 1", "Stínoví vlci 2", "Stínoví vlci 3"];
      const enemyAllianceTwo = ["Neonové kobry 1", "Neonové kobry 2", "Neonové kobry 3"];
      const enemyOwners = [...enemyAllianceOne, ...enemyAllianceTwo];

      setScenarioVisionMode(true);
      setScenarioAllianceOwners([allyOneName, allyTwoName]);
      setScenarioEnemyOwners(enemyOwners);

      const allocations = [
        { owner: ownerName, count: 3 },
        { owner: allyOneName, count: 4 },
        { owner: allyTwoName, count: 4 },
        ...enemyOwners.map((enemyOwner) => ({ owner: enemyOwner, count: 3 }))
      ];
      nextDistricts = assignOwnersToNeighborClusters(districts, allocations, {
        excludeTypes: ["downtown"]
      });
      const ownDistrictCount = countOwnedDistrictsForOwner(nextDistricts, ownerName);
      const allyTotal = countOwnedDistrictsForOwner(nextDistricts, allyOneName)
        + countOwnedDistrictsForOwner(nextDistricts, allyTwoName);
      const enemyTotal = enemyOwners.reduce(
        (sum, enemyOwner) => sum + countOwnedDistrictsForOwner(nextDistricts, enemyOwner),
        0
      );
      baseProfile.districts = ownDistrictCount;
      baseProfile.alliance = `${ownerName} + 2 spojenci (3/4 • ${ownDistrictCount + allyTotal} sektorů)`;
      pushEvent(
        `Ukázka: ty držíš ${ownDistrictCount} sektory, 2 spojenci drží ${allyTotal} a 2 nepřátelské aliance drží ${enemyTotal} sektorů.`
      );
    } else if (normalizedScenarioKey === "alliance-20") {
      const scenario = buildTwentyPlayerAllianceScenario(districts, ownerName);
      if (!scenario.districts.length) {
        pushEvent("Ukázka 20 hráčů se nepodařila připravit.");
        return;
      }
      setScenarioVisionMode(true);
      scenarioUniqueOwnerColors = true;
      syncMapVisionContext();
      setScenarioAllianceOwners(scenario.alliedOwners);
      setScenarioEnemyOwners(scenario.enemyOwners);
      nextDistricts = scenario.districts;
      baseProfile.districts = scenario.ownDistrictCount;
      baseProfile.alliance = `${scenario.ownAllianceName} (${scenario.ownAllianceMemberCount}/4 • ${scenario.ownAllianceDistrictCount} sektorů)`;
      scenarioAttackIncident = scenario.attackIncident || null;
      scenarioPoliceIncident = scenario.policeIncident || null;
      scenarioDestroyedDistrictId = scenario.destroyedDistrictId ?? null;
      pushEvent(
        `Ukázka: ${scenario.playerCount} hráčů ve ${scenario.allianceCount} aliancích. Každý má ${scenario.minPerPlayer}-${scenario.maxPerPlayer} sektorů.`
      );
      if (scenarioAttackIncident?.targetDistrictId != null) {
        pushEvent(
          `Incident: distrikt ${scenarioAttackIncident.sourceDistrictId} zaútočil na distrikt ${scenarioAttackIncident.targetDistrictId}.`
        );
      }
      if (scenarioPoliceIncident?.targetDistrictId != null) {
        pushEvent(
          `Bezpečnost: velká policejní akce probíhá v distriktu ${scenarioPoliceIncident.targetDistrictId}.`
        );
      }
      if (scenarioDestroyedDistrictId != null) {
        pushEvent(`Katastrofa: distrikt ${scenarioDestroyedDistrictId} je vypálený a nepoužitelný.`);
      }
    } else if (normalizedScenarioKey === "onboarding-20-edge") {
      const scenario = buildTwentyPlayerEdgeOnboardingScenario(districts, ownerName);
      if (!scenario.districts.length) {
        pushEvent("Onboarding scénář 20 hráčů se nepodařilo připravit.");
        return;
      }
      setScenarioVisionMode(true);
      scenarioUniqueOwnerColors = true;
      syncMapVisionContext();
      setScenarioAllianceOwners([]);
      setScenarioEnemyOwners(scenario.enemyOwners);
      nextDistricts = scenario.districts;
      const tutorialEnemyOwner = String(scenario.enemyOwners?.[0] || "Vortex Hounds").trim() || "Vortex Hounds";
      nextDistricts = nextDistricts.map((district) => {
        if (Number(district?.id) === ONBOARDING_TUTORIAL_SPY_DISTRICT_ID) {
          return {
            ...district,
            owner: null,
            ownerPlayerId: null,
            ownerNick: null,
            ownerAllianceName: null,
            ownerStructure: null,
            ownerFaction: null,
            ownerAvatar: null,
            ownerAtmosphere: null
          };
        }
        if (Number(district?.id) === ONBOARDING_TUTORIAL_ATTACK_DISTRICT_ID) {
          return {
            ...district,
            owner: tutorialEnemyOwner,
            ownerPlayerId: null,
            ownerNick: tutorialEnemyOwner,
            ownerAllianceName: null,
            ...buildDemoDistrictOwnerMeta(tutorialEnemyOwner, district)
          };
        }
        return district;
      });
      baseProfile.districts = scenario.ownDistrictCount;
      baseProfile.alliance = "Žádná";
      baseProfile.username = "Onboarding Runner";
      baseProfile.cleanMoney = 1200;
      baseProfile.dirtyMoney = 800;
      baseProfile.drugs = 6;
      baseProfile.materials = 12;
      baseProfile.influence = 8;
      pushEvent(
        `Onboarding: ${scenario.playerCount} hráčů, každý drží 1 okrajový distrikt. Tvůj distrikt přímo sousedí s nepřítelem.`
      );
    } else {
      return;
    }

    window.Empire.player = baseProfile;
    window.Empire.Map.clearUnderAttackDistricts?.();
    window.Empire.Map.clearPoliceActions?.();
    if (forcedMapMode) {
      window.Empire.Map.setMapMode?.(forcedMapMode);
    } else if (roundStatusOverride?.phaseKey) {
      const overrideMode = resolveEffectiveRoundMode(roundStatusOverride.phaseKey, roundStatusOverride.subPhaseKey).mapMode;
      window.Empire.Map.setMapMode?.(overrideMode || roundStatusOverride.phaseKey);
    }
    window.Empire.Map.setDistricts(nextDistricts);
    if (scenarioAttackIncident?.targetDistrictId != null) {
      window.Empire.Map.markDistrictUnderAttack?.(scenarioAttackIncident.targetDistrictId, {
        attackerDistrictId: scenarioAttackIncident.sourceDistrictId,
        durationMs: scenarioAttackIncident.durationMs,
        source: "scenario-alliance-20"
      });
    }
    if (scenarioPoliceIncident?.targetDistrictId != null) {
      window.Empire.Map.markDistrictPoliceAction?.(scenarioPoliceIncident.targetDistrictId, {
        durationMs: scenarioPoliceIncident.durationMs,
        source: "scenario-alliance-20-police"
      });
    }
    if (scenarioPoliceIncidentIds.length) {
      scenarioPoliceIncidentIds.forEach((districtId) => {
        window.Empire.Map.markDistrictPoliceAction?.(districtId, {
          durationMs: 60000,
          source: "scenario-alliance-ten-blackout-police"
        });
      });
    }
    if (normalizedScenarioKey === "onboarding-20-edge") {
      clearDistrictSpyIntel(ONBOARDING_TUTORIAL_SPY_DISTRICT_ID);
      clearDistrictSpyIntel(ONBOARDING_TUTORIAL_ATTACK_DISTRICT_ID);
      setLocalGangMembersBonus(0);
      setLocalGangMembersSpent(0);
      updateEconomy(createOnboardingDemoEconomy());
    }
    if (!window.Empire.token && activePlayerScenarioKey === "alliance-ten-blackout") {
      const allianceState = buildAllianceTenBlackoutLocalAllianceState(ownerName, "Knedlík");
      saveLocalAllianceState(allianceState);
      const marketState = getLocalMarketState();
      marketState.scenarioIncome = {
        ...(marketState.scenarioIncome && typeof marketState.scenarioIncome === "object" ? marketState.scenarioIncome : {}),
        [BLACKOUT_SCENARIO_INCOME_STORAGE_KEY]: Date.now(),
        dirtyRemainder: 0
      };
      saveLocalMarketState(marketState);
      const blackoutSources = buildBlackoutPlayerSourcesSnapshot(nextDistricts, ownerName);
      if (hasMeaningfulBlackoutSources(blackoutSources)) {
        lastValidBlackoutSources = blackoutSources;
      }
      baseProfile.sources = blackoutSources;
      baseProfile.source = blackoutSources;
      Object.assign(baseProfile, applyMoneyToProfileSnapshot(baseProfile, marketState.balances || {}));
      baseProfile.sources = blackoutSources;
      baseProfile.source = blackoutSources;
      syncGuestEconomyFromMarket();
      syncGuestAllianceLabel(allianceState.alliances[0]?.name || "Žádná");
    }
    updateProfile(baseProfile);
    renderRoundStatusState();
    document.dispatchEvent(new CustomEvent("empire:scenario-applied", {
      detail: {
        scenarioKey: activePlayerScenarioKey,
        scenarioBaseKey: normalizedScenarioKey,
        ownerName,
        profile: baseProfile,
        districts: nextDistricts
      }
    }));
  }

  function assignAllianceTenScenarioOwnership(districts, ownerName, allyName, options = {}) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    if (!safeDistricts.length) return [];
    const ownAllianceName = String(options?.ownAllianceName || `${ownerName} + spojenec`).trim();
    const enemyOwners = Array.isArray(options?.enemyOwners)
      ? options.enemyOwners.map((value) => String(value || "").trim()).filter(Boolean)
      : [];
    const enemyAllianceName = String(options?.enemyAllianceName || "").trim();

    const ownersByDistrict = new Map();
    const districtCenters = new Map(
      safeDistricts.map((district) => [district.id, polygonCentroid(district.polygon || [])])
    );
    const neighborsByDistrict = buildDistrictAdjacency(safeDistricts);
    const available = new Set(
      safeDistricts
        .filter((district) => String(district?.type || "").toLowerCase() !== "downtown")
        .map((district) => district.id)
    );
    const ownerTarget = Math.min(5, available.size);
    const preferredTypes = ["commercial", "industrial", "residential", "park", "downtown"];
    const mapBounds = getDistrictBounds(safeDistricts);
    const requiredOwnerBuildings = ["Lékárna", "Továrna", "Drug lab", "Zbrojovka"];
    const hasBuilding = (district, buildingName) => {
      const wanted = normalizeOwnerName(buildingName);
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      return buildings.some((building) => normalizeOwnerName(building) === wanted);
    };
    const sortByCenterDistance = (a, b) => {
      const distA = distanceFromMapCenter(a, mapBounds);
      const distB = distanceFromMapCenter(b, mapBounds);
      if (distA === distB) return Number(a.id || 0) - Number(b.id || 0);
      return distA - distB;
    };

    requiredOwnerBuildings.forEach((buildingName) => {
      if (ownersByDistrict.size >= ownerTarget) return;
      const candidate = safeDistricts
        .filter((district) => available.has(district.id) && hasBuilding(district, buildingName))
        .sort(sortByCenterDistance)[0];
      if (!candidate) return;
      ownersByDistrict.set(candidate.id, ownerName);
      available.delete(candidate.id);
    });

    preferredTypes.forEach((type) => {
      if (ownersByDistrict.size >= ownerTarget) return;
      const candidate = safeDistricts
        .filter((district) => String(district?.type || "").toLowerCase() === type && available.has(district.id))
        .sort(sortByCenterDistance)[0];
      if (!candidate) return;
      ownersByDistrict.set(candidate.id, ownerName);
      available.delete(candidate.id);
    });

    if (ownersByDistrict.size < ownerTarget && available.size) {
      const fallback = safeDistricts
        .filter((district) => available.has(district.id))
        .sort(sortByCenterDistance);
      const missing = Math.min(ownerTarget - ownersByDistrict.size, fallback.length);
      for (let i = 0; i < missing; i += 1) {
        const district = fallback[i];
        ownersByDistrict.set(district.id, ownerName);
        available.delete(district.id);
      }
    }

    const allyTarget = Math.min(5, available.size);
    if (allyTarget > 0) {
      const ownerClusterIds = Array.from(ownersByDistrict.keys());
      const ownerClusterSet = new Set(ownerClusterIds);
      let allySeedId = null;
      if (ownerClusterIds.length) {
        allySeedId = pickNearestToCluster(available, ownerClusterIds, districtCenters, ownerClusterSet);
      }
      if (!allySeedId) {
        allySeedId = pickClusterSeed(available, districtCenters, 1, 2);
      }
      const allyCluster = growDistrictCluster({
        seedId: allySeedId,
        targetSize: allyTarget,
        available,
        neighborsByDistrict,
        districtCenters
      });
      allyCluster.forEach((districtId) => {
        ownersByDistrict.set(districtId, allyName);
        available.delete(districtId);
      });
    }

    if (enemyOwners.length && available.size) {
      const friendlyClusterIds = Array.from(ownersByDistrict.keys());
      const friendlyClusterSet = new Set(friendlyClusterIds);
      const ownerDistrictIds = Array.from(ownersByDistrict.entries())
        .filter(([, owner]) => normalizeOwnerName(owner) === normalizeOwnerName(ownerName))
        .map(([districtId]) => districtId);
      const ownerDistrictSet = new Set(ownerDistrictIds);
      const enemyTarget = Math.min(5, available.size);
      let enemySeedId = null;
      if (ownerDistrictIds.length) {
        const adjacentToOwner = Array.from(available).filter((districtId) => {
          const neighbors = neighborsByDistrict.get(districtId);
          if (!neighbors || !neighbors.size) return false;
          for (const neighborId of neighbors) {
            if (ownerDistrictSet.has(neighborId)) return true;
          }
          return false;
        });
        if (adjacentToOwner.length) {
          enemySeedId = pickNearestToCluster(
            new Set(adjacentToOwner),
            ownerDistrictIds,
            districtCenters,
            ownerDistrictSet
          );
        }
      }
      if (!enemySeedId && friendlyClusterIds.length) {
        enemySeedId = pickNearestToCluster(available, friendlyClusterIds, districtCenters, friendlyClusterSet);
      }
      if (!enemySeedId) {
        enemySeedId = pickClusterSeed(available, districtCenters, 2, 3);
      }
      const enemyCluster = growDistrictCluster({
        seedId: enemySeedId,
        targetSize: enemyTarget,
        available,
        neighborsByDistrict,
        districtCenters
      });
      enemyCluster.forEach((districtId) => {
        available.delete(districtId);
      });

      const splitBase = Math.floor(enemyTarget / enemyOwners.length);
      const splitRemainder = enemyTarget % enemyOwners.length;
      const targetByEnemy = enemyOwners.map((_, index) => splitBase + (index < splitRemainder ? 1 : 0));
      const enemyAvailable = new Set(enemyCluster);

      enemyOwners.forEach((enemyOwner, enemyIndex) => {
        const enemyOwnerTarget = Math.min(targetByEnemy[enemyIndex], enemyAvailable.size);
        if (enemyOwnerTarget < 1) return;
        let enemyOwnerSeed = null;
        if (friendlyClusterIds.length) {
          enemyOwnerSeed = pickNearestToCluster(enemyAvailable, friendlyClusterIds, districtCenters, new Set());
        }
        if (!enemyOwnerSeed && enemyAvailable.size) {
          enemyOwnerSeed = Array.from(enemyAvailable)[0];
        }
        if (!enemyOwnerSeed) return;
        const enemyOwnerCluster = growDistrictCluster({
          seedId: enemyOwnerSeed,
          targetSize: enemyOwnerTarget,
          available: enemyAvailable,
          neighborsByDistrict,
          districtCenters
        });
        enemyOwnerCluster.forEach((districtId) => {
          ownersByDistrict.set(districtId, enemyOwner);
          enemyAvailable.delete(districtId);
        });
      });

      if (enemyAvailable.size) {
        let ownerIndex = 0;
        enemyAvailable.forEach((districtId) => {
          ownersByDistrict.set(districtId, enemyOwners[ownerIndex % enemyOwners.length]);
          ownerIndex += 1;
        });
      }
    }

    const ownerAllianceByKey = new Map([
      [normalizeOwnerName(ownerName), ownAllianceName],
      [normalizeOwnerName(allyName), ownAllianceName]
    ]);
    if (enemyAllianceName) {
      enemyOwners.forEach((enemyOwner) => {
        ownerAllianceByKey.set(normalizeOwnerName(enemyOwner), enemyAllianceName);
      });
    }

    return safeDistricts.map((district) => {
      const isDowntown = String(district?.type || "").toLowerCase() === "downtown";
      const owner = isDowntown ? null : (ownersByDistrict.get(district.id) || null);
      return {
        ...district,
        owner,
        ownerPlayerId: null,
        ownerNick: null,
        ownerAllianceName: ownerAllianceByKey.get(normalizeOwnerName(owner)) || null,
        ...buildDemoDistrictOwnerMeta(owner, district)
      };
    });
  }

  function assignOwnersToNeighborClusters(districts, allocations, options = {}) {
    const safeAllocations = Array.isArray(allocations) ? allocations : [];
    const excludedTypes = new Set(
      (Array.isArray(options?.excludeTypes) ? options.excludeTypes : [])
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean)
    );
    const allocatableDistricts = excludedTypes.size
      ? (districts || []).filter(
        (district) => !excludedTypes.has(String(district?.type || "").trim().toLowerCase())
      )
      : (districts || []);
    const districtCenters = new Map(
      (districts || []).map((district) => [district.id, polygonCentroid(district.polygon || [])])
    );
    const neighborsByDistrict = buildDistrictAdjacency(districts || []);
    const available = new Set(allocatableDistricts.map((district) => district.id));
    const ownersByDistrict = new Map();
    const ownerCount = safeAllocations.length;

    safeAllocations.forEach((item, ownerIndex) => {
      const owner = String(item?.owner || "").trim();
      const count = Math.min(Math.max(0, Number(item?.count) || 0), available.size);
      if (!owner || count < 1) return;
      const seedId = pickClusterSeed(available, districtCenters, ownerIndex, ownerCount);
      const clusterIds = growDistrictCluster({
        seedId,
        targetSize: count,
        available,
        neighborsByDistrict,
        districtCenters
      });
      clusterIds.forEach((districtId) => {
        ownersByDistrict.set(districtId, owner);
        available.delete(districtId);
      });
    });

    return districts.map((district) => ({
      ...district,
      owner: ownersByDistrict.get(district.id) || null,
      ownerPlayerId: null,
      ownerNick: null,
      ownerAllianceName: null,
      ...buildDemoDistrictOwnerMeta(ownersByDistrict.get(district.id), district)
    }));
  }

  function buildTwentyPlayerAllianceScenario(districts, ownerName) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    const emptyResult = {
      districts: [],
      alliedOwners: [],
      enemyOwners: [],
      attackIncident: null,
      policeIncident: null,
      destroyedDistrictId: null,
      ownDistrictCount: 0,
      ownAllianceName: "Žádná",
      ownAllianceMemberCount: 0,
      ownAllianceDistrictCount: 0,
      playerCount: 0,
      allianceCount: 0,
      minPerPlayer: 0,
      maxPerPlayer: 0
    };
    if (!safeDistricts.length) return emptyResult;

    const maxAllianceSize = 4;
    const maxPlayersByDistricts = Math.max(1, Math.floor(safeDistricts.length / 4));
    const playerCount = Math.max(1, Math.min(20, maxPlayersByDistricts));
    const allianceCount = Math.ceil(playerCount / maxAllianceSize);

    const allianceNamePool = [
      "Neon Syndicate",
      "Iron Wolves",
      "Black Harbor",
      "Vortex Pact",
      "Shadow Cartel",
      "Chrome Circuit",
      "Night Crown",
      "Urban Serpents"
    ];
    const nickPool = [
      "Razor Vex", "Ghost Mara", "Nyx Prime", "Iron Shade", "Vortex Kane",
      "Black Comet", "Neon Riot", "Cobra Unit", "Urban Hex", "Steel Drift",
      "Zero Pulse", "Night Cipher", "Crimson Dot", "Volt Raven", "Silent Brick",
      "Alpha Dock", "Chrome Lynx", "Delta Wolf", "Shadow Mint", "Metro Hawk",
      "Apex Nova", "Toxic Ray", "Retro Kane", "Frost Mamba", "Street Rune",
      "Kilo Ghost", "Rust Queen", "Nova Pilot", "Beta Venom", "Pixel Vandal"
    ];

    const usedNames = new Set();
    const claimUniqueNick = (value, fallbackIndex = 1) => {
      const base = String(value || "").trim() || `Hráč ${fallbackIndex}`;
      let candidate = base;
      let suffix = 2;
      while (usedNames.has(normalizeOwnerName(candidate))) {
        candidate = `${base} ${suffix}`;
        suffix += 1;
      }
      usedNames.add(normalizeOwnerName(candidate));
      return candidate;
    };

    const players = [];
    for (let i = 0; i < playerCount; i += 1) {
      const allianceIndex = Math.floor(i / maxAllianceSize);
      const allianceName = allianceNamePool[allianceIndex % allianceNamePool.length];
      const owner = i === 0
        ? claimUniqueNick(ownerName || "Ty", 1)
        : claimUniqueNick(nickPool[(i - 1) % nickPool.length], i + 1);
      const structure = resolveDemoOwnerFaction(owner);
      players.push({
        owner,
        allianceName,
        allianceIndex,
        districtCount: 4 + ((i * 11 + 3) % 4),
        structure,
        avatar: resolveDemoOwnerAvatar(owner),
        ...createDemoWeaponLoadout()
      });
    }

    let totalTarget = players.reduce((sum, player) => sum + player.districtCount, 0);
    if (totalTarget > safeDistricts.length) {
      let guard = 0;
      while (totalTarget > safeDistricts.length && guard < 10000) {
        let reduced = false;
        for (let i = players.length - 1; i >= 0; i -= 1) {
          if (players[i].districtCount <= 4) continue;
          players[i].districtCount -= 1;
          totalTarget -= 1;
          reduced = true;
          if (totalTarget <= safeDistricts.length) break;
        }
        if (!reduced) break;
        guard += 1;
      }
    }

    const alliances = Array.from({ length: allianceCount }, (_, index) => {
      const members = players.filter((player) => player.allianceIndex === index);
      return {
        index,
        name: allianceNamePool[index % allianceNamePool.length],
        members,
        targetDistricts: members.reduce((sum, member) => sum + member.districtCount, 0)
      };
    });

    const districtCenters = new Map(
      safeDistricts.map((district) => [district.id, polygonCentroid(district.polygon || [])])
    );
    const neighborsByDistrict = buildDistrictAdjacency(safeDistricts);
    const available = new Set(safeDistricts.map((district) => district.id));
    const ownersByDistrict = new Map();

    alliances.forEach((alliance, allianceIndex) => {
      const targetDistricts = Math.min(alliance.targetDistricts, available.size);
      if (targetDistricts < 1) return;
      const seedId = pickClusterSeed(available, districtCenters, allianceIndex, alliances.length);
      if (!seedId) return;

      const allianceCluster = growDistrictCluster({
        seedId,
        targetSize: targetDistricts,
        available,
        neighborsByDistrict,
        districtCenters
      });
      if (!allianceCluster.length) return;
      allianceCluster.forEach((districtId) => {
        available.delete(districtId);
      });

      const allianceAvailable = new Set(allianceCluster);
      alliance.members.forEach((member, memberIndex) => {
        const memberTarget = Math.min(member.districtCount, allianceAvailable.size);
        if (memberTarget < 1) return;
        let memberSeed = pickClusterSeed(allianceAvailable, districtCenters, memberIndex, alliance.members.length);
        if (!memberSeed && allianceAvailable.size) {
          memberSeed = Array.from(allianceAvailable)[0];
        }
        if (!memberSeed) return;
        const memberCluster = growDistrictCluster({
          seedId: memberSeed,
          targetSize: memberTarget,
          available: allianceAvailable,
          neighborsByDistrict,
          districtCenters
        });
        memberCluster.forEach((districtId) => {
          ownersByDistrict.set(districtId, member.owner);
          allianceAvailable.delete(districtId);
        });
      });

      if (allianceAvailable.size) {
        const memberOwners = alliance.members.map((member) => member.owner);
        let ownerIndex = 0;
        allianceAvailable.forEach((districtId) => {
          ownersByDistrict.set(districtId, memberOwners[ownerIndex % memberOwners.length]);
          ownerIndex += 1;
        });
      }
    });

    const ownerAllianceByKey = new Map(
      players.map((player) => [normalizeOwnerName(player.owner), player.allianceName])
    );

    const nextDistricts = safeDistricts.map((district) => {
      const owner = ownersByDistrict.get(district.id) || null;
      const ownerKey = normalizeOwnerName(owner);
      const allianceName = ownerKey ? ownerAllianceByKey.get(ownerKey) || null : null;
      const ownerMeta = owner ? buildDemoDistrictOwnerMeta(owner, district) : {
        ownerStructure: null,
        ownerFaction: null,
        ownerAvatar: null,
        ownerAtmosphere: null
      };
      return {
        ...district,
        owner,
        ownerPlayerId: null,
        ownerNick: owner || null,
        ownerAllianceName: allianceName,
        ...ownerMeta
      };
    });

    const applyOwnerToDistrict = (district, player) => {
      if (!district || !player) return;
      district.owner = player.owner || null;
      district.ownerNick = player.owner || null;
      district.ownerAllianceName = player.allianceName || null;
      district.ownerStructure = player.structure || null;
      district.ownerFaction = player.structure || null;
      district.ownerAvatar = player.avatar || null;
      district.ownerAtmosphere = resolveDemoDistrictAtmosphere(district, player.owner);
    };
    const findDistrictById = (districtId) => {
      const key = String(districtId);
      return nextDistricts.find((district) => String(district?.id) === key) || null;
    };
    const sourceDistrict = findDistrictById(62)
      || nextDistricts.find((district) => district?.owner) || null;
    if (sourceDistrict && !sourceDistrict.owner) {
      const fallbackSourcePlayer = players[1] || players[0] || null;
      applyOwnerToDistrict(sourceDistrict, fallbackSourcePlayer);
    }
    const sourceOwnerKey = normalizeOwnerName(sourceDistrict?.owner);
    const sourceAllianceName = sourceOwnerKey ? ownerAllianceByKey.get(sourceOwnerKey) || null : null;
    const sourceDistrictId = sourceDistrict?.id ?? null;

    let targetDistrict = findDistrictById(107)
      || nextDistricts.find((district) => String(district?.id) !== String(sourceDistrictId)) || null;
    if (targetDistrict && !targetDistrict.owner) {
      const fallbackTargetPlayer = players.find((player) => normalizeOwnerName(player.owner) !== sourceOwnerKey)
        || players[0]
        || null;
      applyOwnerToDistrict(targetDistrict, fallbackTargetPlayer);
    }

    if (targetDistrict && sourceOwnerKey && normalizeOwnerName(targetDistrict.owner) === sourceOwnerKey) {
      const forcedTargetPlayer = players.find((player) => {
        const playerOwnerKey = normalizeOwnerName(player.owner);
        if (!playerOwnerKey || playerOwnerKey === sourceOwnerKey) return false;
        if (!sourceAllianceName) return true;
        return player.allianceName !== sourceAllianceName;
      }) || players.find((player) => normalizeOwnerName(player.owner) !== sourceOwnerKey) || null;
      applyOwnerToDistrict(targetDistrict, forcedTargetPlayer);
    }

    const targetDistrictId = targetDistrict?.id ?? null;
    const attackIncident = sourceDistrictId != null && targetDistrictId != null
      ? {
        sourceDistrictId,
        targetDistrictId,
        durationMs: 12 * 60 * 1000
      }
      : null;
    const policeTargetDistrict = findDistrictById(150)
      || nextDistricts.find((district) => String(district?.id) !== String(targetDistrictId))
      || null;
    const policeIncident = policeTargetDistrict?.id != null
      ? {
        targetDistrictId: policeTargetDistrict.id,
        durationMs: 14 * 60 * 1000
      }
      : null;
    const destroyedDistrict = findDistrictById(69)
      || nextDistricts.find((district) => {
        const name = String(district?.name || "");
        const match = name.match(/(^|[^0-9])69([^0-9]|$)/);
        return Boolean(match);
      })
      || null;
    if (destroyedDistrict) {
      destroyedDistrict.owner = null;
      destroyedDistrict.ownerNick = null;
      destroyedDistrict.ownerAllianceName = null;
      destroyedDistrict.ownerPlayerId = null;
      destroyedDistrict.influence = 0;
      destroyedDistrict.isDestroyed = true;
      destroyedDistrict.destroyedAt = Date.now() - (40 * 60 * 1000);
    }

    const ownOwner = players[0]?.owner || String(ownerName || "Ty");
    const ownOwnerKey = normalizeOwnerName(ownOwner);
    const ownAllianceName = ownerAllianceByKey.get(ownOwnerKey) || "Žádná";
    const ownAllianceMembers = players.filter((player) => player.allianceName === ownAllianceName);
    const alliedOwners = ownAllianceMembers
      .map((player) => player.owner)
      .filter((playerOwner) => normalizeOwnerName(playerOwner) !== ownOwnerKey);
    const enemyOwners = players
      .filter((player) => player.allianceName !== ownAllianceName)
      .map((player) => player.owner);
    const ownDistrictCount = countOwnedDistrictsForOwner(nextDistricts, ownOwner);
    const ownAllianceDistrictCount = nextDistricts.reduce((sum, district) => {
      const districtOwnerKey = normalizeOwnerName(district.owner);
      if (!districtOwnerKey) return sum;
      return ownerAllianceByKey.get(districtOwnerKey) === ownAllianceName ? sum + 1 : sum;
    }, 0);

    const minPerPlayer = players.reduce((min, player) => Math.min(min, player.districtCount), Infinity);
    const maxPerPlayer = players.reduce((max, player) => Math.max(max, player.districtCount), 0);

    return {
      districts: nextDistricts,
      alliedOwners,
      enemyOwners,
      attackIncident,
      policeIncident,
      destroyedDistrictId: destroyedDistrict?.id ?? null,
      ownDistrictCount,
      ownAllianceName,
      ownAllianceMemberCount: ownAllianceMembers.length,
      ownAllianceDistrictCount,
      playerCount: players.length,
      allianceCount: alliances.length,
      minPerPlayer: Number.isFinite(minPerPlayer) ? minPerPlayer : 0,
      maxPerPlayer
    };
  }

  function buildTwentyPlayerEdgeOnboardingScenario(districts, ownerName) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    const emptyResult = {
      districts: [],
      enemyOwners: [],
      ownDistrictCount: 0,
      playerCount: 0
    };
    if (!safeDistricts.length) return emptyResult;

    const playerCount = 20;
    const bounds = getDistrictBounds(safeDistricts);
    const width = Math.max(1, Number(bounds.maxX || 0) - Number(bounds.minX || 0));
    const height = Math.max(1, Number(bounds.maxY || 0) - Number(bounds.minY || 0));
    const leftThreshold = bounds.minX + width * 0.2;
    const rightThreshold = bounds.maxX - width * 0.2;
    const bottomThreshold = bounds.maxY - height * 0.2;
    const adjacency = buildDistrictAdjacency(safeDistricts);
    const targetCounts = { left: 7, bottom: 7, right: 6 };

    const edgeCandidates = safeDistricts
      .filter((district) => String(district?.type || "").trim().toLowerCase() !== "downtown")
      .map((district) => {
        const center = polygonCentroid(district.polygon || []);
        const onLeft = center.x <= leftThreshold;
        const onRight = center.x >= rightThreshold;
        const onBottom = center.y >= bottomThreshold;
        if (!onLeft && !onRight && !onBottom) return null;
        let edge = "left";
        if (onBottom) edge = "bottom";
        if (onRight && !onBottom) edge = "right";
        return {
          district,
          center,
          edge,
          sortValue: edge === "bottom" ? center.x : center.y
        };
      })
      .filter(Boolean);

    const groupCandidates = {
      left: edgeCandidates
        .filter((entry) => entry.edge === "left")
        .sort((a, b) => a.sortValue - b.sortValue || Number(a.district?.id || 0) - Number(b.district?.id || 0)),
      bottom: edgeCandidates
        .filter((entry) => entry.edge === "bottom")
        .sort((a, b) => a.sortValue - b.sortValue || Number(a.district?.id || 0) - Number(b.district?.id || 0)),
      right: edgeCandidates
        .filter((entry) => entry.edge === "right")
        .sort((a, b) => a.sortValue - b.sortValue || Number(a.district?.id || 0) - Number(b.district?.id || 0))
    };

    const allCandidates = [...groupCandidates.left, ...groupCandidates.bottom, ...groupCandidates.right];
    const candidateById = new Map(allCandidates.map((entry) => [String(entry?.district?.id ?? ""), entry]));
    const edgeKeys = ["left", "bottom", "right"];
    const pairCandidates = [];

    allCandidates.forEach((entry) => {
      const entryId = String(entry?.district?.id ?? "");
      if (!entryId) return;
      const neighbors = adjacency.get(entry.district.id) || new Set();
      neighbors.forEach((neighborId) => {
        const neighborEntry = candidateById.get(String(neighborId));
        if (!neighborEntry) return;
        const neighborEntryId = String(neighborEntry?.district?.id ?? "");
        if (!neighborEntryId || entryId >= neighborEntryId) return;
        pairCandidates.push([entry, neighborEntry]);
      });
    });

    const canPlaceEntry = (entry, selectedIds) => {
      const neighbors = adjacency.get(entry.district.id) || new Set();
      for (const neighborId of neighbors) {
        if (selectedIds.has(String(neighborId))) return false;
      }
      return true;
    };

    const fillEdgeEntries = (edgeIndex, selectedEntries, selectedIds, countsByEdge) => {
      if (edgeIndex >= edgeKeys.length) return selectedEntries;
      const edgeKey = edgeKeys[edgeIndex];
      const needed = targetCounts[edgeKey] - (countsByEdge[edgeKey] || 0);
      if (needed < 0) return null;
      if (needed === 0) return fillEdgeEntries(edgeIndex + 1, selectedEntries, selectedIds, countsByEdge);

      const candidates = (groupCandidates[edgeKey] || []).filter((entry) => !selectedIds.has(String(entry?.district?.id ?? "")));
      const chooseEntries = (startIndex, remaining, nextEntries, nextIds) => {
        if (remaining === 0) {
          return fillEdgeEntries(edgeIndex + 1, nextEntries, nextIds, {
            ...countsByEdge,
            [edgeKey]: targetCounts[edgeKey]
          });
        }
        for (let i = startIndex; i <= candidates.length - remaining; i += 1) {
          const entry = candidates[i];
          const districtId = String(entry?.district?.id ?? "");
          if (!districtId || nextIds.has(districtId)) continue;
          if (!canPlaceEntry(entry, nextIds)) continue;
          nextIds.add(districtId);
          const result = chooseEntries(i + 1, remaining - 1, [...nextEntries, entry], nextIds);
          nextIds.delete(districtId);
          if (result) return result;
        }
        return null;
      };

      return chooseEntries(0, needed, selectedEntries, new Set(selectedIds));
    };

    let selected = null;
    let adjacentPair = null;
    let adjacentNeighbor = null;

    for (let i = 0; i < pairCandidates.length; i += 1) {
      const [firstEntry, secondEntry] = pairCandidates[i];
      const initialCounts = { left: 0, bottom: 0, right: 0 };
      initialCounts[firstEntry.edge] += 1;
      initialCounts[secondEntry.edge] += 1;
      if (edgeKeys.some((edgeKey) => initialCounts[edgeKey] > targetCounts[edgeKey])) continue;

      const seededEntries = [firstEntry, secondEntry];
      const seededIds = new Set(seededEntries.map((entry) => String(entry?.district?.id ?? "")));
      const completedSelection = fillEdgeEntries(0, seededEntries, seededIds, initialCounts);
      if (!completedSelection) continue;

      selected = completedSelection;
      adjacentPair = firstEntry;
      adjacentNeighbor = secondEntry;
      break;
    }

    if (!selected || !adjacentPair || !adjacentNeighbor) return emptyResult;

    const nickPool = [
      "Razor Vex", "Ghost Mara", "Nyx Prime", "Iron Shade", "Vortex Kane",
      "Black Comet", "Neon Riot", "Cobra Unit", "Urban Hex", "Steel Drift",
      "Zero Pulse", "Night Cipher", "Crimson Dot", "Volt Raven", "Silent Brick",
      "Alpha Dock", "Chrome Lynx", "Delta Wolf", "Shadow Mint", "Metro Hawk",
      "Apex Nova", "Toxic Ray", "Retro Kane", "Frost Mamba", "Street Rune"
    ];
    const usedNames = new Set();
    const claimUniqueNick = (value, fallbackIndex = 1) => {
      const base = String(value || "").trim() || `Hráč ${fallbackIndex}`;
      let candidate = base;
      let suffix = 2;
      while (usedNames.has(normalizeOwnerName(candidate))) {
        candidate = `${base} ${suffix}`;
        suffix += 1;
      }
      usedNames.add(normalizeOwnerName(candidate));
      return candidate;
    };

    const players = [
      claimUniqueNick(ownerName || "Ty", 1),
      ...Array.from({ length: playerCount - 1 }, (_, index) => claimUniqueNick(nickPool[index % nickPool.length], index + 2))
    ];

    const ownerByDistrictId = new Map();
    ownerByDistrictId.set(adjacentPair.district.id, players[0]);
    ownerByDistrictId.set(adjacentNeighbor.district.id, players[1]);

    let playerIndex = 2;
    selected.forEach((entry) => {
      if (ownerByDistrictId.has(entry.district.id)) return;
      ownerByDistrictId.set(entry.district.id, players[playerIndex]);
      playerIndex += 1;
    });

    const nextDistricts = safeDistricts.map((district) => {
      const owner = ownerByDistrictId.get(district.id) || null;
      const ownerMeta = owner ? buildDemoDistrictOwnerMeta(owner, district) : {
        ownerStructure: null,
        ownerFaction: null,
        ownerAvatar: null,
        ownerAtmosphere: null
      };
      return {
        ...district,
        owner,
        ownerPlayerId: null,
        ownerNick: owner || null,
        ownerAllianceName: null,
        ...ownerMeta
      };
    });

    return {
      districts: nextDistricts,
      enemyOwners: players.slice(1),
      ownDistrictCount: 1,
      playerCount
    };
  }

  function countOwnedDistrictsForOwner(districts, ownerName) {
    const normalizedOwner = normalizeOwnerName(ownerName);
    if (!normalizedOwner) return 0;
    return (districts || []).reduce((sum, district) => {
      if (normalizeOwnerName(district.owner) === normalizedOwner) return sum + 1;
      return sum;
    }, 0);
  }

  function pickClusterSeed(available, districtCenters, ownerIndex, ownerCount) {
    const ranked = Array.from(available).sort((a, b) => {
      const centerA = districtCenters.get(a) || { x: 0, y: 0 };
      const centerB = districtCenters.get(b) || { x: 0, y: 0 };
      if (centerA.x === centerB.x) return centerA.y - centerB.y;
      return centerA.x - centerB.x;
    });
    if (!ranked.length) return null;
    if (ranked.length === 1) return ranked[0];
    const ratio = (ownerIndex + 0.5) / Math.max(ownerCount, 1);
    const index = Math.min(ranked.length - 1, Math.max(0, Math.round(ratio * (ranked.length - 1))));
    return ranked[index];
  }

  function growDistrictCluster({ seedId, targetSize, available, neighborsByDistrict, districtCenters }) {
    if (!seedId || !available.has(seedId) || targetSize < 1) return [];
    const cluster = [seedId];
    const clusterSet = new Set(cluster);
    const frontier = new Set();

    const pushNeighbors = (districtId) => {
      const neighbors = neighborsByDistrict.get(districtId) || new Set();
      neighbors.forEach((neighborId) => {
        if (!available.has(neighborId)) return;
        if (clusterSet.has(neighborId)) return;
        frontier.add(neighborId);
      });
    };

    pushNeighbors(seedId);

    while (cluster.length < targetSize) {
      const nextFromFrontier = pickNearestToCluster(frontier, cluster, districtCenters, clusterSet);
      let nextId = nextFromFrontier;
      if (!nextId) {
        nextId = pickNearestToCluster(available, cluster, districtCenters, clusterSet);
      }
      if (!nextId) break;
      cluster.push(nextId);
      clusterSet.add(nextId);
      frontier.delete(nextId);
      pushNeighbors(nextId);
    }

    return cluster;
  }

  function pickNearestToCluster(candidates, cluster, districtCenters, clusterSet) {
    let bestId = null;
    let bestDistance = Infinity;
    candidates.forEach((candidateId) => {
      if (clusterSet.has(candidateId)) return;
      const distance = distanceToCluster(candidateId, cluster, districtCenters);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = candidateId;
      }
    });
    return bestId;
  }

  function distanceToCluster(candidateId, cluster, districtCenters) {
    const from = districtCenters.get(candidateId) || { x: 0, y: 0 };
    let best = Infinity;
    for (let i = 0; i < cluster.length; i += 1) {
      const to = districtCenters.get(cluster[i]) || { x: 0, y: 0 };
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      if (distance < best) best = distance;
    }
    return best;
  }

  function buildDistrictAdjacency(districts) {
    const adjacency = new Map((districts || []).map((district) => [district.id, new Set()]));
    const edgeOwners = new Map();

    (districts || []).forEach((district) => {
      const polygon = Array.isArray(district.polygon) ? district.polygon : [];
      if (polygon.length < 2) return;
      for (let i = 0; i < polygon.length; i += 1) {
        const from = polygon[i];
        const to = polygon[(i + 1) % polygon.length];
        const edgeKey = normalizeEdgeKey(from, to);
        if (!edgeOwners.has(edgeKey)) edgeOwners.set(edgeKey, []);
        edgeOwners.get(edgeKey).push(district.id);
      }
    });

    edgeOwners.forEach((ownerIds) => {
      const unique = Array.from(new Set(ownerIds));
      for (let i = 0; i < unique.length; i += 1) {
        for (let j = i + 1; j < unique.length; j += 1) {
          const a = unique[i];
          const b = unique[j];
          adjacency.get(a)?.add(b);
          adjacency.get(b)?.add(a);
        }
      }
    });

    return adjacency;
  }

  function normalizeEdgeKey(from, to) {
    const a = normalizePointKey(from);
    const b = normalizePointKey(to);
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function normalizePointKey(point) {
    const x = Number(point?.[0] || 0).toFixed(3);
    const y = Number(point?.[1] || 0).toFixed(3);
    return `${x},${y}`;
  }

  function resolveScenarioOwnerName() {
    return (
      cachedProfile?.gangName
      || cachedProfile?.username
      || localStorage.getItem("empire_gang_name")
      || localStorage.getItem("empire_guest_username")
      || "Tvůj gang"
    );
  }

  function resolveCurrentPlayerOwnerLabel() {
    return String(resolveScenarioOwnerName() || "Ty");
  }

  function resolveCurrentPlayerNick() {
    return String(
      cachedProfile?.username
      || cachedProfile?.name
      || window.Empire.player?.username
      || window.Empire.player?.name
      || localStorage.getItem("empire_guest_username")
      || "Neznámý hráč"
    ).trim() || "Neznámý hráč";
  }

  function resolveCurrentPlayerGangName() {
    return String(
      cachedProfile?.gangName
      || cachedProfile?.gang_name
      || window.Empire.player?.gangName
      || window.Empire.player?.gang_name
      || localStorage.getItem("empire_gang_name")
      || resolveScenarioOwnerName()
      || "Neznámý gang"
    ).trim() || "Neznámý gang";
  }

  function resolveCurrentPlayerAllianceName() {
    return String(
      resolvePlayerAllianceVisualMeta()?.name
      || cachedProfile?.alliance
      || window.Empire.player?.alliance
      || "Bez aliance"
    ).trim() || "Bez aliance";
  }

  function formatSpyDetectionAlertTime(timestamp) {
    const safeTimestamp = Math.max(0, Math.floor(Number(timestamp) || Date.now()));
    try {
      return new Intl.DateTimeFormat("cs-SK", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date(safeTimestamp));
    } catch {
      const date = new Date(safeTimestamp);
      return date.toLocaleTimeString();
    }
  }

  function resolveCurrentPlayerOwnerKey() {
    const normalized = normalizeOwnerName(resolveCurrentPlayerOwnerLabel());
    return normalized || "player";
  }

  function readLocalDistrictDefenseAssignments() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_DISTRICT_DEFENSE_ASSIGNMENTS_KEY) || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function writeLocalDistrictDefenseAssignments(store) {
    localStorage.setItem(LOCAL_DISTRICT_DEFENSE_ASSIGNMENTS_KEY, JSON.stringify(store || {}));
  }

  function countSelectedDefenseWeapons(selection = {}) {
    return defenseWeaponStats.reduce((sum, item) => {
      const count = Math.max(0, Math.floor(Number(selection?.[item.name] || 0)));
      return sum + count;
    }, 0);
  }

  function saveDistrictDefenseAssignment(district, selection = {}, members = 0, power = 0) {
    if (!district?.id) return null;
    const districtKey = String(district.id);
    const ownerKey = resolveCurrentPlayerOwnerKey();
    const ownerLabel = resolveCurrentPlayerOwnerLabel();
    const safeMembers = Math.max(0, Math.floor(Number(members) || 0));
    const safePower = Math.max(0, Math.floor(Number(power) || 0));
    const safeSelection = defenseWeaponStats.reduce((acc, item) => {
      const count = Math.max(0, Math.floor(Number(selection?.[item.name] || 0)));
      if (count > 0) acc[item.name] = count;
      return acc;
    }, {});
    const totalWeapons = countSelectedDefenseWeapons(safeSelection);

    const store = readLocalDistrictDefenseAssignments();
    const districtStore = store[districtKey] && typeof store[districtKey] === "object"
      ? { ...store[districtKey] }
      : {};
    districtStore[ownerKey] = {
      ownerLabel,
      weaponCounts: safeSelection,
      totalWeapons,
      members: safeMembers,
      power: safePower,
      updatedAt: Date.now()
    };
    store[districtKey] = districtStore;
    writeLocalDistrictDefenseAssignments(store);
    return districtStore[ownerKey];
  }

  function resolveDistrictDefenseEntryByKeys(districtStore, ownerKeys = new Set()) {
    if (!districtStore || typeof districtStore !== "object") return null;
    for (const key of ownerKeys) {
      const normalized = normalizeOwnerName(key);
      if (!normalized) continue;
      if (districtStore[normalized]) return districtStore[normalized];
    }
    return null;
  }

  function getDistrictDefenseSnapshot(districtId) {
    if (districtId == null) {
      return {
        self: { label: "Ty", weapons: null, members: null, power: null, hasData: false },
        ally: { label: "Spojenec", weapons: null, members: null, power: null, hasData: false }
      };
    }
    const store = readLocalDistrictDefenseAssignments();
    const districtStore = store[String(districtId)] && typeof store[String(districtId)] === "object"
      ? store[String(districtId)]
      : {};
    const selfKeys = new Set(getPlayerOwnerNameSet());
    selfKeys.add(resolveCurrentPlayerOwnerKey());
    const allyKeys = getActiveAllianceOwnerNames();

    const selfEntry = resolveDistrictDefenseEntryByKeys(districtStore, selfKeys);
    const allyEntry = resolveDistrictDefenseEntryByKeys(districtStore, allyKeys);

    const mapEntry = (entry, fallbackLabel) => {
      if (!entry || typeof entry !== "object") {
        return {
          label: fallbackLabel,
          weapons: null,
          members: null,
          power: null,
          hasData: false
        };
      }
      const weapons = Number.isFinite(Number(entry.totalWeapons))
        ? Math.max(0, Math.floor(Number(entry.totalWeapons)))
        : countSelectedDefenseWeapons(entry.weaponCounts || {});
      const members = Math.max(0, Math.floor(Number(entry.members) || 0));
      const power = Math.max(0, Math.floor(Number(entry.power) || 0));
      return {
        label: fallbackLabel,
        weapons,
        members,
        power,
        hasData: weapons > 0 || members > 0 || power > 0
      };
    };

    return {
      self: mapEntry(selfEntry, "Ty"),
      ally: mapEntry(allyEntry, "Spojenec")
    };
  }

  function initEventsModal() {
    const openBtn = document.getElementById("city-events-open");
    const modal = document.getElementById("events-modal");
    const backdrop = document.getElementById("events-modal-backdrop");
    const closeBtn = document.getElementById("events-modal-close");
    const tasklist = document.getElementById("events-tasklist");
    const agentName = document.getElementById("events-agent-name");
    const agentType = document.getElementById("events-agent-type");
    const agentDesc = document.getElementById("events-agent-desc");
    const agentQuote = document.getElementById("events-agent-quote");
    const agentButtons = Array.from(document.querySelectorAll(".events-agent"));

    if (!modal || !openBtn) return;

    const agents = {
      victor: {
        name: "Victor Grave Kadeř",
        type: "Pouliční boss",
        desc:
          "Bývalý vyhazovač, co si vymlátil vlastní teritorium. Neřeší kecy, jen výsledky. Respekt si bere silou.",
        quote: "Buď to vezmeš nebo to vezme někdo jinej.",
        tasks: [
          { title: "Útok na sektor", desc: "Prolom obranu rivala v průmyslovém pásmu." },
          { title: "Likvidace nepřítele", desc: "Zlikviduj vůdce pouličního gangu v Docklands." },
          { title: "Obsazení území", desc: "Zabrat neutralní blok a držet ho 24 hodin." }
        ]
      },
      leon: {
        name: "Leon Switch Varga",
        type: "Fixer / obchodník",
        desc:
          "Všechno ví, všechno zařídí. Má kontakty v každém sektoru a nikdy nepracuje zadarmo.",
        quote: "Nejde o to, co máš. Jde o to, co z toho vytěžíš.",
        tasks: [
          { title: "Černý obchod", desc: "Vyjednej výměnu drog za zbraně s konkurenční frakcí." },
          { title: "Získání zdrojů", desc: "Získej $50k a 120 drog z bočních operací." },
          { title: "Tichá dohoda", desc: "Uzavři dohodu s dvěma sektory pro pasivní příjem." }
        ]
      },
      nina: {
        name: "Nina Velvet Rojas",
        type: "Informační síť / vliv",
        desc:
          "Vlastní několik klubů a ví o každém všechno. Usmívá se ale tahá za nitky v pozadí.",
        quote: "Informace jsou dražší než krev. A já jich mám dost.",
        tasks: [
          { title: "Sběr informací", desc: "Získej přístup k databázi metra a odposlechům." },
          { title: "Infiltrace sektoru", desc: "Pošli agenta do finanční zóny a získej kompromitující data." },
          { title: "Zvýšení vlivu", desc: "Vytvoř skandál a posuň reputaci o 15 bodů." }
        ]
      }
    };

    const renderTasks = (agentKey) => {
      const agent = agents[agentKey];
      if (!agent || !tasklist) return;
      agentButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.agent === agentKey));
      if (agentName) agentName.textContent = agent.name;
      if (agentType) agentType.textContent = agent.type;
      if (agentDesc) agentDesc.textContent = agent.desc;
      if (agentQuote) agentQuote.textContent = agent.quote;
      tasklist.innerHTML = agent.tasks
        .map(
          (task) => `
          <div class="events-task">
            <div class="events-task__title">${task.title}</div>
            <div class="events-task__desc">${task.desc}</div>
            <div class="events-task__actions">
              <button class="btn btn--primary" data-action="accept" data-title="${task.title}">Accept</button>
              <button class="btn btn--ghost" data-action="decline" data-title="${task.title}">Decline</button>
            </div>
          </div>
        `
        )
        .join("");
      modal.classList.remove("events-modal--compact");
    };

    const resetToCompactState = () => {
      agentButtons.forEach((btn) => btn.classList.remove("is-active"));
      if (agentName) agentName.textContent = "Vyber postavu";
      if (agentType) agentType.textContent = "Každá má jiné questy";
      if (agentDesc) {
        agentDesc.textContent = "Klikni na postavu a zobrazí se její popis a dočasné úkoly.";
      }
      if (agentQuote) agentQuote.textContent = "";
      if (tasklist) tasklist.innerHTML = "";
      modal.classList.add("events-modal--compact");
    };

    const openModal = () => {
      resetToCompactState();
      setMobileTopbarCoveredByPrimaryModal(true);
      modal.classList.remove("hidden");
    };
    const closeModal = () => {
      modal.classList.add("hidden");
      modal.classList.add("events-modal--compact");
      setMobileTopbarCoveredByPrimaryModal(false);
    };

    openBtn.addEventListener("click", openModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });

    agentButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        renderTasks(btn.dataset.agent);
      });
    });

    if (tasklist) {
      tasklist.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const title = target.dataset.title;
        if (!action || !title) return;
        if (action === "accept") pushEvent(`Přijato: ${title}`);
        if (action === "decline") pushEvent(`Odmítnuto: ${title}`);
      });
    }
  }

  function initBuildingsModal() {
    const openBtn = document.getElementById("buildings-open");
    const root = document.getElementById("buildings-modal");
    const backdrop = document.getElementById("buildings-modal-backdrop");
    const closeBtn = document.getElementById("buildings-modal-close");
    const typeList = document.getElementById("buildings-type-list");
    const detail = document.getElementById("buildings-modal-detail");
    const content = root.querySelector(".buildings-modal__content");

    if (!root || !openBtn || !typeList || !detail || !content) return;

    let currentRenderedEntries = [];
    let activeDistrictType = null;
    const selectedBuildingTypeByDistrict = new Map();

    const closeModal = () => {
      root.classList.add("hidden");
      setMobileTopbarCoveredByPrimaryModal(false);
    };

    const renderTypes = (selectedType) => {
      typeList.innerHTML = buildingDistrictTypes
        .map(
          (type) => `
            <button class="buildings-modal__type-btn buildings-modal__type-btn--${type.key} ${type.key === selectedType ? "is-active" : ""}" data-building-type="${type.key}">
              ${type.label}
            </button>
          `
        )
        .join("");
    };

    const renderDetail = (typeKey) => {
      const selected = buildingDistrictTypes.find((type) => type.key === typeKey) || null;
      if (!selected) {
        currentRenderedEntries = [];
        activeDistrictType = null;
        content.classList.remove("buildings-modal__content--with-bg");
        content.style.backgroundImage = "";
        detail.innerHTML = `
        <section class="buildings-modal__detail-card">
          <div class="buildings-modal__detail-title">Vyber distrikt</div>
          <div class="buildings-modal__empty">Po výběru distriktu uvidíš dostupné typy budov.</div>
        </section>
        `;
        return;
      }

      const backgroundImage = districtTypeBackgrounds[selected.key] || "";
      const detailState = renderDistrictTypeDetail(selected.key, selectedBuildingTypeByDistrict.get(selected.key));
      currentRenderedEntries = detailState.entries;
      if (detailState.selectedBaseName) {
        selectedBuildingTypeByDistrict.set(selected.key, detailState.selectedBaseName);
      }
      activeDistrictType = selected.key;

      content.classList.toggle("buildings-modal__content--with-bg", Boolean(backgroundImage));
      content.style.backgroundImage = backgroundImage
        ? `linear-gradient(rgba(3, 7, 18, 0.54), rgba(3, 7, 18, 0.68)), url('${backgroundImage}')`
        : "";

      detail.innerHTML = `
        <section class="buildings-modal__detail-card" data-building-district-type="${selected.key}">
          <div class="buildings-modal__detail-title">${selected.label}</div>
          <div class="buildings-modal__detail-meta">${formatDistrictType(selected.key)}</div>
          ${detailState.markup}
        </section>
      `;
    };

    const renderBuildings = (selectedType = activeDistrictType) => {
      renderTypes(selectedType);
      renderDetail(selectedType);
    };

    openBtn.addEventListener("click", () => {
      activeDistrictType = null;
      selectedBuildingTypeByDistrict.clear();
      renderBuildings(null);
      setMobileTopbarCoveredByPrimaryModal(true);
      root.classList.remove("hidden");
    });
    typeList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-building-type]");
      if (!(button instanceof HTMLElement)) return;
      const selectedType = button.dataset.buildingType;
      if (!selectedType) return;
      renderBuildings(selectedType);
    });
    detail.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const typeButton = target.closest("[data-building-base-name]");
      if (typeButton instanceof HTMLElement) {
        if (typeButton.hasAttribute("data-building-locked")) {
          pushEvent("Typ budovy je zamčený. V tomto stavu ho nevlastníš.");
          return;
        }
        const selectedBaseName = typeButton.dataset.buildingBaseName;
        if (!selectedBaseName) return;
        selectedBuildingTypeByDistrict.set(activeDistrictType, selectedBaseName);
        renderDetail(activeDistrictType);
        return;
      }

      const button = target.closest("[data-building-entry-index]");
      if (!(button instanceof HTMLElement)) return;
      if (button.hasAttribute("data-building-locked")) {
        pushEvent("Budova je zamčená. Tento typ distriktu v ukázkovém stavu nevlastníš.");
        return;
      }
      const entryIndex = Number(button.dataset.buildingEntryIndex);
      const entry = currentRenderedEntries[entryIndex];
      if (!entry) return;
      const pseudoDistrict = {
        id: entry.districtId,
        type: entry.districtType
      };
      const detailInput = {
        baseName: entry.baseName,
        variantName: entry.variantName || null,
        districtId: entry.districtId,
        buildingIndex: Number.isFinite(Number(entry.buildingIndex))
          ? Math.max(0, Math.floor(Number(entry.buildingIndex)))
          : null
      };
      if (window.Empire.Map?.showBuildingDetail) {
        root.classList.add("hidden");
        setMobileTopbarCoveredByPrimaryModal(false);
        window.Empire.Map.showBuildingDetail(detailInput, pseudoDistrict);
      }
    });
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  function resolveBuildingsForDistrictType(typeKey) {
    return districtBuildingCatalog[typeKey] || [
      "Operační základna",
      "Sklad",
      "Kontrolní bod",
      "Garáž",
      "Bezpečný dům"
    ];
  }

  function renderDistrictTypeDetail(typeKey, selectedBaseName) {
    const entries = resolveBuildingEntriesForDistrictType(typeKey);
    if (!entries.length) {
      return {
        entries: [],
        selectedBaseName: null,
        markup: '<div class="buildings-modal__empty">Pro tento typ zatím nejsou dostupné budovy.</div>'
      };
    }

    const groupedByType = new Map();
    entries.forEach((entry) => {
      const key = String(entry.baseName || "Neznámá budova");
      if (!groupedByType.has(key)) {
        groupedByType.set(key, {
          baseName: key,
          count: 0,
          unlockedCount: 0,
          unlocked: false
        });
      }
      const group = groupedByType.get(key);
      group.count += 1;
      if (entry.unlocked) group.unlockedCount += 1;
      group.unlocked = group.unlocked || Boolean(entry.unlocked);
    });

    const baseTypes = Array.from(groupedByType.values()).sort((a, b) =>
      a.baseName.localeCompare(b.baseName, "cs", { sensitivity: "base" })
    );
    const activeBaseName = baseTypes.some((item) => item.baseName === selectedBaseName && item.unlocked)
      ? selectedBaseName
      : null;
    const scopedEntries = activeBaseName
      ? entries
        .filter((entry) => entry.baseName === activeBaseName && entry.unlocked)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "cs", { sensitivity: "base" }))
      : [];

    return {
      entries: scopedEntries,
      selectedBaseName: activeBaseName,
      markup: `
      <div class="buildings-modal__group">
        <div class="buildings-modal__building-grid">
          ${baseTypes
            .map((item) => {
              const activeClass = item.baseName === activeBaseName ? " is-active" : "";
              return `
                <button
                  class="buildings-modal__building buildings-modal__building--interactive${activeClass}${item.unlocked ? "" : " buildings-modal__building--locked"}"
                  type="button"
                  data-building-base-name="${item.baseName}"
                  ${item.unlocked ? "" : 'data-building-locked="1" disabled aria-disabled="true"'}
                >
                  <span>${item.baseName}</span>
                  <span>${item.unlocked ? `${item.unlockedCount}x` : "LOCKED"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="buildings-modal__group">
        <div class="buildings-modal__building-grid">
          ${activeBaseName
            ? scopedEntries
              .map(
                (entry, index) => {
                  return `
              <button
                class="buildings-modal__building buildings-modal__building--interactive"
                type="button"
                data-building-entry-index="${index}"
                data-building-type="${typeKey}"
              >
                <span>${entry.displayName}</span>
              </button>
            `;
                }
              )
              .join("")
            : '<div class="buildings-modal__empty">Nejdřív vyber odemčený typ budovy v kroku 1.</div>'}
        </div>
      </div>
    `
    };
  }

  function resolveBuildingEntriesForDistrictType(typeKey) {
    if (scenarioVisionEnabled) {
      const scenarioEntries = resolveScenarioBuildingEntriesForDistrictType(typeKey);
      if (scenarioEntries.length) return scenarioEntries;
    }

    const ownedEntries = resolveOwnedBuildingEntriesForDistrictType(typeKey);
    if (ownedEntries.length) return ownedEntries;

    const buildings = resolveBuildingsForDistrictType(typeKey);
    const lockContext = resolveBuildingsLockContext(typeKey);
    return buildings.map((building, index) => {
      const baseName = String(building || "Neznámá budova");
      const isUnlocked = !lockContext.enforceLocks || lockContext.unlockedBuildings.has(normalizeOwnerName(baseName));
      return {
        baseName,
        variantName: null,
        displayName: baseName,
        districtType: typeKey,
        districtId: hashDistrictSeed(baseName, typeKey.length),
        buildingIndex: index,
        unlocked: isUnlocked
      };
    });
  }

  function resolveScenarioBuildingEntriesForDistrictType(typeKey) {
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const playerNames = getPlayerOwnerNameSet();
    const entries = [];

    districts.forEach((district) => {
      if (district.type !== typeKey) return;

      const districtLabel = String(district.name || `${formatDistrictType(typeKey)} ${district.id || "?"}`);
      const owner = normalizeOwnerName(district.owner);
      const isOwnedByPlayer = Boolean(owner && playerNames.has(owner));
      const buildings = Array.isArray(district.buildings) ? district.buildings : [];

      buildings.forEach((building, index) => {
        const baseName = String(building || "Neznámá budova");
        const named = resolveDistrictBuildingDisplayName(district, index, baseName, districtLabel);
        const variantName = named !== baseName ? named : null;
        entries.push({
          baseName,
          variantName,
          displayName: named,
          districtType: typeKey,
          districtId: Number.isFinite(Number(district.id))
            ? Number(district.id)
            : hashDistrictSeed(`${districtLabel}:${baseName}`, index),
          buildingIndex: index,
          unlocked: isOwnedByPlayer
        });
      });
    });

    return entries;
  }

  function resolveOwnedBuildingEntriesForDistrictType(typeKey) {
    const playerNames = getPlayerOwnerNameSet();
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const entries = [];

    districts.forEach((district) => {
      if (district.type !== typeKey) return;
      const owner = normalizeOwnerName(district.owner);
      if (!owner || !playerNames.has(owner)) return;

      const districtLabel = String(district.name || `${formatDistrictType(typeKey)} ${district.id || "?"}`);
      const buildings = Array.isArray(district.buildings) ? district.buildings : [];
      buildings.forEach((building, index) => {
        const baseName = String(building || "Neznámá budova");
        const named = resolveDistrictBuildingDisplayName(district, index, baseName, districtLabel);
        const variantName = named !== baseName ? named : null;
        entries.push({
          baseName,
          variantName,
          displayName: named,
          districtType: typeKey,
          districtId: Number.isFinite(Number(district.id))
            ? Number(district.id)
            : hashDistrictSeed(`${districtLabel}:${baseName}`, index),
          buildingIndex: index,
          unlocked: true
        });
      });
    });

    return entries;
  }

  function resolveDistrictBuildingDisplayName(district, index, baseName, districtLabel) {
    const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
    const override = overrides[index];
    if (typeof override === "string" && override.trim()) {
      return override.trim();
    }
    return `${baseName} • ${districtLabel}`;
  }

  function resolveBuildingsLockContext(typeKey) {
    if (!scenarioVisionEnabled) {
      return { enforceLocks: false, unlockedBuildings: new Set() };
    }
    return {
      enforceLocks: true,
      unlockedBuildings: getOwnedBuildingsForType(typeKey)
    };
  }

  function getOwnedBuildingsForType(typeKey) {
    const playerNames = getPlayerOwnerNameSet();
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const ownedBuildings = new Set();

    districts.forEach((district) => {
      if (district.type !== typeKey) return;
      const owner = normalizeOwnerName(district.owner);
      if (!owner || !playerNames.has(owner)) return;
      const buildings = Array.isArray(district.buildings) ? district.buildings : [];
      buildings.forEach((building) => {
        ownedBuildings.add(normalizeOwnerName(building));
      });
    });

    return ownedBuildings;
  }

  function assignDistrictMetadata(districts) {
    if (!Array.isArray(districts) || !districts.length) return districts;
    const nextDistricts = districts.map((district) => ({
      ...district,
      buildings: Array.isArray(district.buildings) ? district.buildings : [],
      buildingNameOverrides: Array.isArray(district.buildingNameOverrides) ? [...district.buildingNameOverrides] : [],
      buildingTier: district.buildingTier || null,
      buildingSetKey: district.buildingSetKey || null,
      buildingSetTitle: district.buildingSetTitle || null
    }));

    const bounds = getDistrictBounds(nextDistricts);
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "commercial",
      pools: commercialDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.4, high: 0.2 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "residential",
      pools: residentialDistrictPools,
      tiers: ["early", "mid", "late"],
      ratios: { low: 0.45, high: 0.2 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "park",
      pools: parkDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.45, high: 0.25 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "industrial",
      pools: industrialDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.4, high: 0.25 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "downtown",
      pools: downtownDistrictPools,
      tiers: ["mid", "high", "core"],
      ratios: { low: 0.4, high: 0.25 }
    });
    rebalanceCommercialArcades(nextDistricts, 7);
    rebalanceResidentialTaxi(nextDistricts, {
      removeBrainwash: 11,
      addTaxi: 11
    });
    rebalanceIndustrialStorage(nextDistricts, {
      removeStorage: 12,
      addArmories: 6,
      addFactories: 6
    });
    rebalanceIndustrialUtilityCounts(nextDistricts, {
      targetStorage: 21,
      reduceDataCenters: 5,
      reducePowerStations: 10
    });
    rebalanceDowntownCivicInfrastructure(nextDistricts);
    assignDowntownExchangeNames(nextDistricts);
    assignDowntownCentralBankNames(nextDistricts);
    assignDowntownAirportNames(nextDistricts);
    assignDowntownLobbyClubNames(nextDistricts);
    assignDowntownCityHallNames(nextDistricts);
    assignDowntownParliamentNames(nextDistricts);
    assignDowntownPortNames(nextDistricts);
    assignDowntownCourtNames(nextDistricts);
    assignDowntownVipLoungeNames(nextDistricts);
    assignCommercialMallNames(nextDistricts);
    assignCommercialRestaurantNames(nextDistricts);
    assignCommercialPharmacyNames(nextDistricts);
    assignCommercialAutoSalonNames(nextDistricts);
    assignCommercialFitnessClubNames(nextDistricts);
    assignCommercialOfficeBlockNames(nextDistricts);
    assignCommercialExchangeNames(nextDistricts);
    assignCommercialArcadeNames(nextDistricts);
    assignCommercialCasinoNames(nextDistricts);
    assignIndustrialDataCenterNames(nextDistricts);
    assignIndustrialPowerStationNames(nextDistricts);
    assignIndustrialStorageNames(nextDistricts);
    assignIndustrialFactoryNames(nextDistricts);
    assignIndustrialArmoryNames(nextDistricts);
    assignResidentialBrainwashNames(nextDistricts);
    assignResidentialApartmentBlockNames(nextDistricts);
    assignResidentialGarageNames(nextDistricts);
    assignResidentialClinicNames(nextDistricts);
    assignResidentialRecruitNames(nextDistricts);
    assignResidentialSchoolNames(nextDistricts);
    assignResidentialTaxiNames(nextDistricts);
    assignParkDrugLabNames(nextDistricts);
    assignParkSmugglingTunnelNames(nextDistricts);
    assignParkStreetDealersNames(nextDistricts);
    assignParkStripClubNames(nextDistricts);
    assignParkConvenienceStoreNames(nextDistricts);

    return nextDistricts;
  }

  function assignDowntownExchangeNames(districts) {
    assignNamedDowntownBuildings(districts, "Burza", namedDowntownExchanges);
  }

  function assignDowntownCentralBankNames(districts) {
    assignNamedDowntownBuildings(districts, "Centrální banka", namedDowntownCentralBanks);
  }

  function assignDowntownAirportNames(districts) {
    assignNamedDowntownBuildings(districts, "Letiště", namedDowntownAirports);
  }

  function assignDowntownLobbyClubNames(districts) {
    assignNamedDowntownBuildings(districts, "Lobby klub", namedDowntownLobbyClubs);
  }

  function assignDowntownCityHallNames(districts) {
    assignNamedDowntownBuildings(districts, "Magistrát", namedDowntownCityHalls);
  }

  function assignDowntownParliamentNames(districts) {
    assignNamedDowntownBuildings(districts, "Parlament", namedDowntownParliaments);
  }

  function assignDowntownPortNames(districts) {
    assignNamedDowntownBuildings(districts, "Přístav", namedDowntownPorts);
  }

  function assignDowntownCourtNames(districts) {
    assignNamedDowntownBuildings(districts, "Soud", namedDowntownCourts);
  }

  function assignDowntownVipLoungeNames(districts) {
    assignNamedDowntownBuildings(districts, "VIP salonek", namedDowntownVipLounges);
  }

  function assignCommercialMallNames(districts) {
    assignNamedCommercialBuildings(districts, "Obchodní centrum", namedCommercialMalls);
  }

  function assignCommercialRestaurantNames(districts) {
    assignNamedCommercialBuildings(districts, "Restaurace", namedCommercialRestaurants);
  }

  function assignCommercialPharmacyNames(districts) {
    assignNamedCommercialBuildings(districts, "Lékárna", namedCommercialPharmacies);
  }

  function assignCommercialAutoSalonNames(districts) {
    assignNamedCommercialBuildings(districts, "Autosalon", namedCommercialAutoSalons);
  }

  function assignCommercialFitnessClubNames(districts) {
    assignNamedCommercialBuildings(districts, "Fitness club", namedCommercialFitnessClubs);
  }

  function assignCommercialOfficeBlockNames(districts) {
    assignNamedCommercialBuildings(districts, "Kancelářský blok", namedCommercialOfficeBlocks);
  }

  function assignCommercialExchangeNames(districts) {
    assignNamedCommercialBuildings(districts, "Směnárna", namedCommercialExchanges);
  }

  function assignCommercialArcadeNames(districts) {
    assignNamedCommercialBuildings(districts, "Herna", namedCommercialArcades);
  }

  function assignCommercialCasinoNames(districts) {
    assignNamedCommercialBuildings(districts, "Kasino", namedCommercialCasinos);
  }

  function assignIndustrialDataCenterNames(districts) {
    assignNamedIndustrialBuildings(districts, "Datové centrum", namedIndustrialDataCenters);
  }

  function assignIndustrialPowerStationNames(districts) {
    assignNamedIndustrialBuildings(districts, "Energetická stanice", namedIndustrialPowerStations);
  }

  function assignIndustrialStorageNames(districts) {
    assignNamedIndustrialBuildings(districts, "Sklad", namedIndustrialStorages);
  }

  function assignIndustrialFactoryNames(districts) {
    assignNamedIndustrialBuildings(districts, "Továrna", namedIndustrialFactories);
  }

  function assignIndustrialArmoryNames(districts) {
    assignNamedIndustrialBuildings(districts, "Zbrojovka", namedIndustrialArmories);
  }

  function assignResidentialBrainwashNames(districts) {
    assignNamedResidentialBuildings(districts, "Brainwash centrum", namedResidentialBrainwashCenters);
  }

  function assignResidentialApartmentBlockNames(districts) {
    assignNamedResidentialBuildings(districts, "Bytový blok", namedResidentialApartmentBlocks);
  }

  function assignResidentialGarageNames(districts) {
    assignNamedResidentialBuildings(districts, "Garage", namedResidentialGarages);
  }

  function assignResidentialClinicNames(districts) {
    assignNamedResidentialBuildings(districts, "Klinika", namedResidentialClinics);
  }

  function assignResidentialRecruitNames(districts) {
    assignNamedResidentialBuildings(districts, "Rekrutační centrum", namedResidentialRecruitCenters);
  }

  function assignResidentialSchoolNames(districts) {
    assignNamedResidentialBuildings(districts, "Škola", namedResidentialSchools);
  }

  function assignResidentialTaxiNames(districts) {
    assignNamedResidentialBuildings(districts, "Taxi služba", namedResidentialTaxiServices);
  }

  function assignParkDrugLabNames(districts) {
    assignNamedParkBuildings(districts, "Drug lab", namedParkDrugLabs);
  }

  function assignParkSmugglingTunnelNames(districts) {
    assignNamedParkBuildings(districts, "Pašovací tunel", namedParkSmugglingTunnels);
  }

  function assignParkStreetDealersNames(districts) {
    assignNamedParkBuildings(districts, "Pouliční dealeři", namedParkStreetDealers);
  }

  function assignParkStripClubNames(districts) {
    assignNamedParkBuildings(districts, "Strip club", namedParkStripClubs);
  }

  function assignParkConvenienceStoreNames(districts) {
    assignNamedParkBuildings(districts, "Večerka", namedParkConvenienceStores);
  }

  function assignNamedCommercialBuildings(districts, buildingName, customNames) {
    if (!Array.isArray(districts) || !districts.length) return;
    if (!Array.isArray(customNames) || !customNames.length) return;
    const targets = districts
      .filter((district) => district.type === "commercial" && Array.isArray(district.buildings))
      .sort((a, b) => a.id - b.id)
      .flatMap((district) =>
        district.buildings
          .map((name, index) => (name === buildingName ? { district, index } : null))
          .filter(Boolean)
      );

    targets.forEach((target, index) => {
      const customName = customNames[index];
      if (!customName) return;
      if (!Array.isArray(target.district.buildingNameOverrides)) {
        target.district.buildingNameOverrides = [];
      }
      target.district.buildingNameOverrides[target.index] = customName;
    });
  }

  function assignNamedIndustrialBuildings(districts, buildingName, customNames) {
    if (!Array.isArray(districts) || !districts.length) return;
    if (!Array.isArray(customNames) || !customNames.length) return;
    const targets = districts
      .filter((district) => district.type === "industrial" && Array.isArray(district.buildings))
      .sort((a, b) => a.id - b.id)
      .flatMap((district) =>
        district.buildings
          .map((name, index) => (name === buildingName ? { district, index } : null))
          .filter(Boolean)
      );

    targets.forEach((target, index) => {
      const customName = customNames[index];
      if (!customName) return;
      if (!Array.isArray(target.district.buildingNameOverrides)) {
        target.district.buildingNameOverrides = [];
      }
      target.district.buildingNameOverrides[target.index] = customName;
    });
  }

  function assignNamedResidentialBuildings(districts, buildingName, customNames) {
    if (!Array.isArray(districts) || !districts.length) return;
    if (!Array.isArray(customNames) || !customNames.length) return;
    const targets = districts
      .filter((district) => district.type === "residential" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .flatMap((district) =>
        district.buildings
          .map((name, index) => (name === buildingName ? { district, index } : null))
          .filter(Boolean)
      );

    targets.forEach((target, index) => {
      const customName = customNames[index];
      if (!customName) return;
      if (!Array.isArray(target.district.buildingNameOverrides)) {
        target.district.buildingNameOverrides = [];
      }
      target.district.buildingNameOverrides[target.index] = customName;
    });
  }

  function assignNamedParkBuildings(districts, buildingName, customNames) {
    if (!Array.isArray(districts) || !districts.length) return;
    if (!Array.isArray(customNames) || !customNames.length) return;
    const targets = districts
      .filter((district) => district.type === "park" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .flatMap((district) =>
        district.buildings
          .map((name, index) => (name === buildingName ? { district, index } : null))
          .filter(Boolean)
      );

    targets.forEach((target, index) => {
      const customName = customNames[index];
      if (!customName) return;
      if (!Array.isArray(target.district.buildingNameOverrides)) {
        target.district.buildingNameOverrides = [];
      }
      target.district.buildingNameOverrides[target.index] = customName;
    });
  }

  function assignNamedDowntownBuildings(districts, buildingName, customNames) {
    if (!Array.isArray(districts) || !districts.length) return;
    if (!Array.isArray(customNames) || !customNames.length) return;
    const targets = districts
      .filter((district) => district.type === "downtown" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .flatMap((district) =>
        district.buildings
          .map((name, index) => (name === buildingName ? { district, index } : null))
          .filter(Boolean)
      );

    targets.forEach((target, index) => {
      const customName = customNames[index];
      if (!customName) return;
      if (!Array.isArray(target.district.buildingNameOverrides)) {
        target.district.buildingNameOverrides = [];
      }
      target.district.buildingNameOverrides[target.index] = customName;
    });
  }

  function rebalanceCommercialArcades(districts, targetArcades = 7) {
    if (!Array.isArray(districts) || !districts.length) return;
    const desired = Math.max(0, Math.floor(Number(targetArcades) || 0));
    const commercialDistricts = districts
      .filter((district) => district.type === "commercial" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    const arcadeSlots = [];
    const restaurantSlots = [];
    commercialDistricts.forEach((district) => {
      district.buildings.forEach((building, index) => {
        if (building === "Herna") arcadeSlots.push({ district, index });
        if (building === "Restaurace") restaurantSlots.push({ district, index });
      });
    });

    if (arcadeSlots.length < desired) {
      const needed = desired - arcadeSlots.length;
      for (let i = 0; i < needed && i < restaurantSlots.length; i += 1) {
        const slot = restaurantSlots[i];
        slot.district.buildings[slot.index] = "Herna";
      }
      return;
    }

    if (arcadeSlots.length > desired) {
      const overflow = arcadeSlots.length - desired;
      for (let i = 0; i < overflow; i += 1) {
        const slot = arcadeSlots[i];
        slot.district.buildings[slot.index] = "Restaurace";
      }
    }
  }

  function rebalanceIndustrialStorage(
    districts,
    { removeStorage = 12, addArmories = 6, addFactories = 6 } = {}
  ) {
    if (!Array.isArray(districts) || !districts.length) return;
    const removeTarget = Math.max(0, Math.floor(Number(removeStorage) || 0));
    const armoryTarget = Math.max(0, Math.floor(Number(addArmories) || 0));
    const factoryTarget = Math.max(0, Math.floor(Number(addFactories) || 0));
    if (!removeTarget || (!armoryTarget && !factoryTarget)) return;

    const industrialDistricts = districts
      .filter((district) => district.type === "industrial" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    let storageSlots = industrialDistricts.flatMap((district) =>
      district.buildings
        .map((building, index) =>
          building === "Sklad" ? { district, index, key: `${district.id}:${index}` } : null
        )
        .filter(Boolean)
    );

    const replacementOrder = [
      ...Array.from({ length: armoryTarget }, () => "Zbrojovka"),
      ...Array.from({ length: factoryTarget }, () => "Továrna")
    ];
    const maxReplacements = Math.min(removeTarget, replacementOrder.length, storageSlots.length);
    if (!maxReplacements) return;

    storageSlots = storageSlots.slice(0, maxReplacements);
    const selected = [];

    const takeSlots = (targetName, count) => {
      if (!count || !storageSlots.length) return [];
      const preferred = [];
      const fallback = [];
      storageSlots.forEach((slot) => {
        if (slot.district.buildings.includes(targetName)) fallback.push(slot);
        else preferred.push(slot);
      });
      const picks = [...preferred.slice(0, count)];
      if (picks.length < count) {
        picks.push(...fallback.slice(0, count - picks.length));
      }
      const pickedKeys = new Set(picks.map((slot) => slot.key));
      storageSlots = storageSlots.filter((slot) => !pickedKeys.has(slot.key));
      return picks;
    };

    const armoryReplaceCount = Math.min(armoryTarget, maxReplacements);
    const factoryReplaceCount = Math.min(factoryTarget, maxReplacements - armoryReplaceCount);

    takeSlots("Zbrojovka", armoryReplaceCount).forEach((slot) =>
      selected.push({ ...slot, next: "Zbrojovka" })
    );
    takeSlots("Továrna", factoryReplaceCount).forEach((slot) =>
      selected.push({ ...slot, next: "Továrna" })
    );

    selected.forEach((slot) => {
      slot.district.buildings[slot.index] = slot.next;
    });
  }

  function rebalanceIndustrialUtilityCounts(
    districts,
    { targetStorage = 21, reduceDataCenters = 5, reducePowerStations = 10 } = {}
  ) {
    if (!Array.isArray(districts) || !districts.length) return;
    const desiredStorage = Math.max(0, Math.floor(Number(targetStorage) || 0));
    const dataReduction = Math.max(0, Math.floor(Number(reduceDataCenters) || 0));
    const powerReduction = Math.max(0, Math.floor(Number(reducePowerStations) || 0));
    if (!desiredStorage && !dataReduction && !powerReduction) return;

    const industrialDistricts = districts
      .filter((district) => district.type === "industrial" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    const collectSlots = (buildingName) => industrialDistricts.flatMap((district) =>
      district.buildings
        .map((building, index) => (building === buildingName ? { district, index, key: `${district.id}:${index}` } : null))
        .filter(Boolean)
    );

    let storageSlots = collectSlots("Sklad");
    let storageNeeded = Math.max(0, desiredStorage - storageSlots.length);
    if (!storageNeeded) return;

    const applyReplacement = (buildingName, maxReduction) => {
      if (!storageNeeded || !maxReduction) return;
      const slots = collectSlots(buildingName);
      const replacements = Math.min(storageNeeded, maxReduction, slots.length);
      for (let i = 0; i < replacements; i += 1) {
        const slot = slots[i];
        slot.district.buildings[slot.index] = "Sklad";
      }
      storageNeeded -= replacements;
    };

    applyReplacement("Datové centrum", dataReduction);
    applyReplacement("Energetická stanice", powerReduction);
  }

  function rebalanceResidentialTaxi(
    districts,
    { removeBrainwash = 11, addTaxi = 11 } = {}
  ) {
    if (!Array.isArray(districts) || !districts.length) return;
    const removeTarget = Math.max(0, Math.floor(Number(removeBrainwash) || 0));
    const addTarget = Math.max(0, Math.floor(Number(addTaxi) || 0));
    if (!removeTarget || !addTarget) return;

    const residentialDistricts = districts
      .filter((district) => district.type === "residential" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    const brainwashSlots = residentialDistricts.flatMap((district) =>
      district.buildings
        .map((building, index) => (building === "Brainwash centrum" ? { district, index } : null))
        .filter(Boolean)
    );

    const replacements = Math.min(removeTarget, addTarget, brainwashSlots.length);
    if (!replacements) return;

    for (let i = 0; i < replacements; i += 1) {
      const slot = brainwashSlots[i];
      slot.district.buildings[slot.index] = "Taxi služba";
    }
  }

  function rebalanceDowntownCivicInfrastructure(districts) {
    if (!Array.isArray(districts) || !districts.length) return;
    const downtownDistricts = districts
      .filter((district) => district.type === "downtown" && Array.isArray(district.buildings))
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    if (!downtownDistricts.length) return;

    const bankSlots = [];
    const magistrateSlots = [];
    downtownDistricts.forEach((district) => {
      district.buildings.forEach((building, index) => {
        if (building === "Centrální banka") bankSlots.push({ district, index });
        if (building === "Magistrát") magistrateSlots.push({ district, index });
      });
    });

    const bankReplacements = ["Letiště", "Přístav"];
    const magistrateReplacements = ["Přístav", "Přístav", "Parlament"];

    for (let i = 0; i < bankReplacements.length && i < bankSlots.length; i += 1) {
      const slot = bankSlots[i];
      slot.district.buildings[slot.index] = bankReplacements[i];
    }

    for (let i = 0; i < magistrateReplacements.length && i < magistrateSlots.length; i += 1) {
      const slot = magistrateSlots[i];
      slot.district.buildings[slot.index] = magistrateReplacements[i];
    }
  }

  function assignDistrictTypePools(districts, bounds, config) {
    const typedDistricts = districts.filter((district) => district.type === config.type);
    if (!typedDistricts.length) return;

    const ranked = typedDistricts
      .map((district) => ({
        district,
        distance: distanceFromMapCenter(district, bounds)
      }))
      .sort((a, b) => b.distance - a.distance);

    const total = ranked.length;
    const lowCount = Math.max(1, Math.round(total * config.ratios.low));
    const highCount = total >= 5 ? Math.max(1, Math.round(total * config.ratios.high)) : Math.min(1, total);
    const midCount = Math.max(0, total - lowCount - highCount);

    ranked.forEach((entry, index) => {
      let tier = config.tiers[1];
      if (index < lowCount) tier = config.tiers[0];
      else if (index >= lowCount + midCount) tier = config.tiers[2];
      const set = pickDistrictSet(config.pools, entry.district, tier, index);
      entry.district.buildings = Array.isArray(set.buildings) ? [...set.buildings] : [];
      entry.district.buildingNameOverrides = [];
      entry.district.buildingTier = set.tier;
      entry.district.buildingSetKey = set.key;
      entry.district.buildingSetTitle = set.title;
    });
  }

  function pickCommercialSet(district, tier, index) {
    const pool = commercialDistrictPools[tier] || commercialDistrictPools.mid;
    const offset = hashDistrictSeed(district.id, index) % pool.length;
    return pool[offset];
  }

  function pickDistrictSet(pools, district, tier, index) {
    const fallbackTier = Object.keys(pools)[1] || Object.keys(pools)[0];
    const pool = pools[tier] || pools[fallbackTier] || [];
    const offset = hashDistrictSeed(district.id, index) % pool.length;
    return pool[offset];
  }

  function hashDistrictSeed(seed, extra = 0) {
    const text = `${seed || ""}:${extra}`;
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function getDistrictBounds(districts) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    districts.forEach((district) => {
      (district.polygon || []).forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    return {
      minX: Number.isFinite(minX) ? minX : 0,
      minY: Number.isFinite(minY) ? minY : 0,
      maxX: Number.isFinite(maxX) ? maxX : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0
    };
  }

  function distanceFromMapCenter(district, bounds) {
    const center = polygonCentroid(district.polygon || []);
    const mapCenterX = (bounds.minX + bounds.maxX) / 2;
    const mapCenterY = (bounds.minY + bounds.maxY) / 2;
    const dx = center.x - mapCenterX;
    const dy = center.y - mapCenterY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function polygonCentroid(polygon) {
    if (!Array.isArray(polygon) || !polygon.length) {
      return { x: 0, y: 0 };
    }
    const sum = polygon.reduce(
      (acc, point) => {
        acc.x += Number(point[0] || 0);
        acc.y += Number(point[1] || 0);
        return acc;
      },
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / polygon.length,
      y: sum.y / polygon.length
    };
  }

  function formatDistrictType(type) {
    const labels = {
      downtown: "Centrum",
      commercial: "Komerční zóna",
      residential: "Rezidenční zóna",
      industrial: "Průmyslová zóna",
      park: "Park"
    };
    return labels[type] || type || "Neznámý typ";
  }

  async function hydrateAfterAuth() {
    setScenarioVisionMode(false);
    setScenarioAllianceOwners([]);
    setScenarioEnemyOwners([]);
    const [profile, economy, districtData, allianceData] = await Promise.all([
      window.Empire.API.getProfile(),
      window.Empire.API.getEconomy(),
      window.Empire.API.getDistricts(),
      window.Empire.API.getAlliance().catch(() => ({ alliance: null }))
    ]);

    window.Empire.player = profile;
    updateEconomy(economy);
    setLiveAllianceOwnersFromAlliance(allianceData?.alliance || null);

    if (districtData && districtData.districts) {
      window.Empire.Map.clearUnderAttackDistricts?.();
      window.Empire.Map.clearPoliceActions?.();
      window.Empire.Map.setDistricts(districtData.districts);
    }

    updateProfile(profile);

    window.Empire.WS.connect();
  }

  function extractAllianceDisplayName(allianceValue) {
    const raw = String(allianceValue || "").trim();
    if (!raw) return "";
    if (normalizeOwnerName(raw) === "žádná") return "";
    let cleaned = raw.replace(/\(\s*[^)]*sektor[^)]*\)\s*$/i, "").trim();
    cleaned = cleaned.replace(/\s*\+\s*\d*\s*spojen[a-z]*.*$/i, "").trim();
    if (cleaned.includes("•")) {
      cleaned = cleaned.split("•")[0].trim();
    }
    return cleaned || raw;
  }

  function extractAllianceSectorCountHint(allianceValue) {
    const raw = String(allianceValue || "").trim();
    const match = raw.match(/(\d+)\s*sektor/i);
    if (!match) return 0;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  function formatSectorCountLabel(value) {
    const amount = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    if (amount === 1) return "1 sektor";
    if (amount >= 2 && amount <= 4) return `${amount} sektory`;
    return `${amount} sektorů`;
  }

  function formatPopulationLabel(value) {
    const amount = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    return amount.toLocaleString("cs-CZ");
  }

  function getLocalGangMembersBonus() {
    const parsed = Number(localStorage.getItem(LOCAL_GANG_MEMBERS_KEY) || 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }

  function setLocalGangMembersBonus(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    localStorage.setItem(LOCAL_GANG_MEMBERS_KEY, String(safeValue));
    return safeValue;
  }

  function getLocalGangMembersSpent() {
    const parsed = Number(localStorage.getItem(LOCAL_GANG_MEMBERS_SPENT_KEY) || 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }

  function setLocalGangMembersSpent(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    localStorage.setItem(LOCAL_GANG_MEMBERS_SPENT_KEY, String(safeValue));
    return safeValue;
  }

  function consumeGangMembers(amount) {
    const delta = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (delta <= 0) return countPlayerControlledPopulation(cachedProfile || window.Empire.player || {});
    const spent = getLocalGangMembersSpent();
    const nextSpent = setLocalGangMembersSpent(spent + delta);
    refreshProfilePopulation();
    return nextSpent;
  }

  function refreshProfilePopulation() {
    const profileSource = cachedProfile || window.Empire.player || {};
    updateProfile(profileSource);
    return countPlayerControlledPopulation(profileSource);
  }

  function addGangMembers(amount) {
    const delta = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (delta <= 0) {
      return refreshProfilePopulation();
    }
    const spent = getLocalGangMembersSpent();
    if (spent > 0) {
      const recovered = Math.min(spent, delta);
      setLocalGangMembersSpent(spent - recovered);
      const leftover = delta - recovered;
      if (leftover > 0) {
        setLocalGangMembersBonus(getLocalGangMembersBonus() + leftover);
      }
    } else {
      setLocalGangMembersBonus(getLocalGangMembersBonus() + delta);
    }
    refreshProfilePopulation();
    return countPlayerControlledPopulation(cachedProfile || window.Empire.player || {});
  }

  function getCurrentGangMembers() {
    return getLocalGangMembersBonus();
  }

  function countAllianceControlledSectors() {
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    if (!districts.length) return 0;
    const ownerNames = new Set(getPlayerOwnerNameSet());
    getActiveAllianceOwnerNames().forEach((owner) => ownerNames.add(owner));
    if (!ownerNames.size) return 0;
    return districts.reduce((sum, district) => {
      const owner = normalizeOwnerName(district?.owner);
      return owner && ownerNames.has(owner) ? sum + 1 : sum;
    }, 0);
  }

  function countPlayerControlledPopulation(profile) {
    const bonusMembers = getLocalGangMembersBonus();
    const spentMembers = getLocalGangMembersSpent();
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    if (!districts.length) return Math.max(0, Number(profile?.population || 0) + bonusMembers - spentMembers);

    const weights = {
      downtown: 3600,
      commercial: 2600,
      residential: 5400,
      industrial: 1900,
      park: 1300
    };
    const playerOwners = getPlayerOwnerNameSet();
    if (!playerOwners.size) return Math.max(0, Number(profile?.population || 0) + bonusMembers - spentMembers);

    const total = districts.reduce((sum, district) => {
      const owner = normalizeOwnerName(district?.owner);
      if (!owner || !playerOwners.has(owner)) return sum;
      const typeKey = String(district?.type || "").trim().toLowerCase();
      const fallback = 2200;
      const population = Number(district?.population);
      if (Number.isFinite(population) && population > 0) {
        return sum + Math.floor(population);
      }
      return sum + (weights[typeKey] || fallback);
    }, 0);

    if (total > 0) return Math.max(0, total + bonusMembers - spentMembers);
    return Math.max(0, Number(profile?.population || 0) + bonusMembers - spentMembers);
  }

  function formatFactionLabel(value) {
    const raw = String(value || "").trim();
    if (!raw) return "-";
    const normalized = raw.toLowerCase();
    const labels = {
      "mafián": "Mafián",
      "kartel": "Kartel",
      "pouliční gang": "Pouliční gang",
      "tajná organizace": "Tajná organizace",
      "hackeři": "Hackeři",
      "motorkářský gang": "Motorkářský gang",
      "soukromá armáda": "Soukromá armáda",
      "korporace": "Korporace"
    };
    return labels[normalized] || raw;
  }

  function clampWantedHeat(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(WANTED_HEAT_MAX, Math.round(parsed * 10) / 10));
  }

  function resolveStealthHeatMultiplier(profile) {
    const safeProfile = profile && typeof profile === "object" ? profile : {};
    const candidates = [
      safeProfile.stealthBuild,
      safeProfile.stealth_build,
      safeProfile.buildType,
      safeProfile.build_type,
      safeProfile.specialBuild,
      safeProfile.special_build,
      safeProfile.playStyle,
      safeProfile.play_style,
      safeProfile.strategy,
      safeProfile.style
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const value = candidates[i];
      if (value === true) return 0.8;
      if (typeof value === "string" && value.trim().toLowerCase().includes("stealth")) return 0.8;
    }
    return 1;
  }

  function formatWantedHeat(value) {
    const heat = clampWantedHeat(value);
    if (Math.abs(heat - Math.round(heat)) < 0.001) {
      return `${Math.round(heat)}`;
    }
    return heat.toFixed(1).replace(/\.0$/, "");
  }

  function readGangHeatJournal() {
    try {
      const raw = localStorage.getItem(HEAT_JOURNAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveGangHeatJournal(entries) {
    const safeEntries = Array.isArray(entries) ? entries.slice(0, 40) : [];
    localStorage.setItem(HEAT_JOURNAL_STORAGE_KEY, JSON.stringify(safeEntries));
    return safeEntries;
  }

  function clearGangHeatJournal() {
    localStorage.setItem(HEAT_JOURNAL_STORAGE_KEY, JSON.stringify([]));
  }

  function appendGangHeatJournalEntry(type, amount, reason, createdAt = Date.now()) {
    const safeType = String(type || "").trim().toLowerCase();
    if (safeType !== "rise" && safeType !== "fall") return null;
    const safeAmount = Math.max(0, Number(amount) || 0);
    const safeReason = String(reason || "").trim();
    if (!safeAmount || !safeReason) return null;
    const current = readGangHeatJournal();
    current.unshift({
      type: safeType,
      amount: Math.round(safeAmount * 10) / 10,
      reason: safeReason,
      createdAt: Math.max(0, Math.floor(Number(createdAt) || Date.now()))
    });
    saveGangHeatJournal(current);
    return current[0];
  }

  function formatRelativeHeatTime(timestamp) {
    const diffMs = Math.max(0, Date.now() - Math.max(0, Number(timestamp) || 0));
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "právě teď";
    if (diffMinutes < 60) return `před ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `před ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `před ${diffDays} d`;
  }

  function getOwnedPlayerDistricts() {
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    return districts.filter((district) => isDistrictOwnedByPlayer(district));
  }

  function getBlackoutIncomeDistricts(districtsInput = window.Empire.districts) {
    const districts = Array.isArray(districtsInput) ? districtsInput : [];
    const ownedDistricts = districts.filter((district) => isDistrictOwnedByPlayer(district));
    const byId = new Map();
    ownedDistricts.forEach((district) => {
      byId.set(Number(district?.id), district);
    });
    if (!ownedDistricts.length && activePlayerScenarioKey === "alliance-ten-blackout") {
      districts.forEach((district) => {
        const districtId = Number(district?.id);
        if (!BLACKOUT_PLAYER_FALLBACK_DISTRICT_IDS.includes(districtId)) return;
        byId.set(districtId, district);
      });
    } else if (activePlayerScenarioKey === "alliance-ten-blackout") {
      districts.forEach((district) => {
        const districtId = Number(district?.id);
        if (!BLACKOUT_PLAYER_FALLBACK_DISTRICT_IDS.includes(districtId)) return;
        byId.set(districtId, district);
      });
    }
    return Array.from(byId.values()).filter((district) => !Boolean(district?.isDestroyed));
  }

  function spendDirtyCash(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    if (money.dirtyMoney < required) {
      return { ok: false, reason: "insufficient_dirty_cash", available: money.dirtyMoney };
    }
    money.dirtyMoney -= required;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return { ok: true, spent: required };
  }

  function setPlayerWantedHeat(nextHeat, reason = "", type = "fall") {
    const safeHeat = clampWantedHeat(nextHeat);
    const currentProfile = window.Empire.player && typeof window.Empire.player === "object"
      ? window.Empire.player
      : {};
    const previousHeat = resolveWantedLevel(currentProfile);
    const updatedProfile = {
      ...currentProfile,
      heat: safeHeat,
      wantedLevel: safeHeat,
      wanted: safeHeat,
      policeHeat: safeHeat,
      police_heat: safeHeat
    };
    updateProfile(updatedProfile);
    window.Empire.PoliceHeat?.setExternalHeat?.(safeHeat, updatedProfile);
    if (reason) {
      appendGangHeatJournalEntry(type, Math.abs(safeHeat - previousHeat), reason);
    }
    return safeHeat;
  }

  function readDirtyHeatReductionTimestamps() {
    try {
      const raw = localStorage.getItem(HEAT_DIRTY_REDUCTION_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed.map((value) => Number(value)).filter(Number.isFinite) : [];
    } catch (_) {
      return [];
    }
  }

  function saveDirtyHeatReductionTimestamps(entries) {
    const safeEntries = Array.isArray(entries) ? entries.filter((value) => Number.isFinite(Number(value))) : [];
    localStorage.setItem(HEAT_DIRTY_REDUCTION_STORAGE_KEY, JSON.stringify(safeEntries));
    return safeEntries;
  }

  function registerDirtyHeatReductionAndMaybeTriggerPolice() {
    const now = Date.now();
    const recent = readDirtyHeatReductionTimestamps()
      .filter((timestamp) => now - Number(timestamp) <= GANG_HEAT_DIRTY_TRIGGER_WINDOW_MS);
    recent.push(now);
    saveDirtyHeatReductionTimestamps(recent);
    if (recent.length < GANG_HEAT_DIRTY_TRIGGER_COUNT) return false;
    saveDirtyHeatReductionTimestamps([]);
    const ownedDistricts = getOwnedPlayerDistricts();
    if (!ownedDistricts.length) return false;
    const target = ownedDistricts[Math.floor(Math.random() * ownedDistricts.length)];
    if (!target?.id) return false;
    window.Empire.Map?.markDistrictPoliceAction?.(target.id, {
      durationMs: GANG_HEAT_POLICE_DURATION_MS,
      source: "heat-dirty-reduction"
    });
    pushEvent(`Podezřelé praní heatu přitáhlo policii do distriktu ${target.name || `#${target.id}`}.`);
    return true;
  }

  function resolveWantedStars(heatValue) {
    const heat = clampWantedHeat(heatValue);
    const tier = WANTED_HEAT_TIERS.find((entry) => heat >= entry.min && heat <= entry.max);
    return tier ? tier.stars : 6;
  }

  function updateProfileWantedStars(heatValue) {
    const root = document.getElementById("profile-wanted-stars");
    if (!root) return;
    const stars = Array.from(root.querySelectorAll("[data-profile-wanted-star]"));
    if (!stars.length) return;
    const activeStars = resolveWantedStars(heatValue);
    stars.forEach((star, index) => {
      star.classList.toggle("is-active", index < activeStars);
    });
    const heat = clampWantedHeat(heatValue);
    const heatLabel = formatWantedHeat(heat);
    root.setAttribute("aria-label", `Stupeň hledanosti ${activeStars}/6 (${heatLabel} heat)`);
    root.title = `Hledanost: ${activeStars}/6 (${heatLabel} heat)`;
  }

  function resolveWantedLevel(profile) {
    const stealthMultiplier = resolveStealthHeatMultiplier(profile || window.Empire?.player || {});
    const explicitCandidates = [
      profile?.wantedLevel,
      profile?.wanted_level,
      profile?.wanted,
      profile?.heat,
      profile?.notoriety,
      profile?.policeHeat,
      profile?.police_heat,
      window.Empire?.PoliceHeat?.state?.player?.totalHeat
    ];
    for (let i = 0; i < explicitCandidates.length; i += 1) {
      const parsed = Number(explicitCandidates[i]);
      if (Number.isFinite(parsed)) {
        return clampWantedHeat(parsed * stealthMultiplier);
      }
    }

    const economy = cachedEconomy || {};
    const moneyProfile = resolveMoneyBreakdown(profile || {});
    const moneyEconomy = resolveMoneyBreakdown(economy || {});
    const dirtyMoney = Math.max(moneyProfile.dirtyMoney || 0, moneyEconomy.dirtyMoney || 0);
    const districts = Math.max(0, Math.floor(Number(profile?.districts || 0)));
    const influence = Math.max(0, Number(profile?.influence || 0));
    const population = countPlayerControlledPopulation(profile);

    const score = Math.round(
      districts * 4
      + influence * 0.08
      + dirtyMoney / 12000
      + population / 25000
    );
    return clampWantedHeat(score * 10 * stealthMultiplier);
  }

  function resolvePoliceRaidProtectionUntil(profile) {
    const explicitCandidates = [
      profile?.policeRaidProtectionUntil,
      profile?.police_raid_protection_until,
      window.Empire?.PoliceHeat?.state?.player?.policeRaidProtectionUntil,
      window.Empire?.PoliceHeat?.state?.player?.police_raid_protection_until
    ];
    for (let i = 0; i < explicitCandidates.length; i += 1) {
      const parsed = Number(explicitCandidates[i]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }

  function formatPoliceRaidProtectionLabel(profile) {
    const until = resolvePoliceRaidProtectionUntil(profile);
    if (!until) return "Bez ochrany";
    const remaining = until - Date.now();
    if (remaining <= 0) return "Bez ochrany";
    return `Aktivní ${formatDurationLabel(remaining)}`;
  }

  function formatAllianceProfileSummary(profile) {
    const name = extractAllianceDisplayName(profile?.alliance);
    if (!name) return "Žádná";

    let totalSectors = countAllianceControlledSectors();
    if (!totalSectors) {
      totalSectors = extractAllianceSectorCountHint(profile?.alliance);
    }

    return totalSectors > 0
      ? `${name} • ${formatSectorCountLabel(totalSectors)}`
      : name;
  }

  function updateProfile(profile) {
    cachedProfile = profile;
    const profileSpyCount = resolveSpyCountFromPayload(profile);
    if (profileSpyCount != null) {
      setSpyCount(profileSpyCount, { persist: true });
    } else if (cachedSpyCount == null) {
      const defaultSpies = resolveFactionBaseSpyCount(profile?.structure || localStorage.getItem("empire_structure"));
      setSpyCount(defaultSpies, { persist: true });
    } else {
      renderInfluenceSpyTopbarStat();
    }
    const profileGangColor = normalizeHexColor(profile?.gangColor || profile?.gang_color);
    if (profileGangColor) {
      localStorage.setItem("empire_gang_color", profileGangColor);
    }
    window.Empire.player = {
      ...(window.Empire.player || {}),
      ...(profile || {})
    };
    const factionLabel = formatFactionLabel(profile.structure || localStorage.getItem("empire_structure"));
    const wantedLevel = resolveWantedLevel(profile);
    document.getElementById("profile-gang").textContent = formatPopulationLabel(countPlayerControlledPopulation(profile));
    document.getElementById("profile-districts").textContent = profile.districts || 0;
    document.getElementById("profile-alliance").textContent = formatAllianceProfileSummary(profile);
    setAllianceButtonState(profile.alliance || "Žádná");
    const structure = document.getElementById("profile-structure");
    const statStructure = document.getElementById("stat-structure");
    const faction = document.getElementById("profile-faction");
    if (structure) {
      structure.textContent = formatWantedHeat(wantedLevel);
    }
    if (statStructure) {
      statStructure.textContent = formatWantedHeat(wantedLevel);
    }
    updateProfileWantedStars(wantedLevel);
    if (faction) {
      faction.textContent = factionLabel;
    }
    refreshGangColorDisplays();
    hydrateProfileModal(profile);
    updateWeaponsPopover();
    updateDefensePopover();
    renderGangHeatModal();
    syncMapVisionContext();
    refreshMarketBuildingShortcuts();
    window.Empire.Map?.render?.();
  }

  function closeGangHeatModal() {
    const root = document.getElementById("gang-heat-modal");
    if (root) root.classList.add("hidden");
  }

  function renderGangHeatModal() {
    const root = document.getElementById("gang-heat-modal");
    if (!root || root.classList.contains("hidden")) return;
    const valueEl = document.getElementById("gang-heat-modal-value");
    const tierEl = document.getElementById("gang-heat-modal-tier");
    const descEl = document.getElementById("gang-heat-modal-desc");
    const protectionEl = document.getElementById("gang-heat-modal-protection");
    const levelsEl = document.getElementById("gang-heat-modal-levels");
    const riseListEl = document.getElementById("gang-heat-rise-list");
    const fallListEl = document.getElementById("gang-heat-fall-list");
    const currentHeat = resolveWantedLevel(cachedProfile || window.Empire.player || {});
    const currentStars = resolveWantedStars(currentHeat);
    const currentLevel = GANG_HEAT_LEVELS.find((entry) => entry.stars === currentStars) || GANG_HEAT_LEVELS[0];
    if (valueEl) valueEl.textContent = formatWantedHeat(currentHeat);
    if (tierEl) tierEl.textContent = `${currentLevel.label} • ${currentLevel.title}`;
    if (descEl) descEl.textContent = currentLevel.description;
    if (protectionEl) {
      protectionEl.textContent = `Ochrana po razii: ${formatPoliceRaidProtectionLabel(cachedProfile || window.Empire.player || {})}`;
    }

    if (levelsEl) {
      levelsEl.innerHTML = GANG_HEAT_LEVELS.map((entry) => `
        <div class="gang-heat-modal__level ${entry.stars === currentStars ? "is-active" : ""}">
          <strong>${entry.label}</strong>
          <span>${entry.title}</span>
        </div>
      `).join("");
    }

    const entries = readGangHeatJournal();
    const rising = entries.filter((entry) => entry?.type === "rise").slice(0, 6);
    const falling = entries.filter((entry) => entry?.type === "fall").slice(0, 6);
    const renderList = (items, emptyText) => items.length
      ? items.map((entry) => `
          <div class="gang-heat-modal__item">
            <strong>${entry.reason}</strong>
            <span class="gang-heat-modal__delta-row">
              <em class="gang-heat-modal__delta-badge ${entry.type === "rise" ? "is-rise" : "is-fall"}">${entry.type === "rise" ? "+heat" : "-heat"}</em>
              <span>${entry.amount > 0 ? `${entry.type === "rise" ? "+" : "-"}${entry.amount} heat` : ""}</span>
            </span>
            <small>${formatRelativeHeatTime(entry.createdAt)}</small>
          </div>
        `).join("")
      : `<div class="gang-heat-modal__empty">${emptyText}</div>`;
    if (riseListEl) riseListEl.innerHTML = renderList(rising, "Zatím bez nových důvodů růstu.");
    if (fallListEl) fallListEl.innerHTML = renderList(falling, "Zatím bez nových důvodů poklesu.");
  }

  function openGangHeatModal() {
    const root = document.getElementById("gang-heat-modal");
    if (!root) return;
    root.classList.remove("hidden");
    renderGangHeatModal();
  }

  function getActiveOwnedPoliceRaidContext() {
    const snapshot = window.Empire.Map?.getPoliceActionSnapshot?.();
    if (!snapshot || !Array.isArray(snapshot.actions) || !snapshot.actions.length) return null;
    const nowMs = Math.max(0, Math.floor(Number(snapshot.now) || Date.now()));
    const impactMap = getPoliceRaidImpactMap();
    impactMap.forEach((value, key) => {
      if (!value || Number(value.expiresAt || 0) <= nowMs) {
        impactMap.delete(key);
      }
    });
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const actions = snapshot.actions
      .map((action) => {
        const districtId = Number(action?.districtId);
        if (!Number.isFinite(districtId)) return null;
        const district = districts.find((entry) => Number(entry?.id) === districtId);
        if (!district || !isDistrictOwnedByPlayer(district)) return null;
        return {
          ...action,
          district
        };
      })
      .filter(Boolean);
    if (!actions.length) return null;
    actions.sort((a, b) => Number(b.remainingMs || 0) - Number(a.remainingMs || 0));
    return {
      action: actions[0],
      actions,
      activeCount: actions.length,
      incomePenaltyPct: Math.max(0, Math.floor(Number(snapshot.incomePenaltyPct || 0)))
    };
  }

  function hasActivePoliceRaidImpactLock(fieldName) {
    const activeRaid = getActiveOwnedPoliceRaidContext();
    if (!activeRaid || !Array.isArray(activeRaid.actions)) return false;
    return activeRaid.actions.some((entry) => {
      const key = buildPoliceRaidImpactKey(entry || {});
      const impact = key ? getPoliceRaidImpactMap().get(key) : null;
      return Boolean(impact?.[fieldName]);
    });
  }

  function isPoliceRaidBuildingSpecialActionsLocked(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
      let changed = false;
      let hasActiveLock = false;
      ["pharmacy_factory_special", "all_special_buildings"].forEach((lockKey) => {
        const until = Math.max(0, Math.floor(Number(parsed[lockKey] || 0)));
        if (until > nowMs) {
          hasActiveLock = true;
          return;
        }
        if (parsed[lockKey]) {
          delete parsed[lockKey];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY, JSON.stringify(parsed));
      }
      return hasActiveLock;
    } catch {
      return false;
    }
  }

  function openGangHeatPanelOrRaidImpactModal() {
    const raidContext = getActiveOwnedPoliceRaidContext();
    if (!raidContext) {
      openGangHeatModal();
      return;
    }
    const wantedHeat = resolveWantedLevel(cachedProfile || window.Empire.player || {});
    const wantedTier = resolveWantedStars(wantedHeat);
    const district = raidContext.action?.district || null;
    const districtName = String(district?.name || "").trim() || `District #${raidContext.action?.districtId || "-"}`;
    const remainingMs = Math.max(0, Math.floor(Number(raidContext.action?.remainingMs || 0)));
    const activeCount = Math.max(1, Math.floor(Number(raidContext.activeCount || 1)));
    const affectedLabel = activeCount === 1 ? "1 district" : `${activeCount} districty`;
    const impactKey = buildPoliceRaidImpactKey(raidContext.action || {});
    const impact = impactKey ? getPoliceRaidImpactMap().get(impactKey) : null;
    const tier = Math.max(1, Math.floor(Number(impact?.tier || wantedTier)));
    const specialty =
      resolveStoredPoliceRaidSpecialty(raidContext?.action || {})
      || resolveStoredPoliceRaidSpecialty(impact || {})
      || resolvePoliceRaidSpecialtyFromOperationType(raidContext?.action?.operationType, impact)
      || resolvePoliceRaidSpecialty(tier, impact || {});
    const incomePenaltyPct = Math.max(0, Math.floor(Number(impact?.incomePenaltyPct || raidContext.incomePenaltyPct || POLICE_RAID_TIER1.incomePenaltyPct)));
    const summary = tier === 1
      ? "Razia 1. stupně probíhá. Aktivní dopady: income -10%, zabavení peněz, zatčení obyvatel, vliv -5% a zákaz špehování."
      : tier === 2
        ? "Razia 2. stupně probíhá. Aktivní dopady: income -20%, zabavení peněz, drogy -5%, zatčení 3-7%, út. zbraně -3%, vliv -6 až -8%, zákaz špehování i krádeže, výroba Lékárna/Drug Lab -10%."
      : tier === 3
        ? "Razia 3. stupně probíhá. Aktivní dopady: income -21 až -26%, zabavení peněz, drogy -6 až -9%, zatčení 7-12%, ztráty útočných i obranných zbraní, vliv -8 až -12%, zákaz špehování/vykradení/útoku a výrobní postihy."
      : tier === 4
        ? "Razia 4. stupně probíhá. Aktivní dopady: income -26 až -33%, výrazné zabavení skladu, ztráty lidí i zbraní, síla obrany -10%, síla útoku -8%, zákaz špehování/vykradení/útoku/obsazení, blok speciálních akcí Lékárna/Továrna a silnější výrobní postihy."
      : tier === 5
        ? "Razia 5. stupně probíhá. Aktivní dopady: income -32 až -40%, masivní zabavení clean/dirty i materiálů, silné ztráty lidí a zbraní, síla útoku/obrany -15%, zákaz hlavních akcí i speciálních akcí ve 4 budovách, výroba je zmražená."
      : tier === 6
              ? "Razia 6. stupně probíhá. Aktivní dopady: income zastaveno, zabavení clean/dirty, materiálů i drog, velké ztráty obyvatel a zbraní, síla útoku/obrany -30% a všechny akce včetně budov jsou zakázané."
            : "Razia právě probíhá. Dopady podle stupně doplníme v dalších krocích.";
    const tierRows = tier === 1
      ? [
        { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER1.cleanConfiscationPct)))}%)` },
        { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER1.dirtyConfiscationPctMin)))}%)` },
        { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER1.arrestsPct)))}%)` },
        { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER1.influencePenaltyPct)))}%)` },
        { label: "Špehování", value: "ZAKÁZÁNO" }
      ]
      : tier === 2
        ? [
          { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER2.cleanConfiscationPctMin)))}%)` },
          { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER2.dirtyConfiscationPctMin)))}%)` },
          { label: "Drogy", value: `-${Math.max(0, Math.floor(Number(impact?.drugLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.drugLossPct || POLICE_RAID_TIER2.drugLossPct)))}%)` },
          { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER2.arrestsPctMin)))}%)` },
          { label: "Útočné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.attackWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.attackWeaponLossPct || POLICE_RAID_TIER2.attackWeaponLossPct)))}%)` },
          { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER2.influencePenaltyPctMin)))}%)` },
          { label: "Špehování", value: "ZAKÁZÁNO" },
          { label: "Vykrást", value: "ZAKÁZÁNO" },
          { label: "Výroba Lékárna / Drug Lab", value: `-${Math.max(0, Math.floor(Number(impact?.productionPenaltyPct || POLICE_RAID_TIER2.productionPenaltyPct)))}%` }
        ]
        : tier === 3
          ? [
            { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER3.cleanConfiscationPctMin)))}%)` },
            { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER3.dirtyConfiscationPctMin)))}%)` },
            { label: "Drogy", value: `-${Math.max(0, Math.floor(Number(impact?.drugLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.drugLossPct || POLICE_RAID_TIER3.drugLossPctMin)))}%)` },
            { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER3.arrestsPctMin)))}%)` },
            { label: "Útočné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.attackWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.attackWeaponLossPct || POLICE_RAID_TIER3.attackWeaponLossPctMin)))}%)` },
            { label: "Obranné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.defenseWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.defenseWeaponLossPct || POLICE_RAID_TIER3.defenseWeaponLossPctMin)))}%)` },
            { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER3.influencePenaltyPctMin)))}%)` },
            { label: "Špehování", value: "ZAKÁZÁNO" },
            { label: "Vykrást", value: "ZAKÁZÁNO" },
            { label: "Útok", value: "ZAKÁZÁNO" },
            { label: "Výroba Lékárna / Drug Lab", value: `-${Math.max(0, Math.floor(Number(impact?.labProductionPenaltyPct || POLICE_RAID_TIER3.labProductionPenaltyPctMin)))}%` },
            { label: "Výroba Zbrojovka", value: `-${Math.max(0, Math.floor(Number(impact?.armoryProductionPenaltyPct || POLICE_RAID_TIER3.armoryProductionPenaltyPctMin)))}%` }
          ]
          : tier === 4
            ? [
              { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER4.cleanConfiscationPctMin)))}%)` },
              { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER4.dirtyConfiscationPctMin)))}%)` },
              { label: "Drogy", value: `-${Math.max(0, Math.floor(Number(impact?.drugLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.drugLossPct || POLICE_RAID_TIER4.drugLossPctMin)))}%)` },
              { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER4.arrestsPctMin)))}%)` },
              { label: "Útočné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.attackWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.attackWeaponLossPct || POLICE_RAID_TIER4.attackWeaponLossPct)))}%)` },
              { label: "Obranné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.defenseWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.defenseWeaponLossPct || POLICE_RAID_TIER4.defenseWeaponLossPct)))}%)` },
              { label: "Síla Obrana", value: `-${Math.max(0, Math.floor(Number(impact?.defensePowerPenaltyPct || POLICE_RAID_TIER4.defensePowerPenaltyPct)))}%` },
              { label: "Síla Útok", value: `-${Math.max(0, Math.floor(Number(impact?.attackPowerPenaltyPct || POLICE_RAID_TIER4.attackPowerPenaltyPct)))}%` },
              { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER4.influencePenaltyPctMin)))}%)` },
              { label: "Špehování", value: "ZAKÁZÁNO" },
              { label: "Vykrást", value: "ZAKÁZÁNO" },
              { label: "Útok", value: "ZAKÁZÁNO" },
              { label: "Obsadit", value: "ZAKÁZÁNO" },
              { label: "Spec. akce Lékárna/Továrna", value: "ZAKÁZÁNO" },
              { label: "Výroba Lékárna / Drug Lab", value: `-${Math.max(0, Math.floor(Number(impact?.labProductionPenaltyPct || POLICE_RAID_TIER4.labProductionPenaltyPctMin)))}%` },
              { label: "Výroba Zbrojovka", value: `-${Math.max(0, Math.floor(Number(impact?.armoryProductionPenaltyPct || POLICE_RAID_TIER4.armoryProductionPenaltyPctMin)))}%` }
            ]
          : tier === 5
              ? [
                { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER5.cleanConfiscationPctMin)))}%)` },
                { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER5.dirtyConfiscationPctMin)))}%)` },
                { label: "Materiály", value: `-${Math.max(0, Math.floor(Number(impact?.materialLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.materialLossPct || POLICE_RAID_TIER5.materialLossPct)))}%)` },
                { label: "Drogy", value: `-${Math.max(0, Math.floor(Number(impact?.drugLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.drugLossPct || POLICE_RAID_TIER5.drugLossPctMin)))}%)` },
                { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER5.arrestsPctMin)))}%)` },
                { label: "Útočné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.attackWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.attackWeaponLossPct || POLICE_RAID_TIER5.attackWeaponLossPct)))}%)` },
                { label: "Obranné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.defenseWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.defenseWeaponLossPct || POLICE_RAID_TIER5.defenseWeaponLossPct)))}%)` },
                { label: "Síla Obrana", value: `-${Math.max(0, Math.floor(Number(impact?.defensePowerPenaltyPct || POLICE_RAID_TIER5.defensePowerPenaltyPct)))}%` },
                { label: "Síla Útok", value: `-${Math.max(0, Math.floor(Number(impact?.attackPowerPenaltyPct || POLICE_RAID_TIER5.attackPowerPenaltyPct)))}%` },
                { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER5.influencePenaltyPctMin)))}%)` },
                { label: "Špehování", value: "ZAKÁZÁNO" },
                { label: "Vykrást", value: "ZAKÁZÁNO" },
                { label: "Útok", value: "ZAKÁZÁNO" },
                { label: "Obsadit", value: "ZAKÁZÁNO" },
                { label: "Spec. akce Lékárna/Továrna", value: "ZAKÁZÁNO" },
                { label: "Spec. akce Drug Lab/Zbrojovka", value: "ZAKÁZÁNO" },
                { label: "Výroba budov", value: "ZMRAŽENO (1h)" }
              ]
            : tier === 6
              ? [
                { label: "Zabavení clean", value: `${Math.max(0, Math.floor(Number(impact?.cleanLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.cleanLossPct || POLICE_RAID_TIER6.cleanConfiscationPct)))}%)` },
                { label: "Zabavení dirty", value: `${Math.max(0, Math.floor(Number(impact?.dirtyLoss || 0)))}$ (${Math.max(0, Math.floor(Number(impact?.dirtyLossPct || POLICE_RAID_TIER6.dirtyConfiscationPct)))}%)` },
                { label: "Materiály", value: `-${Math.max(0, Math.floor(Number(impact?.materialLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.materialLossPct || POLICE_RAID_TIER6.materialLossPct)))}%)` },
                { label: "Drogy", value: `-${Math.max(0, Math.floor(Number(impact?.drugLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.drugLossPct || POLICE_RAID_TIER6.drugLossPct)))}%)` },
                { label: "Zatčení obyvatel", value: `${Math.max(0, Math.floor(Number(impact?.arrested || 0)))} (${Math.max(0, Math.floor(Number(impact?.arrestsPct || POLICE_RAID_TIER6.arrestsPct)))}%)` },
                { label: "Útočné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.attackWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.attackWeaponLossPct || POLICE_RAID_TIER6.attackWeaponLossPct)))}%)` },
                { label: "Obranné zbraně", value: `-${Math.max(0, Math.floor(Number(impact?.defenseWeaponLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.defenseWeaponLossPct || POLICE_RAID_TIER6.defenseWeaponLossPct)))}%)` },
                { label: "Síla Obrana", value: `-${Math.max(0, Math.floor(Number(impact?.defensePowerPenaltyPct || POLICE_RAID_TIER6.defensePowerPenaltyPct)))}%` },
                { label: "Síla Útok", value: `-${Math.max(0, Math.floor(Number(impact?.attackPowerPenaltyPct || POLICE_RAID_TIER6.attackPowerPenaltyPct)))}%` },
                { label: "Pokles vlivu", value: `-${Math.max(0, Math.floor(Number(impact?.influenceLoss || 0)))} (${Math.max(0, Math.floor(Number(impact?.influenceLossPct || POLICE_RAID_TIER6.influencePenaltyPct)))}%)` },
                { label: "Špehování", value: "ZAKÁZÁNO" },
                { label: "Vykrást", value: "ZAKÁZÁNO" },
                { label: "Útok", value: "ZAKÁZÁNO" },
                { label: "Obsadit", value: "ZAKÁZÁNO" },
                { label: "Spec. akce budov", value: "ZAKÁZÁNO" },
                { label: "Výroba budov", value: "ZASTAVENA" }
              ]
        : [];
    const toneClass = tier >= 6
      ? "is-tier-6"
      : tier === 5
        ? "is-tier-5"
        : tier === 4
          ? "is-tier-4"
          : tier === 3
            ? "is-tier-3"
            : tier === 2
              ? "is-tier-2"
              : "is-tier-1";
    openPoliceActionResultModal({
      title: "Dopady razie",
      badge: `Razia aktivní • ${specialty.label} • Stupeň ${wantedTier}/6 • Tier ${tier}`,
      tone: toneClass,
      summary: "",
      rows: [
        { label: "Zasažený district", value: districtName },
        { label: "Aktivně zasaženo", value: affectedLabel },
        { label: "Typ razie", value: `${specialty.icon} ${specialty.label}` },
        { label: "Snížení income", value: `-${incomePenaltyPct}% (1h)` },
        ...tierRows,
        { label: "Zbývající čas", value: formatDurationLabel(remainingMs) }
      ]
    });
  }

  function handleGangHeatReduction(mode) {
    const currentHeat = resolveWantedLevel(cachedProfile || window.Empire.player || {});
    if (mode === "dirty") {
      const spendResult = spendDirtyCash(GANG_HEAT_DIRTY_COST);
      if (!spendResult.ok) {
        pushEvent("Nemáš dost špinavých peněz na snížení heatu.");
        renderGangHeatModal();
        return;
      }
      const nextHeat = Math.max(0, currentHeat - GANG_HEAT_DIRTY_REDUCTION);
      setPlayerWantedHeat(nextHeat, "Uplacení tlaku špinavými penězi", "fall");
      pushEvent(`Heat snížen o ${GANG_HEAT_DIRTY_REDUCTION} za $${GANG_HEAT_DIRTY_COST} dirty.`);
      registerDirtyHeatReductionAndMaybeTriggerPolice();
      renderGangHeatModal();
      return;
    }
    const spendResult = trySpendCleanCash(GANG_HEAT_CLEAN_COST);
    if (!spendResult.ok) {
      pushEvent("Nemáš dost čistých peněz na snížení heatu.");
      renderGangHeatModal();
      return;
    }
    const nextHeat = Math.max(0, currentHeat - GANG_HEAT_CLEAN_REDUCTION);
    setPlayerWantedHeat(nextHeat, "Legální krytí a zahlazení stop", "fall");
    pushEvent(`Heat snížen o ${GANG_HEAT_CLEAN_REDUCTION} za $${GANG_HEAT_CLEAN_COST} clean.`);
    renderGangHeatModal();
  }

  function initGangHeatModal() {
    const trigger = document.getElementById("profile-heat-panel");
    const root = document.getElementById("gang-heat-modal");
    const backdrop = document.getElementById("gang-heat-modal-backdrop");
    const closeBtn = document.getElementById("gang-heat-modal-close");
    const dirtyBtn = document.getElementById("gang-heat-dirty-btn");
    const cleanBtn = document.getElementById("gang-heat-clean-btn");
    const clearLogBtn = document.getElementById("gang-heat-clear-log-btn");
    if (trigger) {
      trigger.addEventListener("click", () => openGangHeatPanelOrRaidImpactModal());
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openGangHeatPanelOrRaidImpactModal();
      });
    }
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", closeGangHeatModal);
    if (closeBtn) closeBtn.addEventListener("click", closeGangHeatModal);
    if (dirtyBtn) dirtyBtn.addEventListener("click", () => handleGangHeatReduction("dirty"));
    if (cleanBtn) cleanBtn.addEventListener("click", () => handleGangHeatReduction("clean"));
    if (clearLogBtn) {
      clearLogBtn.addEventListener("click", () => {
        clearGangHeatJournal();
        renderGangHeatModal();
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeGangHeatModal();
      }
    });
  }

  function setGuestMode(isGuest) {
    guestModeActive = Boolean(isGuest);
    refreshGuestBannerVisibility();
    if (isGuest) {
      const baseSpies = resolveFactionBaseSpyCount(cachedProfile?.structure || localStorage.getItem("empire_structure"));
      writeSpyRecoveryQueue([]);
      syncSpyRecoveryTicker();
      setSpyCount(baseSpies, { persist: true });
      const state = getLocalAllianceState();
      renderAllianceChat(state.chat);
      syncGuestAllianceLabel(state.activeAlliance?.name || "Žádná");
      setLiveAllianceOwnersFromAlliance(state.activeAlliance || null);
      syncGuestEconomyFromMarket();
    } else {
      clearLiveAllianceOwners();
    }
  }

  function refreshGuestBannerVisibility() {
    const banner = document.getElementById("guest-banner");
    if (!banner) return;
    const hasSelectedScenario = Boolean(document.querySelector("[data-player-scenario].is-active"));
    banner.classList.toggle("hidden", !guestModeActive || hasSelectedScenario);
  }

  function initProfileModal() {
    const root = document.getElementById("profile-modal");
    const backdrop = document.getElementById("profile-modal-backdrop");
    const closeBtn = document.getElementById("profile-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function initAllianceModal() {
    const openBtn = document.getElementById("alliance-btn");
    const root = document.getElementById("alliance-modal");
    const backdrop = document.getElementById("alliance-modal-backdrop");
    const closeBtn = document.getElementById("alliance-modal-close");
    const createToggleBtn = document.getElementById("alliance-create-toggle-btn");
    const leaveModal = document.getElementById("alliance-leave-modal");
    const leaveModalBackdrop = document.getElementById("alliance-leave-modal-backdrop");
    const leaveModalCloseBtn = document.getElementById("alliance-leave-modal-close");
    const leaveCancelBtn = document.getElementById("alliance-leave-cancel-btn");
    const leaveConfirmBtn = document.getElementById("alliance-leave-confirm-btn");
    const createModal = document.getElementById("alliance-create-modal");
    const createModalBackdrop = document.getElementById("alliance-create-modal-backdrop");
    const createModalCloseBtn = document.getElementById("alliance-create-modal-close");
    const managementModal = document.getElementById("alliance-management-modal");
    const managementModalBackdrop = document.getElementById("alliance-management-modal-backdrop");
    const managementModalCloseBtn = document.getElementById("alliance-management-modal-close");
    const managementInviteName = document.getElementById("alliance-management-invite-name");
    const managementInviteBtn = document.getElementById("alliance-management-invite-btn");
    const createBtn = document.getElementById("alliance-create-btn");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    const createName = document.getElementById("alliance-create-name");
    const createDescription = document.getElementById("alliance-create-description");
    const iconPicker = document.getElementById("alliance-icon-picker");
    const chatInput = document.getElementById("alliance-chat-input");
    const chatSend = document.getElementById("alliance-chat-send");
    const activePanel = document.getElementById("alliance-active-panel");
    if (!root || !openBtn || !createToggleBtn || !leaveModal || !leaveConfirmBtn || !createModal || !managementModal || !managementInviteName || !managementInviteBtn || !createBtn || !leaveBtn || !createName || !createDescription || !iconPicker || !chatInput || !chatSend) return;

    let selectedAllianceIconKey = DEFAULT_ALLIANCE_ICON_KEY;

    const resetCreateAllianceForm = () => {
      createName.value = "";
      createDescription.value = DEFAULT_ALLIANCE_DESCRIPTION;
      selectedAllianceIconKey = DEFAULT_ALLIANCE_ICON_KEY;
      renderAllianceIconPicker();
    };

    const setCreateAllianceModalVisible = (visible) => {
      createModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => createName.focus());
      }
    };

    const setAllianceManagementModalVisible = (visible) => {
      managementModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => managementInviteName.focus());
      }
    };

    const setAllianceLeaveModalVisible = (visible) => {
      leaveModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => leaveConfirmBtn.focus());
      }
    };

    const captureAllianceScrollState = () => ({
      modalBody: root.querySelector(".alliance-modal__body")?.scrollTop || 0,
      members: document.querySelector("#alliance-active-panel .alliance-members")?.scrollTop || 0,
      managementBody: managementModal.querySelector(".alliance-management-modal__body")?.scrollTop || 0,
      managementPanel: document.getElementById("alliance-management-panel")?.scrollTop || 0
    });

    const restoreAllianceScrollState = (scrollState) => {
      if (!scrollState) return;
      const modalBody = root.querySelector(".alliance-modal__body");
      const members = document.querySelector("#alliance-active-panel .alliance-members");
      const managementBody = managementModal.querySelector(".alliance-management-modal__body");
      const managementPanel = document.getElementById("alliance-management-panel");
      if (modalBody) modalBody.scrollTop = Number(scrollState.modalBody || 0);
      if (members) members.scrollTop = Number(scrollState.members || 0);
      if (managementBody) managementBody.scrollTop = Number(scrollState.managementBody || 0);
      if (managementPanel) managementPanel.scrollTop = Number(scrollState.managementPanel || 0);
    };

    const renderAllianceIconPicker = () => {
      iconPicker.innerHTML = ALLIANCE_ICON_OPTIONS.map((icon) => `
        <button
          type="button"
          class="alliance-icon-option${icon.key === selectedAllianceIconKey ? " is-selected" : ""}"
          data-alliance-icon-key="${icon.key}"
          title="${icon.label}"
          aria-label="${icon.label}"
        >
          <span class="alliance-icon-option__symbol">${icon.symbol}</span>
        </button>
      `).join("");
      iconPicker.querySelectorAll("[data-alliance-icon-key]").forEach((button) => {
        button.addEventListener("click", () => {
          selectedAllianceIconKey = button.getAttribute("data-alliance-icon-key") || DEFAULT_ALLIANCE_ICON_KEY;
          renderAllianceIconPicker();
        });
      });
    };

    const refreshAlliance = async () => {
      const scrollState = captureAllianceScrollState();
      if (!window.Empire.token) {
        const localState = getLocalAllianceState();
        const activeAllianceId = String(localState.activeAllianceId || "").trim();
        if (activePlayerScenarioKey !== "alliance-ten-blackout" && activeAllianceId.startsWith("scenario-")) {
          localState.activeAllianceId = null;
          saveLocalAllianceState(localState);
        }
        const resolvedLocalState = withActiveAlliance(localState);
        renderAllianceState(resolvedLocalState.activeAlliance, resolvedLocalState.alliances, resolvedLocalState.incomingInvites || []);
        renderAllianceManagementState(resolvedLocalState.activeAlliance);
        renderAllianceChat(resolvedLocalState.chat);
        setLiveAllianceOwnersFromAlliance(resolvedLocalState.activeAlliance || null);
        syncBlackoutScenarioAllianceDistrictState(resolvedLocalState.activeAlliance || null);
        syncGuestAllianceLabel(resolvedLocalState.activeAlliance?.name || "Žádná");
        restoreAllianceScrollState(scrollState);
        (resolvedLocalState.notifications || []).forEach((notification) => {
          pushEvent(`Aliance: ${notification.message}`);
        });
        if ((resolvedLocalState.notifications || []).length) {
          resolvedLocalState.notifications = [];
          saveLocalAllianceState(resolvedLocalState);
        }
        return;
      }
      const [mine, listing] = await Promise.all([
        window.Empire.API.getAlliance(),
        window.Empire.API.listAlliances()
      ]);
      renderAllianceState(mine.alliance || null, listing.alliances || [], mine.incomingInvites || []);
      renderAllianceManagementState(mine.alliance || null);
      renderAllianceChat([]);
      setLiveAllianceOwnersFromAlliance(mine.alliance || null);
      restoreAllianceScrollState(scrollState);
      (mine.notifications || []).forEach((notification) => {
        pushEvent(`Aliance: ${notification.message}`);
      });
    };
    allianceRefreshHandler = refreshAlliance;

    const sendAllianceChatMessage = async (input) => {
      const targetInput = input instanceof HTMLInputElement ? input : null;
      const text = String(targetInput?.value || "").trim();
      if (!text) return;
      if (window.Empire.token) {
        pushEvent("Alliance chat backend zatím není napojený.");
        return;
      }
      const state = getLocalAllianceState();
      appendLocalAllianceChat(state, {
        author: "Ty",
        text
      });
      saveLocalAllianceState(state);
      document.querySelectorAll("[data-alliance-chat-input]").forEach((field) => {
        if (field instanceof HTMLInputElement) {
          field.value = "";
        }
      });
      renderAllianceChat(state.chat);
    };

    openBtn.addEventListener("click", async () => {
      setMobileTopbarCoveredByPrimaryModal(false);
      root.classList.remove("hidden");
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      resetCreateAllianceForm();
      await refreshAlliance();
      if (allianceCountdownIntervalId) window.clearInterval(allianceCountdownIntervalId);
      allianceCountdownIntervalId = window.setInterval(() => {
        if (!root.classList.contains("hidden") && allianceRefreshHandler) {
          allianceRefreshHandler().catch(() => {});
        }
      }, 10000);
    });
    createToggleBtn.addEventListener("click", () => {
      setCreateAllianceModalVisible(true);
    });
    createBtn.addEventListener("click", async () => {
      const name = String(createName.value || "").trim();
      const description = String(createDescription.value || "").trim();
      if (!name) {
        pushEvent("Zadej název aliance.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const newAlliance = createLocalAlliance(state, {
          name,
          description,
          iconKey: selectedAllianceIconKey
        });
        saveLocalAllianceState(state);
        pushEvent(`Aliance ${newAlliance.name} byla vytvořena.`);
        await refreshAlliance();
        syncGuestAllianceLabel(newAlliance.name);
        setCreateAllianceModalVisible(false);
        resetCreateAllianceForm();
        return;
      }
      const result = await window.Empire.API.createAlliance(name, description, selectedAllianceIconKey);
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Aliance byla vytvořena.");
      await refreshAlliance();
      setCreateAllianceModalVisible(false);
      resetCreateAllianceForm();
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    leaveBtn.addEventListener("click", async () => {
      setAllianceLeaveModalVisible(true);
    });
    leaveConfirmBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        leaveLocalAlliance(state);
        saveLocalAllianceState(state);
        pushEvent("Alianci jsi opustil.");
        await refreshAlliance();
        syncGuestAllianceLabel("Žádná");
        setAllianceLeaveModalVisible(false);
        return;
      }
      const result = await window.Empire.API.leaveAlliance();
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Alianci jsi opustil.");
      await refreshAlliance();
      setAllianceLeaveModalVisible(false);
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    if (leaveModalBackdrop) leaveModalBackdrop.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (leaveModalCloseBtn) leaveModalCloseBtn.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (leaveCancelBtn) leaveCancelBtn.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (backdrop) backdrop.addEventListener("click", () => {
      root.classList.add("hidden");
      setAllianceLeaveModalVisible(false);
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      if (allianceCountdownIntervalId) {
        window.clearInterval(allianceCountdownIntervalId);
        allianceCountdownIntervalId = null;
      }
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    if (closeBtn) closeBtn.addEventListener("click", () => {
      root.classList.add("hidden");
      setAllianceLeaveModalVisible(false);
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      if (allianceCountdownIntervalId) {
        window.clearInterval(allianceCountdownIntervalId);
        allianceCountdownIntervalId = null;
      }
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    if (createModalBackdrop) createModalBackdrop.addEventListener("click", () => {
      setCreateAllianceModalVisible(false);
    });
    if (createModalCloseBtn) createModalCloseBtn.addEventListener("click", () => {
      setCreateAllianceModalVisible(false);
    });
    if (managementModalBackdrop) managementModalBackdrop.addEventListener("click", () => {
      setAllianceManagementModalVisible(false);
    });
    if (managementModalCloseBtn) managementModalCloseBtn.addEventListener("click", () => {
      setAllianceManagementModalVisible(false);
    });
    managementInviteBtn.addEventListener("click", async () => {
      const username = String(managementInviteName.value || "").trim();
      if (!username) {
        pushEvent("Zadej jméno hráče pro pozvánku.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const result = sendLocalAllianceManagementInvite(state, username);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        saveLocalAllianceState(state);
        managementInviteName.value = "";
        pushEvent("Přímá pozvánka byla odeslána.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
        return;
      }
      const result = await window.Empire.API.sendAllianceManagementInvite(username);
      if (result.error) {
        pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
        return;
      }
      managementInviteName.value = "";
      pushEvent("Přímá pozvánka byla odeslána.");
      if (allianceRefreshHandler) await allianceRefreshHandler();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!createModal.classList.contains("hidden")) {
          setCreateAllianceModalVisible(false);
        } else if (!managementModal.classList.contains("hidden")) {
          setAllianceManagementModalVisible(false);
        } else {
          root.classList.add("hidden");
          if (allianceCountdownIntervalId) {
            window.clearInterval(allianceCountdownIntervalId);
            allianceCountdownIntervalId = null;
          }
          setMobileTopbarCoveredByPrimaryModal(false);
        }
      }
    });
    chatInput.setAttribute("data-alliance-chat-input", "");
    chatSend.setAttribute("data-alliance-chat-send", "");
    chatSend.addEventListener("click", async () => {
      await sendAllianceChatMessage(chatInput);
    });
    chatInput.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      await sendAllianceChatMessage(chatInput);
    });
    if (activePanel) {
      activePanel.addEventListener("click", async (event) => {
        const trigger = event.target instanceof HTMLElement
          ? event.target.closest("[data-alliance-chat-send]")
          : null;
        if (!(trigger instanceof HTMLElement)) return;
        const input = activePanel.querySelector("[data-alliance-chat-input]");
        if (input instanceof HTMLInputElement) {
          await sendAllianceChatMessage(input);
        }
      });
      activePanel.addEventListener("keydown", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-alliance-chat-input")) return;
        if (event.key !== "Enter") return;
        event.preventDefault();
        await sendAllianceChatMessage(target);
      });
    }
    renderAllianceIconPicker();
    setCreateAllianceModalVisible(false);
    setAllianceManagementModalVisible(false);
  }

  function getAllianceIconOption(iconKey) {
    const normalized = String(iconKey || "").trim() || DEFAULT_ALLIANCE_ICON_KEY;
    return ALLIANCE_ICON_OPTIONS.find((icon) => icon.key === normalized)
      || ALLIANCE_ICON_OPTIONS[0];
  }

  function normalizeAllianceNameKey(value) {
    return normalizeOwnerName(value);
  }

  function normalizeAllianceIconKey(value) {
    return getAllianceIconOption(value).key;
  }

  function setAllianceIconMap(targetMap, entries) {
    targetMap.clear();
    const safeEntries = entries instanceof Map
      ? Array.from(entries.entries())
      : Array.isArray(entries) ? entries : [];
    safeEntries.forEach(([allianceName, iconKey]) => {
      const nameKey = normalizeAllianceNameKey(allianceName);
      if (!nameKey) return;
      targetMap.set(nameKey, normalizeAllianceIconKey(iconKey));
    });
  }

  function resolveAllianceIconKeyByName(allianceName) {
    const nameKey = normalizeAllianceNameKey(allianceName);
    if (!nameKey) return null;
    return scenarioAllianceIconByName.get(nameKey)
      || liveAllianceIconByName.get(nameKey)
      || null;
  }

  function escapeAllianceMarkup(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderAllianceIdentityMarkup(alliance) {
    const icon = getAllianceIconOption(alliance?.icon_key || alliance?.iconKey);
    const name = escapeAllianceMarkup(alliance?.name || "Aliance");
    const label = escapeAllianceMarkup(icon.label);
    const symbol = escapeAllianceMarkup(icon.symbol);
    return `
      <span class="alliance-badge-markup" title="${label}">
        <span class="alliance-badge-markup__icon" aria-hidden="true">${symbol}</span>
        <span class="alliance-badge-markup__name">${name}</span>
      </span>
    `;
  }

  function formatAllianceError(errorKey) {
    switch (String(errorKey || "").trim()) {
      case "alliance_full":
        return "Aliance je plná.";
      case "member_exists":
        return "Tento člen už v alianci je.";
      case "no_active_alliance":
        return "Nejsi v žádné aktivní alianci.";
      case "already_in_alliance":
        return "Už jsi v alianci.";
      case "request_pending":
        return "Pozvánka už byla odeslána.";
      case "missing_request":
        return "Pozvánka nebyla nalezena.";
      case "not_alliance_owner":
        return "Tuto pozvánku může řešit jen vlastník aliance.";
      case "cannot_invite_self":
        return "Do vlastní aliance si pozvánku neposíláš.";
      case "missing_player":
        return "Tento hráč nebyl nalezen.";
      case "player_has_alliance":
        return "Hráč už je v jiné alianci.";
      case "invite_pending":
        return "Tomuto hráči už čeká přímá pozvánka.";
      case "missing_invite":
        return "Pozvání nebylo nalezeno.";
      case "not_invite_target":
        return "Tohle pozvání není určené tobě.";
      case "cannot_remove_leader":
        return "Leadera nelze vyhodit.";
      case "missing_member":
        return "Člen aliance nebyl nalezen.";
      case "member_ready_active":
        return "Tento člen je stále v READY okně.";
      case "vote_already_open":
        return "Pro tohoto člena už běží hlasování.";
      case "missing_vote":
        return "Hlasování nebylo nalezeno.";
      case "vote_already_cast":
        return "V tomto hlasování už jsi hlasoval.";
      case "cannot_vote_self":
        return "O vlastním vyhození hlasování nespustíš.";
      case "cannot_vote_target":
        return "Cílový člen o svém vyhození hlasovat nemůže.";
      default:
        return String(errorKey || "Neznámá chyba.");
    }
  }

  function computeLocalAllianceReadyState(readyAt) {
    const readyTimestamp = readyAt ? new Date(readyAt).getTime() : 0;
    const dueAt = readyTimestamp ? readyTimestamp + ALLIANCE_READY_WINDOW_MS : 0;
    const now = Date.now();
    return {
      readyAt: readyAt || null,
      readyDueAt: dueAt ? new Date(dueAt).toISOString() : null,
      isReadyWindowActive: Boolean(dueAt && dueAt > now),
      isReadyOverdue: !dueAt || dueAt <= now
    };
  }

  function formatAllianceDueLabel(isoValue) {
    if (!isoValue) return "READY chybí";
    const dueMs = new Date(isoValue).getTime();
    if (!Number.isFinite(dueMs)) return "READY chybí";
    const delta = Math.max(0, dueMs - Date.now());
    const totalMinutes = Math.ceil(delta / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  function formatAllianceDueLabelSeconds(isoValue) {
    if (!isoValue) return "00:00:00";
    const dueMs = new Date(isoValue).getTime();
    if (!Number.isFinite(dueMs)) return "00:00:00";
    const deltaSeconds = Math.max(0, Math.floor((dueMs - Date.now()) / 1000));
    const hours = Math.floor(deltaSeconds / 3600);
    const minutes = Math.floor((deltaSeconds % 3600) / 60);
    const seconds = deltaSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatAllianceRelativeTime(isoValue) {
    const timestamp = new Date(isoValue).getTime();
    if (!Number.isFinite(timestamp)) return "-";
    const diffMs = Math.max(0, Date.now() - timestamp);
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "právě teď";
    if (diffMinutes < 60) return `před ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `před ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `před ${diffDays} d`;
  }

  function countOwnedDistrictsForAllianceMember(memberName) {
    const normalizedMemberName = normalizeOwnerName(memberName);
    if (!normalizedMemberName) return 0;
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    return districts.reduce((sum, district) => {
      return sum + (normalizeOwnerName(district?.owner) === normalizedMemberName ? 1 : 0);
    }, 0);
  }

  function getAllianceMemberVisualData(member) {
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    const ownedDistrict = districts.find((district) => normalizeOwnerName(district?.owner) === normalizeOwnerName(member?.username));
    const sectorCount = countOwnedDistrictsForAllianceMember(member?.username);
    const faction = formatFactionLabel(
      member?.gang_structure
      || member?.gangStructure
      || ownedDistrict?.ownerFaction
      || ownedDistrict?.ownerStructure
      || resolveDemoOwnerFaction(member?.username || "")
    );
    const avatar = String(
      member?.avatar
      || member?.ownerAvatar
      || ownedDistrict?.ownerAvatar
      || resolveDemoOwnerAvatar(member?.username || "")
    ).trim();
    const color = normalizeHexColor(
      member?.gang_color
      || member?.gangColor
      || ownedDistrict?.ownerColor
      || null
    );
    return {
      sectorCount,
      sectorLabel: formatSectorCountLabel(sectorCount),
      faction,
      avatar,
      color
    };
  }

  function renderAllianceMemberCard(member, kickVotes = []) {
    const openVote = (kickVotes || []).find((vote) => String(vote.target_player_id) === String(member.id));
    const memberStatus = member.role === "leader"
      ? `<span class="alliance-ready-state alliance-ready-state--leader">Leader</span>`
      : member.isReadyWindowActive
        ? `<span class="alliance-ready-state alliance-ready-state--ok">READY ${formatAllianceDueLabelSeconds(member.readyDueAt)}</span>`
        : `<span class="alliance-ready-state alliance-ready-state--bad">READY chybí</span>`;
    const voteStatus = openVote ? `<span class="alliance-member__vote">Hlasování ${openVote.yes_votes}/${openVote.required_votes}</span>` : "";
    const visual = getAllianceMemberVisualData(member);
    const avatarMarkup = visual.avatar
      ? `<button class="alliance-member__avatar-btn" type="button" data-alliance-member-avatar="${escapeAllianceMarkup(member.username || "Hráč")}" data-alliance-member-avatar-src="${escapeAllianceMarkup(visual.avatar)}" data-alliance-member-avatar-meta="${escapeAllianceMarkup(`${visual.faction} • ${visual.sectorLabel}`)}"><img class="alliance-member__avatar" src="${escapeAllianceMarkup(visual.avatar)}" alt="Avatar ${escapeAllianceMarkup(member.username || "Hráč")}" loading="lazy" /></button>`
      : `<div class="alliance-member__avatar alliance-member__avatar--empty">${escapeAllianceMarkup(String(member?.username || "?").slice(0, 1).toUpperCase())}</div>`;
    const colorMarkup = visual.color
      ? `<span class="alliance-member__color"><span class="alliance-member__color-dot" style="background:${visual.color}"></span>${visual.color.toUpperCase()}</span>`
      : `<span class="alliance-member__color alliance-member__color--empty">Bez barvy</span>`;
    return `
      <div class="alliance-member">
        <div class="alliance-member__top">
          ${avatarMarkup}
          <div class="alliance-member__identity">
            <strong>${escapeAllianceMarkup(member.username || "Hráč")} <span class="alliance-member__sector-count">(${visual.sectorLabel})</span></strong>
            <span>${escapeAllianceMarkup(member.gang_name || "Gang")}</span>
          </div>
        </div>
        <div class="alliance-member__meta">
          <span>${escapeAllianceMarkup(visual.faction)}</span>
          ${colorMarkup}
        </div>
        <div class="alliance-member__status">
          ${memberStatus}
          ${voteStatus}
        </div>
      </div>
    `;
  }

  function bindAllianceMemberAvatarLightbox(root = document) {
    const lightbox = document.getElementById("alliance-member-lightbox");
    const image = document.getElementById("alliance-member-lightbox-image");
    const title = document.getElementById("alliance-member-lightbox-title");
    const meta = document.getElementById("alliance-member-lightbox-meta");
    const closeBtn = document.getElementById("alliance-member-lightbox-close");
    const backdrop = document.getElementById("alliance-member-lightbox-backdrop");
    if (!lightbox || !image || !title || !meta) return;

    const close = () => lightbox.classList.add("hidden");
    if (closeBtn && !closeBtn.dataset.boundAllianceLightbox) {
      closeBtn.dataset.boundAllianceLightbox = "1";
      closeBtn.addEventListener("click", close);
    }
    if (backdrop && !backdrop.dataset.boundAllianceLightbox) {
      backdrop.dataset.boundAllianceLightbox = "1";
      backdrop.addEventListener("click", close);
    }

    root.querySelectorAll("[data-alliance-member-avatar]").forEach((button) => {
      if (button.dataset.boundAllianceLightbox) return;
      button.dataset.boundAllianceLightbox = "1";
      button.addEventListener("click", () => {
        const src = String(button.getAttribute("data-alliance-member-avatar-src") || "").trim();
        if (!src) return;
        image.src = src;
        title.textContent = String(button.getAttribute("data-alliance-member-avatar") || "Člen aliance").trim() || "Člen aliance";
        meta.textContent = String(button.getAttribute("data-alliance-member-avatar-meta") || "").trim();
        lightbox.classList.remove("hidden");
      });
    });
  }

  function renderAllianceState(activeAlliance, alliances, incomingInvites = []) {
    const activePanel = document.getElementById("alliance-active-panel");
    const playerInvitesPanel = document.getElementById("alliance-player-invites-panel");
    const listPanel = document.getElementById("alliance-list-panel");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    const createToggleBtn = document.getElementById("alliance-create-toggle-btn");
    const createEntry = document.getElementById("alliance-create-entry");
    if (!activePanel || !playerInvitesPanel || !listPanel || !leaveBtn || !createToggleBtn) return;

    leaveBtn.classList.toggle("hidden", !activeAlliance);
    createToggleBtn.classList.toggle("hidden", Boolean(activeAlliance));
    if (createEntry) createEntry.classList.toggle("hidden", Boolean(activeAlliance));
    activePanel.classList.toggle("alliance-active-panel--occupied", Boolean(activeAlliance));
    listPanel.classList.toggle("hidden", Boolean(activeAlliance));

    if (activeAlliance) {
      const currentPlayerReady = activeAlliance.current_player_ready || computeLocalAllianceReadyState(null);
      const readyStateClass = currentPlayerReady.isReadyWindowActive
        ? "alliance-ready-state alliance-ready-state--ok"
        : "alliance-ready-state alliance-ready-state--bad";
      const readyTimerClass = currentPlayerReady.isReadyWindowActive
        ? "alliance-ready-panel__timer alliance-ready-panel__timer--ok"
        : "alliance-ready-panel__timer alliance-ready-panel__timer--bad";
      activePanel.innerHTML = `
        <div class="alliance-active-card">
          <div class="alliance-active-card__top">
            <div class="alliance-active-card__badge-wrap">
              <div class="alliance-active-card__badge">${renderAllianceIdentityMarkup(activeAlliance)}</div>
              <div class="alliance-active-card__description">
                <span>Popisek</span>
                <strong>${escapeAllianceMarkup(DEFAULT_ALLIANCE_DESCRIPTION)}</strong>
              </div>
              <div class="alliance-active-card__badges">
                <span class="${readyStateClass}">${currentPlayerReady.isReadyWindowActive ? "READY aktivní" : "READY vypršelo"}</span>
              </div>
            </div>
            <div class="alliance-ready-panel">
              <button class="btn btn--primary alliance-ready-btn" id="alliance-ready-btn">READY</button>
              <div class="alliance-ready-panel__meta">
                <strong class="${readyTimerClass}">${formatAllianceDueLabelSeconds(currentPlayerReady.readyDueAt)}</strong>
              </div>
            </div>
          </div>
          <div class="alliance-active-card__overview">
            <div class="alliance-active-card__stats-column">
              <div class="alliance-active-card__stat">
                <span>Členové</span>
                <strong>${activeAlliance.member_count || 0}/${ALLIANCE_MAX_MEMBERS}</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Income</span>
                <strong>+${activeAlliance.bonus_income_pct || 0}%</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Influence</span>
                <strong>+${activeAlliance.bonus_influence_pct || 0}%</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Heat control</span>
                <strong>${activeAlliance.heat_control_text || "-8% heat"}</strong>
              </div>
            </div>
            <div class="alliance-active-card__chat-pane">
              <div class="alliance-chat alliance-chat--modal">
                <div class="alliance-chat__title">Chat aliance</div>
                <div class="alliance-chat__log" data-alliance-chat-log></div>
              </div>
            </div>
          </div>
          <div class="alliance-active-card__chat-compose">
            <div class="alliance-chat__input alliance-chat__input--modal">
              <input type="text" placeholder="Napiš zprávu do aliance..." data-alliance-chat-input />
              <button class="btn btn--ghost" type="button" data-alliance-chat-send>Odeslat</button>
            </div>
          </div>
          <div class="alliance-members">
            ${(activeAlliance.members || [])
              .map((member) => renderAllianceMemberCard(member, activeAlliance.kick_votes || []))
              .join("")}
          </div>
        </div>
      `;
    } else {
      activePanel.innerHTML = `
        <div class="modal__row">
          <span>Aktivní aliance</span>
          <strong>Žádná</strong>
        </div>
      `;
    }

    playerInvitesPanel.innerHTML = !activeAlliance && incomingInvites.length ? `
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Příchozí pozvání do aliance</div>
        ${incomingInvites.map((invite) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(invite.alliance_name || "Aliance")}</strong>
              <span>${escapeAllianceMarkup(invite.inviter_username || "Hráč")} tě zve do aliance.</span>
            </div>
            <div class="alliance-request-item__actions">
              <button class="btn btn--primary" data-player-invite-accept="${invite.id}">Přijmout</button>
              <button class="btn btn--ghost" data-player-invite-reject="${invite.id}">Odmítnout</button>
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    listPanel.innerHTML = `
      <div class="alliance-list">
        ${(alliances || [])
          .map(
            (alliance) => `
              <div class="alliance-list__item">
                <div>
                  <div class="alliance-list__name">${renderAllianceIdentityMarkup(alliance)}</div>
                  <div class="alliance-list__description">${escapeAllianceMarkup(alliance.description || "Bez popisku")}</div>
                  <div class="alliance-list__meta">${alliance.member_count || 0}/${ALLIANCE_MAX_MEMBERS} členů • +${alliance.bonus_income_pct || 0}% income • +${alliance.bonus_influence_pct || 0}% influence</div>
                </div>
                <button class="btn btn--ghost" data-alliance-request="${alliance.id}" ${Number(alliance.member_count || 0) >= ALLIANCE_MAX_MEMBERS || alliance.has_pending_request || activeAlliance ? "disabled" : ""}>
                  ${alliance.has_pending_request ? "Pozvánka odeslána" : "Poslat pozvánku"}
                </button>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    const managementOpenBtn = document.getElementById("alliance-management-open-btn");
    const managementFooterBtn = document.getElementById("alliance-management-footer-btn");
    const readyBtn = document.getElementById("alliance-ready-btn");
    if (managementFooterBtn) managementFooterBtn.classList.toggle("hidden", !activeAlliance);
    bindAllianceMemberAvatarLightbox(activePanel);
    if (managementOpenBtn) {
      managementOpenBtn.addEventListener("click", () => {
        document.getElementById("alliance-management-modal")?.classList.remove("hidden");
      });
    }
    if (managementFooterBtn) {
      managementFooterBtn.addEventListener("click", () => {
        document.getElementById("alliance-management-modal")?.classList.remove("hidden");
      });
    }
    if (readyBtn) {
      readyBtn.addEventListener("click", async () => {
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = markLocalAllianceReady(state);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("READY potvrzen.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.markAllianceReady();
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("READY potvrzen.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    }

    playerInvitesPanel.querySelectorAll("[data-player-invite-accept]").forEach((button) => {
      button.addEventListener("click", async () => {
        const inviteId = button.getAttribute("data-player-invite-accept");
        if (!inviteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceMemberInvite(state, inviteId, true);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvání do aliance bylo přijato.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          syncGuestAllianceLabel(result.allianceName || "Žádná");
          return;
        }
        const result = await window.Empire.API.respondToAllianceMemberInvite(inviteId, true);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvání do aliance bylo přijato.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
        const profile = await window.Empire.API.getProfile();
        updateProfile(profile);
      });
    });

    playerInvitesPanel.querySelectorAll("[data-player-invite-reject]").forEach((button) => {
      button.addEventListener("click", async () => {
        const inviteId = button.getAttribute("data-player-invite-reject");
        if (!inviteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceMemberInvite(state, inviteId, false);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvání do aliance bylo odmítnuto.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceMemberInvite(inviteId, false);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvání do aliance bylo odmítnuto.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });

    listPanel.querySelectorAll("[data-alliance-request]").forEach((button) => {
      button.addEventListener("click", async () => {
        const allianceId = button.getAttribute("data-alliance-request");
        if (!allianceId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const request = requestLocalAllianceInvite(state, allianceId);
          if (request?.error) {
            pushEvent(`Aliance: ${formatAllianceError(request.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvánka byla odeslána.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.requestAllianceInvite(allianceId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvánka byla odeslána.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });
  }

  function renderAllianceManagementState(activeAlliance) {
    const panel = document.getElementById("alliance-management-panel");
    const inviteInput = document.getElementById("alliance-management-invite-name");
    const inviteBtn = document.getElementById("alliance-management-invite-btn");
    if (!panel) return;
    if (!activeAlliance) {
      if (inviteInput) inviteInput.disabled = true;
      if (inviteBtn) inviteBtn.disabled = true;
      panel.innerHTML = `
        <div class="alliance-pending-panel">
          <div class="alliance-request-item alliance-request-item--empty">Nejsi ve vlastní alianci.</div>
        </div>
      `;
      return;
    }
    const isLeader = activeAlliance.current_player_role === "leader";
    if (inviteInput) inviteInput.disabled = !isLeader;
    if (inviteBtn) inviteBtn.disabled = !isLeader;

    const pendingRequests = Array.isArray(activeAlliance.pending_requests) ? activeAlliance.pending_requests : [];
    const outgoingInvites = Array.isArray(activeAlliance.outgoing_invites) ? activeAlliance.outgoing_invites : [];
    const kickVotes = Array.isArray(activeAlliance.kick_votes) ? activeAlliance.kick_votes : [];
    const members = Array.isArray(activeAlliance.members) ? activeAlliance.members : [];
    const auditLogs = Array.isArray(activeAlliance.audit_logs) ? activeAlliance.audit_logs : [];
    const currentPlayerReady = activeAlliance.current_player_ready || computeLocalAllianceReadyState(null);
    panel.innerHTML = `
      <div class="alliance-management-ready">
        <div class="alliance-management-ready__copy">
          <span>READY status</span>
          <strong>${currentPlayerReady.isReadyWindowActive ? "Aktivní okno" : "Je potřeba potvrdit"}</strong>
        </div>
        <div class="alliance-management-ready__actions">
          <button class="btn btn--primary alliance-ready-btn alliance-ready-btn--management" id="alliance-management-ready-btn">READY</button>
          <strong class="${currentPlayerReady.isReadyWindowActive ? "alliance-ready-panel__timer alliance-ready-panel__timer--ok" : "alliance-ready-panel__timer alliance-ready-panel__timer--bad"}">${formatAllianceDueLabelSeconds(currentPlayerReady.readyDueAt)}</strong>
        </div>
      </div>
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Členové aliance</div>
        ${members.map((member) => {
          const openVote = kickVotes.find((vote) => String(vote.target_player_id) === String(member.id));
          const canStartVote = member.role !== "leader" && member.isReadyOverdue;
          const visual = getAllianceMemberVisualData(member);
          const avatarMarkup = visual.avatar
            ? `<button class="alliance-member__avatar-btn alliance-member__avatar-btn--management" type="button" data-alliance-member-avatar="${escapeAllianceMarkup(member.username || "Hráč")}" data-alliance-member-avatar-src="${escapeAllianceMarkup(visual.avatar)}" data-alliance-member-avatar-meta="${escapeAllianceMarkup(`${visual.faction} • ${visual.sectorLabel}`)}"><img class="alliance-member__avatar" src="${escapeAllianceMarkup(visual.avatar)}" alt="Avatar ${escapeAllianceMarkup(member.username || "Hráč")}" loading="lazy" /></button>`
            : `<div class="alliance-member__avatar alliance-member__avatar--empty">${escapeAllianceMarkup(String(member?.username || "?").slice(0, 1).toUpperCase())}</div>`;
          return `
            <div class="alliance-request-item">
              ${avatarMarkup}
              <div class="alliance-request-item__copy">
                <strong>${escapeAllianceMarkup(member.username || "Hráč")} (${visual.sectorLabel}) • ${member.role === "leader" ? "Leader" : "Člen"}</strong>
                <span>${escapeAllianceMarkup(member.gang_name || "Gang")} • ${escapeAllianceMarkup(visual.faction)} • ${visual.color ? visual.color.toUpperCase() : "Bez barvy"}</span>
                <span>${member.isReadyWindowActive ? `READY aktivní ještě ${formatAllianceDueLabelSeconds(member.readyDueAt)}` : "READY chybí, lze řešit vyhození."}</span>
              </div>
              <div class="alliance-request-item__actions">
                ${isLeader && member.role !== "leader" ? `<button class="btn btn--ghost" data-alliance-member-remove="${member.id}">Vyhodit</button>` : ""}
                ${canStartVote && !openVote ? `<button class="btn btn--primary" data-alliance-kick-start="${member.id}">Spustit hlasování</button>` : ""}
                ${openVote ? `<button class="btn btn--primary" data-alliance-kick-cast="${openVote.id}">Hlasovat (${openVote.yes_votes}/${openVote.required_votes})</button>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
      ${isLeader ? `<div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Žádosti o vstup</div>
        ${pendingRequests.length ? pendingRequests.map((request) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(request.username || "Hráč")}</strong>
              <span>${escapeAllianceMarkup(request.gang_name || "Gang")} chce vstoupit do aliance.</span>
            </div>
            <div class="alliance-request-item__actions">
              <button class="btn btn--primary" data-alliance-request-accept="${request.id}">Potvrdit</button>
              <button class="btn btn--ghost" data-alliance-request-reject="${request.id}">Odmítnout</button>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Žádné čekající žádosti.</div>`}
      </div>
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Odeslané přímé pozvánky</div>
        ${outgoingInvites.length ? outgoingInvites.map((invite) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(invite.username || "Hráč")}</strong>
              <span>${escapeAllianceMarkup(invite.gang_name || "Gang")} čeká na odpověď.</span>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Žádné aktivní přímé pozvánky.</div>`}
      </div>` : ""}
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Audit log aliance</div>
        ${auditLogs.length ? auditLogs.map((entry) => `
          <div class="alliance-request-item alliance-request-item--log">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(entry.message || "Aliance akce")}</strong>
              <span>${escapeAllianceMarkup(formatAllianceRelativeTime(entry.created_at))}</span>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Audit log je zatím prázdný.</div>`}
      </div>
    `;

    const managementReadyBtn = document.getElementById("alliance-management-ready-btn");
    bindAllianceMemberAvatarLightbox(panel);
    if (managementReadyBtn) {
      managementReadyBtn.addEventListener("click", async () => {
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = markLocalAllianceReady(state);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("READY potvrzen.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.markAllianceReady();
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("READY potvrzen.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    }

    panel.querySelectorAll("[data-alliance-request-accept]").forEach((button) => {
      button.addEventListener("click", async () => {
        const requestId = button.getAttribute("data-alliance-request-accept");
        if (!requestId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceRequest(state, requestId, true);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Žádost byla potvrzena.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceInvite(requestId, true);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Žádost byla potvrzena.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-request-reject]").forEach((button) => {
      button.addEventListener("click", async () => {
        const requestId = button.getAttribute("data-alliance-request-reject");
        if (!requestId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceRequest(state, requestId, false);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Žádost byla odmítnuta.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceInvite(requestId, false);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Žádost byla odmítnuta.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-member-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        const memberId = button.getAttribute("data-alliance-member-remove");
        if (!memberId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = removeLocalAllianceMember(state, memberId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Člen byl vyhozen z aliance.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.removeAllianceMember(memberId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Člen byl vyhozen z aliance.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-kick-start]").forEach((button) => {
      button.addEventListener("click", async () => {
        const memberId = button.getAttribute("data-alliance-kick-start");
        if (!memberId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = startLocalAllianceKickVote(state, memberId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Hlasování o vyhození bylo zahájeno.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.startAllianceKickVote(memberId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Hlasování o vyhození bylo zahájeno.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-kick-cast]").forEach((button) => {
      button.addEventListener("click", async () => {
        const voteId = button.getAttribute("data-alliance-kick-cast");
        if (!voteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = castLocalAllianceKickVote(state, voteId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Hlas pro vyhození byl zaznamenán.");
          if (allianceRefreshHandler) await allianceRefreshHandler();
          return;
        }
        const result = await window.Empire.API.castAllianceKickVote(voteId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Hlas pro vyhození byl zaznamenán.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
      });
    });
  }

  function renderAllianceChat(messages) {
    const logs = Array.from(document.querySelectorAll("[data-alliance-chat-log]"));
    if (!logs.length) return;
    const safeMessages = Array.isArray(messages) && messages.length ? messages : [
      { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
      { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
    ];
    const markup = safeMessages
      .map((message) => `<div class="alliance-chat__item">[${message.time}] ${message.author}: ${message.text}</div>`)
      .join("");
    logs.forEach((log) => {
      log.innerHTML = markup;
    });
  }

  function buildAllianceTenBlackoutLocalAllianceState(ownerName, allyName) {
    const allianceId = "scenario-blackout-alliance";
    const allianceName = `${ownerName} + ${allyName}`;
    const nowIso = new Date().toISOString();
    return {
      activeAllianceId: allianceId,
      alliances: [
        {
          id: allianceId,
          name: allianceName,
          description: "Blackout dvojice drzi sektor 102 a vede nocni kontrolu mesta.",
          icon_key: "lightning",
          owner_player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
          bonus_income_pct: 6,
          bonus_influence_pct: 5,
          heat_control_text: "-8% heat",
          members: [
            {
              id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
              username: ownerName,
              gang_name: cachedProfile?.gangName || ownerName,
              alliance_ready_at: nowIso
            },
            {
              id: "scenario-blackout-ally",
              username: allyName,
              gang_name: "Piškoti",
              alliance_ready_at: null
            }
          ]
        }
      ],
      requests: [
        {
          id: "scenario-blackout-zabijak-request",
          alliance_id: allianceId,
          player_id: "scenario-blackout-zabijak",
          username: "Zabijak",
          gang_name: "District 143 + 121"
        }
      ],
      memberInvites: [],
      kickVotes: [],
      notifications: [],
      auditLogs: [
        {
          id: "scenario-blackout-audit-1",
          alliance_id: allianceId,
          message: "Zabijak poslal zadost o vstup do aliance.",
          created_at: nowIso
        }
      ],
      chat: [
        { time: "20:12", author: allyName, text: "Drzim district 102. Blackout jede." },
        { time: "20:18", author: "System", text: "Zabijak zadal o vstup do aliance." }
      ]
    };
  }

  function syncBlackoutScenarioAllianceDistrictState(activeAlliance) {
    if (window.Empire.token || activePlayerScenarioKey !== "alliance-ten-blackout" || !window.Empire.Map?.setDistricts) return;
    const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
    if (!districts.length) return;
    const allianceName = String(activeAlliance?.name || "").trim();
    const allianceIconKey = String(activeAlliance?.icon_key || activeAlliance?.iconKey || DEFAULT_ALLIANCE_ICON_KEY).trim() || DEFAULT_ALLIANCE_ICON_KEY;
    const memberNames = new Set(
      (Array.isArray(activeAlliance?.members) ? activeAlliance.members : [])
        .map((member) => normalizeOwnerName(member?.username))
        .filter(Boolean)
    );
    const nextDistricts = districts.map((district) => {
      const ownerKey = normalizeOwnerName(district?.owner);
      if (ownerKey !== normalizeOwnerName("Zabijak")) return district;
      const isAccepted = memberNames.has(ownerKey) && allianceName;
      return {
        ...district,
        ownerAllianceName: isAccepted ? allianceName : null,
        ownerAllianceIconKey: isAccepted ? allianceIconKey : null
      };
    });
    window.Empire.Map.setDistricts(nextDistricts);
  }

  function getLocalAllianceState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_ALLIANCE_KEY) || "null");
      if (parsed && Array.isArray(parsed.alliances) && Array.isArray(parsed.chat)) {
        return withActiveAlliance(parsed);
      }
    } catch {}
    const seeded = {
      activeAllianceId: null,
      alliances: [
        {
          id: "alliance-neon-vipers",
          name: "Neon Vipers",
          description: "Rychlé přesuny, tlak na periferii a čisté vpády pod neonem.",
          icon_key: "lightning",
          owner_player_id: "owner-neon-vipers",
          bonus_income_pct: 8,
          bonus_influence_pct: 4,
          heat_control_text: "-6% heat",
          members: [
            { id: "owner-neon-vipers", username: "Raven", gang_name: "North Vultures", alliance_ready_at: new Date().toISOString() },
            { id: "member-neon-lira", username: "Lira", gang_name: "Chrome Echo", alliance_ready_at: null }
          ]
        },
        {
          id: "alliance-black-sun",
          name: "Black Sun Pact",
          description: "Tichá infiltrace, vydírání a chirurgické zásahy proti rivalům.",
          icon_key: "eye_triangle",
          owner_player_id: "owner-black-sun",
          bonus_income_pct: 5,
          bonus_influence_pct: 7,
          heat_control_text: "-10% heat",
          members: [
            { id: "owner-black-sun", username: "Hex", gang_name: "Dusk Syndicate", alliance_ready_at: new Date().toISOString() }
          ]
        }
      ],
      requests: [],
      memberInvites: [],
      kickVotes: [],
      notifications: [],
      auditLogs: [],
      chat: [
        { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
        { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
      ]
    };
    saveLocalAllianceState(seeded);
    return withActiveAlliance(seeded);
  }

  function saveLocalAllianceState(state) {
    localStorage.setItem(
      LOCAL_ALLIANCE_KEY,
      JSON.stringify({
        activeAllianceId: state.activeAllianceId || null,
        alliances: state.alliances || [],
        requests: state.requests || [],
        memberInvites: state.memberInvites || [],
        kickVotes: state.kickVotes || [],
        notifications: state.notifications || [],
        auditLogs: state.auditLogs || [],
        chat: state.chat || []
      })
    );
  }

  function withActiveAlliance(state) {
    const activeAlliance = (state.alliances || []).find((item) => item.id === state.activeAllianceId) || null;
    const requests = Array.isArray(state.requests) ? state.requests : [];
    const memberInvites = Array.isArray(state.memberInvites) ? state.memberInvites : [];
    const kickVotes = Array.isArray(state.kickVotes) ? state.kickVotes : [];
    return {
      ...state,
      activeAlliance: activeAlliance
        ? {
            ...activeAlliance,
            owner_player_id: activeAlliance.owner_player_id || LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
            description: String(activeAlliance.description || "").trim(),
            icon_key: String(activeAlliance.icon_key || activeAlliance.iconKey || DEFAULT_ALLIANCE_ICON_KEY).trim() || DEFAULT_ALLIANCE_ICON_KEY,
            current_player_role: String(activeAlliance.owner_player_id || "") === LOCAL_ALLIANCE_REQUEST_PLAYER_ID ? "leader" : "member",
            current_player_ready: computeLocalAllianceReadyState(
              (activeAlliance.members || []).find((member) => String(member.id || "") === LOCAL_ALLIANCE_REQUEST_PLAYER_ID)?.alliance_ready_at || null
            ),
            member_count: (activeAlliance.members || []).length,
            members: (activeAlliance.members || []).map((member) => ({
              ...member,
              role: String(member.id || "") === String(activeAlliance.owner_player_id || "") ? "leader" : "member",
              ...computeLocalAllianceReadyState(member.alliance_ready_at || null)
            })),
            pending_requests: requests.filter((request) => request.alliance_id === activeAlliance.id),
            outgoing_invites: memberInvites.filter((invite) => invite.alliance_id === activeAlliance.id),
            kick_votes: kickVotes.filter((vote) => vote.alliance_id === activeAlliance.id && vote.status === "open"),
            audit_logs: (state.auditLogs || []).filter((entry) => entry.alliance_id === activeAlliance.id).slice(-20).reverse()
          }
        : null,
      alliances: (state.alliances || []).map((alliance) => ({
        ...alliance,
        owner_player_id: alliance.owner_player_id || "guest-owner",
        description: String(alliance.description || "").trim() || DEFAULT_ALLIANCE_DESCRIPTION,
        icon_key: String(alliance.icon_key || alliance.iconKey || DEFAULT_ALLIANCE_ICON_KEY).trim() || DEFAULT_ALLIANCE_ICON_KEY,
        member_count: (alliance.members || []).length,
        has_pending_request: requests.some((request) => request.alliance_id === alliance.id && request.player_id === LOCAL_ALLIANCE_REQUEST_PLAYER_ID)
      })),
      incomingInvites: memberInvites.filter((invite) => invite.target_player_id === LOCAL_ALLIANCE_REQUEST_PLAYER_ID)
    };
  }

  function appendLocalAllianceAuditLog(state, allianceId, message) {
    state.auditLogs = state.auditLogs || [];
    state.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      alliance_id: allianceId,
      message,
      created_at: new Date().toISOString()
    });
    state.auditLogs = state.auditLogs.slice(-40);
  }

  function createLocalAlliance(state, options) {
    const name = String(options?.name || "").trim();
    const description = String(options?.description || "").trim() || DEFAULT_ALLIANCE_DESCRIPTION;
    const iconKey = String(options?.iconKey || DEFAULT_ALLIANCE_ICON_KEY).trim() || DEFAULT_ALLIANCE_ICON_KEY;
    const alliance = {
      id: `alliance-${Date.now()}`,
      name,
      description,
      icon_key: iconKey,
      owner_player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
      bonus_income_pct: 6,
      bonus_influence_pct: 5,
      heat_control_text: "-8% heat",
      members: [{ id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID, username: "Ty", gang_name: localStorage.getItem("empire_gang_name") || "Guest Crew", alliance_ready_at: new Date().toISOString() }]
    };
    state.alliances.unshift(alliance);
    state.activeAllianceId = alliance.id;
    appendLocalAllianceAuditLog(state, alliance.id, "Aliance byla založena.");
    appendLocalAllianceChat(state, {
      author: "System",
      text: `Aliance ${name} byla založena.`
    });
    return alliance;
  }

  function requestLocalAllianceInvite(state, allianceId) {
    const alliance = (state.alliances || []).find((item) => item.id === allianceId);
    if (!alliance) return null;
    if (state.activeAllianceId) {
      return { error: "already_in_alliance" };
    }
    const currentMembers = Array.isArray(alliance.members) ? alliance.members.length : 0;
    if (currentMembers >= ALLIANCE_MAX_MEMBERS) {
      return { error: "alliance_full" };
    }
    state.requests = state.requests || [];
    if (state.requests.some((request) => request.alliance_id === alliance.id && request.player_id === LOCAL_ALLIANCE_REQUEST_PLAYER_ID)) {
      return { error: "request_pending" };
    }
    state.requests.push({
      id: `alliance-request-${Date.now()}`,
      alliance_id: alliance.id,
      player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
      username: "Ty",
      gang_name: localStorage.getItem("empire_gang_name") || "Guest Crew"
    });
    appendLocalAllianceChat(state, {
      author: "System",
      text: `Poslal jsi pozvánku do aliance ${alliance.name}.`
    });
    appendLocalAllianceAuditLog(state, alliance.id, "Byla odeslána žádost o vstup do aliance.");
    return { ok: true };
  }

  function sendLocalAllianceManagementInvite(state, username) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active) {
      return { error: "no_active_alliance" };
    }
    if (String(active.owner_player_id || "") !== LOCAL_ALLIANCE_REQUEST_PLAYER_ID) {
      return { error: "not_alliance_owner" };
    }
    if (active.members.length >= ALLIANCE_MAX_MEMBERS) {
      return { error: "alliance_full" };
    }
    const normalized = String(username || "").trim();
    if (!normalized) {
      return { error: "missing_player" };
    }
    if (normalized.toLowerCase() === "ty") {
      return { error: "cannot_invite_self" };
    }
    const normalizedTarget = normalized.toLowerCase();
    const playerAlreadyInAlliance = (state.alliances || []).some((alliance) =>
      Array.isArray(alliance.members) && alliance.members.some((member) => String(member?.username || "").trim().toLowerCase() === normalizedTarget)
    );
    if (playerAlreadyInAlliance) {
      return { error: "player_has_alliance" };
    }
    state.memberInvites = state.memberInvites || [];
    if (state.memberInvites.some((invite) => invite.alliance_id === active.id && invite.username.toLowerCase() === normalized.toLowerCase())) {
      return { error: "invite_pending" };
    }
    state.memberInvites.push({
      id: `alliance-member-invite-${Date.now()}`,
      alliance_id: active.id,
      target_player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
      inviter_player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
      username: normalized,
      gang_name: "Nezávislý gang",
      alliance_name: active.name,
      inviter_username: "Ty"
    });
    appendLocalAllianceChat(state, {
      author: "System",
      text: `Byla odeslána přímá pozvánka hráči ${normalized}.`
    });
    appendLocalAllianceAuditLog(state, active.id, `Byla odeslána přímá pozvánka hráči ${normalized}.`);
    return { ok: true };
  }

  function leaveLocalAlliance(state) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (active) {
      active.members = (active.members || []).filter((member) => member.username !== "Ty");
      appendLocalAllianceChat(state, {
        author: "System",
        text: `Opustil jsi alianci ${active.name}.`
      });
    }
    state.activeAllianceId = null;
  }

  function respondToLocalAllianceRequest(state, requestId, accept) {
    state.requests = state.requests || [];
    const requestIndex = state.requests.findIndex((request) => request.id === requestId);
    if (requestIndex === -1) {
      return { error: "missing_request" };
    }
    const request = state.requests[requestIndex];
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active || active.id !== request.alliance_id) {
      return { error: "not_alliance_owner" };
    }
    if (accept) {
      active.members = active.members || [];
      if (active.members.length >= ALLIANCE_MAX_MEMBERS) {
        return { error: "alliance_full" };
      }
      if (!active.members.some((member) => member.username === request.username)) {
        active.members.push({
          id: request.player_id,
          username: request.username,
          gang_name: request.gang_name || "Guest Crew",
          alliance_ready_at: null
        });
      }
      appendLocalAllianceChat(state, {
        author: "System",
        text: `${request.username} byl přijat do aliance ${active.name}.`
      });
      state.notifications = state.notifications || [];
      state.notifications.push({
        id: `alliance-note-${Date.now()}`,
        message: "Tva zadost o vstup do aliance byla prijata."
      });
    } else {
      appendLocalAllianceChat(state, {
        author: "System",
        text: `${request.username} byl odmítnut z aliance ${active.name}.`
      });
      state.notifications = state.notifications || [];
      state.notifications.push({
        id: `alliance-note-${Date.now()}`,
        message: "Tva zadost o vstup do aliance byla odmitnuta."
      });
    }
    state.requests.splice(requestIndex, 1);
    return { ok: true };
  }

  function respondToLocalAllianceMemberInvite(state, inviteId, accept) {
    state.memberInvites = state.memberInvites || [];
    const inviteIndex = state.memberInvites.findIndex((invite) => invite.id === inviteId);
    if (inviteIndex === -1) {
      return { error: "missing_invite" };
    }
    const invite = state.memberInvites[inviteIndex];
    if (accept) {
      if (state.activeAllianceId) {
        return { error: "already_in_alliance" };
      }
      const alliance = (state.alliances || []).find((item) => item.id === invite.alliance_id);
      if (!alliance) {
        return { error: "missing_alliance" };
      }
      if ((alliance.members || []).length >= ALLIANCE_MAX_MEMBERS) {
        return { error: "alliance_full" };
      }
      alliance.members = alliance.members || [];
      alliance.members.push({
        id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
        username: "Ty",
        gang_name: localStorage.getItem("empire_gang_name") || "Guest Crew",
        alliance_ready_at: new Date().toISOString()
      });
      state.activeAllianceId = alliance.id;
      state.notifications = state.notifications || [];
      state.notifications.push({
        id: `alliance-note-${Date.now()}`,
        message: "Hrac prijal tvoji pozvanku do aliance."
      });
      state.memberInvites.splice(inviteIndex, 1);
      return { ok: true, allianceName: alliance.name };
    }

    state.notifications = state.notifications || [];
    state.notifications.push({
      id: `alliance-note-${Date.now()}`,
      message: "Hrac odmitl tvoji pozvanku do aliance."
    });
    state.memberInvites.splice(inviteIndex, 1);
    return { ok: true };
  }

  function markLocalAllianceReady(state) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active) return { error: "no_active_alliance" };
    const member = (active.members || []).find((item) => String(item.id || "") === LOCAL_ALLIANCE_REQUEST_PLAYER_ID);
    if (!member) return { error: "missing_member" };
    member.alliance_ready_at = new Date().toISOString();
    appendLocalAllianceAuditLog(state, active.id, "Člen potvrdil READY.");
    return { ok: true };
  }

  function removeLocalAllianceMember(state, memberId) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active) return { error: "no_active_alliance" };
    if (String(active.owner_player_id || "") !== LOCAL_ALLIANCE_REQUEST_PLAYER_ID) return { error: "not_alliance_owner" };
    if (String(memberId || "") === LOCAL_ALLIANCE_REQUEST_PLAYER_ID) return { error: "cannot_remove_leader" };
    const nextMembers = (active.members || []).filter((member) => String(member.id || "") !== String(memberId || ""));
    if (nextMembers.length === (active.members || []).length) return { error: "missing_member" };
    active.members = nextMembers;
    state.kickVotes = (state.kickVotes || []).filter((vote) => String(vote.target_player_id || "") !== String(memberId || ""));
    appendLocalAllianceAuditLog(state, active.id, "Leader vyhodil člena z aliance.");
    return { ok: true };
  }

  function startLocalAllianceKickVote(state, memberId) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active) return { error: "no_active_alliance" };
    const target = (active.members || []).find((member) => String(member.id || "") === String(memberId || ""));
    if (!target) return { error: "missing_member" };
    if (String(target.id || "") === String(active.owner_player_id || "")) return { error: "cannot_remove_leader" };
    if (!computeLocalAllianceReadyState(target.alliance_ready_at || null).isReadyOverdue) return { error: "member_ready_active" };
    state.kickVotes = state.kickVotes || [];
    if (state.kickVotes.some((vote) => vote.alliance_id === active.id && vote.target_player_id === target.id && vote.status === "open")) {
      return { error: "vote_already_open" };
    }
    const eligibleVoters = Math.max((active.members || []).length - 1, 0);
    const vote = {
      id: `kick-vote-${Date.now()}`,
      alliance_id: active.id,
      target_player_id: target.id,
      target_username: target.username,
      started_by_player_id: LOCAL_ALLIANCE_REQUEST_PLAYER_ID,
      eligible_voters: eligibleVoters,
      required_votes: Math.floor(eligibleVoters / 2) + 1,
      yes_votes: 1,
      voters: [LOCAL_ALLIANCE_REQUEST_PLAYER_ID],
      status: "open"
    };
    state.kickVotes.push(vote);
    appendLocalAllianceAuditLog(state, active.id, `Bylo zahájeno hlasování o vyhození člena ${target.username}.`);
    return resolveLocalAllianceKickVote(state, vote.id);
  }

  function castLocalAllianceKickVote(state, voteId) {
    state.kickVotes = state.kickVotes || [];
    const vote = state.kickVotes.find((item) => item.id === voteId && item.status === "open");
    if (!vote) return { error: "missing_vote" };
    if (String(vote.target_player_id || "") === LOCAL_ALLIANCE_REQUEST_PLAYER_ID) return { error: "cannot_vote_target" };
    vote.voters = vote.voters || [];
    if (vote.voters.includes(LOCAL_ALLIANCE_REQUEST_PLAYER_ID)) return { error: "vote_already_cast" };
    vote.voters.push(LOCAL_ALLIANCE_REQUEST_PLAYER_ID);
    vote.yes_votes = Number(vote.yes_votes || 0) + 1;
    appendLocalAllianceAuditLog(state, vote.alliance_id, "Byl odevzdán hlas pro vyhození člena.");
    return resolveLocalAllianceKickVote(state, voteId);
  }

  function resolveLocalAllianceKickVote(state, voteId) {
    const vote = (state.kickVotes || []).find((item) => item.id === voteId && item.status === "open");
    if (!vote) return { error: "missing_vote" };
    if (Number(vote.yes_votes || 0) >= Number(vote.required_votes || 1)) {
      const active = (state.alliances || []).find((item) => item.id === vote.alliance_id);
      if (active) {
        active.members = (active.members || []).filter((member) => String(member.id || "") !== String(vote.target_player_id || ""));
      }
      vote.status = "passed";
      appendLocalAllianceAuditLog(state, vote.alliance_id, "Aliance odhlasovala vyhození člena.");
      return { ok: true, removed: true };
    }
    return { ok: true, removed: false };
  }

  function appendLocalAllianceChat(state, message) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    state.chat = state.chat || [];
    state.chat.unshift({
      time,
      author: message.author,
      text: message.text
    });
    state.chat = state.chat.slice(0, 20);
  }

  function syncGuestAllianceLabel(allianceName) {
    const profileAlliance = document.getElementById("profile-alliance");
    if (profileAlliance && !window.Empire.token) {
      profileAlliance.textContent = formatAllianceProfileSummary({
        ...(window.Empire.player || {}),
        alliance: allianceName || "Žádná"
      });
    }
    setAllianceButtonState(allianceName || "Žádná");
  }

  function setAllianceButtonState(allianceName) {
    const allianceBtn = document.getElementById("alliance-btn");
    if (!allianceBtn) return;

    const normalized = extractAllianceDisplayName(allianceName);
    if (!normalized || normalized === "Žádná") {
      allianceBtn.textContent = "Aliance";
      return;
    }

    allianceBtn.textContent = `Aliance: ${normalized}`;
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
    const mapVisibilitySelect = document.getElementById("settings-map-visibility");
    if (!root) return;
    const mobileMedia = window.matchMedia("(max-width: 720px)");
    let settingsSnapshot = null;

    const syncMobileSettingsBackdropState = (open) => {
      document.body.classList.toggle("mobile-settings-modal-open", Boolean(open) && mobileMedia.matches);
    };

    const applySettingsToForm = () => {
      const settings = getSettingsState();
      if (soundInput) soundInput.checked = settings.sound;
      if (musicInput) musicInput.checked = settings.music;
      if (effectsQualitySelect) effectsQualitySelect.value = settings.effectsQuality;
      if (languageSelect) languageSelect.value = settings.language;
      if (mapDistrictBordersInput) mapDistrictBordersInput.checked = Boolean(settings.mapDistrictBorders);
      if (mapAllianceSymbolsInput) mapAllianceSymbolsInput.checked = Boolean(settings.mapAllianceSymbols);
      if (mapVisibilitySelect) mapVisibilitySelect.value = normalizeMapVisibilityMode(settings.mapVisibilityMode);
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
      syncMapVisionContext();
    };

    const revertSettingsPreview = () => {
      if (!settingsSnapshot) return;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsSnapshot));
      syncMapVisionContext();
      applySettingsToForm();
    };

    const closeSettingsModal = (options = {}) => {
      const shouldRevert = Boolean(options.revert);
      if (shouldRevert) {
        revertSettingsPreview();
      }
      settingsSnapshot = null;
      root.classList.add("hidden");
      syncMobileSettingsBackdropState(false);
    };

    const saveSettings = () => {
      const settings = {
        ...captureFormSettings()
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      syncMapVisionContext();
      settingsSnapshot = settings;
      root.classList.add("hidden");
      syncMobileSettingsBackdropState(false);
      pushEvent("Nastavení bylo uloženo.");
    };

    const onLiveChange = () => {
      writeFormSettings();
    };

    applySettingsToForm();
    if (soundInput) soundInput.addEventListener("change", onLiveChange);
    if (musicInput) musicInput.addEventListener("change", onLiveChange);
    if (effectsQualitySelect) effectsQualitySelect.addEventListener("change", onLiveChange);
    if (languageSelect) languageSelect.addEventListener("change", onLiveChange);
    if (mapDistrictBordersInput) mapDistrictBordersInput.addEventListener("change", onLiveChange);
    if (mapAllianceSymbolsInput) mapAllianceSymbolsInput.addEventListener("change", onLiveChange);
    if (mapVisibilitySelect) mapVisibilitySelect.addEventListener("change", onLiveChange);
    if (backdrop) backdrop.addEventListener("click", () => closeSettingsModal({ revert: true }));
    if (closeBtn) closeBtn.addEventListener("click", () => closeSettingsModal({ revert: true }));
    if (saveBtn) saveBtn.addEventListener("click", saveSettings);
    root.addEventListener("settings:open", () => {
      settingsSnapshot = getSettingsState();
      applySettingsToForm();
      syncMobileSettingsBackdropState(true);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) {
        closeSettingsModal({ revert: true });
      }
    });
  }

  function initWeaponsModal() {
    const root = document.getElementById("weapons-modal");
    const backdrop = document.getElementById("weapons-modal-backdrop");
    const closeBtn = document.getElementById("weapons-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function initMarketModal() {
    const openBtn = document.getElementById("market-open");
    const root = document.getElementById("market-modal");
    const backdrop = document.getElementById("market-modal-backdrop");
    const closeBtn = document.getElementById("market-modal-close");
    const resourceSelect = document.getElementById("market-resource-select");
    const sideSelect = document.getElementById("market-side-select");
    const quantityInput = document.getElementById("market-quantity-input");
    const priceInput = document.getElementById("market-price-input");
    const createBtn = document.getElementById("market-create-order");
    const heroTitle = root.querySelector(".market-modal__hero-title");
    const heroCopy = root.querySelector(".market-modal__hero-copy");

    if (!root || !openBtn || !resourceSelect || !sideSelect || !quantityInput || !priceInput || !createBtn) return;
    const state = { tab: "server" };

    const getResourcesForActiveTab = () =>
      state.tab === "black" ? MARKET_BLACK_RESOURCES : MARKET_SERVER_RESOURCES;

    const ensureSelectedResource = () => {
      const resources = getResourcesForActiveTab();
      const selected = String(resourceSelect.value || "").trim();
      if (resources.some((item) => item.resourceKey === selected)) return selected;
      return resources[0]?.resourceKey || "";
    };

    const renderResourceOptions = () => {
      if (state.tab === "black") {
        resourceSelect.innerHTML = MARKET_BLACK_RESOURCE_GROUPS
          .map((group) => `
            <optgroup label="${group.label}">
              ${group.options
                .map((item) => `<option value="${item.resourceKey}">${item.name}</option>`)
                .join("")}
            </optgroup>
          `)
          .join("");
      } else {
        resourceSelect.innerHTML = MARKET_SERVER_RESOURCES
          .map((item) => `<option value="${item.resourceKey}">${item.name}</option>`)
          .join("");
      }
      resourceSelect.value = ensureSelectedResource();
      root.dataset.marketTab = state.tab;
      createBtn.textContent = state.tab === "black" ? "Vložit kontrakt" : "Vložit příkaz";
      root.querySelectorAll("[data-market-tab]").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-market-tab") === state.tab);
      });
      if (heroTitle) {
        heroTitle.textContent = state.tab === "black"
          ? "Black Market kontrakty"
          : "Server Exchange";
      }
      if (heroCopy) {
        heroCopy.textContent = state.tab === "black"
          ? "Podpultové obchody s látkami, továrními díly a jednotlivými kusy výzbroje. Vyšší riziko, rychlejší marže."
          : "Sleduj serverovou nabídku, poptávku a poslední obchody. Vlož příkaz dřív, než tě ostatní předběhnou.";
      }
    };

    const refreshMarket = async () => {
      const marketBody = root.querySelector(".market-modal__body");
      const marketScrollTop = marketBody?.scrollTop || 0;
      if (!window.Empire.token) {
        cachedMarket = getLocalMarketState();
        renderResourceOptions();
        renderMarketState(resourceSelect.value, state.tab);
        requestAnimationFrame(() => {
          if (marketBody) marketBody.scrollTop = marketScrollTop;
        });
        return;
      }
      const market = await window.Empire.API.getMarket();
      if (market.error) {
        pushEvent(`Market: ${market.error}`);
        return;
      }
      cachedMarket = market;
      renderResourceOptions();
      renderMarketState(resourceSelect.value, state.tab);
      requestAnimationFrame(() => {
        if (marketBody) marketBody.scrollTop = marketScrollTop;
      });
    };
    marketRefreshHandler = refreshMarket;

    openBtn.addEventListener("click", async () => {
      state.tab = "server";
      setMobileTopbarCoveredByPrimaryModal(false);
      root.classList.remove("hidden");
      await refreshMarket();
    });
    resourceSelect.addEventListener("change", () => renderMarketState(resourceSelect.value, state.tab));
    createBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const result = createLocalMarketOrder({
          resourceKey: resourceSelect.value,
          side: sideSelect.value,
          quantity: Number(quantityInput.value),
          pricePerUnit: Number(priceInput.value)
        });
        if (result.error) {
          pushEvent(`Market: ${result.error}`);
          return;
        }
        pushEvent("Lokální market příkaz byl vložen.");
        recordVerifiedIntelEvent({
          type: "market_order_created",
          districtId: window.Empire.selectedDistrict?.id ?? null,
          resourceKey: resourceSelect.value,
          side: sideSelect.value,
          quantity: Number(quantityInput.value),
          pricePerUnit: Number(priceInput.value)
        });
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.createMarketOrder({
        resourceKey: resourceSelect.value,
        side: sideSelect.value,
        quantity: Number(quantityInput.value),
        pricePerUnit: Number(priceInput.value)
      });
      if (result.error) {
        pushEvent(`Market: ${result.error}`);
        return;
      }
      pushEvent("Příkaz byl vložen na trh.");
      recordVerifiedIntelEvent({
        type: "market_order_created",
        districtId: window.Empire.selectedDistrict?.id ?? null,
        resourceKey: resourceSelect.value,
        side: sideSelect.value,
        quantity: Number(quantityInput.value),
        pricePerUnit: Number(priceInput.value)
      });
      await refreshMarket();
      const economy = await window.Empire.API.getEconomy();
      updateEconomy(economy);
    });
    root.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tabButton = target.closest("[data-market-tab]");
      if (tabButton instanceof HTMLElement) {
        const nextTab = String(tabButton.dataset.marketTab || "").trim();
        if ((nextTab === "server" || nextTab === "black") && nextTab !== state.tab) {
          state.tab = nextTab;
          renderResourceOptions();
          renderMarketState(resourceSelect.value, state.tab);
        }
        return;
      }
      const cancelButton = target.closest("[data-market-cancel]");
      if (!(cancelButton instanceof HTMLElement)) return;
      const orderId = cancelButton.dataset.marketCancel;
      if (!orderId) return;
      if (!window.Empire.token) {
        const result = cancelLocalMarketOrder(orderId);
        if (result.error) {
          pushEvent(`Market: ${result.error}`);
          return;
        }
        if (cachedMarket) {
          cachedMarket.myOrders = (cachedMarket.myOrders || []).filter((order) => order.id !== orderId);
          cachedMarket.orderBook = (cachedMarket.orderBook || []).filter((order) => order.id !== orderId);
          renderMarketState(resourceSelect.value, state.tab);
        }
        pushEvent("Lokální market příkaz byl zrušen.");
        recordVerifiedIntelEvent({
          type: "market_order_cancelled",
          districtId: window.Empire.selectedDistrict?.id ?? null,
          resourceKey: resourceSelect.value
        });
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.cancelMarketOrder(orderId);
      if (result.error) {
        pushEvent(`Market: ${result.error}`);
        return;
      }
      if (cachedMarket) {
        cachedMarket.myOrders = (cachedMarket.myOrders || []).filter((order) => order.id !== orderId);
        cachedMarket.orderBook = (cachedMarket.orderBook || []).filter((order) => order.id !== orderId);
        renderMarketState(resourceSelect.value, state.tab);
      }
      pushEvent("Příkaz byl zrušen.");
      recordVerifiedIntelEvent({
        type: "market_order_cancelled",
        districtId: window.Empire.selectedDistrict?.id ?? null,
        resourceKey: resourceSelect.value
      });
      await refreshMarket();
      const economy = await window.Empire.API.getEconomy();
      updateEconomy(economy);
    });
    if (backdrop) backdrop.addEventListener("click", () => {
      root.classList.add("hidden");
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    if (closeBtn) closeBtn.addEventListener("click", () => {
      root.classList.add("hidden");
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        root.classList.add("hidden");
        setMobileTopbarCoveredByPrimaryModal(false);
      }
    });
  }

  function refreshMarketBuildingShortcuts() {
    if (typeof marketBuildingShortcutRefreshHandler === "function") {
      marketBuildingShortcutRefreshHandler();
    }
  }

  function initMarketBuildingShortcuts() {
    const root = document.getElementById("market-building-shortcuts");
    if (!root) return;

    const buttons = Array.from(root.querySelectorAll("[data-market-building-base-name]"));
    if (!buttons.length) return;
    const lockFlashTimers = new WeakMap();

    const normalizeBuildingName = (value) => normalizeOwnerName(String(value || "").replace(/\s+/g, " ").trim());

    const findBuildingIndexInDistrict = (district, baseName) => {
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const target = normalizeBuildingName(baseName);
      if (!target) return -1;
      for (let index = 0; index < buildings.length; index += 1) {
        if (normalizeBuildingName(buildings[index]) === target) {
          return index;
        }
      }
      return -1;
    };

    const getOwnedDistricts = () => {
      const districts = Array.isArray(window.Empire.districts) ? window.Empire.districts : [];
      return districts.filter((district) => isDistrictOwnedByPlayer(district));
    };

    const resolveOwnedBuildingInstance = (baseName, options = {}) => {
      const ownedDistricts = Array.isArray(options.ownedDistricts) ? options.ownedDistricts : getOwnedDistricts();
      if (!ownedDistricts.length) return null;
      const targetBaseName = normalizeBuildingName(baseName);
      const forceFirstOwnedMatch = targetBaseName === "drug lab" || targetBaseName === "druglab";

      const selectedRaw = window.Empire.selectedDistrict;
      const selected = selectedRaw?.id != null
        ? resolveDistrictById(selectedRaw.id, window.Empire.districts) || selectedRaw
        : selectedRaw;
      const preferredDistricts = [];
      const preferredIds = new Set();
      if (!forceFirstOwnedMatch && selected && isDistrictOwnedByPlayer(selected)) {
        preferredDistricts.push(selected);
        preferredIds.add(String(selected.id));
      }
      const scanDistricts = [
        ...preferredDistricts,
        ...ownedDistricts.filter((district) => !preferredIds.has(String(district?.id)))
      ];

      for (let i = 0; i < scanDistricts.length; i += 1) {
        const district = scanDistricts[i];
        const buildingIndex = findBuildingIndexInDistrict(district, baseName);
        if (buildingIndex >= 0) {
          return { district, buildingIndex };
        }
      }
      return null;
    };

    const refreshState = () => {
      const ownedDistricts = getOwnedDistricts();
      const hasOwnedTerritory = ownedDistricts.length > 0;

      buttons.forEach((button) => {
        const label = String(
          button.dataset.marketBuildingLabel
          || button.dataset.marketBuildingBaseName
          || "Budova"
        );
        const baseName = String(button.dataset.marketBuildingBaseName || "").trim();
        const instance = resolveOwnedBuildingInstance(baseName, { ownedDistricts });
        const unlocked = Boolean(instance);
        const buildingIndex = unlocked ? instance.buildingIndex : -1;

        button.disabled = false;
        button.setAttribute("aria-disabled", unlocked ? "false" : "true");
        button.classList.toggle("is-unlocked", unlocked);
        button.classList.toggle("is-locked", !unlocked);
        button.dataset.marketBuildingUnlocked = unlocked ? "1" : "0";
        button.dataset.marketBuildingIndex = unlocked ? String(buildingIndex) : "";
        button.dataset.marketBuildingDistrictId = unlocked ? String(instance.district?.id ?? "") : "";

        if (unlocked) {
          button.title = `${label}: Otevřít detail budovy z tvého území`;
        } else if (!hasOwnedTerritory) {
          button.title = `${label}: Neovládáš žádný distrikt`;
        } else {
          button.title = `${label}: Tuto budovu ve svém území nevlastníš`;
        }
      });
    };

    marketBuildingShortcutRefreshHandler = refreshState;
    refreshState();

    const flashLockedShortcut = (button) => {
      if (!button) return;
      const existingTimer = lockFlashTimers.get(button);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      button.classList.add("is-lock-flash");
      const timer = window.setTimeout(() => {
        button.classList.remove("is-lock-flash");
        lockFlashTimers.delete(button);
      }, 2000);
      lockFlashTimers.set(button, timer);
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        refreshState();
        if (button.dataset.marketBuildingUnlocked !== "1") {
          flashLockedShortcut(button);
          return;
        }

        const baseName = String(button.dataset.marketBuildingBaseName || "").trim();
        const cachedDistrictId = String(button.dataset.marketBuildingDistrictId || "").trim();
        const cachedIndexRaw = Number(button.dataset.marketBuildingIndex);
        const cachedBuildingIndex = Number.isFinite(cachedIndexRaw)
          ? Math.max(0, Math.floor(cachedIndexRaw))
          : -1;
        let district = cachedDistrictId ? resolveDistrictById(cachedDistrictId, window.Empire.districts) : null;
        let buildingIndex = cachedBuildingIndex;

        if (!district || buildingIndex < 0) {
          const instance = resolveOwnedBuildingInstance(baseName);
          if (instance?.district) {
            district = instance.district;
          }
          if (Number.isFinite(Number(instance?.buildingIndex))) {
            buildingIndex = Math.max(0, Math.floor(Number(instance.buildingIndex)));
          }
        }

        const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
        const resolvedBaseName = String((buildingIndex >= 0 && buildings[buildingIndex]) || baseName || "Neznámá budova");
        const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
        const variantRaw = buildingIndex >= 0 ? String(overrides[buildingIndex] || "").trim() : "";
        const detailInput = {
          baseName: resolvedBaseName,
          variantName: variantRaw && variantRaw !== resolvedBaseName ? variantRaw : null,
          districtId: district?.id ?? null,
          buildingIndex
        };

        if (window.Empire.Map?.showBuildingDetail) {
          try {
            window.Empire.Map.showBuildingDetail(detailInput, district);
            return;
          } catch (error) {
            const message = error instanceof Error ? error.message : "neznámá chyba";
            pushEvent(`Detail budovy se nepodařilo otevřít: ${message}`);
            return;
          }
        }
        pushEvent("Detail budovy není dostupný.");
      });
    });
  }

  function formatMarketResourceName(resourceKey) {
    return MARKET_RESOURCE_LABELS[resourceKey] || String(resourceKey || "").replace(/_/g, " ");
  }

  function formatCompactMarketResourceName(resourceKey) {
    const compactLabels = {
      neon_dust: "ND",
      pulse_shot: "PS",
      velvet_smoke: "VS",
      ghost_serum: "GS",
      overdrive_x: "OX",
      weapons: "Zbraně",
      materials: "Mat",
      data_shards: "Data",
      chemicals: "Chem",
      biomass: "Bio",
      stim_pack: "Stim",
      metal_parts: "MP",
      tech_core: "TC",
      combat_module: "CM",
      baseball_bat: "Pálka",
      street_pistol: "Pistole",
      grenade: "Granát",
      smg: "SMG",
      bazooka: "Bazuka",
      bulletproof_vest: "Vesta",
      steel_barricades: "Barikády",
      security_cameras: "Kamery",
      auto_mg_nest: "MG Nest",
      alarm_system: "Alarm"
    };
    return compactLabels[resourceKey] || formatMarketResourceName(resourceKey);
  }

  function renderMarketState(resourceKey, marketTab = "server") {
    const summary = document.getElementById("market-balance-summary");
    const sellOrders = document.getElementById("market-sell-orders");
    const buyOrders = document.getElementById("market-buy-orders");
    const myOrders = document.getElementById("market-my-orders");
    const tradeHistory = document.getElementById("market-trade-history");
    const sellCount = document.getElementById("market-sell-count");
    const buyCount = document.getElementById("market-buy-count");
    const myCount = document.getElementById("market-my-count");
    const tradeCount = document.getElementById("market-trade-count");
    if (!summary || !sellOrders || !buyOrders || !myOrders || !tradeHistory || !sellCount || !buyCount || !myCount || !tradeCount) return;

    const market = cachedMarket || { balances: {}, orderBook: [], myOrders: [] };
    const balances = market.balances || {};
    const money = resolveMoneyBreakdown(balances);
    const selectedOrders = (market.orderBook || []).filter((order) => order.resourceKey === resourceKey && order.status === "open");
    const sells = selectedOrders.filter((order) => order.side === "sell");
    const buys = selectedOrders.filter((order) => order.side === "buy");
    const mine = (market.myOrders || []).filter((order) => order.resourceKey === resourceKey && order.status === "open");
    const trades = (market.recentTrades || []).filter((trade) => trade.resourceKey === resourceKey);

    const activeResourceLabel = formatMarketResourceName(resourceKey);
    const summaryPills = marketTab === "black"
      ? [
          `Čisté: $${money.cleanMoney}`,
          `Kontrakt: ${activeResourceLabel}`,
          `Ve skladu: ${balances[resourceKeyToBalanceKey(resourceKey)] || 0}`,
          `Fee: ${market.marketFeePct || 0}%`
        ]
      : [
          `Čisté: $${money.cleanMoney}`,
          `Drogy: ${balances.drugs || 0}`,
          `Zbraně: ${balances.weapons || 0}`,
          `Materiály: ${balances.materials || 0}`,
          `Fee: ${market.marketFeePct || 0}%`
        ];

    summary.innerHTML = summaryPills
      .map((label) => `<div class="market-balance-pill">${label}</div>`)
      .join("");

    sellCount.textContent = String(sells.length);
    buyCount.textContent = String(buys.length);
    myCount.textContent = String(mine.length);
    tradeCount.textContent = String(trades.length);

    sellOrders.innerHTML = renderMarketOrdersList(sells, "sell");
    buyOrders.innerHTML = renderMarketOrdersList(buys, "buy");
    myOrders.innerHTML = renderMyOrdersList(mine);
    tradeHistory.innerHTML = renderTradeHistoryList(trades);
  }

  function renderMarketOrdersList(orders, side) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Žádné aktivní příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--${side}">
            <div class="market-order__head">
              <span>${order.username}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${formatCompactMarketResourceName(order.resourceKey)} • ${order.remainingQuantity} ks</div>
          </div>
        `
      )
      .join("");
  }

  function renderMyOrdersList(orders) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Nemáš žádné otevřené příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--mine">
            <div class="market-order__head">
              <span>${order.side === "buy" ? "Poptávka" : "Nabídka"}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${formatCompactMarketResourceName(order.resourceKey)} • ${order.remainingQuantity}/${order.quantity} ks</div>
            <button class="btn btn--ghost" data-market-cancel="${order.id}">Zrušit</button>
          </div>
        `
      )
      .join("");
  }

  function renderTradeHistoryList(trades) {
    if (!trades.length) {
      return '<div class="market-modal__empty">Žádné nedávné obchody.</div>';
    }
    return trades
      .map(
        (trade) => `
          <div class="market-order market-order--history">
            <div class="market-order__head">
              <span>${formatCompactMarketResourceName(trade.resourceKey)} • ${trade.quantity} ks</span>
              <strong>$${trade.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">Fee: $${trade.feePaid}</div>
          </div>
        `
      )
      .join("");
  }

  async function handleMarketUpdate() {
    const root = document.getElementById("market-modal");
    if (!root || root.classList.contains("hidden") || !marketRefreshHandler) return;
    await marketRefreshHandler();
  }

  function getLocalMarketState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_MARKET_KEY) || "null");
      if (parsed && parsed.balances && Array.isArray(parsed.orderBook) && Array.isArray(parsed.myOrders) && Array.isArray(parsed.recentTrades)) {
        normalizeLocalMarketBalances(parsed.balances);
        let normalizedChanged = false;
        ["metalParts", "techCore", "combatModule"].forEach((key) => {
          if (Number(parsed.balances[key] || 0) !== 20) {
            parsed.balances[key] = 20;
            normalizedChanged = true;
          }
        });
        if (normalizedChanged) {
          saveLocalMarketState(parsed);
        }
        const dirty = Number(parsed.balances.dirtyMoney || 0);
        if (!Number.isFinite(dirty) || dirty < GUEST_DEFAULT_DIRTY_MONEY) {
          parsed.balances.dirtyMoney = GUEST_DEFAULT_DIRTY_MONEY;
          parsed.balances.money = Number(parsed.balances.cleanMoney || 0) + Number(parsed.balances.dirtyMoney || 0);
          saveLocalMarketState(parsed);
        }
        return parsed;
      }
    } catch {}
    const seeded = {
      balances: {
        money: 17000,
        cleanMoney: 12000,
        dirtyMoney: GUEST_DEFAULT_DIRTY_MONEY,
        drugs: 80,
        chemicals: 36,
        biomass: 28,
        stimPack: 12,
        neonDust: 44,
        pulseShot: 14,
        velvetSmoke: 12,
        ghostSerum: 7,
        overdriveX: 3,
        metalParts: 20,
        techCore: 20,
        combatModule: 20,
        weapons: 30,
        baseballBat: 8,
        streetPistol: 6,
        grenade: 4,
        smg: 3,
        bazooka: 1,
        bulletproofVest: 7,
        steelBarricades: 5,
        securityCameras: 4,
        autoMgNest: 2,
        alarmSystem: 3,
        materials: 120,
        dataShards: 18
      },
      orderBook: [
        makeSeedOrder("neon_dust", "sell", 35, 92, "Neon Vipers"),
        makeSeedOrder("pulse_shot", "buy", 8, 245, "Black Sun Pact"),
        makeSeedOrder("velvet_smoke", "sell", 6, 310, "Velvet Circuit"),
        makeSeedOrder("ghost_serum", "buy", 4, 420, "Ghost Wire"),
        makeSeedOrder("overdrive_x", "sell", 2, 650, "Crimson Apex"),
        makeSeedOrder("weapons", "sell", 12, 260, "Chrome Cartel"),
        makeSeedOrder("weapons", "buy", 10, 235, "Raven"),
        makeSeedOrder("materials", "sell", 60, 78, "Factory 9"),
        makeSeedOrder("materials", "buy", 40, 70, "Steel Dogs"),
        makeSeedOrder("chemicals", "sell", 18, 48, "Cold Script"),
        makeSeedOrder("biomass", "buy", 14, 42, "Bio Verge"),
        makeSeedOrder("stim_pack", "sell", 6, 130, "White Vein"),
        makeSeedOrder("metal_parts", "sell", 28, 66, "Forge Lane"),
        makeSeedOrder("tech_core", "buy", 10, 158, "Helix Nine"),
        makeSeedOrder("combat_module", "sell", 4, 420, "Core Hammer"),
        makeSeedOrder("street_pistol", "sell", 5, 220, "Brass Echo"),
        makeSeedOrder("smg", "buy", 3, 460, "Riot Thread"),
        makeSeedOrder("bulletproof_vest", "sell", 4, 210, "Shield Loop"),
        makeSeedOrder("alarm_system", "buy", 2, 320, "Zero Ward"),
        makeSeedOrder("data_shards", "sell", 8, 420, "Hex"),
        makeSeedOrder("data_shards", "buy", 6, 390, "Ghost Wire")
      ],
      myOrders: [],
      recentTrades: [
        { resourceKey: "neon_dust", quantity: 18, pricePerUnit: 96, feePaid: 86, createdAt: Date.now() - 200000 },
        { resourceKey: "pulse_shot", quantity: 3, pricePerUnit: 236, feePaid: 35, createdAt: Date.now() - 150000 },
        { resourceKey: "weapons", quantity: 4, pricePerUnit: 248, feePaid: 49, createdAt: Date.now() - 120000 },
        { resourceKey: "metal_parts", quantity: 16, pricePerUnit: 64, feePaid: 51, createdAt: Date.now() - 90000 },
        { resourceKey: "street_pistol", quantity: 2, pricePerUnit: 214, feePaid: 21, createdAt: Date.now() - 60000 }
      ],
      marketFeePct: 5
    };
    saveLocalMarketState(seeded);
    return seeded;
  }

  function enforceLocalGuestStorageDefaults() {
    if (window.Empire.token) return;
    const state = getLocalMarketState();
    if (!state?.balances) return;
    normalizeLocalMarketBalances(state.balances);
    state.balances.metalParts = 20;
    state.balances.techCore = 20;
    state.balances.combatModule = 20;
    if (Array.isArray(state.myOrders) && state.myOrders.length) {
      state.myOrders = [];
    }
    saveLocalMarketState(state);
  }

  function saveLocalMarketState(state) {
    normalizeLocalMarketBalances(state.balances || {});
    localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(state));
  }

  function normalizeLocalMarketBalances(balances) {
    if (!balances) return;
    const money = resolveMoneyBreakdown(balances);
    balances.cleanMoney = money.cleanMoney;
    balances.dirtyMoney = money.dirtyMoney;
    balances.money = money.totalMoney;
    const legacyDrugTotal = Number.isFinite(Number(balances.drugs))
      ? Math.max(0, Math.floor(Number(balances.drugs)))
      : 0;
    storageDrugTypes.forEach((drug) => {
      const value = Number(balances[drug.key] || 0);
      balances[drug.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    });
    let drugTotal = storageDrugTypes.reduce((sum, drug) => sum + Number(balances[drug.key] || 0), 0);
    if (drugTotal === 0 && legacyDrugTotal > 0) {
      const split = [0.55, 0.18, 0.15, 0.08, 0.04];
      let used = 0;
      storageDrugTypes.forEach((drug, index) => {
        if (index === storageDrugTypes.length - 1) {
          balances[drug.key] = Math.max(0, legacyDrugTotal - used);
          return;
        }
        const part = Math.floor(legacyDrugTotal * split[index]);
        balances[drug.key] = part;
        used += part;
      });
      drugTotal = storageDrugTypes.reduce((sum, drug) => sum + Number(balances[drug.key] || 0), 0);
    }
    balances.drugs = Math.max(0, Math.floor(drugTotal));
    [
      "chemicals",
      "biomass",
      "stimPack",
      "metalParts",
      "techCore",
      "combatModule",
      "weapons",
      "materials",
      "dataShards",
      "baseballBat",
      "streetPistol",
      "grenade",
      "smg",
      "bazooka",
      "bulletproofVest",
      "steelBarricades",
      "securityCameras",
      "autoMgNest",
      "alarmSystem"
    ].forEach((key) => {
      const value = Number(balances[key] || 0);
      balances[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    });
  }

  function spendLocalMoney(balances, amount) {
    normalizeLocalMarketBalances(balances);
    if (!Number.isInteger(amount) || amount < 0) return false;
    let remaining = amount;
    const fromClean = Math.min(Number(balances.cleanMoney || 0), remaining);
    balances.cleanMoney -= fromClean;
    remaining -= fromClean;
    const fromDirty = Math.min(Number(balances.dirtyMoney || 0), remaining);
    balances.dirtyMoney -= fromDirty;
    remaining -= fromDirty;
    balances.money = Number(balances.cleanMoney || 0) + Number(balances.dirtyMoney || 0);
    return remaining === 0;
  }

  function addLocalMoney(balances, amount, bucket = "clean") {
    normalizeLocalMarketBalances(balances);
    const value = Number(amount || 0);
    if (value <= 0) return;
    if (bucket === "dirty") {
      balances.dirtyMoney += value;
    } else {
      balances.cleanMoney += value;
    }
    balances.money = Number(balances.cleanMoney || 0) + Number(balances.dirtyMoney || 0);
  }

  function getEconomySnapshotFromDom() {
    const parseMoney = (id) => {
      const text = document.getElementById(id)?.textContent || "0";
      const normalized = String(text).replace(/[^\d-]/g, "");
      const parsed = Number(normalized || 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const parseStat = (id) => {
      const text = document.getElementById(id)?.textContent || "0";
      const normalized = String(text).replace(/[^\d-]/g, "");
      const parsed = Number(normalized || 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const influenceEl = document.getElementById("stat-influence");
    const influenceFromDataset = Number(influenceEl?.dataset?.influenceValue);
    const influenceValue = Number.isFinite(influenceFromDataset)
      ? normalizeSpyCount(influenceFromDataset, 0)
      : parseStat("stat-influence");
    return {
      cleanMoney: parseMoney("stat-clean-money"),
      dirtyMoney: parseMoney("stat-dirty-money"),
      influence: influenceValue,
      spyCount: getSpyCount(),
      spies: getSpyCount(),
      drugs: 0,
      drugInventory: {},
      weapons: 0,
      defense: 0,
      materials: 0
    };
  }

  function ensureEconomyCache() {
    if (!cachedEconomy || typeof cachedEconomy !== "object") {
      cachedEconomy = getEconomySnapshotFromDom();
    }
    const currentInventory = cachedEconomy.drugInventory && typeof cachedEconomy.drugInventory === "object"
      ? cachedEconomy.drugInventory
      : {};
    const normalizedDrugInventory = storageDrugTypes.reduce((acc, item) => {
      const value = Number(currentInventory[item.key] ?? cachedEconomy[item.key] ?? 0);
      acc[item.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
    cachedEconomy.drugInventory = normalizedDrugInventory;
    cachedEconomy.drugs = storageDrugTypes.reduce(
      (sum, item) => sum + Number(normalizedDrugInventory[item.key] || 0),
      0
    );
    const money = resolveMoneyBreakdown(cachedEconomy || {});
    cachedEconomy.cleanMoney = money.cleanMoney;
    cachedEconomy.dirtyMoney = money.dirtyMoney;
    cachedEconomy.balance = money.totalMoney;
    const economySpyCount = resolveSpyCountFromPayload(cachedEconomy);
    if (economySpyCount != null) {
      setSpyCount(economySpyCount, { persist: true });
    }
    cachedEconomy.spyCount = getSpyCount();
    cachedEconomy.spies = getSpyCount();
    return cachedEconomy;
  }

  function getEconomySnapshot() {
    const snapshot = ensureEconomyCache();
    return JSON.parse(JSON.stringify(snapshot));
  }

  function trySpendCash(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    if (money.totalMoney < required) {
      return { ok: false, reason: "insufficient_cash", available: money.totalMoney };
    }

    let remaining = required;
    const fromClean = Math.min(money.cleanMoney, remaining);
    money.cleanMoney -= fromClean;
    remaining -= fromClean;
    const fromDirty = Math.min(money.dirtyMoney, remaining);
    money.dirtyMoney -= fromDirty;
    remaining -= fromDirty;

    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return { ok: true, spent: required, cleanSpent: fromClean, dirtySpent: fromDirty };
  }

  function trySpendCleanCash(amount) {
    const required = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (required <= 0) return { ok: true, spent: 0 };
    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    if (money.cleanMoney < required) {
      return { ok: false, reason: "insufficient_clean_cash", available: money.cleanMoney };
    }

    money.cleanMoney -= required;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return { ok: true, spent: required, cleanSpent: required, dirtySpent: 0 };
  }

  function addCleanCash(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.cleanMoney = Number(economy.cleanMoney || 0) + value;
    economy.balance = Number(economy.cleanMoney || 0) + Number(economy.dirtyMoney || 0);
    updateEconomy(economy);
    return value;
  }

  function addDirtyCash(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.dirtyMoney = Number(economy.dirtyMoney || 0) + value;
    economy.balance = Number(economy.cleanMoney || 0) + Number(economy.dirtyMoney || 0);
    updateEconomy(economy);
    return value;
  }

  function addInfluence(amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    economy.influence = Math.max(0, Number(economy.influence || 0) + value);
    updateEconomy(economy);
    return value;
  }

  function launderDirtyCash(portion) {
    const ratioRaw = Number(portion);
    if (!Number.isFinite(ratioRaw)) return 0;
    const ratio = Math.max(0, Math.min(1, ratioRaw > 1 ? ratioRaw / 100 : ratioRaw));
    if (ratio <= 0) return 0;

    const economy = ensureEconomyCache();
    const money = resolveMoneyBreakdown(economy);
    const laundered = Math.max(0, Math.floor(money.dirtyMoney * ratio));
    if (laundered <= 0) return 0;

    money.dirtyMoney = Math.max(0, money.dirtyMoney - laundered);
    money.cleanMoney += laundered;
    economy.cleanMoney = money.cleanMoney;
    economy.dirtyMoney = money.dirtyMoney;
    economy.balance = money.cleanMoney + money.dirtyMoney;
    updateEconomy(economy);
    return laundered;
  }

  function makeSeedOrder(resourceKey, side, remainingQuantity, pricePerUnit, username) {
    return {
      id: `seed-${resourceKey}-${side}-${username}-${pricePerUnit}`,
      resourceKey,
      side,
      remainingQuantity,
      pricePerUnit,
      username,
      createdAt: Date.now()
    };
  }

  function resourceKeyToBalanceKey(resourceKey) {
    const mapping = {
      data_shards: "dataShards",
      neon_dust: "neonDust",
      pulse_shot: "pulseShot",
      velvet_smoke: "velvetSmoke",
      ghost_serum: "ghostSerum",
      overdrive_x: "overdriveX",
      stim_pack: "stimPack",
      metal_parts: "metalParts",
      tech_core: "techCore",
      combat_module: "combatModule",
      baseball_bat: "baseballBat",
      street_pistol: "streetPistol",
      bulletproof_vest: "bulletproofVest",
      steel_barricades: "steelBarricades",
      security_cameras: "securityCameras",
      auto_mg_nest: "autoMgNest",
      alarm_system: "alarmSystem"
    };
    return mapping[resourceKey] || resourceKey;
  }

  function addEconomyResource(resourceKey, amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    economy[balanceKey] = Math.max(0, Math.floor(Number(economy[balanceKey] || 0) + value));
    if (["metalParts", "techCore", "combatModule"].includes(balanceKey)) {
      economy.materials = Math.max(0, Math.floor(Number(economy.materials || 0) + value));
    } else if (storageDrugTypes.some((item) => item.key === balanceKey)) {
      economy.drugInventory = economy.drugInventory || {};
      economy.drugInventory[balanceKey] = Math.max(0, Math.floor(Number(economy.drugInventory[balanceKey] || 0) + value));
      economy.drugs = Math.max(0, Math.floor(Number(economy.drugs || 0) + value));
    } else if (["baseballBat", "streetPistol", "grenade", "smg", "bazooka"].includes(balanceKey)) {
      economy.weapons = Math.max(0, Math.floor(Number(economy.weapons || 0) + value));
    }
    updateEconomy(economy);
    return value;
  }

  function removeEconomyResource(resourceKey, amount) {
    const value = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (value <= 0) return 0;
    const economy = ensureEconomyCache();
    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    const available = Math.max(0, Math.floor(Number(economy[balanceKey] || 0)));
    const removed = Math.min(available, value);
    if (removed <= 0) return 0;
    economy[balanceKey] = Math.max(0, available - removed);
    if (["metalParts", "techCore", "combatModule"].includes(balanceKey)) {
      economy.materials = Math.max(0, Math.floor(Number(economy.materials || 0) - removed));
    } else if (storageDrugTypes.some((item) => item.key === balanceKey)) {
      economy.drugInventory = economy.drugInventory || {};
      economy.drugInventory[balanceKey] = Math.max(0, Math.floor(Number(economy.drugInventory[balanceKey] || 0) - removed));
      economy.drugs = Math.max(0, Math.floor(Number(economy.drugs || 0) - removed));
    } else if (["baseballBat", "streetPistol", "grenade", "smg", "bazooka"].includes(balanceKey)) {
      economy.weapons = Math.max(0, Math.floor(Number(economy.weapons || 0) - removed));
    }
    updateEconomy(economy);
    return removed;
  }

  function readOwnerRaidStorageState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(OWNER_RAID_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveOwnerRaidStorageState(state) {
    localStorage.setItem(OWNER_RAID_STORAGE_KEY, JSON.stringify(state && typeof state === "object" ? state : {}));
  }

  function seedOwnerRaidInventory(ownerName) {
    const normalizedOwner = normalizeOwnerName(ownerName);
    const districts = (Array.isArray(window.Empire.districts) ? window.Empire.districts : []).filter(
      (district) => normalizeOwnerName(district?.owner) === normalizedOwner
    );
    const ownedCount = Math.max(1, districts.length || 1);
    const seed = Math.abs(hashDistrictSeed(`${normalizedOwner}:${ownedCount}:raid-storage`));
    return {
      metal_parts: Math.max(20, 24 + ownedCount * 6 + (seed % 18)),
      tech_core: Math.max(8, 10 + ownedCount * 3 + (seed % 9)),
      combat_module: Math.max(3, 4 + Math.floor(ownedCount / 2) + (seed % 4)),
      drugs: Math.max(24, 30 + ownedCount * 7 + (seed % 25)),
      weapons: Math.max(18, 20 + ownedCount * 5 + (seed % 20))
    };
  }

  function getOwnerRaidInventory(ownerName) {
    const ownerKey = normalizeOwnerName(ownerName);
    if (!ownerKey) return {};
    const state = readOwnerRaidStorageState();
    if (!state[ownerKey] || typeof state[ownerKey] !== "object") {
      state[ownerKey] = seedOwnerRaidInventory(ownerName);
      saveOwnerRaidStorageState(state);
    }
    return { ...state[ownerKey] };
  }

  function updateOwnerRaidInventory(ownerName, updater) {
    const ownerKey = normalizeOwnerName(ownerName);
    if (!ownerKey) return {};
    const state = readOwnerRaidStorageState();
    const current = state[ownerKey] && typeof state[ownerKey] === "object"
      ? { ...state[ownerKey] }
      : seedOwnerRaidInventory(ownerName);
    const next = typeof updater === "function" ? updater(current) : current;
    state[ownerKey] = next && typeof next === "object" ? next : current;
    saveOwnerRaidStorageState(state);
    return { ...state[ownerKey] };
  }

  function readDistrictRaidStashState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DISTRICT_RAID_STASH_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveDistrictRaidStashState(state) {
    localStorage.setItem(DISTRICT_RAID_STASH_STORAGE_KEY, JSON.stringify(state && typeof state === "object" ? state : {}));
  }

  function getDistrictRaidStash(district) {
    const districtKey = String(district?.id || "").trim();
    if (!districtKey) return {};
    const state = readDistrictRaidStashState();
    if (!state[districtKey] || typeof state[districtKey] !== "object") {
      state[districtKey] = resolveEmptyDistrictRaidStash(district);
      saveDistrictRaidStashState(state);
    }
    return { ...state[districtKey] };
  }

  function updateDistrictRaidStash(district, updater) {
    const districtKey = String(district?.id || "").trim();
    if (!districtKey) return {};
    const state = readDistrictRaidStashState();
    const current = state[districtKey] && typeof state[districtKey] === "object"
      ? { ...state[districtKey] }
      : resolveEmptyDistrictRaidStash(district);
    const next = typeof updater === "function" ? updater(current) : current;
    state[districtKey] = next && typeof next === "object" ? next : current;
    saveDistrictRaidStashState(state);
    return { ...state[districtKey] };
  }

  function createLocalMarketOrder({ resourceKey, side, quantity, pricePerUnit }) {
    const state = getLocalMarketState();
    normalizeLocalMarketBalances(state.balances || {});
    if (!["buy", "sell"].includes(side)) return { error: "invalid_side" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { error: "invalid_quantity" };
    if (!Number.isInteger(pricePerUnit) || pricePerUnit <= 0) return { error: "invalid_price" };

    const balanceKey = resourceKeyToBalanceKey(resourceKey);
    if (side === "sell" && Number(state.balances[balanceKey] || 0) < quantity) {
      return { error: "insufficient_resource" };
    }
    const orderCost = quantity * pricePerUnit;
    if (side === "buy" && Number(state.balances.money || 0) < orderCost) {
      return { error: "insufficient_money" };
    }

    if (side === "sell") {
      state.balances[balanceKey] -= quantity;
    } else {
      if (!spendLocalMoney(state.balances, orderCost)) {
        return { error: "insufficient_money" };
      }
    }

    const order = {
      id: `local-${Date.now()}`,
      resourceKey,
      side,
      quantity,
      remainingQuantity: quantity,
      pricePerUnit,
      status: "open",
      createdAt: Date.now()
    };
    state.myOrders.unshift(order);
    matchLocalMarketOrder(state, order);
    saveLocalMarketState(state);
    return { ok: true };
  }

  function cancelLocalMarketOrder(orderId) {
    const state = getLocalMarketState();
    normalizeLocalMarketBalances(state.balances || {});
    const order = state.myOrders.find((item) => item.id === orderId && item.status === "open");
    if (!order) return { error: "order_not_found" };

    const balanceKey = resourceKeyToBalanceKey(order.resourceKey);
    if (order.side === "sell") {
      state.balances[balanceKey] += order.remainingQuantity;
    } else {
      addLocalMoney(state.balances, order.remainingQuantity * order.pricePerUnit, "clean");
    }
    state.myOrders = (state.myOrders || []).filter((item) => item.id !== orderId);
    state.orderBook = (state.orderBook || []).filter((item) => item.id !== orderId);
    saveLocalMarketState(state);
    return { ok: true };
  }

  function matchLocalMarketOrder(state, order) {
    normalizeLocalMarketBalances(state.balances || {});
    const candidates = (state.orderBook || []).filter((entry) =>
      entry.resourceKey === order.resourceKey &&
      entry.side !== order.side &&
      ((order.side === "buy" && entry.pricePerUnit <= order.pricePerUnit) ||
        (order.side === "sell" && entry.pricePerUnit >= order.pricePerUnit))
    );

    const sorted = candidates.sort((a, b) =>
      order.side === "buy"
        ? a.pricePerUnit - b.pricePerUnit
        : b.pricePerUnit - a.pricePerUnit
    );

    const balanceKey = resourceKeyToBalanceKey(order.resourceKey);

    sorted.forEach((entry) => {
      if (order.remainingQuantity <= 0) return;
      const traded = Math.min(order.remainingQuantity, entry.remainingQuantity);
      const gross = traded * entry.pricePerUnit;
      const feePaid = Math.floor(gross * 0.05);

      if (order.side === "buy") {
        state.balances[balanceKey] += traded;
        addLocalMoney(state.balances, traded * Math.max(0, order.pricePerUnit - entry.pricePerUnit), "clean");
      } else {
        addLocalMoney(state.balances, gross - feePaid, "dirty");
      }

      order.remainingQuantity -= traded;
      entry.remainingQuantity -= traded;
      state.recentTrades.unshift({
        resourceKey: order.resourceKey,
        quantity: traded,
        pricePerUnit: entry.pricePerUnit,
        feePaid,
        createdAt: Date.now()
      });
    });

    state.orderBook = (state.orderBook || []).filter((entry) => entry.remainingQuantity > 0);
    state.recentTrades = state.recentTrades.slice(0, 30);
    order.status = order.remainingQuantity === 0 ? "filled" : "open";
  }

  function syncGuestEconomyFromMarket() {
    if (window.Empire.token) return;
    const state = getLocalMarketState();
    const money = resolveMoneyBreakdown(state.balances || {});
    const currentProfile = cachedProfile || window.Empire.player || null;
    if (currentProfile && typeof currentProfile === "object") {
      const nextProfile = applyMoneyToProfileSnapshot(currentProfile, money);
      if (activePlayerScenarioKey === "alliance-ten-blackout") {
        nextProfile.sources = buildBlackoutPlayerSourcesSnapshot(window.Empire.districts, resolveActiveScenarioOwnerName());
        nextProfile.source = nextProfile.sources;
      }
      cachedProfile = nextProfile;
      window.Empire.player = {
        ...(window.Empire.player || {}),
        ...nextProfile
      };
    }
    const drugInventory = storageDrugTypes.reduce((acc, item) => {
      acc[item.key] = Number(state.balances[item.key] || 0);
      return acc;
    }, {});
    updateEconomy({
      balance: money.totalMoney,
      cleanMoney: money.cleanMoney,
      dirtyMoney: money.dirtyMoney,
      influence: 20,
      drugs: Number(state.balances.drugs || 0),
      drugInventory,
      weapons: Number(state.balances.weapons || 0),
      defense: 0,
      materials: Number(state.balances.materials || 0),
      dataShards: Number(state.balances.dataShards || 0)
    });
    if (currentProfile && typeof currentProfile === "object") {
      updateProfile(window.Empire.player);
    }
  }

  function initWeaponsPopover() {
    const wrap = document.getElementById("stat-weapons-wrap");
    const popover = document.getElementById("weapons-popover");
    if (!wrap || !popover) return;
    let isOpen = false;

    const open = () => {
      popover.classList.add("is-open");
      isOpen = true;
    };

    const close = () => {
      popover.classList.remove("is-open");
      isOpen = false;
    };

    wrap.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Node && popover.contains(target)) return;
      event.stopPropagation();
      if (isOpen) close();
      else open();
    });
    popover.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-weapon-action]");
      if (!button) return;
      const action = button.dataset.weaponAction;
      if (!action) return;
      openWeaponsModal(action);
    });
  }

  function openWeaponsModal(mode) {
    const root = document.getElementById("weapons-modal");
    const list = document.getElementById("weapons-modal-list");
    const title = document.getElementById("weapons-modal-title");
    if (!root || !list || !title) return;
    const currentGangMembers = countPlayerControlledPopulation(cachedProfile || window.Empire.player || {});
    const isAttack = mode === "attack";
    const stats = isAttack ? attackWeaponStats : defenseWeaponStats;
    const counts = isAttack ? resolveWeaponCounts() : resolveDefenseCounts();
    title.textContent = isAttack ? "Útočné zbraně" : "Obranné zbraně";
    list.innerHTML = stats
      .map((item) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === item.name.toLowerCase());
        const value = key ? counts[key] : 0;
        const unlocked = currentGangMembers >= item.requiredMembers;
        return `
          <div class="weapons-modal__item ${unlocked ? "" : "is-locked"}">
            <span class="weapons-modal__name">${item.name}</span>
            <span class="weapons-modal__count">${value} ks</span>
            <span class="weapons-modal__power">Síla ${item.power} • Min. ${item.requiredMembers} členů${unlocked ? "" : " • Nelze použít"}</span>
          </div>
        `;
      })
      .join("");
    root.classList.remove("hidden");
  }

  function hydrateProfileModal(profile) {
    if (!profile) return;
    const economy = cachedEconomy || {};
    const moneyFromProfile = resolveMoneyBreakdown(profile || {});
    const moneyFromEconomy = resolveMoneyBreakdown(economy || {});
    const guestUsername = String(localStorage.getItem("empire_guest_username") || "").trim();
    const guestGangName = String(localStorage.getItem("empire_gang_name") || "").trim();
    const factionLabel = formatFactionLabel(profile.structure || localStorage.getItem("empire_structure"));
    const wantedLevel = resolveWantedLevel(profile);
    const influenceRaw = Number(profile.influence ?? economy.influence ?? 0);
    const influenceValue = Number.isFinite(influenceRaw) ? Math.max(0, Math.floor(influenceRaw)) : 0;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    const avatar = resolveActiveProfileAvatar();
    const avatarImg = document.getElementById("profile-avatar");
    if (avatarImg) {
      if (avatar) {
        avatarImg.src = avatar;
        avatarImg.classList.remove("hidden");
      } else {
        avatarImg.removeAttribute("src");
        avatarImg.classList.add("hidden");
      }
    }
    applyProfileModalVisuals(avatar);
    setText("profile-modal-username", profile.username || guestUsername || "-");
    setText("profile-modal-gang", profile.gangName || guestGangName || "-");
    setText("profile-modal-faction", factionLabel);
    setText("profile-modal-influence", influenceValue);
    const wantedText = formatWantedHeat(wantedLevel);
    setText("profile-modal-wanted", wantedText);
    const wantedEl = document.getElementById("profile-modal-wanted");
    if (wantedEl) {
      wantedEl.title = `Hledanost: ${wantedText} | ${formatPoliceRaidProtectionLabel(profile)}`;
    }
    const wantedLockEl = document.getElementById("profile-modal-wanted-lock");
    if (wantedLockEl) {
      const until = resolvePoliceRaidProtectionUntil(profile);
      const active = until > Date.now();
      wantedLockEl.classList.toggle("hidden", !active);
      wantedLockEl.title = active ? `Aktivní ochrana po razii: ${formatDurationLabel(until - Date.now())}` : "Bez aktivní ochrany po razii";
    }
    setText("profile-modal-raid-protection", formatPoliceRaidProtectionLabel(profile));
    const allianceLabel = String(profile.gangName || guestGangName || profile.alliance || "Žádná").trim();
    const districtCount = Number.isFinite(Number(profile.districts)) ? Math.max(0, Math.floor(Number(profile.districts))) : 0;
    setText("profile-modal-alliance", allianceLabel ? `${allianceLabel} (${districtCount})` : "Žádná");
    setText("profile-modal-districts", profile.districts || 0);
    const blackoutSourceRow = document.getElementById("profile-modal-blackout-source-row");
    const blackoutSourceValue = document.getElementById("profile-modal-blackout-source");
    try {
      const rawBlackoutSources = activePlayerScenarioKey === "alliance-ten-blackout"
        ? buildBlackoutPlayerSourcesSnapshot(window.Empire.districts, resolveActiveScenarioOwnerName())
        : null;
      const liveBlackoutSources = hasMeaningfulBlackoutSources(rawBlackoutSources)
        ? rawBlackoutSources
        : lastValidBlackoutSources || rawBlackoutSources;
      if (hasMeaningfulBlackoutSources(rawBlackoutSources)) {
        lastValidBlackoutSources = rawBlackoutSources;
      }
      const blackoutSources = liveBlackoutSources || (profile.sources && typeof profile.sources === "object" ? profile.sources : null);
      const districtMinuteIncome = blackoutSources?.districtIncomePerMinute || {};
      const buildingMinuteIncome = blackoutSources?.buildingIncomePerMinute || {};
      const showBlackoutSource =
        activePlayerScenarioKey === "alliance-ten-blackout"
        && blackoutSources
        && typeof blackoutSources === "object";
      if (blackoutSourceRow) {
        blackoutSourceRow.classList.toggle("hidden", !showBlackoutSource);
      }
      if (blackoutSourceValue && showBlackoutSource) {
        const districtCleanPerHour = Number(districtMinuteIncome.clean || 0) * 60;
        const districtDirtyPerHour = Number(districtMinuteIncome.dirty || 0) * 60;
        const buildingCleanPerHour = Number(buildingMinuteIncome.clean || 0) * 60;
        const buildingDirtyPerHour = Number(buildingMinuteIncome.dirty || 0) * 60;
        blackoutSourceValue.textContent =
          `Districts C${formatDecimalValue(districtCleanPerHour, 2)}/D${formatDecimalValue(districtDirtyPerHour, 2)} / hod`
          + ` • Buildings C${formatDecimalValue(buildingCleanPerHour, 2)}/D${formatDecimalValue(buildingDirtyPerHour, 2)} / hod`;
      }
      if (liveBlackoutSources && profile && typeof profile === "object") {
        profile.sources = liveBlackoutSources;
        profile.source = liveBlackoutSources;
      }
    } catch (error) {
      console.error("Profile blackout source render failed", error);
      if (blackoutSourceRow) {
        blackoutSourceRow.classList.add("hidden");
      }
    }
    const profileHasMoneyData =
      profile.cleanMoney !== undefined ||
      profile.clean_money !== undefined ||
      profile.dirtyMoney !== undefined ||
      profile.dirty_money !== undefined ||
      profile.money !== undefined ||
      profile.balance !== undefined;
    const modalMoney = profileHasMoneyData ? moneyFromProfile : moneyFromEconomy;
    setText("profile-modal-clean-money", `$${modalMoney.cleanMoney}`);
    setText("profile-modal-dirty-money", `$${modalMoney.dirtyMoney}`);
    refreshGangColorDisplays();
  }

  function showProfileModal() {
    const root = document.getElementById("profile-modal");
    if (!root) return;
    const liveProfile = window.Empire.player || cachedProfile;
    if (liveProfile && typeof liveProfile === "object") {
      try {
        hydrateProfileModal(liveProfile);
      } catch (error) {
        console.error("Profile modal hydrate failed", error);
      }
    }
    root.classList.remove("hidden");
  }

  function showSettingsModal() {
    const root = document.getElementById("settings-modal");
    if (!root) return;
    root.dispatchEvent(new CustomEvent("settings:open"));
    root.classList.remove("hidden");
  }

  function getSettingsState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      const settings = {
        ...DEFAULT_SETTINGS,
        ...(parsed && typeof parsed === "object" ? parsed : {})
      };
      const forced = {
        ...settings,
        mapVisibilityMode: "all",
        mapAllianceSymbols: true
      };
      if (forced.mapVisibilityMode !== settings.mapVisibilityMode || forced.mapAllianceSymbols !== settings.mapAllianceSymbols) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(forced));
      }
      return forced;
    } catch {
      const forced = {
        ...DEFAULT_SETTINGS,
        mapVisibilityMode: "all",
        mapAllianceSymbols: true
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(forced));
      return forced;
    }
  }

  function normalizeMapVisibilityMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "all" || mode === "hide-enemies" || mode === "only-player") return mode;
    return DEFAULT_SETTINGS.mapVisibilityMode;
  }

  function animateMoneyStatValue(element, delta) {
    if (!element || !delta) return;
    const nextClass = delta > 0 ? "is-money-up" : "is-money-down";
    element.classList.remove("is-money-up", "is-money-down");
    void element.offsetWidth;
    element.classList.add(nextClass);
    const existingTimer = moneyStatAnimationTimers.get(element);
    if (existingTimer) clearTimeout(existingTimer);
    const timerId = setTimeout(() => {
      element.classList.remove("is-money-up", "is-money-down");
      moneyStatAnimationTimers.delete(element);
    }, 1050);
    moneyStatAnimationTimers.set(element, timerId);
  }

  function parseMoneyValueFromElement(element) {
    if (!element) return 0;
    const raw = String(element.textContent || "").replace(/[^\d-]/g, "");
    const parsed = Number(raw || 0);
    return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
  }

  function stopMoneyStatCounter(element) {
    if (!element) return;
    const activeInterval = moneyStatCountIntervals.get(element);
    if (activeInterval) {
      clearInterval(activeInterval);
      moneyStatCountIntervals.delete(element);
    }
  }

  function animateMoneyStatCounter(element, targetValue, options = {}) {
    if (!element) return;
    const safeTarget = Math.max(0, Math.floor(Number(targetValue) || 0));
    const prefix = String(options?.prefix ?? "$");
    stopMoneyStatCounter(element);
    let current = parseMoneyValueFromElement(element);
    if (current === safeTarget) {
      element.textContent = `${prefix}${safeTarget}`;
      return;
    }

    const direction = safeTarget > current ? 1 : -1;
    const intervalId = setInterval(() => {
      current += direction;
      element.textContent = `${prefix}${current}`;
      if (current === safeTarget) {
        clearInterval(intervalId);
        moneyStatCountIntervals.delete(element);
      }
    }, MONEY_STAT_COUNT_TICK_MS);
    moneyStatCountIntervals.set(element, intervalId);
  }

  function syncMoneyStatToCachedValue(element, value, options = {}) {
    if (!element) return;
    stopMoneyStatCounter(element);
    const safeValue = Math.max(0, Math.floor(Number(value) || 0));
    const prefix = String(options?.prefix ?? "$");
    element.textContent = `${prefix}${safeValue}`;
  }

  function updateEconomy(economy) {
    const safeEconomy = economy && typeof economy === "object" ? { ...economy } : {};
    const rawDrugInventory = safeEconomy.drugInventory && typeof safeEconomy.drugInventory === "object"
      ? safeEconomy.drugInventory
      : {};
    const normalizedDrugInventory = storageDrugTypes.reduce((acc, item) => {
      const directValue = Number(rawDrugInventory[item.key]);
      const fallbackValue = Number(safeEconomy[item.key]);
      const value = Number.isFinite(directValue) ? directValue : fallbackValue;
      acc[item.key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
    const totalDrugs = storageDrugTypes.reduce((sum, item) => sum + Number(normalizedDrugInventory[item.key] || 0), 0);
    safeEconomy.drugInventory = normalizedDrugInventory;
    safeEconomy.drugs = Number.isFinite(Number(safeEconomy.drugs))
      ? Math.max(0, Math.floor(Number(safeEconomy.drugs)))
      : totalDrugs;
    safeEconomy.influence = normalizeSpyCount(safeEconomy.influence || 0, 0);
    const economySpyCount = resolveSpyCountFromPayload(safeEconomy);
    if (economySpyCount != null) {
      setSpyCount(economySpyCount, { persist: true });
    } else {
      getSpyCount();
    }
    safeEconomy.spyCount = getSpyCount();
    safeEconomy.spies = getSpyCount();
    cachedEconomy = safeEconomy;

    const money = resolveMoneyBreakdown(safeEconomy || {});
    const cleanMoney = document.getElementById("stat-clean-money");
    const dirtyMoney = document.getElementById("stat-dirty-money");
    if (cleanMoney) {
      if (lastRenderedCleanMoney == null) {
        cleanMoney.textContent = `$${money.cleanMoney}`;
      } else {
        animateMoneyStatCounter(cleanMoney, money.cleanMoney);
      }
    }
    if (dirtyMoney) {
      if (lastRenderedDirtyMoney == null) {
        dirtyMoney.textContent = `$${money.dirtyMoney}`;
      } else {
        animateMoneyStatCounter(dirtyMoney, money.dirtyMoney);
      }
    }
    if (cleanMoney && lastRenderedCleanMoney != null && money.cleanMoney !== lastRenderedCleanMoney) {
      animateMoneyStatValue(cleanMoney, money.cleanMoney - lastRenderedCleanMoney);
    }
    if (dirtyMoney && lastRenderedDirtyMoney != null && money.dirtyMoney !== lastRenderedDirtyMoney) {
      animateMoneyStatValue(dirtyMoney, money.dirtyMoney - lastRenderedDirtyMoney);
    }
    lastRenderedCleanMoney = money.cleanMoney;
    lastRenderedDirtyMoney = money.dirtyMoney;
    renderInfluenceSpyTopbarStat();
    const drugs = document.getElementById("stat-drugs");
    const storage = document.getElementById("stat-storage");
    const weapons = document.getElementById("stat-weapons");
    const defense = document.getElementById("stat-defense");
    if (drugs) drugs.textContent = safeEconomy.drugs || 0;
    if (storage) storage.textContent = safeEconomy.materials || 0;
    if (weapons) weapons.textContent = safeEconomy.weapons || 0;
    syncWeaponStatCounter();
    if (defense) defense.textContent = safeEconomy.defense || 0;
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    if (cachedProfile) hydrateProfileModal(cachedProfile);
    updateWeaponsPopover();
    updateDefensePopover();
  }

  function normalizeAttackWeaponLabel(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    return LEGACY_ATTACK_WEAPON_ALIASES[raw] || raw;
  }

  function readLocalWeaponCounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem("empire_weapons_detail") || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function writeLocalWeaponCounts(store) {
    localStorage.setItem("empire_weapons_detail", JSON.stringify(store || {}));
  }

  function persistWeaponCounts(store) {
    const safeStore = store && typeof store === "object" ? { ...store } : {};
    writeLocalWeaponCounts(safeStore);
    if (cachedProfile && typeof cachedProfile === "object") {
      cachedProfile.weaponsDetail = { ...safeStore };
      cachedProfile.weapons = getAttackWeaponTotal(safeStore);
    }
    if (cachedEconomy && typeof cachedEconomy === "object") {
      cachedEconomy.weaponsDetail = { ...safeStore };
      cachedEconomy.weapons = getAttackWeaponTotal(safeStore);
      updateEconomy(cachedEconomy);
      return;
    }
    syncWeaponStatCounter();
    updateWeaponsPopover();
    hydrateStorageModalValues();
  }

  function consumeAttackWeaponCounts(selectionCounts = {}) {
    const current = resolveWeaponCounts();
    const next = { ...current };
    attackWeaponStats.forEach((item) => {
      const delta = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      if (!delta) return;
      next[item.name] = Math.max(0, Math.floor(Number(next[item.name] || 0) - delta));
    });
    persistWeaponCounts(next);
    updateWeaponsPopover();
    syncWeaponStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) {
      openWeaponsModal("attack");
    }
    return next;
  }

  function readLocalDefenseCounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem("empire_defense_detail") || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function writeLocalDefenseCounts(store) {
    localStorage.setItem("empire_defense_detail", JSON.stringify(store || {}));
  }

  function persistDefenseCounts(store) {
    const safeStore = store && typeof store === "object" ? { ...store } : {};
    writeLocalDefenseCounts(safeStore);
    if (cachedProfile && typeof cachedProfile === "object") {
      cachedProfile.defenseDetail = { ...safeStore };
      cachedProfile.defense = getDefenseWeaponTotal(safeStore);
    }
    if (cachedEconomy && typeof cachedEconomy === "object") {
      cachedEconomy.defenseDetail = { ...safeStore };
      cachedEconomy.defense = getDefenseWeaponTotal(safeStore);
      updateEconomy(cachedEconomy);
      return;
    }
    syncDefenseStatCounter();
    updateDefensePopover();
    hydrateStorageModalValues();
  }

  function consumeDefenseWeaponCounts(selectionCounts = {}) {
    const current = resolveDefenseCounts();
    const next = { ...current };
    defenseWeaponStats.forEach((item) => {
      const delta = Math.max(0, Math.floor(Number(selectionCounts?.[item.name] || 0)));
      if (!delta) return;
      next[item.name] = Math.max(0, Math.floor(Number(next[item.name] || 0) - delta));
    });
    persistDefenseCounts(next);
    updateDefensePopover();
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) {
      openWeaponsModal("defense");
    }
    return next;
  }

  function resolveWeaponCounts() {
    const fromProfile = cachedProfile?.weaponsDetail;
    const fromEconomy = cachedEconomy?.weaponsDetail;
    const fromStorage = readLocalWeaponCounts();
    const sources = [fromProfile, fromEconomy, fromStorage].filter((source) => source && typeof source === "object");
    const normalized = {};

    sources.forEach((source) => {
      Object.entries(source).forEach(([name, value]) => {
        const mappedName = normalizeAttackWeaponLabel(name);
        if (!mappedName) return;
        const parsed = Number(value || 0);
        const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        if (!safe) return;
        normalized[mappedName] = Math.max(
          Math.max(0, Math.floor(Number(normalized[mappedName] || 0))),
          safe
        );
      });
    });

    attackWeaponStats.forEach((item) => {
      if (!Number.isFinite(Number(normalized[item.name]))) {
        normalized[item.name] = Math.max(0, Math.floor(Number(normalized[item.name] || 0)));
      }
    });

    return normalized;
  }

  function getAttackWeaponTotal(counts = {}) {
    return attackWeaponStats.reduce((sum, item) => {
      const key = Object.keys(counts).find((name) => name.toLowerCase() === item.name.toLowerCase());
      const value = key ? Number(counts[key] || 0) : 0;
      return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
    }, 0);
  }

  function syncWeaponStatCounter() {
    const weapons = document.getElementById("stat-weapons");
    if (!weapons) return;
    const counts = resolveWeaponCounts();
    const localTotal = getAttackWeaponTotal(counts);
    const serverTotal = Math.max(0, Math.floor(Number(cachedEconomy?.weapons || 0)));
    weapons.textContent = Math.max(serverTotal, localTotal);
  }

  function getDefenseWeaponTotal(counts = {}) {
    return defenseWeaponStats.reduce((sum, item) => {
      const key = Object.keys(counts).find((name) => name.toLowerCase() === item.name.toLowerCase());
      const value = key ? Number(counts[key] || 0) : 0;
      return sum + (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
    }, 0);
  }

  function syncDefenseStatCounter() {
    const defense = document.getElementById("stat-defense");
    if (!defense) return;
    const counts = resolveDefenseCounts();
    const localTotal = getDefenseWeaponTotal(counts);
    const serverTotal = Math.max(0, Math.floor(Number(cachedEconomy?.defense || 0)));
    defense.textContent = Math.max(serverTotal, localTotal);
  }

  function addCraftedWeapons(weaponMap = {}) {
    const source = weaponMap && typeof weaponMap === "object" ? weaponMap : {};
    const store = readLocalWeaponCounts();
    Object.entries(source).forEach(([rawName, amount]) => {
      const name = normalizeAttackWeaponLabel(rawName);
      if (!name) return;
      const delta = Math.max(0, Math.floor(Number(amount) || 0));
      if (!delta) return;
      store[name] = Math.max(0, Math.floor(Number(store[name] || 0) + delta));
    });
    writeLocalWeaponCounts(store);
    updateWeaponsPopover();
    syncWeaponStatCounter();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) {
      openWeaponsModal("attack");
    }
    return store;
  }

  function addCraftedDefense(weaponMap = {}) {
    const source = weaponMap && typeof weaponMap === "object" ? weaponMap : {};
    const store = readLocalDefenseCounts();
    Object.entries(source).forEach(([rawName, amount]) => {
      const name = String(rawName || "").trim();
      if (!name) return;
      const delta = Math.max(0, Math.floor(Number(amount) || 0));
      if (!delta) return;
      store[name] = Math.max(0, Math.floor(Number(store[name] || 0) + delta));
    });
    writeLocalDefenseCounts(store);
    updateDefensePopover();
    syncDefenseStatCounter();
    hydrateStorageModalValues();
    const weaponsModal = document.getElementById("weapons-modal");
    if (weaponsModal && !weaponsModal.classList.contains("hidden")) {
      openWeaponsModal("defense");
    }
    return store;
  }

  function updateWeaponsPopover() {
    const list = document.getElementById("weapons-popover-list");
    if (!list) return;
    const counts = resolveWeaponCounts();
    list.innerHTML = weaponCatalog
      .map((name) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
        const value = key ? counts[key] : 0;
        return `
          <div class="stat__popover-item">
            <span>${name}</span>
            <strong>${value}</strong>
          </div>
        `;
      })
      .join("");
  }

  function resolveDefenseCounts() {
    const fromProfile = cachedProfile?.defenseDetail;
    const fromEconomy = cachedEconomy?.defenseDetail;
    const fromStorage = readLocalDefenseCounts();
    const sources = [fromProfile, fromEconomy, fromStorage].filter((source) => source && typeof source === "object");
    const normalized = {};

    sources.forEach((source) => {
      Object.entries(source).forEach(([name, value]) => {
        const safeName = String(name || "").trim();
        if (!safeName) return;
        const parsed = Number(value || 0);
        const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        if (!safe) return;
        normalized[safeName] = Math.max(
          Math.max(0, Math.floor(Number(normalized[safeName] || 0))),
          safe
        );
      });
    });

    defenseWeaponStats.forEach((item) => {
      if (!Number.isFinite(Number(normalized[item.name]))) {
        normalized[item.name] = Math.max(0, Math.floor(Number(normalized[item.name] || 0)));
      }
    });

    return normalized;
  }

  function updateDefensePopover() {
    const list = document.getElementById("defense-popover-list");
    if (!list) return;
    const counts = resolveDefenseCounts();
    list.innerHTML = defenseCatalog
      .map((name) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
        const value = key ? counts[key] : 0;
        return `
          <div class="stat__popover-item">
            <span>${name}</span>
            <strong>${value}</strong>
          </div>
        `;
      })
      .join("");
  }

  function updateDistrict(district) {
    if (!district) return;
    const name = document.getElementById("district-name");
    if (!name) return;
    const displayName = district.name || `${district.type} #${district.id}`;
    if (isDistrictDestroyed(district)) {
      document.getElementById("district-owner").textContent = "Nikdo (zničený)";
      document.getElementById("district-income").textContent = "0 / nepoužitelný";
      document.getElementById("district-influence").textContent = 0;
    } else {
      document.getElementById("district-owner").textContent = district.owner || "Neobsazeno";
      document.getElementById("district-income").textContent = `$${district.income || 0}/hod`;
      document.getElementById("district-influence").textContent = district.influence || 0;
    }
    name.textContent = displayName;
    refreshMarketBuildingShortcuts();
  }

  function updateRound(round) {
    if (!round) return;
    roundStatusState = { ...round };
    renderRoundStatusState();
    startRoundPhaseTicker();
  }

  function getRoundStatusSnapshot() {
    const override = roundStatusOverride && typeof roundStatusOverride === "object" ? roundStatusOverride : null;
    const state = roundStatusState && typeof roundStatusState === "object" ? roundStatusState : null;
    if (!state && !override) return null;

    const source = override || state;
    const phaseSnapshot = state ? resolveRoundPhaseSnapshot(state) : null;
    const clockSnapshot = state ? resolveRoundClockSnapshot(state) : null;
    const basePhaseKey = source?.phaseKey || phaseSnapshot?.phaseKey || state?.currentPhaseKey || "";
    const activeSubPhaseKey = source?.subPhaseKey || state?.currentSubPhaseKey || "";
    const effectiveMode = resolveEffectiveRoundMode(basePhaseKey, activeSubPhaseKey);
    const phaseDurationMs = Math.max(0, Math.floor(Number(state?.phaseDurationMs || source?.phaseDurationMs) || 0));
    const roundStartedAt = Number(state?.roundStartedAt || source?.phaseStartedAt || source?.roundStartedAt || 0);
    const currentPhaseIndex = roundStartedAt && phaseDurationMs
      ? Math.floor(Math.max(0, Date.now() - roundStartedAt) / phaseDurationMs)
      : 0;
    const phaseStartedAt = roundStartedAt && phaseDurationMs
      ? roundStartedAt + (currentPhaseIndex * phaseDurationMs)
      : null;

    return {
      ...(state || {}),
      ...(override || {}),
      currentPhaseKey: effectiveMode.mapMode || basePhaseKey || "",
      currentSubPhaseKey: activeSubPhaseKey || "",
      currentSubPhaseLabel: source?.phaseLabel || state?.currentSubPhaseLabel || effectiveMode.phaseLabel || "",
      currentGameDay: source?.currentGameDay || phaseSnapshot?.currentGameDay || 1,
      currentGameTimeLabel: source?.timeLabel || clockSnapshot?.label || state?.currentGameTimeLabel || "09:15",
      phaseStartedAt,
      phaseDurationMs,
      roundStartedAt,
      currentPhaseIndex
    };
  }

  function pushEvent(text) {
    const container = document.getElementById("event-items");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "ticker__item";
    div.textContent = text;
    container.prepend(div);
  }

  function clearEventFeed() {
    const container = document.getElementById("event-items");
    if (!container) return;
    container.innerHTML = '<div class="ticker__item">Čekám na rozkazy...</div>';
  }

  function initEventFeedControls() {
    const clearBtn = document.getElementById("event-clear-btn");
    if (!clearBtn || clearBtn.dataset.bound === "1") return;
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", () => {
      clearEventFeed();
    });
  }

  return {
    assignDistrictMetadata,
    evaluateDistrictActionAvailability,
    init,
    hydrateAfterAuth,
    updateProfile,
    updateEconomy,
    updateDistrict,
    updateRound,
    pushEvent,
    refreshMarketBuildingShortcuts,
    handleMarketUpdate,
    getDistrictRaidLockRemainingMs,
    getRoundStatusSnapshot,
    setGuestMode,
    initProfileModal,
    initSettingsModal,
    addGangMembers,
    getCurrentGangMembers,
    getEconomySnapshot,
    trySpendCash,
    trySpendCleanCash,
    addCleanCash,
    addDirtyCash,
    addInfluence,
    launderDirtyCash,
    refreshProfilePopulation,
    addCraftedWeapons,
    addCraftedDefense,
    getDistrictDefenseSnapshot,
    getDistrictSpyIntel,
    getDistrictTrapControlState,
    resolveAllianceIconKeyByName,
    openDistrictPoliceRaidWarningModal
  };
})();
