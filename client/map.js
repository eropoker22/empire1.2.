window.Empire = window.Empire || {};

window.Empire.Map = (() => {
  const state = {
    canvas: null,
    ctx: null,
    tooltip: null,
    modal: null,
    districts: [],
    districtIndexById: new Map(),
    districtAdjacencyById: new Map(),
    baseDistrictTypeById: new Map(),
    roads: [],
    hoverId: null,
    selectedId: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    hasViewportOverride: false,
    isPanning: false,
    isPinching: false,
    touchMoved: false,
    lastTouchAt: 0,
    panStart: { x: 0, y: 0 },
    viewStart: { x: 0, y: 0 },
    pinchStartDistance: 0,
    pinchStartScale: 1,
    pinchWorldCenter: null,
    mapImage: null,
    mapMode: "night",
    mapSize: { width: 1400, height: 900 },
    vision: {
      fogPreviewMode: false,
      alliedOwnerNames: new Set(),
      enemyOwnerNames: new Set(),
      allowEnemyModalIntelInFog: false,
      uniqueOwnerColors: false,
      districtBorderMode: "player",
      unknownNeutralFillEnabled: false,
      showDistrictBorders: true,
      showAllianceSymbols: true,
      districtVisibilityMode: "all"
    },
    alliancePatternCache: new Map(),
    distinctOwnerColorByName: new Map(),
    attackedDistricts: new Map(),
    policeDistrictActions: new Map(),
    spyDistrictActions: new Map(),
    raidDistrictActions: new Map(),
    onboardingFocusDistrictId: null,
    onboardingFocusMode: "full",
    attackAnimationIntervalId: null,
    activeBuildingDetail: null,
    activeBuildingDetailTab: "stats"
  };

  const DISTRICT_ATTACK_MARKER_DEFAULT_DURATION_MS = 8 * 60 * 1000;
  const DISTRICT_ATTACK_MARKER_MIN_DURATION_MS = 15 * 1000;
  const DISTRICT_ATTACK_MARKER_MAX_DURATION_MS = 24 * 60 * 60 * 1000;
  const DISTRICT_POLICE_ACTION_DEFAULT_DURATION_MS = 60 * 60 * 1000;
  const DISTRICT_POLICE_ACTION_MIN_DURATION_MS = 60 * 60 * 1000;
  const DISTRICT_POLICE_ACTION_MAX_DURATION_MS = 24 * 60 * 60 * 1000;
  const DISTRICT_POLICE_INCOME_PENALTY_PCT = 10;
  const POLICE_RAID_INCOME_PENALTY_STORAGE_KEY = "empire_police_raid_income_penalty_map_v1";
  const DISTRICT_SPY_ACTION_DEFAULT_DURATION_MS = 20 * 1000;
  const DISTRICT_SPY_ACTION_MIN_DURATION_MS = 5 * 1000;
  const DISTRICT_SPY_ACTION_MAX_DURATION_MS = 30 * 60 * 1000;
  const DISTRICT_RAID_ACTION_DEFAULT_DURATION_MS = 20 * 1000;
  const DISTRICT_RAID_ACTION_MIN_DURATION_MS = 5 * 1000;
  const DISTRICT_RAID_ACTION_MAX_DURATION_MS = 30 * 60 * 1000;
  const POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY = "empire_police_raid_prod_penalty_until_v1";
  const POLICE_RAID_PRODUCTION_PENALTY_PCT = 10;
  const POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY = "empire_police_raid_building_action_lock_v1";
  const DISTRICT_ATTACK_ANIMATION_INTERVAL_MS = 120;
  const DISTRICT_TOP_NO_DRAW_RATIO = 0.08;
  const DOWNTOWN_VERTICAL_OFFSET_RATIO = 0.04;
  const DOWNTOWN_WARP_RADIUS_X_RATIO = 0.42;
  const DOWNTOWN_WARP_RADIUS_Y_RATIO = 0.38;
  const MAP_MODE_STORAGE_KEY = "empire_map_mode_v1";
  const MAP_MODE_IMAGE_BY_KEY = Object.freeze({
    day: "../img/mapaden2.png",
    night: "../img/mapanoc.png",
    blackout: "../img/blackout.png"
  });
  const ALLIANCE_ICON_SYMBOL_BY_KEY = Object.freeze({
    crown_skull: "☠︎",
    crossed_knives: "⚔︎",
    broken_shield: "⛨",
    snake_dagger: "🐍︎",
    eye_triangle: "◉",
    flame: "🔥︎",
    spider: "🕷︎",
    lightning: "⚡︎",
    wolf_head: "🐺︎",
    broken_mask: "🎭︎"
  });

  const ownerPalette = [
    "rgba(244,114,182,0.34)",
    "rgba(168,85,247,0.34)",
    "rgba(45,212,191,0.34)",
    "rgba(56,189,248,0.35)",
    "rgba(250,204,21,0.34)"
  ];

  const enemyPalette = [
    "rgba(244,114,182,0.22)",
    "rgba(168,85,247,0.22)",
    "rgba(45,212,191,0.22)",
    "rgba(56,189,248,0.22)",
    "rgba(250,204,21,0.22)"
  ];

  const allyPalette = [
    "rgba(56,189,248,0.46)",
    "rgba(34,197,94,0.46)",
    "rgba(250,204,21,0.46)",
    "rgba(168,85,247,0.46)"
  ];

  const districtOwnerAvatarPool = [
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

  const parkImages = [
    "../img/park/u6568429269_abandoned_cyberpunk_city_park_at_night_overgrown__cd9ea708-7c9a-4e69-b5be-3a6fef6c66f8_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_2.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_3.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_1bcdf12d-0e40-43da-8917-5671e6fdafc6_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_bba7cad8-8fa0-45eb-8f08-b10ca754da9f_3.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_ca05a4a0-8207-478c-a7fb-2e315210fa60_2.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_cfb7f673-84fa-469c-8158-40911aae18a6_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_underground_city_park_h_6cc910b5-951d-4778-96c4-33ce2a4b2d96_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_underground_city_park_h_6cc910b5-951d-4778-96c4-33ce2a4b2d96_2.png",
    "../img/park/1.png",
    "../img/park/u6568429269_ultra_realistic_futuristic_cyberpunk_city_park_at_4e6e39a1-7ff7-4445-9365-b559a33df0ba_0.png"
  ];

  const downtownImages = [
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_downtown_district_at_ni_84a7bf7c-e03a-420b-9857-c421d73f33a8_1.png",
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_3.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_3.png",
    "../img/downtown/1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_9fd803d9-f679-43c7-b791-40f5f958e092_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_3.png"
  ];

  const commercialImages = [
    "../img/commercial/u6568429269_ultra_realistic_crowded_cyberpunk_downtown_street_bf83567e-d1a3-4c69-a7d5-a3fb1424a11e_1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_0.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_2.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_0.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_2.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_1.png",
    "../img/commercial/1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_3.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_32d9d42c-9397-4a7a-b58a-1d29d6a49940_1.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_32d9d42c-9397-4a7a-b58a-1d29d6a49940_3.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_3.png"
  ];

  const residentialImages = [
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_3.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_3.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_wi_cffdadea-d0bc-4bb6-b888-64e83e9d1a03_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_wi_cffdadea-d0bc-4bb6-b888-64e83e9d1a03_3.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_0.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_1.png",
    "../img/residental/1.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_3.png"
  ];

  const industrialImages = [
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_1.png",
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_2.png",
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_3.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_0.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_1.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_2.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_3.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_1.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_2.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_3.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_0.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_1.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_2.png",
    "../img/industrial/1.png"
  ];

  const districtImageOverrides = {
    "park:106": ["../img/park/1.png"],
    "commercial:10": ["../img/commercial/1.png"]
  };

  const APARTMENT_BLOCK_NAME = "Bytový blok";
  const APARTMENT_BLOCK_STORAGE_KEY = "empire_apartment_block_mechanics_v1";
  const APARTMENT_BLOCK_CONFIG = Object.freeze({
    maxLevel: 4,
    baseProductionPerCycle: 2,
    productionCycleMs: 10 * 60 * 1000,
    baseCapacity: 24,
    baseCleanIncomePerHour: 90,
    cleanIncomePerGangMemberPerHour: 0,
    baseDirtyIncomePerHour: 30,
    dirtyIncomePerGangMemberPerHour: 0,
    baseHeatPerDay: 5,
    recruitRange: { min: 5, max: 15 },
    actionCooldowns: {
      recruit: 3 * 60 * 60 * 1000,
      motivation: 6 * 60 * 60 * 1000,
      hiddenHousing: 8 * 60 * 60 * 1000
    },
    actionDurations: {
      motivation: 2 * 60 * 60 * 1000,
      hiddenHousing: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const SCHOOL_BUILDING_NAME = "Škola";
  const SCHOOL_BUILDING_STORAGE_KEY = "empire_school_building_mechanics_v1";
  const SCHOOL_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseProductionPerCycle: 1,
    productionCycleMs: 10 * 60 * 1000,
    baseCapacity: 12,
    baseCleanIncomePerHour: 264,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 60,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 2,
    baseDrugLabPassiveBonusPct: 10,
    chemistryBoostPct: 25,
    eveningHeatReductionPct: 20,
    lectureRange: { min: 4, max: 10 },
    actionCooldowns: {
      lecture: 3 * 60 * 60 * 1000,
      chemistry: 4 * 60 * 60 * 1000,
      evening: 6 * 60 * 60 * 1000
    },
    actionDurations: {
      chemistry: 2 * 60 * 60 * 1000,
      evening: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const FITNESS_CLUB_NAME = "Fitness club";
  const FITNESS_BUILDING_STORAGE_KEY = "empire_fitness_building_mechanics_v1";
  const FITNESS_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 360,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 30,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 3,
    premiumIncomeBoostPct: 50,
    premiumHeatAdded: 2,
    trainingCombatBoostPct: 10,
    trainingIncomePenaltyPct: 20,
    actionCooldowns: {
      premium: 4 * 60 * 60 * 1000,
      training: 6 * 60 * 60 * 1000
    },
    actionDurations: {
      premium: 2 * 60 * 60 * 1000,
      training: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const CASINO_BUILDING_NAME = "Kasino";
  const CASINO_BUILDING_STORAGE_KEY = "empire_casino_building_mechanics_v1";
  const CASINO_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 480,
    baseDirtyIncomePerHour: 132,
    memberBonusPerTenMembersPerHour: 0,
    memberBonusCleanShare: 90 / 110,
    memberBonusDirtyShare: 20 / 110,
    baseHeatPerDay: 8,
    vipIncomeBoostPct: 60,
    launderingPct: 15,
    launderingRaidRiskPct: 20,
    actionHeatAdded: {
      vip: 4,
      laundering: 6
    },
    actionCooldowns: {
      vip: 4 * 60 * 60 * 1000,
      laundering: 6 * 60 * 60 * 1000
    },
    actionDurations: {
      vip: 2 * 60 * 60 * 1000,
      launderingRaidRisk: 3 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 10000,
      3: 45000,
      4: 95000
    },
    upgradePctPerLevel: 0.1
  });

  const ARCADE_BUILDING_NAME = "Herna";
  const ARCADE_BUILDING_STORAGE_KEY = "empire_arcade_building_mechanics_v1";
  const ARCADE_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 360,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 72,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 6,
    actionBoosts: {
      slotsCleanIncomePct: 50,
      backroomDirtyIncomePct: 75,
      dealDrugSalesPct: 25,
      dealDirtyPerHour: 20
    },
    raidRiskPcts: {
      backroom: 10,
      deal: 15
    },
    actionHeatAdded: {
      slots: 3,
      backroom: 5,
      deal: 6
    },
    actionCooldowns: {
      slots: 4 * 60 * 60 * 1000,
      backroom: 6 * 60 * 60 * 1000,
      deal: 5 * 60 * 60 * 1000
    },
    actionDurations: {
      slots: 2 * 60 * 60 * 1000,
      backroom: 2 * 60 * 60 * 1000,
      deal: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 15000,
      3: 35000,
      4: 55000
    },
    upgradePctPerLevel: 0.1
  });

  const AUTO_SALON_BUILDING_NAME = "Autosalon";
  const AUTO_SALON_BUILDING_STORAGE_KEY = "empire_auto_salon_building_mechanics_v1";
  const AUTO_SALON_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 300,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 60,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 4,
    baseInfluencePerHour: 2,
    actionBoosts: {
      premiumOfferCleanIncomePct: 50,
      grayImportDirtyIncomePct: 80,
      fleetLogisticsPct: 20,
      fleetCleanBonusPerHour: 15
    },
    raidRiskPcts: {
      grayImport: 10
    },
    actionHeatAdded: {
      premiumOffer: 2,
      grayImport: 5,
      fleet: 3
    },
    actionCooldowns: {
      premiumOffer: 4 * 60 * 60 * 1000,
      grayImport: 6 * 60 * 60 * 1000,
      fleet: 5 * 60 * 60 * 1000
    },
    actionDurations: {
      premiumOffer: 2 * 60 * 60 * 1000,
      grayImport: 2 * 60 * 60 * 1000,
      fleet: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 10000,
      3: 26000,
      4: 60000
    },
    upgradePctPerLevel: 0.1
  });

  const EXCHANGE_BUILDING_NAME = "Směnárna";
  const EXCHANGE_BUILDING_STORAGE_KEY = "empire_exchange_building_mechanics_v1";
  const EXCHANGE_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 330,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 78,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 4,
    baseInfluencePerHour: 1,
    actionBoosts: {
      favorableRateCleanIncomePct: 40,
      silentTransferPct: 12,
      districtIncomeBonusPct: 15
    },
    raidRiskPcts: {
      silentTransfer: 10
    },
    actionHeatAdded: {
      favorableRate: 2,
      silentTransfer: 5,
      financialNetwork: 3
    },
    actionCooldowns: {
      favorableRate: 4 * 60 * 60 * 1000,
      silentTransfer: 6 * 60 * 60 * 1000,
      financialNetwork: 5 * 60 * 60 * 1000
    },
    actionDurations: {
      favorableRate: 2 * 60 * 60 * 1000,
      silentTransferRisk: 2 * 60 * 60 * 1000,
      financialNetwork: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const RESTAURANT_BUILDING_NAME = "Restaurace";
  const RESTAURANT_BUILDING_STORAGE_KEY = "empire_restaurant_building_mechanics_v1";
  const RESTAURANT_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 300,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 30,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 2,
    baseInfluencePerHour: 0.5,
    actionBoosts: {
      happyHourCleanIncomePct: 35,
      backTableInfluenceBoostPct: 100,
      backTableCleanIncomePenaltyPct: 15,
      birthdayPartyRumorCount: 2
    },
    actionHeatAdded: {
      happyHour: 1
    },
    actionCooldowns: {
      happyHour: 4 * 60 * 60 * 1000,
      backTable: 5 * 60 * 60 * 1000,
      birthdayParty: 2 * 60 * 60 * 1000
    },
    actionDurations: {
      happyHour: 2 * 60 * 60 * 1000,
      backTable: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const CONVENIENCE_STORE_BUILDING_NAME = "Večerka";
  const CONVENIENCE_STORE_BUILDING_STORAGE_KEY = "empire_convenience_store_building_mechanics_v1";
  const CONVENIENCE_STORE_BUILDING_CONFIG = Object.freeze({
    maxLevel: 4,
    baseCleanIncomePerHour: 210,
    cleanIncomePerTenMembersPerHour: 0,
    baseDirtyIncomePerHour: 78,
    dirtyIncomePerTenMembersPerHour: 0,
    baseHeatPerDay: 2.5,
    baseInfluencePerHour: 0.3,
    actionBoosts: {
      nightShiftCleanIncomePct: 30,
      nightShiftDirtyIncomePct: 20,
      backCounterDirtyIncomePct: 60,
      backCounterRaidRiskPct: 8,
      localRumorsInfluenceBonus: 0.1
    },
    actionHeatAdded: {
      nightShift: 2,
      backCounter: 4,
      localRumors: 1
    },
    actionCooldowns: {
      nightShift: 4 * 60 * 60 * 1000,
      backCounter: 5 * 60 * 60 * 1000,
      localRumors: 2 * 60 * 60 * 1000
    },
    actionDurations: {
      nightShift: 2 * 60 * 60 * 1000,
      backCounter: 2 * 60 * 60 * 1000,
      backCounterRaidRisk: 2 * 60 * 60 * 1000
    },
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    upgradePctPerLevel: 0.1
  });

  const PHARMACY_BUILDING_NAME = "Lékárna";
  const PHARMACY_BUILDING_STORAGE_KEY = "empire_pharmacy_building_mechanics_v1";
  const PHARMACY_CONFIG = Object.freeze({
    maxLevel: 14,
    baseCleanIncomePerHour: 0,
    baseDirtyIncomePerHour: 0,
    baseProductionPerHour: Object.freeze({
      chemicals: 300,
      biomass: 200,
      stimPack: 144
    }),
    slotStorageCaps: Object.freeze({
      chemicals: 20,
      biomass: 30,
      stimPack: 30
    }),
    baseHeatPerDay: 3,
    upgradePctPerLevel: 0.1,
    boostDurationMs: 2 * 60 * 60 * 1000,
    boosts: Object.freeze({
      recon: Object.freeze({
        resourceKey: "ghostSerum",
        resourceLabel: "Ghost Serum",
        drugCost: 1,
        spySpeedPct: 50,
        infoQualityPct: 30
      }),
      action: Object.freeze({
        resourceKey: "ghostSerum",
        resourceLabel: "Ghost Serum",
        drugCost: 1,
        attackSpeedPct: 25,
        stealSpeedPct: 25
      }),
      neuro: Object.freeze({
        resourceKey: "overdriveX",
        resourceLabel: "Overdrive X",
        drugCost: 1,
        activeActionsPct: 20,
        heatAdded: 3
      })
    })
  });
  const PHARMACY_RESOURCE_KEYS = Object.freeze(["chemicals", "biomass", "stimPack"]);
  const PHARMACY_SLOT_CONFIG = Object.freeze([
    Object.freeze({ id: 1, resourceKey: "chemicals", label: "Chemicals", basePerHour: PHARMACY_CONFIG.baseProductionPerHour.chemicals }),
    Object.freeze({ id: 2, resourceKey: "biomass", label: "Biomass", basePerHour: PHARMACY_CONFIG.baseProductionPerHour.biomass }),
    Object.freeze({ id: 3, resourceKey: "stimPack", label: "Stim Pack", basePerHour: PHARMACY_CONFIG.baseProductionPerHour.stimPack })
  ]);

  const FACTORY_BUILDING_NAME = "Továrna";
  const FACTORY_BUILDING_STORAGE_KEY = "empire_factory_building_mechanics_v1";
  const FACTORY_PLAYER_STORAGE_KEY = "empire_factory_player_supplies_v1";
  const FACTORY_CONFIG = Object.freeze({
    maxLevel: 14,
    baseProductionPerHour: Object.freeze({
      metalParts: 360,
      techCore: 200
    }),
    upgradePctPerLevel: 0.1,
    combatModule: Object.freeze({
      metalPartsCost: 4,
      techCoreCost: 3,
      durationMs: 15 * 60 * 1000,
      heatPerUnit: 1
    })
  });
  const PHARMACY_UNIT_CLEAN_COST = Object.freeze({
    chemicals: 20,
    biomass: 50,
    stimPack: 95
  });
  const FACTORY_SLOT_STORAGE_CAP = 20;
  const FACTORY_COMBAT_BOOSTS = Object.freeze({
    assault: Object.freeze({
      combatModuleCost: 2,
      durationMs: 2 * 60 * 60 * 1000,
      attackPowerPct: 30,
      heatAdded: 3
    }),
    rapid: Object.freeze({
      combatModuleCost: 3,
      durationMs: 90 * 60 * 1000,
      attackSpeedPct: 40,
      raidSpeedPct: 25,
      defensePenaltyPct: 10,
      heatAdded: 4
    }),
    breach: Object.freeze({
      combatModuleCost: 4,
      durationMs: 2 * 60 * 60 * 1000,
      destroyBuildingChancePct: 20,
      defenseIgnorePct: 15,
      policeInterventionRiskPct: 35,
      heatAdded: 5
    })
  });
  const FACTORY_RESOURCE_KEYS = Object.freeze(["metalParts", "techCore", "combatModule"]);
  const FACTORY_SLOT_CONFIG = Object.freeze([
    Object.freeze({ id: 1, resourceKey: "metalParts", label: "Metal Parts", mode: "produce" }),
    Object.freeze({ id: 2, resourceKey: "techCore", label: "Tech Core", mode: "produce" }),
    Object.freeze({ id: 3, resourceKey: "combatModule", label: "Combat Module", mode: "craft" })
  ]);

  const ARMORY_BUILDING_NAME = "Zbrojovka";
  const ARMORY_BUILDING_STORAGE_KEY = "empire_armory_building_mechanics_v1";
  const ARMORY_BASE_WEAPON_POWER = Object.freeze({
    attack: Object.freeze({
      baseballBat: 5,
      streetPistol: 10,
      grenade: 14,
      smg: 18,
      bazooka: 30
    }),
    defense: Object.freeze({
      bulletproofVest: 6,
      steelBarricades: 12,
      securityCameras: 6,
      autoMgNest: 20,
      alarmSystem: 10
    })
  });
  const ARMORY_CONFIG = Object.freeze({
    maxLevel: 14,
    upgradePctPerLevel: 0.1,
    weapons: Object.freeze({
      baseballBat: Object.freeze({
        id: "baseballBat",
        category: "attack",
        name: "Baseballová pálka",
        metalPartsCost: 2,
        techCoreCost: 0,
        durationMs: 8 * 1000,
        attackPower: ARMORY_BASE_WEAPON_POWER.attack.baseballBat,
        specialEffect: "Attack power 5",
        drawback: "Slabý damage, slabá proti obranným budovám",
        role: "Early game, rychlé farmení slabých distriktů",
        heatPerUnit: 0
      }),
      streetPistol: Object.freeze({
        id: "streetPistol",
        category: "attack",
        name: "Pouliční pistole",
        metalPartsCost: 3,
        techCoreCost: 1,
        durationMs: 10 * 1000,
        attackPower: ARMORY_BASE_WEAPON_POWER.attack.streetPistol,
        specialEffect: "Attack power 10",
        drawback: "Průměrná síla",
        role: "Univerzální zbraň, early-mid game",
        heatPerUnit: 0
      }),
      grenade: Object.freeze({
        id: "grenade",
        category: "attack",
        name: "Granát",
        metalPartsCost: 4,
        techCoreCost: 1,
        durationMs: 15 * 1000,
        attackPower: ARMORY_BASE_WEAPON_POWER.attack.grenade,
        specialEffect: "Attack power 14, ignoruje 0.3 % obrany",
        drawback: "Jednorázově orientovaný efekt, menší dlouhodobá hodnota",
        role: "Burst damage, prolomení obrany",
        heatPerUnit: 0
      }),
      smg: Object.freeze({
        id: "smg",
        category: "attack",
        name: "Samopal",
        metalPartsCost: 5,
        techCoreCost: 2,
        durationMs: 20 * 1000,
        attackPower: ARMORY_BASE_WEAPON_POWER.attack.smg,
        specialEffect: "Attack power 18, +0.2 power za ks při použití všech 5 attack zbraní v jednom útoku",
        drawback: "Slabší proti silným hráčům",
        role: "Mid game dominance, tlak na slabší hráče",
        heatPerUnit: 0
      }),
      bazooka: Object.freeze({
        id: "bazooka",
        category: "attack",
        name: "Bazuka",
        metalPartsCost: 8,
        techCoreCost: 4,
        durationMs: 35 * 1000,
        attackPower: ARMORY_BASE_WEAPON_POWER.attack.bazooka,
        specialEffect: "Attack power 30, 1 ks zvyšuje o 0.5 % šanci na totální destrukci napadeného districtu",
        drawback: "Extrémně drahá",
        role: "Heavy attack / endgame push",
        heatPerUnit: 4
      }),
      bulletproofVest: Object.freeze({
        id: "bulletproofVest",
        category: "defense",
        name: "Neprůstřelná vesta",
        metalPartsCost: 3,
        techCoreCost: 1,
        durationMs: 8 * 1000,
        defensePower: ARMORY_BASE_WEAPON_POWER.defense.bulletproofVest,
        specialEffect: "Defense power 6, snižuje ztráty počtu obyvatel gangu o 0.5 % za ks",
        drawback: "Slabá proti těžkým zbraním",
        role: "Základní ochrana gangu, early game přežití",
        heatPerUnit: 0
      }),
      steelBarricades: Object.freeze({
        id: "steelBarricades",
        category: "defense",
        name: "Ocelové barikády",
        metalPartsCost: 6,
        techCoreCost: 2,
        durationMs: 15 * 1000,
        defensePower: ARMORY_BASE_WEAPON_POWER.defense.steelBarricades,
        specialEffect: "Defense power 12",
        drawback: "Částečně ignorováno granáty a bazukou",
        role: "Obrana districtu, základní wall",
        heatPerUnit: 0
      }),
      securityCameras: Object.freeze({
        id: "securityCameras",
        category: "defense",
        name: "Bezpečnostní kamery",
        metalPartsCost: 4,
        techCoreCost: 3,
        durationMs: 18 * 1000,
        defensePower: ARMORY_BASE_WEAPON_POWER.defense.securityCameras,
        specialEffect: "Defense power 6, při 5+ kusech velká šance na odhalení špeha",
        drawback: "Slabý přímý defense",
        role: "Intel / counter spy, ochrana před překvapením",
        heatPerUnit: 0
      }),
      autoMgNest: Object.freeze({
        id: "autoMgNest",
        category: "defense",
        name: "Automatické kulometné stanoviště",
        metalPartsCost: 10,
        techCoreCost: 5,
        durationMs: 25 * 1000,
        defensePower: ARMORY_BASE_WEAPON_POWER.defense.autoMgNest,
        specialEffect: "Defense power 20, 1 ks snižuje útočníkovi sílu útoku o 0.3 %",
        drawback: "Méně efektivní proti granátům a bazuce",
        role: "Hlavní obranný damage dealer",
        heatPerUnit: 0
      }),
      alarmSystem: Object.freeze({
        id: "alarmSystem",
        category: "defense",
        name: "Alarm",
        metalPartsCost: 2,
        techCoreCost: 1,
        durationMs: 12 * 1000,
        defensePower: ARMORY_BASE_WEAPON_POWER.defense.alarmSystem,
        specialEffect: "Defense power 10, při 5+ kusech velká šance na selhání vykradení districtu",
        drawback: "Nechrání přímo (support)",
        role: "Support obrana, propojení s policií",
        heatPerUnit: 0
      })
    })
  });
  const ARMORY_WEAPON_KEYS = Object.freeze(Object.keys(ARMORY_CONFIG.weapons));
  const ARMORY_BATCH_MAX_UNITS = 20;
  const ARMORY_ATTACK_WEAPON_KEYS = Object.freeze(
    ARMORY_WEAPON_KEYS.filter((key) => ARMORY_CONFIG.weapons[key]?.category !== "defense")
  );
  const ARMORY_DEFENSE_WEAPON_KEYS = Object.freeze(
    ARMORY_WEAPON_KEYS.filter((key) => ARMORY_CONFIG.weapons[key]?.category === "defense")
  );
  const ARMORY_SLOT_CONFIG = Object.freeze(
    ARMORY_WEAPON_KEYS.map((weaponKey, index) =>
      Object.freeze({
        id: index + 1,
        weaponKey,
        label: ARMORY_CONFIG.weapons[weaponKey].name,
        category: ARMORY_CONFIG.weapons[weaponKey]?.category === "defense" ? "defense" : "attack"
      })
    )
  );
  const ARMORY_SPECIAL_ACTIONS = Object.freeze({
    attackBoost: Object.freeze({
      cooldownMs: 6 * 60 * 60 * 1000,
      durationMs: 2 * 60 * 60 * 1000,
      productionBoostPct: 20,
      immediateHeat: 10,
      passiveHeatPerHour: 5
    }),
    defenseBoost: Object.freeze({
      cooldownMs: 6 * 60 * 60 * 1000,
      durationMs: 2 * 60 * 60 * 1000,
      productionBoostPct: 20,
      immediateHeat: 10,
      passiveHeatPerHour: 5
    })
  });

  const DRUG_LAB_BUILDING_NAME = "Drug lab";
  const DRUG_LAB_BUILDING_STORAGE_KEY = "empire_drug_lab_building_mechanics_v1";
  const DRUG_LAB_PLAYER_STORAGE_KEY = "empire_drug_lab_player_v1";
  const DRUG_LAB_EVENT_LOG_LIMIT = 80;
  const DRUG_LAB_SUPPLY_KEYS = Object.freeze(["chemicals", "biomass", "stimPack"]);
  const DRUG_LAB_CONFIG = Object.freeze({
    maxLevel: 4,
    maxSlots: 4,
    baseStorageCapacity: 100,
    baseCleanIncomePerHour: 0,
    baseDirtyIncomePerHour: 0,
    storageBonusPerWarehousePct: 20,
    productionBonusPerWarehousePct: 3,
    upgradePctPerLevel: 0.1,
    upgradeCosts: {
      2: 5000,
      3: 15000,
      4: 40000
    },
    specialActions: {
      overclock: {
        cooldownMs: 6 * 60 * 60 * 1000,
        durationMs: 2 * 60 * 60 * 1000,
        productionBoostPct: 50,
        immediateHeat: 3
      },
      cleanBatch: {
        cooldownMs: 5 * 60 * 60 * 1000,
        durationMs: 2 * 60 * 60 * 1000,
        effectBoostPct: 20
      },
      hiddenOperation: {
        cooldownMs: 6 * 60 * 60 * 1000,
        durationMs: 2 * 60 * 60 * 1000,
        heatReductionPct: 30,
        productionPenaltyPct: 20
      }
    },
    pulseShotProductionBoostPct: 15,
    ghostSerumHeatReductionPct: 15,
    overdriveUseImmediateHeat: 8,
    overdriveCrashDurationMs: 60 * 60 * 1000,
    overdriveCrashPenaltyPct: 10
  });

  const DRUG_CONFIG = Object.freeze({
    neonDust: Object.freeze({
      id: "neonDust",
      name: "Neon Dust",
      productionPerHour: 200,
      supplyCost: Object.freeze({ chemicals: 3, biomass: 1, stimPack: 0 }),
      heatPerHour: 1,
      useAmount: 5,
      effectDurationMs: 2 * 60 * 60 * 1000,
      description: "Chemický prášek podobný speedu. Recept: 3x Chemicals + 1x Biomass. Výroba 1 balení / 18s. +10 % income z Pouličních dealerů, +5 % dirty cash z Heren a Večerek"
    }),
    pulseShot: Object.freeze({
      id: "pulseShot",
      name: "Pulse Shot",
      productionPerHour: 720 / 7,
      supplyCost: Object.freeze({ chemicals: 2, biomass: 1, stimPack: 2 }),
      heatPerHour: 2,
      useAmount: 3,
      effectDurationMs: 2 * 60 * 60 * 1000,
      description: "To nejlepší na trhu. Recept: 2x Chemicals + 1x Biomass + 2x Stim Pack. Výroba 1 balení / 35s. +15 % rychlost produkce všech budov"
    }),
    velvetSmoke: Object.freeze({
      id: "velvetSmoke",
      name: "Velvet Smoke",
      productionPerHour: 360,
      supplyCost: Object.freeze({ chemicals: 2, biomass: 1, stimPack: 0 }),
      heatPerHour: 3,
      useAmount: 2,
      effectDurationMs: 2 * 60 * 60 * 1000,
      description: "Nejlevnější droga (tabák). Recept: 2x Chemicals + 1x Biomass. Výroba 1 balení / 10s. +20 % vliv ze všech budov, +10 % income z restaurací a klubů"
    }),
    ghostSerum: Object.freeze({
      id: "ghostSerum",
      name: "Ghost Serum",
      productionPerHour: 90,
      supplyCost: Object.freeze({ chemicals: 1, biomass: 2, stimPack: 2 }),
      heatPerHour: 4,
      useAmount: 1,
      effectDurationMs: 2 * 60 * 60 * 1000,
      description: "Recept: 1x Chemicals + 2x Biomass + 2x Stim Pack. Výroba 1 balení / 40s. -20 % šance na policejní razii, -15 % heat gain"
    }),
    overdriveX: Object.freeze({
      id: "overdriveX",
      name: "Overdrive X",
      productionPerHour: 720 / 11,
      supplyCost: Object.freeze({ chemicals: 3, biomass: 1, stimPack: 3 }),
      heatPerHour: 6,
      useAmount: 1,
      effectDurationMs: 2 * 60 * 60 * 1000,
      description: "Recept: 3x Chemicals + 1x Biomass + 3x Stim Pack. Výroba 1 balení / 55s. +25 % síla gangu, +20 % všechny příjmy; po konci crash -10 % výkon"
    })
  });
  const DRUG_LAB_DRUG_KEYS = Object.freeze(Object.keys(DRUG_CONFIG));

  function getDrugLabSupplyCost(drugType, amount = 1) {
    const drug = DRUG_CONFIG[String(drugType || "").trim()];
    const units = Math.max(1, Math.floor(Number(amount) || 1));
    const base = drug?.supplyCost || {};
    return {
      chemicals: Math.max(0, Math.floor(Number(base.chemicals || 0) * units)),
      biomass: Math.max(0, Math.floor(Number(base.biomass || 0) * units)),
      stimPack: Math.max(0, Math.floor(Number(base.stimPack || 0) * units))
    };
  }

  const DISTRICT_GOSSIP_STORAGE_KEY = "empire_district_gossip_history_v1";
  const DISTRICT_GOSSIP_MAX_PER_DISTRICT = 40;
  const DISTRICT_GOSSIP_DEMO_SEED_KEY = "empire_district_gossip_demo_seed_v1";
  const DISTRICT_GOSSIP_DISABLED_INTEL_TYPES = new Set(["attack_success", "attack_failed", "raid_started"]);
  const SIMPLE_CASH_BUILDING_STORAGE_KEY = "empire_simple_cash_building_mechanics_v1";

  const BUILDING_INCOME_CLEAN_RATIO = 0.9;
  const BUILDING_INCOME_DIRTY_RATIO = 0.1;
  const BUILDING_INFLUENCE_PER_HOUR = 1;

  let apartmentBlockStore = loadApartmentBlockStore();
  let schoolBuildingStore = loadSchoolBuildingStore();
  let fitnessBuildingStore = loadFitnessBuildingStore();
  let casinoBuildingStore = loadCasinoBuildingStore();
  let arcadeBuildingStore = loadArcadeBuildingStore();
  let autoSalonBuildingStore = loadAutoSalonBuildingStore();
  let exchangeBuildingStore = loadExchangeBuildingStore();
  let restaurantBuildingStore = loadRestaurantBuildingStore();
  let convenienceStoreBuildingStore = loadConvenienceStoreBuildingStore();
  let pharmacyBuildingStore = loadPharmacyBuildingStore();
  let simpleCashBuildingStore = loadSimpleCashBuildingStore();
  let factoryBuildingStore = loadFactoryBuildingStore();
  let armoryBuildingStore = loadArmoryBuildingStore();
  let factoryPlayerSupplies = loadFactoryPlayerSupplies();
  let drugLabBuildingStore = loadDrugLabBuildingStore();
  let drugLabPlayerState = loadDrugLabPlayerState();
  let districtGossipStore = loadDistrictGossipStore();

  function init() {
    state.canvas = document.getElementById("city-map");
    state.tooltip = document.getElementById("map-tooltip");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");
    state.mapMode = resolveStoredMapMode();

    clearSpyGeneratedGossipOnRefresh();
    clearDisabledIntelTypeDistrictGossipOnRefresh();
    resetPharmacyProducedStateOnRefresh();
    loadMapImage(state.mapMode);
    generateCity();
    seedDemoDistrictGossip();
    initModal();
    initDistrictAtmosphereLightbox();
    initBuildingDetailModal();
    bindEvents();
    resizeCanvas();
  }

  function loadApartmentBlockStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(APARTMENT_BLOCK_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveApartmentBlockStore() {
    localStorage.setItem(APARTMENT_BLOCK_STORAGE_KEY, JSON.stringify(apartmentBlockStore));
  }

  function loadSchoolBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SCHOOL_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveSchoolBuildingStore() {
    localStorage.setItem(SCHOOL_BUILDING_STORAGE_KEY, JSON.stringify(schoolBuildingStore));
  }

  function loadFitnessBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FITNESS_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveFitnessBuildingStore() {
    localStorage.setItem(FITNESS_BUILDING_STORAGE_KEY, JSON.stringify(fitnessBuildingStore));
  }

  function loadCasinoBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CASINO_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveCasinoBuildingStore() {
    localStorage.setItem(CASINO_BUILDING_STORAGE_KEY, JSON.stringify(casinoBuildingStore));
  }

  function loadArcadeBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ARCADE_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveArcadeBuildingStore() {
    localStorage.setItem(ARCADE_BUILDING_STORAGE_KEY, JSON.stringify(arcadeBuildingStore));
  }

  function loadAutoSalonBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(AUTO_SALON_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveAutoSalonBuildingStore() {
    localStorage.setItem(AUTO_SALON_BUILDING_STORAGE_KEY, JSON.stringify(autoSalonBuildingStore));
  }

  function loadExchangeBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(EXCHANGE_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveExchangeBuildingStore() {
    localStorage.setItem(EXCHANGE_BUILDING_STORAGE_KEY, JSON.stringify(exchangeBuildingStore));
  }

  function loadRestaurantBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(RESTAURANT_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveRestaurantBuildingStore() {
    localStorage.setItem(RESTAURANT_BUILDING_STORAGE_KEY, JSON.stringify(restaurantBuildingStore));
  }

  function loadConvenienceStoreBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONVENIENCE_STORE_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveConvenienceStoreBuildingStore() {
    localStorage.setItem(CONVENIENCE_STORE_BUILDING_STORAGE_KEY, JSON.stringify(convenienceStoreBuildingStore));
  }

  function loadPharmacyBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PHARMACY_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function savePharmacyBuildingStore() {
    localStorage.setItem(PHARMACY_BUILDING_STORAGE_KEY, JSON.stringify(pharmacyBuildingStore));
  }

  function loadSimpleCashBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SIMPLE_CASH_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveSimpleCashBuildingStore() {
    localStorage.setItem(SIMPLE_CASH_BUILDING_STORAGE_KEY, JSON.stringify(simpleCashBuildingStore));
  }

  function resetPharmacyProducedStateOnRefresh(now = Date.now()) {
    const nextStore = {};
    let changed = false;
    Object.entries(pharmacyBuildingStore || {}).forEach(([instanceKey, rawState]) => {
      const snapshot = sanitizePharmacyState(rawState, now);
      snapshot.resources = createPharmacyResourceMap();
      snapshot.slots = (Array.isArray(snapshot.slots) ? snapshot.slots : []).map((slot, index) => {
        const defaults = createPharmacyDefaultSlots(now);
        const safeSlot = sanitizePharmacySlot(slot, defaults[index], now);
        safeSlot.producedAmount = 0;
        safeSlot.productionRemainder = 0;
        safeSlot.lastTick = now;
        return safeSlot;
      });
      nextStore[instanceKey] = snapshot;
      changed = true;
    });
    if (!changed) return;
    pharmacyBuildingStore = nextStore;
    savePharmacyBuildingStore();
  }

  function loadFactoryBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FACTORY_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveFactoryBuildingStore() {
    localStorage.setItem(FACTORY_BUILDING_STORAGE_KEY, JSON.stringify(factoryBuildingStore));
  }

  function loadArmoryBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ARMORY_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveArmoryBuildingStore() {
    localStorage.setItem(ARMORY_BUILDING_STORAGE_KEY, JSON.stringify(armoryBuildingStore));
  }

  function loadFactoryPlayerSupplies() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FACTORY_PLAYER_STORAGE_KEY) || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const normalized = createFactoryPlayerSupplyMap(parsed);
        if (!window.Empire?.token) {
          normalized.metalParts = Math.max(20, Math.floor(Number(normalized.metalParts || 0)));
          normalized.techCore = Math.max(20, Math.floor(Number(normalized.techCore || 0)));
          normalized.combatModule = Math.max(20, Math.floor(Number(normalized.combatModule || 0)));
        } else if (!Object.prototype.hasOwnProperty.call(parsed, "combatModule")) {
          normalized.combatModule = 2;
        }
        return normalized;
      }
    } catch {}
    if (!window.Empire?.token) {
      return { metalParts: 20, techCore: 20, combatModule: 20 };
    }
    return { combatModule: 2 };
  }

  function saveFactoryPlayerSupplies() {
    localStorage.setItem(FACTORY_PLAYER_STORAGE_KEY, JSON.stringify(factoryPlayerSupplies));
  }

  function loadDrugLabBuildingStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DRUG_LAB_BUILDING_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveDrugLabBuildingStore() {
    localStorage.setItem(DRUG_LAB_BUILDING_STORAGE_KEY, JSON.stringify(drugLabBuildingStore));
  }

  function loadDrugLabPlayerState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DRUG_LAB_PLAYER_STORAGE_KEY) || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveDrugLabPlayerState() {
    localStorage.setItem(DRUG_LAB_PLAYER_STORAGE_KEY, JSON.stringify(drugLabPlayerState));
  }

  function loadDistrictGossipStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DISTRICT_GOSSIP_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function saveDistrictGossipStore() {
    localStorage.setItem(DISTRICT_GOSSIP_STORAGE_KEY, JSON.stringify(districtGossipStore));
  }

  function clearSpyGeneratedGossipOnRefresh() {
    if (!districtGossipStore || typeof districtGossipStore !== "object") return;
    let changed = false;
    const nextStore = {};

    Object.entries(districtGossipStore).forEach(([districtPart, rawEntries]) => {
      const safeEntries = Array.isArray(rawEntries) ? rawEntries : [];
      const filtered = safeEntries
        .map((entry) => sanitizeDistrictGossipEntry(entry))
        .filter(Boolean)
        .filter((entry) => String(entry.intelType || "").trim().toLowerCase() !== "spy_started");
      if (filtered.length !== safeEntries.length) changed = true;
      nextStore[districtPart] = filtered.slice(0, DISTRICT_GOSSIP_MAX_PER_DISTRICT);
    });

    if (!changed) return;
    districtGossipStore = nextStore;
    saveDistrictGossipStore();
  }

  function normalizeBuildingKeyPart(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.:#]/g, "");
  }

  function createApartmentDefaultState(now = Date.now()) {
    return {
      level: 1,
      storedMembers: 0,
      productionRemainder: 0,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastProductionAt: now,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        recruit: 0,
        motivation: 0,
        hiddenHousing: 0
      },
      effects: {
        motivationUntil: 0,
        hiddenHousingUntil: 0
      },
      hiddenHousingActive: false,
      loyaltyPenalty: 0,
      extraHeat: 0
    };
  }

  function sanitizeApartmentState(rawState, now = Date.now()) {
    const fallback = createApartmentDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, APARTMENT_BLOCK_CONFIG.maxLevel)
      : 1;
    const storedMembers = Math.max(0, Math.floor(Number(rawState?.storedMembers || 0)));
    const productionRemainder = Number(rawState?.productionRemainder || 0);
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean ?? rawState?.incomeRemainder ?? 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastProductionAt = Number(rawState?.lastProductionAt || now);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      storedMembers,
      productionRemainder: Number.isFinite(productionRemainder) ? Math.max(0, productionRemainder) : 0,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastProductionAt: Number.isFinite(lastProductionAt) ? Math.max(0, lastProductionAt) : fallback.lastProductionAt,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        recruit: Math.max(0, Number(cooldownsRaw.recruit || 0)),
        motivation: Math.max(0, Number(cooldownsRaw.motivation || 0)),
        hiddenHousing: Math.max(0, Number(cooldownsRaw.hiddenHousing || 0))
      },
      effects: {
        motivationUntil: Math.max(0, Number(effectsRaw.motivationUntil || 0)),
        hiddenHousingUntil: Math.max(0, Number(effectsRaw.hiddenHousingUntil || 0))
      },
      hiddenHousingActive: Boolean(rawState?.hiddenHousingActive),
      loyaltyPenalty: Math.max(0, Number(rawState?.loyaltyPenalty || 0)),
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function resolveBuildingInstanceKey(context, district) {
    const districtId = context?.districtId ?? district?.id ?? "unknown";
    const districtPart = normalizeBuildingKeyPart(districtId) || "unknown";

    const explicitIndex = Number(context?.buildingIndex);
    const indexPart = Number.isFinite(explicitIndex) ? String(Math.max(0, Math.floor(explicitIndex))) : "x";

    const variantPart = normalizeBuildingKeyPart(context?.variantName || "");
    const basePart = normalizeBuildingKeyPart(context?.baseName || "building");
    const namePart = variantPart || basePart || "building";

    return `${districtPart}:${indexPart}:${namePart}`;
  }

  function getApartmentStateByKey(instanceKey, now = Date.now()) {
    const current = apartmentBlockStore[instanceKey];
    const sanitized = sanitizeApartmentState(current, now);
    apartmentBlockStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistApartmentState(instanceKey, nextState) {
    apartmentBlockStore[instanceKey] = sanitizeApartmentState(nextState, Date.now());
    saveApartmentBlockStore();
    return apartmentBlockStore[instanceKey];
  }

  function createSchoolDefaultState(now = Date.now()) {
    return {
      level: 1,
      storedMembers: 0,
      productionRemainder: 0,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastProductionAt: now,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        lecture: 0,
        chemistry: 0,
        evening: 0
      },
      effects: {
        chemistryUntil: 0,
        eveningUntil: 0
      },
      eveningProgramActive: false,
      districtHeatReductionActive: false,
      loyaltyPenalty: 0,
      extraHeat: 0
    };
  }

  function sanitizeSchoolState(rawState, now = Date.now()) {
    const fallback = createSchoolDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, SCHOOL_BUILDING_CONFIG.maxLevel)
      : 1;
    const storedMembers = Math.max(0, Math.floor(Number(rawState?.storedMembers || 0)));
    const productionRemainder = Number(rawState?.productionRemainder || 0);
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean ?? rawState?.incomeRemainder ?? 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastProductionAt = Number(rawState?.lastProductionAt || now);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      storedMembers,
      productionRemainder: Number.isFinite(productionRemainder) ? Math.max(0, productionRemainder) : 0,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastProductionAt: Number.isFinite(lastProductionAt) ? Math.max(0, lastProductionAt) : fallback.lastProductionAt,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        lecture: Math.max(0, Number(cooldownsRaw.lecture || 0)),
        chemistry: Math.max(0, Number(cooldownsRaw.chemistry || 0)),
        evening: Math.max(0, Number(cooldownsRaw.evening || 0))
      },
      effects: {
        chemistryUntil: Math.max(0, Number(effectsRaw.chemistryUntil || 0)),
        eveningUntil: Math.max(0, Number(effectsRaw.eveningUntil || 0))
      },
      eveningProgramActive: Boolean(rawState?.eveningProgramActive),
      districtHeatReductionActive: Boolean(rawState?.districtHeatReductionActive),
      loyaltyPenalty: Math.max(0, Number(rawState?.loyaltyPenalty || 0)),
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getSchoolStateByKey(instanceKey, now = Date.now()) {
    const current = schoolBuildingStore[instanceKey];
    const sanitized = sanitizeSchoolState(current, now);
    schoolBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistSchoolState(instanceKey, nextState) {
    schoolBuildingStore[instanceKey] = sanitizeSchoolState(nextState, Date.now());
    saveSchoolBuildingStore();
    return schoolBuildingStore[instanceKey];
  }

  function createFitnessDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        premium: 0,
        training: 0
      },
      effects: {
        premiumUntil: 0,
        trainingUntil: 0
      },
      trainingBuffActive: false,
      extraHeat: 0
    };
  }

  function sanitizeFitnessState(rawState, now = Date.now()) {
    const fallback = createFitnessDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, FITNESS_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean ?? rawState?.incomeRemainder ?? 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        premium: Math.max(0, Number(cooldownsRaw.premium || 0)),
        training: Math.max(0, Number(cooldownsRaw.training || 0))
      },
      effects: {
        premiumUntil: Math.max(0, Number(effectsRaw.premiumUntil || 0)),
        trainingUntil: Math.max(0, Number(effectsRaw.trainingUntil || 0))
      },
      trainingBuffActive: Boolean(rawState?.trainingBuffActive),
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getFitnessStateByKey(instanceKey, now = Date.now()) {
    const current = fitnessBuildingStore[instanceKey];
    const sanitized = sanitizeFitnessState(current, now);
    fitnessBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistFitnessState(instanceKey, nextState) {
    fitnessBuildingStore[instanceKey] = sanitizeFitnessState(nextState, Date.now());
    saveFitnessBuildingStore();
    return fitnessBuildingStore[instanceKey];
  }

  function createCasinoDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        vip: 0,
        laundering: 0
      },
      effects: {
        vipUntil: 0,
        raidRiskUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeCasinoState(rawState, now = Date.now()) {
    const fallback = createCasinoDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, CASINO_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        vip: Math.max(0, Number(cooldownsRaw.vip || 0)),
        laundering: Math.max(0, Number(cooldownsRaw.laundering || 0))
      },
      effects: {
        vipUntil: Math.max(0, Number(effectsRaw.vipUntil || 0)),
        raidRiskUntil: Math.max(0, Number(effectsRaw.raidRiskUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getCasinoStateByKey(instanceKey, now = Date.now()) {
    const current = casinoBuildingStore[instanceKey];
    const sanitized = sanitizeCasinoState(current, now);
    casinoBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistCasinoState(instanceKey, nextState) {
    casinoBuildingStore[instanceKey] = sanitizeCasinoState(nextState, Date.now());
    saveCasinoBuildingStore();
    return casinoBuildingStore[instanceKey];
  }

  function createArcadeDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        slots: 0,
        backroom: 0,
        deal: 0
      },
      effects: {
        slotsUntil: 0,
        backroomUntil: 0,
        dealUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeArcadeState(rawState, now = Date.now()) {
    const fallback = createArcadeDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, ARCADE_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        slots: Math.max(0, Number(cooldownsRaw.slots || 0)),
        backroom: Math.max(0, Number(cooldownsRaw.backroom || 0)),
        deal: Math.max(0, Number(cooldownsRaw.deal || 0))
      },
      effects: {
        slotsUntil: Math.max(0, Number(effectsRaw.slotsUntil || 0)),
        backroomUntil: Math.max(0, Number(effectsRaw.backroomUntil || 0)),
        dealUntil: Math.max(0, Number(effectsRaw.dealUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getArcadeStateByKey(instanceKey, now = Date.now()) {
    const current = arcadeBuildingStore[instanceKey];
    const sanitized = sanitizeArcadeState(current, now);
    arcadeBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistArcadeState(instanceKey, nextState) {
    arcadeBuildingStore[instanceKey] = sanitizeArcadeState(nextState, Date.now());
    saveArcadeBuildingStore();
    return arcadeBuildingStore[instanceKey];
  }

  function createAutoSalonDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        premiumOffer: 0,
        grayImport: 0,
        fleet: 0
      },
      effects: {
        premiumOfferUntil: 0,
        grayImportUntil: 0,
        fleetUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeAutoSalonState(rawState, now = Date.now()) {
    const fallback = createAutoSalonDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, AUTO_SALON_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        premiumOffer: Math.max(0, Number(cooldownsRaw.premiumOffer || 0)),
        grayImport: Math.max(0, Number(cooldownsRaw.grayImport || 0)),
        fleet: Math.max(0, Number(cooldownsRaw.fleet || 0))
      },
      effects: {
        premiumOfferUntil: Math.max(0, Number(effectsRaw.premiumOfferUntil || 0)),
        grayImportUntil: Math.max(0, Number(effectsRaw.grayImportUntil || 0)),
        fleetUntil: Math.max(0, Number(effectsRaw.fleetUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getAutoSalonStateByKey(instanceKey, now = Date.now()) {
    const current = autoSalonBuildingStore[instanceKey];
    const sanitized = sanitizeAutoSalonState(current, now);
    autoSalonBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistAutoSalonState(instanceKey, nextState) {
    autoSalonBuildingStore[instanceKey] = sanitizeAutoSalonState(nextState, Date.now());
    saveAutoSalonBuildingStore();
    return autoSalonBuildingStore[instanceKey];
  }

  function createExchangeDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        favorableRate: 0,
        silentTransfer: 0,
        financialNetwork: 0
      },
      effects: {
        favorableRateUntil: 0,
        silentTransferRiskUntil: 0,
        financialNetworkUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeExchangeState(rawState, now = Date.now()) {
    const fallback = createExchangeDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, EXCHANGE_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        favorableRate: Math.max(0, Number(cooldownsRaw.favorableRate || 0)),
        silentTransfer: Math.max(0, Number(cooldownsRaw.silentTransfer || 0)),
        financialNetwork: Math.max(0, Number(cooldownsRaw.financialNetwork || 0))
      },
      effects: {
        favorableRateUntil: Math.max(0, Number(effectsRaw.favorableRateUntil || 0)),
        silentTransferRiskUntil: Math.max(0, Number(effectsRaw.silentTransferRiskUntil || 0)),
        financialNetworkUntil: Math.max(0, Number(effectsRaw.financialNetworkUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getExchangeStateByKey(instanceKey, now = Date.now()) {
    const current = exchangeBuildingStore[instanceKey];
    const sanitized = sanitizeExchangeState(current, now);
    exchangeBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistExchangeState(instanceKey, nextState) {
    exchangeBuildingStore[instanceKey] = sanitizeExchangeState(nextState, Date.now());
    saveExchangeBuildingStore();
    return exchangeBuildingStore[instanceKey];
  }

  function createRestaurantDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        happyHour: 0,
        backTable: 0,
        birthdayParty: 0
      },
      effects: {
        happyHourUntil: 0,
        backTableUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeRestaurantState(rawState, now = Date.now()) {
    const fallback = createRestaurantDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, RESTAURANT_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        happyHour: Math.max(0, Number(cooldownsRaw.happyHour || 0)),
        backTable: Math.max(0, Number(cooldownsRaw.backTable || 0)),
        birthdayParty: Math.max(0, Number(cooldownsRaw.birthdayParty || 0))
      },
      effects: {
        happyHourUntil: Math.max(0, Number(effectsRaw.happyHourUntil || 0)),
        backTableUntil: Math.max(0, Number(effectsRaw.backTableUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getRestaurantStateByKey(instanceKey, now = Date.now()) {
    const current = restaurantBuildingStore[instanceKey];
    const sanitized = sanitizeRestaurantState(current, now);
    restaurantBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistRestaurantState(instanceKey, nextState) {
    restaurantBuildingStore[instanceKey] = sanitizeRestaurantState(nextState, Date.now());
    saveRestaurantBuildingStore();
    return restaurantBuildingStore[instanceKey];
  }

  function createConvenienceStoreDefaultState(now = Date.now()) {
    return {
      level: 1,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      influenceRemainder: 0,
      lastIncomeAt: now,
      lastInfluenceAt: now,
      cooldowns: {
        nightShift: 0,
        backCounter: 0,
        localRumors: 0
      },
      effects: {
        nightShiftUntil: 0,
        backCounterUntil: 0,
        backCounterRaidRiskUntil: 0
      },
      extraHeat: 0
    };
  }

  function sanitizeConvenienceStoreState(rawState, now = Date.now()) {
    const fallback = createConvenienceStoreDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, CONVENIENCE_STORE_BUILDING_CONFIG.maxLevel)
      : 1;
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      influenceRemainder: Number.isFinite(influenceRemainder) ? Math.max(0, influenceRemainder) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, lastIncomeAt) : fallback.lastIncomeAt,
      lastInfluenceAt: Number.isFinite(lastInfluenceAt) ? Math.max(0, lastInfluenceAt) : fallback.lastInfluenceAt,
      cooldowns: {
        nightShift: Math.max(0, Number(cooldownsRaw.nightShift || 0)),
        backCounter: Math.max(0, Number(cooldownsRaw.backCounter || 0)),
        localRumors: Math.max(0, Number(cooldownsRaw.localRumors || 0))
      },
      effects: {
        nightShiftUntil: Math.max(0, Number(effectsRaw.nightShiftUntil || 0)),
        backCounterUntil: Math.max(0, Number(effectsRaw.backCounterUntil || 0)),
        backCounterRaidRiskUntil: Math.max(0, Number(effectsRaw.backCounterRaidRiskUntil || 0))
      },
      extraHeat: Math.max(0, Number(rawState?.extraHeat || 0))
    };
  }

  function getConvenienceStoreStateByKey(instanceKey, now = Date.now()) {
    const current = convenienceStoreBuildingStore[instanceKey];
    const sanitized = sanitizeConvenienceStoreState(current, now);
    convenienceStoreBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistConvenienceStoreState(instanceKey, nextState) {
    convenienceStoreBuildingStore[instanceKey] = sanitizeConvenienceStoreState(nextState, Date.now());
    saveConvenienceStoreBuildingStore();
    return convenienceStoreBuildingStore[instanceKey];
  }

  function createPharmacyResourceMap(rawMap = {}, floorValues = true) {
    return PHARMACY_RESOURCE_KEYS.reduce((acc, key) => {
      const parsed = Number(rawMap?.[key] || 0);
      const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      acc[key] = floorValues ? Math.floor(safeValue) : safeValue;
      return acc;
    }, {});
  }

  function createPharmacyDefaultSlot(slotId, resourceKey, now = Date.now()) {
    return {
      id: Math.max(1, Math.floor(Number(slotId) || 0)),
      resourceKey: String(resourceKey || "").trim(),
      isProducing: false,
      queuedUnits: 1,
      queueRemaining: 0,
      producedAmount: 0,
      lastTick: now,
      productionRemainder: 0
    };
  }

  function sanitizePharmacySlot(rawSlot, fallbackSlot, now = Date.now()) {
    const id = Math.max(1, Math.floor(Number(rawSlot?.id ?? fallbackSlot?.id ?? 1) || 1));
    const expectedResourceKey = String(fallbackSlot?.resourceKey || "").trim();
    const resourceKeyRaw = String(rawSlot?.resourceKey || expectedResourceKey).trim();
    const resourceKey = PHARMACY_RESOURCE_KEYS.includes(resourceKeyRaw) ? resourceKeyRaw : expectedResourceKey;
    const queuedUnitsRaw = Number(rawSlot?.queuedUnits ?? (rawSlot?.isProducing ? 0 : 1));
    const queueRemainingRaw = Number(rawSlot?.queueRemaining || 0);
    const producedAmountRaw = Number(rawSlot?.producedAmount || 0);
    const lastTickRaw = Number(rawSlot?.lastTick || now);
    const remainderRaw = Number(rawSlot?.productionRemainder || 0);
    return {
      id,
      resourceKey,
      isProducing: Boolean(rawSlot?.isProducing),
      queuedUnits: Number.isFinite(queuedUnitsRaw)
        ? clamp(Math.floor(queuedUnitsRaw), Boolean(rawSlot?.isProducing) ? 0 : 1, 999)
        : (Boolean(rawSlot?.isProducing) ? 0 : 1),
      queueRemaining: Number.isFinite(queueRemainingRaw) ? Math.max(0, Math.floor(queueRemainingRaw)) : 0,
      producedAmount: Number.isFinite(producedAmountRaw) ? Math.max(0, Math.floor(producedAmountRaw)) : 0,
      lastTick: Number.isFinite(lastTickRaw) ? Math.max(0, Math.floor(lastTickRaw)) : now,
      productionRemainder: Number.isFinite(remainderRaw) ? Math.max(0, remainderRaw) : 0
    };
  }

  function createPharmacyDefaultSlots(now = Date.now()) {
    return PHARMACY_SLOT_CONFIG.map((slot) => createPharmacyDefaultSlot(slot.id, slot.resourceKey, now));
  }

  function createPharmacyDefaultState(now = Date.now()) {
    return {
      level: 1,
      slots: createPharmacyDefaultSlots(now),
      resources: createPharmacyResourceMap(),
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      lastIncomeAt: now,
      cooldowns: {
        recon: 0,
        action: 0,
        neuro: 0
      },
      effects: {
        reconUntil: 0,
        actionUntil: 0,
        neuroUntil: 0
      }
    };
  }

  function sanitizePharmacyState(rawState, now = Date.now()) {
    const fallback = createPharmacyDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, PHARMACY_CONFIG.maxLevel)
      : 1;
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};
    const slotsRaw = Array.isArray(rawState?.slots) ? rawState.slots : [];
    const fallbackSlots = createPharmacyDefaultSlots(now);
    const slots = fallbackSlots.map((fallbackSlot, index) =>
      sanitizePharmacySlot(slotsRaw[index], fallbackSlot, now)
    );
    const resources = createPharmacyResourceMap(rawState?.resources);
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);

    if (!slotsRaw.length && rawState?.resources && typeof rawState.resources === "object") {
      // Backward compatibility with older pharmacy state without slot system.
      slots.forEach((slot) => {
        slot.producedAmount = Math.max(0, Math.floor(Number(resources[slot.resourceKey] || 0)));
      });
    }

    return {
      level,
      slots,
      resources,
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, Math.floor(lastIncomeAt)) : fallback.lastIncomeAt,
      cooldowns: {
        recon: Math.max(0, Number(cooldownsRaw.recon || 0)),
        action: Math.max(0, Number(cooldownsRaw.action || 0)),
        neuro: Math.max(0, Number(cooldownsRaw.neuro || 0))
      },
      effects: {
        reconUntil: Math.max(0, Number(effectsRaw.reconUntil || 0)),
        actionUntil: Math.max(0, Number(effectsRaw.actionUntil || 0)),
        neuroUntil: Math.max(0, Number(effectsRaw.neuroUntil || 0))
      }
    };
  }

  function getPharmacyStateByKey(instanceKey, now = Date.now()) {
    const current = pharmacyBuildingStore[instanceKey];
    const sanitized = sanitizePharmacyState(current, now);
    pharmacyBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistPharmacyState(instanceKey, nextState) {
    pharmacyBuildingStore[instanceKey] = sanitizePharmacyState(nextState, Date.now());
    savePharmacyBuildingStore();
    return pharmacyBuildingStore[instanceKey];
  }

  function getPharmacyUpgradeCost(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 2, PHARMACY_CONFIG.maxLevel);
    const rawCost = 5000 * Math.pow(1.47, safeLevel - 2);
    return Math.max(1000, Math.round(rawCost / 100) * 100);
  }

  function getPharmacyLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, PHARMACY_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * PHARMACY_CONFIG.upgradePctPerLevel;
  }

  function calculatePharmacyProductionRates(levelMultiplier = 1) {
    const multiplier = Math.max(0, Number(levelMultiplier) || 0);
    const buildingMultiplier = 1 + getPharmacyProductionBonusPct() / 100;
    const policePenaltyMultiplier = Math.max(0, 1 - getGlobalPoliceRaidProductionPenaltyPct("lab", Date.now()) / 100);
    return {
      chemicalsPerHour: PHARMACY_CONFIG.baseProductionPerHour.chemicals * multiplier * buildingMultiplier * policePenaltyMultiplier,
      biomassPerHour: PHARMACY_CONFIG.baseProductionPerHour.biomass * multiplier * buildingMultiplier * policePenaltyMultiplier,
      stimPackPerHour: PHARMACY_CONFIG.baseProductionPerHour.stimPack * multiplier * buildingMultiplier * policePenaltyMultiplier
    };
  }

  function calculatePharmacyCashRates(levelMultiplier = 1) {
    const multiplier = Math.max(0, Number(levelMultiplier) || 0);
    return {
      hourlyCleanIncome: PHARMACY_CONFIG.baseCleanIncomePerHour * multiplier,
      hourlyDirtyIncome: PHARMACY_CONFIG.baseDirtyIncomePerHour * multiplier
    };
  }

  function syncPharmacyProduction(instanceState, now = Date.now()) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getPharmacyLevelMultiplier(stateRef.level);
    const rates = calculatePharmacyProductionRates(levelMultiplier);
    const produced = createPharmacyResourceMap({}, false);
    const safeSlots = Array.isArray(stateRef.slots) && stateRef.slots.length
      ? stateRef.slots
      : createPharmacyDefaultSlots(nowMs);
    const defaultSlots = createPharmacyDefaultSlots(nowMs);

    stateRef.slots = safeSlots.map((rawSlot, index) =>
      sanitizePharmacySlot(rawSlot, defaultSlots[index], nowMs)
    );

    const rateByResource = {
      chemicals: rates.chemicalsPerHour,
      biomass: rates.biomassPerHour,
      stimPack: rates.stimPackPerHour
    };
    const resourceCaps = PHARMACY_CONFIG.slotStorageCaps || {};
    const slotCapMultiplier = getPharmacyStorageCapMultiplier();

    stateRef.slots.forEach((slot) => {
      let from = Number(slot.lastTick || nowMs);
      if (!Number.isFinite(from) || from > nowMs) {
        from = nowMs;
      }
      if (!slot.isProducing) {
        slot.lastTick = nowMs;
        return;
      }
      const elapsedMs = Math.max(0, nowMs - from);
      if (elapsedMs <= 0) {
        slot.lastTick = nowMs;
        return;
      }
      const resourceKey = PHARMACY_RESOURCE_KEYS.includes(slot.resourceKey) ? slot.resourceKey : null;
      if (!resourceKey) {
        slot.lastTick = nowMs;
        slot.productionRemainder = 0;
        return;
      }
      const queuedRemaining = Math.max(0, Math.floor(Number(slot.queueRemaining || 0)));
      if (queuedRemaining <= 0) {
        slot.isProducing = false;
        slot.lastTick = nowMs;
        slot.productionRemainder = 0;
        return;
      }
      const perHour = Math.max(0, Number(rateByResource[resourceKey] || 0));
      const raw = (elapsedMs / 3600000) * perHour + Number(slot.productionRemainder || 0);
      const gained = Math.max(0, Math.floor(raw));
      slot.productionRemainder = Math.max(0, raw - gained);
      if (gained > 0) {
        const baseCapRaw = Number(resourceCaps[resourceKey]);
        const capRaw = Number.isFinite(baseCapRaw) ? Math.max(0, Math.floor(baseCapRaw * slotCapMultiplier)) : Number.NaN;
        const hasCap = Number.isFinite(capRaw);
        const currentAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
        const freeSpace = hasCap ? Math.max(0, Math.floor(capRaw - currentAmount)) : gained;
        const storable = hasCap ? Math.min(gained, freeSpace, queuedRemaining) : Math.min(gained, queuedRemaining);
        if (storable > 0) {
          slot.producedAmount = Math.max(0, currentAmount + storable);
          stateRef.resources[resourceKey] = Math.max(0, Math.floor(Number(stateRef.resources[resourceKey] || 0) + storable));
          produced[resourceKey] = Math.max(0, Math.floor(Number(produced[resourceKey] || 0) + storable));
          slot.queueRemaining = Math.max(0, queuedRemaining - storable);
        }
        if (hasCap && storable < gained) {
          slot.productionRemainder = 0;
        }
        if (Math.max(0, Math.floor(Number(slot.queueRemaining || 0))) <= 0) {
          slot.isProducing = false;
          slot.productionRemainder = 0;
        }
        if (hasCap && Math.max(0, Math.floor(Number(slot.producedAmount || 0))) >= Math.floor(capRaw)) {
          slot.isProducing = false;
        }
      }
      slot.lastTick = nowMs;
    });

    const activeSlots = stateRef.slots.reduce((sum, slot) => sum + (slot.isProducing ? 1 : 0), 0);
    return { rates, produced, levelMultiplier, activeSlots };
  }

  function syncPharmacyIncome(instanceState, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getPharmacyLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const rates = calculatePharmacyCashRates(levelMultiplier);

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      rates: {
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier
      }
    };
  }

  function createSimpleCashBuildingDefaultState(now = Date.now()) {
    return {
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      lastIncomeAt: now
    };
  }

  function sanitizeSimpleCashBuildingState(rawState, now = Date.now()) {
    const fallback = createSimpleCashBuildingDefaultState(now);
    const incomeRemainderClean = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirty = Number(rawState?.incomeRemainderDirty || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    return {
      incomeRemainderClean: Number.isFinite(incomeRemainderClean) ? Math.max(0, incomeRemainderClean) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirty) ? Math.max(0, incomeRemainderDirty) : 0,
      lastIncomeAt: Number.isFinite(lastIncomeAt) ? Math.max(0, Math.floor(lastIncomeAt)) : fallback.lastIncomeAt
    };
  }

  function getSimpleCashBuildingStateByKey(instanceKey, now = Date.now()) {
    const current = simpleCashBuildingStore[instanceKey];
    const sanitized = sanitizeSimpleCashBuildingState(current, now);
    simpleCashBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistSimpleCashBuildingState(instanceKey, nextState) {
    simpleCashBuildingStore[instanceKey] = sanitizeSimpleCashBuildingState(nextState, Date.now());
    saveSimpleCashBuildingStore();
    return simpleCashBuildingStore[instanceKey];
  }

  function createFactoryResourceMap(rawMap = {}, floorValues = true) {
    return FACTORY_RESOURCE_KEYS.reduce((acc, key) => {
      const parsed = Number(rawMap?.[key] || 0);
      const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      acc[key] = floorValues ? Math.floor(safeValue) : safeValue;
      return acc;
    }, {});
  }

  function createFactoryPlayerSupplyMap(rawMap = {}) {
    return createFactoryResourceMap(rawMap, true);
  }

  function createFactoryDefaultSlot(slotId, resourceKey, mode, now = Date.now()) {
    return {
      id: Math.max(1, Math.floor(Number(slotId) || 0)),
      resourceKey: String(resourceKey || "").trim(),
      mode: String(mode || "produce").trim(),
      isProducing: false,
      producedAmount: 0,
      lastTick: now,
      productionRemainder: 0
    };
  }

  function sanitizeFactorySlot(rawSlot, fallbackSlot, now = Date.now()) {
    const id = Math.max(1, Math.floor(Number(rawSlot?.id ?? fallbackSlot?.id ?? 1) || 1));
    const expectedResourceKey = String(fallbackSlot?.resourceKey || "").trim();
    const resourceKeyRaw = String(rawSlot?.resourceKey || expectedResourceKey).trim();
    const resourceKey = FACTORY_RESOURCE_KEYS.includes(resourceKeyRaw) ? resourceKeyRaw : expectedResourceKey;
    const expectedMode = String(fallbackSlot?.mode || "produce").trim();
    const modeRaw = String(rawSlot?.mode || expectedMode).trim().toLowerCase();
    const mode = modeRaw === "craft" ? "craft" : "produce";
    const producedAmountRaw = Number(rawSlot?.producedAmount || 0);
    const lastTickRaw = Number(rawSlot?.lastTick || now);
    const remainderRaw = Number(rawSlot?.productionRemainder || 0);
    return {
      id,
      resourceKey,
      mode,
      isProducing: Boolean(rawSlot?.isProducing),
      producedAmount: Number.isFinite(producedAmountRaw) ? Math.max(0, Math.floor(producedAmountRaw)) : 0,
      lastTick: Number.isFinite(lastTickRaw) ? Math.max(0, Math.floor(lastTickRaw)) : now,
      productionRemainder: Number.isFinite(remainderRaw) ? Math.max(0, remainderRaw) : 0
    };
  }

  function createFactoryDefaultSlots(now = Date.now()) {
    return FACTORY_SLOT_CONFIG.map((slot) =>
      createFactoryDefaultSlot(slot.id, slot.resourceKey, slot.mode, now)
    );
  }

  function createFactoryDefaultState(now = Date.now()) {
    return {
      level: 1,
      slots: createFactoryDefaultSlots(now),
      resources: createFactoryResourceMap(),
      cooldowns: {
        assault: 0,
        rapid: 0,
        breach: 0
      },
      effects: {
        assaultUntil: 0,
        rapidUntil: 0,
        breachUntil: 0
      }
    };
  }

  function sanitizeFactoryState(rawState, now = Date.now()) {
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, FACTORY_CONFIG.maxLevel)
      : 1;
    const slotsRaw = Array.isArray(rawState?.slots) ? rawState.slots : [];
    const fallbackSlots = createFactoryDefaultSlots(now);
    const slots = fallbackSlots.map((fallbackSlot, index) =>
      sanitizeFactorySlot(slotsRaw[index], fallbackSlot, now)
    );
    const resources = createFactoryResourceMap(rawState?.resources);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    if (!slotsRaw.length && rawState?.resources && typeof rawState.resources === "object") {
      slots.forEach((slot) => {
        slot.producedAmount = Math.max(0, Math.floor(Number(resources[slot.resourceKey] || 0)));
      });
    }

    return {
      level,
      slots,
      resources,
      cooldowns: {
        assault: Math.max(0, Number(cooldownsRaw.assault || 0)),
        rapid: Math.max(0, Number(cooldownsRaw.rapid || 0)),
        breach: Math.max(0, Number(cooldownsRaw.breach || 0))
      },
      effects: {
        assaultUntil: Math.max(0, Number(effectsRaw.assaultUntil || 0)),
        rapidUntil: Math.max(0, Number(effectsRaw.rapidUntil || 0)),
        breachUntil: Math.max(0, Number(effectsRaw.breachUntil || 0))
      }
    };
  }

  function getFactoryStateByKey(instanceKey, now = Date.now()) {
    const current = factoryBuildingStore[instanceKey];
    const sanitized = sanitizeFactoryState(current, now);
    factoryBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistFactoryState(instanceKey, nextState) {
    factoryBuildingStore[instanceKey] = sanitizeFactoryState(nextState, Date.now());
    saveFactoryBuildingStore();
    return factoryBuildingStore[instanceKey];
  }

  function getFactoryPlayerSuppliesSnapshot() {
    factoryPlayerSupplies = createFactoryPlayerSupplyMap(factoryPlayerSupplies);
    return factoryPlayerSupplies;
  }

  function persistFactoryPlayerSuppliesSnapshot(nextState) {
    factoryPlayerSupplies = createFactoryPlayerSupplyMap(nextState);
    saveFactoryPlayerSupplies();
    return factoryPlayerSupplies;
  }

  function getFactoryUpgradeCost(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 2, FACTORY_CONFIG.maxLevel);
    const rawCost = 5000 * Math.pow(1.47, safeLevel - 2);
    return Math.max(1000, Math.round(rawCost / 100) * 100);
  }

  function getFactoryLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, FACTORY_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * FACTORY_CONFIG.upgradePctPerLevel;
  }

  function calculateFactoryProductionRates(levelMultiplier = 1) {
    const multiplier = Math.max(0, Number(levelMultiplier) || 0);
    return {
      metalPartsPerHour: FACTORY_CONFIG.baseProductionPerHour.metalParts * multiplier,
      techCorePerHour: FACTORY_CONFIG.baseProductionPerHour.techCore * multiplier,
      combatModulePerHour: ((60 * 60 * 1000) / FACTORY_CONFIG.combatModule.durationMs) * multiplier
    };
  }

  function syncFactoryProduction(instanceState, now = Date.now(), options = {}) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getFactoryLevelMultiplier(stateRef.level);
    const ownedFactoryCountRaw = Number(options?.ownedFactoryCount);
    const ownedFactoryCount = Number.isFinite(ownedFactoryCountRaw)
      ? Math.max(1, Math.floor(ownedFactoryCountRaw))
      : Math.max(1, collectOwnedFactoryEntries().length || 1);
    const networkBonusRaw = Number(options?.networkProductionBonusPct);
    const networkProductionBonusPct = Number.isFinite(networkBonusRaw)
      ? Math.max(0, networkBonusRaw)
      : Math.max(0, (ownedFactoryCount - 1) * 10);
    const totalProductionMultiplier = Math.max(
      0.1,
      levelMultiplier * (1 + networkProductionBonusPct / 100)
    );
    const factoryPenaltyPct = getGlobalPoliceRaidProductionPenaltyPct("factory", nowMs);
    const factoryPenaltyMultiplier = Math.max(0, 1 - factoryPenaltyPct / 100);
    const effectiveProductionMultiplier = totalProductionMultiplier * factoryPenaltyMultiplier;
    const rates = calculateFactoryProductionRates(effectiveProductionMultiplier);
    const produced = createFactoryResourceMap({}, false);
    const applyHeat = options?.applyHeat !== false;
    let heatAdded = 0;

    stateRef.resources = createFactoryResourceMap(stateRef.resources);
    const safeSlots = Array.isArray(stateRef.slots) && stateRef.slots.length
      ? stateRef.slots
      : createFactoryDefaultSlots(nowMs);
    const defaultSlots = createFactoryDefaultSlots(nowMs);
    stateRef.slots = safeSlots.map((rawSlot, index) =>
      sanitizeFactorySlot(rawSlot, defaultSlots[index], nowMs)
    );

    stateRef.slots.forEach((slot) => {
      let from = Number(slot.lastTick || nowMs);
      if (!Number.isFinite(from) || from > nowMs) {
        from = nowMs;
      }
      if (!slot.isProducing) {
        slot.lastTick = nowMs;
        return;
      }
      const elapsedMs = Math.max(0, nowMs - from);
      if (elapsedMs <= 0) {
        slot.lastTick = nowMs;
        return;
      }

      if (effectiveProductionMultiplier <= 0) {
        slot.lastTick = nowMs;
        return;
      }

      if (slot.mode === "craft" || slot.resourceKey === "combatModule") {
        const scaledDurationMs = Math.max(
          1,
          Math.round(FACTORY_CONFIG.combatModule.durationMs / effectiveProductionMultiplier)
        );
        const cycleRaw =
          elapsedMs / scaledDurationMs
          + Number(slot.productionRemainder || 0);
        const cycles = Math.max(0, Math.floor(cycleRaw));
        slot.productionRemainder = Math.max(0, cycleRaw - cycles);
        if (cycles > 0) {
          const maxFromMetal = Math.floor(
            Number(stateRef.resources.metalParts || 0) / FACTORY_CONFIG.combatModule.metalPartsCost
          );
          const maxFromTech = Math.floor(
            Number(stateRef.resources.techCore || 0) / FACTORY_CONFIG.combatModule.techCoreCost
          );
          const crafted = Math.max(0, Math.min(cycles, maxFromMetal, maxFromTech));
          if (crafted > 0) {
            const currentAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
            const slotSpace = Math.max(0, FACTORY_SLOT_STORAGE_CAP - currentAmount);
            const storable = Math.min(crafted, slotSpace);
            stateRef.resources.metalParts = Math.max(
              0,
              Math.floor(
                Number(stateRef.resources.metalParts || 0)
                - crafted * FACTORY_CONFIG.combatModule.metalPartsCost
              )
            );
            stateRef.resources.techCore = Math.max(
              0,
              Math.floor(
                Number(stateRef.resources.techCore || 0)
                - crafted * FACTORY_CONFIG.combatModule.techCoreCost
              )
            );
            stateRef.resources.combatModule = Math.max(
              0,
              Math.floor(Number(stateRef.resources.combatModule || 0) + crafted)
            );
            slot.producedAmount = Math.max(0, currentAmount + storable);
            produced.combatModule = Math.max(0, Math.floor(Number(produced.combatModule || 0) + crafted));
            heatAdded += crafted * FACTORY_CONFIG.combatModule.heatPerUnit;
          }
        }
      } else {
        const perHour = slot.resourceKey === "metalParts"
          ? rates.metalPartsPerHour
          : rates.techCorePerHour;
        const raw = (elapsedMs / 3600000) * Math.max(0, Number(perHour || 0)) + Number(slot.productionRemainder || 0);
        const gained = Math.max(0, Math.floor(raw));
        slot.productionRemainder = Math.max(0, raw - gained);
        if (gained > 0) {
          const currentAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
          const slotSpace = Math.max(0, FACTORY_SLOT_STORAGE_CAP - currentAmount);
          const storable = Math.min(gained, slotSpace);
          slot.producedAmount = Math.max(0, currentAmount + storable);
          stateRef.resources[slot.resourceKey] = Math.max(
            0,
            Math.floor(Number(stateRef.resources[slot.resourceKey] || 0) + gained)
          );
          produced[slot.resourceKey] = Math.max(
            0,
            Math.floor(Number(produced[slot.resourceKey] || 0) + gained)
          );
        }
      }
      slot.lastTick = nowMs;
    });

    const activeSlots = stateRef.slots.reduce((sum, slot) => sum + (slot.isProducing ? 1 : 0), 0);
    let nextHeat = null;
    if (applyHeat && heatAdded > 0) {
      nextHeat = addPlayerHeatFromBuilding(heatAdded);
    }

    return {
      rates,
      produced,
      levelMultiplier,
      totalProductionMultiplier: effectiveProductionMultiplier,
      ownedFactoryCount,
      networkProductionBonusPct,
      activeSlots,
      heatAdded,
      nextHeat
    };
  }

  function createArmoryWeaponMap(rawMap = {}, floorValues = true) {
    return ARMORY_WEAPON_KEYS.reduce((acc, key) => {
      const parsed = Number(rawMap?.[key] || 0);
      const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      acc[key] = floorValues ? Math.floor(safeValue) : safeValue;
      return acc;
    }, {});
  }

  function resolveArmoryCollectableWeapons(rawState) {
    const storedWeapons = createArmoryWeaponMap(rawState?.storedWeapons);
    const slotProducedWeapons = createArmoryWeaponMap();
    const safeSlots = Array.isArray(rawState?.slots) ? rawState.slots : [];

    safeSlots.forEach((rawSlot) => {
      const weaponKey = ARMORY_WEAPON_KEYS.includes(String(rawSlot?.weaponKey || "").trim())
        ? String(rawSlot.weaponKey).trim()
        : null;
      if (!weaponKey) return;
      slotProducedWeapons[weaponKey] += Math.max(0, Math.floor(Number(rawSlot?.producedAmount || 0)));
    });

    return ARMORY_WEAPON_KEYS.reduce((acc, weaponKey) => {
      acc[weaponKey] = Math.max(
        0,
        Math.floor(
          Math.max(
            Number(storedWeapons[weaponKey] || 0),
            Number(slotProducedWeapons[weaponKey] || 0)
          )
        )
      );
      return acc;
    }, createArmoryWeaponMap());
  }

  function createArmoryDefaultSlot(slotId, weaponKey, now = Date.now()) {
    const safeWeaponKey = String(weaponKey || "").trim();
    const config = ARMORY_CONFIG.weapons[safeWeaponKey] || null;
    const category = config?.category === "defense" ? "defense" : "attack";
    return {
      id: Math.max(1, Math.floor(Number(slotId) || 0)),
      weaponKey: safeWeaponKey,
      category,
      isProducing: false,
      producedAmount: 0,
      batchMaxUnits: 0,
      queuedUnits: 1,
      remainingUnits: 0,
      lastTick: now,
      productionRemainder: 0
    };
  }

  function sanitizeArmorySlot(rawSlot, fallbackSlot, now = Date.now()) {
    const id = Math.max(1, Math.floor(Number(rawSlot?.id ?? fallbackSlot?.id ?? 1) || 1));
    const expectedWeaponKey = String(fallbackSlot?.weaponKey || "").trim();
    const weaponKeyRaw = String(rawSlot?.weaponKey || expectedWeaponKey).trim();
    const weaponKey = ARMORY_WEAPON_KEYS.includes(weaponKeyRaw) ? weaponKeyRaw : expectedWeaponKey;
    const config = ARMORY_CONFIG.weapons[weaponKey] || null;
    const category = config?.category === "defense" ? "defense" : "attack";
    const producedAmountRaw = Number(rawSlot?.producedAmount || 0);
    const batchMaxUnitsRaw = Number(rawSlot?.batchMaxUnits || 0);
    const queuedUnitsRaw = Number(rawSlot?.queuedUnits || 1);
    const remainingUnitsRaw = Number(rawSlot?.remainingUnits || 0);
    const lastTickRaw = Number(rawSlot?.lastTick || now);
    const remainderRaw = Number(rawSlot?.productionRemainder || 0);
    return {
      id,
      weaponKey,
      category,
      isProducing: Boolean(rawSlot?.isProducing),
      producedAmount: Number.isFinite(producedAmountRaw) ? Math.max(0, Math.floor(producedAmountRaw)) : 0,
      batchMaxUnits: Number.isFinite(batchMaxUnitsRaw) ? clamp(Math.floor(batchMaxUnitsRaw), 0, ARMORY_BATCH_MAX_UNITS) : 0,
      queuedUnits: Number.isFinite(queuedUnitsRaw) ? clamp(Math.floor(queuedUnitsRaw), 1, ARMORY_BATCH_MAX_UNITS) : 1,
      remainingUnits: Number.isFinite(remainingUnitsRaw) ? Math.max(0, Math.floor(remainingUnitsRaw)) : 0,
      lastTick: Number.isFinite(lastTickRaw) ? Math.max(0, Math.floor(lastTickRaw)) : now,
      productionRemainder: Number.isFinite(remainderRaw) ? Math.max(0, remainderRaw) : 0
    };
  }

  function createArmoryDefaultSlots(now = Date.now()) {
    return ARMORY_SLOT_CONFIG.map((slot) => createArmoryDefaultSlot(slot.id, slot.weaponKey, now));
  }

  function createArmoryDefaultCooldownState() {
    return {
      attackBoost: 0,
      defenseBoost: 0
    };
  }

  function createArmoryDefaultEffectState() {
    return {
      attackBoostUntil: 0,
      defenseBoostUntil: 0
    };
  }

  function createArmoryDefaultState(now = Date.now()) {
    return {
      level: 1,
      slots: createArmoryDefaultSlots(now),
      storedWeapons: createArmoryWeaponMap(),
      cooldowns: createArmoryDefaultCooldownState(),
      effects: createArmoryDefaultEffectState(),
      boostHeatRemainder: 0,
      lastBoostHeatAt: now
    };
  }

  function sanitizeArmoryState(rawState, now = Date.now()) {
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, ARMORY_CONFIG.maxLevel)
      : 1;
    const slotsRaw = Array.isArray(rawState?.slots) ? rawState.slots : [];
    const fallbackSlots = createArmoryDefaultSlots(now);
    const slots = fallbackSlots.map((fallbackSlot, index) =>
      sanitizeArmorySlot(slotsRaw[index], fallbackSlot, now)
    );
    const storedWeapons = createArmoryWeaponMap(rawState?.storedWeapons || rawState?.resources || {});
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};
    const boostHeatRemainderRaw = Number(rawState?.boostHeatRemainder || 0);
    const lastBoostHeatAtRaw = Number(rawState?.lastBoostHeatAt || now);

    if (!slotsRaw.length && rawState?.storedWeapons && typeof rawState.storedWeapons === "object") {
      slots.forEach((slot) => {
        slot.producedAmount = Math.max(0, Math.floor(Number(storedWeapons[slot.weaponKey] || 0)));
      });
    }

    return {
      level,
      slots,
      storedWeapons,
      cooldowns: {
        attackBoost: Math.max(0, Number(cooldownsRaw.attackBoost || 0)),
        defenseBoost: Math.max(0, Number(cooldownsRaw.defenseBoost || 0))
      },
      effects: {
        attackBoostUntil: Math.max(0, Number(effectsRaw.attackBoostUntil || 0)),
        defenseBoostUntil: Math.max(0, Number(effectsRaw.defenseBoostUntil || 0))
      },
      boostHeatRemainder: Number.isFinite(boostHeatRemainderRaw) ? Math.max(0, boostHeatRemainderRaw) : 0,
      lastBoostHeatAt: Number.isFinite(lastBoostHeatAtRaw) ? Math.max(0, Math.floor(lastBoostHeatAtRaw)) : now
    };
  }

  function getArmoryStateByKey(instanceKey, now = Date.now()) {
    const current = armoryBuildingStore[instanceKey];
    const sanitized = sanitizeArmoryState(current, now);
    armoryBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistArmoryState(instanceKey, nextState) {
    armoryBuildingStore[instanceKey] = sanitizeArmoryState(nextState, Date.now());
    saveArmoryBuildingStore();
    return armoryBuildingStore[instanceKey];
  }

  function getArmoryUpgradeCost(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 2, ARMORY_CONFIG.maxLevel);
    const rawCost = 5000 * Math.pow(1.47, safeLevel - 2);
    return Math.max(1000, Math.round(rawCost / 100) * 100);
  }

  function getArmoryLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, ARMORY_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * ARMORY_CONFIG.upgradePctPerLevel;
  }

  function calculateArmoryProductionRates(levelMultiplier = 1, options = {}) {
    const multiplier = Math.max(0, Number(levelMultiplier) || 0);
    const attackMultiplier = Math.max(0, Number(options?.attackMultiplier) || 0);
    const defenseMultiplier = Math.max(0, Number(options?.defenseMultiplier) || 0);
    return ARMORY_WEAPON_KEYS.reduce((acc, key) => {
      const weapon = ARMORY_CONFIG.weapons[key];
      const basePerHour = 3600000 / Math.max(1, Number(weapon.durationMs || 1));
      const categoryMultiplier = weapon?.category === "defense" ? defenseMultiplier : attackMultiplier;
      acc[key] = basePerHour * multiplier * categoryMultiplier;
      return acc;
    }, {});
  }

  function getArmoryBoostSnapshot(armoryState, now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const effects = armoryState?.effects || {};
    const attackBoostActive = Number(effects.attackBoostUntil || 0) > nowMs;
    const defenseBoostActive = Number(effects.defenseBoostUntil || 0) > nowMs;
    const attackProductionMultiplier = attackBoostActive
      ? (1 + ARMORY_SPECIAL_ACTIONS.attackBoost.productionBoostPct / 100)
      : 1;
    const defenseProductionMultiplier = defenseBoostActive
      ? (1 + ARMORY_SPECIAL_ACTIONS.defenseBoost.productionBoostPct / 100)
      : 1;
    const passiveHeatPerHour =
      (attackBoostActive ? ARMORY_SPECIAL_ACTIONS.attackBoost.passiveHeatPerHour : 0)
      + (defenseBoostActive ? ARMORY_SPECIAL_ACTIONS.defenseBoost.passiveHeatPerHour : 0);
    const activeLabels = [];
    if (attackBoostActive) {
      activeLabels.push(`Attack gun boost +${ARMORY_SPECIAL_ACTIONS.attackBoost.productionBoostPct}%`);
    }
    if (defenseBoostActive) {
      activeLabels.push(`Defense gun boost +${ARMORY_SPECIAL_ACTIONS.defenseBoost.productionBoostPct}%`);
    }
    return {
      attackBoostActive,
      defenseBoostActive,
      attackProductionMultiplier,
      defenseProductionMultiplier,
      passiveHeatPerHour,
      activeLabels,
      activeCount: activeLabels.length
    };
  }

  function applyArmoryPassiveBoostHeat(armoryState, now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    let from = Number(armoryState?.lastBoostHeatAt || nowMs);
    if (!Number.isFinite(from) || from > nowMs) {
      from = nowMs;
    }
    let gained = 0;
    if (from < nowMs) {
      const effects = armoryState?.effects || {};
      const attackUntil = Math.max(0, Number(effects.attackBoostUntil || 0));
      const defenseUntil = Math.max(0, Number(effects.defenseBoostUntil || 0));
      const attackStart = Math.max(0, attackUntil - ARMORY_SPECIAL_ACTIONS.attackBoost.durationMs);
      const defenseStart = Math.max(0, defenseUntil - ARMORY_SPECIAL_ACTIONS.defenseBoost.durationMs);
      const attackOverlapMs = Math.max(0, Math.min(nowMs, attackUntil) - Math.max(from, attackStart));
      const defenseOverlapMs = Math.max(0, Math.min(nowMs, defenseUntil) - Math.max(from, defenseStart));
      const rawHeat =
        (attackOverlapMs / 3600000) * ARMORY_SPECIAL_ACTIONS.attackBoost.passiveHeatPerHour
        + (defenseOverlapMs / 3600000) * ARMORY_SPECIAL_ACTIONS.defenseBoost.passiveHeatPerHour
        + Math.max(0, Number(armoryState?.boostHeatRemainder || 0));
      gained = Math.max(0, Math.floor(rawHeat));
      armoryState.boostHeatRemainder = Math.max(0, rawHeat - gained);
    }
    armoryState.lastBoostHeatAt = nowMs;
    let nextHeat = null;
    if (gained > 0) {
      nextHeat = addPlayerHeatFromBuilding(gained);
    }
    return { gained, nextHeat };
  }

  function syncArmoryProduction(instanceState, now = Date.now(), options = {}) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getArmoryLevelMultiplier(stateRef.level);
    const ownedArmoryCountRaw = Number(options?.ownedArmoryCount);
    const ownedArmoryCount = Number.isFinite(ownedArmoryCountRaw)
      ? Math.max(1, Math.floor(ownedArmoryCountRaw))
      : Math.max(1, collectOwnedArmoryEntries().length || 1);
    const networkBonusRaw = Number(options?.networkProductionBonusPct);
    const networkProductionBonusPct = Number.isFinite(networkBonusRaw)
      ? Math.max(0, networkBonusRaw)
      : Math.max(0, (ownedArmoryCount - 1) * 10);
    const baseProductionMultiplier = Math.max(
      0.1,
      levelMultiplier * (1 + networkProductionBonusPct / 100)
    );
    const boostSnapshot = getArmoryBoostSnapshot(stateRef, nowMs);
    const armoryPenaltyPct = getGlobalPoliceRaidProductionPenaltyPct("armory", nowMs);
    const armoryPenaltyMultiplier = Math.max(0, 1 - armoryPenaltyPct / 100);
    const rates = calculateArmoryProductionRates(baseProductionMultiplier, {
      attackMultiplier: boostSnapshot.attackProductionMultiplier * armoryPenaltyMultiplier,
      defenseMultiplier: boostSnapshot.defenseProductionMultiplier * armoryPenaltyMultiplier
    });
    const produced = createArmoryWeaponMap({}, false);
    const applyHeat = options?.applyHeat !== false;
    let heatAdded = 0;

    stateRef.storedWeapons = createArmoryWeaponMap(stateRef.storedWeapons);
    const safeSlots = Array.isArray(stateRef.slots) && stateRef.slots.length
      ? stateRef.slots
      : createArmoryDefaultSlots(nowMs);
    const defaultSlots = createArmoryDefaultSlots(nowMs);
    stateRef.slots = safeSlots.map((rawSlot, index) =>
      sanitizeArmorySlot(rawSlot, defaultSlots[index], nowMs)
    );

    const factorySupplies = createFactoryPlayerSupplyMap(getFactoryPlayerSuppliesSnapshot());
    let factorySuppliesChanged = false;

    stateRef.slots.forEach((slot) => {
      let from = Number(slot.lastTick || nowMs);
      if (!Number.isFinite(from) || from > nowMs) {
        from = nowMs;
      }
      if (!slot.isProducing) {
        slot.lastTick = nowMs;
        return;
      }
      const elapsedMs = Math.max(0, nowMs - from);
      if (elapsedMs <= 0) {
        slot.lastTick = nowMs;
        return;
      }
      const weaponKey = ARMORY_WEAPON_KEYS.includes(slot.weaponKey) ? slot.weaponKey : null;
      const weapon = weaponKey ? ARMORY_CONFIG.weapons[weaponKey] : null;
      if (!weapon) {
        slot.lastTick = nowMs;
        slot.productionRemainder = 0;
        return;
      }

      const categoryProductionMultiplier = baseProductionMultiplier
        * (slot.category === "defense"
          ? boostSnapshot.defenseProductionMultiplier
          : boostSnapshot.attackProductionMultiplier)
        * armoryPenaltyMultiplier;
      if (categoryProductionMultiplier <= 0) {
        slot.lastTick = nowMs;
        return;
      }
      const scaledDurationMs = Math.max(1, Math.round(Number(weapon.durationMs || 1) / categoryProductionMultiplier));
      const rawCycles = (elapsedMs / scaledDurationMs) + Number(slot.productionRemainder || 0);
      const cycles = Math.max(0, Math.floor(rawCycles));
      slot.productionRemainder = Math.max(0, rawCycles - cycles);
      if (cycles > 0) {
        const queuedRemaining = Math.max(0, Math.floor(Number(slot.remainingUnits || 0)));
        const usesQueuedMode = queuedRemaining > 0;
        let crafted = 0;
        if (queuedRemaining > 0) {
          crafted = Math.max(0, Math.min(cycles, queuedRemaining));
          slot.remainingUnits = Math.max(0, queuedRemaining - crafted);
        } else {
          const metalCost = Math.max(0, Math.floor(Number(weapon.metalPartsCost || 0)));
          const techCost = Math.max(0, Math.floor(Number(weapon.techCoreCost || 0)));
          const maxFromMetal = metalCost > 0
            ? Math.floor(Number(factorySupplies.metalParts || 0) / metalCost)
            : cycles;
          const maxFromTech = techCost > 0
            ? Math.floor(Number(factorySupplies.techCore || 0) / techCost)
            : cycles;
          crafted = Math.max(0, Math.min(cycles, maxFromMetal, maxFromTech));
          if (crafted > 0) {
            if (metalCost > 0) {
              factorySupplies.metalParts = Math.max(
                0,
                Math.floor(Number(factorySupplies.metalParts || 0) - crafted * metalCost)
              );
            }
            if (techCost > 0) {
              factorySupplies.techCore = Math.max(
                0,
                Math.floor(Number(factorySupplies.techCore || 0) - crafted * techCost)
              );
            }
            factorySuppliesChanged = true;
          }
        }
        if (crafted > 0) {
          stateRef.storedWeapons[weaponKey] = Math.max(
            0,
            Math.floor(Number(stateRef.storedWeapons[weaponKey] || 0) + crafted)
          );
          slot.producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0) + crafted));
          produced[weaponKey] = Math.max(0, Math.floor(Number(produced[weaponKey] || 0) + crafted));
          heatAdded += crafted * Math.max(0, Math.floor(Number(weapon.heatPerUnit || 0)));
        }
        if (usesQueuedMode && Number(slot.remainingUnits || 0) <= 0) {
          slot.isProducing = false;
          slot.productionRemainder = 0;
        }
      }
      const batchMaxUnits = Math.max(0, Math.floor(Number(slot.batchMaxUnits || 0)));
      const producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
      if (batchMaxUnits > 0 && producedAmount > batchMaxUnits) {
        slot.producedAmount = batchMaxUnits;
      }
      slot.lastTick = nowMs;
    });

    if (factorySuppliesChanged) {
      persistFactoryPlayerSuppliesSnapshot(factorySupplies);
    }

    const activeSlots = stateRef.slots.reduce((sum, slot) => sum + (slot.isProducing ? 1 : 0), 0);
    let nextHeat = null;
    if (applyHeat && heatAdded > 0) {
      nextHeat = addPlayerHeatFromBuilding(heatAdded);
    }

    return {
      rates,
      produced,
      levelMultiplier,
      totalProductionMultiplier: baseProductionMultiplier,
      ownedArmoryCount,
      networkProductionBonusPct,
      activeSlots,
      heatAdded,
      nextHeat,
      factorySupplies: createFactoryPlayerSupplyMap(factorySupplies),
      boostSnapshot
    };
  }

  function createDrugLabAmountMap(rawMap = {}) {
    return DRUG_LAB_DRUG_KEYS.reduce((acc, key) => {
      const value = Number(rawMap?.[key] || 0);
      acc[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
  }

  function createDrugLabSupplyMap(rawMap = {}) {
    return DRUG_LAB_SUPPLY_KEYS.reduce((acc, key) => {
      const value = Number(rawMap?.[key] || 0);
      acc[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return acc;
    }, {});
  }

  function createDefaultDrugLabEffectState() {
    return { active: false, endsAt: 0, potencyMultiplier: 1 };
  }

  function createDefaultDrugLabActiveEffects() {
    return {
      neonDust: createDefaultDrugLabEffectState(),
      pulseShot: createDefaultDrugLabEffectState(),
      velvetSmoke: createDefaultDrugLabEffectState(),
      ghostSerum: createDefaultDrugLabEffectState(),
      overdriveX: createDefaultDrugLabEffectState(),
      overdriveCrash: createDefaultDrugLabEffectState()
    };
  }

  function sanitizeDrugLabEffectState(raw) {
    const active = Boolean(raw?.active);
    const endsAtRaw = Number(raw?.endsAt || 0);
    const potencyRaw = Number(raw?.potencyMultiplier || 1);
    return {
      active,
      endsAt: Number.isFinite(endsAtRaw) ? Math.max(0, Math.floor(endsAtRaw)) : 0,
      potencyMultiplier: Number.isFinite(potencyRaw) ? Math.max(1, potencyRaw) : 1
    };
  }

  function sanitizeDrugLabEventLogEntry(rawEntry) {
    const text = String(rawEntry?.text || "").trim();
    if (!text) return null;
    const createdAt = Math.max(0, Math.floor(Number(rawEntry?.createdAt) || Date.now()));
    const id = String(rawEntry?.id || `${createdAt}-${Math.floor(Math.random() * 1000000)}`);
    return { id, text, createdAt };
  }

  function createDrugLabDefaultSlot(slotId, now = Date.now()) {
    return {
      id: slotId,
      activeDrugType: "neonDust",
      isProducing: false,
      queuedUnits: 1,
      queueRemaining: 0,
      producedAmount: 0,
      lastTick: now,
      startedAt: 0,
      productionRemainder: 0
    };
  }

  function sanitizeDrugLabSlot(rawSlot, slotId, now = Date.now()) {
    const activeDrugTypeRaw = String(rawSlot?.activeDrugType || "").trim();
    const activeDrugType = DRUG_CONFIG[activeDrugTypeRaw] ? activeDrugTypeRaw : "neonDust";
    const producedAmountRaw = Number(rawSlot?.producedAmount || 0);
    const queuedUnitsRaw = Number(rawSlot?.queuedUnits ?? (rawSlot?.isProducing ? 0 : 1));
    const queueRemainingRaw = Number(rawSlot?.queueRemaining || 0);
    const lastTickRaw = Number(rawSlot?.lastTick || now);
    const startedAtRaw = Number(rawSlot?.startedAt || 0);
    const remainderRaw = Number(rawSlot?.productionRemainder || 0);
    const isProducing = Boolean(rawSlot?.isProducing);
    return {
      id: slotId,
      activeDrugType,
      isProducing,
      queuedUnits: Number.isFinite(queuedUnitsRaw)
        ? clamp(Math.floor(queuedUnitsRaw), isProducing ? 0 : 1, 999)
        : (isProducing ? 0 : 1),
      queueRemaining: Number.isFinite(queueRemainingRaw) ? Math.max(0, Math.floor(queueRemainingRaw)) : 0,
      producedAmount: Number.isFinite(producedAmountRaw) ? Math.max(0, Math.floor(producedAmountRaw)) : 0,
      lastTick: Number.isFinite(lastTickRaw) ? Math.max(0, Math.floor(lastTickRaw)) : now,
      startedAt: Number.isFinite(startedAtRaw) ? Math.max(0, Math.floor(startedAtRaw)) : 0,
      productionRemainder: Number.isFinite(remainderRaw) ? Math.max(0, remainderRaw) : 0
    };
  }

  function createDrugLabDefaultState(now = Date.now()) {
    return {
      level: 1,
      slots: Array.from({ length: DRUG_LAB_CONFIG.maxSlots }, (_, index) => createDrugLabDefaultSlot(index + 1, now)),
      storage: createDrugLabAmountMap(),
      storageEnhanced: createDrugLabAmountMap(),
      heatRemainder: 0,
      incomeRemainderClean: 0,
      incomeRemainderDirty: 0,
      lastHeatAt: now,
      lastIncomeAt: now,
      cooldowns: {
        overclock: 0,
        cleanBatch: 0,
        hiddenOperation: 0
      },
      effects: {
        overclockUntil: 0,
        cleanBatchUntil: 0,
        hiddenOperationUntil: 0
      }
    };
  }

  function sanitizeDrugLabState(rawState, now = Date.now()) {
    const fallback = createDrugLabDefaultState(now);
    const levelRaw = Number(rawState?.level);
    const level = Number.isFinite(levelRaw)
      ? clamp(Math.floor(levelRaw), 1, DRUG_LAB_CONFIG.maxLevel)
      : 1;

    const slotsRaw = Array.isArray(rawState?.slots) ? rawState.slots : [];
    const slots = Array.from({ length: DRUG_LAB_CONFIG.maxSlots }, (_, index) =>
      sanitizeDrugLabSlot(slotsRaw[index], index + 1, now)
    );

    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};
    const heatRemainderRaw = Number(rawState?.heatRemainder || 0);
    const incomeRemainderCleanRaw = Number(rawState?.incomeRemainderClean || 0);
    const incomeRemainderDirtyRaw = Number(rawState?.incomeRemainderDirty || 0);
    const lastHeatAtRaw = Number(rawState?.lastHeatAt || now);
    const lastIncomeAtRaw = Number(rawState?.lastIncomeAt || now);

    return {
      level,
      slots,
      storage: createDrugLabAmountMap(rawState?.storage),
      storageEnhanced: createDrugLabAmountMap(rawState?.storageEnhanced),
      heatRemainder: Number.isFinite(heatRemainderRaw) ? Math.max(0, heatRemainderRaw) : 0,
      incomeRemainderClean: Number.isFinite(incomeRemainderCleanRaw) ? Math.max(0, incomeRemainderCleanRaw) : 0,
      incomeRemainderDirty: Number.isFinite(incomeRemainderDirtyRaw) ? Math.max(0, incomeRemainderDirtyRaw) : 0,
      lastHeatAt: Number.isFinite(lastHeatAtRaw) ? Math.max(0, Math.floor(lastHeatAtRaw)) : fallback.lastHeatAt,
      lastIncomeAt: Number.isFinite(lastIncomeAtRaw) ? Math.max(0, Math.floor(lastIncomeAtRaw)) : fallback.lastIncomeAt,
      cooldowns: {
        overclock: Math.max(0, Number(cooldownsRaw.overclock || 0)),
        cleanBatch: Math.max(0, Number(cooldownsRaw.cleanBatch || 0)),
        hiddenOperation: Math.max(0, Number(cooldownsRaw.hiddenOperation || 0))
      },
      effects: {
        overclockUntil: Math.max(0, Number(effectsRaw.overclockUntil || 0)),
        cleanBatchUntil: Math.max(0, Number(effectsRaw.cleanBatchUntil || 0)),
        hiddenOperationUntil: Math.max(0, Number(effectsRaw.hiddenOperationUntil || 0))
      }
    };
  }

  function createDrugLabPlayerDefaultState(now = Date.now()) {
    return {
      totalHeat: 0,
      hasWarehouse: false,
      activeDrugEffects: createDefaultDrugLabActiveEffects(),
      enhancedDrugs: createDrugLabAmountMap(),
      labSupplies: createDrugLabSupplyMap(),
      eventLog: [],
      lastUpdatedAt: now
    };
  }

  function sanitizeDrugLabPlayerState(rawState, now = Date.now()) {
    const fallback = createDrugLabPlayerDefaultState(now);
    const effectsRaw = rawState?.activeDrugEffects || {};
    const activeDrugEffects = createDefaultDrugLabActiveEffects();
    Object.keys(activeDrugEffects).forEach((key) => {
      activeDrugEffects[key] = sanitizeDrugLabEffectState(effectsRaw[key]);
    });
    const rawLog = Array.isArray(rawState?.eventLog) ? rawState.eventLog : [];
    const eventLog = rawLog
      .map((entry) => sanitizeDrugLabEventLogEntry(entry))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, DRUG_LAB_EVENT_LOG_LIMIT);
    const totalHeatRaw = Number(rawState?.totalHeat || 0);
    const lastUpdatedAtRaw = Number(rawState?.lastUpdatedAt || now);

    return {
      totalHeat: Number.isFinite(totalHeatRaw) ? Math.max(0, Math.floor(totalHeatRaw)) : 0,
      hasWarehouse: Boolean(rawState?.hasWarehouse),
      activeDrugEffects,
      enhancedDrugs: createDrugLabAmountMap(rawState?.enhancedDrugs),
      labSupplies: createDrugLabSupplyMap(rawState?.labSupplies || rawState?.pharmacyResources || {}),
      eventLog,
      lastUpdatedAt: Number.isFinite(lastUpdatedAtRaw) ? Math.max(0, Math.floor(lastUpdatedAtRaw)) : fallback.lastUpdatedAt
    };
  }

  function getDrugLabStateByKey(instanceKey, now = Date.now()) {
    const current = drugLabBuildingStore[instanceKey];
    const sanitized = sanitizeDrugLabState(current, now);
    drugLabBuildingStore[instanceKey] = sanitized;
    return sanitized;
  }

  function persistDrugLabState(instanceKey, nextState) {
    drugLabBuildingStore[instanceKey] = sanitizeDrugLabState(nextState, Date.now());
    saveDrugLabBuildingStore();
    return drugLabBuildingStore[instanceKey];
  }

  function getDrugLabPlayerSnapshot(now = Date.now()) {
    drugLabPlayerState = sanitizeDrugLabPlayerState(drugLabPlayerState, now);
    return drugLabPlayerState;
  }

  function persistDrugLabPlayerSnapshot(nextState) {
    drugLabPlayerState = sanitizeDrugLabPlayerState(nextState, Date.now());
    saveDrugLabPlayerState();
    return drugLabPlayerState;
  }

  function isWarehouseBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "sklad" || normalized === "warehouse";
  }

  function getOwnedWarehouseCountForDrugLab() {
    const districts = Array.isArray(state.districts) ? state.districts : [];
    let total = 0;
    districts.forEach((district) => {
      if (!isDistrictOwnedByPlayer(district)) return;
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      buildings.forEach((building) => {
        if (isWarehouseBaseName(building)) {
          total += 1;
        }
      });
    });
    return Math.max(0, total);
  }

  const FACTORY_CASH_RATES = Object.freeze({
    hourlyCleanIncome: 0,
    hourlyDirtyIncome: 0
  });
  const ARMORY_CASH_RATES = Object.freeze({
    hourlyCleanIncome: 0,
    hourlyDirtyIncome: 0
  });
  const SIMPLE_BUILDING_CASH_RATES = Object.freeze({
    "Brainwash centrum": Object.freeze({
      hourlyCleanIncome: 480,
      hourlyDirtyIncome: 90
    }),
    "Magistrát": Object.freeze({
      hourlyCleanIncome: 1500,
      hourlyDirtyIncome: 360
    }),
    "Burza": Object.freeze({
      hourlyCleanIncome: 1080,
      hourlyDirtyIncome: 60
    }),
    "Centrální banka": Object.freeze({
      hourlyCleanIncome: 1560,
      hourlyDirtyIncome: 60
    }),
    "Letiště": Object.freeze({
      hourlyCleanIncome: 1140,
      hourlyDirtyIncome: 60
    }),
    "Lobby klub": Object.freeze({
      hourlyCleanIncome: 180,
      hourlyDirtyIncome: 1320
    }),
    "VIP salonek": Object.freeze({
      hourlyCleanIncome: 480,
      hourlyDirtyIncome: 1320
    }),
    "Parlament": Object.freeze({
      hourlyCleanIncome: 1320,
      hourlyDirtyIncome: 180
    }),
    "Přístav": Object.freeze({
      hourlyCleanIncome: 1560,
      hourlyDirtyIncome: 510
    }),
    "Soud": Object.freeze({
      hourlyCleanIncome: 1200,
      hourlyDirtyIncome: 600
    }),
    "Pašovací tunel": Object.freeze({
      hourlyCleanIncome: 12,
      hourlyDirtyIncome: 180
    }),
    "Pouliční dealeři": Object.freeze({
      hourlyCleanIncome: 6,
      hourlyDirtyIncome: 270
    }),
    "Strip club": Object.freeze({
      hourlyCleanIncome: 480,
      hourlyDirtyIncome: 120
    }),
    Garage: Object.freeze({
      hourlyCleanIncome: 180,
      hourlyDirtyIncome: 30
    }),
    "Taxi služba": Object.freeze({
      hourlyCleanIncome: 330,
      hourlyDirtyIncome: 90
    }),
    Klinika: Object.freeze({
      hourlyCleanIncome: 150,
      hourlyDirtyIncome: 18
    }),
    "Rekrutační centrum": Object.freeze({
      hourlyCleanIncome: 120,
      hourlyDirtyIncome: 18
    }),
    "Datové centrum": Object.freeze({
      hourlyCleanIncome: 300,
      hourlyDirtyIncome: 24
    }),
    "Energetická stanice": Object.freeze({
      hourlyCleanIncome: 240,
      hourlyDirtyIncome: 18
    }),
    "Sklad": Object.freeze({
      hourlyCleanIncome: 120,
      hourlyDirtyIncome: 12
    }),
    "Kancelářský blok": Object.freeze({
      hourlyCleanIncome: 360,
      hourlyDirtyIncome: 60
    }),
    "Obchodní centrum": Object.freeze({
      hourlyCleanIncome: 480,
      hourlyDirtyIncome: 60
    })
  });
  const CONFIGURED_BUILDING_CASH_RATES = Object.freeze({
    ...SIMPLE_BUILDING_CASH_RATES,
    [APARTMENT_BLOCK_NAME]: Object.freeze({
      hourlyCleanIncome: 90,
      hourlyDirtyIncome: 30
    }),
    [SCHOOL_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 264,
      hourlyDirtyIncome: 60
    }),
    [FITNESS_CLUB_NAME]: Object.freeze({
      hourlyCleanIncome: 360,
      hourlyDirtyIncome: 30
    }),
    [CASINO_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 480,
      hourlyDirtyIncome: 132
    }),
    [ARCADE_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 360,
      hourlyDirtyIncome: 72
    }),
    [AUTO_SALON_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 300,
      hourlyDirtyIncome: 60
    }),
    [EXCHANGE_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 330,
      hourlyDirtyIncome: 78
    }),
    [RESTAURANT_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 300,
      hourlyDirtyIncome: 30
    }),
    [CONVENIENCE_STORE_BUILDING_NAME]: Object.freeze({
      hourlyCleanIncome: 210,
      hourlyDirtyIncome: 78
    })
  });

  function getDrugLabStorageCapacityMultiplier() {
    const warehouseCount = getOwnedWarehouseCountForDrugLab();
    if (warehouseCount <= 0) return 1;
    return Math.pow(1 + DRUG_LAB_CONFIG.storageBonusPerWarehousePct / 100, warehouseCount);
  }

  function getDrugLabStorageCapacityBonusPct() {
    return Math.max(0, (getDrugLabStorageCapacityMultiplier() - 1) * 100);
  }

  function getSafeDrugLabEconomySnapshot() {
    const getSnapshot = window.Empire.UI?.getEconomySnapshot;
    if (typeof getSnapshot === "function") {
      return getSnapshot();
    }
    return {
      cleanMoney: 0,
      dirtyMoney: 0,
      influence: 0,
      drugs: 0,
      drugInventory: createDrugLabAmountMap(),
      activeDrugs: {}
    };
  }

  function normalizeDrugLabInventoryFromEconomy(economy) {
    return createDrugLabAmountMap(economy?.drugInventory || economy || {});
  }

  function mapDrugLabEffectsToUiPayload(activeDrugEffects, now = Date.now()) {
    const safeEffects = activeDrugEffects && typeof activeDrugEffects === "object"
      ? activeDrugEffects
      : createDefaultDrugLabActiveEffects();
    return DRUG_LAB_DRUG_KEYS.reduce((acc, key) => {
      const stateRef = sanitizeDrugLabEffectState(safeEffects[key]);
      const remainingSeconds = stateRef.active
        ? Math.max(0, Math.ceil((Number(stateRef.endsAt || 0) - now) / 1000))
        : 0;
      acc[key] = { active: stateRef.active && remainingSeconds > 0, remainingSeconds };
      return acc;
    }, {});
  }

  function applyDrugLabEconomySnapshot(economy, inventory, playerState, now = Date.now()) {
    const safeEconomy = economy && typeof economy === "object" ? { ...economy } : {};
    const safeInventory = createDrugLabAmountMap(inventory);
    const totalDrugs = DRUG_LAB_DRUG_KEYS.reduce((sum, key) => sum + Number(safeInventory[key] || 0), 0);
    safeEconomy.drugInventory = {
      ...(safeEconomy.drugInventory && typeof safeEconomy.drugInventory === "object" ? safeEconomy.drugInventory : {}),
      ...safeInventory
    };
    safeEconomy.drugs = totalDrugs;
    safeEconomy.activeDrugs = mapDrugLabEffectsToUiPayload(playerState?.activeDrugEffects, now);
    const updateEconomy = window.Empire.UI?.updateEconomy;
    if (typeof updateEconomy === "function") {
      updateEconomy(safeEconomy);
    }
    return safeEconomy;
  }

  function resolveDrugLabSchoolBoostPct(instanceKey, now = Date.now()) {
    const districtPart = String(instanceKey || "").split(":")[0] || "";
    if (!districtPart) {
      return { passivePct: 0, chemistryPct: 0, totalPct: 0 };
    }
    let passivePct = 0;
    let chemistryPct = 0;
    Object.entries(schoolBuildingStore || {}).forEach(([key, rawState]) => {
      const keyDistrictPart = String(key || "").split(":")[0] || "";
      if (keyDistrictPart !== districtPart) return;
      const snapshot = sanitizeSchoolState(rawState, now);
      const levelMultiplier = getSchoolLevelMultiplier(snapshot.level);
      passivePct += SCHOOL_BUILDING_CONFIG.baseDrugLabPassiveBonusPct * levelMultiplier;
      if (now < Number(snapshot.effects.chemistryUntil || 0)) {
        chemistryPct += SCHOOL_BUILDING_CONFIG.chemistryBoostPct;
      }
    });
    const totalPct = Math.max(0, passivePct + chemistryPct);
    return { passivePct: Math.max(0, passivePct), chemistryPct: Math.max(0, chemistryPct), totalPct };
  }

  function getDrugLabEffectLabel(drugType) {
    if (drugType === "neonDust") return "Neon Dust";
    if (drugType === "pulseShot") return "Pulse Shot";
    if (drugType === "velvetSmoke") return "Velvet Smoke";
    if (drugType === "ghostSerum") return "Ghost Serum";
    if (drugType === "overdriveX") return "Overdrive X";
    if (drugType === "overdriveCrash") return "Overdrive Crash";
    return drugType;
  }

  function pushDrugLabLog(playerState, text, now = Date.now(), options = {}) {
    const entry = sanitizeDrugLabEventLogEntry({
      id: `${now}-${Math.floor(Math.random() * 1000000)}`,
      text,
      createdAt: now
    });
    if (!entry) return null;
    const existing = Array.isArray(playerState?.eventLog) ? playerState.eventLog : [];
    existing.unshift(entry);
    playerState.eventLog = existing
      .map((item) => sanitizeDrugLabEventLogEntry(item))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, DRUG_LAB_EVENT_LOG_LIMIT);
    if (!options?.silentUiEvent) {
      window.Empire.UI?.pushEvent?.(`Drug Lab: ${text}`);
    }
    return entry;
  }

  class DrugLabCore {
    constructor({ instanceKey, district, buildingState, playerState, inventory }) {
      this.instanceKey = instanceKey;
      this.district = district || null;
      this.building = buildingState;
      this.player = playerState;
      this.inventory = inventory;
    }

    getScaledStat(baseValue, level = this.building.level) {
      const safeBase = Number(baseValue || 0);
      const safeLevel = clamp(Math.floor(Number(level) || 1), 1, DRUG_LAB_CONFIG.maxLevel);
      return safeBase * (1 + (safeLevel - 1) * DRUG_LAB_CONFIG.upgradePctPerLevel);
    }

    getUnlockedSlotCount() {
      return clamp(Math.floor(Number(this.building.level) || 1), 1, DRUG_LAB_CONFIG.maxSlots);
    }

    getStorageCapacity() {
      return Math.max(1, Math.floor(DRUG_LAB_CONFIG.baseStorageCapacity * getDrugLabStorageCapacityMultiplier()));
    }

    getCurrentStoredTotal() {
      const normalTotal = DRUG_LAB_DRUG_KEYS.reduce((sum, key) => sum + Number(this.building.storage[key] || 0), 0);
      const enhancedTotal = DRUG_LAB_DRUG_KEYS.reduce(
        (sum, key) => sum + Number(this.building.storageEnhanced[key] || 0),
        0
      );
      return Math.max(0, Math.floor(normalTotal + enhancedTotal));
    }

    canStoreMore(amount) {
      const requested = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
      return this.getCurrentStoredTotal() + requested <= this.getStorageCapacity();
    }

    getSlotById(slotId) {
      const safeId = Math.max(1, Math.floor(Number(slotId) || 0));
      return this.building.slots.find((slot) => Number(slot.id) === safeId) || null;
    }

    isOverclockActive(now = Date.now()) {
      return now < Number(this.building.effects.overclockUntil || 0);
    }

    isCleanBatchActive(now = Date.now()) {
      return now < Number(this.building.effects.cleanBatchUntil || 0);
    }

    isHiddenOperationActive(now = Date.now()) {
      return now < Number(this.building.effects.hiddenOperationUntil || 0);
    }

    getSchoolProductionBoostPct(now = Date.now()) {
      return resolveDrugLabSchoolBoostPct(this.instanceKey, now).totalPct;
    }

    getProductionMultiplier(now = Date.now()) {
      let multiplier = this.getScaledStat(1, this.building.level);
      const schoolBoostPct = this.getSchoolProductionBoostPct(now);
      if (schoolBoostPct > 0) {
        multiplier *= 1 + schoolBoostPct / 100;
      }
      const networkBonusPct = getOwnedDrugLabNetworkProductionBonusPct();
      if (networkBonusPct > 0) {
        multiplier *= 1 + networkBonusPct / 100;
      }
      if (this.isOverclockActive(now)) {
        multiplier *= 1 + DRUG_LAB_CONFIG.specialActions.overclock.productionBoostPct / 100;
      }
      if (this.isHiddenOperationActive(now)) {
        multiplier *= 1 - DRUG_LAB_CONFIG.specialActions.hiddenOperation.productionPenaltyPct / 100;
      }
      if (this.player.activeDrugEffects.pulseShot.active && now < Number(this.player.activeDrugEffects.pulseShot.endsAt || 0)) {
        multiplier *= 1 + DRUG_LAB_CONFIG.pulseShotProductionBoostPct / 100;
      }
      if (
        this.player.activeDrugEffects.overdriveCrash.active
        && now < Number(this.player.activeDrugEffects.overdriveCrash.endsAt || 0)
      ) {
        multiplier *= 1 - DRUG_LAB_CONFIG.overdriveCrashPenaltyPct / 100;
      }
      const policePenaltyPct = getGlobalPoliceRaidProductionPenaltyPct("lab", now);
      if (policePenaltyPct > 0) {
        multiplier *= 1 - policePenaltyPct / 100;
      }
      return Math.max(0, multiplier);
    }

    getHeatMultiplier(now = Date.now()) {
      let multiplier = 1;
      if (this.isHiddenOperationActive(now)) {
        multiplier *= 1 - DRUG_LAB_CONFIG.specialActions.hiddenOperation.heatReductionPct / 100;
      }
      if (
        this.player.activeDrugEffects.ghostSerum.active
        && now < Number(this.player.activeDrugEffects.ghostSerum.endsAt || 0)
      ) {
        multiplier *= 1 - DRUG_LAB_CONFIG.ghostSerumHeatReductionPct / 100;
      }
      return Math.max(0, multiplier);
    }

    startProduction(slotId, drugType, now = Date.now(), units = 1) {
      const slot = this.getSlotById(slotId);
      if (!slot) {
        return { ok: false, message: "Slot neexistuje." };
      }
      if (Number(slot.id) > this.getUnlockedSlotCount()) {
        return { ok: false, message: "Slot je zatím zamčený." };
      }
      const safeDrugType = String(drugType || slot.activeDrugType || "").trim();
      if (!DRUG_CONFIG[safeDrugType]) {
        return { ok: false, message: "Vyber drogu pro produkci." };
      }
      const safeUnits = clamp(
        Math.floor(Number(units) || Number(slot.queuedUnits) || (slot.isProducing ? 0 : 1)),
        slot.isProducing ? 0 : 1,
        999
      );
      if (slot.isProducing && Math.max(0, Math.floor(Number(slot.queueRemaining || 0))) > 0) {
        if (String(slot.activeDrugType || "").trim() !== safeDrugType) {
          return { ok: false, message: `Slot ${slot.id}: při běžící výrobě nelze změnit látku.` };
        }
        if (safeUnits <= 0) {
          return { ok: false, message: `Slot ${slot.id}: nastav počet dávek pro přidání.` };
        }
        slot.queuedUnits = 0;
        slot.queueRemaining = Math.max(0, Math.floor(Number(slot.queueRemaining || 0))) + safeUnits;
        slot.lastTick = now;
        return { ok: true, message: `Slot ${slot.id}: do fronty přidáno ${safeUnits} dávek.`, silentUiEvent: true };
      }
      slot.activeDrugType = safeDrugType;
      slot.queuedUnits = 0;
      slot.queueRemaining = safeUnits;
      slot.isProducing = true;
      slot.startedAt = slot.startedAt > 0 ? slot.startedAt : now;
      slot.lastTick = now;
      return { ok: true, message: `Slot ${slot.id}: produkce ${DRUG_CONFIG[safeDrugType].name} spuštěna (${safeUnits}x).` };
    }

    stopProduction(slotId, now = Date.now()) {
      const slot = this.getSlotById(slotId);
      if (!slot) {
        return { ok: false, message: "Slot neexistuje." };
      }
      if (!slot.isProducing) {
        return { ok: false, message: `Slot ${slot.id}: produkce neběží.` };
      }
      slot.isProducing = false;
      slot.queueRemaining = 0;
      slot.lastTick = now;
      return { ok: true, message: `Slot ${slot.id}: produkce zastavena.` };
    }

    updateProduction(now = Date.now()) {
      const unlockedSlots = this.getUnlockedSlotCount();
      const storageCapacity = this.getStorageCapacity();
      const productionMultiplier = this.getProductionMultiplier(now);
      const producedByDrug = createDrugLabAmountMap();

      this.building.slots.forEach((slot) => {
        if (Number(slot.id) > unlockedSlots) {
          slot.isProducing = false;
          slot.lastTick = now;
          slot.productionRemainder = 0;
          return;
        }
        if (!slot.isProducing) {
          slot.lastTick = now;
          return;
        }
        const drug = DRUG_CONFIG[slot.activeDrugType];
        if (!drug) {
          slot.isProducing = false;
          slot.lastTick = now;
          slot.productionRemainder = 0;
          return;
        }
        const previousTick = Number(slot.lastTick || now);
        const elapsedMs = Math.max(0, now - previousTick);
        if (elapsedMs <= 0) {
          slot.lastTick = now;
          return;
        }

        const totalStored = this.getCurrentStoredTotal();
        if (totalStored >= storageCapacity) {
          slot.lastTick = now;
          slot.productionRemainder = 0;
          return;
        }

        const hoursElapsed = elapsedMs / 3600000;
        const productionPerHour = drug.productionPerHour * productionMultiplier;
        const rawProduced = hoursElapsed * productionPerHour + Number(slot.productionRemainder || 0);
        const producedWhole = Math.max(0, Math.floor(rawProduced));
        slot.productionRemainder = Math.max(0, rawProduced - producedWhole);

        if (producedWhole > 0) {
          const queuedRemaining = Math.max(0, Math.floor(Number(slot.queueRemaining || 0)));
          const freeSpace = Math.max(0, storageCapacity - this.getCurrentStoredTotal());
          const storable = Math.max(
            0,
            Math.min(producedWhole, freeSpace, queuedRemaining > 0 ? queuedRemaining : producedWhole)
          );
          if (storable > 0) {
            const targetStorage = this.isCleanBatchActive(now) ? this.building.storageEnhanced : this.building.storage;
            targetStorage[drug.id] = Math.max(0, Number(targetStorage[drug.id] || 0) + storable);
            slot.producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0) + storable));
            producedByDrug[drug.id] += storable;
            if (queuedRemaining > 0) {
              slot.queueRemaining = Math.max(0, queuedRemaining - storable);
              if (slot.queueRemaining <= 0) {
                slot.isProducing = false;
                slot.productionRemainder = 0;
              }
            }
          }
          if (storable < producedWhole && this.getCurrentStoredTotal() >= storageCapacity) {
            slot.productionRemainder = 0;
          }
        }

        slot.lastTick = now;
      });

      return producedByDrug;
    }

    collectDrugs() {
      const collected = createDrugLabAmountMap();
      const collectedEnhanced = createDrugLabAmountMap();
      let total = 0;

      DRUG_LAB_DRUG_KEYS.forEach((key) => {
        const normalAmount = Math.max(0, Math.floor(Number(this.building.storage[key] || 0)));
        const enhancedAmount = Math.max(0, Math.floor(Number(this.building.storageEnhanced[key] || 0)));
        const fullAmount = normalAmount + enhancedAmount;
        this.building.storage[key] = 0;
        this.building.storageEnhanced[key] = 0;
        collected[key] = fullAmount;
        collectedEnhanced[key] = enhancedAmount;
        total += fullAmount;
      });

      return { total, collected, collectedEnhanced };
    }

    applyDrugEffect(drugType, now = Date.now(), potencyMultiplier = 1) {
      if (!DRUG_CONFIG[drugType]) {
        return { ok: false, message: "Neznámý efekt drogy." };
      }
      const stateRef = sanitizeDrugLabEffectState(this.player.activeDrugEffects[drugType] || {});
      stateRef.active = true;
      stateRef.endsAt = now + DRUG_CONFIG[drugType].effectDurationMs;
      stateRef.potencyMultiplier = Math.max(1, Number(potencyMultiplier) || 1);
      this.player.activeDrugEffects[drugType] = stateRef;
      return {
        ok: true,
        message: `${DRUG_CONFIG[drugType].name} aktivován na ${formatDurationLabel(DRUG_CONFIG[drugType].effectDurationMs)}.`
      };
    }

    useDrug(drugType, now = Date.now()) {
      const drug = DRUG_CONFIG[drugType];
      if (!drug) {
        return { ok: false, message: "Neznámá droga." };
      }
      const available = Math.max(0, Math.floor(Number(this.inventory[drugType] || 0)));
      if (available < drug.useAmount) {
        return { ok: false, message: `${drug.name}: nedostatek kusů (${available}/${drug.useAmount}).` };
      }

      const enhancedAvailable = Math.max(0, Math.floor(Number(this.player.enhancedDrugs[drugType] || 0)));
      const enhancedUsed = Math.min(drug.useAmount, enhancedAvailable);
      const potencyMultiplier = enhancedUsed > 0
        ? 1 + DRUG_LAB_CONFIG.specialActions.cleanBatch.effectBoostPct / 100
        : 1;

      this.inventory[drugType] = Math.max(0, available - drug.useAmount);
      this.player.enhancedDrugs[drugType] = Math.max(0, enhancedAvailable - enhancedUsed);

      const effectResult = this.applyDrugEffect(drugType, now, potencyMultiplier);
      if (!effectResult.ok) {
        return effectResult;
      }

      if (drugType === "overdriveX") {
        this.player.totalHeat = Math.max(0, Number(this.player.totalHeat || 0) + DRUG_LAB_CONFIG.overdriveUseImmediateHeat);
      }

      const messageParts = [`${drug.name} použita (${drug.useAmount} ks).`];
      if (enhancedUsed > 0) {
        messageParts.push("Čistá várka: +20 % síla efektu.");
      }
      if (drugType === "overdriveX") {
        messageParts.push(`Heat +${DRUG_LAB_CONFIG.overdriveUseImmediateHeat}.`);
      }
      return {
        ok: true,
        message: messageParts.join(" ")
      };
    }

    updateDrugEffects(now = Date.now()) {
      return this.updateTimedEffects(now);
    }

    calculateCurrentHeatPerHour(now = Date.now()) {
      const unlockedSlots = this.getUnlockedSlotCount();
      const baseHeatPerHour = this.building.slots.reduce((sum, slot) => {
        if (Number(slot.id) > unlockedSlots) return sum;
        if (!slot.isProducing) return sum;
        const drug = DRUG_CONFIG[slot.activeDrugType];
        if (!drug) return sum;
        return sum + Number(drug.heatPerHour || 0);
      }, 0);
      return Math.max(0, baseHeatPerHour * this.getHeatMultiplier(now));
    }

    applyPassiveHeat(now = Date.now()) {
      let from = Number(this.building.lastHeatAt || now);
      if (!Number.isFinite(from) || from > now) {
        from = now;
      }
      let gained = 0;
      if (from < now) {
        const hoursElapsed = (now - from) / 3600000;
        const rawHeat = hoursElapsed * this.calculateCurrentHeatPerHour(now) + Number(this.building.heatRemainder || 0);
        gained = Math.max(0, Math.floor(rawHeat));
        this.building.heatRemainder = Math.max(0, rawHeat - gained);
      }
      this.building.lastHeatAt = now;
      if (gained > 0) {
        this.player.totalHeat = Math.max(0, Math.floor(Number(this.player.totalHeat || 0) + gained));
      }
      return gained;
    }

    upgradeBuilding(player) {
      const nextLevel = Math.max(1, Math.floor(Number(this.building.level || 1)) + 1);
      if (nextLevel > DRUG_LAB_CONFIG.maxLevel) {
        return { ok: false, message: "Drug Lab je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(DRUG_LAB_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const spendResult = spend(cost);
      if (!spendResult?.ok) {
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      this.building.level = nextLevel;
      return { ok: true, message: `Drug Lab vylepšen na level ${nextLevel} za $${cost}.` };
    }

    useOverclock(player, now = Date.now()) {
      const cooldownLeft = Math.max(0, Number(this.building.cooldowns.overclock || 0) - now);
      if (cooldownLeft > 0) {
        return { ok: false, message: `Overclock je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      this.building.effects.overclockUntil = now + DRUG_LAB_CONFIG.specialActions.overclock.durationMs;
      this.building.cooldowns.overclock = now + DRUG_LAB_CONFIG.specialActions.overclock.cooldownMs;
      this.player.totalHeat = Math.max(
        0,
        Math.floor(Number(this.player.totalHeat || 0) + DRUG_LAB_CONFIG.specialActions.overclock.immediateHeat)
      );
      return {
        ok: true,
        message:
          `Overclock aktivní na ${formatDurationLabel(DRUG_LAB_CONFIG.specialActions.overclock.durationMs)}. `
          + `Produkce +${DRUG_LAB_CONFIG.specialActions.overclock.productionBoostPct} %, `
          + `heat +${DRUG_LAB_CONFIG.specialActions.overclock.immediateHeat}.`
      };
    }

    useCleanBatch(player, now = Date.now()) {
      const cooldownLeft = Math.max(0, Number(this.building.cooldowns.cleanBatch || 0) - now);
      if (cooldownLeft > 0) {
        return { ok: false, message: `Čistá várka je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      this.building.effects.cleanBatchUntil = now + DRUG_LAB_CONFIG.specialActions.cleanBatch.durationMs;
      this.building.cooldowns.cleanBatch = now + DRUG_LAB_CONFIG.specialActions.cleanBatch.cooldownMs;
      return {
        ok: true,
        message:
          `Čistá várka aktivní na ${formatDurationLabel(DRUG_LAB_CONFIG.specialActions.cleanBatch.durationMs)}. `
          + `Nové dávky budou mít +${DRUG_LAB_CONFIG.specialActions.cleanBatch.effectBoostPct} % sílu efektu.`
      };
    }

    useHiddenOperation(player, now = Date.now()) {
      const cooldownLeft = Math.max(0, Number(this.building.cooldowns.hiddenOperation || 0) - now);
      if (cooldownLeft > 0) {
        return { ok: false, message: `Skrytý provoz je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      this.building.effects.hiddenOperationUntil = now + DRUG_LAB_CONFIG.specialActions.hiddenOperation.durationMs;
      this.building.cooldowns.hiddenOperation = now + DRUG_LAB_CONFIG.specialActions.hiddenOperation.cooldownMs;
      return {
        ok: true,
        message:
          `Skrytý provoz aktivní na ${formatDurationLabel(DRUG_LAB_CONFIG.specialActions.hiddenOperation.durationMs)}. `
          + `Heat z výroby -${DRUG_LAB_CONFIG.specialActions.hiddenOperation.heatReductionPct} %, `
          + `produkce -${DRUG_LAB_CONFIG.specialActions.hiddenOperation.productionPenaltyPct} %.`
      };
    }

    updateTimedEffects(now = Date.now()) {
      const expiredEffects = [];
      Object.keys(this.player.activeDrugEffects || {}).forEach((effectKey) => {
        const stateRef = this.player.activeDrugEffects[effectKey];
        if (!stateRef?.active) return;
        const endsAt = Number(stateRef.endsAt || 0);
        if (now < endsAt) return;
        stateRef.active = false;
        stateRef.endsAt = 0;
        stateRef.potencyMultiplier = 1;
        expiredEffects.push(effectKey);
        if (effectKey === "overdriveX") {
          const crashRef = this.player.activeDrugEffects.overdriveCrash || createDefaultDrugLabEffectState();
          crashRef.active = true;
          crashRef.endsAt = now + DRUG_LAB_CONFIG.overdriveCrashDurationMs;
          crashRef.potencyMultiplier = 1;
          this.player.activeDrugEffects.overdriveCrash = crashRef;
          expiredEffects.push("overdriveCrash_started");
        }
      });
      return { expiredEffects };
    }
  }

  function persistDrugLabRuntime(sync, now = Date.now()) {
    persistDrugLabState(sync.instanceKey, sync.building);
    persistDrugLabPlayerSnapshot(sync.player);
    sync.economy = applyDrugLabEconomySnapshot(sync.economy, sync.inventory, sync.player, now);
    return sync;
  }

  function syncDrugLabIncome(instanceState, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getDrugLabLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const hourlyCleanIncome = Math.max(0, Number(DRUG_LAB_CONFIG.baseCleanIncomePerHour || 0))
      * levelMultiplier
      * districtIncomeMultiplier;
    const hourlyDirtyIncome = Math.max(0, Number(DRUG_LAB_CONFIG.baseDirtyIncomePerHour || 0))
      * levelMultiplier
      * districtIncomeMultiplier;

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw = hoursElapsed * hourlyCleanIncome + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw = hoursElapsed * hourlyDirtyIncome + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      rates: {
        hourlyCleanIncome,
        hourlyDirtyIncome,
        hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
      }
    };
  }

  function runDrugLabTick(context, district, now = Date.now()) {
    const instanceKey = resolveBuildingInstanceKey(context, district);
    const building = getDrugLabStateByKey(instanceKey, now);
    const player = getDrugLabPlayerSnapshot(now);
    const economy = getSafeDrugLabEconomySnapshot();
    const inventory = normalizeDrugLabInventoryFromEconomy(economy);
    const core = new DrugLabCore({
      instanceKey,
      district,
      buildingState: building,
      playerState: player,
      inventory
    });
    const incomeSync = syncDrugLabIncome(building, now, district || context?.districtId);
    const timed = core.updateTimedEffects(now);
    const producedByDrug = core.updateProduction(now);
    const heatAdded = core.applyPassiveHeat(now);
    const producedTotal = DRUG_LAB_DRUG_KEYS.reduce(
      (sum, key) => sum + Math.max(0, Math.floor(Number(producedByDrug?.[key] || 0))),
      0
    );
    if (producedTotal > 0) {
      const collected = core.collectDrugs();
      DRUG_LAB_DRUG_KEYS.forEach((key) => {
        inventory[key] = Math.max(0, Math.floor(Number(inventory[key] || 0) + Number(collected.collected[key] || 0)));
        player.enhancedDrugs[key] = Math.max(
          0,
          Math.floor(Number(player.enhancedDrugs[key] || 0) + Number(collected.collectedEnhanced[key] || 0))
        );
      });
    }

    if (Array.isArray(timed.expiredEffects) && timed.expiredEffects.length) {
      timed.expiredEffects.forEach((effectKey) => {
        if (effectKey === "overdriveCrash_started") {
          pushDrugLabLog(player, "Overdrive Crash aktivní: výkon -10 % na 1 hodinu.", now);
          return;
        }
        pushDrugLabLog(player, `Efekt ${getDrugLabEffectLabel(effectKey)} vypršel.`, now);
      });
    }

    persistDrugLabRuntime({ instanceKey, building, player, economy, inventory }, now);

    return {
      instanceKey,
      building,
      player,
      economy,
      inventory,
      core,
      timed,
      producedByDrug,
      heatAdded,
      incomeSync
    };
  }

  function formatDrugLabTimeLabel(timestampMs) {
    const safeTs = Math.max(0, Math.floor(Number(timestampMs) || 0));
    if (safeTs <= 0) return "-";
    try {
      return new Date(safeTs).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return "-";
    }
  }

  function getApartmentLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, APARTMENT_BLOCK_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * APARTMENT_BLOCK_CONFIG.upgradePctPerLevel;
  }

  function getSchoolLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, SCHOOL_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * SCHOOL_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getFitnessLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, FITNESS_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * FITNESS_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getCasinoLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, CASINO_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * CASINO_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getArcadeLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, ARCADE_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * ARCADE_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getAutoSalonLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, AUTO_SALON_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * AUTO_SALON_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getExchangeLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, EXCHANGE_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * EXCHANGE_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getRestaurantLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, RESTAURANT_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * RESTAURANT_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getConvenienceStoreLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, CONVENIENCE_STORE_BUILDING_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * CONVENIENCE_STORE_BUILDING_CONFIG.upgradePctPerLevel;
  }

  function getDrugLabLevelMultiplier(level) {
    const safeLevel = clamp(Math.floor(Number(level) || 1), 1, DRUG_LAB_CONFIG.maxLevel);
    return 1 + (safeLevel - 1) * DRUG_LAB_CONFIG.upgradePctPerLevel;
  }

  function formatDecimalValue(value, maxFractions = 2) {
    const safe = Number(value || 0);
    if (!Number.isFinite(safe)) return "0";
    const formatted = safe.toFixed(maxFractions);
    return formatted.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
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

  function formatProductionDurationLabel(ms) {
    const safe = Math.max(0, Math.floor(Number(ms) || 0));
    const totalSeconds = Math.max(1, Math.ceil(safe / 1000));
    if (totalSeconds < 3600) return `${totalSeconds}s`;
    const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    return `${hours}h`;
  }

  function payoutBuildingIncome(totalIncome) {
    const total = Math.max(0, Math.floor(Number(totalIncome) || 0));
    if (total <= 0) return { total: 0, clean: 0, dirty: 0 };

    const dirtyBase = Math.max(0, Math.floor(total * BUILDING_INCOME_DIRTY_RATIO));
    const cleanBase = Math.max(0, Math.floor(total * BUILDING_INCOME_CLEAN_RATIO));
    const roundingRemainder = Math.max(0, total - (cleanBase + dirtyBase));
    const cleanPayout = cleanBase + roundingRemainder;
    const dirtyPayout = dirtyBase;
    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;

    if (cleanPayout > 0 && typeof addClean === "function") {
      addClean(cleanPayout);
    }

    if (dirtyPayout > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyPayout);
      } else if (typeof addClean === "function") {
        addClean(dirtyPayout);
      }
    }

    return { total, clean: cleanPayout, dirty: dirtyPayout };
  }

  function payoutDirectBuildingIncome(cleanIncome = 0, dirtyIncome = 0) {
    const cleanPayout = Math.max(0, Math.floor(Number(cleanIncome) || 0));
    const dirtyPayout = Math.max(0, Math.floor(Number(dirtyIncome) || 0));
    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;

    if (cleanPayout > 0 && typeof addClean === "function") {
      addClean(cleanPayout);
    }
    if (dirtyPayout > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyPayout);
      } else if (typeof addClean === "function") {
        addClean(dirtyPayout);
      }
    }

    return {
      total: cleanPayout + dirtyPayout,
      clean: cleanPayout,
      dirty: dirtyPayout
    };
  }

  function syncSimpleCashBuildingIncome(instanceState, rates, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const hourlyCleanIncome = Math.max(0, Number(rates?.hourlyCleanIncome || 0)) * districtIncomeMultiplier;
    const hourlyDirtyIncome = Math.max(0, Number(rates?.hourlyDirtyIncome || 0)) * districtIncomeMultiplier;

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw = hoursElapsed * hourlyCleanIncome + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw = hoursElapsed * hourlyDirtyIncome + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      rates: {
        hourlyCleanIncome,
        hourlyDirtyIncome,
        hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
      }
    };
  }

  function applyBuildingInfluenceTick(instanceState, nowMs, perHour = BUILDING_INFLUENCE_PER_HOUR) {
    const stateRef = instanceState;
    const influenceRate = Math.max(0, Number(perHour) || 0);
    let influenceFrom = Number(stateRef.lastInfluenceAt || nowMs);
    if (!Number.isFinite(influenceFrom) || influenceFrom > nowMs) {
      influenceFrom = nowMs;
    }

    let gained = 0;
    if (influenceFrom < nowMs && influenceRate > 0) {
      const hoursElapsed = (nowMs - influenceFrom) / 3600000;
      const gainedRaw = hoursElapsed * influenceRate + Number(stateRef.influenceRemainder || 0);
      gained = Math.max(0, Math.floor(gainedRaw));
      stateRef.influenceRemainder = Math.max(0, gainedRaw - gained);
    }
    stateRef.lastInfluenceAt = nowMs;

    if (gained > 0) {
      const addInfluence = window.Empire.UI?.addInfluence;
      if (typeof addInfluence === "function") {
        addInfluence(gained);
      }
    }
    return gained;
  }

  function normalizeBuildingTypeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function isFitnessClubBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "fitness club" || normalized === "fitness centrum";
  }

  function isCasinoBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "kasino" || normalized === "casino";
  }

  function isArcadeBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "herna" || normalized === "arcade";
  }

  function isAutoSalonBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "autosalon" || normalized === "auto salon";
  }

  function isExchangeBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "smenarna" || normalized === "exchange";
  }

  function isRestaurantBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "restaurace" || normalized === "restaurant";
  }

  function isConvenienceStoreBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "vecerka" || normalized === "convenience store";
  }

  function isPharmacyBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "lekarna" || normalized === "pharmacy";
  }

  function isFactoryBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "tovarna" || normalized === "factory";
  }

  function isArmoryBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "zbrojovka" || normalized === "armory";
  }

  function isDrugLabBaseName(value) {
    const normalized = normalizeBuildingTypeName(value);
    return normalized === "drug lab" || normalized === "druglab";
  }

  function collectOwnedPharmacyEntries() {
    const districts = Array.isArray(state.districts) ? state.districts : [];
    const entries = [];
    districts.forEach((district) => {
      if (!isDistrictOwnedByPlayer(district)) return;
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
      const districtLabel = String(district?.name || `Distrikt #${district?.id ?? "-"}`);
      buildings.forEach((building, index) => {
        if (!isPharmacyBaseName(building)) return;
        const baseName = String(building || PHARMACY_BUILDING_NAME);
        const overrideRaw = String(overrides[index] || "").trim();
        const variantName = overrideRaw && overrideRaw !== baseName ? overrideRaw : null;
        const displayName = variantName || `${baseName} • ${districtLabel}`;
        entries.push({
          district,
          districtId: district?.id ?? null,
          buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null,
          baseName,
          variantName,
          displayName,
          context: {
            baseName,
            variantName,
            districtId: district?.id ?? null,
            buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null
          }
        });
      });
    });
    return entries;
  }

  function getOwnedPharmacyCount() {
    return Math.max(0, collectOwnedPharmacyEntries().length);
  }

  function getPharmacyProductionBonusPct() {
    return Math.max(0, getOwnedPharmacyCount() * 5);
  }

  function getPharmacyStorageCapMultiplier() {
    const warehouseCount = getOwnedWarehouseCountForDrugLab();
    if (warehouseCount <= 0) return 1;
    return 1 + warehouseCount * 0.2;
  }

  function getPharmacyStorageCapBonusPct() {
    return Math.max(0, (getPharmacyStorageCapMultiplier() - 1) * 100);
  }

  function collectOwnedFactoryEntries() {
    const districts = Array.isArray(state.districts) ? state.districts : [];
    const entries = [];
    districts.forEach((district) => {
      if (!isDistrictOwnedByPlayer(district)) return;
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
      const districtLabel = String(district?.name || `Distrikt #${district?.id ?? "-"}`);
      buildings.forEach((building, index) => {
        if (!isFactoryBaseName(building)) return;
        const baseName = String(building || FACTORY_BUILDING_NAME);
        const overrideRaw = String(overrides[index] || "").trim();
        const variantName = overrideRaw && overrideRaw !== baseName ? overrideRaw : null;
        const displayName = variantName || `${baseName} • ${districtLabel}`;
        entries.push({
          district,
          districtId: district?.id ?? null,
          buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null,
          baseName,
          variantName,
          displayName,
          context: {
            baseName,
            variantName,
            districtId: district?.id ?? null,
            buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null
          }
        });
      });
    });
    return entries;
  }

  function collectOwnedArmoryEntries() {
    const districts = Array.isArray(state.districts) ? state.districts : [];
    const entries = [];
    districts.forEach((district) => {
      if (!isDistrictOwnedByPlayer(district)) return;
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
      const districtLabel = String(district?.name || `Distrikt #${district?.id ?? "-"}`);
      buildings.forEach((building, index) => {
        if (!isArmoryBaseName(building)) return;
        const baseName = String(building || ARMORY_BUILDING_NAME);
        const overrideRaw = String(overrides[index] || "").trim();
        const variantName = overrideRaw && overrideRaw !== baseName ? overrideRaw : null;
        const displayName = variantName || `${baseName} • ${districtLabel}`;
        entries.push({
          district,
          districtId: district?.id ?? null,
          buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null,
          baseName,
          variantName,
          displayName,
          context: {
            baseName,
            variantName,
            districtId: district?.id ?? null,
            buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null
          }
        });
      });
    });
    return entries;
  }

  function resolvePrimaryOwnedPharmacyTarget(context, district) {
    const ownedEntries = collectOwnedPharmacyEntries();
    if (ownedEntries.length) {
      const primary = ownedEntries[0];
      return {
        entries: ownedEntries,
        primary,
        context: primary.context,
        district: primary.district
      };
    }

    return {
      entries: [],
      primary: null,
      context,
      district: resolveDistrictRecord(district || context?.districtId) || district || null
    };
  }

  function resolvePrimaryOwnedFactoryTarget(context, district) {
    const ownedEntries = collectOwnedFactoryEntries();
    if (ownedEntries.length) {
      const primary = ownedEntries[0];
      return {
        entries: ownedEntries,
        primary,
        context: primary.context,
        district: primary.district
      };
    }

    return {
      entries: [],
      primary: null,
      context,
      district: resolveDistrictRecord(district || context?.districtId) || district || null
    };
  }

  function resolvePrimaryOwnedArmoryTarget(context, district) {
    const ownedEntries = collectOwnedArmoryEntries();
    if (ownedEntries.length) {
      const primary = ownedEntries[0];
      return {
        entries: ownedEntries,
        primary,
        context: primary.context,
        district: primary.district
      };
    }

    return {
      entries: [],
      primary: null,
      context,
      district: resolveDistrictRecord(district || context?.districtId) || district || null
    };
  }

  function collectOwnedDrugLabEntries() {
    const districts = Array.isArray(state.districts) ? state.districts : [];
    const entries = [];
    districts.forEach((district) => {
      if (!isDistrictOwnedByPlayer(district)) return;
      const buildings = Array.isArray(district?.buildings) ? district.buildings : [];
      const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
      const districtLabel = String(district?.name || `Distrikt #${district?.id ?? "-"}`);
      buildings.forEach((building, index) => {
        if (!isDrugLabBaseName(building)) return;
        const baseName = String(building || DRUG_LAB_BUILDING_NAME);
        const overrideRaw = String(overrides[index] || "").trim();
        const variantName = overrideRaw && overrideRaw !== baseName ? overrideRaw : null;
        const displayName = variantName || `${baseName} • ${districtLabel}`;
        entries.push({
          district,
          districtId: district?.id ?? null,
          buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null,
          baseName,
          variantName,
          displayName,
          context: {
            baseName,
            variantName,
            districtId: district?.id ?? null,
            buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null
          }
        });
      });
    });
    return entries;
  }

  function getOwnedDrugLabNetworkProductionBonusPct() {
    const ownedCount = collectOwnedDrugLabEntries().length;
    return Math.max(0, ownedCount) * 5;
  }

  function resolvePrimaryOwnedDrugLabTarget(context, district) {
    const ownedEntries = collectOwnedDrugLabEntries();
    if (ownedEntries.length) {
      const primary = ownedEntries[0];
      return {
        entries: ownedEntries,
        primary,
        context: primary.context,
        district: primary.district
      };
    }

    return {
      entries: [],
      primary: null,
      context,
      district: resolveDistrictRecord(district || context?.districtId) || district || null
    };
  }

  function readCurrentPlayerHeatValue() {
    const profile = window.Empire.player || {};
    const candidates = [
      profile?.wantedLevel,
      profile?.wanted_level,
      profile?.wanted,
      profile?.heat,
      profile?.notoriety,
      profile?.policeHeat,
      profile?.police_heat,
      window.Empire?.PoliceHeat?.state?.player?.totalHeat
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const parsed = Number(candidates[i]);
      if (Number.isFinite(parsed)) {
        return Math.max(0, parsed);
      }
    }
    return 0;
  }

  function appendHeatJournalEntry(type, amount, reason, createdAt = Date.now()) {
    try {
      const raw = localStorage.getItem("empire_heat_journal_v1");
      const current = raw ? JSON.parse(raw) : [];
      const entries = Array.isArray(current) ? current : [];
      entries.unshift({
        type: String(type || "").trim().toLowerCase(),
        amount: Math.max(0, Math.round((Number(amount) || 0) * 10) / 10),
        reason: String(reason || "").trim(),
        createdAt: Math.max(0, Math.floor(Number(createdAt) || Date.now()))
      });
      localStorage.setItem("empire_heat_journal_v1", JSON.stringify(entries.slice(0, 40)));
    } catch {}
  }

  function addPlayerHeatFromBuilding(amount, reason = "Provoz budov a akce") {
    const delta = Math.max(0, Number(amount) || 0);
    if (!delta) return readCurrentPlayerHeatValue();
    const nextHeat = Math.max(0, readCurrentPlayerHeatValue() + delta);
    const currentProfile = window.Empire.player && typeof window.Empire.player === "object"
      ? window.Empire.player
      : {};
    const nextProfile = {
      ...currentProfile,
      heat: nextHeat,
      wantedLevel: nextHeat,
      wanted: nextHeat,
      policeHeat: nextHeat,
      police_heat: nextHeat
    };

    const updateProfile = window.Empire.UI?.updateProfile;
    if (typeof updateProfile === "function") {
      updateProfile(nextProfile);
    } else {
      window.Empire.player = nextProfile;
    }

    const setExternalHeat = window.Empire.PoliceHeat?.setExternalHeat;
    if (typeof setExternalHeat === "function") {
      setExternalHeat(nextHeat, nextProfile);
    }

    appendHeatJournalEntry("rise", delta, reason);

    return nextHeat;
  }

  function getPharmacyBoostSnapshot(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const activeEffects = [];
    const totals = {
      spySpeedPct: 0,
      infoQualityPct: 0,
      attackSpeedPct: 0,
      stealSpeedPct: 0,
      activeActionsPct: 0
    };
    const counts = {
      recon: 0,
      action: 0,
      neuro: 0
    };
    const playerSnapshot = getDrugLabPlayerSnapshot(nowMs);
    const supplies = createDrugLabSupplyMap(playerSnapshot.labSupplies || {});
    const economy = getSafeDrugLabEconomySnapshot();
    const drugInventory = normalizeDrugLabInventoryFromEconomy(economy);

    Object.entries(pharmacyBuildingStore || {}).forEach(([instanceKey, rawState]) => {
      const snapshot = sanitizePharmacyState(rawState, nowMs);
      pharmacyBuildingStore[instanceKey] = snapshot;
      const reconRemaining = Math.max(0, Number(snapshot.effects.reconUntil || 0) - nowMs);
      if (reconRemaining > 0) {
        counts.recon += 1;
        totals.spySpeedPct += PHARMACY_CONFIG.boosts.recon.spySpeedPct;
        totals.infoQualityPct += PHARMACY_CONFIG.boosts.recon.infoQualityPct;
        activeEffects.push({ type: "recon", remainingMs: reconRemaining });
      }
      const actionRemaining = Math.max(0, Number(snapshot.effects.actionUntil || 0) - nowMs);
      if (actionRemaining > 0) {
        counts.recon += 1;
        totals.attackSpeedPct += PHARMACY_CONFIG.boosts.action.attackSpeedPct;
        totals.stealSpeedPct += PHARMACY_CONFIG.boosts.action.stealSpeedPct;
        activeEffects.push({ type: "recon", remainingMs: actionRemaining });
      }
      const neuroRemaining = Math.max(0, Number(snapshot.effects.neuroUntil || 0) - nowMs);
      if (neuroRemaining > 0) {
        counts.neuro += 1;
        totals.activeActionsPct += PHARMACY_CONFIG.boosts.neuro.activeActionsPct;
        activeEffects.push({ type: "neuro", remainingMs: neuroRemaining });
      }
    });

    return {
      activeCount: activeEffects.length,
      activeEffects,
      counts,
      supplies,
      drugInventory,
      bonuses: {
        ...totals
      },
      effective: {
        spySpeedPct: totals.spySpeedPct + totals.activeActionsPct,
        infoQualityPct: totals.infoQualityPct,
        attackSpeedPct: totals.attackSpeedPct + totals.activeActionsPct,
        stealSpeedPct: totals.stealSpeedPct + totals.activeActionsPct,
        activeActionsPct: totals.activeActionsPct
      }
    };
  }

  function usePharmacyBoost(boostType, now = Date.now()) {
    const type = String(boostType || "").trim().toLowerCase();
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const target = resolvePrimaryOwnedPharmacyTarget(null, null);
    if (!target?.context) {
      return { ok: false, message: "Boost nelze aktivovat: nevlastníš žádnou Lékárnu." };
    }

    const instanceKey = resolveBuildingInstanceKey(target.context, target.district);
    const snapshot = getPharmacyStateByKey(instanceKey, nowMs);
    syncPharmacyProduction(snapshot, nowMs);
    const player = getDrugLabPlayerSnapshot(nowMs);
    player.labSupplies = createDrugLabSupplyMap(player.labSupplies || {});
    const economy = getSafeDrugLabEconomySnapshot();
    const inventory = normalizeDrugLabInventoryFromEconomy(economy);

    const config = PHARMACY_CONFIG.boosts[type] || null;
    if (!config) {
      persistPharmacyState(instanceKey, snapshot);
      persistDrugLabPlayerSnapshot(player);
      return { ok: false, message: "Neznámý boost." };
    }

    const resolvedType = type === "action" ? "recon" : type;
    const untilKey = resolvedType === "recon" ? "reconUntil" : "neuroUntil";
    const cooldownLeft = Math.max(0, Number(snapshot.cooldowns[resolvedType] || 0) - nowMs);
    if (cooldownLeft > 0) {
      persistPharmacyState(instanceKey, snapshot);
      persistDrugLabPlayerSnapshot(player);
      return { ok: false, message: `${resolvedType === "recon" ? "Ghost Serum" : "Overdrive X"} boost je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
    }

    const resourceKey = String(config.resourceKey || "").trim() || "ghostSerum";
    const resourceLabel = String(config.resourceLabel || resourceKey).trim() || resourceKey;
    const drugCost = Math.max(0, Math.floor(Number(config.drugCost || 0)));
    const availableDrugs = Math.max(0, Math.floor(Number(inventory[resourceKey] || 0)));
    if (availableDrugs < drugCost) {
      persistPharmacyState(instanceKey, snapshot);
      persistDrugLabPlayerSnapshot(player);
      applyDrugLabEconomySnapshot(economy, inventory, player, nowMs);
      return { ok: false, message: `Nedostatek ${resourceLabel} (${availableDrugs}/${drugCost}).` };
    }

    inventory[resourceKey] = Math.max(0, availableDrugs - drugCost);
    snapshot.effects[untilKey] = nowMs + PHARMACY_CONFIG.boostDurationMs;
    snapshot.cooldowns[resolvedType] = nowMs + PHARMACY_CONFIG.boostDurationMs;
    if (resolvedType === "recon") {
      snapshot.effects.actionUntil = nowMs + PHARMACY_CONFIG.boostDurationMs;
      snapshot.cooldowns.action = nowMs + PHARMACY_CONFIG.boostDurationMs;
    }

    let heatNote = "";
    if (type === "neuro") {
      const nextHeat = addPlayerHeatFromBuilding(PHARMACY_CONFIG.boosts.neuro.heatAdded);
      heatNote = ` Heat +${PHARMACY_CONFIG.boosts.neuro.heatAdded} (celkem ${nextHeat}).`;
    }

    persistPharmacyState(instanceKey, snapshot);
    persistDrugLabPlayerSnapshot(player);
    applyDrugLabEconomySnapshot(economy, inventory, player, nowMs);

    const boostLabel = resolvedType === "recon" ? "Ghost Serum boost" : "Overdrive X boost";
    return {
      ok: true,
      message:
        `${boostLabel} aktivní na ${formatDurationLabel(PHARMACY_CONFIG.boostDurationMs)}. `
        + `Spotřeba ${drugCost} ${resourceLabel} (zbývá ${inventory[resourceKey]}).${heatNote}`
    };
  }

  function getFactoryBoostSnapshot(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const activeEffects = [];
    const totals = {
      attackPowerPct: 0,
      attackSpeedPct: 0,
      raidSpeedPct: 0,
      destroyBuildingChancePct: 0,
      defenseIgnorePct: 0,
      defensePenaltyPct: 0,
      policeInterventionRiskPct: 0
    };
    const counts = {
      assault: 0,
      rapid: 0,
      breach: 0
    };
    const supplies = createFactoryPlayerSupplyMap(getFactoryPlayerSuppliesSnapshot());

    Object.entries(factoryBuildingStore || {}).forEach(([instanceKey, rawState]) => {
      const snapshot = sanitizeFactoryState(rawState, nowMs);
      factoryBuildingStore[instanceKey] = snapshot;
      const assaultRemaining = Math.max(0, Number(snapshot.effects.assaultUntil || 0) - nowMs);
      if (assaultRemaining > 0) {
        counts.assault += 1;
        totals.attackPowerPct += FACTORY_COMBAT_BOOSTS.assault.attackPowerPct;
        activeEffects.push({ type: "assault", remainingMs: assaultRemaining });
      }
      const rapidRemaining = Math.max(0, Number(snapshot.effects.rapidUntil || 0) - nowMs);
      if (rapidRemaining > 0) {
        counts.rapid += 1;
        totals.attackSpeedPct += FACTORY_COMBAT_BOOSTS.rapid.attackSpeedPct;
        totals.raidSpeedPct += FACTORY_COMBAT_BOOSTS.rapid.raidSpeedPct;
        totals.defensePenaltyPct += FACTORY_COMBAT_BOOSTS.rapid.defensePenaltyPct;
        activeEffects.push({ type: "rapid", remainingMs: rapidRemaining });
      }
      const breachRemaining = Math.max(0, Number(snapshot.effects.breachUntil || 0) - nowMs);
      if (breachRemaining > 0) {
        counts.breach += 1;
        totals.destroyBuildingChancePct += FACTORY_COMBAT_BOOSTS.breach.destroyBuildingChancePct;
        totals.defenseIgnorePct += FACTORY_COMBAT_BOOSTS.breach.defenseIgnorePct;
        totals.policeInterventionRiskPct += FACTORY_COMBAT_BOOSTS.breach.policeInterventionRiskPct;
        activeEffects.push({ type: "breach", remainingMs: breachRemaining });
      }
    });

    return {
      activeCount: activeEffects.length,
      activeEffects,
      counts,
      supplies,
      bonuses: {
        ...totals
      },
      effective: {
        ...totals
      }
    };
  }

  function useFactoryBoost(boostType, now = Date.now()) {
    const type = String(boostType || "").trim().toLowerCase();
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const target = resolvePrimaryOwnedFactoryTarget(null, null);
    if (!target?.context) {
      return { ok: false, message: "Boost nelze aktivovat: nevlastníš žádnou Továrnu." };
    }

    const instanceKey = resolveBuildingInstanceKey(target.context, target.district);
    const snapshot = getFactoryStateByKey(instanceKey, nowMs);
    syncFactoryProduction(snapshot, nowMs, { applyHeat: true });
    const player = createFactoryPlayerSupplyMap(getFactoryPlayerSuppliesSnapshot());
    const config = FACTORY_COMBAT_BOOSTS[type] || null;
    if (!config) {
      persistFactoryState(instanceKey, snapshot);
      persistFactoryPlayerSuppliesSnapshot(player);
      return { ok: false, message: "Neznámý combat boost." };
    }

    const untilKey = type === "assault" ? "assaultUntil" : type === "rapid" ? "rapidUntil" : "breachUntil";
    const activeLeft = Math.max(0, Number(snapshot.effects[untilKey] || 0) - nowMs);
    if (activeLeft > 0) {
      persistFactoryState(instanceKey, snapshot);
      persistFactoryPlayerSuppliesSnapshot(player);
      return {
        ok: false,
        message: `${type === "assault" ? "Assault Protocol" : type === "rapid" ? "Rapid Strike" : "Breach Mode"} je už aktivní (${formatDurationLabel(activeLeft)}).`
      };
    }

    const moduleCost = Math.max(0, Math.floor(Number(config.combatModuleCost || 0)));
    const availableModules = Math.max(0, Math.floor(Number(player.combatModule || 0)));
    if (availableModules < moduleCost) {
      persistFactoryState(instanceKey, snapshot);
      persistFactoryPlayerSuppliesSnapshot(player);
      return { ok: false, message: `Nedostatek Combat Module (${availableModules}/${moduleCost}).` };
    }

    player.combatModule = Math.max(0, availableModules - moduleCost);
    snapshot.effects[untilKey] = nowMs + config.durationMs;
    snapshot.cooldowns[type] = nowMs + config.durationMs;
    const nextHeat = addPlayerHeatFromBuilding(config.heatAdded);

    persistFactoryState(instanceKey, snapshot);
    persistFactoryPlayerSuppliesSnapshot(player);

    const boostLabel = type === "assault" ? "Assault Protocol" : type === "rapid" ? "Rapid Strike" : "Breach Mode";
    return {
      ok: true,
      message:
        `${boostLabel} aktivní na ${formatDurationLabel(config.durationMs)}. `
        + `Spotřeba ${moduleCost} Combat Module (zbývá ${player.combatModule}). `
        + `Heat +${config.heatAdded} (celkem ${nextHeat}).`
    };
  }

  function resolveDistrictRecord(districtOrId) {
    if (districtOrId && typeof districtOrId === "object" && Array.isArray(districtOrId.buildings)) {
      return districtOrId;
    }
    const districtId = districtOrId && typeof districtOrId === "object"
      ? districtOrId.id
      : districtOrId;
    const targetKey = String(districtId ?? "").trim();
    if (!targetKey) return null;
    return state.districts.find((item) => String(item?.id) === targetKey) || null;
  }

  function districtHasDrugLab(districtOrId) {
    const districtRecord = resolveDistrictRecord(districtOrId);
    if (!districtRecord) return false;
    const buildings = Array.isArray(districtRecord.buildings) ? districtRecord.buildings : [];
    return buildings.some((building) => {
      const normalized = normalizeBuildingTypeName(building);
      return normalized === "drug lab" || normalized === "druglab";
    });
  }

  function playerOwnsAnyBuildingNames(targetNames = []) {
    const normalizedTargets = new Set(
      (Array.isArray(targetNames) ? targetNames : [])
        .map((entry) => normalizeBuildingTypeName(entry))
        .filter(Boolean)
    );
    if (!normalizedTargets.size) return false;
    if (!Array.isArray(state.districts) || !state.districts.length) return false;

    return state.districts.some((district) => {
      if (!isDistrictOwnedByPlayer(district)) return false;
      const buildings = Array.isArray(district.buildings) ? district.buildings : [];
      return buildings.some((building) => normalizedTargets.has(normalizeBuildingTypeName(building)));
    });
  }

  function playerOwnsDrugLabOrStreetDealers() {
    return playerOwnsAnyBuildingNames([
      "Drug lab",
      "druglab",
      "Pouliční dealeři",
      "poulicni dealeri",
      "Street dealers"
    ]);
  }

  function playerOwnsFleetLogisticsTargets() {
    return playerOwnsAnyBuildingNames([
      "Garage",
      "Garáž",
      "Taxi služba",
      "Taxi sluzba",
      "Pašovací tunel",
      "Pasovaci tunel"
    ]);
  }

  function resolveDistrictIdentityPart(districtOrId) {
    const districtRecord = resolveDistrictRecord(districtOrId);
    const districtId = districtRecord?.id ?? districtOrId;
    return normalizeBuildingKeyPart(districtId) || "unknown";
  }

  function getDistrictCashIncomeBoostPct(districtOrId, now = Date.now()) {
    const districtRecord = resolveDistrictRecord(districtOrId);
    const districtKey = normalizeDistrictId(districtRecord?.id ?? districtOrId);
    const districtPart = resolveDistrictIdentityPart(districtOrId);
    if (!districtPart) return 0;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    let boostPct = 0;

    Object.entries(exchangeBuildingStore || {}).forEach(([instanceKey, rawState]) => {
      const keyDistrictPart = String(instanceKey || "").split(":")[0] || "unknown";
      if (keyDistrictPart !== districtPart) return;
      const snapshot = sanitizeExchangeState(rawState, nowMs);
      if (nowMs >= Number(snapshot.effects.financialNetworkUntil || 0)) return;
      boostPct += EXCHANGE_BUILDING_CONFIG.actionBoosts.districtIncomeBonusPct * getExchangeLevelMultiplier(snapshot.level);
    });

    if (districtKey) {
      const policePenaltyPct = getPoliceRaidIncomePenaltyPctForDistrict(districtKey, nowMs);
      if (policePenaltyPct > 0) {
        boostPct -= policePenaltyPct;
      }
    }

    return boostPct;
  }

  function getPoliceRaidIncomePenaltyPctForDistrict(districtKey, nowMs = Date.now()) {
    const districtPart = normalizeDistrictId(districtKey);
    if (!districtPart) return 0;
    let penaltyPct = 0;
    const policeAction = state.policeDistrictActions.get(districtPart);
    if (policeAction && Number(policeAction.expiresAt || 0) > nowMs) {
      penaltyPct = Math.max(penaltyPct, DISTRICT_POLICE_INCOME_PENALTY_PCT);
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_INCOME_PENALTY_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return penaltyPct;
      }
      const entry = parsed[districtPart];
      const until = Math.max(0, Math.floor(Number(entry?.until || 0)));
      const pct = Math.max(0, Math.floor(Number(entry?.pct || 0)));
      if (until > nowMs && pct > 0) {
        penaltyPct = Math.max(penaltyPct, pct);
      }
    } catch {}

    return penaltyPct;
  }

  function getGlobalPoliceRaidProductionPenaltyPct(buildingKey = "lab", now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    try {
      const raw = localStorage.getItem(POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const key = String(buildingKey || "lab").trim().toLowerCase() || "lab";
          const entry = parsed[key];
          const until = Math.max(0, Math.floor(Number(entry?.until || 0)));
          const pct = Math.max(0, Math.floor(Number(entry?.pct || 0)));
          if (until > nowMs && pct > 0) {
            return pct;
          }
          return 0;
        }
      }
    } catch {}
    let blockedUntil = 0;
    try {
      blockedUntil = Math.max(0, Math.floor(Number(localStorage.getItem(POLICE_RAID_PRODUCTION_PENALTY_STORAGE_KEY) || 0)));
    } catch {}
    return nowMs < blockedUntil ? POLICE_RAID_PRODUCTION_PENALTY_PCT : 0;
  }

  function isPoliceRaidSpecialActionBlockedForBuilding(buildingType = "", now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const normalized = String(buildingType || "").trim().toLowerCase();
    if (!normalized) return false;
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
      const allActionsBlockedUntil = Math.max(0, Math.floor(Number(parsed.all_actions_blocked || 0)));
      if (allActionsBlockedUntil > nowMs) return true;
      const pharmacyFactoryLockUntil = Math.max(0, Math.floor(Number(parsed.pharmacy_factory_special || 0)));
      const allSpecialBuildingsLockUntil = Math.max(0, Math.floor(Number(parsed.all_special_buildings || 0)));
      if (allSpecialBuildingsLockUntil > nowMs) {
        return (
          normalized === "pharmacy"
          || normalized === "factory"
          || normalized === "armory"
          || normalized === "drug-lab"
          || normalized === "druglab"
        );
      }
      if (pharmacyFactoryLockUntil <= nowMs) return false;
      return normalized === "pharmacy" || normalized === "factory";
    } catch {
      return false;
    }
  }

  function isPoliceRaidAllActionsBlocked(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICE_RAID_BUILDING_ACTION_LOCK_STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
      return Math.max(0, Math.floor(Number(parsed.all_actions_blocked || 0))) > nowMs;
    } catch {
      return false;
    }
  }

  function getPoliceActionSnapshot(now = Date.now()) {
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    pruneExpiredPoliceActions(nowMs);
    const actions = [];
    state.policeDistrictActions.forEach((marker, districtId) => {
      const expiresAt = Math.max(0, Math.floor(Number(marker?.expiresAt) || 0));
      const startedAt = Math.max(0, Math.floor(Number(marker?.startedAt) || 0));
      const remainingMs = Math.max(0, expiresAt - nowMs);
      if (remainingMs <= 0) return;
      actions.push({
        districtId,
        source: String(marker?.source || "police-action").trim() || "police-action",
        operationType: String(marker?.operationType || "").trim(),
        raidSpecialtyKey: String(marker?.raidSpecialtyKey || "").trim(),
        startedAt,
        expiresAt,
        remainingMs
      });
    });
    actions.sort((a, b) => b.remainingMs - a.remainingMs);
    return {
      now: nowMs,
      activeCount: actions.length,
      incomePenaltyPct: DISTRICT_POLICE_INCOME_PENALTY_PCT,
      actions
    };
  }

  function sanitizeDistrictGossipEntry(rawEntry) {
    const createdAt = Math.max(0, Math.floor(Number(rawEntry?.createdAt) || Date.now()));
    const text = String(rawEntry?.text || "").trim();
    if (!text) return null;
    const id = String(rawEntry?.id || `${createdAt}-${Math.floor(Math.random() * 1000000)}`);
    const sourceBuilding = String(rawEntry?.sourceBuilding || "").trim() || null;
    const sourceDistrictId = rawEntry?.sourceDistrictId ?? null;
    const intelLevelRaw = String(rawEntry?.intelLevel || "").trim().toLowerCase();
    const intelLevel = intelLevelRaw === "verified" ? "verified" : "rumor";
    const intelType = String(rawEntry?.intelType || "").trim() || "rumor";
    return { id, text, createdAt, sourceBuilding, sourceDistrictId, intelLevel, intelType };
  }

  function getDistrictGossipEntries(districtOrId, limit = 20) {
    const districtPart = resolveDistrictIdentityPart(districtOrId);
    if (!districtPart) return [];
    const rawEntries = Array.isArray(districtGossipStore?.[districtPart]) ? districtGossipStore[districtPart] : [];
    const entries = rawEntries
      .map((entry) => sanitizeDistrictGossipEntry(entry))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
    const safeLimit = Math.max(1, Math.floor(Number(limit) || 1));
    districtGossipStore[districtPart] = entries.slice(0, DISTRICT_GOSSIP_MAX_PER_DISTRICT);
    return entries.slice(0, safeLimit);
  }

  function appendDistrictGossip(districtOrId, text, metadata = {}) {
    const districtPart = resolveDistrictIdentityPart(districtOrId);
    if (!districtPart) return null;
    const entry = sanitizeDistrictGossipEntry({
      id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      text,
      createdAt: metadata?.createdAt ?? Date.now(),
      sourceBuilding: metadata?.sourceBuilding || null,
      sourceDistrictId: metadata?.sourceDistrictId ?? null,
      intelLevel: metadata?.intelLevel || "rumor",
      intelType: metadata?.intelType || "rumor"
    });
    if (!entry) return null;
    const existing = Array.isArray(districtGossipStore[districtPart]) ? districtGossipStore[districtPart] : [];
    existing.push(entry);
    districtGossipStore[districtPart] = existing
      .map((item) => sanitizeDistrictGossipEntry(item))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, DISTRICT_GOSSIP_MAX_PER_DISTRICT);
    saveDistrictGossipStore();
    return entry;
  }

  function seedDemoDistrictGossip() {
    try {
      if (localStorage.getItem(DISTRICT_GOSSIP_DEMO_SEED_KEY) === "1") return;
    } catch {}

    const demoData = {
      94: [
        {
          intelLevel: "verified",
          intelType: "attack_success",
          text: "Potvrzený intel: V districtu 94 proběhl noční útok na sklad zbraní."
        },
        {
          intelLevel: "rumor",
          intelType: "rumor",
          text: "Drb: V districtu 94 se mluví o novém dodavateli chemie z předměstí."
        },
        {
          intelLevel: "verified",
          intelType: "market_order_created",
          text: "Potvrzený intel: Přes district 94 šel velký nákupní příkaz na drogy."
        },
        {
          intelLevel: "rumor",
          intelType: "rumor",
          text: "Drb: V districtu 94 někdo uplácí personál v restauracích."
        }
      ],
      69: [
        {
          intelLevel: "verified",
          intelType: "raid_started",
          text: "Potvrzený intel: V districtu 69 bylo potvrzeno vykrádání noční směny."
        },
        {
          intelLevel: "rumor",
          intelType: "rumor",
          text: "Drb: V districtu 69 se zvyšuje pohyb pouličních dealerů kolem herny."
        },
        {
          intelLevel: "verified",
          intelType: "spy_started",
          text: "Potvrzený intel: V districtu 69 běží cizí špionážní síť."
        },
        {
          intelLevel: "rumor",
          intelType: "rumor",
          text: "Drb: V districtu 69 se připravuje tichý přesun hotovosti přes taxislužby."
        }
      ]
    };

    const now = Date.now();
    Object.entries(demoData).forEach(([districtId, entries], districtOffset) => {
      entries.forEach((entry, index) => {
        appendDistrictGossip(districtId, entry.text, {
          createdAt: now - (districtOffset * 10 + index) * 60000,
          intelLevel: entry.intelLevel,
          intelType: entry.intelType
        });
      });
    });

    try {
      localStorage.setItem(DISTRICT_GOSSIP_DEMO_SEED_KEY, "1");
    } catch {}
  }

  function resolveIntelEventDistrictTargets(payload = {}) {
    const explicitTargets = Array.isArray(payload?.districtIds)
      ? payload.districtIds.map((id) => resolveDistrictRecord(id)).filter(Boolean)
      : [];
    if (explicitTargets.length) return explicitTargets;

    const singleTarget = resolveDistrictRecord(payload?.district || payload?.districtId);
    if (singleTarget) return [singleTarget];

    const selectedTarget = resolveDistrictRecord(state.selectedId);
    if (selectedTarget) return [selectedTarget];

    const playerDistricts = (Array.isArray(state.districts) ? state.districts : []).filter((district) =>
      isDistrictOwnedByPlayer(district)
    );
    if (playerDistricts.length) {
      return [playerDistricts[Math.floor(Math.random() * playerDistricts.length)]];
    }

    if (Array.isArray(state.districts) && state.districts.length) {
      return [state.districts[Math.floor(Math.random() * state.districts.length)]];
    }

    return [];
  }

  function formatMarketResourceLabel(resourceKey) {
    const normalized = String(resourceKey || "").trim().toLowerCase();
    if (normalized === "drugs") return "drogy";
    if (normalized === "weapons") return "zbraně";
    if (normalized === "materials") return "materiály";
    if (normalized === "data_shards" || normalized === "data") return "data";
    if (normalized === "chemicals") return "chemicals";
    if (normalized === "biomass") return "biomass";
    if (normalized === "stim_pack") return "stim pack";
    if (normalized === "neon_dust") return "neon dust";
    if (normalized === "pulse_shot") return "pulse shot";
    if (normalized === "velvet_smoke") return "velvet smoke";
    if (normalized === "ghost_serum") return "ghost serum";
    if (normalized === "overdrive_x") return "overdrive x";
    if (normalized === "metal_parts") return "metal parts";
    if (normalized === "tech_core") return "tech core";
    if (normalized === "combat_module") return "combat module";
    if (normalized === "baseball_bat") return "baseballová pálka";
    if (normalized === "street_pistol") return "pouliční pistole";
    if (normalized === "grenade") return "granát";
    if (normalized === "smg") return "samopal";
    if (normalized === "bazooka") return "bazuka";
    if (normalized === "bulletproof_vest") return "neprůstřelná vesta";
    if (normalized === "steel_barricades") return "ocelové barikády";
    if (normalized === "security_cameras") return "bezpečnostní kamery";
    if (normalized === "auto_mg_nest") return "automatické kulometné stanoviště";
    if (normalized === "alarm_system") return "alarm";
    return "komodita";
  }

  function clearDisabledIntelTypeDistrictGossipOnRefresh() {
    const nextStore = {};
    let changed = false;
    Object.entries(districtGossipStore || {}).forEach(([districtId, entries]) => {
      const currentEntries = Array.isArray(entries) ? entries : [];
      const filteredEntries = currentEntries.filter((entry) => {
        const intelType = String(entry?.intelType || "").trim().toLowerCase();
        return !DISTRICT_GOSSIP_DISABLED_INTEL_TYPES.has(intelType);
      });
      if (filteredEntries.length !== currentEntries.length) {
        changed = true;
      }
      if (filteredEntries.length) {
        nextStore[districtId] = filteredEntries;
      }
    });
    if (!changed) return;
    districtGossipStore = nextStore;
    saveDistrictGossipStore();
  }

  function formatMarketSideLabel(side) {
    return String(side || "").trim().toLowerCase() === "sell" ? "prodejní" : "nákupní";
  }

  function buildRandomVerifiedDistrictGossip(district, payload = {}) {
    const districtLabel = resolveDistrictNumberLabel(district);
    const seedSource = `${districtLabel}:${Date.now()}:${payload?.districtId || ""}:${payload?.sourceBuilding || ""}`;
    const seed = Math.abs(hashOwner(seedSource));
    const options = [
      `Potvrzený intel: V districtu ${districtLabel} proběhl tichý přesun hotovosti přes noční podniky.`,
      `Potvrzený intel: V districtu ${districtLabel} byla zachycena nečekaná zásilka materiálu po zavírací době.`,
      `Potvrzený intel: V districtu ${districtLabel} se mění směny ochranky kvůli interním sporům.`,
      `Potvrzený intel: V districtu ${districtLabel} došlo k přesunu zbraní do provizorního skladu.`,
      `Potvrzený intel: V districtu ${districtLabel} byl zaznamenán zvýšený pohyb kurýrů mezi podniky.`,
      `Potvrzený intel: V districtu ${districtLabel} se připravuje rychlá výměna vedení lokální buňky.`,
      `Potvrzený intel: V districtu ${districtLabel} byla potvrzena dohoda o ochraně tras.`,
      `Potvrzený intel: V districtu ${districtLabel} se krátkodobě stáhla pouliční hlídka kvůli internímu rozkazu.`
    ];
    return options[seed % options.length];
  }

  function buildIntelEventText(type, district, payload = {}) {
    const districtLabel = resolveDistrictNumberLabel(district);
    const resourceLabel = formatMarketResourceLabel(payload.resourceKey);
    const sideLabel = formatMarketSideLabel(payload.side);
    const quantityLabel = Math.max(0, Math.floor(Number(payload.quantity) || 0));
    const priceLabel = Math.max(0, Math.floor(Number(payload.pricePerUnit) || 0));
    const fallbackMessage = String(payload.message || "").trim();

    if (type === "attack_success") {
      return `Potvrzený intel: V districtu ${districtLabel} proběhl útok a kontrola sektoru byla narušena.`;
    }
    if (type === "attack_failed") {
      return `Potvrzený intel: Pokus o útok v districtu ${districtLabel} byl odražen.`;
    }
    if (type === "raid_started") {
      return `Potvrzený intel: V districtu ${districtLabel} bylo zahájeno vykrádání.`;
    }
    if (type === "spy_started") {
      return buildRandomVerifiedDistrictGossip(district, payload);
    }
    if (type === "market_order_created") {
      const details = quantityLabel > 0 && priceLabel > 0
        ? ` (${quantityLabel} ks / $${priceLabel})`
        : "";
      return `Potvrzený intel: Přes district ${districtLabel} prošel ${sideLabel} příkaz na ${resourceLabel}${details}.`;
    }
    if (type === "market_order_cancelled") {
      return `Potvrzený intel: V districtu ${districtLabel} byl stažen tržní příkaz na ${resourceLabel}.`;
    }
    if (fallbackMessage) {
      return `Potvrzený intel: ${fallbackMessage}`;
    }
    return `Potvrzený intel: V districtu ${districtLabel} byl zaznamenán pohyb v podsvětí.`;
  }

  function recordIntelEvent(payload = {}) {
    const type = String(payload?.type || "").trim().toLowerCase();
    if (!type) return [];
    if (DISTRICT_GOSSIP_DISABLED_INTEL_TYPES.has(type)) return [];
    const targets = resolveIntelEventDistrictTargets(payload);
    if (!targets.length) return [];
    const now = Date.now();
    const entries = [];

    targets.forEach((district, index) => {
      const text = buildIntelEventText(type, district, payload);
      const entry = appendDistrictGossip(district, text, {
        createdAt: now + index,
        sourceBuilding: payload?.sourceBuilding || null,
        sourceDistrictId: payload?.sourceDistrictId ?? payload?.districtId ?? district?.id ?? null,
        intelLevel: "verified",
        intelType: type
      });
      if (entry) {
        entries.push({
          ...entry,
          districtId: district?.id ?? null,
          districtName: district?.name || null
        });
      }
    });

    refreshOpenDistrictGossipSection();
    return entries;
  }

  function syncApartmentProductionAndIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getApartmentLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const capacity = Math.max(1, Math.floor(APARTMENT_BLOCK_CONFIG.baseCapacity * levelMultiplier));
    const cycleMs = APARTMENT_BLOCK_CONFIG.productionCycleMs;

    stateRef.hiddenHousingActive = stateRef.hiddenHousingActive && nowMs < Number(stateRef.effects.hiddenHousingUntil || 0);

    if (stateRef.storedMembers >= capacity) {
      stateRef.storedMembers = capacity;
      stateRef.productionRemainder = 0;
      stateRef.lastProductionAt = nowMs;
    } else {
      let productionFrom = Number(stateRef.lastProductionAt || nowMs);
      if (!Number.isFinite(productionFrom) || productionFrom > nowMs) {
        productionFrom = nowMs;
      }
      const cycleCount = Math.max(0, Math.floor((nowMs - productionFrom) / cycleMs));
      if (cycleCount > 0) {
        let reachedCapacity = false;
        let appliedCycles = 0;
        for (let i = 0; i < cycleCount; i += 1) {
          const cycleTime = productionFrom + (i + 1) * cycleMs;
          const motivationActive = cycleTime < Number(stateRef.effects.motivationUntil || 0);
          const cycleMultiplier = motivationActive ? 2 : 1;
          const producedRaw =
            APARTMENT_BLOCK_CONFIG.baseProductionPerCycle * levelMultiplier * cycleMultiplier
            + Number(stateRef.productionRemainder || 0);
          const producedWhole = Math.floor(producedRaw);
          stateRef.productionRemainder = Math.max(0, producedRaw - producedWhole);
          if (producedWhole > 0) {
            stateRef.storedMembers = Math.min(capacity, Number(stateRef.storedMembers || 0) + producedWhole);
            if (stateRef.storedMembers >= capacity) {
              stateRef.productionRemainder = 0;
              reachedCapacity = true;
              appliedCycles = i + 1;
              break;
            }
          }
          appliedCycles = i + 1;
        }
        if (reachedCapacity) {
          stateRef.lastProductionAt = nowMs;
        } else {
          stateRef.lastProductionAt = productionFrom + appliedCycles * cycleMs;
        }
      }
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    const hiddenUntil = Number(stateRef.effects.hiddenHousingUntil || 0);
    const hiddenActive = stateRef.hiddenHousingActive && incomeFrom < hiddenUntil;
    if (hiddenActive) {
      const blockedUntil = Math.min(nowMs, hiddenUntil);
      incomeFrom = blockedUntil;
      if (nowMs >= hiddenUntil) {
        stateRef.hiddenHousingActive = false;
      }
    }

    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const hourlyCleanIncome =
        (APARTMENT_BLOCK_CONFIG.baseCleanIncomePerHour
          + Math.max(0, Number(totalGangMembers || 0)) * APARTMENT_BLOCK_CONFIG.cleanIncomePerGangMemberPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const hourlyDirtyIncome =
        (APARTMENT_BLOCK_CONFIG.baseDirtyIncomePerHour
          + Math.max(0, Number(totalGangMembers || 0)) * APARTMENT_BLOCK_CONFIG.dirtyIncomePerGangMemberPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const cleanRaw = hoursElapsed * hourlyCleanIncome + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw = hoursElapsed * hourlyDirtyIncome + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { cleanIncomeGained, dirtyIncomeGained };
  }

  function resolveApartmentBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getApartmentStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncApartmentProductionAndIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistApartmentState(key, snapshot);

    const levelMultiplier = getApartmentLevelMultiplier(snapshot.level);
    const capacity = Math.max(1, Math.floor(APARTMENT_BLOCK_CONFIG.baseCapacity * levelMultiplier));
    const motivationActive = now < Number(snapshot.effects.motivationUntil || 0);
    const hiddenHousingActive = snapshot.hiddenHousingActive && now < Number(snapshot.effects.hiddenHousingUntil || 0);
    const productionPerCycle =
      APARTMENT_BLOCK_CONFIG.baseProductionPerCycle
      * levelMultiplier
      * (motivationActive ? 2 : 1);
    const hourlyCleanIncome = hiddenHousingActive
      ? 0
      : (APARTMENT_BLOCK_CONFIG.baseCleanIncomePerHour
        + totalGangMembers * APARTMENT_BLOCK_CONFIG.cleanIncomePerGangMemberPerHour)
      * levelMultiplier;
    const hourlyDirtyIncome = hiddenHousingActive
      ? 0
      : (APARTMENT_BLOCK_CONFIG.baseDirtyIncomePerHour
        + totalGangMembers * APARTMENT_BLOCK_CONFIG.dirtyIncomePerGangMemberPerHour)
      * levelMultiplier;
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const dailyIncome = hourlyIncome * 24;
    const nextLevel = snapshot.level < APARTMENT_BLOCK_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? APARTMENT_BLOCK_CONFIG.upgradeCosts[nextLevel] || 0 : 0;

    const effects = [];
    if (motivationActive) {
      effects.push(`Motivační večer (${formatDurationLabel(snapshot.effects.motivationUntil - now)})`);
    }
    if (hiddenHousingActive) {
      effects.push(`Skryté ubytování (${formatDurationLabel(snapshot.effects.hiddenHousingUntil - now)})`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome,
      info:
        "Bytový blok je personální centrum gangu: každých 10 minut produkuje členy do kapacity, kterou musíš pravidelně vybírat tlačítkem Vybrat členy. Pokud je kapacita plná, produkce se zastaví. Budova generuje clean a dirty cash, Nábor z ulice okamžitě doplní část kapacity, Motivační večer na 2h zdvojnásobí produkci a Skryté ubytování na 2h vypne income, ale aktivuje ochranný režim. Každý upgrade zvyšuje produkci, kapacitu i income o 10 %.",
      specialActions: [
        "Nábor z ulice: Cooldown 3h, okamžitě přidá náhodně 5 až 15 členů do kapacity budovy a přidá +5 heat.",
        "Motivační večer: Cooldown 6h, na 2h zdvojnásobí produkci členů v budově.",
        "Skryté ubytování: Cooldown 8h, na 2h nastaví income budovy na 0 a aktivuje ochranný režim proti razii."
      ],
      mechanics: {
        type: "apartment-block",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        storedMembers: Math.max(0, Math.floor(snapshot.storedMembers || 0)),
        capacity,
        productionPerCycle,
        heatPerDay: APARTMENT_BLOCK_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.length ? effects.join(" • ") : "Žádné",
        cooldowns: {
          recruit: Math.max(0, Number(snapshot.cooldowns.recruit || 0) - now),
          motivation: Math.max(0, Number(snapshot.cooldowns.motivation || 0) - now),
          hiddenHousing: Math.max(0, Number(snapshot.cooldowns.hiddenHousing || 0) - now)
        },
        hiddenHousingActive,
        loyaltyPenalty: Number(snapshot.loyaltyPenalty || 0)
      }
    };
  }

  function resolveActiveBuildingContext() {
    const current = state.activeBuildingDetail;
    if (!current || typeof current !== "object") return null;
    const district = current.district || null;
    const context = current.context || null;
    if (!context) return null;
    return { district, context };
  }

  function handleApartmentBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getApartmentStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncApartmentProductionAndIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getApartmentLevelMultiplier(snapshot.level);
    const capacity = Math.max(1, Math.floor(APARTMENT_BLOCK_CONFIG.baseCapacity * levelMultiplier));
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "collect") {
      const collected = Math.max(0, Math.floor(Number(snapshot.storedMembers || 0)));
      if (collected <= 0) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: "Bytový blok: Není co vybrat." };
      }
      const addMembers = window.Empire.UI?.addGangMembers;
      if (typeof addMembers === "function") {
        addMembers(collected);
      }
      snapshot.storedMembers = 0;
      snapshot.lastProductionAt = now;
      persistApartmentState(key, snapshot);
      return { ok: true, message: `Bytový blok: Přidáno ${collected} členů do gangu.` };
    }

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.recruit);
      if (cooldownLeft > 0) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: `Nábor z ulice je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const randomAdded =
        APARTMENT_BLOCK_CONFIG.recruitRange.min
        + Math.floor(Math.random() * (APARTMENT_BLOCK_CONFIG.recruitRange.max - APARTMENT_BLOCK_CONFIG.recruitRange.min + 1));
      const freeSpace = Math.max(0, capacity - Math.floor(snapshot.storedMembers || 0));
      const added = Math.max(0, Math.min(freeSpace, randomAdded));
      snapshot.storedMembers = Math.min(capacity, Math.floor(snapshot.storedMembers || 0) + added);
      snapshot.cooldowns.recruit = now + APARTMENT_BLOCK_CONFIG.actionCooldowns.recruit;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + 5;
      persistApartmentState(key, snapshot);
      return {
        ok: true,
        message: `Nábor z ulice: +${added} členů (${snapshot.storedMembers}/${capacity}), heat +5.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.motivation);
      if (cooldownLeft > 0) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: `Motivační večer je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.effects.motivationUntil = now + APARTMENT_BLOCK_CONFIG.actionDurations.motivation;
      snapshot.cooldowns.motivation = now + APARTMENT_BLOCK_CONFIG.actionCooldowns.motivation;
      snapshot.loyaltyPenalty = Number(snapshot.loyaltyPenalty || 0);
      persistApartmentState(key, snapshot);
      return {
        ok: true,
        message: "Motivační večer aktivní na 2h. Produkce členů je nyní x2."
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.hiddenHousing);
      if (cooldownLeft > 0) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: `Skryté ubytování je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.hiddenHousingActive = true;
      snapshot.effects.hiddenHousingUntil = now + APARTMENT_BLOCK_CONFIG.actionDurations.hiddenHousing;
      snapshot.cooldowns.hiddenHousing = now + APARTMENT_BLOCK_CONFIG.actionCooldowns.hiddenHousing;
      snapshot.lastIncomeAt = now;
      persistApartmentState(key, snapshot);
      return {
        ok: true,
        message: "Skryté ubytování aktivní na 2h. Budova má během efektu 0 income."
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > APARTMENT_BLOCK_CONFIG.maxLevel) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: "Bytový blok je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(APARTMENT_BLOCK_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistApartmentState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistApartmentState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }

      snapshot.level = nextLevel;
      persistApartmentState(key, snapshot);
      return { ok: true, message: `Bytový blok vylepšen na level ${nextLevel} za $${cost}.` };
    }

    persistApartmentState(key, snapshot);
    return null;
  }

  function syncSchoolProductionAndIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getSchoolLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const capacity = Math.max(1, Math.floor(SCHOOL_BUILDING_CONFIG.baseCapacity * levelMultiplier));
    const cycleMs = SCHOOL_BUILDING_CONFIG.productionCycleMs;

    stateRef.eveningProgramActive = stateRef.eveningProgramActive && nowMs < Number(stateRef.effects.eveningUntil || 0);
    stateRef.districtHeatReductionActive =
      stateRef.districtHeatReductionActive && nowMs < Number(stateRef.effects.eveningUntil || 0);

    if (stateRef.storedMembers >= capacity) {
      stateRef.storedMembers = capacity;
      stateRef.productionRemainder = 0;
      stateRef.lastProductionAt = nowMs;
    } else {
      let productionFrom = Number(stateRef.lastProductionAt || nowMs);
      if (!Number.isFinite(productionFrom) || productionFrom > nowMs) {
        productionFrom = nowMs;
      }
      const cycleCount = Math.max(0, Math.floor((nowMs - productionFrom) / cycleMs));
      if (cycleCount > 0) {
        const producedRaw =
          cycleCount * SCHOOL_BUILDING_CONFIG.baseProductionPerCycle * levelMultiplier
          + Number(stateRef.productionRemainder || 0);
        const producedWhole = Math.max(0, Math.floor(producedRaw));
        stateRef.productionRemainder = Math.max(0, producedRaw - producedWhole);
        stateRef.storedMembers = Math.min(capacity, Number(stateRef.storedMembers || 0) + producedWhole);
        if (stateRef.storedMembers >= capacity) {
          stateRef.productionRemainder = 0;
          stateRef.lastProductionAt = nowMs;
        } else {
          stateRef.lastProductionAt = productionFrom + cycleCount * cycleMs;
        }
      }
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    const eveningUntil = Number(stateRef.effects.eveningUntil || 0);
    const eveningActive = stateRef.eveningProgramActive && incomeFrom < eveningUntil;
    if (eveningActive) {
      const blockedUntil = Math.min(nowMs, eveningUntil);
      incomeFrom = blockedUntil;
      if (nowMs >= eveningUntil) {
        stateRef.eveningProgramActive = false;
        stateRef.districtHeatReductionActive = false;
      }
    }

    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
      const hourlyCleanIncome =
        (SCHOOL_BUILDING_CONFIG.baseCleanIncomePerHour
          + memberSteps * SCHOOL_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const hourlyDirtyIncome =
        (SCHOOL_BUILDING_CONFIG.baseDirtyIncomePerHour
          + memberSteps * SCHOOL_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const cleanRaw = hoursElapsed * hourlyCleanIncome + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw = hoursElapsed * hourlyDirtyIncome + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { cleanIncomeGained, dirtyIncomeGained };
  }

  function resolveSchoolBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getSchoolStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncSchoolProductionAndIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistSchoolState(key, snapshot);

    const levelMultiplier = getSchoolLevelMultiplier(snapshot.level);
    const capacity = Math.max(1, Math.floor(SCHOOL_BUILDING_CONFIG.baseCapacity * levelMultiplier));
    const chemistryActive = now < Number(snapshot.effects.chemistryUntil || 0);
    const eveningActive = snapshot.eveningProgramActive && now < Number(snapshot.effects.eveningUntil || 0);
    const hasDrugLab = districtHasDrugLab(district || context?.districtId);
    const passiveDrugLabBonusPct = hasDrugLab
      ? SCHOOL_BUILDING_CONFIG.baseDrugLabPassiveBonusPct * levelMultiplier
      : 0;
    const chemistryBoostPct = hasDrugLab && chemistryActive ? SCHOOL_BUILDING_CONFIG.chemistryBoostPct : 0;
    const totalDrugLabBoostPct = passiveDrugLabBonusPct + chemistryBoostPct;
    const productionPerCycle = SCHOOL_BUILDING_CONFIG.baseProductionPerCycle * levelMultiplier;
    const memberSteps = Math.max(0, Math.floor(totalGangMembers / 10));
    const hourlyCleanIncome = eveningActive
      ? 0
      : (SCHOOL_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * SCHOOL_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const hourlyDirtyIncome = eveningActive
      ? 0
      : (SCHOOL_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * SCHOOL_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const dailyIncome = hourlyIncome * 24;
    const nextLevel = snapshot.level < SCHOOL_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? SCHOOL_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;

    const effects = [];
    effects.push(hasDrugLab
      ? `Pasivní bonus Drug Lab +${formatDecimalValue(passiveDrugLabBonusPct, 2)}%`
      : "Pasivní bonus Drug Lab: není aktivní (v districtu není Drug Lab)");
    if (chemistryActive) {
      effects.push(`Zrychlený kurz chemie (${formatDurationLabel(snapshot.effects.chemistryUntil - now)})`);
    }
    if (hasDrugLab && totalDrugLabBoostPct > 0) {
      effects.push(`Celkový boost Drug Lab +${formatDecimalValue(totalDrugLabBoostPct, 2)}%`);
    }
    if (eveningActive) {
      effects.push(`Večerní program (${formatDurationLabel(snapshot.effects.eveningUntil - now)})`);
    }
    if (snapshot.districtHeatReductionActive && eveningActive) {
      effects.push(`Heat districtu -${SCHOOL_BUILDING_CONFIG.eveningHeatReductionPct}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome,
      info:
        "Škola produkuje 1 člena každých 10 minut do kapacity 12 (škáluje s levelem) a přes Vybrat členy je převádí do gangu. Budova generuje clean a dirty cash, heat 2/24h. Akce: Náborová přednáška (CD 3h, +4 až +10 členů, +2 heat), Zrychlený kurz chemie (CD 4h, 2h, Drug Lab +25 %, +3 heat), Večerní program (CD 6h, 2h, heat districtu -20 %, income školy 0). Upgrady L2/L3/L4 za $5000/$15000/$40000 dávají +10 % produkce, income, kapacity a síly pasivního bonusu Drug Lab.",
      specialActions: [
        "Náborová přednáška: Cooldown 3h, okamžitě přidá náhodně 4 až 10 členů do kapacity školy a přidá +2 heat.",
        "Zrychlený kurz chemie: Cooldown 4h, trvá 2h a pokud je v districtu Drug Lab, zvýší jeho rychlost o +25 % (+3 heat).",
        "Večerní program: Cooldown 6h, trvá 2h, snižuje heat districtu o 20 %, ale income školy je během efektu 0."
      ],
      mechanics: {
        type: "school",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        storedMembers: Math.max(0, Math.floor(snapshot.storedMembers || 0)),
        capacity,
        productionPerCycle,
        heatPerDay: SCHOOL_BUILDING_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          lecture: Math.max(0, Number(snapshot.cooldowns.lecture || 0) - now),
          chemistry: Math.max(0, Number(snapshot.cooldowns.chemistry || 0) - now),
          evening: Math.max(0, Number(snapshot.cooldowns.evening || 0) - now)
        },
        hasDrugLab,
        passiveDrugLabBonusPct,
        chemistryBoostPct,
        totalDrugLabBoostPct,
        districtHeatReductionPct: eveningActive ? SCHOOL_BUILDING_CONFIG.eveningHeatReductionPct : 0,
        eveningProgramActive: eveningActive
      }
    };
  }

  function handleSchoolBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getSchoolStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncSchoolProductionAndIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getSchoolLevelMultiplier(snapshot.level);
    const capacity = Math.max(1, Math.floor(SCHOOL_BUILDING_CONFIG.baseCapacity * levelMultiplier));
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));
    const hasDrugLab = districtHasDrugLab(district || context?.districtId);

    if (actionId === "collect") {
      const collected = Math.max(0, Math.floor(Number(snapshot.storedMembers || 0)));
      if (collected <= 0) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: "Škola: Není co vybrat." };
      }
      const addMembers = window.Empire.UI?.addGangMembers;
      if (typeof addMembers === "function") {
        addMembers(collected);
      }
      snapshot.storedMembers = 0;
      snapshot.lastProductionAt = now;
      persistSchoolState(key, snapshot);
      return { ok: true, message: `Škola: Přidáno ${collected} členů do gangu.` };
    }

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.lecture);
      if (cooldownLeft > 0) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: `Náborová přednáška je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const randomAdded =
        SCHOOL_BUILDING_CONFIG.lectureRange.min
        + Math.floor(Math.random() * (SCHOOL_BUILDING_CONFIG.lectureRange.max - SCHOOL_BUILDING_CONFIG.lectureRange.min + 1));
      const freeSpace = Math.max(0, capacity - Math.floor(snapshot.storedMembers || 0));
      const added = Math.max(0, Math.min(freeSpace, randomAdded));
      snapshot.storedMembers = Math.min(capacity, Math.floor(snapshot.storedMembers || 0) + added);
      snapshot.cooldowns.lecture = now + SCHOOL_BUILDING_CONFIG.actionCooldowns.lecture;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + 2;
      persistSchoolState(key, snapshot);
      return {
        ok: true,
        message: `Náborová přednáška: +${added} členů (${snapshot.storedMembers}/${capacity}), heat +2.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.chemistry);
      if (cooldownLeft > 0) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: `Zrychlený kurz chemie je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.effects.chemistryUntil = now + SCHOOL_BUILDING_CONFIG.actionDurations.chemistry;
      snapshot.cooldowns.chemistry = now + SCHOOL_BUILDING_CONFIG.actionCooldowns.chemistry;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + 3;
      persistSchoolState(key, snapshot);
      return {
        ok: true,
        message: hasDrugLab
          ? "Zrychlený kurz chemie aktivní na 2h. Drug Lab v districtu má +25 % rychlost."
          : "Zrychlený kurz chemie aktivní na 2h. V districtu ale chybí Drug Lab, bonus se teď neaplikuje."
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.evening);
      if (cooldownLeft > 0) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: `Večerní program je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.eveningProgramActive = true;
      snapshot.districtHeatReductionActive = true;
      snapshot.effects.eveningUntil = now + SCHOOL_BUILDING_CONFIG.actionDurations.evening;
      snapshot.cooldowns.evening = now + SCHOOL_BUILDING_CONFIG.actionCooldowns.evening;
      snapshot.lastIncomeAt = now;
      persistSchoolState(key, snapshot);
      return {
        ok: true,
        message: "Večerní program aktivní na 2h. Heat districtu -20 %, income školy během efektu = 0."
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > SCHOOL_BUILDING_CONFIG.maxLevel) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: "Škola je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(SCHOOL_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistSchoolState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistSchoolState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistSchoolState(key, snapshot);
      return { ok: true, message: `Škola vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistSchoolState(key, snapshot);
    return null;
  }

  function syncFitnessIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getFitnessLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const premiumUntil = Number(stateRef.effects.premiumUntil || 0);
    const trainingUntil = Number(stateRef.effects.trainingUntil || 0);
    const premiumActive = nowMs < premiumUntil;
    const trainingActive = stateRef.trainingBuffActive && nowMs < trainingUntil;
    stateRef.trainingBuffActive = trainingActive;

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
      const baseHourlyCleanIncome =
        (FITNESS_BUILDING_CONFIG.baseCleanIncomePerHour
          + memberSteps * FITNESS_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
        * levelMultiplier;
      const baseHourlyDirtyIncome =
        (FITNESS_BUILDING_CONFIG.baseDirtyIncomePerHour
          + memberSteps * FITNESS_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
        * levelMultiplier;
      const premiumBoostPct = premiumActive ? FITNESS_BUILDING_CONFIG.premiumIncomeBoostPct * levelMultiplier : 0;
      const trainingPenaltyPct = trainingActive ? FITNESS_BUILDING_CONFIG.trainingIncomePenaltyPct * levelMultiplier : 0;
      const incomeMultiplier = Math.max(0, 1 + premiumBoostPct / 100 - trainingPenaltyPct / 100);
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (baseHourlyCleanIncome * incomeMultiplier * districtIncomeMultiplier)
        + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (baseHourlyDirtyIncome * incomeMultiplier * districtIncomeMultiplier)
        + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (cleanIncomeGained > 0 || dirtyIncomeGained > 0) {
      payoutDirectBuildingIncome(cleanIncomeGained, dirtyIncomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { cleanIncomeGained, dirtyIncomeGained };
  }

  function resolveFitnessBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getFitnessStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncFitnessIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistFitnessState(key, snapshot);

    const levelMultiplier = getFitnessLevelMultiplier(snapshot.level);
    const premiumActive = now < Number(snapshot.effects.premiumUntil || 0);
    const trainingActive = snapshot.trainingBuffActive && now < Number(snapshot.effects.trainingUntil || 0);
    const memberSteps = Math.max(0, Math.floor(totalGangMembers / 10));
    const baseHourlyCleanIncome =
      (FITNESS_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * FITNESS_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseHourlyDirtyIncome =
      (FITNESS_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * FITNESS_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const premiumIncomeBonusPct = FITNESS_BUILDING_CONFIG.premiumIncomeBoostPct * levelMultiplier;
    const trainingIncomePenaltyPct = FITNESS_BUILDING_CONFIG.trainingIncomePenaltyPct * levelMultiplier;
    const trainingCombatBoostPct = FITNESS_BUILDING_CONFIG.trainingCombatBoostPct * levelMultiplier;
    const currentIncomeMultiplier = Math.max(
      0,
      1
      + (premiumActive ? premiumIncomeBonusPct : 0) / 100
      - (trainingActive ? trainingIncomePenaltyPct : 0) / 100
    );
    const hourlyCleanIncome = baseHourlyCleanIncome * currentIncomeMultiplier;
    const hourlyDirtyIncome = baseHourlyDirtyIncome * currentIncomeMultiplier;
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const dailyIncome = hourlyIncome * 24;
    const nextLevel = snapshot.level < FITNESS_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? FITNESS_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;

    const effects = [];
    if (premiumActive) {
      effects.push(
        `Prémiové členství (+${formatDecimalValue(premiumIncomeBonusPct, 2)}% income, ${formatDurationLabel(
          snapshot.effects.premiumUntil - now
        )})`
      );
    }
    if (trainingActive) {
      effects.push(
        `Intenzivní trénink (+${formatDecimalValue(trainingCombatBoostPct, 2)}% ATK/DEF, -${formatDecimalValue(
          trainingIncomePenaltyPct,
          2
        )}% income, ${formatDurationLabel(snapshot.effects.trainingUntil - now)})`
      );
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome,
      info:
        "Fitness centrum je ekonomická i bojová podpůrná budova. Generuje stabilní income podle velikosti gangu a přes akce umí krátkodobě zvednout výdělek nebo posílit bojovou sílu všech tvých districtů. Upgrady zvyšují income, heat i sílu pozitivních a negativních efektů akcí.",
      specialActions: [
        "Prémiové členství: Cooldown 4h, trvá 2h, zvýší income fitness centra o +50 % (škáluje s levelem) a přidá +2 heat (škáluje s levelem).",
        "Intenzivní trénink: Cooldown 6h, trvá 2h, dá +10 % síly pro útok/obranu ve všech tvých districtech (škáluje s levelem), ale fitness centrum má během efektu o 20 % nižší income (škáluje s levelem)."
      ],
      mechanics: {
        type: "fitness-club",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay:
          FITNESS_BUILDING_CONFIG.baseHeatPerDay * levelMultiplier + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.length ? effects.join(" • ") : "Žádné",
        cooldowns: {
          premium: Math.max(0, Number(snapshot.cooldowns.premium || 0) - now),
          training: Math.max(0, Number(snapshot.cooldowns.training || 0) - now)
        },
        premiumIncomeBonusPct,
        trainingIncomePenaltyPct,
        trainingCombatBoostPct,
        currentIncomeMultiplier,
        hourlyCleanIncome,
        hourlyDirtyIncome,
        trainingActive,
        premiumActive
      }
    };
  }

  function handleFitnessBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getFitnessStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncFitnessIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getFitnessLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.premium);
      if (cooldownLeft > 0) {
        persistFitnessState(key, snapshot);
        return { ok: false, message: `Prémiové členství je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.effects.premiumUntil = now + FITNESS_BUILDING_CONFIG.actionDurations.premium;
      snapshot.cooldowns.premium = now + FITNESS_BUILDING_CONFIG.actionCooldowns.premium;
      const addedHeat = FITNESS_BUILDING_CONFIG.premiumHeatAdded * levelMultiplier;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + addedHeat;
      persistFitnessState(key, snapshot);
      return {
        ok: true,
        message: `Prémiové členství aktivní na 2h. Income +${formatDecimalValue(
          FITNESS_BUILDING_CONFIG.premiumIncomeBoostPct * levelMultiplier,
          2
        )} %, heat +${formatDecimalValue(addedHeat, 2)}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.training);
      if (cooldownLeft > 0) {
        persistFitnessState(key, snapshot);
        return { ok: false, message: `Intenzivní trénink je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.trainingBuffActive = true;
      snapshot.effects.trainingUntil = now + FITNESS_BUILDING_CONFIG.actionDurations.training;
      snapshot.cooldowns.training = now + FITNESS_BUILDING_CONFIG.actionCooldowns.training;
      snapshot.lastIncomeAt = now;
      persistFitnessState(key, snapshot);
      return {
        ok: true,
        message: `Intenzivní trénink aktivní na 2h. Síla +${formatDecimalValue(
          FITNESS_BUILDING_CONFIG.trainingCombatBoostPct * levelMultiplier,
          2
        )}% (útok/obrana), income fitness -${formatDecimalValue(
          FITNESS_BUILDING_CONFIG.trainingIncomePenaltyPct * levelMultiplier,
          2
        )}%.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > FITNESS_BUILDING_CONFIG.maxLevel) {
        persistFitnessState(key, snapshot);
        return { ok: false, message: "Fitness centrum je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(FITNESS_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistFitnessState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistFitnessState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistFitnessState(key, snapshot);
      return { ok: true, message: `Fitness centrum vylepšeno na level ${nextLevel} za $${cost}.` };
    }

    persistFitnessState(key, snapshot);
    return null;
  }

  function calculateCasinoHourlyRates(totalGangMembers, levelMultiplier, vipBoostPct = 0) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const memberBonusTotal =
      memberSteps * CASINO_BUILDING_CONFIG.memberBonusPerTenMembersPerHour * Math.max(0, Number(levelMultiplier || 1));
    const baseCleanIncome = CASINO_BUILDING_CONFIG.baseCleanIncomePerHour * levelMultiplier;
    const baseDirtyIncome = CASINO_BUILDING_CONFIG.baseDirtyIncomePerHour * levelMultiplier;
    const bonusCleanIncome = memberBonusTotal * CASINO_BUILDING_CONFIG.memberBonusCleanShare;
    const bonusDirtyIncome = memberBonusTotal * CASINO_BUILDING_CONFIG.memberBonusDirtyShare;
    const incomeMultiplier = Math.max(0, 1 + Math.max(0, Number(vipBoostPct || 0)) / 100);
    const hourlyCleanIncome = (baseCleanIncome + bonusCleanIncome) * incomeMultiplier;
    const hourlyDirtyIncome = (baseDirtyIncome + bonusDirtyIncome) * incomeMultiplier;
    return {
      memberSteps,
      memberBonusTotal,
      incomeMultiplier,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function syncCasinoIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getCasinoLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const vipActive = nowMs < Number(stateRef.effects.vipUntil || 0);
    const raidRiskActive = nowMs < Number(stateRef.effects.raidRiskUntil || 0);
    const vipBoostPct = vipActive ? CASINO_BUILDING_CONFIG.vipIncomeBoostPct * levelMultiplier : 0;
    const rates = calculateCasinoHourlyRates(totalGangMembers, levelMultiplier, vipBoostPct);

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      vipActive,
      raidRiskActive,
      vipBoostPct,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      },
      districtIncomeBoostPct
    };
  }

  function resolveCasinoBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getCasinoStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncCasinoIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistCasinoState(key, snapshot);

    const levelMultiplier = getCasinoLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < CASINO_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? CASINO_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const vipBoostPct = CASINO_BUILDING_CONFIG.vipIncomeBoostPct * levelMultiplier;
    const launderingPct = CASINO_BUILDING_CONFIG.launderingPct * levelMultiplier;
    const launderingRaidRiskPct = CASINO_BUILDING_CONFIG.launderingRaidRiskPct * levelMultiplier;
    const rates = syncResult.rates || calculateCasinoHourlyRates(totalGangMembers, levelMultiplier, 0);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    if (syncResult.vipActive) {
      effects.push(`VIP Turnaj (+${formatDecimalValue(vipBoostPct, 2)}% income, ${formatDurationLabel(snapshot.effects.vipUntil - now)})`);
    }
    if (syncResult.raidRiskActive) {
      effects.push(
        `Riziko razie +${formatDecimalValue(launderingRaidRiskPct, 2)}% (${formatDurationLabel(
          snapshot.effects.raidRiskUntil - now
        )})`
      );
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Kasino je vysokorychlostní finanční budova. Generuje čisté i špinavé peníze, reaguje na velikost gangu a přes akce umí krátkodobě akcelerovat výnos nebo převádět špinavé peníze na čisté. Upgrady zvyšují celkový income i sílu VIP a praní.",
      specialActions: [
        "VIP Turnaj: Cooldown 4h, trvá 2h, zvýší income kasina o +60 % (škáluje s levelem) a přidá +4 heat.",
        "Praní špinavých peněz: Cooldown 6h, vypere 15 % špinavých peněz (škáluje s levelem), přidá +6 heat a na 3h zvýší šanci policejní razie v districtu o 20 % (škáluje s levelem)."
      ],
      mechanics: {
        type: "casino",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: CASINO_BUILDING_CONFIG.baseHeatPerDay * levelMultiplier + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          vip: Math.max(0, Number(snapshot.cooldowns.vip || 0) - now),
          laundering: Math.max(0, Number(snapshot.cooldowns.laundering || 0) - now)
        },
        vipBoostPct,
        launderingPct,
        launderingRaidRiskPct,
        currentIncomeMultiplier: rates.incomeMultiplier,
        hourlyCleanIncome: rates.hourlyCleanIncome,
        hourlyDirtyIncome: rates.hourlyDirtyIncome,
        vipActive: syncResult.vipActive,
        raidRiskActive: syncResult.raidRiskActive
      }
    };
  }

  function handleCasinoBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getCasinoStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncCasinoIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getCasinoLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.vip);
      if (cooldownLeft > 0) {
        persistCasinoState(key, snapshot);
        return { ok: false, message: `VIP Turnaj je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      snapshot.effects.vipUntil = now + CASINO_BUILDING_CONFIG.actionDurations.vip;
      snapshot.cooldowns.vip = now + CASINO_BUILDING_CONFIG.actionCooldowns.vip;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + CASINO_BUILDING_CONFIG.actionHeatAdded.vip;
      persistCasinoState(key, snapshot);
      return {
        ok: true,
        message: `VIP Turnaj aktivní na 2h. Income kasina +${formatDecimalValue(
          CASINO_BUILDING_CONFIG.vipIncomeBoostPct * levelMultiplier,
          2
        )}% a heat +${CASINO_BUILDING_CONFIG.actionHeatAdded.vip}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.laundering);
      if (cooldownLeft > 0) {
        persistCasinoState(key, snapshot);
        return { ok: false, message: `Praní špinavých peněz je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }

      const launderingPct = CASINO_BUILDING_CONFIG.launderingPct * levelMultiplier;
      const launderingRaidRiskPct = CASINO_BUILDING_CONFIG.launderingRaidRiskPct * levelMultiplier;
      const launderDirty = window.Empire.UI?.launderDirtyCash;
      const launderedAmount = typeof launderDirty === "function" ? launderDirty(launderingPct / 100) : 0;

      snapshot.effects.raidRiskUntil = now + CASINO_BUILDING_CONFIG.actionDurations.launderingRaidRisk;
      snapshot.cooldowns.laundering = now + CASINO_BUILDING_CONFIG.actionCooldowns.laundering;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + CASINO_BUILDING_CONFIG.actionHeatAdded.laundering;
      persistCasinoState(key, snapshot);
      return {
        ok: true,
        message:
          `Praní špinavých peněz: převedeno $${Math.max(0, Math.floor(launderedAmount))} do čistých. `
          + `Riziko razie +${formatDecimalValue(launderingRaidRiskPct, 2)}% na 3h, heat +${CASINO_BUILDING_CONFIG.actionHeatAdded.laundering}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > CASINO_BUILDING_CONFIG.maxLevel) {
        persistCasinoState(key, snapshot);
        return { ok: false, message: "Kasino je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(CASINO_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistCasinoState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistCasinoState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistCasinoState(key, snapshot);
      return { ok: true, message: `Kasino vylepšeno na level ${nextLevel} za $${cost}.` };
    }

    persistCasinoState(key, snapshot);
    return null;
  }

  function calculateArcadeHourlyRates(
    totalGangMembers,
    levelMultiplier,
    { cleanBoostPct = 0, dirtyBoostPct = 0, dealDirtyBonusPerHour = 0 } = {}
  ) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const baseCleanIncome =
      (ARCADE_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * ARCADE_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseDirtyIncome =
      (ARCADE_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * ARCADE_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const currentCleanIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(cleanBoostPct || 0)) / 100);
    const currentDirtyIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(dirtyBoostPct || 0)) / 100);
    const hourlyCleanIncome = baseCleanIncome * currentCleanIncomeMultiplier;
    const hourlyDirtyIncome = baseDirtyIncome * currentDirtyIncomeMultiplier + Math.max(0, Number(dealDirtyBonusPerHour || 0));

    return {
      memberSteps,
      baseCleanIncome,
      baseDirtyIncome,
      currentCleanIncomeMultiplier,
      currentDirtyIncomeMultiplier,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function syncArcadeIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getArcadeLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const slotsActive = nowMs < Number(stateRef.effects.slotsUntil || 0);
    const backroomActive = nowMs < Number(stateRef.effects.backroomUntil || 0);
    const dealActive = nowMs < Number(stateRef.effects.dealUntil || 0);
    const cleanBoostPct = slotsActive ? ARCADE_BUILDING_CONFIG.actionBoosts.slotsCleanIncomePct * levelMultiplier : 0;
    const dirtyBoostPct = backroomActive ? ARCADE_BUILDING_CONFIG.actionBoosts.backroomDirtyIncomePct * levelMultiplier : 0;
    const dealDirtyBonusPerHour = dealActive ? ARCADE_BUILDING_CONFIG.actionBoosts.dealDirtyPerHour * levelMultiplier : 0;
    const rates = calculateArcadeHourlyRates(totalGangMembers, levelMultiplier, {
      cleanBoostPct,
      dirtyBoostPct,
      dealDirtyBonusPerHour
    });

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      slotsActive,
      backroomActive,
      dealActive,
      cleanBoostPct,
      dirtyBoostPct,
      dealDirtyBonusPerHour,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      },
      districtIncomeBoostPct
    };
  }

  function resolveArcadeBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getArcadeStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncArcadeIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistArcadeState(key, snapshot);

    const levelMultiplier = getArcadeLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < ARCADE_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? ARCADE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const dealDrugSalesPct = ARCADE_BUILDING_CONFIG.actionBoosts.dealDrugSalesPct * levelMultiplier;
    const backroomRaidRiskPct = ARCADE_BUILDING_CONFIG.raidRiskPcts.backroom * levelMultiplier;
    const dealRaidRiskPct = ARCADE_BUILDING_CONFIG.raidRiskPcts.deal * levelMultiplier;
    const rates = syncResult.rates || calculateArcadeHourlyRates(totalGangMembers, levelMultiplier);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;
    const hasDrugSalesTargets = playerOwnsDrugLabOrStreetDealers();
    const activeDrugSalesBoostPct = syncResult.dealActive && hasDrugSalesTargets ? dealDrugSalesPct : 0;
    const activeRaidRiskPct =
      (syncResult.backroomActive ? backroomRaidRiskPct : 0)
      + (syncResult.dealActive ? dealRaidRiskPct : 0);

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    if (syncResult.slotsActive) {
      effects.push(
        `Rozjet automaty (+${formatDecimalValue(syncResult.cleanBoostPct, 2)}% clean income, ${formatDurationLabel(
          snapshot.effects.slotsUntil - now
        )})`
      );
    }
    if (syncResult.backroomActive) {
      effects.push(
        `Zadní místnost (+${formatDecimalValue(syncResult.dirtyBoostPct, 2)}% dirty income, +${formatDecimalValue(
          backroomRaidRiskPct,
          2
        )}% riziko razie, ${formatDurationLabel(snapshot.effects.backroomUntil - now)})`
      );
    }
    if (syncResult.dealActive) {
      const drugBonusLabel = hasDrugSalesTargets
        ? `Drug Lab/Pouliční dealeři +${formatDecimalValue(dealDrugSalesPct, 2)}%`
        : "Drug Lab/Pouliční dealeři: bonus se neaplikuje (nevlastníš je)";
      effects.push(
        `Deal přes automaty (+$${formatDecimalValue(syncResult.dealDirtyBonusPerHour, 2)} dirty/h, ${drugBonusLabel}, `
          + `+${formatDecimalValue(dealRaidRiskPct, 2)}% riziko razie, ${formatDurationLabel(snapshot.effects.dealUntil - now)})`
      );
    }
    if (activeRaidRiskPct > 0) {
      effects.push(`Celkové riziko razie +${formatDecimalValue(activeRaidRiskPct, 2)}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Herna je hybridní ekonomická budova: dává legální i dirty cash, profituje z velikosti gangu a přes akce umí krátkodobě tlačit clean/dirty income nebo napojit automatovou síť na drogový byznys. Upgrady škálují oba příjmy i sílu všech akcí.",
      specialActions: [
        "Rozjet automaty: Cooldown 4h, trvá 2h, zvýší legální income herny o +50 % (škáluje s levelem) a přidá +3 heat.",
        "Zadní místnost: Cooldown 6h, trvá 2h, zvýší dirty income herny o +75 % (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko policejní razie v districtu o +10 % (škáluje s levelem).",
        "Deal přes automaty: Cooldown 5h, trvá 2h, přidá herně +20 dirty cash/h (škáluje s levelem), a pokud vlastníš Drug Lab nebo Pouliční dealery, zvýší jejich prodej drog o +25 % (škáluje s levelem); zároveň přidá +6 heat a +15 % riziko razie na 2h (škáluje s levelem)."
      ],
      mechanics: {
        type: "arcade",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: ARCADE_BUILDING_CONFIG.baseHeatPerDay * levelMultiplier + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          slots: Math.max(0, Number(snapshot.cooldowns.slots || 0) - now),
          backroom: Math.max(0, Number(snapshot.cooldowns.backroom || 0) - now),
          deal: Math.max(0, Number(snapshot.cooldowns.deal || 0) - now)
        },
        dealDrugSalesPct,
        activeDrugSalesBoostPct,
        hasDrugSalesTargets,
        currentCleanIncomeMultiplier: rates.currentCleanIncomeMultiplier,
        currentDirtyIncomeMultiplier: rates.currentDirtyIncomeMultiplier,
        dealDirtyBonusPerHour: syncResult.dealDirtyBonusPerHour,
        activeRaidRiskPct,
        slotsActive: syncResult.slotsActive,
        backroomActive: syncResult.backroomActive,
        dealActive: syncResult.dealActive
      }
    };
  }

  function handleArcadeBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getArcadeStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncArcadeIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getArcadeLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.slots);
      if (cooldownLeft > 0) {
        persistArcadeState(key, snapshot);
        return { ok: false, message: `Rozjet automaty je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const cleanBoostPct = ARCADE_BUILDING_CONFIG.actionBoosts.slotsCleanIncomePct * levelMultiplier;
      snapshot.effects.slotsUntil = now + ARCADE_BUILDING_CONFIG.actionDurations.slots;
      snapshot.cooldowns.slots = now + ARCADE_BUILDING_CONFIG.actionCooldowns.slots;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + ARCADE_BUILDING_CONFIG.actionHeatAdded.slots;
      persistArcadeState(key, snapshot);
      return {
        ok: true,
        message: `Rozjet automaty aktivní na 2h. Clean income herny +${formatDecimalValue(cleanBoostPct, 2)}%, heat +${ARCADE_BUILDING_CONFIG.actionHeatAdded.slots}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.backroom);
      if (cooldownLeft > 0) {
        persistArcadeState(key, snapshot);
        return { ok: false, message: `Zadní místnost je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const dirtyBoostPct = ARCADE_BUILDING_CONFIG.actionBoosts.backroomDirtyIncomePct * levelMultiplier;
      const raidRiskPct = ARCADE_BUILDING_CONFIG.raidRiskPcts.backroom * levelMultiplier;
      snapshot.effects.backroomUntil = now + ARCADE_BUILDING_CONFIG.actionDurations.backroom;
      snapshot.cooldowns.backroom = now + ARCADE_BUILDING_CONFIG.actionCooldowns.backroom;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + ARCADE_BUILDING_CONFIG.actionHeatAdded.backroom;
      persistArcadeState(key, snapshot);
      return {
        ok: true,
        message: `Zadní místnost aktivní na 2h. Dirty income +${formatDecimalValue(dirtyBoostPct, 2)}%, riziko razie +${formatDecimalValue(
          raidRiskPct,
          2
        )}%, heat +${ARCADE_BUILDING_CONFIG.actionHeatAdded.backroom}.`
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.deal);
      if (cooldownLeft > 0) {
        persistArcadeState(key, snapshot);
        return { ok: false, message: `Deal přes automaty je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const dealDirtyBonus = ARCADE_BUILDING_CONFIG.actionBoosts.dealDirtyPerHour * levelMultiplier;
      const dealDrugSalesPct = ARCADE_BUILDING_CONFIG.actionBoosts.dealDrugSalesPct * levelMultiplier;
      const raidRiskPct = ARCADE_BUILDING_CONFIG.raidRiskPcts.deal * levelMultiplier;
      const hasTargets = playerOwnsDrugLabOrStreetDealers();
      snapshot.effects.dealUntil = now + ARCADE_BUILDING_CONFIG.actionDurations.deal;
      snapshot.cooldowns.deal = now + ARCADE_BUILDING_CONFIG.actionCooldowns.deal;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0)) + ARCADE_BUILDING_CONFIG.actionHeatAdded.deal;
      persistArcadeState(key, snapshot);
      return {
        ok: true,
        message:
          `Deal přes automaty aktivní na 2h. Herna +$${formatDecimalValue(dealDirtyBonus, 2)} dirty/h, `
          + `${hasTargets ? `Drug Lab/Pouliční dealeři +${formatDecimalValue(dealDrugSalesPct, 2)}% prodej drog, ` : "bonus prodeje drog se neaplikuje (nevlastníš Drug Lab ani Pouliční dealery), "}`
          + `riziko razie +${formatDecimalValue(raidRiskPct, 2)}%, heat +${ARCADE_BUILDING_CONFIG.actionHeatAdded.deal}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > ARCADE_BUILDING_CONFIG.maxLevel) {
        persistArcadeState(key, snapshot);
        return { ok: false, message: "Herna je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(ARCADE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistArcadeState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistArcadeState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistArcadeState(key, snapshot);
      return { ok: true, message: `Herna vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistArcadeState(key, snapshot);
    return null;
  }

  function calculateAutoSalonHourlyRates(
    totalGangMembers,
    levelMultiplier,
    { cleanBoostPct = 0, dirtyBoostPct = 0, fleetCleanBonusPerHour = 0 } = {}
  ) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const baseCleanIncome =
      (AUTO_SALON_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * AUTO_SALON_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseDirtyIncome =
      (AUTO_SALON_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * AUTO_SALON_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const currentCleanIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(cleanBoostPct || 0)) / 100);
    const currentDirtyIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(dirtyBoostPct || 0)) / 100);
    const hourlyCleanIncome =
      baseCleanIncome * currentCleanIncomeMultiplier + Math.max(0, Number(fleetCleanBonusPerHour || 0));
    const hourlyDirtyIncome = baseDirtyIncome * currentDirtyIncomeMultiplier;

    return {
      memberSteps,
      baseCleanIncome,
      baseDirtyIncome,
      currentCleanIncomeMultiplier,
      currentDirtyIncomeMultiplier,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function syncAutoSalonIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getAutoSalonLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const premiumOfferActive = nowMs < Number(stateRef.effects.premiumOfferUntil || 0);
    const grayImportActive = nowMs < Number(stateRef.effects.grayImportUntil || 0);
    const fleetActive = nowMs < Number(stateRef.effects.fleetUntil || 0);
    const cleanBoostPct = premiumOfferActive
      ? AUTO_SALON_BUILDING_CONFIG.actionBoosts.premiumOfferCleanIncomePct * levelMultiplier
      : 0;
    const dirtyBoostPct = grayImportActive
      ? AUTO_SALON_BUILDING_CONFIG.actionBoosts.grayImportDirtyIncomePct * levelMultiplier
      : 0;
    const fleetCleanBonusPerHour = fleetActive
      ? AUTO_SALON_BUILDING_CONFIG.actionBoosts.fleetCleanBonusPerHour * levelMultiplier
      : 0;

    const rates = calculateAutoSalonHourlyRates(totalGangMembers, levelMultiplier, {
      cleanBoostPct,
      dirtyBoostPct,
      fleetCleanBonusPerHour
    });

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    applyBuildingInfluenceTick(stateRef, nowMs, AUTO_SALON_BUILDING_CONFIG.baseInfluencePerHour);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      premiumOfferActive,
      grayImportActive,
      fleetActive,
      cleanBoostPct,
      dirtyBoostPct,
      fleetCleanBonusPerHour,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      },
      districtIncomeBoostPct
    };
  }

  function resolveAutoSalonBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getAutoSalonStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncAutoSalonIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistAutoSalonState(key, snapshot);

    const levelMultiplier = getAutoSalonLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < AUTO_SALON_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? AUTO_SALON_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const fleetLogisticsPct = AUTO_SALON_BUILDING_CONFIG.actionBoosts.fleetLogisticsPct * levelMultiplier;
    const grayImportRaidRiskPct = AUTO_SALON_BUILDING_CONFIG.raidRiskPcts.grayImport * levelMultiplier;
    const rates = syncResult.rates || calculateAutoSalonHourlyRates(totalGangMembers, levelMultiplier);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;
    const hasLogisticsTargets = playerOwnsFleetLogisticsTargets();
    const activeLogisticsBoostPct = syncResult.fleetActive && hasLogisticsTargets ? fleetLogisticsPct : 0;
    const activeRaidRiskPct = syncResult.grayImportActive ? grayImportRaidRiskPct : 0;

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    if (syncResult.premiumOfferActive) {
      effects.push(
        `Prémiová nabídka (+${formatDecimalValue(syncResult.cleanBoostPct, 2)}% clean income, ${formatDurationLabel(
          snapshot.effects.premiumOfferUntil - now
        )})`
      );
    }
    if (syncResult.grayImportActive) {
      effects.push(
        `Šedý dovoz (+${formatDecimalValue(syncResult.dirtyBoostPct, 2)}% dirty income, +${formatDecimalValue(
          grayImportRaidRiskPct,
          2
        )}% riziko razie, ${formatDurationLabel(snapshot.effects.grayImportUntil - now)})`
      );
    }
    if (syncResult.fleetActive) {
      const logisticsLabel = hasLogisticsTargets
        ? `Garage/Taxi služba/Pašovací tunel +${formatDecimalValue(fleetLogisticsPct, 2)}% efektivita`
        : "Logistický bonus se neaplikuje (nevlastníš Garage/Taxi služba/Pašovací tunel)";
      effects.push(
        `Rychlá flotila (+$${formatDecimalValue(syncResult.fleetCleanBonusPerHour, 2)} clean/h, ${logisticsLabel}, ${formatDurationLabel(
          snapshot.effects.fleetUntil - now
        )})`
      );
    }
    if (activeRaidRiskPct > 0) {
      effects.push(`Celkové riziko razie +${formatDecimalValue(activeRaidRiskPct, 2)}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Autosalon je logisticko-ekonomická budova s čistým i dirty cashflow. Generuje silný legální příjem, stabilní dirty příjem a přes akce umí krátkodobě zesílit prodeje, šedý dovoz i mobilitu flotily. Upgrady škálují příjmy, sílu akcí i logistické bonusy.",
      specialActions: [
        "Prémiová nabídka: Cooldown 4h, trvá 2h, zvýší legální income autosalonu o +50 % (škáluje s levelem) a přidá +2 heat.",
        "Šedý dovoz: Cooldown 6h, trvá 2h, zvýší dirty income autosalonu o +80 % (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko policejní razie v districtu o +10 % (škáluje s levelem).",
        "Rychlá flotila: Cooldown 5h, trvá 2h, přidá autosalonu +15 clean cash/h (škáluje s levelem), a pokud vlastníš Garage, Taxi služba nebo Pašovací tunel, zvýší jejich efektivitu o +20 % (škáluje s levelem); zároveň přidá +3 heat."
      ],
      mechanics: {
        type: "auto-salon",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: AUTO_SALON_BUILDING_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          premiumOffer: Math.max(0, Number(snapshot.cooldowns.premiumOffer || 0) - now),
          grayImport: Math.max(0, Number(snapshot.cooldowns.grayImport || 0) - now),
          fleet: Math.max(0, Number(snapshot.cooldowns.fleet || 0) - now)
        },
        fleetLogisticsPct,
        activeLogisticsBoostPct,
        hasLogisticsTargets,
        currentCleanIncomeMultiplier: rates.currentCleanIncomeMultiplier,
        currentDirtyIncomeMultiplier: rates.currentDirtyIncomeMultiplier,
        fleetCleanBonusPerHour: syncResult.fleetCleanBonusPerHour,
        activeRaidRiskPct,
        premiumOfferActive: syncResult.premiumOfferActive,
        grayImportActive: syncResult.grayImportActive,
        fleetActive: syncResult.fleetActive
      }
    };
  }

  function handleAutoSalonBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getAutoSalonStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncAutoSalonIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getAutoSalonLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.premiumOffer);
      if (cooldownLeft > 0) {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: `Prémiová nabídka je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const cleanBoostPct = AUTO_SALON_BUILDING_CONFIG.actionBoosts.premiumOfferCleanIncomePct * levelMultiplier;
      snapshot.effects.premiumOfferUntil = now + AUTO_SALON_BUILDING_CONFIG.actionDurations.premiumOffer;
      snapshot.cooldowns.premiumOffer = now + AUTO_SALON_BUILDING_CONFIG.actionCooldowns.premiumOffer;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.premiumOffer;
      persistAutoSalonState(key, snapshot);
      return {
        ok: true,
        message: `Prémiová nabídka aktivní na 2h. Clean income autosalonu +${formatDecimalValue(cleanBoostPct, 2)}%, heat +${AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.premiumOffer}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.grayImport);
      if (cooldownLeft > 0) {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: `Šedý dovoz je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const dirtyBoostPct = AUTO_SALON_BUILDING_CONFIG.actionBoosts.grayImportDirtyIncomePct * levelMultiplier;
      const raidRiskPct = AUTO_SALON_BUILDING_CONFIG.raidRiskPcts.grayImport * levelMultiplier;
      snapshot.effects.grayImportUntil = now + AUTO_SALON_BUILDING_CONFIG.actionDurations.grayImport;
      snapshot.cooldowns.grayImport = now + AUTO_SALON_BUILDING_CONFIG.actionCooldowns.grayImport;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.grayImport;
      persistAutoSalonState(key, snapshot);
      return {
        ok: true,
        message: `Šedý dovoz aktivní na 2h. Dirty income +${formatDecimalValue(dirtyBoostPct, 2)}%, riziko razie +${formatDecimalValue(
          raidRiskPct,
          2
        )}%, heat +${AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.grayImport}.`
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.fleet);
      if (cooldownLeft > 0) {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: `Rychlá flotila je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const fleetCleanBonus = AUTO_SALON_BUILDING_CONFIG.actionBoosts.fleetCleanBonusPerHour * levelMultiplier;
      const fleetLogisticsPct = AUTO_SALON_BUILDING_CONFIG.actionBoosts.fleetLogisticsPct * levelMultiplier;
      const hasTargets = playerOwnsFleetLogisticsTargets();
      snapshot.effects.fleetUntil = now + AUTO_SALON_BUILDING_CONFIG.actionDurations.fleet;
      snapshot.cooldowns.fleet = now + AUTO_SALON_BUILDING_CONFIG.actionCooldowns.fleet;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.fleet;
      persistAutoSalonState(key, snapshot);
      return {
        ok: true,
        message:
          `Rychlá flotila aktivní na 2h. Autosalon +$${formatDecimalValue(fleetCleanBonus, 2)} clean/h, `
          + `${hasTargets ? `Garage/Taxi služba/Pašovací tunel +${formatDecimalValue(fleetLogisticsPct, 2)}% efektivita, ` : "logistický bonus se neaplikuje (nevlastníš cílové budovy), "}`
          + `heat +${AUTO_SALON_BUILDING_CONFIG.actionHeatAdded.fleet}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > AUTO_SALON_BUILDING_CONFIG.maxLevel) {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: "Autosalon je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(AUTO_SALON_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistAutoSalonState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistAutoSalonState(key, snapshot);
      return { ok: true, message: `Autosalon vylepšen na level ${nextLevel} za $${cost}.` };
    }

    persistAutoSalonState(key, snapshot);
    return null;
  }

  function calculateExchangeHourlyRates(
    totalGangMembers,
    levelMultiplier,
    { favorableRateBoostPct = 0 } = {}
  ) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const baseCleanIncome =
      (EXCHANGE_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * EXCHANGE_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseDirtyIncome =
      (EXCHANGE_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * EXCHANGE_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const currentCleanIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(favorableRateBoostPct || 0)) / 100);
    const hourlyCleanIncome = baseCleanIncome * currentCleanIncomeMultiplier;
    const hourlyDirtyIncome = baseDirtyIncome;

    return {
      memberSteps,
      baseCleanIncome,
      baseDirtyIncome,
      currentCleanIncomeMultiplier,
      currentDirtyIncomeMultiplier: 1,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function syncExchangeIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getExchangeLevelMultiplier(stateRef.level);
    const favorableRateActive = nowMs < Number(stateRef.effects.favorableRateUntil || 0);
    const silentTransferRiskActive = nowMs < Number(stateRef.effects.silentTransferRiskUntil || 0);
    const financialNetworkActive = nowMs < Number(stateRef.effects.financialNetworkUntil || 0);
    const favorableRateBoostPct = favorableRateActive
      ? EXCHANGE_BUILDING_CONFIG.actionBoosts.favorableRateCleanIncomePct * levelMultiplier
      : 0;
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const rates = calculateExchangeHourlyRates(totalGangMembers, levelMultiplier, { favorableRateBoostPct });

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    applyBuildingInfluenceTick(stateRef, nowMs, EXCHANGE_BUILDING_CONFIG.baseInfluencePerHour);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      favorableRateActive,
      silentTransferRiskActive,
      financialNetworkActive,
      favorableRateBoostPct,
      districtIncomeBoostPct,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      }
    };
  }

  function resolveExchangeBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getExchangeStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncExchangeIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistExchangeState(key, snapshot);

    const levelMultiplier = getExchangeLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < EXCHANGE_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? EXCHANGE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const silentTransferPct = EXCHANGE_BUILDING_CONFIG.actionBoosts.silentTransferPct * levelMultiplier;
    const districtIncomeBonusPct = EXCHANGE_BUILDING_CONFIG.actionBoosts.districtIncomeBonusPct * levelMultiplier;
    const silentTransferRaidRiskPct = EXCHANGE_BUILDING_CONFIG.raidRiskPcts.silentTransfer * levelMultiplier;
    const rates = syncResult.rates || calculateExchangeHourlyRates(totalGangMembers, levelMultiplier);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    if (syncResult.favorableRateActive) {
      effects.push(
        `Výhodný kurz (+${formatDecimalValue(syncResult.favorableRateBoostPct, 2)}% clean income, ${formatDurationLabel(
          snapshot.effects.favorableRateUntil - now
        )})`
      );
    }
    if (syncResult.silentTransferRiskActive) {
      effects.push(
        `Tichý převod (+${formatDecimalValue(silentTransferRaidRiskPct, 2)}% riziko razie, ${formatDurationLabel(
          snapshot.effects.silentTransferRiskUntil - now
        )})`
      );
    }
    if (syncResult.financialNetworkActive) {
      effects.push(
        `Finanční síť (+${formatDecimalValue(districtIncomeBonusPct, 2)}% district income, ${formatDurationLabel(
          snapshot.effects.financialNetworkUntil - now
        )})`
      );
    }
    if (syncResult.districtIncomeBoostPct > 0) {
      effects.push(`Celkový district income boost +${formatDecimalValue(syncResult.districtIncomeBoostPct, 2)}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Směnárna je finanční utility budova pro převody cashflow. Dává stabilní clean/dirty příjem, průběžně přidává vliv a přes akce umí krátkodobě zesílit clean příjem, provést konverzi dirty cash a vytvořit districtový cash boost pro všechny income budovy.",
      specialActions: [
        "Výhodný kurz: Cooldown 4h, trvá 2h, zvýší legální income směnárny o +40 % (škáluje s levelem) a přidá +2 heat.",
        "Tichý převod: Cooldown 6h, okamžitě převede 12 % dirty cash na clean cash (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko razie v districtu o +10 % (škáluje s levelem).",
        "Finanční síť: Cooldown 5h, trvá 2h, zvýší cash income všech income budov v districtu o +15 % (škáluje s levelem) a přidá +3 heat."
      ],
      mechanics: {
        type: "exchange",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: EXCHANGE_BUILDING_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          favorableRate: Math.max(0, Number(snapshot.cooldowns.favorableRate || 0) - now),
          silentTransfer: Math.max(0, Number(snapshot.cooldowns.silentTransfer || 0) - now),
          financialNetwork: Math.max(0, Number(snapshot.cooldowns.financialNetwork || 0) - now)
        },
        silentTransferPct,
        districtIncomeBonusPct,
        currentCleanIncomeMultiplier: rates.currentCleanIncomeMultiplier,
        currentDirtyIncomeMultiplier: rates.currentDirtyIncomeMultiplier,
        districtIncomeBoostPct: syncResult.districtIncomeBoostPct,
        favorableRateActive: syncResult.favorableRateActive,
        silentTransferRiskActive: syncResult.silentTransferRiskActive,
        financialNetworkActive: syncResult.financialNetworkActive
      }
    };
  }

  function handleExchangeBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getExchangeStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncExchangeIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getExchangeLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.favorableRate);
      if (cooldownLeft > 0) {
        persistExchangeState(key, snapshot);
        return { ok: false, message: `Výhodný kurz je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const cleanBoostPct = EXCHANGE_BUILDING_CONFIG.actionBoosts.favorableRateCleanIncomePct * levelMultiplier;
      snapshot.effects.favorableRateUntil = now + EXCHANGE_BUILDING_CONFIG.actionDurations.favorableRate;
      snapshot.cooldowns.favorableRate = now + EXCHANGE_BUILDING_CONFIG.actionCooldowns.favorableRate;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + EXCHANGE_BUILDING_CONFIG.actionHeatAdded.favorableRate;
      persistExchangeState(key, snapshot);
      return {
        ok: true,
        message: `Výhodný kurz aktivní na 2h. Clean income směnárny +${formatDecimalValue(cleanBoostPct, 2)}%, heat +${EXCHANGE_BUILDING_CONFIG.actionHeatAdded.favorableRate}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.silentTransfer);
      if (cooldownLeft > 0) {
        persistExchangeState(key, snapshot);
        return { ok: false, message: `Tichý převod je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const silentTransferPct = EXCHANGE_BUILDING_CONFIG.actionBoosts.silentTransferPct * levelMultiplier;
      const raidRiskPct = EXCHANGE_BUILDING_CONFIG.raidRiskPcts.silentTransfer * levelMultiplier;
      const launderDirty = window.Empire.UI?.launderDirtyCash;
      const convertedAmount = typeof launderDirty === "function" ? launderDirty(silentTransferPct / 100) : 0;
      snapshot.effects.silentTransferRiskUntil = now + EXCHANGE_BUILDING_CONFIG.actionDurations.silentTransferRisk;
      snapshot.cooldowns.silentTransfer = now + EXCHANGE_BUILDING_CONFIG.actionCooldowns.silentTransfer;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + EXCHANGE_BUILDING_CONFIG.actionHeatAdded.silentTransfer;
      persistExchangeState(key, snapshot);
      return {
        ok: true,
        message:
          `Tichý převod: převedeno $${Math.max(0, Math.floor(convertedAmount))} do čistých. `
          + `Riziko razie +${formatDecimalValue(raidRiskPct, 2)}% na 2h, heat +${EXCHANGE_BUILDING_CONFIG.actionHeatAdded.silentTransfer}.`
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.financialNetwork);
      if (cooldownLeft > 0) {
        persistExchangeState(key, snapshot);
        return { ok: false, message: `Finanční síť je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const districtIncomeBonusPct = EXCHANGE_BUILDING_CONFIG.actionBoosts.districtIncomeBonusPct * levelMultiplier;
      snapshot.effects.financialNetworkUntil = now + EXCHANGE_BUILDING_CONFIG.actionDurations.financialNetwork;
      snapshot.cooldowns.financialNetwork = now + EXCHANGE_BUILDING_CONFIG.actionCooldowns.financialNetwork;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + EXCHANGE_BUILDING_CONFIG.actionHeatAdded.financialNetwork;
      persistExchangeState(key, snapshot);
      return {
        ok: true,
        message: `Finanční síť aktivní na 2h. District income budov +${formatDecimalValue(districtIncomeBonusPct, 2)}%, heat +${EXCHANGE_BUILDING_CONFIG.actionHeatAdded.financialNetwork}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > EXCHANGE_BUILDING_CONFIG.maxLevel) {
        persistExchangeState(key, snapshot);
        return { ok: false, message: "Směnárna je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(EXCHANGE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistExchangeState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistExchangeState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistExchangeState(key, snapshot);
      return { ok: true, message: `Směnárna vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistExchangeState(key, snapshot);
    return null;
  }

  function calculateRestaurantHourlyRates(
    totalGangMembers,
    levelMultiplier,
    { happyHourBoostPct = 0, backTableCleanPenaltyPct = 0 } = {}
  ) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const baseCleanIncome =
      (RESTAURANT_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * RESTAURANT_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseDirtyIncome =
      (RESTAURANT_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * RESTAURANT_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const cleanBoostMultiplier = Math.max(0, 1 + Math.max(0, Number(happyHourBoostPct || 0)) / 100);
    const cleanPenaltyMultiplier = Math.max(0, 1 - Math.max(0, Number(backTableCleanPenaltyPct || 0)) / 100);
    const currentCleanIncomeMultiplier = cleanBoostMultiplier * cleanPenaltyMultiplier;
    const hourlyCleanIncome = baseCleanIncome * currentCleanIncomeMultiplier;
    const hourlyDirtyIncome = baseDirtyIncome;

    return {
      memberSteps,
      baseCleanIncome,
      baseDirtyIncome,
      currentCleanIncomeMultiplier,
      currentDirtyIncomeMultiplier: 1,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function buildDistrictGossipText(targetDistrict) {
    const districtLabel = resolveDistrictNumberLabel(targetDistrict);
    const templates = [
      (label) => `V districtu ${label} došlo ke krádeži zásob ve skladu.`,
      (label) => `V districtu ${label} se v noci objevilo více pouličních dealerů.`,
      (label) => `V districtu ${label} proběhla policejní kontrola u herny.`,
      (label) => `V districtu ${label} někdo rozšiřuje vliv přes restaurace a lobby kluby.`,
      (label) => `V districtu ${label} byl zaznamenán zvýšený pohyb dodávek z drug labu.`,
      (label) => `V districtu ${label} se mluví o přesunu hotovosti přes noční podniky.`,
      (label) => `V districtu ${label} se objevily nové kontakty na černý trh.`,
      (label) => `V districtu ${label} se řeší tichá válka o zásobovací trasy.`
    ];
    const index = Math.max(0, Math.floor(Math.random() * templates.length)) % templates.length;
    return templates[index](districtLabel);
  }

  function generateRestaurantDistrictGossips(sourceDistrict, rumorCount, now = Date.now()) {
    const safeCount = Math.max(0, Math.floor(Number(rumorCount) || 0));
    if (safeCount <= 0) return [];
    const districts = Array.isArray(state.districts) ? state.districts.filter(Boolean) : [];
    if (!districts.length) return [];

    const sourceId = sourceDistrict && typeof sourceDistrict === "object"
      ? sourceDistrict.id
      : sourceDistrict ?? null;
    const candidateDistricts = districts.filter((district) => String(district?.id) !== String(sourceId));
    const pool = candidateDistricts.length ? candidateDistricts : districts;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }

    const created = [];
    for (let i = 0; i < safeCount; i += 1) {
      const district = shuffled[i % shuffled.length];
      if (!district) continue;
      const text = buildDistrictGossipText(district);
      const entry = appendDistrictGossip(district, text, {
        createdAt: now + i,
        sourceBuilding: RESTAURANT_BUILDING_NAME,
        sourceDistrictId: sourceId
      });
      if (entry) {
        created.push({
          ...entry,
          districtId: district.id,
          districtName: district.name || `Distrikt #${resolveDistrictNumberLabel(district)}`
        });
      }
    }
    return created;
  }

  function generateConvenienceStoreLocalGossip(sourceDistrict, now = Date.now()) {
    const districts = Array.isArray(state.districts) ? state.districts.filter(Boolean) : [];
    if (!districts.length) return null;
    const sourceRecord = resolveDistrictRecord(sourceDistrict);
    const sourceId = sourceRecord?.id ?? (sourceDistrict && typeof sourceDistrict === "object" ? sourceDistrict.id : sourceDistrict);
    const preferredSource = sourceRecord && Math.random() < 0.5 ? sourceRecord : null;

    let targetDistrict = preferredSource;
    if (!targetDistrict) {
      const pool = sourceRecord && districts.length > 1
        ? districts.filter((district) => String(district?.id) !== String(sourceRecord.id))
        : districts;
      const pickPool = pool.length ? pool : districts;
      targetDistrict = pickPool[Math.floor(Math.random() * pickPool.length)] || sourceRecord || districts[0] || null;
    }
    if (!targetDistrict) return null;

    const text = buildDistrictGossipText(targetDistrict);
    const entry = appendDistrictGossip(targetDistrict, text, {
      createdAt: now,
      sourceBuilding: CONVENIENCE_STORE_BUILDING_NAME,
      sourceDistrictId: sourceId ?? null
    });
    if (!entry) return null;
    return {
      ...entry,
      districtId: targetDistrict.id,
      districtName: targetDistrict.name || `Distrikt #${resolveDistrictNumberLabel(targetDistrict)}`
    };
  }

  function syncRestaurantIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getRestaurantLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const happyHourActive = nowMs < Number(stateRef.effects.happyHourUntil || 0);
    const backTableActive = nowMs < Number(stateRef.effects.backTableUntil || 0);
    const happyHourBoostPct = happyHourActive
      ? RESTAURANT_BUILDING_CONFIG.actionBoosts.happyHourCleanIncomePct * levelMultiplier
      : 0;
    const backTableInfluenceBoostPct = backTableActive
      ? RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableInfluenceBoostPct * levelMultiplier
      : 0;
    const backTableCleanPenaltyPct = backTableActive
      ? RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableCleanIncomePenaltyPct * levelMultiplier
      : 0;
    const rates = calculateRestaurantHourlyRates(totalGangMembers, levelMultiplier, {
      happyHourBoostPct,
      backTableCleanPenaltyPct
    });

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    const currentInfluencePerHour = RESTAURANT_BUILDING_CONFIG.baseInfluencePerHour
      * levelMultiplier
      * (1 + Math.max(0, backTableInfluenceBoostPct) / 100);
    applyBuildingInfluenceTick(stateRef, nowMs, currentInfluencePerHour);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      happyHourActive,
      backTableActive,
      happyHourBoostPct,
      backTableInfluenceBoostPct,
      backTableCleanPenaltyPct,
      currentInfluencePerHour,
      districtIncomeBoostPct,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      }
    };
  }

  function resolveRestaurantBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getRestaurantStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncRestaurantIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistRestaurantState(key, snapshot);

    const levelMultiplier = getRestaurantLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < RESTAURANT_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? RESTAURANT_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const happyHourBoostPct = RESTAURANT_BUILDING_CONFIG.actionBoosts.happyHourCleanIncomePct * levelMultiplier;
    const backTableInfluenceBoostPct =
      RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableInfluenceBoostPct * levelMultiplier;
    const backTableCleanPenaltyPct =
      RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableCleanIncomePenaltyPct * levelMultiplier;
    const birthdayPartyRumorCount = Math.max(
      2,
      Math.round(RESTAURANT_BUILDING_CONFIG.actionBoosts.birthdayPartyRumorCount * levelMultiplier)
    );
    const rates = syncResult.rates || calculateRestaurantHourlyRates(totalGangMembers, levelMultiplier);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    effects.push(`Vliv +${formatDecimalValue(syncResult.currentInfluencePerHour, 2)} / h`);
    if (syncResult.happyHourActive) {
      effects.push(
        `Happy Hour (+${formatDecimalValue(syncResult.happyHourBoostPct, 2)}% clean income, ${formatDurationLabel(
          snapshot.effects.happyHourUntil - now
        )})`
      );
    }
    if (syncResult.backTableActive) {
      effects.push(
        `Zadní stůl (+${formatDecimalValue(syncResult.backTableInfluenceBoostPct, 2)}% vliv, -${formatDecimalValue(
          syncResult.backTableCleanPenaltyPct,
          2
        )}% clean income, ${formatDurationLabel(snapshot.effects.backTableUntil - now)})`
      );
    }
    if (syncResult.districtIncomeBoostPct > 0) {
      effects.push(`Celkový district income boost +${formatDecimalValue(syncResult.districtIncomeBoostPct, 2)}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Restaurace je nízko-heat hybridní budova pro stabilní clean i dirty cashflow a postupný růst vlivu. Akce Happy Hour krátkodobě posílí legální příjem, Zadní stůl přesune provoz na intenzivní vliv a Narozeninová párty dodává drby z podsvětí napříč městem.",
      specialActions: [
        "Happy Hour: Cooldown 4h, trvá 2h, zvýší legální income restaurace o +35 % (škáluje s levelem) a přidá +1 heat.",
        "Zadní stůl: Cooldown 5h, trvá 2h, zvýší produkci vlivu restaurace o +100 % (škáluje s levelem), ale během efektu má restaurace o 15 % nižší legální income (škáluje s levelem).",
        "Narozeninová párty: Cooldown 2h, okamžitě vygeneruje 2 drby (škáluje s levelem), drby se hned zobrazí hráči a uloží se do historie příslušných districtů."
      ],
      mechanics: {
        type: "restaurant",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: RESTAURANT_BUILDING_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          happyHour: Math.max(0, Number(snapshot.cooldowns.happyHour || 0) - now),
          backTable: Math.max(0, Number(snapshot.cooldowns.backTable || 0) - now),
          birthdayParty: Math.max(0, Number(snapshot.cooldowns.birthdayParty || 0) - now)
        },
        happyHourBoostPct,
        backTableInfluenceBoostPct,
        backTableCleanPenaltyPct,
        birthdayPartyRumorCount,
        currentCleanIncomeMultiplier: rates.currentCleanIncomeMultiplier,
        currentDirtyIncomeMultiplier: rates.currentDirtyIncomeMultiplier,
        currentInfluenceMultiplier: Math.max(0, 1 + backTableInfluenceBoostPct / 100),
        districtIncomeBoostPct: syncResult.districtIncomeBoostPct,
        happyHourActive: syncResult.happyHourActive,
        backTableActive: syncResult.backTableActive
      }
    };
  }

  function handleRestaurantBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getRestaurantStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncRestaurantIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getRestaurantLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.happyHour);
      if (cooldownLeft > 0) {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: `Happy Hour je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const cleanBoostPct = RESTAURANT_BUILDING_CONFIG.actionBoosts.happyHourCleanIncomePct * levelMultiplier;
      snapshot.effects.happyHourUntil = now + RESTAURANT_BUILDING_CONFIG.actionDurations.happyHour;
      snapshot.cooldowns.happyHour = now + RESTAURANT_BUILDING_CONFIG.actionCooldowns.happyHour;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + RESTAURANT_BUILDING_CONFIG.actionHeatAdded.happyHour;
      persistRestaurantState(key, snapshot);
      return {
        ok: true,
        message: `Happy Hour aktivní na 2h. Clean income restaurace +${formatDecimalValue(cleanBoostPct, 2)}%, heat +${RESTAURANT_BUILDING_CONFIG.actionHeatAdded.happyHour}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.backTable);
      if (cooldownLeft > 0) {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: `Zadní stůl je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const influenceBoostPct = RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableInfluenceBoostPct * levelMultiplier;
      const cleanPenaltyPct = RESTAURANT_BUILDING_CONFIG.actionBoosts.backTableCleanIncomePenaltyPct * levelMultiplier;
      snapshot.effects.backTableUntil = now + RESTAURANT_BUILDING_CONFIG.actionDurations.backTable;
      snapshot.cooldowns.backTable = now + RESTAURANT_BUILDING_CONFIG.actionCooldowns.backTable;
      persistRestaurantState(key, snapshot);
      return {
        ok: true,
        message:
          `Zadní stůl aktivní na 2h. Vliv restaurace +${formatDecimalValue(influenceBoostPct, 2)}%, `
          + `clean income -${formatDecimalValue(cleanPenaltyPct, 2)}%.`
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.birthdayParty);
      if (cooldownLeft > 0) {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: `Narozeninová párty je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const rumorCount = Math.max(
        2,
        Math.round(RESTAURANT_BUILDING_CONFIG.actionBoosts.birthdayPartyRumorCount * levelMultiplier)
      );
      const rumors = generateRestaurantDistrictGossips(district || context?.districtId || null, rumorCount, now);
      snapshot.cooldowns.birthdayParty = now + RESTAURANT_BUILDING_CONFIG.actionCooldowns.birthdayParty;
      persistRestaurantState(key, snapshot);

      const pushEvent = window.Empire.UI?.pushEvent;
      if (typeof pushEvent === "function") {
        rumors.forEach((rumor) => {
          pushEvent(`Drb: ${rumor.text}`);
        });
      }
      refreshOpenDistrictGossipSection();
      return {
        ok: true,
        message: rumors.length
          ? `Narozeninová párty proběhla. Získal jsi ${rumors.length} drby, které se uložily do historie districtů.`
          : "Narozeninová párty proběhla, ale nebyly dostupné žádné districtové drby."
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > RESTAURANT_BUILDING_CONFIG.maxLevel) {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: "Restaurace je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(RESTAURANT_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistRestaurantState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistRestaurantState(key, snapshot);
      return { ok: true, message: `Restaurace vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistRestaurantState(key, snapshot);
    return null;
  }

  function calculateConvenienceStoreHourlyRates(
    totalGangMembers,
    levelMultiplier,
    {
      nightShiftCleanBoostPct = 0,
      nightShiftDirtyBoostPct = 0,
      backCounterDirtyBoostPct = 0
    } = {}
  ) {
    const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
    const baseCleanIncome =
      (CONVENIENCE_STORE_BUILDING_CONFIG.baseCleanIncomePerHour
        + memberSteps * CONVENIENCE_STORE_BUILDING_CONFIG.cleanIncomePerTenMembersPerHour)
      * levelMultiplier;
    const baseDirtyIncome =
      (CONVENIENCE_STORE_BUILDING_CONFIG.baseDirtyIncomePerHour
        + memberSteps * CONVENIENCE_STORE_BUILDING_CONFIG.dirtyIncomePerTenMembersPerHour)
      * levelMultiplier;
    const currentCleanIncomeMultiplier = Math.max(0, 1 + Math.max(0, Number(nightShiftCleanBoostPct || 0)) / 100);
    const totalDirtyBoostPct = Math.max(0, Number(nightShiftDirtyBoostPct || 0))
      + Math.max(0, Number(backCounterDirtyBoostPct || 0));
    const currentDirtyIncomeMultiplier = Math.max(0, 1 + totalDirtyBoostPct / 100);
    const hourlyCleanIncome = baseCleanIncome * currentCleanIncomeMultiplier;
    const hourlyDirtyIncome = baseDirtyIncome * currentDirtyIncomeMultiplier;

    return {
      memberSteps,
      baseCleanIncome,
      baseDirtyIncome,
      currentCleanIncomeMultiplier,
      currentDirtyIncomeMultiplier,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyTotalIncome: hourlyCleanIncome + hourlyDirtyIncome
    };
  }

  function syncConvenienceStoreIncome(instanceState, totalGangMembers, now = Date.now(), districtOrId = null) {
    const stateRef = instanceState;
    const nowMs = Math.max(0, Math.floor(Number(now) || Date.now()));
    const levelMultiplier = getConvenienceStoreLevelMultiplier(stateRef.level);
    const districtIncomeBoostPct = getDistrictCashIncomeBoostPct(districtOrId, nowMs);
    const districtIncomeMultiplier = Math.max(0, 1 + districtIncomeBoostPct / 100);
    const nightShiftActive = nowMs < Number(stateRef.effects.nightShiftUntil || 0);
    const backCounterActive = nowMs < Number(stateRef.effects.backCounterUntil || 0);
    const backCounterRaidRiskActive = nowMs < Number(stateRef.effects.backCounterRaidRiskUntil || 0);
    const nightShiftCleanBoostPct = nightShiftActive
      ? CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftCleanIncomePct * levelMultiplier
      : 0;
    const nightShiftDirtyBoostPct = nightShiftActive
      ? CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftDirtyIncomePct * levelMultiplier
      : 0;
    const backCounterDirtyBoostPct = backCounterActive
      ? CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterDirtyIncomePct * levelMultiplier
      : 0;
    const backCounterRaidRiskPct = backCounterRaidRiskActive
      ? CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterRaidRiskPct * levelMultiplier
      : 0;
    const rates = calculateConvenienceStoreHourlyRates(totalGangMembers, levelMultiplier, {
      nightShiftCleanBoostPct,
      nightShiftDirtyBoostPct,
      backCounterDirtyBoostPct
    });

    let incomeFrom = Number(stateRef.lastIncomeAt || nowMs);
    if (!Number.isFinite(incomeFrom) || incomeFrom > nowMs) {
      incomeFrom = nowMs;
    }

    let cleanIncomeGained = 0;
    let dirtyIncomeGained = 0;
    if (incomeFrom < nowMs) {
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const cleanRaw =
        hoursElapsed * (rates.hourlyCleanIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderClean || 0);
      const dirtyRaw =
        hoursElapsed * (rates.hourlyDirtyIncome * districtIncomeMultiplier) + Number(stateRef.incomeRemainderDirty || 0);
      cleanIncomeGained = Math.max(0, Math.floor(cleanRaw));
      dirtyIncomeGained = Math.max(0, Math.floor(dirtyRaw));
      stateRef.incomeRemainderClean = Math.max(0, cleanRaw - cleanIncomeGained);
      stateRef.incomeRemainderDirty = Math.max(0, dirtyRaw - dirtyIncomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    const addClean = window.Empire.UI?.addCleanCash;
    const addDirty = window.Empire.UI?.addDirtyCash;
    if (cleanIncomeGained > 0 && typeof addClean === "function") {
      addClean(cleanIncomeGained);
    }
    if (dirtyIncomeGained > 0) {
      if (typeof addDirty === "function") {
        addDirty(dirtyIncomeGained);
      } else if (typeof addClean === "function") {
        addClean(dirtyIncomeGained);
      }
    }

    const currentInfluencePerHour = CONVENIENCE_STORE_BUILDING_CONFIG.baseInfluencePerHour * levelMultiplier;
    applyBuildingInfluenceTick(stateRef, nowMs, currentInfluencePerHour);

    return {
      cleanIncomeGained,
      dirtyIncomeGained,
      nightShiftActive,
      backCounterActive,
      backCounterRaidRiskActive,
      nightShiftCleanBoostPct,
      nightShiftDirtyBoostPct,
      backCounterDirtyBoostPct,
      backCounterRaidRiskPct,
      currentInfluencePerHour,
      districtIncomeBoostPct,
      rates: {
        ...rates,
        hourlyCleanIncome: rates.hourlyCleanIncome * districtIncomeMultiplier,
        hourlyDirtyIncome: rates.hourlyDirtyIncome * districtIncomeMultiplier,
        hourlyTotalIncome: (rates.hourlyCleanIncome + rates.hourlyDirtyIncome) * districtIncomeMultiplier
      }
    };
  }

  function resolveConvenienceStoreBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getConvenienceStoreStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    const syncResult = syncConvenienceStoreIncome(snapshot, totalGangMembers, now, district || context?.districtId);
    persistConvenienceStoreState(key, snapshot);

    const levelMultiplier = getConvenienceStoreLevelMultiplier(snapshot.level);
    const nextLevel = snapshot.level < CONVENIENCE_STORE_BUILDING_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? CONVENIENCE_STORE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0 : 0;
    const nightShiftCleanBoostPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftCleanIncomePct * levelMultiplier;
    const nightShiftDirtyBoostPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftDirtyIncomePct * levelMultiplier;
    const backCounterDirtyBoostPct =
      CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterDirtyIncomePct * levelMultiplier;
    const backCounterRaidRiskPct =
      CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterRaidRiskPct * levelMultiplier;
    const localRumorsInfluenceBonus =
      CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.localRumorsInfluenceBonus * levelMultiplier;
    const rates = syncResult.rates || calculateConvenienceStoreHourlyRates(totalGangMembers, levelMultiplier);
    const hourlyIncome = rates.hourlyTotalIncome;
    const dailyIncome = hourlyIncome * 24;

    const effects = [
      `Income C:$${formatDecimalValue(rates.hourlyCleanIncome, 2)} / D:$${formatDecimalValue(rates.hourlyDirtyIncome, 2)}`
    ];
    effects.push(`Vliv +${formatDecimalValue(syncResult.currentInfluencePerHour, 2)} / h`);
    if (syncResult.nightShiftActive) {
      effects.push(
        `Noční směna (+${formatDecimalValue(syncResult.nightShiftCleanBoostPct, 2)}% clean, +${formatDecimalValue(
          syncResult.nightShiftDirtyBoostPct,
          2
        )}% dirty, ${formatDurationLabel(snapshot.effects.nightShiftUntil - now)})`
      );
    }
    if (syncResult.backCounterActive) {
      effects.push(
        `Zadní pult (+${formatDecimalValue(syncResult.backCounterDirtyBoostPct, 2)}% dirty, +${formatDecimalValue(
          syncResult.backCounterRaidRiskPct,
          2
        )}% riziko razie, ${formatDurationLabel(snapshot.effects.backCounterUntil - now)})`
      );
    }
    if (syncResult.districtIncomeBoostPct > 0) {
      effects.push(`Celkový district income boost +${formatDecimalValue(syncResult.districtIncomeBoostPct, 2)}%`);
    }

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyIncome,
      dailyIncome,
      info:
        "Večerka je nízko-heat hybridní budova pro stabilní clean/dirty cashflow a pomalý růst vlivu. Noční směna krátkodobě zesílí oba příjmy, Zadní pult tlačí dirty provoz za cenu vyššího rizika razie a Místní klepy generují districtové drby do intel historie.",
      specialActions: [
        "Noční směna: Cooldown 4h, trvá 2h, zvýší legální income večerky o +30 % a dirty income o +20 % (oboje škáluje s levelem), přidá +2 heat.",
        "Zadní pult: Cooldown 5h, trvá 2h, zvýší dirty income večerky o +60 % (škáluje s levelem), přidá +4 heat a na 2h zvýší riziko policejní razie v districtu o +8 % (škáluje s levelem).",
        "Místní klepy: Cooldown 2h, okamžitě vygeneruje 1 districtový drb, uloží ho do historie districtu, přidá +1 heat a dá malý instantní bonus vlivu (+0.1, škáluje s levelem)."
      ],
      mechanics: {
        type: "convenience-store",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: CONVENIENCE_STORE_BUILDING_CONFIG.baseHeatPerDay + Math.max(0, Number(snapshot.extraHeat || 0)),
        effectsLabel: effects.join(" • "),
        cooldowns: {
          nightShift: Math.max(0, Number(snapshot.cooldowns.nightShift || 0) - now),
          backCounter: Math.max(0, Number(snapshot.cooldowns.backCounter || 0) - now),
          localRumors: Math.max(0, Number(snapshot.cooldowns.localRumors || 0) - now)
        },
        nightShiftCleanBoostPct,
        nightShiftDirtyBoostPct,
        backCounterDirtyBoostPct,
        backCounterRaidRiskPct,
        localRumorsInfluenceBonus,
        currentCleanIncomeMultiplier: rates.currentCleanIncomeMultiplier,
        currentDirtyIncomeMultiplier: rates.currentDirtyIncomeMultiplier,
        currentInfluencePerHour: syncResult.currentInfluencePerHour,
        districtIncomeBoostPct: syncResult.districtIncomeBoostPct,
        activeRaidRiskPct: syncResult.backCounterRaidRiskPct,
        nightShiftActive: syncResult.nightShiftActive,
        backCounterActive: syncResult.backCounterActive,
        backCounterRaidRiskActive: syncResult.backCounterRaidRiskActive
      }
    };
  }

  function handleConvenienceStoreBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getConvenienceStoreStateByKey(key, now);
    const totalGangMembers = Number(window.Empire.UI?.getCurrentGangMembers?.() || 0);
    syncConvenienceStoreIncome(snapshot, totalGangMembers, now, district || context?.districtId);

    const levelMultiplier = getConvenienceStoreLevelMultiplier(snapshot.level);
    const toCooldownLeft = (until) => Math.max(0, Math.floor(Number(until || 0) - now));

    if (actionId === "1") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.nightShift);
      if (cooldownLeft > 0) {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: `Noční směna je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const cleanBoostPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftCleanIncomePct * levelMultiplier;
      const dirtyBoostPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.nightShiftDirtyIncomePct * levelMultiplier;
      snapshot.effects.nightShiftUntil = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionDurations.nightShift;
      snapshot.cooldowns.nightShift = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionCooldowns.nightShift;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.nightShift;
      persistConvenienceStoreState(key, snapshot);
      return {
        ok: true,
        message:
          `Noční směna aktivní na 2h. Clean income +${formatDecimalValue(cleanBoostPct, 2)}%, `
          + `dirty income +${formatDecimalValue(dirtyBoostPct, 2)}%, `
          + `heat +${CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.nightShift}.`
      };
    }

    if (actionId === "2") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.backCounter);
      if (cooldownLeft > 0) {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: `Zadní pult je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const dirtyBoostPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterDirtyIncomePct * levelMultiplier;
      const raidRiskPct = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.backCounterRaidRiskPct * levelMultiplier;
      snapshot.effects.backCounterUntil = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionDurations.backCounter;
      snapshot.effects.backCounterRaidRiskUntil = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionDurations.backCounterRaidRisk;
      snapshot.cooldowns.backCounter = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionCooldowns.backCounter;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.backCounter;
      persistConvenienceStoreState(key, snapshot);
      return {
        ok: true,
        message: `Zadní pult aktivní na 2h. Dirty income +${formatDecimalValue(dirtyBoostPct, 2)}%, riziko razie +${formatDecimalValue(
          raidRiskPct,
          2
        )}%, heat +${CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.backCounter}.`
      };
    }

    if (actionId === "3") {
      const cooldownLeft = toCooldownLeft(snapshot.cooldowns.localRumors);
      if (cooldownLeft > 0) {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: `Místní klepy jsou na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
      }
      const influenceBonus = CONVENIENCE_STORE_BUILDING_CONFIG.actionBoosts.localRumorsInfluenceBonus * levelMultiplier;
      snapshot.influenceRemainder = Math.max(0, Number(snapshot.influenceRemainder || 0)) + influenceBonus;
      const instantInfluenceGained = applyBuildingInfluenceTick(snapshot, now, 0);
      const rumor = generateConvenienceStoreLocalGossip(district || context?.districtId || null, now);
      snapshot.cooldowns.localRumors = now + CONVENIENCE_STORE_BUILDING_CONFIG.actionCooldowns.localRumors;
      snapshot.extraHeat = Math.max(0, Number(snapshot.extraHeat || 0))
        + CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.localRumors;
      persistConvenienceStoreState(key, snapshot);

      const pushEvent = window.Empire.UI?.pushEvent;
      if (rumor && typeof pushEvent === "function") {
        pushEvent(`Drb: ${rumor.text}`);
      }
      refreshOpenDistrictGossipSection();

      const districtLabel = rumor
        ? resolveDistrictNumberLabel(resolveDistrictRecord(rumor.districtId) || { id: rumor.districtId })
        : null;
      const influenceNote = instantInfluenceGained > 0
        ? `okamžitě připsáno +${instantInfluenceGained} vlivu`
        : `akumulováno +${formatDecimalValue(influenceBonus, 2)} vlivu`;
      return {
        ok: true,
        message: rumor
          ? `Místní klepy: nový drb uložen pro district ${districtLabel}. Heat +${CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.localRumors}, ${influenceNote}.`
          : `Místní klepy proběhly, ale nebyl dostupný cíl pro nový drb. Heat +${CONVENIENCE_STORE_BUILDING_CONFIG.actionHeatAdded.localRumors}, ${influenceNote}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > CONVENIENCE_STORE_BUILDING_CONFIG.maxLevel) {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: "Večerka je na maximálním levelu." };
      }
      const cost = Math.max(0, Number(CONVENIENCE_STORE_BUILDING_CONFIG.upgradeCosts[nextLevel] || 0));
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistConvenienceStoreState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistConvenienceStoreState(key, snapshot);
      return { ok: true, message: `Večerka vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistConvenienceStoreState(key, snapshot);
    return null;
  }

  function resolveFactoryBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const primaryTarget = resolvePrimaryOwnedFactoryTarget(context, district);
    const activeContext = primaryTarget.context || context;
    const activeDistrict = primaryTarget.district || district || null;
    const key = resolveBuildingInstanceKey(activeContext, activeDistrict);
    const ownedFactoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, (ownedFactoryCount - 1) * 10);
    const snapshot = getFactoryStateByKey(key, now);
    const syncResult = syncFactoryProduction(snapshot, now, {
      applyHeat: true,
      ownedFactoryCount,
      networkProductionBonusPct
    });
    const cashState = getSimpleCashBuildingStateByKey(key, now);
    const cashSyncResult = syncSimpleCashBuildingIncome(cashState, FACTORY_CASH_RATES, now, activeDistrict || activeContext?.districtId);
    persistSimpleCashBuildingState(key, cashState);
    persistFactoryState(key, snapshot);

    const levelMultiplier = getFactoryLevelMultiplier(snapshot.level);
    const totalProductionMultiplier = levelMultiplier * (1 + networkProductionBonusPct / 100);
    const factoryPenaltyPct = getGlobalPoliceRaidProductionPenaltyPct("factory", now);
    const factoryPenaltyMultiplier = Math.max(0, 1 - factoryPenaltyPct / 100);
    const effectiveProductionMultiplier = totalProductionMultiplier * factoryPenaltyMultiplier;
    const rates = calculateFactoryProductionRates(effectiveProductionMultiplier);
    const nextLevel = snapshot.level < FACTORY_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? getFactoryUpgradeCost(nextLevel) : 0;
    const resources = createFactoryResourceMap(snapshot.resources);
    const playerSupplies = getFactoryPlayerSuppliesSnapshot();
    const boostSnapshot = getFactoryBoostSnapshot(now);
      const slots = (Array.isArray(snapshot.slots) ? snapshot.slots : []).map((slot) => {
        const config = FACTORY_SLOT_CONFIG.find((entry) => Number(entry.id) === Number(slot.id)) || null;
        const isCraftSlot = String(config?.mode || slot.mode || "").trim() === "craft";
        const producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
        const perHour = slot.resourceKey === "metalParts"
          ? rates.metalPartsPerHour
          : slot.resourceKey === "techCore"
            ? rates.techCorePerHour
            : rates.combatModulePerHour;
      return {
        id: Number(slot.id),
        resourceKey: slot.resourceKey,
        resourceLabel: config?.label || slot.resourceKey,
        mode: config?.mode || slot.mode || "produce",
        isProducing: Boolean(slot.isProducing),
        producedAmount,
        slotCap: FACTORY_SLOT_STORAGE_CAP,
        perHour: Math.max(0, Number(perHour || 0)),
        effectiveDurationMs: isCraftSlot
          ? Math.max(1, Math.round(FACTORY_CONFIG.combatModule.durationMs / Math.max(0.01, effectiveProductionMultiplier)))
          : 0
      };
    });
    const activeSlots = Math.max(0, Math.floor(Number(syncResult.activeSlots || 0)));
    const storedTotal = FACTORY_RESOURCE_KEYS.reduce((sum, resourceKey) => sum + Number(resources[resourceKey] || 0), 0);
    const hourlyCleanIncome = Number(cashSyncResult?.rates?.hourlyCleanIncome || 0);
    const hourlyDirtyIncome = Number(cashSyncResult?.rates?.hourlyDirtyIncome || 0);
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const effects = [
      `Síť Továren: ${ownedFactoryCount} budov (+${formatDecimalValue(networkProductionBonusPct, 2)}% rychlost výroby)`
    ];

    const primaryDisplayName = primaryTarget.primary?.displayName || activeContext?.variantName || activeContext?.baseName;
    const otherDisplayNames = primaryTarget.entries.slice(1).map((entry) => entry.displayName);
    const combinedDisplayName = otherDisplayNames.length
      ? `${primaryDisplayName} | Další: ${otherDisplayNames.join(", ")}`
      : primaryDisplayName;

    return {
      ...fallback,
      baseName: activeContext.baseName,
      displayName: combinedDisplayName || activeContext.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome: hourlyIncome * 24,
      info:
        "Továrna je produkční budova základních zbraňových materiálů. "
        + "Vyrábí Metal Parts a Tech Core, z nich následně craftí Combat Module. Combat boosty aktivuješ přes Boost tlačítko nad mapou.",
      specialActions: [
        "Slot 1: Metal Parts (rychlá základní výroba).",
        "Slot 2: Tech Core (pomalejší pokročilá výroba).",
        `Slot 3: Combat Module (${FACTORY_CONFIG.combatModule.metalPartsCost} MP + ${FACTORY_CONFIG.combatModule.techCoreCost} TC, ${formatDurationLabel(FACTORY_CONFIG.combatModule.durationMs)}, +${FACTORY_CONFIG.combatModule.heatPerUnit} heat / ks).`,
        "Combat boosty: Assault Protocol (2 CM), Rapid Strike (3 CM), Breach Mode (4 CM) přes Boost tlačítko."
      ],
      mechanics: {
        type: "factory",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: 0,
        effectsLabel: effects.join(" • "),
        resources,
        playerSupplies,
        slots,
        activeSlots,
        storedTotal,
        hourlyCleanIncome,
        hourlyDirtyIncome,
        ratesPerHour: {
          metalParts: rates.metalPartsPerHour,
          techCore: rates.techCorePerHour,
          combatModule: rates.combatModulePerHour
        },
        producedSinceLastTick: createFactoryResourceMap(syncResult.produced),
        heatAddedSinceLastTick: Math.max(0, Math.floor(Number(syncResult.heatAdded || 0))),
        ownedFactoryCount,
        networkProductionBonusPct,
        productionMultiplier: effectiveProductionMultiplier,
        primaryContext: activeContext,
        primaryDistrictId: activeDistrict?.id ?? null
      }
    };
  }

  function handleFactoryBuildingAction(actionId, activeContext) {
    const inputDistrict = activeContext?.district || null;
    const inputContext = activeContext?.context || null;
    if (!inputContext) {
      return { ok: false, message: "Továrna: není aktivní detail budovy." };
    }
    const primaryTarget = resolvePrimaryOwnedFactoryTarget(inputContext, inputDistrict);
    const context = primaryTarget.context || inputContext;
    const district = primaryTarget.district || inputDistrict;
    const ownedFactoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, (ownedFactoryCount - 1) * 10);
    const now = Date.now();
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané." };
    }
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getFactoryStateByKey(key, now);
    syncFactoryProduction(snapshot, now, {
      applyHeat: true,
      ownedFactoryCount,
      networkProductionBonusPct
    });

    if (actionId === "1" || actionId === "2" || actionId === "3") {
      if (isPoliceRaidSpecialActionBlockedForBuilding("factory", now)) {
        persistFactoryState(key, snapshot);
        return { ok: false, message: "Speciální akce Továrny jsou během razie dočasně zakázané." };
      }
      persistFactoryState(key, snapshot);
      return { ok: false, message: "Combat boosty z Combat Module budou napojené v dalším kroku." };
    }

    if (actionId === "collect") {
      const collected = createFactoryResourceMap(snapshot.resources);
      const totalCollected = FACTORY_RESOURCE_KEYS.reduce((sum, resourceKey) => sum + Number(collected[resourceKey] || 0), 0);
      if (totalCollected <= 0) {
        persistFactoryState(key, snapshot);
        return { ok: false, message: "Továrna: není co vybrat." };
      }
      snapshot.resources = createFactoryResourceMap();
      if (Array.isArray(snapshot.slots)) {
        snapshot.slots.forEach((slot) => {
          slot.producedAmount = 0;
          slot.productionRemainder = 0;
          slot.lastTick = now;
        });
      }
      const player = getFactoryPlayerSuppliesSnapshot();
      FACTORY_RESOURCE_KEYS.forEach((resourceKey) => {
        player[resourceKey] = Math.max(
          0,
          Math.floor(Number(player[resourceKey] || 0) + Number(collected[resourceKey] || 0))
        );
      });
      persistFactoryState(key, snapshot);
      persistFactoryPlayerSuppliesSnapshot(player);
      return {
        ok: true,
        message:
          `Továrna -> Sklad hráče: MP ${collected.metalParts}, TC ${collected.techCore}, CM ${collected.combatModule}. `
          + `Stav skladu: MP ${player.metalParts}, TC ${player.techCore}, CM ${player.combatModule}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > FACTORY_CONFIG.maxLevel) {
        persistFactoryState(key, snapshot);
        return { ok: false, message: "Továrna je na maximálním levelu." };
      }
      const cost = getFactoryUpgradeCost(nextLevel);
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistFactoryState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistFactoryState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistFactoryState(key, snapshot);
      return { ok: true, message: `Továrna vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistFactoryState(key, snapshot);
    return null;
  }

  function applyArmoryWeaponsToPlayerInventory(weaponMap = {}) {
    const byNameAttack = {};
    const byNameDefense = {};
    const byKey = createArmoryWeaponMap();
    ARMORY_WEAPON_KEYS.forEach((weaponKey) => {
      const amount = Math.max(0, Math.floor(Number(weaponMap?.[weaponKey] || 0)));
      if (!amount) return;
      byKey[weaponKey] = amount;
      const config = ARMORY_CONFIG.weapons[weaponKey];
      if (!config) return;
      if (config.category === "defense") {
        byNameDefense[config.name] = amount;
      } else {
        byNameAttack[config.name] = amount;
      }
    });
    const total = ARMORY_WEAPON_KEYS.reduce((sum, weaponKey) => sum + Number(byKey[weaponKey] || 0), 0);
    if (!total) {
      return { total: 0, byKey };
    }

    const addCraftedWeapons = window.Empire.UI?.addCraftedWeapons;
    if (typeof addCraftedWeapons === "function" && Object.keys(byNameAttack).length) {
      addCraftedWeapons(byNameAttack);
    } else if (Object.keys(byNameAttack).length) {
      try {
        const current = JSON.parse(localStorage.getItem("empire_weapons_detail") || "{}");
        const merged = current && typeof current === "object" && !Array.isArray(current) ? current : {};
        Object.entries(byNameAttack).forEach(([name, amount]) => {
          const delta = Math.max(0, Math.floor(Number(amount) || 0));
          if (!delta) return;
          merged[name] = Math.max(0, Math.floor(Number(merged[name] || 0) + delta));
        });
        localStorage.setItem("empire_weapons_detail", JSON.stringify(merged));
      } catch {}
    }

    const addCraftedDefense = window.Empire.UI?.addCraftedDefense;
    if (typeof addCraftedDefense === "function" && Object.keys(byNameDefense).length) {
      addCraftedDefense(byNameDefense);
    } else if (Object.keys(byNameDefense).length) {
      try {
        const current = JSON.parse(localStorage.getItem("empire_defense_detail") || "{}");
        const merged = current && typeof current === "object" && !Array.isArray(current) ? current : {};
        Object.entries(byNameDefense).forEach(([name, amount]) => {
          const delta = Math.max(0, Math.floor(Number(amount) || 0));
          if (!delta) return;
          merged[name] = Math.max(0, Math.floor(Number(merged[name] || 0) + delta));
        });
        localStorage.setItem("empire_defense_detail", JSON.stringify(merged));
      } catch {}
    }

    return { total, byKey };
  }

  function resolveArmoryBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const primaryTarget = resolvePrimaryOwnedArmoryTarget(context, district);
    const activeContext = primaryTarget.context || context;
    const activeDistrict = primaryTarget.district || district || null;
    const key = resolveBuildingInstanceKey(activeContext, activeDistrict);
    const ownedArmoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, ownedArmoryCount * 10);
    const snapshot = getArmoryStateByKey(key, now);
    applyArmoryPassiveBoostHeat(snapshot, now);
    const syncResult = syncArmoryProduction(snapshot, now, {
      applyHeat: true,
      ownedArmoryCount,
      networkProductionBonusPct
    });
    const cashState = getSimpleCashBuildingStateByKey(key, now);
    const cashSyncResult = syncSimpleCashBuildingIncome(cashState, ARMORY_CASH_RATES, now, activeDistrict || activeContext?.districtId);
    persistSimpleCashBuildingState(key, cashState);
    persistArmoryState(key, snapshot);

    const levelMultiplier = getArmoryLevelMultiplier(snapshot.level);
    const baseProductionMultiplier = levelMultiplier * (1 + networkProductionBonusPct / 100);
    const boostSnapshot = getArmoryBoostSnapshot(snapshot, now);
    const armoryPenaltyPct = getGlobalPoliceRaidProductionPenaltyPct("armory", now);
    const armoryPenaltyMultiplier = Math.max(0, 1 - armoryPenaltyPct / 100);
    const rates = calculateArmoryProductionRates(baseProductionMultiplier, {
      attackMultiplier: boostSnapshot.attackProductionMultiplier * armoryPenaltyMultiplier,
      defenseMultiplier: boostSnapshot.defenseProductionMultiplier * armoryPenaltyMultiplier
    });
    const nextLevel = snapshot.level < ARMORY_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? getArmoryUpgradeCost(nextLevel) : 0;
    const storedWeapons = resolveArmoryCollectableWeapons(snapshot);
    const playerMaterials = syncResult.factorySupplies || createFactoryPlayerSupplyMap(getFactoryPlayerSuppliesSnapshot());
    const slots = (Array.isArray(snapshot.slots) ? snapshot.slots : []).map((slot) => {
      const config = ARMORY_CONFIG.weapons[slot.weaponKey] || null;
      const category = config?.category === "defense" ? "defense" : "attack";
      const powerValue = category === "defense"
        ? Math.max(0, Math.floor(Number(config?.defensePower || 0)))
        : Math.max(0, Math.floor(Number(config?.attackPower || 0)));
      const categoryProductionMultiplier = baseProductionMultiplier
        * (category === "defense"
          ? boostSnapshot.defenseProductionMultiplier
          : boostSnapshot.attackProductionMultiplier)
        * armoryPenaltyMultiplier;
        return {
          id: Number(slot.id),
          weaponKey: slot.weaponKey,
          category,
          weaponName: config?.name || slot.weaponKey,
          isProducing: Boolean(slot.isProducing),
          batchMaxUnits: Math.min(
            ARMORY_BATCH_MAX_UNITS,
            Math.max(
              0,
              Math.floor(Number(slot.batchMaxUnits || 0) || (Number(slot.producedAmount || 0) + Number(slot.remainingUnits || 0)))
            )
          ),
          queuedUnits: clamp(Math.max(1, Math.floor(Number(slot.queuedUnits || 1))), 1, ARMORY_BATCH_MAX_UNITS),
          remainingUnits: Math.max(0, Math.floor(Number(slot.remainingUnits || 0))),
          producedAmount: Math.max(0, Math.floor(Number(slot.producedAmount || 0))),
        perHour: Math.max(0, Number(rates[slot.weaponKey] || 0)),
        powerLabel: category === "defense" ? "Defense" : "Attack",
        powerValue,
        metalPartsCost: Math.max(0, Math.floor(Number(config?.metalPartsCost || 0))),
        techCoreCost: Math.max(0, Math.floor(Number(config?.techCoreCost || 0))),
        durationMs: Math.max(1, Math.floor(Number(config?.durationMs || 60000))),
          effectiveDurationMs: Math.max(1, Math.round(Number(config?.durationMs || 60000) / Math.max(0.01, categoryProductionMultiplier))),
          specialEffect: String(config?.specialEffect || ""),
          drawback: String(config?.drawback || ""),
          role: String(config?.role || ""),
          heatPerUnit: Math.max(0, Math.floor(Number(config?.heatPerUnit || 0))),
          canAffordQueue: (
            Number(playerMaterials.metalParts || 0) >= Math.max(0, Math.floor(Number(config?.metalPartsCost || 0))) * clamp(Math.max(1, Math.floor(Number(slot.queuedUnits || 1))), 1, ARMORY_BATCH_MAX_UNITS)
            && Number(playerMaterials.techCore || 0) >= Math.max(0, Math.floor(Number(config?.techCoreCost || 0))) * clamp(Math.max(1, Math.floor(Number(slot.queuedUnits || 1))), 1, ARMORY_BATCH_MAX_UNITS)
          ),
          batchAtMax: Math.min(
            ARMORY_BATCH_MAX_UNITS,
            Math.max(
              0,
              Math.floor(Number(slot.batchMaxUnits || 0) || (Number(slot.producedAmount || 0) + Number(slot.remainingUnits || 0)))
            )
          ) >= ARMORY_BATCH_MAX_UNITS
        };
      });
    const attackSlots = slots.filter((slot) => slot.category !== "defense");
    const defenseSlots = slots.filter((slot) => slot.category === "defense");
    const activeAttackSlots = attackSlots.reduce((sum, slot) => sum + (slot.isProducing ? 1 : 0), 0);
    const activeDefenseSlots = defenseSlots.reduce((sum, slot) => sum + (slot.isProducing ? 1 : 0), 0);
    const activeSlots = Math.max(0, Math.floor(Number(syncResult.activeSlots || 0)));
    const storedTotal = ARMORY_WEAPON_KEYS.reduce((sum, weaponKey) => sum + Number(storedWeapons[weaponKey] || 0), 0);
    const storedAttackTotal = ARMORY_ATTACK_WEAPON_KEYS.reduce((sum, weaponKey) => sum + Number(storedWeapons[weaponKey] || 0), 0);
    const storedDefenseTotal = ARMORY_DEFENSE_WEAPON_KEYS.reduce((sum, weaponKey) => sum + Number(storedWeapons[weaponKey] || 0), 0);
    const hourlyCleanIncome = Number(cashSyncResult?.rates?.hourlyCleanIncome || 0);
    const hourlyDirtyIncome = Number(cashSyncResult?.rates?.hourlyDirtyIncome || 0);
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const effects = [
      `Síť aktivních továren (+${formatDecimalValue(networkProductionBonusPct, 2)}% rychlost výroby za budovu)`
    ];

    const primaryDisplayName = primaryTarget.primary?.displayName || activeContext?.variantName || activeContext?.baseName;
    const otherDisplayNames = primaryTarget.entries.slice(1).map((entry) => entry.displayName);
    const combinedDisplayName = otherDisplayNames.length
      ? `${primaryDisplayName} | Další: ${otherDisplayNames.join(", ")}`
      : primaryDisplayName;

    return {
      ...fallback,
      baseName: activeContext.baseName,
      displayName: combinedDisplayName || activeContext.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome: hourlyIncome * 24,
      info:
        "Zbrojovka vyrábí útočné i obranné vybavení z Metal Parts a Tech Core. "
        + "Výroba je oddělená do dvou sekcí (útok/obrana), každá položka má vlastní slot, recept a čas.",
      specialActions: [
        "Útok (sloty 1-5): Baseballová pálka, Pouliční pistole, Granát, Samopal, Bazuka.",
        "Baseballová pálka: attack power 5.",
        "Pouliční pistole: attack power 10.",
        "Granát: attack power 14. Specialita: ignoruje 0.3 % obrany.",
        "Samopal: attack power 18. Specialita: +0.2 power za ks při použití všech 5 attack zbraní v jednom útoku.",
        "Bazuka: attack power 30. Specialita: 1 ks zvyšuje o 0.5 % šanci na totální destrukci napadeného districtu.",
        "Obrana (sloty 6-10): Neprůstřelná vesta, Ocelové barikády, Bezpečnostní kamery, Automatické kulometné stanoviště, Alarm.",
        "Neprůstřelná vesta: defense power 6. Specialita: snižuje ztráty počtu obyvatel gangu o 0.5 % za ks.",
        "Ocelové barikády: defense power 12.",
        "Bezpečnostní kamery: defense power 6. Specialita: při 5+ kusech velká šance na odhalení špeha.",
        "Automatické kulometné stanoviště: defense power 20. Specialita: 1 ks snižuje útočníkovi sílu útoku o 0.3 %.",
        "Alarm: defense power 10. Specialita: při 5+ kusech velká šance na selhání vykradení districtu.",
        "Attack gun boost: trvání 2h, cooldown 6h, +20 % rychlost výroby útočných zbraní, okamžitě +10 heat, během boostu +5 heat/h.",
        "Defense gun boost: trvání 2h, cooldown 6h, +20 % rychlost výroby obranných zbraní, okamžitě +10 heat, během boostu +5 heat/h."
      ],
      mechanics: {
        type: "armory",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerHour: Math.max(0, Number(boostSnapshot.passiveHeatPerHour || 0)),
        heatPerDay: Math.max(0, Number(boostSnapshot.passiveHeatPerHour || 0)) * 24,
        effectsLabel: effects.join(" • "),
        storedWeapons,
        playerMaterials,
        slots,
        attackSlots,
        defenseSlots,
        activeSlots,
        activeAttackSlots,
        activeDefenseSlots,
        storedTotal,
        storedAttackTotal,
        storedDefenseTotal,
        hourlyCleanIncome,
        hourlyDirtyIncome,
        ratesPerHour: rates,
        producedSinceLastTick: createArmoryWeaponMap(syncResult.produced),
        heatAddedSinceLastTick: Math.max(0, Math.floor(Number(syncResult.heatAdded || 0))),
        ownedArmoryCount,
        networkProductionBonusPct,
        productionMultiplier: baseProductionMultiplier * armoryPenaltyMultiplier,
        attackProductionMultiplier: baseProductionMultiplier * boostSnapshot.attackProductionMultiplier * armoryPenaltyMultiplier,
        defenseProductionMultiplier: baseProductionMultiplier * boostSnapshot.defenseProductionMultiplier * armoryPenaltyMultiplier,
        cooldowns: {
          attackBoost: Math.max(0, Number(snapshot.cooldowns.attackBoost || 0) - now),
          defenseBoost: Math.max(0, Number(snapshot.cooldowns.defenseBoost || 0) - now)
        },
        boosts: {
          attackBoostActive: boostSnapshot.attackBoostActive,
          defenseBoostActive: boostSnapshot.defenseBoostActive,
          attackBoostUntil: Math.max(0, Number(snapshot.effects.attackBoostUntil || 0) - now),
          defenseBoostUntil: Math.max(0, Number(snapshot.effects.defenseBoostUntil || 0) - now)
        },
        primaryContext: activeContext,
        primaryDistrictId: activeDistrict?.id ?? null
      }
    };
  }

  function handleArmoryBuildingAction(actionId, activeContext) {
    const inputDistrict = activeContext?.district || null;
    const inputContext = activeContext?.context || null;
    if (!inputContext) {
      return { ok: false, message: "Zbrojovka: není aktivní detail budovy." };
    }
    const primaryTarget = resolvePrimaryOwnedArmoryTarget(inputContext, inputDistrict);
    const context = primaryTarget.context || inputContext;
    const district = primaryTarget.district || inputDistrict;
    const ownedArmoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, ownedArmoryCount * 10);
    const now = Date.now();
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané." };
    }
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getArmoryStateByKey(key, now);
    applyArmoryPassiveBoostHeat(snapshot, now);
    const syncResult = syncArmoryProduction(snapshot, now, {
      applyHeat: true,
      ownedArmoryCount,
      networkProductionBonusPct
    });
    if (actionId === "1" || actionId === "2" || actionId === "3") {
      if (isPoliceRaidSpecialActionBlockedForBuilding("armory", now)) {
        persistArmoryState(key, snapshot);
        return { ok: false, message: "Speciální akce Zbrojovky jsou během razie dočasně zakázané." };
      }
      if (actionId === "1") {
        const cooldownLeft = Math.max(0, Number(snapshot.cooldowns.attackBoost || 0) - now);
        if (cooldownLeft > 0) {
          persistArmoryState(key, snapshot);
          return { ok: false, message: `Attack gun boost je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
        }
        snapshot.effects.attackBoostUntil = now + ARMORY_SPECIAL_ACTIONS.attackBoost.durationMs;
        snapshot.cooldowns.attackBoost = now + ARMORY_SPECIAL_ACTIONS.attackBoost.cooldownMs;
        snapshot.lastBoostHeatAt = now;
        const nextHeat = addPlayerHeatFromBuilding(ARMORY_SPECIAL_ACTIONS.attackBoost.immediateHeat);
        persistArmoryState(key, snapshot);
        return {
          ok: true,
          message:
            `Attack gun boost aktivní na ${formatDurationLabel(ARMORY_SPECIAL_ACTIONS.attackBoost.durationMs)} `
            + `(+${ARMORY_SPECIAL_ACTIONS.attackBoost.productionBoostPct}% produkce útoku). `
            + `Heat +${ARMORY_SPECIAL_ACTIONS.attackBoost.immediateHeat} (celkem ${nextHeat}) `
            + `a během boostu +${ARMORY_SPECIAL_ACTIONS.attackBoost.passiveHeatPerHour}/h.`
        };
      }
      if (actionId === "2") {
        const cooldownLeft = Math.max(0, Number(snapshot.cooldowns.defenseBoost || 0) - now);
        if (cooldownLeft > 0) {
          persistArmoryState(key, snapshot);
          return { ok: false, message: `Defense gun boost je na cooldownu (${formatDurationLabel(cooldownLeft)}).` };
        }
        snapshot.effects.defenseBoostUntil = now + ARMORY_SPECIAL_ACTIONS.defenseBoost.durationMs;
        snapshot.cooldowns.defenseBoost = now + ARMORY_SPECIAL_ACTIONS.defenseBoost.cooldownMs;
        snapshot.lastBoostHeatAt = now;
        const nextHeat = addPlayerHeatFromBuilding(ARMORY_SPECIAL_ACTIONS.defenseBoost.immediateHeat);
        persistArmoryState(key, snapshot);
        return {
          ok: true,
          message:
            `Defense gun boost aktivní na ${formatDurationLabel(ARMORY_SPECIAL_ACTIONS.defenseBoost.durationMs)} `
            + `(+${ARMORY_SPECIAL_ACTIONS.defenseBoost.productionBoostPct}% produkce obrany). `
            + `Heat +${ARMORY_SPECIAL_ACTIONS.defenseBoost.immediateHeat} (celkem ${nextHeat}) `
            + `a během boostu +${ARMORY_SPECIAL_ACTIONS.defenseBoost.passiveHeatPerHour}/h.`
        };
      }
      persistArmoryState(key, snapshot);
      return { ok: false, message: "Zbrojovka: neznámá speciální akce." };
    }

    if (actionId === "collect") {
      const collected = resolveArmoryCollectableWeapons(snapshot);
      const totalCollected = ARMORY_WEAPON_KEYS.reduce((sum, weaponKey) => sum + Number(collected[weaponKey] || 0), 0);
      if (totalCollected <= 0) {
        persistArmoryState(key, snapshot);
        return { ok: false, message: "Zbrojovka: není co vybrat." };
      }

      snapshot.storedWeapons = createArmoryWeaponMap();
      if (Array.isArray(snapshot.slots)) {
        snapshot.slots.forEach((slot) => {
          slot.producedAmount = 0;
          slot.productionRemainder = 0;
          slot.lastTick = now;
        });
      }
      persistArmoryState(key, snapshot);
      applyArmoryWeaponsToPlayerInventory(collected);

      const attackSummary = ARMORY_ATTACK_WEAPON_KEYS
        .map((weaponKey) => {
          const config = ARMORY_CONFIG.weapons[weaponKey];
          const short = config?.name || weaponKey;
          const amount = Math.max(0, Math.floor(Number(collected[weaponKey] || 0)));
          return `${short} ${amount}`;
        })
        .join(", ");
      const defenseSummary = ARMORY_DEFENSE_WEAPON_KEYS
        .map((weaponKey) => {
          const config = ARMORY_CONFIG.weapons[weaponKey];
          const short = config?.name || weaponKey;
          const amount = Math.max(0, Math.floor(Number(collected[weaponKey] || 0)));
          return `${short} ${amount}`;
        })
        .join(", ");

      return {
        ok: true,
        message: `Zbrojovka -> Inventář | Útok: ${attackSummary}. Obrana: ${defenseSummary}.`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > ARMORY_CONFIG.maxLevel) {
        persistArmoryState(key, snapshot);
        return { ok: false, message: "Zbrojovka je na maximálním levelu." };
      }
      const cost = getArmoryUpgradeCost(nextLevel);
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistArmoryState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistArmoryState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistArmoryState(key, snapshot);
      return { ok: true, message: `Zbrojovka vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistArmoryState(key, snapshot);
    return null;
  }

  function resolvePharmacyBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getPharmacyStateByKey(key, now);
    const syncResult = syncPharmacyProduction(snapshot, now);
    const incomeSyncResult = syncPharmacyIncome(snapshot, now, district || context?.districtId);
    persistPharmacyState(key, snapshot);

    const levelMultiplier = getPharmacyLevelMultiplier(snapshot.level);
    const rates = calculatePharmacyProductionRates(levelMultiplier);
    const ownedPharmacyCount = getOwnedPharmacyCount();
    const pharmacyProductionBonusPct = getPharmacyProductionBonusPct();
    const ownedWarehouseCount = getOwnedWarehouseCountForDrugLab();
    const pharmacyStorageCapBonusPct = getPharmacyStorageCapBonusPct();
    const slotCapMultiplier = getPharmacyStorageCapMultiplier();
    const nextLevel = snapshot.level < PHARMACY_CONFIG.maxLevel ? snapshot.level + 1 : null;
    const nextUpgradeCost = nextLevel ? getPharmacyUpgradeCost(nextLevel) : 0;
    const boostSnapshot = getPharmacyBoostSnapshot(now);
    const resources = createPharmacyResourceMap(snapshot.resources);
    const slots = (Array.isArray(snapshot.slots) ? snapshot.slots : []).map((slot) => {
      const config = PHARMACY_SLOT_CONFIG.find((entry) => Number(entry.id) === Number(slot.id)) || null;
      return {
        id: Number(slot.id),
        resourceKey: slot.resourceKey,
        resourceLabel: config?.label || slot.resourceKey,
        isProducing: Boolean(slot.isProducing),
        queuedUnits: slot.isProducing
          ? Math.max(0, Math.floor(Number(slot.queuedUnits || 0)))
          : Math.max(1, Math.floor(Number(slot.queuedUnits || 1))),
        queueRemaining: Math.max(0, Math.floor(Number(slot.queueRemaining || 0))),
        producedAmount: Math.max(0, Math.floor(Number(slot.producedAmount || 0))),
        slotCap: Number.isFinite(Number(PHARMACY_CONFIG.slotStorageCaps?.[slot.resourceKey]))
          ? Math.max(0, Math.floor(Number(PHARMACY_CONFIG.slotStorageCaps[slot.resourceKey]) * slotCapMultiplier))
          : Number.NaN,
        cleanCostPerUnit: Math.max(0, Math.floor(Number(PHARMACY_UNIT_CLEAN_COST[slot.resourceKey] || 0))),
        perHour: Math.max(0, Number(
          slot.resourceKey === "chemicals"
            ? rates.chemicalsPerHour
            : slot.resourceKey === "biomass"
              ? rates.biomassPerHour
              : rates.stimPackPerHour
        ))
      };
    });
    const activeSlots = Math.max(0, Math.floor(Number(syncResult.activeSlots || 0)));
    const storedTotal = PHARMACY_RESOURCE_KEYS.reduce((sum, resourceKey) => sum + Number(resources[resourceKey] || 0), 0);
    const hourlyCleanIncome = Number(incomeSyncResult?.rates?.hourlyCleanIncome || 0);
    const hourlyDirtyIncome = Number(incomeSyncResult?.rates?.hourlyDirtyIncome || 0);
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    const dailyIncome = hourlyIncome * 24;

    const effects = [];
    if (boostSnapshot.activeCount > 0) {
      effects.push(
        `Globální boost: spy +${formatDecimalValue(boostSnapshot.effective.spySpeedPct, 2)}%, `
        + `attack +${formatDecimalValue(boostSnapshot.effective.attackSpeedPct, 2)}%, `
        + `steal +${formatDecimalValue(boostSnapshot.effective.stealSpeedPct, 2)}%`
      );
      const activeLabels = boostSnapshot.activeEffects
        .slice(0, 3)
        .map((entry) => `${entry.type} ${formatDurationLabel(entry.remainingMs)}`)
        .join(", ");
      if (activeLabels) {
        effects.push(`Aktivní boosty: ${activeLabels}`);
      }
    }
    effects.push(`Síť Lékáren: ${ownedPharmacyCount} (+${formatDecimalValue(pharmacyProductionBonusPct, 2)}% rychlost produkce)`);
    effects.push(`Sklady hráče: ${ownedWarehouseCount} (+${formatDecimalValue(pharmacyStorageCapBonusPct, 2)}% maximální výroba slotů)`);
    effects.push(`Boost zásoby: Ghost Serum ${Math.max(0, Math.floor(Number(boostSnapshot.drugInventory?.ghostSerum || 0)))} • Overdrive X ${Math.max(0, Math.floor(Number(boostSnapshot.drugInventory?.overdriveX || 0)))}`);

    return {
      ...fallback,
      baseName: context.baseName,
      displayName: context.variantName || context.baseName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome,
      info:
        "Lékárna je support budova se 3 sloty (Chemicals, Biomass, Stim Pack). "
        + "Po vybrání surovin se vše převede do Drug Lab zásob. Boosty se aktivují přes tlačítko Boost nad mapou a spotřebovávají Ghost Serum / Overdrive X.",
      specialActions: [
        "Vybrat suroviny: přesune Chemicals/Biomass/Stim Pack z Lékárny do zásob Drug Labu.",
        "Boost tlačítko (nad mapou): Recon (1 Ghost Serum), Action (1 Ghost Serum), Neuro (1 Overdrive X +3 heat), každý na 2h."
      ],
      mechanics: {
        type: "pharmacy",
        instanceKey: key,
        level: snapshot.level,
        nextLevel,
        nextUpgradeCost,
        heatPerDay: PHARMACY_CONFIG.baseHeatPerDay,
        effectsLabel: effects.length ? effects.join(" • ") : "Žádné",
        cooldowns: {
          recon: Math.max(0, Number(snapshot.cooldowns.recon || 0) - now),
          action: Math.max(0, Number(snapshot.cooldowns.action || 0) - now),
          neuro: Math.max(0, Number(snapshot.cooldowns.neuro || 0) - now)
        },
        resources,
        slots,
        activeSlots,
        storedTotal,
        ratesPerHour: {
          chemicals: rates.chemicalsPerHour,
          biomass: rates.biomassPerHour,
          stimPack: rates.stimPackPerHour
        },
        ownedPharmacyCount,
        pharmacyProductionBonusPct,
        ownedWarehouseCount,
        pharmacyStorageCapBonusPct,
        producedSinceLastTick: createPharmacyResourceMap(syncResult.produced),
        globalBoost: boostSnapshot.effective,
        drugLabSupplies: createDrugLabSupplyMap(boostSnapshot.supplies || {}),
        boostActiveCount: Math.max(0, Number(boostSnapshot.activeCount || 0))
      }
    };
  }

  function handlePharmacyBuildingAction(actionId, activeContext) {
    const { district, context } = activeContext;
    const now = Date.now();
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané." };
    }
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getPharmacyStateByKey(key, now);
    syncPharmacyProduction(snapshot, now);
    if (actionId === "1" || actionId === "2" || actionId === "3") {
      if (isPoliceRaidSpecialActionBlockedForBuilding("pharmacy", now)) {
        persistPharmacyState(key, snapshot);
        return { ok: false, message: "Speciální akce Lékárny jsou během razie dočasně zakázané." };
      }
      persistPharmacyState(key, snapshot);
      return { ok: false, message: "Boosty aktivuješ přes tlačítko Boost nad mapou." };
    }

    if (actionId === "collect") {
      const collected = createPharmacyResourceMap(snapshot.resources);
      const totalCollected = PHARMACY_RESOURCE_KEYS.reduce((sum, resourceKey) => sum + Number(collected[resourceKey] || 0), 0);
      if (totalCollected <= 0) {
        persistPharmacyState(key, snapshot);
        return { ok: false, message: "Lékárna: není co vybrat." };
      }
      snapshot.resources = createPharmacyResourceMap();
      const player = getDrugLabPlayerSnapshot(now);
      player.labSupplies = createDrugLabSupplyMap(player.labSupplies || {});
      PHARMACY_RESOURCE_KEYS.forEach((resourceKey) => {
        player.labSupplies[resourceKey] = Math.max(
          0,
          Math.floor(Number(player.labSupplies[resourceKey] || 0) + Number(collected[resourceKey] || 0))
        );
      });
      const heatAdded = Math.max(0, Number(collected.chemicals || 0)) * 0.5;
      const nextHeat = heatAdded > 0 ? addPlayerHeatFromBuilding(heatAdded) : readCurrentPlayerHeatValue();
      if (Array.isArray(snapshot.slots)) {
        snapshot.slots.forEach((slot) => {
          slot.producedAmount = 0;
          slot.productionRemainder = 0;
          slot.lastTick = now;
        });
      }
      persistPharmacyState(key, snapshot);
      persistDrugLabPlayerSnapshot(player);
      return {
        ok: true,
        message:
          `Lékárna -> Drug Lab: vybráno C ${collected.chemicals}, B ${collected.biomass}, S ${collected.stimPack}. `
          + `Stav zásob DL: C ${player.labSupplies.chemicals}, B ${player.labSupplies.biomass}, S ${player.labSupplies.stimPack}. `
          + `Heat +${formatDecimalValue(heatAdded, 1)} (celkem ${formatDecimalValue(nextHeat, 1)}).`
      };
    }

    if (actionId === "upgrade") {
      const nextLevel = Math.floor(snapshot.level || 1) + 1;
      if (nextLevel > PHARMACY_CONFIG.maxLevel) {
        persistPharmacyState(key, snapshot);
        return { ok: false, message: "Lékárna je na maximálním levelu." };
      }
      const cost = getPharmacyUpgradeCost(nextLevel);
      const spend = window.Empire.UI?.trySpendCleanCash;
      if (typeof spend !== "function") {
        persistPharmacyState(key, snapshot);
        return { ok: false, message: "Upgrade nelze provést: chybí ekonomický modul." };
      }
      const result = spend(cost);
      if (!result?.ok) {
        persistPharmacyState(key, snapshot);
        return { ok: false, message: `Nedostatek cash na upgrade (potřeba $${cost}).` };
      }
      snapshot.level = nextLevel;
      persistPharmacyState(key, snapshot);
      return { ok: true, message: `Lékárna vylepšena na level ${nextLevel} za $${cost}.` };
    }

    persistPharmacyState(key, snapshot);
    return null;
  }

  function resolveDrugLabBuildingDetails(context, district, fallback) {
    const now = Date.now();
    const primaryTarget = resolvePrimaryOwnedDrugLabTarget(context, district);
    const activeContext = primaryTarget.context || context;
    const activeDistrict = primaryTarget.district || district || null;
    const sync = runDrugLabTick(activeContext, activeDistrict, now);
    const { core, building, player, instanceKey } = sync;
    const buildingState = building && typeof building === "object" ? building : createDrugLabDefaultState(now);
    const playerState = player && typeof player === "object" ? player : createDrugLabDefaultPlayerState();
    const unlockedSlots = core.getUnlockedSlotCount();
    const storageCapacity = core.getStorageCapacity();
    const storedTotal = core.getCurrentStoredTotal();
    const heatPerHour = core.calculateCurrentHeatPerHour(now);
    const heatPerDay = heatPerHour * 24;
    const nextLevel = building.level < DRUG_LAB_CONFIG.maxLevel ? building.level + 1 : null;
    const nextUpgradeCost = nextLevel ? Number(DRUG_LAB_CONFIG.upgradeCosts[nextLevel] || 0) : 0;
    const schoolBoost = resolveDrugLabSchoolBoostPct(instanceKey, now);
    const ownedLabCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, ownedLabCount * 5);
    const ownedWarehouseCount = getOwnedWarehouseCountForDrugLab();
    const storageCapacityBonusPct = getDrugLabStorageCapacityBonusPct();
    const pharmacySupplies = createDrugLabSupplyMap(playerState.labSupplies || {});
    const incomeRates = sync.incomeSync?.rates || {
      hourlyCleanIncome: Math.max(0, Number(DRUG_LAB_CONFIG.baseCleanIncomePerHour || 0)) * getDrugLabLevelMultiplier(buildingState.level),
      hourlyDirtyIncome: Math.max(0, Number(DRUG_LAB_CONFIG.baseDirtyIncomePerHour || 0)) * getDrugLabLevelMultiplier(buildingState.level),
      hourlyTotalIncome: 0
    };
    if (!incomeRates.hourlyTotalIncome) {
      incomeRates.hourlyTotalIncome = incomeRates.hourlyCleanIncome + incomeRates.hourlyDirtyIncome;
    }

    const slots = (Array.isArray(buildingState.slots) ? buildingState.slots : []).map((slot) => {
      const unlocked = Number(slot.id) <= unlockedSlots;
      const activeDrug = DRUG_CONFIG[slot.activeDrugType] || DRUG_CONFIG.neonDust;
      const isProducing = unlocked && Boolean(slot.isProducing);
      const queuedUnits = isProducing
        ? Math.max(0, Math.floor(Number(slot.queuedUnits || 0)))
        : Math.max(1, Math.floor(Number(slot.queuedUnits || 1)));
      const queuedSupplyCost = getDrugLabSupplyCost(activeDrug.id, queuedUnits);
      return {
        id: Number(slot.id),
        unlocked,
        activeDrugType: activeDrug.id,
        activeDrugName: activeDrug.name,
        isProducing,
        queuedUnits,
        queueRemaining: Math.max(0, Math.floor(Number(slot.queueRemaining || 0))),
        supplyCost: getDrugLabSupplyCost(activeDrug.id, 1),
        queuedSupplyCost,
        producedAmount: Math.max(0, Math.floor(Number(slot.producedAmount || 0))),
        lastTick: Math.max(0, Number(slot.lastTick || 0)),
        startedAt: Math.max(0, Number(slot.startedAt || 0))
      };
    });
    const activeSlots = slots.filter((slot) => slot.unlocked && slot.isProducing).length;
    // Supplies are consumed only on Start/Add action.
    // Switching drug type in a slot must never reserve or subtract supplies.
    const queuedSupplyDemand = createDrugLabSupplyMap();
    const availableQueuedSupplies = createDrugLabSupplyMap(pharmacySupplies);

    const effects = [];
    if (ownedWarehouseCount > 0) {
      effects.push(
        `Sklady v území: ${ownedWarehouseCount} (+${formatDecimalValue(storageCapacityBonusPct, 2)}% kapacita)`
      );
    }
    if (schoolBoost.totalPct > 0) {
      effects.push(`Škola v districtu: boost produkce +${formatDecimalValue(schoolBoost.totalPct, 2)}%`);
    }
    if (networkProductionBonusPct > 0) {
      effects.push(`Síť laboratoří: +${formatDecimalValue(networkProductionBonusPct, 2)}% produkce`);
    }
    if (core.isOverclockActive(now)) {
      effects.push(`Overclock (${formatDurationLabel(Number(buildingState.effects?.overclockUntil || 0) - now)})`);
    }
    if (core.isCleanBatchActive(now)) {
      effects.push(`Čistá várka (${formatDurationLabel(Number(buildingState.effects?.cleanBatchUntil || 0) - now)})`);
    }
    if (core.isHiddenOperationActive(now)) {
      effects.push(`Skrytý provoz (${formatDurationLabel(Number(buildingState.effects?.hiddenOperationUntil || 0) - now)})`);
    }
    Object.entries(playerState.activeDrugEffects || {}).forEach(([key, stateRef]) => {
      if (!stateRef?.active) return;
      if (now >= Number(stateRef.endsAt || 0)) return;
      effects.push(
        `${getDrugLabEffectLabel(key)} (${formatDurationLabel(Number(stateRef.endsAt || 0) - now)}${
          Number(stateRef.potencyMultiplier || 1) > 1
            ? `, síla x${formatDecimalValue(stateRef.potencyMultiplier, 2)}`
            : ""
        })`
      );
    });

    const primaryDisplayName = primaryTarget.primary?.displayName || activeContext?.variantName || activeContext?.baseName;
    const otherDisplayNames = primaryTarget.entries.slice(1).map((entry) => entry.displayName);
    const combinedDisplayName = otherDisplayNames.length
      ? `${primaryDisplayName} | Další: ${otherDisplayNames.join(", ")}`
      : primaryDisplayName;

    return {
      ...fallback,
      baseName: activeContext.baseName,
      displayName: combinedDisplayName || activeContext.baseName,
      hourlyCleanIncome: incomeRates.hourlyCleanIncome,
      hourlyDirtyIncome: incomeRates.hourlyDirtyIncome,
      hourlyIncome: incomeRates.hourlyTotalIncome,
      dailyIncome: incomeRates.hourlyTotalIncome * 24,
      info:
        "Drug Lab je produkční core budova: každý slot vyrábí zvolenou drogu v reálném čase, produkce generuje heat, "
        + "výstup jde do interního skladu a až po vybrání do hráčových zásob. "
        + "Speciální akce mění riziko/výkon a kapacitu skladu zvyšují budovy Sklad v tvém území.",
      specialActions: [
        "Overclock výroby: cooldown 6h, trvání 2h, +50 % produkce všech slotů, okamžitě +3 heat.",
        "Čistá várka: cooldown 5h, trvání 2h, nově vyrobené dávky jsou enhanced (+20 % síla efektu při použití).",
        "Skrytý provoz: cooldown 6h, trvání 2h, heat z výroby -30 %, produkce -20 %."
      ],
      mechanics: {
        type: "drug-lab",
        instanceKey,
        level: buildingState.level,
        nextLevel,
        nextUpgradeCost,
        cooldowns: {
          overclock: Math.max(0, Number(buildingState.cooldowns?.overclock || 0) - now),
          cleanBatch: Math.max(0, Number(buildingState.cooldowns?.cleanBatch || 0) - now),
          hiddenOperation: Math.max(0, Number(buildingState.cooldowns?.hiddenOperation || 0) - now)
        },
        heatPerDay,
        heatPerHour,
        effectsLabel: effects.length ? effects.join(" • ") : "Žádné",
        unlockedSlots,
        activeSlots,
        slots,
        storage: createDrugLabAmountMap(buildingState.storage),
        storageEnhanced: createDrugLabAmountMap(buildingState.storageEnhanced),
        storedTotal,
        storageCapacity,
        pharmacySupplies,
        availableQueuedSupplies,
        queuedSupplyDemand,
        currentProductionMultiplier: core.getProductionMultiplier(now),
        ownedWarehouseCount,
        storageCapacityBonusPct,
        playerActiveEffects: Object.entries(player.activeDrugEffects || {})
          .map(([key, effect]) => {
            const active = Boolean(effect?.active && now < Number(effect?.endsAt || 0));
            return {
              key,
              name: getDrugLabEffectLabel(key),
              active,
              remainingMs: active ? Math.max(0, Number(effect.endsAt || 0) - now) : 0,
              potencyMultiplier: Number(effect?.potencyMultiplier || 1)
            };
          })
          .filter((entry) => entry.active),
        playerStats: {
          totalHeat: Math.max(0, Math.floor(Number(playerState.totalHeat || 0)))
        },
        ownedLabCount,
        networkProductionBonusPct,
        primaryContext: activeContext,
        primaryDistrictId: activeDistrict?.id ?? null,
        hourlyCleanIncome: incomeRates.hourlyCleanIncome,
        hourlyDirtyIncome: incomeRates.hourlyDirtyIncome,
        hourlyTotalIncome: incomeRates.hourlyTotalIncome
      }
    };
  }

  function runDrugLabAction(action, activeContext, payload = {}) {
    const inputDistrict = activeContext?.district || null;
    const inputContext = activeContext?.context || null;
    if (!inputContext) {
      return { ok: false, message: "Drug Lab: není aktivní detail budovy." };
    }
    const now = Date.now();
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané." };
    }
    const primaryTarget = resolvePrimaryOwnedDrugLabTarget(inputContext, inputDistrict);
    const context = primaryTarget.context || inputContext;
    const district = primaryTarget.district || inputDistrict;
    const sync = runDrugLabTick(context, district, now);
    const { core, player, building, inventory } = sync;
    let result = null;

    if (action === "collect") {
      const collected = core.collectDrugs();
      if (collected.total <= 0) {
        result = { ok: false, message: "Drug Lab: ve skladu není nic k vybrání." };
      } else {
        DRUG_LAB_DRUG_KEYS.forEach((key) => {
          inventory[key] = Math.max(0, Math.floor(Number(inventory[key] || 0) + Number(collected.collected[key] || 0)));
          player.enhancedDrugs[key] = Math.max(
            0,
            Math.floor(Number(player.enhancedDrugs[key] || 0) + Number(collected.collectedEnhanced[key] || 0))
          );
        });
        result = {
          ok: true,
          message:
            `Drug Lab: vybráno ${collected.total} dávek do zásob hráče`
            + ` (${DRUG_LAB_DRUG_KEYS.map((key) => `${DRUG_CONFIG[key].name} ${collected.collected[key] || 0}`).join(", ")}).`
        };
      }
    } else if (action === "overclock") {
      result = core.useOverclock(player, now);
    } else if (action === "cleanBatch") {
      result = core.useCleanBatch(player, now);
    } else if (action === "hiddenOperation") {
      result = core.useHiddenOperation(player, now);
    } else if (action === "upgrade") {
      result = core.upgradeBuilding(player);
    } else if (action === "slotSelect") {
      const slotId = Math.max(1, Math.floor(Number(payload.slotId) || 0));
      const slot = core.getSlotById(slotId);
      const drugType = String(payload.drugType || "").trim();
      if (!slot) {
        result = { ok: false, message: "Slot neexistuje." };
      } else if (Number(slot.id) > core.getUnlockedSlotCount()) {
        result = { ok: false, message: "Slot je zamčený." };
      } else if (slot.isProducing && Math.max(0, Math.floor(Number(slot.queueRemaining || 0))) > 0) {
        result = { ok: false, message: `Slot ${slot.id}: nejdřív zastav výrobu, pak můžeš změnit drogu.` };
      } else if (!DRUG_CONFIG[drugType]) {
        result = { ok: false, message: "Neznámá droga." };
      } else {
        slot.activeDrugType = drugType;
        slot.lastTick = now;
        slot.productionRemainder = 0;
        result = { ok: true, message: `Slot ${slot.id}: nastavena droga ${DRUG_CONFIG[drugType].name}.`, silentUiEvent: true };
      }
    } else if (action === "slotAmount") {
      const slotId = Math.max(1, Math.floor(Number(payload.slotId) || 0));
      const delta = Math.floor(Number(payload.delta) || 0);
      const slot = core.getSlotById(slotId);
      if (!slot) {
        result = { ok: false, message: "Slot neexistuje." };
      } else if (Number(slot.id) > core.getUnlockedSlotCount()) {
        result = { ok: false, message: "Slot je zamčený." };
      } else if (!delta) {
        result = { ok: false, message: "Neplatná změna množství." };
      } else {
        const minUnits = slot.isProducing ? 0 : 1;
        const currentUnits = slot.isProducing
          ? Math.max(0, Math.floor(Number(slot.queuedUnits || 0)))
          : Math.max(1, Math.floor(Number(slot.queuedUnits || 1)));
        slot.queuedUnits = clamp(currentUnits + delta, minUnits, 999);
        result = { ok: true, message: `Slot ${slot.id}: nastaveno ${slot.queuedUnits} dávek.`, silentUiEvent: true };
      }
    } else if (action === "slotStart") {
      const slotId = Math.max(1, Math.floor(Number(payload.slotId) || 0));
      const slot = core.getSlotById(slotId);
      const wasProducing = Boolean(slot?.isProducing && Math.max(0, Math.floor(Number(slot?.queueRemaining || 0))) > 0);
      const selectedDrug = String(payload.drugType || slot?.activeDrugType || "").trim();
      const selectedUnits = clamp(
        Math.floor(Number(payload.units) || Number(slot?.queuedUnits || (wasProducing ? 0 : 1))),
        wasProducing ? 0 : 1,
        999
      );
      const appendedUnits = selectedUnits;
      const supplyCost = getDrugLabSupplyCost(selectedDrug, appendedUnits);
      const availableSupplies = createDrugLabSupplyMap(player.labSupplies || {});
      const hasEnough =
        Number(availableSupplies.chemicals || 0) >= Number(supplyCost.chemicals || 0)
        && Number(availableSupplies.biomass || 0) >= Number(supplyCost.biomass || 0)
        && Number(availableSupplies.stimPack || 0) >= Number(supplyCost.stimPack || 0);
      if (!hasEnough) {
        result = {
          ok: false,
          message:
            `Nedostatek vstupů z Lékárny (potřeba C ${supplyCost.chemicals}, B ${supplyCost.biomass}, S ${supplyCost.stimPack}; `
            + `máš C ${availableSupplies.chemicals}, B ${availableSupplies.biomass}, S ${availableSupplies.stimPack}).`
        };
      } else {
        result = core.startProduction(slotId, selectedDrug, now, selectedUnits);
        if (result?.ok) {
          player.labSupplies = createDrugLabSupplyMap(player.labSupplies || {});
          player.labSupplies.chemicals = Math.max(
            0,
            Math.floor(Number(player.labSupplies.chemicals || 0) - Number(supplyCost.chemicals || 0))
          );
          player.labSupplies.biomass = Math.max(
            0,
            Math.floor(Number(player.labSupplies.biomass || 0) - Number(supplyCost.biomass || 0))
          );
          player.labSupplies.stimPack = Math.max(
            0,
            Math.floor(Number(player.labSupplies.stimPack || 0) - Number(supplyCost.stimPack || 0))
          );
          result.message += ` Spotřeba: C ${supplyCost.chemicals}, B ${supplyCost.biomass}, S ${supplyCost.stimPack}.`;
          if (wasProducing) {
            result.silentUiEvent = true;
          }
        }
      }
    } else if (action === "slotStop") {
      const slotId = Math.max(1, Math.floor(Number(payload.slotId) || 0));
      result = core.stopProduction(slotId, now);
    } else if (action === "useDrug") {
      const drugType = String(payload.drugType || "").trim();
      result = core.useDrug(drugType, now);
    } else {
      result = { ok: false, message: "Neznámá akce Drug Labu." };
    }

    if (result?.ok) {
      pushDrugLabLog(player, result.message, now, { silentUiEvent: Boolean(result.silentUiEvent) });
    }
    persistDrugLabRuntime(sync, now);
    return result;
  }

  function handleDrugLabBuildingAction(actionId, activeContext) {
    const now = Date.now();
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané." };
    }
    if (actionId === "1") return runDrugLabAction("overclock", activeContext);
    if (actionId === "2") return runDrugLabAction("cleanBatch", activeContext);
    if (actionId === "3") return runDrugLabAction("hiddenOperation", activeContext);
    if (actionId === "collect") return runDrugLabAction("collect", activeContext);
    if (actionId === "upgrade") return runDrugLabAction("upgrade", activeContext);
    return { ok: false, message: "Neznámá akce Drug Labu." };
  }

  function renderDrugLabDetailPanel(details) {
    const root = document.getElementById("building-detail-drug-lab");
    if (!root) return;
    const mechanics = details?.mechanics;
    const mechanicsType = String(mechanics?.type || "").trim();
    const getProductBadge = (value, explicitKind = "") => {
      const normalized = String(value || "").trim().toLowerCase();
      const kind = String(explicitKind || "").trim().toLowerCase();
      if (kind === "gear") return { tone: "steel", icon: "gear" };
      if (kind === "chip") return { tone: "cyan", icon: "chip" };
      if (kind === "crate") return { tone: "amber", icon: "crate" };
      if (kind === "attack") return { tone: "red", icon: "crosshair" };
      if (kind === "defense") return { tone: "cyan", icon: "shield" };
      if (!normalized) return { tone: "neutral", icon: "dot" };
      if (normalized.includes("stim")) return { tone: "violet", icon: "plus" };
      if (normalized.includes("chem")) return { tone: "cyan", icon: "flask" };
      if (normalized.includes("bio")) return { tone: "green", icon: "leaf" };
      if (normalized.includes("meth")) return { tone: "cyan", icon: "crystal" };
      if (normalized.includes("coke") || normalized.includes("kok")) return { tone: "red", icon: "powder" };
      if (normalized.includes("pill")) return { tone: "amber", icon: "capsule" };
      if (normalized.includes("acid")) return { tone: "violet", icon: "drop" };
      if (normalized.includes("combat module")) return { tone: "amber", icon: "crate" };
      if (normalized.includes("tech core")) return { tone: "cyan", icon: "chip" };
      if (normalized.includes("metal part")) return { tone: "steel", icon: "gear" };
      return { tone: "neutral", icon: "dot" };
    };
    if (mechanicsType !== "drug-lab" && mechanicsType !== "pharmacy" && mechanicsType !== "factory" && mechanicsType !== "armory") {
      root.innerHTML = "";
      root.classList.add("hidden");
      return;
    }

    if (mechanicsType === "pharmacy") {
      const slotRows = (Array.isArray(mechanics.slots) ? mechanics.slots : [])
        .map((slot) => {
          const producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
          const queuedUnits = Math.max(1, Math.floor(Number(slot.queuedUnits || 1)));
          const queueRemaining = Math.max(0, Math.floor(Number(slot.queueRemaining || 0)));
          const perHour = formatDecimalValue(slot.perHour || 0, 2);
          const cleanCostPerUnit = Math.max(0, Math.floor(Number(slot.cleanCostPerUnit || 0)));
          const totalCleanCost = cleanCostPerUnit * queuedUnits;
          const productBadge = getProductBadge(slot.resourceLabel);
          const slotCapRaw = Number(slot.slotCap);
          const isSlotAtCap = Number.isFinite(slotCapRaw) && producedAmount >= Math.max(0, Math.floor(slotCapRaw));
          const producedLabel = Number.isFinite(slotCapRaw)
            ? `${producedAmount}/${Math.max(0, Math.floor(slotCapRaw))}`
            : `${producedAmount}`;
          return `
            <article class="pharmacy-slot pharmacy-slot--${productBadge.tone}${slot.isProducing ? " pharmacy-slot--active" : " pharmacy-slot--idle"}">
              <div class="pharmacy-slot__head">
                <div class="pharmacy-slot__title-wrap">
                  <div class="pharmacy-slot__title-line">
                    <span class="pharmacy-slot__icon pharmacy-slot__icon--${productBadge.tone} pharmacy-slot__icon--${productBadge.icon}" aria-hidden="true"></span>
                    <strong class="pharmacy-slot__title">${slot.resourceLabel}</strong>
                  </div>
                </div>
                <span class="pharmacy-slot__state">${slot.isProducing ? "Aktivní" : "Připraven"}</span>
              </div>
              <div class="pharmacy-slot__metrics">
                <div class="pharmacy-slot__metric">
                  <span class="pharmacy-slot__metric-label">Rychlost</span>
                  <strong class="pharmacy-slot__metric-value">${perHour}/h</strong>
                </div>
                <div class="pharmacy-slot__metric">
                  <span class="pharmacy-slot__metric-label">Vyrobeno</span>
                  <strong class="pharmacy-slot__metric-value">${producedLabel}</strong>
                </div>
                <div class="pharmacy-slot__metric">
                  <span class="pharmacy-slot__metric-label">Cena</span>
                  <strong class="pharmacy-slot__metric-value">$${cleanCostPerUnit} / ks</strong>
                </div>
                <div class="pharmacy-slot__metric">
                  <span class="pharmacy-slot__metric-label">Ve frontě</span>
                  <strong class="pharmacy-slot__metric-value">${queueRemaining}</strong>
                </div>
              </div>
              <div class="drug-lab-stepper">
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-pharmacy-slot-id="${slot.id}" data-pharmacy-slot-adjust="-1">-</button>
                <strong class="drug-lab-stepper__value">${queuedUnits}</strong>
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-pharmacy-slot-id="${slot.id}" data-pharmacy-slot-adjust="1">+</button>
              </div>
              <div class="pharmacy-slot__actions">
                <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--start" type="button" data-pharmacy-slot-start="${slot.id}" ${isSlotAtCap ? "disabled" : ""}>
                  Vyrobit • $${totalCleanCost}
                </button>
                <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--stop" type="button" data-pharmacy-slot-stop="${slot.id}" ${!slot.isProducing ? "disabled" : ""}>
                  Zastavit
                </button>
              </div>
            </article>
          `;
        })
        .join("");

      const resources = mechanics.resources || {};
      const drugLabSupplies = mechanics.drugLabSupplies || {};
      const internalChemicals = Math.max(0, Math.floor(Number(resources.chemicals || 0)));
      const internalBiomass = Math.max(0, Math.floor(Number(resources.biomass || 0)));
      const internalStimPack = Math.max(0, Math.floor(Number(resources.stimPack || 0)));
      const labChemicals = Math.max(0, Math.floor(Number(drugLabSupplies.chemicals || 0)));
      const labBiomass = Math.max(0, Math.floor(Number(drugLabSupplies.biomass || 0)));
      const labStimPack = Math.max(0, Math.floor(Number(drugLabSupplies.stimPack || 0)));

      root.innerHTML = `
        <section class="drug-lab-card pharmacy-card">
          <div class="pharmacy-stock-grid">
            <div class="pharmacy-stock-card">
              <span class="pharmacy-stock-card__label">Interní sklad Lékárny</span>
              <div class="pharmacy-stock-card__values">
                <span>C ${internalChemicals}</span>
                <span>B ${internalBiomass}</span>
                <span>S ${internalStimPack}</span>
              </div>
            </div>
            <div class="pharmacy-stock-card pharmacy-stock-card--accent">
              <span class="pharmacy-stock-card__label">Zásoby Drug Labu</span>
              <div class="pharmacy-stock-card__values">
                <span>C ${labChemicals}</span>
                <span>B ${labBiomass}</span>
                <span>S ${labStimPack}</span>
              </div>
            </div>
          </div>
          <div class="pharmacy-slot-grid">
            ${slotRows}
          </div>
        </section>
      `;
      root.classList.remove("hidden");
      return;
    }

    if (mechanicsType === "factory") {
      const slotRows = (Array.isArray(mechanics.slots) ? mechanics.slots : [])
        .map((slot) => {
          const isCraftSlot = String(slot.mode || "").trim() === "craft";
          const producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
          const isSlotAtCap = Number.isFinite(Number(slot.slotCap))
            ? producedAmount >= Math.max(0, Math.floor(Number(slot.slotCap || FACTORY_SLOT_STORAGE_CAP)))
            : producedAmount >= FACTORY_SLOT_STORAGE_CAP;
          const productBadge = getProductBadge(
            slot.resourceLabel,
            isCraftSlot
              ? "crate"
              : String(slot.resourceKey || "").trim() === "techCore"
                ? "chip"
                : "gear"
          );
          const slotCap = Math.max(0, Math.floor(Number(slot.slotCap || FACTORY_SLOT_STORAGE_CAP)));
          const producedLabel = isCraftSlot
            ? formatDurationLabel(slot.effectiveDurationMs || FACTORY_CONFIG.combatModule.durationMs)
            : `${producedAmount}/${slotCap || FACTORY_SLOT_STORAGE_CAP}`;
          return `
            <article class="factory-slot${slot.isProducing ? " factory-slot--active" : ""}">
              <div class="factory-slot__head">
                <div class="factory-slot__title-wrap">
                  <span class="drug-production-slot__icon drug-production-slot__icon--${productBadge.tone} drug-production-slot__icon--${productBadge.icon}" aria-hidden="true"></span>
                  <div class="drug-production-slot__titles">
                    <strong class="drug-production-slot__title">${slot.resourceLabel}</strong>
                  </div>
                </div>
                <span class="drug-production-slot__state">${slot.isProducing ? "Produkuje" : isSlotAtCap ? "Plný" : "Připraven"}</span>
              </div>
              <div class="drug-production-slot__metrics">
                <div class="drug-production-slot__metric">
                  <span class="drug-production-slot__metric-label">${isCraftSlot ? "Recept" : "Rychlost"}</span>
                  <strong class="drug-production-slot__metric-value${isCraftSlot ? " factory-slot__recipe-value" : ""}">${isCraftSlot ? `<span class="factory-slot__recipe-line">4 MP</span><span class="factory-slot__recipe-line factory-slot__recipe-line--secondary">+ 3 TC</span>` : `${formatDecimalValue(slot.perHour || 0, 2)}/h`}</strong>
                </div>
                <div class="drug-production-slot__metric">
                  <span class="drug-production-slot__metric-label">${isCraftSlot ? "Čas / kus" : "Vyrobeno"}</span>
                  <strong class="drug-production-slot__metric-value">${producedLabel}</strong>
                </div>
                <div class="drug-production-slot__metric">
                  <span class="drug-production-slot__metric-label">Cena</span>
                  <strong class="drug-production-slot__metric-value factory-slot__price-value">$20</strong>
                </div>
              </div>
              <div class="factory-slot__actions">
                <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--start" type="button" data-factory-slot-start="${slot.id}" ${slot.isProducing ? "disabled" : ""}>
                  Spustit
                </button>
                <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--stop" type="button" data-factory-slot-stop="${slot.id}" ${!slot.isProducing ? "disabled" : ""}>
                  Zastavit
                </button>
              </div>
            </article>
          `;
        })
        .join("");

      const resources = mechanics.resources || {};
      const playerSupplies = mechanics.playerSupplies || {};

      root.innerHTML = `
        <section class="drug-lab-card drug-production-card factory-card">
          <div class="drug-production-card__stats">
            <div class="drug-production-stat">
              <span class="drug-production-stat__label">Interní sklad Továrny</span>
              <strong class="drug-production-stat__value">MP ${Math.max(0, Math.floor(Number(resources.metalParts || 0)))} • TC ${Math.max(0, Math.floor(Number(resources.techCore || 0)))} • CM ${Math.max(0, Math.floor(Number(resources.combatModule || 0)))}</strong>
              <small class="drug-production-stat__meta">aktuálně vyrobené zásoby budovy</small>
            </div>
            <div class="drug-production-stat">
              <span class="drug-production-stat__label">Sklad hráče</span>
              <strong class="drug-production-stat__value">MP ${Math.max(0, Math.floor(Number(playerSupplies.metalParts || 0)))} • TC ${Math.max(0, Math.floor(Number(playerSupplies.techCore || 0)))} • CM ${Math.max(0, Math.floor(Number(playerSupplies.combatModule || 0)))}</strong>
              <small class="drug-production-stat__meta">materiály dostupné mimo budovu</small>
            </div>
          </div>
          <div class="factory-slot-grid">
            ${slotRows}
          </div>
        </section>
      `;
      root.classList.remove("hidden");
      return;
    }

    if (mechanicsType === "armory") {
      const sourceSlots = Array.isArray(mechanics.slots) ? mechanics.slots : [];
      const attackSlots = Array.isArray(mechanics.attackSlots)
        ? mechanics.attackSlots
        : sourceSlots.filter((slot) => String(slot.category || "").trim() !== "defense");
      const defenseSlots = Array.isArray(mechanics.defenseSlots)
        ? mechanics.defenseSlots
        : sourceSlots.filter((slot) => String(slot.category || "").trim() === "defense");
      const playerMaterials = mechanics.playerMaterials || {};
      const renderSlotRows = (slots) => slots
        .map((slot) => {
          const slotBadge = getProductBadge(slot.weaponName, String(slot.category || "").trim() === "defense" ? "defense" : "attack");
          return `
          <article class="armory-slot${slot.isProducing ? " armory-slot--active" : ""}">
              <div class="armory-slot__head">
              <div class="armory-slot__title-wrap">
                <span class="drug-production-slot__icon drug-production-slot__icon--${slotBadge.tone} drug-production-slot__icon--${slotBadge.icon}" aria-hidden="true"></span>
                <div class="drug-production-slot__titles">
                  <strong class="drug-production-slot__title">${slot.weaponName}</strong>
                </div>
              </div>
              <span class="drug-production-slot__state">${slot.isProducing ? "Produkuje" : "Připraven"}</span>
            </div>
            <div class="drug-production-slot__metrics">
              <div class="drug-production-slot__metric">
                <span class="drug-production-slot__metric-label">Vyrobeno</span>
                <strong class="drug-production-slot__metric-value armory-slot__produced-value">
                  ${Math.max(0, Math.floor(Number(slot.producedAmount || 0)))}/${ARMORY_BATCH_MAX_UNITS}
                </strong>
              </div>
              <div class="drug-production-slot__metric">
                <span class="drug-production-slot__metric-label">Ve frontě</span>
                <strong class="drug-production-slot__metric-value armory-slot__queue-value">
                  ${Math.max(0, Math.floor(Number(slot.remainingUnits || 0)))}
                </strong>
              </div>
              <div class="drug-production-slot__metric">
                <span class="drug-production-slot__metric-label">Čas / kus</span>
                <strong class="drug-production-slot__metric-value">${formatProductionDurationLabel(slot.effectiveDurationMs || slot.durationMs)}</strong>
              </div>
              <div class="drug-production-slot__metric drug-production-slot__metric--supplies">
                <span class="drug-production-slot__metric-label">Recept / dávka</span>
                <div class="armory-slot__materials-row">
                  <span class="armory-slot__material-pill armory-slot__material-pill--metal">
                    <span class="armory-slot__material-name">Metal Parts</span>
                    <strong class="armory-slot__material-value">${Math.max(0, Math.floor(Number(slot.metalPartsCost || 0)))}</strong>
                  </span>
                  <span class="armory-slot__material-pill armory-slot__material-pill--tech">
                    <span class="armory-slot__material-name">Tech Core</span>
                    <strong class="armory-slot__material-value">${Math.max(0, Math.floor(Number(slot.techCoreCost || 0)))}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="drug-production-slot__controls">
              <div class="drug-lab-stepper">
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-armory-slot-id="${slot.id}" data-armory-slot-adjust="-1">-</button>
                <strong class="drug-lab-stepper__value">${Math.max(1, Math.floor(Number(slot.queuedUnits || 1)))}</strong>
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-armory-slot-id="${slot.id}" data-armory-slot-adjust="1">+</button>
              </div>
              <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--start" type="button" data-armory-slot-start="${slot.id}" ${
                ((!slot.canAffordQueue) || (slot.isProducing && slot.batchAtMax)) ? "disabled" : ""
              }>
                ${slot.isProducing ? "Přidat" : "Spustit"}
              </button>
              <button class="drug-lab-mini-btn pharmacy-slot__btn pharmacy-slot__btn--stop" type="button" data-armory-slot-stop="${slot.id}" ${!slot.isProducing ? "disabled" : ""}>
                Zastavit
              </button>
            </div>
          </article>
        `;
        })
        .join("");
      const attackRows = renderSlotRows(attackSlots);
      const defenseRows = renderSlotRows(defenseSlots);
      const storedWeapons = mechanics.storedWeapons || {};
      const attackStoredLabel = ARMORY_ATTACK_WEAPON_KEYS
        .map((weaponKey) => {
          const count = Math.max(0, Math.floor(Number(storedWeapons[weaponKey] || 0)));
          const short =
            weaponKey === "baseballBat" ? "BP"
            : weaponKey === "streetPistol" ? "PP"
            : weaponKey === "grenade" ? "GR"
            : weaponKey === "smg" ? "SM"
            : weaponKey === "bazooka" ? "BZ"
            : weaponKey.toUpperCase();
          return `${short} ${count}`;
        })
        .join(" • ");
      const defenseStoredLabel = ARMORY_DEFENSE_WEAPON_KEYS
        .map((weaponKey) => {
          const count = Math.max(0, Math.floor(Number(storedWeapons[weaponKey] || 0)));
          const short =
            weaponKey === "bulletproofVest" ? "NV"
            : weaponKey === "steelBarricades" ? "OB"
            : weaponKey === "securityCameras" ? "BK"
            : weaponKey === "autoMgNest" ? "AKS"
            : weaponKey === "alarmSystem" ? "Alarm"
            : weaponKey.toUpperCase();
          return `${short} ${count}`;
        })
        .join(" • ");
      const metalPartsInStorage = Math.max(0, Math.floor(Number(playerMaterials.metalParts || 0)));
      const techCoreInStorage = Math.max(0, Math.floor(Number(playerMaterials.techCore || 0)));

      root.innerHTML = `
        <section class="drug-lab-card drug-production-card armory-card">
          <div class="drug-production-card__stats">
            <div class="drug-production-stat">
              <span class="drug-production-stat__label">Vyrobené útočné zbraně</span>
              <strong class="drug-production-stat__value">${attackStoredLabel}</strong>
            </div>
            <div class="drug-production-stat">
              <span class="drug-production-stat__label">Vyrobené obranné zbraně</span>
              <strong class="drug-production-stat__value">${defenseStoredLabel}</strong>
            </div>
          </div>
        </section>
        <section class="drug-lab-card drug-production-card armory-card armory-card--materials-sticky">
          <div class="drug-production-card__stats armory-card__materials-stats">
            <div class="drug-production-stat armory-material-stat">
              <span class="drug-production-stat__label">Metal Parts</span>
              <strong class="drug-production-stat__value">${metalPartsInStorage}</strong>
            </div>
            <div class="drug-production-stat armory-material-stat">
              <span class="drug-production-stat__label">Tech Core</span>
              <strong class="drug-production-stat__value">${techCoreInStorage}</strong>
            </div>
          </div>
        </section>
        <div class="armory-layout">
          <div class="drug-lab-card armory-card armory-card--section armory-card--attack">
            <div class="pharmacy-slot-grid">
              ${attackRows}
            </div>
          </div>
          <div class="drug-lab-card armory-card armory-card--section armory-card--defense">
            <div class="pharmacy-slot-grid">
              ${defenseRows}
            </div>
          </div>
        </div>
      `;
      root.classList.remove("hidden");
      return;
    }

    const slotRows = (Array.isArray(mechanics.slots) ? mechanics.slots : [])
      .map((slot) => {
        const options = DRUG_LAB_DRUG_KEYS
          .map((key) =>
            `<option value="${key}" ${slot.activeDrugType === key ? "selected" : ""}>${DRUG_CONFIG[key].name}</option>`
          )
          .join("");
        const activeDrugName = DRUG_CONFIG[String(slot.activeDrugType || "").trim()]?.name || "Není vybráno";
        const productBadge = getProductBadge(activeDrugName);
        if (!slot.unlocked) {
          return `
            <article class="drug-production-slot drug-production-slot--locked">
              <div class="drug-production-slot__head">
                <div class="drug-production-slot__title-wrap">
                  <span class="drug-production-slot__icon drug-production-slot__icon--neutral drug-production-slot__icon--dot" aria-hidden="true"></span>
                  <strong class="drug-production-slot__title">Zamčená výrobní linka</strong>
                </div>
                <span class="drug-production-slot__state">Zamčeno</span>
              </div>
              <div class="drug-production-slot__empty">Odemkneš na vyšším levelu Drug Labu.</div>
            </article>
          `;
        }
        return `
          <article class="drug-production-slot${slot.isProducing ? " drug-production-slot--active" : ""}">
              <div class="drug-production-slot__head">
                <div class="drug-production-slot__title-wrap">
                  <span class="drug-production-slot__icon drug-production-slot__icon--${productBadge.tone} drug-production-slot__icon--${productBadge.icon}" aria-hidden="true"></span>
                  <div class="drug-production-slot__titles">
                    <strong class="drug-production-slot__title">${activeDrugName}</strong>
                  </div>
                </div>
              <span class="drug-production-slot__state">${slot.isProducing ? "Produkuje" : "Připraven"}</span>
            </div>
            <div class="drug-production-slot__metrics">
              <div class="drug-production-slot__metric drug-production-slot__metric--inline">
                <span class="drug-production-slot__metric-label">
                  Vyrobeno
                  <strong class="drug-production-slot__metric-inline-value">${slot.producedAmount}</strong>
                </span>
              </div>
              <div class="drug-production-slot__metric drug-production-slot__metric--inline">
                <span class="drug-production-slot__metric-label">
                  Ve frontě
                  <strong class="drug-production-slot__metric-inline-value">${Math.max(0, Math.floor(Number(slot.queueRemaining || 0)))}</strong>
                </span>
              </div>
              <div class="drug-production-slot__metric drug-production-slot__metric--inline">
                <span class="drug-production-slot__metric-label">
                  Nastaveno
                  <strong class="drug-production-slot__metric-inline-value">${slot.isProducing ? Math.max(0, Math.floor(Number(slot.queuedUnits || 0))) : Math.max(1, Math.floor(Number(slot.queuedUnits || 1)))}</strong>
                </span>
              </div>
              <div class="drug-production-slot__metric drug-production-slot__metric--supplies">
                <span class="drug-production-slot__metric-label">Vstupy / dávka</span>
                <div class="drug-production-slot__supply-row">
                  <span class="drug-production-slot__supply-pill drug-production-slot__supply-pill--chemicals">
                    <span class="drug-production-slot__supply-name">Chemicals</span>
                    <strong class="drug-production-slot__supply-value">${Math.max(0, Math.floor(Number(slot.supplyCost?.chemicals || 0)))}</strong>
                  </span>
                  <span class="drug-production-slot__supply-pill drug-production-slot__supply-pill--biomass">
                    <span class="drug-production-slot__supply-name">Biomass</span>
                    <strong class="drug-production-slot__supply-value">${Math.max(0, Math.floor(Number(slot.supplyCost?.biomass || 0)))}</strong>
                  </span>
                  <span class="drug-production-slot__supply-pill drug-production-slot__supply-pill--stim">
                    <span class="drug-production-slot__supply-name">Stim Pack</span>
                    <strong class="drug-production-slot__supply-value">${Math.max(0, Math.floor(Number(slot.supplyCost?.stimPack || 0)))}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="drug-production-slot__controls">
              <select data-drug-lab-slot-select="${slot.id}" ${slot.isProducing ? "disabled" : ""}>
                ${options}
              </select>
              <div class="drug-lab-stepper">
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-drug-lab-slot-id="${slot.id}" data-drug-lab-slot-adjust="-1">-</button>
                <strong class="drug-lab-stepper__value">${slot.isProducing ? Math.max(0, Math.floor(Number(slot.queuedUnits || 0))) : Math.max(1, Math.floor(Number(slot.queuedUnits || 1)))}</strong>
                <button class="drug-lab-mini-btn drug-lab-mini-btn--step" type="button" data-drug-lab-slot-id="${slot.id}" data-drug-lab-slot-adjust="1">+</button>
              </div>
              <button class="drug-lab-mini-btn" type="button" data-drug-lab-slot-start="${slot.id}" ${
                ""
              }>
                ${slot.isProducing ? "Přidat" : "Start"}
              </button>
              <button class="drug-lab-mini-btn" type="button" data-drug-lab-slot-stop="${slot.id}" ${
                !slot.isProducing ? "disabled" : ""
              }>
                Stop
              </button>
            </div>
          </article>
        `;
      })
      .join("");
    const ownedLabCount = Math.max(1, Math.floor(Number(mechanics.ownedLabCount || 1)));
    const networkProductionBonusPct = Math.max(0, Number(mechanics.networkProductionBonusPct || 0));
    const ownedLabLabel = ownedLabCount === 1
      ? "budova"
      : (ownedLabCount >= 2 && ownedLabCount <= 4 ? "budovy" : "budov");
    const networkStatusLabel =
      `Síť Drug Labů: ${ownedLabCount} ${ownedLabLabel} (+${formatDecimalValue(networkProductionBonusPct, 2)}% produkce)`;
    const ownedWarehouseCount = Math.max(0, Math.floor(Number(mechanics.ownedWarehouseCount || 0)));
    const storageCapacityBonusPct = Math.max(0, Number(mechanics.storageCapacityBonusPct || 0));
    const ownedWarehouseLabel = ownedWarehouseCount === 1
      ? "sklad"
      : (ownedWarehouseCount >= 2 && ownedWarehouseCount <= 4 ? "sklady" : "skladů");
    const warehouseStatusLabel = ownedWarehouseCount > 0
      ? `Sklady v území: ${ownedWarehouseCount} ${ownedWarehouseLabel} (+${formatDecimalValue(storageCapacityBonusPct, 2)}% kapacita)`
      : "Sklady v území: 0 (bez bonusu kapacity)";
    const pharmacySupplies = mechanics.pharmacySupplies || {};
    const availableQueuedSupplies = mechanics.availableQueuedSupplies || pharmacySupplies;
    const queuedSupplyDemand = mechanics.queuedSupplyDemand || createDrugLabSupplyMap();
    const supplyStatusLabel =
      `Vstup z Lékárny: C ${Math.max(0, Math.floor(Number(availableQueuedSupplies.chemicals || 0)))} • `
      + `B ${Math.max(0, Math.floor(Number(availableQueuedSupplies.biomass || 0)))} • `
      + `S ${Math.max(0, Math.floor(Number(availableQueuedSupplies.stimPack || 0)))}`;
    const storageStatusLabel =
      `Interní sklad: ${Math.max(0, Math.floor(Number(mechanics.storedTotal || 0)))}/${Math.max(1, Math.floor(Number(mechanics.storageCapacity || 0)))}`;

    const effectsRows = Array.isArray(mechanics.playerActiveEffects) && mechanics.playerActiveEffects.length
      ? mechanics.playerActiveEffects
        .map((effect) => `
          <div class="drug-lab-list__item">
            <span>${effect.name}</span>
            <span class="drug-lab-list__value">${formatDurationLabel(effect.remainingMs)}</span>
            <small>${effect.potencyMultiplier > 1 ? `síla x${formatDecimalValue(effect.potencyMultiplier, 2)}` : "standard"}</small>
          </div>
        `)
        .join("")
      : `<div class="drug-lab-list__item"><span>Žádné aktivní efekty</span><span class="drug-lab-list__value">-</span><small>-</small></div>`;

    root.innerHTML = `
      <section class="drug-lab-card drug-production-card">
        <div class="drug-production-card__header">
          <div>
            <p class="drug-production-card__subtitle">Řízení výroby, spotřeby vstupů a kapacity skladu.</p>
          </div>
        </div>
        <div class="drug-production-card__stats">
          <div class="drug-production-stat">
            <span class="drug-production-stat__label">Síť Drug Labů</span>
            <strong class="drug-production-stat__value">${ownedLabCount} ${ownedLabLabel}</strong>
            <small class="drug-production-stat__meta">+${formatDecimalValue(networkProductionBonusPct, 2)}% produkce</small>
          </div>
          <div class="drug-production-stat">
            <span class="drug-production-stat__label">Interní sklad</span>
            <strong class="drug-production-stat__value">${Math.max(0, Math.floor(Number(mechanics.storedTotal || 0)))}/${Math.max(1, Math.floor(Number(mechanics.storageCapacity || 0)))}</strong>
            <small class="drug-production-stat__meta">zastaví výrobu při naplnění</small>
          </div>
          <div class="drug-production-stat">
            <span class="drug-production-stat__label">Vstup z Lékárny</span>
            <strong class="drug-production-stat__value">C ${Math.max(0, Math.floor(Number(availableQueuedSupplies.chemicals || 0)))} • B ${Math.max(0, Math.floor(Number(availableQueuedSupplies.biomass || 0)))} • S ${Math.max(0, Math.floor(Number(availableQueuedSupplies.stimPack || 0)))}</strong>
            <small class="drug-production-stat__meta">rezervace ve frontě: C ${Math.max(0, Math.floor(Number(queuedSupplyDemand.chemicals || 0)))} • B ${Math.max(0, Math.floor(Number(queuedSupplyDemand.biomass || 0)))} • S ${Math.max(0, Math.floor(Number(queuedSupplyDemand.stimPack || 0)))}</small>
          </div>
          <div class="drug-production-stat">
            <span class="drug-production-stat__label">Sklady v území</span>
            <strong class="drug-production-stat__value">${ownedWarehouseCount} ${ownedWarehouseLabel}</strong>
            <small class="drug-production-stat__meta">${ownedWarehouseCount > 0 ? `+${formatDecimalValue(storageCapacityBonusPct, 2)}% kapacita` : "bez bonusu kapacity"}</small>
          </div>
        </div>
        <div class="pharmacy-slot-grid">
          ${slotRows}
        </div>
      </section>

      <div class="drug-lab-card">
        <div class="drug-lab-list">${effectsRows}</div>
      </div>
      <div class="drug-lab-card">
        <p class="drug-lab-card__meta">
          Výroba se zastaví po naplnění interního skladu, potom je potřeba použít tlačítko Vybrat drogy.
        </p>
      </div>
    `;

    root.classList.remove("hidden");
    const activeDetail = state.activeBuildingDetail || null;
    const detailDistrict = activeDetail?.district || null;
    const detailContext = activeDetail?.context || null;
    document.dispatchEvent(new CustomEvent("empire:building-detail-opened", {
      detail: {
        districtId: detailDistrict?.id ?? detailContext?.districtId ?? null,
        district: detailDistrict,
        context: detailContext,
        details
      }
    }));
  }

  function handleDrugLabInlineControl(target, activeContext) {
    if (isPoliceRaidAllActionsBlocked(Date.now())) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané.", silentUiEvent: true };
    }
    const amountBtn = target.closest("[data-drug-lab-slot-adjust][data-drug-lab-slot-id]");
    if (amountBtn instanceof HTMLElement) {
      const slotId = Number(amountBtn.dataset.drugLabSlotId || 0);
      const delta = Number(amountBtn.dataset.drugLabSlotAdjust || 0);
      return runDrugLabAction("slotAmount", activeContext, { slotId, delta });
    }

    const select = target.closest("[data-drug-lab-slot-select]");
    if (select instanceof HTMLSelectElement) {
      const slotId = Number(select.dataset.drugLabSlotSelect || 0);
      const drugType = String(select.value || "").trim();
      return runDrugLabAction("slotSelect", activeContext, { slotId, drugType });
    }

    const startBtn = target.closest("[data-drug-lab-slot-start]");
    if (startBtn instanceof HTMLElement) {
      const slotId = Number(startBtn.dataset.drugLabSlotStart || 0);
      return runDrugLabAction("slotStart", activeContext, { slotId });
    }

    const stopBtn = target.closest("[data-drug-lab-slot-stop]");
    if (stopBtn instanceof HTMLElement) {
      const slotId = Number(stopBtn.dataset.drugLabSlotStop || 0);
      return runDrugLabAction("slotStop", activeContext, { slotId });
    }

    return null;
  }

  function handlePharmacyInlineControl(target, activeContext) {
    const now = Date.now();
    const context = activeContext?.context || null;
    const district = activeContext?.district || null;
    if (!context) return null;
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané.", silentUiEvent: true };
    }
    const instanceKey = resolveBuildingInstanceKey(context, district);
    const snapshot = getPharmacyStateByKey(instanceKey, now);
    syncPharmacyProduction(snapshot, now);

    const adjustBtn = target.closest("[data-pharmacy-slot-adjust][data-pharmacy-slot-id]");
    if (adjustBtn instanceof HTMLElement) {
      const slotId = Math.max(1, Math.floor(Number(adjustBtn.dataset.pharmacySlotId) || 0));
      const delta = Math.floor(Number(adjustBtn.dataset.pharmacySlotAdjust) || 0);
      const slot = (Array.isArray(snapshot.slots) ? snapshot.slots : []).find((entry) => Number(entry.id) === slotId) || null;
      if (!slot || !delta) {
        persistPharmacyState(instanceKey, snapshot);
        return { ok: false, message: "Slot Lékárny neexistuje.", silentUiEvent: true };
      }
      const currentUnits = Math.max(1, Math.floor(Number(slot.queuedUnits || 1)));
      const nextUnits = clamp(currentUnits + delta, 1, 999);
      slot.queuedUnits = nextUnits;
      persistPharmacyState(instanceKey, snapshot);
      return {
        ok: true,
        message: `Lékárna slot ${slotId}: nastaveno ${nextUnits} ks.`,
        silentUiEvent: true
      };
    }

    const setSlotState = (slotId, shouldProduce) => {
      const safeSlotId = Math.max(1, Math.floor(Number(slotId) || 0));
      const slot = (Array.isArray(snapshot.slots) ? snapshot.slots : []).find((entry) => Number(entry.id) === safeSlotId) || null;
      if (!slot) {
        persistPharmacyState(instanceKey, snapshot);
        return { ok: false, message: "Slot Lékárny neexistuje." };
      }
      const resourceKey = PHARMACY_RESOURCE_KEYS.includes(String(slot.resourceKey || "").trim()) ? String(slot.resourceKey).trim() : null;
      const capRaw = resourceKey ? Number(PHARMACY_CONFIG.slotStorageCaps?.[resourceKey]) : Number.NaN;
      const hasCap = Number.isFinite(capRaw);
      const producedAmount = Math.max(0, Math.floor(Number(slot.producedAmount || 0)));
      const resourceAmount = resourceKey ? Math.max(0, Math.floor(Number(snapshot.resources?.[resourceKey] || 0))) : 0;
      if (hasCap && producedAmount >= Math.floor(capRaw) && resourceAmount < producedAmount) {
        slot.isProducing = false;
      }
      if (shouldProduce) {
        const resourceKey = PHARMACY_RESOURCE_KEYS.includes(String(slot.resourceKey || "").trim()) ? String(slot.resourceKey).trim() : null;
        const unitCost = resourceKey ? Math.max(0, Math.floor(Number(PHARMACY_UNIT_CLEAN_COST[resourceKey] || 0))) : 0;
        const cap = hasCap ? Math.max(0, Math.floor(capRaw)) : Number.POSITIVE_INFINITY;
        const queuedCurrent = Math.max(0, Math.floor(Number(slot.queueRemaining || 0)));
        const currentUnits = slot.isProducing
          ? queuedCurrent
          : Math.max(1, Math.floor(Number(slot.queuedUnits || 1)));
        const freeSpace = Math.max(0, cap - producedAmount - queuedCurrent);
        const requestedUnits = Math.max(0, Math.min(currentUnits, freeSpace));
        if (requestedUnits <= 0) {
          persistPharmacyState(instanceKey, snapshot);
          return { ok: false, message: `Slot ${safeSlotId} nemá místo pro další výrobu.` };
        }
        const totalCost = requestedUnits * unitCost;
        const spendCleanCash = window.Empire.UI?.trySpendCleanCash;
        if (typeof spendCleanCash !== "function") {
          persistPharmacyState(instanceKey, snapshot);
          return { ok: false, message: "Lékárna: chybí ekonomický modul pro clean cash." };
        }
        const spendResult = spendCleanCash(totalCost);
        if (!spendResult?.ok) {
          persistPharmacyState(instanceKey, snapshot);
          return { ok: false, message: `Nedostatek clean cash (potřeba $${totalCost}).` };
        }
        if (hasCap && producedAmount >= Math.floor(capRaw)) {
          persistPharmacyState(instanceKey, snapshot);
          return { ok: false, message: `Slot ${safeSlotId} je plný. Nejprve vyber suroviny do skladu.` };
        }
        if (slot.isProducing && queuedCurrent > 0) {
          slot.queueRemaining = queuedCurrent + requestedUnits;
          slot.queuedUnits = 1;
          slot.lastTick = now;
          persistPharmacyState(instanceKey, snapshot);
          return {
            ok: true,
            message: `Lékárna slot ${safeSlotId}: do fronty přidáno ${requestedUnits} ks za $${totalCost}.`
          };
        }
        slot.isProducing = true;
        slot.queuedUnits = 0;
        slot.queueRemaining = requestedUnits;
        slot.lastTick = now;
        slot.productionRemainder = 0;
        persistPharmacyState(instanceKey, snapshot);
        return { ok: true, message: `Lékárna slot ${safeSlotId}: výroba spuštěna (${requestedUnits} ks) za $${totalCost}.` };
      }
      if (!slot.isProducing) {
        persistPharmacyState(instanceKey, snapshot);
        return { ok: false, message: `Slot ${safeSlotId} neběží.` };
      }
      const refundUnits = Math.max(0, Math.floor(Number(slot.queueRemaining || 0)));
      const refundUnitCost = resourceKey ? Math.max(0, Math.floor(Number(PHARMACY_UNIT_CLEAN_COST[resourceKey] || 0))) : 0;
      const refundTotal = refundUnits * refundUnitCost;
      const refundCleanCash = window.Empire.UI?.addCleanCash;
      if (refundTotal > 0 && typeof refundCleanCash === "function") {
        refundCleanCash(refundTotal);
      }
      slot.isProducing = false;
      slot.queueRemaining = 0;
      slot.queuedUnits = 1;
      slot.productionRemainder = 0;
      slot.lastTick = now;
      persistPharmacyState(instanceKey, snapshot);
      return {
        ok: true,
        message: refundTotal > 0
          ? `Lékárna slot ${safeSlotId}: výroba zastavena. Vráceno $${refundTotal} clean cash za ${refundUnits} ks z fronty.`
          : `Lékárna slot ${safeSlotId}: výroba zastavena.`
      };
    };

    const startBtn = target.closest("[data-pharmacy-slot-start]");
    if (startBtn instanceof HTMLElement) {
      const slotId = Number(startBtn.dataset.pharmacySlotStart || 0);
      return setSlotState(slotId, true);
    }
    const stopBtn = target.closest("[data-pharmacy-slot-stop]");
    if (stopBtn instanceof HTMLElement) {
      const slotId = Number(stopBtn.dataset.pharmacySlotStop || 0);
      return setSlotState(slotId, false);
    }
    return null;
  }

  function handleFactoryInlineControl(target, activeContext) {
    const now = Date.now();
    const inputContext = activeContext?.context || null;
    const inputDistrict = activeContext?.district || null;
    if (!inputContext) return null;
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané.", silentUiEvent: true };
    }
    const primaryTarget = resolvePrimaryOwnedFactoryTarget(inputContext, inputDistrict);
    const context = primaryTarget.context || inputContext;
    const district = primaryTarget.district || inputDistrict;
    const ownedFactoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, (ownedFactoryCount - 1) * 10);
    const instanceKey = resolveBuildingInstanceKey(context, district);
    const snapshot = getFactoryStateByKey(instanceKey, now);
    syncFactoryProduction(snapshot, now, {
      applyHeat: true,
      ownedFactoryCount,
      networkProductionBonusPct
    });

    const setSlotState = (slotId, shouldProduce) => {
      const safeSlotId = Math.max(1, Math.floor(Number(slotId) || 0));
      const slot = (Array.isArray(snapshot.slots) ? snapshot.slots : []).find((entry) => Number(entry.id) === safeSlotId) || null;
      if (!slot) {
        persistFactoryState(instanceKey, snapshot);
        return { ok: false, message: "Slot Továrny neexistuje." };
      }
      if (shouldProduce) {
        if (slot.isProducing) {
          persistFactoryState(instanceKey, snapshot);
          return { ok: false, message: `Slot ${safeSlotId} už běží.` };
        }
        slot.isProducing = true;
        slot.lastTick = now;
        persistFactoryState(instanceKey, snapshot);
        return { ok: true, message: `Továrna slot ${safeSlotId}: výroba spuštěna.` };
      }
      if (!slot.isProducing) {
        persistFactoryState(instanceKey, snapshot);
        return { ok: false, message: `Slot ${safeSlotId} neběží.` };
      }
      slot.isProducing = false;
      slot.lastTick = now;
      persistFactoryState(instanceKey, snapshot);
      return { ok: true, message: `Továrna slot ${safeSlotId}: výroba zastavena.` };
    };

    const startBtn = target.closest("[data-factory-slot-start]");
    if (startBtn instanceof HTMLElement) {
      const slotId = Number(startBtn.dataset.factorySlotStart || 0);
      return setSlotState(slotId, true);
    }
    const stopBtn = target.closest("[data-factory-slot-stop]");
    if (stopBtn instanceof HTMLElement) {
      const slotId = Number(stopBtn.dataset.factorySlotStop || 0);
      return setSlotState(slotId, false);
    }
    return null;
  }

  function handleArmoryInlineControl(target, activeContext) {
    const now = Date.now();
    const inputContext = activeContext?.context || null;
    const inputDistrict = activeContext?.district || null;
    if (!inputContext) return null;
    if (isPoliceRaidAllActionsBlocked(now)) {
      return { ok: false, message: "Během policejní razie jsou všechny akce v budovách dočasně zakázané.", silentUiEvent: true };
    }
    const primaryTarget = resolvePrimaryOwnedArmoryTarget(inputContext, inputDistrict);
    const context = primaryTarget.context || inputContext;
    const district = primaryTarget.district || inputDistrict;
    const ownedArmoryCount = Math.max(1, primaryTarget.entries.length || 1);
    const networkProductionBonusPct = Math.max(0, (ownedArmoryCount - 1) * 10);
    const instanceKey = resolveBuildingInstanceKey(context, district);
    const snapshot = getArmoryStateByKey(instanceKey, now);
    const syncResult = syncArmoryProduction(snapshot, now, {
      applyHeat: true,
      ownedArmoryCount,
      networkProductionBonusPct
    });
    const adjustBtn = target.closest("[data-armory-slot-adjust][data-armory-slot-id]");
    if (adjustBtn instanceof HTMLElement) {
      const slotId = Math.max(1, Math.floor(Number(adjustBtn.dataset.armorySlotId) || 0));
      const delta = Math.floor(Number(adjustBtn.dataset.armorySlotAdjust) || 0);
      const slot = (Array.isArray(snapshot.slots) ? snapshot.slots : []).find((entry) => Number(entry.id) === slotId) || null;
      if (!slot || !delta) {
        persistArmoryState(instanceKey, snapshot);
        return { ok: false, message: "Slot Zbrojovky neexistuje.", silentUiEvent: true };
      }
      slot.queuedUnits = clamp(Math.floor(Number(slot.queuedUnits || 1) + delta), 1, ARMORY_BATCH_MAX_UNITS);
      persistArmoryState(instanceKey, snapshot);
      return { ok: true, message: `Zbrojovka slot ${slotId}: nastaveno ${slot.queuedUnits} ks.`, silentUiEvent: true };
    }

    const setSlotState = (slotId, shouldProduce) => {
      const safeSlotId = Math.max(1, Math.floor(Number(slotId) || 0));
      const slot = (Array.isArray(snapshot.slots) ? snapshot.slots : []).find((entry) => Number(entry.id) === safeSlotId) || null;
      if (!slot) {
        persistArmoryState(instanceKey, snapshot);
        return { ok: false, message: "Slot Zbrojovky neexistuje.", silentUiEvent: true };
      }
      if (shouldProduce) {
        const config = ARMORY_CONFIG.weapons[String(slot.weaponKey || "").trim()] || null;
        if (!config) {
          persistArmoryState(instanceKey, snapshot);
          return { ok: false, message: "Zbraň pro slot neexistuje.", silentUiEvent: true };
        }
        const units = clamp(Math.floor(Number(slot.queuedUnits || 1)), 1, ARMORY_BATCH_MAX_UNITS);
        const metalCost = Math.max(0, Math.floor(Number(config.metalPartsCost || 0)));
        const techCost = Math.max(0, Math.floor(Number(config.techCoreCost || 0)));
        const currentBatchUnits = clamp(Math.floor(Number(slot.batchMaxUnits || 0)), 0, ARMORY_BATCH_MAX_UNITS);
        const availableBatchSpace = Math.max(0, ARMORY_BATCH_MAX_UNITS - currentBatchUnits);
        const requestedUnits = slot.isProducing ? Math.min(units, availableBatchSpace) : units;
        if (requestedUnits <= 0) {
          persistArmoryState(instanceKey, snapshot);
          return { ok: false, message: `Slot ${safeSlotId} má batch naplněný.`, silentUiEvent: true };
        }
        const totalMetalCost = requestedUnits * metalCost;
        const totalTechCost = requestedUnits * techCost;
        const availableSupplies = createFactoryPlayerSupplyMap(getFactoryPlayerSuppliesSnapshot());
        if (
          Number(availableSupplies.metalParts || 0) < totalMetalCost
          || Number(availableSupplies.techCore || 0) < totalTechCost
        ) {
          persistArmoryState(instanceKey, snapshot);
          return {
            ok: false,
            message:
              `Nedostatek materiálu (potřeba MP ${totalMetalCost}, TC ${totalTechCost}; `
              + `máš MP ${availableSupplies.metalParts}, TC ${availableSupplies.techCore}).`,
            silentUiEvent: true
          };
        }
        availableSupplies.metalParts = Math.max(0, Math.floor(Number(availableSupplies.metalParts || 0) - totalMetalCost));
        availableSupplies.techCore = Math.max(0, Math.floor(Number(availableSupplies.techCore || 0) - totalTechCost));
        persistFactoryPlayerSuppliesSnapshot(availableSupplies);
        const currentlyProducing = Boolean(slot.isProducing && Math.max(0, Math.floor(Number(slot.remainingUnits || 0))) > 0);
        if (currentlyProducing) {
          slot.remainingUnits = Math.max(0, Math.floor(Number(slot.remainingUnits || 0))) + requestedUnits;
          slot.batchMaxUnits = Math.min(ARMORY_BATCH_MAX_UNITS, Math.max(0, Math.floor(Number(slot.batchMaxUnits || 0))) + requestedUnits);
          slot.queuedUnits = 1;
          slot.lastTick = now;
          persistArmoryState(instanceKey, snapshot);
          return {
            ok: true,
            message:
              `Zbrojovka slot ${safeSlotId}: do fronty přidáno ${requestedUnits} ks. `
              + `Spotřeba MP ${totalMetalCost}, TC ${totalTechCost}.`,
            silentUiEvent: true
          };
        }
        slot.isProducing = true;
        slot.producedAmount = 0;
        slot.batchMaxUnits = requestedUnits;
        slot.remainingUnits = requestedUnits;
        slot.queuedUnits = 1;
        slot.lastTick = now;
        slot.productionRemainder = 0;
        persistArmoryState(instanceKey, snapshot);
        return {
          ok: true,
          message:
            `Zbrojovka slot ${safeSlotId}: výroba spuštěna (${requestedUnits} ks). `
            + `Spotřeba MP ${totalMetalCost}, TC ${totalTechCost}.`,
          silentUiEvent: true
        };
      }
      if (!slot.isProducing) {
        persistArmoryState(instanceKey, snapshot);
        return { ok: false, message: `Slot ${safeSlotId} neběží.`, silentUiEvent: true };
      }
      slot.isProducing = false;
      slot.remainingUnits = 0;
      slot.lastTick = now;
      persistArmoryState(instanceKey, snapshot);
      return { ok: true, message: `Zbrojovka slot ${safeSlotId}: výroba zastavena.`, silentUiEvent: true };
    };

    const startBtn = target.closest("[data-armory-slot-start]");
    if (startBtn instanceof HTMLElement) {
      const slotId = Number(startBtn.dataset.armorySlotStart || 0);
      return setSlotState(slotId, true);
    }
    const stopBtn = target.closest("[data-armory-slot-stop]");
    if (stopBtn instanceof HTMLElement) {
      const slotId = Number(stopBtn.dataset.armorySlotStop || 0);
      return setSlotState(slotId, false);
    }
    return null;
  }

  function generateCity() {
    const seed = "empire-city-v1";
    const width = state.mapSize.width;
    const height = state.mapSize.height;
    const districtCount = 150;
    const city = window.Empire.CityGen.generate({ seed, width, height, districtCount });
    const enrichedDistricts = window.Empire.UI?.assignDistrictMetadata
      ? window.Empire.UI.assignDistrictMetadata(city.districts)
      : city.districts;
    setDistricts(enrichedDistricts);
  }

  function bindEvents() {
    state.canvas.addEventListener("mousemove", onMouseMove);
    state.canvas.addEventListener("mouseleave", onMouseLeave);
    state.canvas.addEventListener("mousedown", onMouseDown);
    state.canvas.addEventListener("mouseup", onMouseUp);
    state.canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    state.canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    state.canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    state.canvas.addEventListener("touchcancel", onTouchCancel, { passive: false });
    state.canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    const rect = state.canvas.getBoundingClientRect();
    state.canvas.width = rect.width * window.devicePixelRatio;
    state.canvas.height = rect.height * window.devicePixelRatio;
    state.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    const minScale = getMinScale();
    if (!state.hasViewportOverride) {
      // On fresh load keep map maximally zoomed out (whole city visible).
      state.scale = minScale;
      centerMap();
    } else if (state.scale < minScale) {
      state.scale = minScale;
    }
    clampPan();
    render();
  }

  function toWorld(x, y) {
    return {
      x: (x - state.offsetX) / state.scale,
      y: (y - state.offsetY) / state.scale
    };
  }

  function onMouseMove(event) {
    if (isTouchGhost()) return;
    if (state.isPanning) {
      const dx = event.clientX - state.panStart.x;
      const dy = event.clientY - state.panStart.y;
      state.offsetX = state.viewStart.x + dx;
      state.offsetY = state.viewStart.y + dy;
      clampPan();
      render();
      return;
    }

    const rect = state.canvas.getBoundingClientRect();
    const point = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    const hovered = pickDistrict(point.x, point.y);
    state.hoverId = hovered ? hovered.id : null;
    updateTooltip(hovered, event.clientX, event.clientY);
    render();
  }

  function onMouseLeave() {
    if (isTouchGhost()) return;
    if (state.isPanning) return;
    state.hoverId = null;
    hideTooltip();
    render();
  }

  function onMouseDown(event) {
    if (isTouchGhost()) return;
    if (event.button !== 0) return;
    state.isPanning = true;
    state.hasViewportOverride = true;
    state.panStart = { x: event.clientX, y: event.clientY };
    state.viewStart = { x: state.offsetX, y: state.offsetY };
    state.canvas.style.cursor = "grabbing";
  }

  function notifySelectedDistrictChange() {
    const refreshShortcuts = window.Empire.UI?.refreshMarketBuildingShortcuts;
    if (typeof refreshShortcuts === "function") {
      refreshShortcuts();
    }
  }

  function onMouseUp(event) {
    if (isTouchGhost()) return;
    if (event.button !== 0) return;
    if (!state.isPanning) return;
    const moved = Math.hypot(
      event.clientX - state.panStart.x,
      event.clientY - state.panStart.y
    );
    state.isPanning = false;
    state.canvas.style.cursor = "grab";
    if (moved > 6) return;

    const rect = state.canvas.getBoundingClientRect();
    const point = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    const picked = pickDistrict(point.x, point.y);
    if (picked) {
      state.selectedId = picked.id;
      window.Empire.selectedDistrict = picked;
      document.dispatchEvent(new CustomEvent("empire:district-selected", {
        detail: {
          districtId: picked.id,
          district: picked
        }
      }));
      notifySelectedDistrictChange();
      showModal(picked);
      render();
    }
  }

  function onWindowMouseMove(event) {
    if (isTouchGhost() || !state.isPanning) return;
    const dx = event.clientX - state.panStart.x;
    const dy = event.clientY - state.panStart.y;
    state.offsetX = state.viewStart.x + dx;
    state.offsetY = state.viewStart.y + dy;
    clampPan();
    render();
  }

  function onWheel(event) {
    if (isTouchGhost()) return;
    event.preventDefault();
    state.hasViewportOverride = true;
    const delta = -event.deltaY * 0.0015;
    const minScale = getMinScale();
    const newScale = clamp(state.scale * (1 + delta), minScale, 2.5);

    const rect = state.canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    zoomAtPoint(mx, my, newScale);
  }

  function onTouchStart(event) {
    if (!event.touches.length) return;
    state.lastTouchAt = Date.now();
    hideTooltip();

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      state.isPinching = false;
      state.isPanning = true;
      state.touchMoved = false;
      state.hasViewportOverride = true;
      state.panStart = { x: touch.clientX, y: touch.clientY };
      state.viewStart = { x: state.offsetX, y: state.offsetY };
      event.preventDefault();
      return;
    }

    if (event.touches.length >= 2) {
      state.hasViewportOverride = true;
      beginPinch(event.touches[0], event.touches[1]);
      event.preventDefault();
    }
  }

  function onTouchMove(event) {
    if (!event.touches.length) return;
    state.lastTouchAt = Date.now();

    if (event.touches.length >= 2) {
      const first = event.touches[0];
      const second = event.touches[1];
      const distance = distanceBetweenTouches(first, second);
      if (!state.isPinching || !state.pinchStartDistance) {
        beginPinch(first, second);
      }

      const rect = state.canvas.getBoundingClientRect();
      const midpoint = midpointBetweenTouches(first, second);
      const newScale = clamp(
        state.pinchStartScale * (distance / state.pinchStartDistance),
        getMinScale(),
        2.5
      );
      state.scale = newScale;
      state.offsetX = midpoint.x - rect.left - (state.pinchWorldCenter?.x || 0) * newScale;
      state.offsetY = midpoint.y - rect.top - (state.pinchWorldCenter?.y || 0) * newScale;
      clampPan();
      render();
      event.preventDefault();
      return;
    }

    if (!state.isPanning) return;
    const touch = event.touches[0];
    const dx = touch.clientX - state.panStart.x;
    const dy = touch.clientY - state.panStart.y;
    if (Math.hypot(dx, dy) > 4) state.touchMoved = true;
    state.offsetX = state.viewStart.x + dx;
    state.offsetY = state.viewStart.y + dy;
    clampPan();
    render();
    event.preventDefault();
  }

  function onTouchEnd(event) {
    state.lastTouchAt = Date.now();

    if (state.isPinching && event.touches.length >= 2) {
      beginPinch(event.touches[0], event.touches[1]);
      event.preventDefault();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      state.isPinching = false;
      state.isPanning = true;
      state.panStart = { x: touch.clientX, y: touch.clientY };
      state.viewStart = { x: state.offsetX, y: state.offsetY };
      state.touchMoved = true;
      event.preventDefault();
      return;
    }

    const changedTouch = event.changedTouches[0];
    const shouldOpenDistrict =
      changedTouch &&
      !state.isPinching &&
      state.isPanning &&
      !state.touchMoved;

    state.isPanning = false;
    state.isPinching = false;

    if (shouldOpenDistrict) {
      const rect = state.canvas.getBoundingClientRect();
      const point = toWorld(changedTouch.clientX - rect.left, changedTouch.clientY - rect.top);
      const picked = pickDistrict(point.x, point.y);
      if (picked) {
        state.selectedId = picked.id;
        window.Empire.selectedDistrict = picked;
        document.dispatchEvent(new CustomEvent("empire:district-selected", {
          detail: {
            districtId: picked.id,
            district: picked
          }
        }));
        notifySelectedDistrictChange();
        showModal(picked);
        render();
      }
    }

    event.preventDefault();
  }

  function onTouchCancel() {
    state.lastTouchAt = Date.now();
    state.isPanning = false;
    state.isPinching = false;
    state.touchMoved = false;
  }

  function pickDistrict(x, y) {
    if (y < resolveDistrictTopNoDrawY()) return null;
    for (let i = 0; i < state.districts.length; i += 1) {
      const district = state.districts[i];
      if (pointInPolygon([x, y], district.polygon)) {
        return district;
      }
    }
    return null;
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  function render() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);

    drawBackground(ctx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      0,
      resolveDistrictTopNoDrawY(),
      state.mapSize.width,
      Math.max(0, state.mapSize.height - resolveDistrictTopNoDrawY())
    );
    ctx.clip();
    drawDistricts(ctx);
    ctx.restore();
    drawDistrictTopCutLine(ctx);
    ctx.restore();
  }

  function resolveDistrictTopNoDrawY() {
    return state.mapSize.height * DISTRICT_TOP_NO_DRAW_RATIO;
  }

  function drawDistrictTopCutLine(ctx) {
    if (!shouldDrawDistrictBorders()) return;
    const cutY = resolveDistrictTopNoDrawY();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, cutY);
    ctx.lineTo(state.mapSize.width, cutY);
    ctx.strokeStyle = resolveDistrictBorderStroke();
    ctx.lineWidth = 2;
    ctx.stroke();

    const activeDistrictId = state.selectedId != null ? state.selectedId : state.hoverId;
    const activeDistrict = activeDistrictId != null
      ? resolveDistrictById(activeDistrictId)
      : null;
    const polygon = Array.isArray(activeDistrict?.polygon) ? activeDistrict.polygon : [];
    if (polygon.length >= 3) {
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      polygon.forEach(([x]) => {
        const safeX = Number(x || 0);
        minX = Math.min(minX, safeX);
        maxX = Math.max(maxX, safeX);
      });
      polygon.forEach(([, y]) => {
        const safeY = Number(y || 0);
        minY = Math.min(minY, safeY);
      });
      const isTopDistrict = Number.isFinite(minY) && minY <= cutY + 2;
      if (isTopDistrict && Number.isFinite(minX) && Number.isFinite(maxX)) {
        const startX = Math.max(0, minX);
        const endX = Math.min(state.mapSize.width, maxX);
        if (endX > startX) {
          ctx.beginPath();
          ctx.moveTo(startX, cutY);
          ctx.lineTo(endX, cutY);
          ctx.strokeStyle = state.selectedId != null ? "#facc15" : "#38bdf8";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawBackground(ctx) {
    ctx.fillStyle = "#0b1119";
    ctx.fillRect(-2000, -2000, 6000, 6000);
    if (state.mapImage && state.mapImage.complete) {
      ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
    }
  }

  function drawDistricts(ctx) {
    const now = Date.now();
    const borderStroke = resolveDistrictBorderStroke();
    pruneExpiredAttackMarkers(now);
    pruneExpiredPoliceActions(now);
    pruneExpiredSpyActions(now);
    syncAttackAnimationTicker();

    state.districts.forEach((district) => {
      const fill = districtFill(district);
      const destroyed = isDistrictDestroyed(district);
      const hiddenByMode = shouldHideDistrictByVisibilityMode(district);
      const districtKey = normalizeDistrictId(district?.id);
      const attackMarker = districtKey ? state.attackedDistricts.get(districtKey) : null;
      const policeAction = districtKey ? state.policeDistrictActions.get(districtKey) : null;
      const spyAction = districtKey ? state.spyDistrictActions.get(districtKey) : null;
      const raidAction = districtKey ? state.raidDistrictActions.get(districtKey) : null;
      ctx.fillStyle = fill;
      ctx.strokeStyle = destroyed || hiddenByMode || !shouldDrawDistrictBorders()
        ? "rgba(0,0,0,0)"
        : borderStroke;
      ctx.lineWidth = 1;

      ctx.beginPath();
      district.polygon.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      if (!hiddenByMode && shouldDrawDistrictBorders()) {
        ctx.stroke();
      }
      drawDistrictAllianceIcon(ctx, district);

      if (!hiddenByMode && shouldDrawDistrictBorders() && (district.id === state.hoverId || district.id === state.selectedId)) {
        ctx.strokeStyle = district.id === state.selectedId ? "#facc15" : "#38bdf8";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (destroyed) {
        drawDestroyedDistrictEffect(ctx, district, now);
      }
      if (!destroyed) {
        drawDistrictTrapToxicMist(ctx, district, now);
      }

      if (attackMarker) {
        drawDistrictAttackEffect(ctx, district, attackMarker, now);
      }
      if (policeAction) {
        drawDistrictPoliceActionEffect(ctx, district, policeAction, now);
      }
      if (spyAction) {
        drawDistrictSpyActionEffect(ctx, district, spyAction, now);
      }
      if (raidAction) {
        drawDistrictRaidActionEffect(ctx, district, raidAction, now);
      }
      if (String(district?.id) === String(state.onboardingFocusDistrictId || "")) {
        drawOnboardingFocusDistrictEffect(ctx, district, now);
      }
    });
  }

  function drawOnboardingFocusDistrictEffect(ctx, district, now = Date.now()) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 220);
    const haloAlpha = 0.18 + pulse * 0.18;
    const strokeAlpha = 0.62 + pulse * 0.28;
    const borderOnly = state.onboardingFocusMode === "border";

    if (!borderOnly && drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.fillStyle = `rgba(34,211,238,${haloAlpha.toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    }

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.strokeStyle = `rgba(103,232,249,${strokeAlpha.toFixed(3)})`;
      ctx.lineWidth = 4 + pulse * 2.2;
      ctx.shadowColor = "rgba(34,211,238,0.85)";
      ctx.shadowBlur = 22 + pulse * 14;
      ctx.stroke();
      ctx.restore();
    }
  }

  function normalizeDistrictId(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function resolveAttackMarkerDurationMs(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DISTRICT_ATTACK_MARKER_DEFAULT_DURATION_MS;
    return Math.max(
      DISTRICT_ATTACK_MARKER_MIN_DURATION_MS,
      Math.min(DISTRICT_ATTACK_MARKER_MAX_DURATION_MS, Math.floor(parsed))
    );
  }

  function resolvePoliceActionDurationMs(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DISTRICT_POLICE_ACTION_DEFAULT_DURATION_MS;
    return Math.max(
      DISTRICT_POLICE_ACTION_MIN_DURATION_MS,
      Math.min(DISTRICT_POLICE_ACTION_MAX_DURATION_MS, Math.floor(parsed))
    );
  }

  function resolveSpyActionDurationMs(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DISTRICT_SPY_ACTION_DEFAULT_DURATION_MS;
    return Math.max(
      DISTRICT_SPY_ACTION_MIN_DURATION_MS,
      Math.min(DISTRICT_SPY_ACTION_MAX_DURATION_MS, Math.floor(parsed))
    );
  }

  function resolveRaidActionDurationMs(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DISTRICT_RAID_ACTION_DEFAULT_DURATION_MS;
    return Math.max(
      DISTRICT_RAID_ACTION_MIN_DURATION_MS,
      Math.min(DISTRICT_RAID_ACTION_MAX_DURATION_MS, Math.floor(parsed))
    );
  }

  function pruneExpiredAttackMarkers(now = Date.now()) {
    if (!state.attackedDistricts.size) return false;
    let changed = false;
    for (const [districtKey, marker] of state.attackedDistricts.entries()) {
      if (!marker || !Number.isFinite(Number(marker.expiresAt)) || Number(marker.expiresAt) <= now) {
        state.attackedDistricts.delete(districtKey);
        changed = true;
      }
    }
    return changed;
  }

  function pruneExpiredPoliceActions(now = Date.now()) {
    if (!state.policeDistrictActions.size) return false;
    let changed = false;
    for (const [districtKey, marker] of state.policeDistrictActions.entries()) {
      if (!marker || !Number.isFinite(Number(marker.expiresAt)) || Number(marker.expiresAt) <= now) {
        state.policeDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    return changed;
  }

  function pruneExpiredSpyActions(now = Date.now()) {
    if (!state.spyDistrictActions.size) return false;
    let changed = false;
    for (const [districtKey, marker] of state.spyDistrictActions.entries()) {
      if (!marker || !Number.isFinite(Number(marker.expiresAt)) || Number(marker.expiresAt) <= now) {
        state.spyDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    return changed;
  }

  function pruneExpiredRaidActions(now = Date.now()) {
    if (!state.raidDistrictActions.size) return false;
    let changed = false;
    for (const [districtKey, marker] of state.raidDistrictActions.entries()) {
      if (!marker || !Number.isFinite(Number(marker.expiresAt)) || Number(marker.expiresAt) <= now) {
        state.raidDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    return changed;
  }

  function hasDestroyedDistricts() {
    return state.districts.some((district) => isDistrictDestroyed(district));
  }

  function syncAttackAnimationTicker() {
    if (state.attackedDistricts.size > 0 || state.policeDistrictActions.size > 0 || state.spyDistrictActions.size > 0 || state.raidDistrictActions.size > 0 || hasDestroyedDistricts()) {
      if (state.attackAnimationIntervalId != null) return;
      state.attackAnimationIntervalId = setInterval(() => {
        const now = Date.now();
        const attackChanged = pruneExpiredAttackMarkers(now);
        const policeChanged = pruneExpiredPoliceActions(now);
        const spyChanged = pruneExpiredSpyActions(now);
        const raidChanged = pruneExpiredRaidActions(now);
        if (state.attackedDistricts.size < 1 && state.policeDistrictActions.size < 1 && state.spyDistrictActions.size < 1 && state.raidDistrictActions.size < 1 && !hasDestroyedDistricts()) {
          syncAttackAnimationTicker();
          if (attackChanged || policeChanged || spyChanged || raidChanged) render();
          return;
        }
        render();
      }, DISTRICT_ATTACK_ANIMATION_INTERVAL_MS);
      return;
    }

    if (state.attackAnimationIntervalId != null) {
      clearInterval(state.attackAnimationIntervalId);
      state.attackAnimationIntervalId = null;
    }
  }

  function mapDistrictIdSet() {
    if (state.districtIndexById instanceof Map && state.districtIndexById.size) {
      return new Set(state.districtIndexById.keys());
    }
    return new Set(
      state.districts
        .map((district) => normalizeDistrictId(district?.id))
        .filter(Boolean)
    );
  }

  function normalizePolygonPoint(point) {
    if (Array.isArray(point)) {
      return [Number(point[0] || 0), Number(point[1] || 0)];
    }
    if (point && typeof point === "object") {
      return [Number(point.x || 0), Number(point.y || 0)];
    }
    return [0, 0];
  }

  function normalizeMapPointForEdge(point) {
    const [x, y] = normalizePolygonPoint(point);
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }

  function clonePolygonPoints(points) {
    return (Array.isArray(points) ? points : []).map(normalizePolygonPoint);
  }

  function resolveDistrictBasePolygon(district) {
    const base = Array.isArray(district?.basePolygon) ? district.basePolygon : district?.polygon;
    return clonePolygonPoints(base);
  }

  function mapPolygonToBounds(points, sourceBounds, targetBounds) {
    const safePoints = Array.isArray(points) ? points : [];
    const srcWidth = Number(sourceBounds?.width || 0);
    const srcHeight = Number(sourceBounds?.height || 0);
    const dstWidth = Number(targetBounds?.width || 0);
    const dstHeight = Number(targetBounds?.height || 0);
    if (srcWidth <= 0 || srcHeight <= 0 || dstWidth <= 0 || dstHeight <= 0) return safePoints;
    const srcMinX = Number(sourceBounds.minX || 0);
    const srcMinY = Number(sourceBounds.minY || 0);
    const dstMinX = Number(targetBounds.minX || 0);
    const dstMinY = Number(targetBounds.minY || 0);
    const scaleX = dstWidth / srcWidth;
    const scaleY = dstHeight / srcHeight;
    return safePoints.map(([x, y]) => [
      dstMinX + (x - srcMinX) * scaleX,
      dstMinY + (y - srcMinY) * scaleY
    ]);
  }

  function fitDistrictPolygonsToMap(districts) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    const allPoints = safeDistricts.flatMap((district) =>
      clonePolygonPoints(Array.isArray(district?.basePolygon) ? district.basePolygon : district?.polygon)
    );
    if (allPoints.length < 3) return safeDistricts;

    const sourceBounds = {
      minX: 0,
      minY: 0,
      width: state.mapSize.width,
      height: state.mapSize.height
    };
    if (sourceBounds.width <= 0 || sourceBounds.height <= 0) return safeDistricts;

    const topCutY = resolveDistrictTopNoDrawY();
    const targetBounds = {
      minX: 0,
      minY: topCutY,
      width: state.mapSize.width,
      height: Math.max(1, state.mapSize.height - topCutY)
    };
    const mappedDistricts = safeDistricts.map((district) => {
      const basePolygon = clonePolygonPoints(
        Array.isArray(district?.basePolygon) ? district.basePolygon : district?.polygon
      );
      return {
        ...district,
        basePolygon,
        polygon: mapPolygonToBounds(basePolygon, sourceBounds, targetBounds)
      };
    });

    const downtownDistricts = mappedDistricts.filter((district) => district?.type === "downtown");
    if (!downtownDistricts.length) return mappedDistricts;

    const downtownCenters = downtownDistricts
      .map((district) => {
        const poly = Array.isArray(district?.polygon) ? district.polygon : [];
        if (poly.length < 3) return null;
        return polygonCentroid(poly);
      })
      .filter(Boolean);
    if (!downtownCenters.length) return mappedDistricts;

    const downtownCenterX = downtownCenters.reduce((sum, [x]) => sum + Number(x || 0), 0) / downtownCenters.length;
    const downtownCenterY = downtownCenters.reduce((sum, [, y]) => sum + Number(y || 0), 0) / downtownCenters.length;
    const offsetYMax = state.mapSize.height * DOWNTOWN_VERTICAL_OFFSET_RATIO;
    const radiusX = Math.max(1, state.mapSize.width * DOWNTOWN_WARP_RADIUS_X_RATIO);
    const radiusY = Math.max(1, state.mapSize.height * DOWNTOWN_WARP_RADIUS_Y_RATIO);

    return mappedDistricts.map((district) => {
      const poly = Array.isArray(district?.polygon) ? district.polygon : [];
      if (poly.length < 3) return district;
      const warpedPolygon = poly.map(([x, y]) => {
        const nx = (Number(x || 0) - downtownCenterX) / radiusX;
        const ny = (Number(y || 0) - downtownCenterY) / radiusY;
        const influence = Math.max(0, 1 - (nx * nx + ny * ny));
        return [Number(x || 0), Number(y || 0) - influence * offsetYMax];
      });
      return {
        ...district,
        polygon: warpedPolygon
      };
    });
  }

  function normalizeMapEdgeKey(from, to) {
    const a = normalizeMapPointForEdge(from);
    const b = normalizeMapPointForEdge(to);
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function buildDistrictAdjacencyIndex(districts) {
    const adjacency = new Map();
    const edgeOwners = new Map();
    const safeDistricts = Array.isArray(districts) ? districts : [];

    safeDistricts.forEach((district) => {
      const districtKey = normalizeDistrictId(district?.id);
      if (!districtKey) return;
      if (!adjacency.has(districtKey)) {
        adjacency.set(districtKey, new Set());
      }
      const polygon = Array.isArray(district?.polygon) ? district.polygon : [];
      if (polygon.length < 2) return;
      for (let i = 0; i < polygon.length; i += 1) {
        const from = polygon[i];
        const to = polygon[(i + 1) % polygon.length];
        const edgeKey = normalizeMapEdgeKey(from, to);
        if (!edgeOwners.has(edgeKey)) {
          edgeOwners.set(edgeKey, []);
        }
        edgeOwners.get(edgeKey).push(districtKey);
      }
    });

    edgeOwners.forEach((owners) => {
      const unique = Array.from(new Set(owners));
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

  function resolveDistrictById(districtId) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return null;
    return state.districtIndexById.get(districtKey) || null;
  }

  function resolveNeighborDistricts(districtId, limit = 4) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return [];
    const neighbors = state.districtAdjacencyById.get(districtKey);
    if (!neighbors || !neighbors.size) return [];
    const ownDistrict = resolveDistrictById(districtKey);
    const ownCenter = ownDistrict?.polygon ? polygonCentroid(ownDistrict.polygon) : [0, 0];
    const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
    const ranked = Array.from(neighbors)
      .map((neighborKey) => resolveDistrictById(neighborKey))
      .filter(Boolean)
      .map((neighborDistrict) => {
        const [nx, ny] = polygonCentroid(neighborDistrict.polygon || []);
        const dx = nx - ownCenter[0];
        const dy = ny - ownCenter[1];
        return {
          district: neighborDistrict,
          distance: Math.sqrt(dx * dx + dy * dy)
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.district);
    if (!safeLimit) return ranked;
    return ranked.slice(0, safeLimit);
  }

  function hslToRgbChannels(hueDegrees, saturation, lightness) {
    const hue = (((Number(hueDegrees) || 0) % 360) + 360) % 360 / 360;
    const sat = clampUnit(saturation);
    const light = clampUnit(lightness);

    if (sat === 0) {
      const channel = clampColorChannel(light * 255);
      return [channel, channel, channel];
    }

    const q = light < 0.5
      ? light * (1 + sat)
      : light + sat - light * sat;
    const p = 2 * light - q;
    const hueToChannel = (tRaw) => {
      let t = tRaw;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    return [
      clampColorChannel(hueToChannel(hue + 1 / 3) * 255),
      clampColorChannel(hueToChannel(hue) * 255),
      clampColorChannel(hueToChannel(hue - 1 / 3) * 255)
    ];
  }

  function rebuildDistinctOwnerColorIndex() {
    state.distinctOwnerColorByName.clear();
    if (!state.vision.uniqueOwnerColors) return;

    const ownerKeys = Array.from(new Set(
      state.districts
        .map((district) => normalizeName(district?.owner))
        .filter(Boolean)
    )).sort();
    if (!ownerKeys.length) return;

    const playerOwnerKeys = getPlayerOwnerNames();
    const preferredPlayerColor = normalizeHexColor(localStorage.getItem("empire_gang_color"));
    const usedColorKeys = new Set();
    const colorKey = (channels) => Array.isArray(channels) ? channels.join(",") : "";

    const preferredPlayerChannels = preferredPlayerColor
      ? parseCssColorChannels(preferredPlayerColor)
      : null;
    if (preferredPlayerChannels) {
      ownerKeys.forEach((ownerKey) => {
        if (!playerOwnerKeys.has(ownerKey)) return;
        state.distinctOwnerColorByName.set(ownerKey, preferredPlayerChannels);
      });
      usedColorKeys.add(colorKey(preferredPlayerChannels));
    }

    const unassignedOwners = ownerKeys.filter((ownerKey) => !state.distinctOwnerColorByName.has(ownerKey));
    const unassignedCount = unassignedOwners.length;
    if (!unassignedCount) return;

    const hueOffset = hashOwner(`${ownerKeys.join("|")}:unique-owner-colors`) % 360;
    unassignedOwners.forEach((ownerKey, index) => {
      let hue = (hueOffset + (index * 360) / unassignedCount) % 360;
      let light = 0.55 + (((index % 4) - 1.5) * 0.025);
      let channels = hslToRgbChannels(hue, 0.82, light);
      let guard = 0;
      while (usedColorKeys.has(colorKey(channels)) && guard < 96) {
        hue = (hue + 11.25) % 360;
        light = 0.54 + ((guard % 5) - 2) * 0.018;
        channels = hslToRgbChannels(hue, 0.82, light);
        guard += 1;
      }
      state.distinctOwnerColorByName.set(ownerKey, channels);
      usedColorKeys.add(colorKey(channels));
    });
  }

  function resolveDistinctOwnerChannels(owner) {
    const ownerKey = normalizeName(owner);
    if (!ownerKey) return null;
    const channels = state.distinctOwnerColorByName.get(ownerKey);
    if (!Array.isArray(channels) || channels.length !== 3) return null;
    return channels;
  }

  function resolveDistinctOwnerFill(owner, alpha = 0.4) {
    const channels = resolveDistinctOwnerChannels(owner);
    if (!channels) return null;
    const safeAlpha = Number.isFinite(Number(alpha)) ? Math.max(0, Math.min(1, Number(alpha))) : 0.4;
    return `rgba(${channels[0]},${channels[1]},${channels[2]},${safeAlpha})`;
  }

  function reconcileAttackMarkersWithDistricts() {
    if (!state.attackedDistricts.size) return;
    const districtIdSet = mapDistrictIdSet();
    let changed = false;
    for (const districtKey of state.attackedDistricts.keys()) {
      if (!districtIdSet.has(districtKey)) {
        state.attackedDistricts.delete(districtKey);
        changed = true;
      }
    }
    if (changed) {
      syncAttackAnimationTicker();
    }
  }

  function reconcilePoliceActionsWithDistricts() {
    if (!state.policeDistrictActions.size) return;
    const districtIdSet = mapDistrictIdSet();
    let changed = false;
    for (const districtKey of state.policeDistrictActions.keys()) {
      if (!districtIdSet.has(districtKey)) {
        state.policeDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    if (changed) {
      syncAttackAnimationTicker();
    }
  }

  function reconcileSpyActionsWithDistricts() {
    if (!state.spyDistrictActions.size) return;
    const districtIdSet = mapDistrictIdSet();
    let changed = false;
    for (const districtKey of state.spyDistrictActions.keys()) {
      if (!districtIdSet.has(districtKey)) {
        state.spyDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    if (changed) {
      syncAttackAnimationTicker();
    }
  }

  function reconcileRaidActionsWithDistricts() {
    if (!state.raidDistrictActions.size) return;
    const districtIdSet = mapDistrictIdSet();
    let changed = false;
    for (const districtKey of state.raidDistrictActions.keys()) {
      if (!districtIdSet.has(districtKey)) {
        state.raidDistrictActions.delete(districtKey);
        changed = true;
      }
    }
    if (changed) {
      syncAttackAnimationTicker();
    }
  }

  function markDistrictUnderAttack(districtId, options = {}) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) {
      return { ok: false, reason: "invalid_district" };
    }
    const districtExists = Boolean(resolveDistrictById(districtKey));
    if (!districtExists) {
      return { ok: false, reason: "district_not_found" };
    }

    const now = Date.now();
    const durationMs = resolveAttackMarkerDurationMs(options?.durationMs);
    const attackerDistrictKey = normalizeDistrictId(options?.attackerDistrictId);
    const markerSeed = hashOwner(`${attackerDistrictKey || "unknown"}:${districtKey}:attack-marker`);

    state.attackedDistricts.set(districtKey, {
      districtId: districtKey,
      attackerDistrictId: attackerDistrictKey || null,
      source: String(options?.source || "combat").trim() || "combat",
      startedAt: now,
      expiresAt: now + durationMs,
      seed: markerSeed,
      flameAnchors: null
    });
    syncAttackAnimationTicker();
    render();

    return { ok: true };
  }

  function setUnderAttackDistricts(markers, options = {}) {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    const replace = options?.replace !== false;
    if (replace) {
      state.attackedDistricts.clear();
    }
    safeMarkers.forEach((item) => {
      const districtId = item?.districtId ?? item?.id;
      if (districtId == null) return;
      markDistrictUnderAttack(districtId, {
        attackerDistrictId: item?.attackerDistrictId,
        durationMs: item?.durationMs,
        source: item?.source
      });
    });
    if (!safeMarkers.length && replace) {
      syncAttackAnimationTicker();
      render();
    }
  }

  function markDistrictPoliceAction(districtId, options = {}) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) {
      return { ok: false, reason: "invalid_district" };
    }
    const districtExists = Boolean(resolveDistrictById(districtKey));
    if (!districtExists) {
      return { ok: false, reason: "district_not_found" };
    }

    const now = Date.now();
    const durationMs = resolvePoliceActionDurationMs(options?.durationMs);
    const markerSeed = hashOwner(`${districtKey}:${String(options?.source || "police-action")}:police-action`);
    const operationType = String(options?.operationType || "").trim();
    const raidSpecialtyKey = String(options?.raidSpecialtyKey || "").trim();

    state.policeDistrictActions.set(districtKey, {
      districtId: districtKey,
      source: String(options?.source || "police-action").trim() || "police-action",
      operationType,
      raidSpecialtyKey,
      startedAt: now,
      expiresAt: now + durationMs,
      seed: markerSeed
    });
    document.dispatchEvent(new CustomEvent("empire:police-action-started", {
      detail: {
        districtId: districtKey,
        durationMs,
        source: String(options?.source || "police-action").trim() || "police-action",
        operationType,
        raidSpecialtyKey,
        startedAt: now
      }
    }));
    syncAttackAnimationTicker();
    render();

    return { ok: true };
  }

  function setPoliceActionDistricts(markers, options = {}) {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    const replace = options?.replace !== false;
    if (replace) {
      state.policeDistrictActions.clear();
    }
    safeMarkers.forEach((item) => {
      const districtId = item?.districtId ?? item?.id;
      if (districtId == null) return;
      markDistrictPoliceAction(districtId, {
        durationMs: item?.durationMs,
        source: item?.source
      });
    });
    if (!safeMarkers.length && replace) {
      syncAttackAnimationTicker();
      render();
    }
  }

  function markDistrictSpyAction(districtId, options = {}) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) {
      return { ok: false, reason: "invalid_district" };
    }
    const districtExists = Boolean(resolveDistrictById(districtKey));
    if (!districtExists) {
      return { ok: false, reason: "district_not_found" };
    }

    const now = Date.now();
    const durationMs = resolveSpyActionDurationMs(options?.durationMs);
    const markerSeed = hashOwner(`${districtKey}:${String(options?.source || "spy-action")}:spy-action`);

    state.spyDistrictActions.set(districtKey, {
      districtId: districtKey,
      source: String(options?.source || "spy-action").trim() || "spy-action",
      startedAt: now,
      expiresAt: now + durationMs,
      seed: markerSeed
    });
    syncAttackAnimationTicker();
    render();

    return { ok: true };
  }

  function setSpyActionDistricts(markers, options = {}) {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    const replace = options?.replace !== false;
    if (replace) {
      state.spyDistrictActions.clear();
    }
    safeMarkers.forEach((item) => {
      const districtId = item?.districtId ?? item?.id;
      if (districtId == null) return;
      markDistrictSpyAction(districtId, {
        durationMs: item?.durationMs,
        source: item?.source
      });
    });
    if (!safeMarkers.length && replace) {
      syncAttackAnimationTicker();
      render();
    }
  }

  function markDistrictRaidAction(districtId, options = {}) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) {
      return { ok: false, reason: "invalid_district" };
    }
    const districtExists = Boolean(resolveDistrictById(districtKey));
    if (!districtExists) {
      return { ok: false, reason: "district_not_found" };
    }

    const now = Date.now();
    const durationMs = resolveRaidActionDurationMs(options?.durationMs);
    const markerSeed = hashOwner(`${districtKey}:${String(options?.source || "raid-action")}:raid-action`);

    state.raidDistrictActions.set(districtKey, {
      districtId: districtKey,
      source: String(options?.source || "raid-action").trim() || "raid-action",
      startedAt: now,
      expiresAt: now + durationMs,
      seed: markerSeed
    });
    syncAttackAnimationTicker();
    render();

    return { ok: true };
  }

  function clearDistrictRaidAction(districtId) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return;
    if (!state.raidDistrictActions.delete(districtKey)) return;
    syncAttackAnimationTicker();
    render();
  }

  function clearAllRaidActions() {
    if (!state.raidDistrictActions.size) return;
    state.raidDistrictActions.clear();
    syncAttackAnimationTicker();
    render();
  }

  function clearDistrictUnderAttack(districtId) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return;
    if (!state.attackedDistricts.delete(districtKey)) return;
    syncAttackAnimationTicker();
    render();
  }

  function clearAllUnderAttackDistricts() {
    if (!state.attackedDistricts.size) return;
    state.attackedDistricts.clear();
    syncAttackAnimationTicker();
    render();
  }

  function clearDistrictPoliceAction(districtId) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return;
    if (!state.policeDistrictActions.delete(districtKey)) return;
    syncAttackAnimationTicker();
    render();
  }

  function clearAllPoliceActions() {
    if (!state.policeDistrictActions.size) return;
    state.policeDistrictActions.clear();
    syncAttackAnimationTicker();
    render();
  }

  function clearDistrictSpyAction(districtId) {
    const districtKey = normalizeDistrictId(districtId);
    if (!districtKey) return;
    if (!state.spyDistrictActions.delete(districtKey)) return;
    syncAttackAnimationTicker();
    render();
  }

  function clearAllSpyActions() {
    if (!state.spyDistrictActions.size) return;
    state.spyDistrictActions.clear();
    syncAttackAnimationTicker();
    render();
  }

  function drawDistrictPolygonPath(ctx, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    ctx.beginPath();
    polygon.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    return true;
  }

  function polygonBounds(poly) {
    const points = Array.isArray(poly) ? poly : [];
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    points.forEach((point) => {
      const x = Number(point?.[0] || 0);
      const y = Number(point?.[1] || 0);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY)
    };
  }

  function createSeededRandom(seed) {
    let value = (Math.floor(Number(seed) || 0) >>> 0) || 1;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function clampUnit(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(1, numeric));
  }

  function resolveAttackFlameAnchorCount(bounds) {
    const width = Math.max(20, Number(bounds?.width || 0));
    const height = Math.max(20, Number(bounds?.height || 0));
    const area = width * height;
    return Math.max(3, Math.min(8, Math.round(area / 8800) + 3));
  }

  function createAttackFlameAnchors(district, marker, bounds) {
    const polygon = Array.isArray(district?.polygon) ? district.polygon : [];
    if (polygon.length < 3) return [];
    const safeBounds = bounds && Number.isFinite(bounds.width) ? bounds : polygonBounds(polygon);
    const width = Math.max(20, safeBounds.width || 0);
    const height = Math.max(20, safeBounds.height || 0);
    const targetCount = resolveAttackFlameAnchorCount(safeBounds);
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 1;
    const random = createSeededRandom(safeSeed ^ 0x4c7f9d1b);
    const anchors = [];
    const aspectRatio = width / Math.max(1, height);
    const cols = Math.max(1, Math.ceil(Math.sqrt(targetCount * aspectRatio)));
    const rows = Math.max(1, Math.ceil(targetCount / cols));
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const minDistance = Math.max(4, Math.min(cellWidth, cellHeight) * 0.45);
    const candidatePoints = [];
    const probeOffsets = [
      [0, 0],
      [0.22, -0.18],
      [-0.2, 0.2],
      [0.18, 0.24],
      [-0.18, -0.18],
      [0.36, 0],
      [-0.36, 0],
      [0, 0.34],
      [0, -0.34]
    ];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const centerX = safeBounds.minX + (col + 0.5) * cellWidth;
        const centerY = safeBounds.minY + (row + 0.5) * cellHeight;
        const jitterX = (random() - 0.5) * cellWidth * 0.28;
        const jitterY = (random() - 0.5) * cellHeight * 0.28;
        let accepted = null;

        for (let i = 0; i < probeOffsets.length; i += 1) {
          const [ox, oy] = probeOffsets[(i + col + row) % probeOffsets.length];
          const x = centerX + jitterX + ox * cellWidth * 0.32;
          const y = centerY + jitterY + oy * cellHeight * 0.32;
          if (pointInPolygon([x, y], polygon)) {
            accepted = { x, y };
            break;
          }
        }

        if (accepted) {
          candidatePoints.push(accepted);
        }
      }
    }

    if (candidatePoints.length > targetCount) {
      const stride = candidatePoints.length / targetCount;
      for (let i = 0; i < targetCount; i += 1) {
        const index = Math.min(candidatePoints.length - 1, Math.floor((i + 0.5) * stride));
        anchors.push(candidatePoints[index]);
      }
    } else {
      anchors.push(...candidatePoints);
    }

    const pointTooClose = (point, points, distance) => points.some((existing) =>
      Math.hypot(point.x - existing.x, point.y - existing.y) < distance
    );

    let tries = 0;
    const maxTries = targetCount * 120;
    while (anchors.length < targetCount && tries < maxTries) {
      const candidate = {
        x: safeBounds.minX + random() * width,
        y: safeBounds.minY + random() * height
      };
      if (!pointInPolygon([candidate.x, candidate.y], polygon)) {
        tries += 1;
        continue;
      }
      if (pointTooClose(candidate, anchors, minDistance * 0.72)) {
        tries += 1;
        continue;
      }
      anchors.push(candidate);
      tries += 1;
    }

    const [cx, cy] = polygonCentroid(polygon);
    while (anchors.length < targetCount) {
      const angle = random() * Math.PI * 2;
      const radius = Math.min(width, height) * (0.1 + random() * 0.24);
      anchors.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }

    return anchors.slice(0, targetCount).map((point) => ({
      x: point.x,
      y: point.y,
      scale: 0.56 + random() * 0.62,
      phase: random() * Math.PI * 2,
      jitter: 0.5 + random() * 0.9
    }));
  }

  function getAttackFlameAnchors(district, marker, bounds) {
    if (!marker || typeof marker !== "object") return [];
    if (!Array.isArray(marker.flameAnchors) || !marker.flameAnchors.length) {
      marker.flameAnchors = createAttackFlameAnchors(district, marker, bounds);
    }
    return marker.flameAnchors;
  }

  function samplePointInsidePolygon(polygon, bounds, random, maxTries = 140) {
    const safePolygon = Array.isArray(polygon) ? polygon : [];
    if (safePolygon.length < 3) return { x: 0, y: 0 };
    const safeBounds = bounds && Number.isFinite(bounds.width) ? bounds : polygonBounds(safePolygon);
    const width = Math.max(1, Number(safeBounds.width || 1));
    const height = Math.max(1, Number(safeBounds.height || 1));
    const tries = Math.max(20, Math.floor(Number(maxTries) || 140));
    for (let i = 0; i < tries; i += 1) {
      const x = safeBounds.minX + random() * width;
      const y = safeBounds.minY + random() * height;
      if (pointInPolygon([x, y], safePolygon)) {
        return { x, y };
      }
    }
    const [cx, cy] = polygonCentroid(safePolygon);
    return { x: cx, y: cy };
  }

  function resolveDestroyedCrackCount(bounds) {
    const width = Math.max(20, Number(bounds?.width || 0));
    const height = Math.max(20, Number(bounds?.height || 0));
    const area = width * height;
    return Math.max(22, Math.min(64, Math.round(area / 4200)));
  }

  function createDestroyedCrackPolyline(startPoint, direction, length, random, polygon) {
    const points = [{ x: startPoint.x, y: startPoint.y }];
    const safeLength = Math.max(10, Number(length || 0));
    const minStep = Math.max(4, safeLength * 0.09);
    const maxStep = Math.max(minStep + 2, safeLength * 0.25);
    const stepCount = Math.max(2, Math.floor(2 + random() * 3));
    let remaining = safeLength;
    let angle = direction;
    let current = startPoint;

    for (let step = 0; step < stepCount && remaining > 2; step += 1) {
      const stepLength = Math.min(remaining, minStep + random() * (maxStep - minStep));
      const nextAngle = angle + (random() - 0.5) * 0.72;
      const candidate = {
        x: current.x + Math.cos(nextAngle) * stepLength,
        y: current.y + Math.sin(nextAngle) * stepLength
      };
      if (!pointInPolygon([candidate.x, candidate.y], polygon)) {
        angle = nextAngle + Math.PI * (0.7 + random() * 0.4);
        continue;
      }
      points.push(candidate);
      current = candidate;
      angle = nextAngle;
      remaining -= stepLength;
    }

    return points;
  }

  function buildDestroyedCrackSegments(district, safeSeed, bounds) {
    const polygon = Array.isArray(district?.polygon) ? district.polygon : [];
    if (polygon.length < 3) return [];
    const random = createSeededRandom(safeSeed ^ 0x5a7b3c1d);
    const crackCount = resolveDestroyedCrackCount(bounds);
    const minDimension = Math.max(20, Math.min(bounds.width || 20, bounds.height || 20));
    const segments = [];

    for (let i = 0; i < crackCount; i += 1) {
      const start = samplePointInsidePolygon(polygon, bounds, random);
      const angle = random() * Math.PI * 2;
      const length = minDimension * (0.16 + random() * 0.5);
      const primary = createDestroyedCrackPolyline(start, angle, length, random, polygon);
      if (primary.length > 1) {
        segments.push({
          points: primary,
          width: 0.7 + random() * 1.1,
          alpha: 0.08 + random() * 0.12
        });
      }

      if (primary.length > 2 && random() < 0.45) {
        const branchOrigin = primary[Math.max(1, Math.floor(random() * (primary.length - 1)))];
        const branchAngle = angle + (random() < 0.5 ? -1 : 1) * (0.5 + random() * 0.9);
        const branchLength = length * (0.25 + random() * 0.35);
        const branch = createDestroyedCrackPolyline(branchOrigin, branchAngle, branchLength, random, polygon);
        if (branch.length > 1) {
          segments.push({
            points: branch,
            width: 0.5 + random() * 0.8,
            alpha: 0.06 + random() * 0.08
          });
        }
      }
    }

    return segments;
  }

  function getDestroyedCrackSegments(district, safeSeed, bounds) {
    if (!district || typeof district !== "object") return [];
    const cachedSeed = Number(district.__destroyedCrackSeed);
    const cachedSegments = district.__destroyedCrackSegments;
    if (cachedSeed === safeSeed && Array.isArray(cachedSegments) && cachedSegments.length) {
      return cachedSegments;
    }
    const next = buildDestroyedCrackSegments(district, safeSeed, bounds);
    district.__destroyedCrackSeed = safeSeed;
    district.__destroyedCrackSegments = next;
    return next;
  }

  function drawAttackSmokeInDistrict(ctx, district, marker, now, cx, cy, bounds, pulse, lifeRatio) {
    if (!drawDistrictPolygonPath(ctx, district.polygon)) return;
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const random = createSeededRandom(safeSeed ^ 0x1e3d5a77);
    const baseRadius = Math.max(16, Math.min(52, Math.min(bounds.width || 16, bounds.height || 16) * 0.42));
    const smokeStrength = Math.max(0.24, 0.52 - lifeRatio * 0.17);

    ctx.save();
    drawDistrictPolygonPath(ctx, district.polygon);
    ctx.clip();
    ctx.globalCompositeOperation = "source-over";

    for (let i = 0; i < 8; i += 1) {
      const drift = Math.sin(now / 820 + i * 0.62 + safeSeed * 0.00013);
      const x = cx + (random() - 0.5) * baseRadius * 1.6 + drift * baseRadius * 0.14;
      const y = cy - baseRadius * (0.32 + random() * 0.3) - Math.abs(drift) * baseRadius * 0.18;
      const radius = baseRadius * (0.65 + random() * 0.85 + pulse * 0.16);
      const alphaCore = smokeStrength * (0.7 + random() * 0.3);
      const alphaMid = alphaCore * 0.62;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.16, x, y, radius);
      gradient.addColorStop(0, `rgba(28, 28, 32, ${alphaCore.toFixed(3)})`);
      gradient.addColorStop(0.58, `rgba(20, 20, 24, ${alphaMid.toFixed(3)})`);
      gradient.addColorStop(1, "rgba(12, 12, 14, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawAttackSmokeInNeighborDistricts(ctx, district, marker, now, cx, cy, bounds, pulse, lifeRatio) {
    const neighbors = resolveNeighborDistricts(district?.id, 5);
    if (!neighbors.length) return;
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;

    neighbors.forEach((neighbor, index) => {
      if (!Array.isArray(neighbor?.polygon) || neighbor.polygon.length < 3) return;
      const [nx, ny] = polygonCentroid(neighbor.polygon);
      const mix = 0.58 + index * 0.03;
      const smokeX = cx + (nx - cx) * mix;
      const smokeY = cy + (ny - cy) * mix - (bounds.height || 20) * 0.06;
      const baseRadius = Math.max(14, Math.min(40, Math.min(bounds.width || 14, bounds.height || 14) * 0.34));
      const radius = baseRadius * (1.24 + pulse * 0.16 + index * 0.08);
      const strength = Math.max(0.08, (0.24 - index * 0.03) * (1 - lifeRatio * 0.3));
      if (strength <= 0.01) return;

      ctx.save();
      drawDistrictPolygonPath(ctx, neighbor.polygon);
      ctx.clip();
      ctx.globalCompositeOperation = "source-over";
      const sway = Math.sin((now / 900) + index + safeSeed * 0.00009) * radius * 0.06;
      const gradient = ctx.createRadialGradient(smokeX + sway, smokeY, radius * 0.14, smokeX + sway, smokeY, radius);
      gradient.addColorStop(0, `rgba(24, 24, 28, ${strength.toFixed(3)})`);
      gradient.addColorStop(0.62, `rgba(18, 18, 22, ${(strength * 0.55).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(10, 10, 12, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(smokeX + sway, smokeY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawAttackAmbientSmokeAroundDistrict(ctx, marker, now, cx, cy, bounds, pulse, lifeRatio) {
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const spreadBase = Math.max(34, Math.min(120, Math.max(bounds.width || 34, bounds.height || 34) * 0.6));
    const intensity = Math.max(0.06, 0.18 - lifeRatio * 0.06);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + (safeSeed % 31) * 0.04;
      const drift = Math.sin(now / 980 + i * 0.7 + safeSeed * 0.00007);
      const centerX = cx + Math.cos(angle) * spreadBase * (0.42 + i * 0.08) + drift * spreadBase * 0.08;
      const centerY = cy + Math.sin(angle) * spreadBase * (0.26 + i * 0.06) - spreadBase * 0.14;
      const radius = spreadBase * (0.95 + pulse * 0.2 + i * 0.18);
      const coreAlpha = intensity * (0.65 - i * 0.1);
      if (coreAlpha <= 0.01) continue;
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.12, centerX, centerY, radius);
      gradient.addColorStop(0, `rgba(26, 26, 30, ${coreAlpha.toFixed(3)})`);
      gradient.addColorStop(0.6, `rgba(18, 18, 22, ${(coreAlpha * 0.55).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(10, 10, 12, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawAttackFlameSprite(ctx, x, y, size, alpha, phase, pulse) {
    const safeSize = Math.max(10, Number(size || 0));
    const safeAlpha = Math.max(0.12, Math.min(1, Number(alpha || 0)));
    const wobble = Math.sin(Date.now() / 140 + Number(phase || 0)) * safeSize * 0.05;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 + pulse * 0.04, 1 + pulse * 0.08);
    ctx.globalAlpha = safeAlpha;

    const outerGradient = ctx.createLinearGradient(0, safeSize * 0.62, 0, -safeSize * 0.88);
    outerGradient.addColorStop(0, "rgba(120, 16, 0, 0.96)");
    outerGradient.addColorStop(0.36, "rgba(255, 94, 0, 0.94)");
    outerGradient.addColorStop(0.72, "rgba(255, 174, 36, 0.9)");
    outerGradient.addColorStop(1, "rgba(255, 241, 153, 0.84)");

    ctx.beginPath();
    ctx.moveTo(0, -safeSize * 0.92 + wobble);
    ctx.bezierCurveTo(
      safeSize * 0.52, -safeSize * 0.48,
      safeSize * 0.62, safeSize * 0.04,
      0, safeSize * 0.7
    );
    ctx.bezierCurveTo(
      -safeSize * 0.62, safeSize * 0.04,
      -safeSize * 0.52, -safeSize * 0.48,
      0, -safeSize * 0.92 + wobble
    );
    ctx.closePath();
    ctx.fillStyle = outerGradient;
    ctx.shadowBlur = safeSize * 0.5;
    ctx.shadowColor = "rgba(255, 98, 0, 0.72)";
    ctx.fill();

    const innerGradient = ctx.createLinearGradient(0, safeSize * 0.48, 0, -safeSize * 0.56);
    innerGradient.addColorStop(0, "rgba(255, 164, 40, 0.92)");
    innerGradient.addColorStop(0.46, "rgba(255, 219, 115, 0.9)");
    innerGradient.addColorStop(1, "rgba(255, 248, 214, 0.82)");

    ctx.beginPath();
    ctx.moveTo(0, -safeSize * 0.56 + wobble * 0.6);
    ctx.bezierCurveTo(
      safeSize * 0.28, -safeSize * 0.22,
      safeSize * 0.26, safeSize * 0.1,
      0, safeSize * 0.42
    );
    ctx.bezierCurveTo(
      -safeSize * 0.26, safeSize * 0.1,
      -safeSize * 0.28, -safeSize * 0.22,
      0, -safeSize * 0.56 + wobble * 0.6
    );
    ctx.closePath();
    ctx.fillStyle = innerGradient;
    ctx.shadowBlur = safeSize * 0.24;
    ctx.shadowColor = "rgba(255, 214, 120, 0.7)";
    ctx.fill();

    ctx.restore();
  }

  function drawDestroyedDistrictSmoke(ctx, district, now, safeSeed, cx, cy, bounds) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI * 2 * i) / 3 + (safeSeed % 37) * 0.01;
        const drift = Math.sin(now / (5200 + i * 900) + i + safeSeed * 0.00007) * 4;
        const smokeX = cx + Math.cos(angle) * (bounds.width * (0.1 + i * 0.05)) + drift;
        const smokeY = cy + Math.sin(angle) * (bounds.height * (0.08 + i * 0.04)) - bounds.height * 0.12;
        const radius = Math.max(22, Math.min(72, Math.max(bounds.width, bounds.height) * (0.22 + i * 0.06)));
        const gradient = ctx.createRadialGradient(smokeX, smokeY, radius * 0.12, smokeX, smokeY, radius);
        gradient.addColorStop(0, "rgba(38, 38, 44, 0.10)");
        gradient.addColorStop(0.62, "rgba(24, 24, 30, 0.06)");
        gradient.addColorStop(1, "rgba(12, 12, 16, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const neighbors = resolveNeighborDistricts(district.id, 2);
    neighbors.forEach((neighbor, index) => {
      if (!neighbor?.polygon || neighbor.polygon.length < 3) return;
      const [nx, ny] = polygonCentroid(neighbor.polygon);
      const nb = polygonBounds(neighbor.polygon);
      const drift = Math.cos(now / (7000 + index * 1100) + safeSeed * 0.00009 + index) * 3;
      const radius = Math.max(26, Math.min(68, Math.max(nb.width, nb.height) * 0.26));
      ctx.save();
      drawDistrictPolygonPath(ctx, neighbor.polygon);
      ctx.clip();
      const haze = ctx.createRadialGradient(nx + drift, ny - nb.height * 0.08, radius * 0.12, nx + drift, ny - nb.height * 0.08, radius);
      haze.addColorStop(0, "rgba(30, 30, 36, 0.07)");
      haze.addColorStop(0.6, "rgba(22, 22, 28, 0.04)");
      haze.addColorStop(1, "rgba(12, 12, 16, 0)");
      ctx.fillStyle = haze;
      ctx.beginPath();
      ctx.arc(nx + drift, ny - nb.height * 0.08, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawDestroyedDistrictEffect(ctx, district, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const marker = {
      seed: hashOwner(`destroyed:${normalizeDistrictId(district?.id) || district?.name || "district"}`)
    };
    const safeSeed = Number.isFinite(Number(marker.seed)) ? Number(marker.seed) : 0;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();

      const radius = Math.max(bounds.width || 20, bounds.height || 20) * 0.92;
      const charLayer = ctx.createRadialGradient(
        cx + Math.sin(now / 3900 + safeSeed * 0.00003) * 5,
        cy - Math.cos(now / 4400 + safeSeed * 0.00004) * 4,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      charLayer.addColorStop(0, "rgba(10, 10, 12, 0.98)");
      charLayer.addColorStop(0.34, "rgba(7, 7, 9, 0.96)");
      charLayer.addColorStop(0.72, "rgba(4, 4, 6, 0.95)");
      charLayer.addColorStop(1, "rgba(2, 2, 4, 0.98)");
      ctx.fillStyle = charLayer;
      ctx.fillRect(bounds.minX - 8, bounds.minY - 8, bounds.width + 16, bounds.height + 16);

      const crackSegments = getDestroyedCrackSegments(district, safeSeed, bounds);
      ctx.globalCompositeOperation = "screen";
      crackSegments.forEach((segment, index) => {
        const points = Array.isArray(segment?.points) ? segment.points : [];
        if (points.length < 2) return;
        const alpha = Math.max(0.04, Math.min(0.24, Number(segment.alpha || 0.1)));
        const hueBoost = index % 6;
        ctx.strokeStyle = `rgba(255, ${Math.round(64 + hueBoost * 5)}, 18, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(0.4, Math.min(2.2, Number(segment.width || 0.8)));
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let p = 1; p < points.length; p += 1) {
          ctx.lineTo(points[p].x, points[p].y);
        }
        ctx.stroke();
      });

      const craterGlow = ctx.createRadialGradient(cx, cy, radius * 0.02, cx, cy, radius * 0.52);
      craterGlow.addColorStop(0, "rgba(255, 112, 24, 0.16)");
      craterGlow.addColorStop(0.35, "rgba(255, 78, 18, 0.09)");
      craterGlow.addColorStop(1, "rgba(255, 52, 12, 0)");
      ctx.fillStyle = craterGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
      ctx.fill();

      const emberCount = 12;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < emberCount; i += 1) {
        const ring = 0.12 + (i % 5) * 0.055;
        const angle = (Math.PI * 2 * i) / emberCount + (safeSeed % 41) * 0.01 + i * 0.24;
        const distance = Math.min(bounds.width || 26, bounds.height || 26) * ring + (i % 4) * 2.1;
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance * 0.78;
        const size = 0.65 + (i % 3) * 0.5;
        const alpha = 0.08 - (i % 4) * 0.013;
        if (alpha <= 0.03) continue;
        ctx.fillStyle = `rgba(255, ${Math.round(95 + i * 2.5)}, 28, ${Math.min(0.2, alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const ashCount = 14;
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < ashCount; i += 1) {
        const phase = i * 0.71 + safeSeed * 0.0009;
        const driftX = Math.sin(now / (2900 + (i % 4) * 300) + phase) * (3 + (i % 3) * 1.4);
        const rise = ((now / (3100 + (i % 5) * 460) + i * 0.11) % 1);
        const anchorAngle = (Math.PI * 2 * i) / ashCount + phase * 0.23;
        const anchorRadius = radius * (0.08 + (i % 6) * 0.03);
        const baseX = cx + Math.cos(anchorAngle) * anchorRadius;
        const baseY = cy + Math.sin(anchorAngle) * anchorRadius * 0.72;
        const x = baseX + driftX;
        const y = baseY - rise * (12 + (i % 5) * 5);
        const size = 0.55 + (i % 3) * 0.25;
        const alpha = 0.06 * (1 - rise);
        if (alpha <= 0.008) continue;
        ctx.fillStyle = `rgba(88, 88, 96, ${Math.min(0.08, alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawDestroyedDistrictSmoke(ctx, district, now, safeSeed, cx, cy, bounds);
  }

  function drawDistrictTrapToxicMist(ctx, district, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const trapState = window.Empire.UI?.getDistrictTrapControlState?.(district);
    if (!trapState?.isActiveHere) return;

    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const safeSeed = hashOwner(`trap:${normalizeDistrictId(district?.id) || district?.name || "district"}`);
    const particleCount = Math.max(8, Math.min(16, Math.round(Math.max(bounds.width || 18, bounds.height || 18) / 9)));
    const baseRadius = Math.max(1.5, Math.min(3.4, Math.min(bounds.width || 18, bounds.height || 18) * 0.034));

    if (!drawDistrictPolygonPath(ctx, district.polygon)) return;

    ctx.save();
    drawDistrictPolygonPath(ctx, district.polygon);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < particleCount; i += 1) {
      const phase = i * 0.73 + safeSeed * 0.00011;
      const progress = ((now / (5200 + (i % 5) * 340)) + i * 0.097 + safeSeed * 0.0000017) % 1;
      const rise = 1 - progress;
      const lateralBase = Math.sin(phase * 1.8) * (bounds.width || 20) * 0.18;
      const sway = Math.sin(now / (900 + (i % 4) * 120) + phase) * (2.4 + (i % 3) * 0.9);
      const drift = Math.cos(now / (1300 + (i % 6) * 110) + phase * 1.7) * (1.2 + (i % 2) * 0.7);
      const x = cx + lateralBase + sway + drift;
      const y = cy + (bounds.height || 20) * (0.28 - rise * 0.6) + Math.sin(phase) * 4;
      const radius = baseRadius * (0.82 + (i % 4) * 0.22);
      const alpha = 0.1 + ((Math.sin(now / 760 + phase) + 1) * 0.5) * 0.1;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.16, x, y, radius * 2.2);
      gradient.addColorStop(0, `rgba(182, 255, 102, ${Math.min(0.2, alpha + 0.03).toFixed(3)})`);
      gradient.addColorStop(0.38, `rgba(56, 255, 178, ${Math.min(0.18, alpha + 0.01).toFixed(3)})`);
      gradient.addColorStop(0.72, `rgba(34, 211, 238, ${Math.min(0.14, alpha * 0.78).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(22, 163, 74, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (i % 3 === 0) {
        ctx.fillStyle = `rgba(110, 255, 234, ${Math.min(0.16, alpha * 0.9).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(phase) * 1.6, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const borderPulse = 0.5 + 0.5 * Math.sin(now / 820 + safeSeed * 0.00017);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowBlur = 14 + borderPulse * 9;
    ctx.shadowColor = `rgba(56, 255, 178, ${(0.18 + borderPulse * 0.1).toFixed(3)})`;
    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.strokeStyle = `rgba(56, 255, 178, ${(0.18 + borderPulse * 0.08).toFixed(3)})`;
      ctx.lineWidth = 1.2 + borderPulse * 0.9;
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = -((now / 55 + safeSeed) % 120);
      ctx.stroke();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(0.1 + borderPulse * 0.06).toFixed(3)})`;
      ctx.lineWidth = 0.8 + borderPulse * 0.45;
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = (now / 48 + safeSeed) % 120;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawDistrictAttackEffect(ctx, district, marker, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const markerSource = String(marker?.source || "").trim().toLowerCase();
    if (markerSource.includes("occupy")) {
      drawDistrictOccupyEffect(ctx, district, marker, now);
      return;
    }
    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const baseRadius = Math.max(16, Math.min(46, Math.min(bounds.width || 16, bounds.height || 16) * 0.36));
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const pulse = 0.86 + Math.sin(now / 170 + safeSeed * 0.0017) * 0.18;
    const lifeRatio = marker?.startedAt && marker?.expiresAt && marker.expiresAt > marker.startedAt
      ? clampUnit((now - marker.startedAt) / (marker.expiresAt - marker.startedAt))
      : 0;
    const alpha = Math.max(0.32, 0.86 - lifeRatio * 0.42);
    const flameAnchors = getAttackFlameAnchors(district, marker, bounds);

    drawAttackAmbientSmokeAroundDistrict(ctx, marker, now, cx, cy, bounds, pulse, lifeRatio);
    drawAttackSmokeInDistrict(ctx, district, marker, now, cx, cy, bounds, pulse, lifeRatio);
    drawAttackSmokeInNeighborDistricts(ctx, district, marker, now, cx, cy, bounds, pulse, lifeRatio);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.9;

    const glowRadius = baseRadius * (1.08 + pulse * 0.26);
    const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.16, cx, cy, glowRadius);
    glow.addColorStop(0, "rgba(255, 250, 205, 0.92)");
    glow.addColorStop(0.26, "rgba(255, 181, 82, 0.72)");
    glow.addColorStop(0.6, "rgba(255, 92, 0, 0.52)");
    glow.addColorStop(1, "rgba(255, 53, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const coreFlameSize = Math.max(18, Math.round(baseRadius * (1.02 + pulse * 0.22)));
    const coreWobbleX = Math.sin(now / 175 + safeSeed * 0.0011) * 1.8;
    const coreWobbleY = Math.cos(now / 145 + safeSeed * 0.0014) * 1.1
      - Math.abs(Math.sin(now / 220 + safeSeed * 0.0008)) * 1.6;
    ctx.globalAlpha = Math.max(0.46, alpha * 0.92);
    drawAttackFlameSprite(
      ctx,
      cx + coreWobbleX,
      cy + coreWobbleY,
      coreFlameSize,
      Math.max(0.42, alpha * 0.9),
      safeSeed * 0.00021,
      pulse
    );

    flameAnchors.forEach((anchor) => {
      const safeScale = Math.max(0.5, Math.min(1.7, Number(anchor?.scale || 1)));
      const phase = Number(anchor?.phase || 0);
      const jitterPower = Math.max(0.2, Number(anchor?.jitter || 0.8));
      const wobbleX = Math.sin(now / 205 + phase) * jitterPower * 1.1;
      const wobbleY = Math.cos(now / 165 + phase * 1.7) * jitterPower * 0.82
        - Math.abs(Math.sin(now / 260 + phase)) * 1.7;
      const flameSize = Math.max(
        12,
        Math.round(baseRadius * safeScale * (0.62 + pulse * 0.24 + Math.sin(now / 145 + phase) * 0.12))
      );
      ctx.globalAlpha = Math.max(0.28, alpha * (0.66 + safeScale * 0.18));
      drawAttackFlameSprite(
        ctx,
        Number(anchor.x || cx) + wobbleX,
        Number(anchor.y || cy) + wobbleY,
        flameSize * 0.82,
        Math.max(0.3, alpha * (0.78 + safeScale * 0.16)),
        phase,
        pulse
      );
      ctx.globalAlpha = Math.max(0.2, alpha * (0.36 + safeScale * 0.08));
      ctx.font = `${flameSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 8 + flameSize * 0.4;
      ctx.shadowColor = "rgba(255, 113, 0, 0.9)";
      ctx.fillText("🔥", Number(anchor.x || cx) + wobbleX, Number(anchor.y || cy) + wobbleY);
    });

    ctx.globalAlpha = alpha * 0.54;
    ctx.fillStyle = "rgba(255,132,24,0.36)";
    for (let i = 0; i < 7; i += 1) {
      const angle = (Math.PI * 2 * i) / 7 + now / 700 + safeSeed * 0.00004;
      const radius = baseRadius * (0.14 + (i % 3) * 0.08);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.7 - baseRadius * 0.18;
      const size = 1.2 + (i % 2) * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = Math.max(0.2, alpha * 0.72);
    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.strokeStyle = `rgba(255, 92, 0, ${Math.min(0.9, 0.5 + pulse * 0.25)})`;
      ctx.lineWidth = 1.2 + pulse * 0.95;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -((now / 40 + safeSeed) % 180);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawDistrictOccupyEffect(ctx, district, marker, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const basePulse = (Math.sin(now / 145 + safeSeed * 0.0013) + 1) * 0.5;
    const fastPulse = (Math.sin(now / 72 + safeSeed * 0.0021) + 1) * 0.5;
    const lifeRatio = marker?.startedAt && marker?.expiresAt && marker.expiresAt > marker.startedAt
      ? clampUnit((now - marker.startedAt) / (marker.expiresAt - marker.startedAt))
      : 0;
    const fade = Math.max(0.38, 1 - lifeRatio * 0.42);
    const baseRadius = Math.max(16, Math.min(58, Math.min(bounds.width || 20, bounds.height || 20) * 0.55));

    const playerHex = normalizeHexColor(localStorage.getItem("empire_gang_color"));
    const playerColor = playerHex ? hexToRgba(playerHex, 1) : "rgba(34,197,94,1)";
    const channels = parseCssColorChannels(playerColor) || [34, 197, 94];
    const [r, g, b] = channels;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";

      const fillAlpha = (0.18 + basePulse * 0.26 + fastPulse * 0.2) * fade;
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(0.72, fillAlpha).toFixed(3)})`;
      ctx.fillRect(bounds.minX - 6, bounds.minY - 6, (bounds.width || 12) + 12, (bounds.height || 12) + 12);

      const coreGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.12, cx, cy, baseRadius * (1.2 + basePulse * 0.55));
      coreGlow.addColorStop(0, `rgba(${r},${g},${b},${(0.72 * fade).toFixed(3)})`);
      coreGlow.addColorStop(0.48, `rgba(${r},${g},${b},${(0.36 * fade).toFixed(3)})`);
      coreGlow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * (1.22 + basePulse * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const strokeAlpha = (0.45 + basePulse * 0.4 + fastPulse * 0.18) * fade;
      ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(0.94, strokeAlpha).toFixed(3)})`;
      ctx.lineWidth = 2.1 + basePulse * 2.6;
      ctx.setLineDash([9, 6]);
      ctx.lineDashOffset = -((now / 26 + safeSeed) % 220);
      ctx.shadowColor = `rgba(${r},${g},${b},0.88)`;
      ctx.shadowBlur = 10 + basePulse * 14;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawDistrictRaidActionEffect(ctx, district, marker, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const bounds = polygonBounds(district.polygon);
    const [cx, cy] = polygonCentroid(district.polygon);
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const minDimension = Math.max(24, Math.min(bounds.width || 24, bounds.height || 24));
    const maxDimension = Math.max(28, Math.max(bounds.width || 28, bounds.height || 28));
    const lifeRatio = marker?.startedAt && marker?.expiresAt && marker.expiresAt > marker.startedAt
      ? clampUnit((now - marker.startedAt) / (marker.expiresAt - marker.startedAt))
      : 0;
    const fade = Math.max(0.24, 1 - lifeRatio * 0.38);
    const flicker = 0.42 + ((Math.sin(now / 70 + safeSeed * 0.0021) + 1) * 0.5) * 0.58;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();

      const sweepWidth = Math.max(18, minDimension * 0.46);
      for (let i = 0; i < 3; i += 1) {
        const progress = ((now / (420 + i * 80)) + safeSeed * 0.0007 + i * 0.31) % 1;
        const shadowX = bounds.minX - sweepWidth + progress * (bounds.width + sweepWidth * 2);
        const shadowAlpha = (0.12 + flicker * 0.2) * fade * (1 - i * 0.12);
        const gradient = ctx.createLinearGradient(shadowX, bounds.minY, shadowX + sweepWidth, bounds.maxY);
        gradient.addColorStop(0, "rgba(3,4,7,0)");
        gradient.addColorStop(0.45, `rgba(3,4,7,${shadowAlpha.toFixed(3)})`);
        gradient.addColorStop(1, "rgba(3,4,7,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(shadowX, bounds.minY - 8, sweepWidth, (bounds.height || 20) + 16);
      }

      const glitchCount = 5;
      for (let i = 0; i < glitchCount; i += 1) {
        const phase = (now / (95 + i * 22) + safeSeed * 0.0014 + i) % 1;
        const lineY = bounds.minY + phase * Math.max(12, bounds.height);
        const lineHeight = 1.2 + (i % 2) * 1.4;
        const lineWidth = Math.max(16, maxDimension * (0.42 + (i % 3) * 0.16));
        const offsetX = Math.sin(now / 85 + i + safeSeed * 0.0009) * maxDimension * 0.22;
        ctx.fillStyle = `rgba(148,163,184,${(0.12 + flicker * 0.14).toFixed(3)})`;
        ctx.fillRect(cx - lineWidth / 2 + offsetX, lineY, lineWidth, lineHeight);
      }

      ctx.fillStyle = `rgba(2, 6, 12, ${(0.16 + flicker * 0.12).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(16, minDimension * 0.36), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      ctx.strokeStyle = `rgba(71, 85, 105, ${(0.2 + flicker * 0.16).toFixed(3)})`;
      ctx.lineWidth = 1.2 + flicker * 0.8;
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = -((now / 38 + safeSeed) % 140);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawDistrictPoliceActionEffect(ctx, district, marker, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const minDimension = Math.max(22, Math.min(bounds.width || 22, bounds.height || 22));
    const baseRadius = Math.max(22, Math.min(64, minDimension * 0.52));
    const lifeRatio = marker?.startedAt && marker?.expiresAt && marker.expiresAt > marker.startedAt
      ? clampUnit((now - marker.startedAt) / (marker.expiresAt - marker.startedAt))
      : 0;
    const fade = Math.max(0.34, 1 - lifeRatio * 0.45);
    const redPulse = 0.28 + ((Math.sin(now / 145 + safeSeed * 0.0012) + 1) * 0.5) * 0.72;
    const bluePulse = 0.28 + ((Math.sin(now / 145 + Math.PI + safeSeed * 0.0012) + 1) * 0.5) * 0.72;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";

      const redGlow = ctx.createRadialGradient(
        cx - baseRadius * 0.32,
        cy - baseRadius * 0.04,
        baseRadius * 0.12,
        cx - baseRadius * 0.32,
        cy - baseRadius * 0.04,
        baseRadius * 1.45
      );
      redGlow.addColorStop(0, `rgba(255, 88, 92, ${(0.44 * redPulse * fade).toFixed(3)})`);
      redGlow.addColorStop(0.62, `rgba(255, 52, 62, ${(0.2 * redPulse * fade).toFixed(3)})`);
      redGlow.addColorStop(1, "rgba(255, 38, 48, 0)");
      ctx.fillStyle = redGlow;
      ctx.beginPath();
      ctx.arc(cx - baseRadius * 0.32, cy - baseRadius * 0.04, baseRadius * 1.45, 0, Math.PI * 2);
      ctx.fill();

      const blueGlow = ctx.createRadialGradient(
        cx + baseRadius * 0.32,
        cy - baseRadius * 0.04,
        baseRadius * 0.12,
        cx + baseRadius * 0.32,
        cy - baseRadius * 0.04,
        baseRadius * 1.45
      );
      blueGlow.addColorStop(0, `rgba(64, 179, 255, ${(0.44 * bluePulse * fade).toFixed(3)})`);
      blueGlow.addColorStop(0.62, `rgba(50, 122, 255, ${(0.2 * bluePulse * fade).toFixed(3)})`);
      blueGlow.addColorStop(1, "rgba(42, 90, 255, 0)");
      ctx.fillStyle = blueGlow;
      ctx.beginPath();
      ctx.arc(cx + baseRadius * 0.32, cy - baseRadius * 0.04, baseRadius * 1.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beaconCount = 4;
    const ringRadius = baseRadius * 0.62;
    for (let i = 0; i < beaconCount; i += 1) {
      const pulse = i % 2 === 0 ? redPulse : bluePulse;
      const isRed = i % 2 === 0;
      const angle = now / 780 + i * ((Math.PI * 2) / beaconCount) + safeSeed * 0.00019;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius * 0.72;
      const beamRadius = baseRadius * (1.62 + pulse * 0.44);
      const beamDirection = now / 330 * (isRed ? 1 : -1) + i * 0.8;
      const beamSpread = 0.36 + pulse * 0.2;
      const beaconColor = isRed
        ? `rgba(255, 66, 72, ${(0.3 + pulse * 0.42) * fade})`
        : `rgba(56, 164, 255, ${(0.3 + pulse * 0.42) * fade})`;

      ctx.fillStyle = beaconColor;
      ctx.shadowBlur = 10 + pulse * 14;
      ctx.shadowColor = isRed ? "rgba(255, 58, 70, 0.95)" : "rgba(52, 150, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 3.2 + pulse * 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = (0.1 + pulse * 0.16) * fade;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, beamRadius, beamDirection - beamSpread * 0.5, beamDirection + beamSpread * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      const borderMix = redPulse - bluePulse;
      ctx.strokeStyle = borderMix >= 0
        ? `rgba(255, 92, 96, ${Math.max(0.28, 0.4 * fade)})`
        : `rgba(68, 172, 255, ${Math.max(0.28, 0.4 * fade)})`;
      ctx.lineWidth = 1.2 + Math.max(redPulse, bluePulse) * 1.3;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -(now / 52 + safeSeed) % 130;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawDistrictSpyActionEffect(ctx, district, marker, now = Date.now()) {
    if (!district || !Array.isArray(district.polygon) || district.polygon.length < 3) return;
    const [cx, cy] = polygonCentroid(district.polygon);
    const bounds = polygonBounds(district.polygon);
    const safeSeed = Number.isFinite(Number(marker?.seed)) ? Number(marker.seed) : 0;
    const maxDimension = Math.max(26, Math.max(bounds.width || 26, bounds.height || 26));
    const lifeRatio = marker?.startedAt && marker?.expiresAt && marker.expiresAt > marker.startedAt
      ? clampUnit((now - marker.startedAt) / (marker.expiresAt - marker.startedAt))
      : 0;
    const fade = Math.max(0.3, 1 - lifeRatio * 0.5);
    const sweepAngle = now / 470 + safeSeed * 0.00021;
    const coneSpread = 0.36 + Math.sin(now / 620 + safeSeed * 0.00031) * 0.08;
    const beamLength = Math.max(42, Math.min(170, maxDimension * 1.5));
    const originRadiusX = Math.max(10, (bounds.width || 24) * 0.24);
    const originRadiusY = Math.max(8, (bounds.height || 24) * 0.2);
    const originX = cx + Math.cos(sweepAngle * 0.58 + 1.05) * originRadiusX;
    const originY = cy + Math.sin(sweepAngle * 0.54 + 0.67) * originRadiusY;

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.save();
      drawDistrictPolygonPath(ctx, district.polygon);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";

      const beam = ctx.createRadialGradient(originX, originY, beamLength * 0.05, originX, originY, beamLength);
      beam.addColorStop(0, `rgba(242, 255, 216, ${(0.42 * fade).toFixed(3)})`);
      beam.addColorStop(0.28, `rgba(206, 250, 255, ${(0.26 * fade).toFixed(3)})`);
      beam.addColorStop(0.7, `rgba(120, 214, 255, ${(0.1 * fade).toFixed(3)})`);
      beam.addColorStop(1, "rgba(88, 180, 255, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, beamLength, sweepAngle - coneSpread, sweepAngle + coneSpread);
      ctx.closePath();
      ctx.fill();

      const haloRadius = Math.max(14, Math.min(44, maxDimension * 0.34));
      const halo = ctx.createRadialGradient(originX, originY, haloRadius * 0.1, originX, originY, haloRadius);
      halo.addColorStop(0, `rgba(246, 255, 230, ${(0.5 * fade).toFixed(3)})`);
      halo.addColorStop(0.65, `rgba(172, 234, 255, ${(0.2 * fade).toFixed(3)})`);
      halo.addColorStop(1, "rgba(100, 186, 255, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(originX, originY, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(242, 255, 218, ${(0.72 * fade).toFixed(3)})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(214, 249, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(originX, originY, 3.6 + Math.sin(now / 120 + safeSeed * 0.0009) * 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (drawDistrictPolygonPath(ctx, district.polygon)) {
      ctx.strokeStyle = `rgba(166, 235, 255, ${(0.42 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.2 + Math.sin(now / 280 + safeSeed * 0.0012) * 0.4;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -((now / 48 + safeSeed) % 150);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function resolveDistrictAllianceLabel(district) {
    const explicit = String(district?.ownerAllianceName || "").trim();
    if (explicit) return explicit;
    return deriveAllianceNameFromOwnerLabel(district?.owner);
  }

  function resolveDistrictAllianceIconKey(district) {
    const explicit = String(district?.ownerAllianceIconKey || "").trim();
    if (explicit) return explicit;
    return window.Empire.UI?.resolveAllianceIconKeyByName?.(resolveDistrictAllianceLabel(district)) || "";
  }

  function resolveDistrictAllianceIconSymbol(district) {
    const iconKey = resolveDistrictAllianceIconKey(district);
    return ALLIANCE_ICON_SYMBOL_BY_KEY[iconKey] || "";
  }

  function drawDistrictAllianceIcon(ctx, district) {
    if (!ctx || !district?.owner || isDistrictDestroyed(district)) return;
    if (state.vision.showAllianceSymbols === false) return;
    if (shouldHideDistrictByVisibilityMode(district)) return;
    const symbol = resolveDistrictAllianceIconSymbol(district);
    if (!symbol) return;
    const bounds = polygonBounds(district.polygon);
    const minDimension = Math.max(20, Math.min(bounds.width || 20, bounds.height || 20));
    const maxDimension = Math.max(20, Math.max(bounds.width || 20, bounds.height || 20));
    const fontSize = Math.max(14, Math.min(36, minDimension * 0.44));
    const [cx, cy] = polygonCentroid(district.polygon);
    const iconY = cy + Math.min(maxDimension * 0.05, 5);

    ctx.save();
    ctx.font = `900 ${fontSize}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2.5, fontSize * 0.14);
    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.shadowColor = "rgba(255,255,255,0.28)";
    ctx.shadowBlur = Math.max(4, fontSize * 0.18);
    ctx.strokeText(symbol, cx, iconY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5, 7, 11, 0.96)";
    ctx.fillText(symbol, cx, iconY);
    ctx.restore();
  }

  function resolveAlliancePatternKey(district) {
    if (!district?.owner) return "";
    const allianceLabel = resolveDistrictAllianceLabel(district);
    const normalized = normalizeName(allianceLabel);
    if (!normalized) return "";
    if (normalized === "žádná" || normalized === "bez aliance" || normalized === "none") return "";
    return normalized;
  }

  function resolveAlliancePatternVariant(allianceKey) {
    return hashOwner(`${allianceKey}:pattern`) % 6;
  }

  function resolveAlliancePatternColors(allianceKey) {
    const hue = hashOwner(`${allianceKey}:hue`) % 360;
    const primaryHue = (hue + 175) % 360;
    const secondaryHue = (hue + 312) % 360;
    const tertiaryHue = (hue + 48) % 360;
    return {
      primary: `hsla(${primaryHue}, 100%, 74%, 0.82)`,
      secondary: `hsla(${secondaryHue}, 100%, 70%, 0.66)`,
      tertiary: `hsla(${tertiaryHue}, 100%, 80%, 0.44)`
    };
  }

  function resolveAlliancePatternOpacity(district) {
    if (isDistrictOwnedByPlayer(district)) return 0.5;
    if (isDistrictOwnedByAlly(district)) return 0.46;
    if (isDistrictOwnedByEnemy(district)) return 0.42;
    return 0.38;
  }

  function drawPatternStar(ctx, centerX, centerY, outerRadius, innerRadius, points = 5) {
    const safePoints = Math.max(3, Math.floor(Number(points) || 5));
    const angleStep = Math.PI / safePoints;
    ctx.beginPath();
    for (let i = 0; i < safePoints * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + i * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function createAlliancePattern(ctx, allianceKey, variant) {
    if (!ctx || typeof document === "undefined") return null;
    const tileSize = 34;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = tileSize;
    patternCanvas.height = tileSize;
    const patternCtx = patternCanvas.getContext("2d");
    if (!patternCtx) return null;

    const colors = resolveAlliancePatternColors(allianceKey);
    patternCtx.clearRect(0, 0, tileSize, tileSize);
    patternCtx.lineCap = "round";
    patternCtx.lineJoin = "round";

    switch (variant) {
      case 0: {
        patternCtx.fillStyle = colors.primary;
        const points = [[8, 9], [24, 20]];
        points.forEach(([x, y]) => {
          patternCtx.beginPath();
          patternCtx.arc(x, y, 4.1, 0, Math.PI * 2);
          patternCtx.fill();
        });
        patternCtx.fillStyle = colors.tertiary;
        patternCtx.beginPath();
        patternCtx.arc(26, 8, 2.5, 0, Math.PI * 2);
        patternCtx.fill();
        break;
      }
      case 1: {
        patternCtx.strokeStyle = colors.primary;
        patternCtx.lineWidth = 3;
        for (let x = -tileSize; x <= tileSize * 2; x += 14) {
          patternCtx.beginPath();
          patternCtx.moveTo(x, 0);
          patternCtx.lineTo(x + tileSize, tileSize);
          patternCtx.stroke();
        }
        patternCtx.strokeStyle = colors.tertiary;
        patternCtx.lineWidth = 2;
        for (let x = -tileSize; x <= tileSize * 2; x += 14) {
          patternCtx.beginPath();
          patternCtx.moveTo(x + 6, 0);
          patternCtx.lineTo(x + tileSize + 6, tileSize);
          patternCtx.stroke();
        }
        break;
      }
      case 2: {
        patternCtx.strokeStyle = colors.primary;
        patternCtx.lineWidth = 2.4;
        for (let y = 6; y < tileSize; y += 14) {
          patternCtx.beginPath();
          patternCtx.moveTo(0, y);
          patternCtx.lineTo(tileSize, y);
          patternCtx.stroke();
        }
        patternCtx.strokeStyle = colors.secondary;
        patternCtx.lineWidth = 2;
        for (let x = 6; x < tileSize; x += 14) {
          patternCtx.beginPath();
          patternCtx.moveTo(x, 0);
          patternCtx.lineTo(x, tileSize);
          patternCtx.stroke();
        }
        break;
      }
      case 3: {
        patternCtx.fillStyle = colors.primary;
        drawPatternStar(patternCtx, 10, 10, 5.6, 2.35, 5);
        patternCtx.fillStyle = colors.secondary;
        drawPatternStar(patternCtx, 25, 23, 5, 2.1, 5);
        patternCtx.fillStyle = colors.tertiary;
        patternCtx.beginPath();
        patternCtx.arc(8, 26, 2.1, 0, Math.PI * 2);
        patternCtx.fill();
        break;
      }
      case 4: {
        patternCtx.fillStyle = colors.primary;
        patternCtx.fillRect(4, 4, 8, 8);
        patternCtx.fillRect(20, 4, 8, 8);
        patternCtx.fillStyle = colors.secondary;
        patternCtx.fillRect(12, 13, 8, 8);
        patternCtx.fillRect(4, 22, 8, 8);
        patternCtx.fillStyle = colors.tertiary;
        patternCtx.fillRect(22, 22, 6, 6);
        break;
      }
      case 5:
      default: {
        patternCtx.strokeStyle = colors.primary;
        patternCtx.lineWidth = 2.8;
        [[3, 6], [3, 21]].forEach(([x, y]) => {
          patternCtx.beginPath();
          patternCtx.moveTo(x, y);
          patternCtx.lineTo(x + 8, y + 6);
          patternCtx.lineTo(x + 16, y);
          patternCtx.stroke();
        });
        patternCtx.strokeStyle = colors.secondary;
        patternCtx.lineWidth = 2.2;
        [[18, 10], [18, 25]].forEach(([x, y]) => {
          patternCtx.beginPath();
          patternCtx.moveTo(x, y);
          patternCtx.lineTo(x + 7, y + 5);
          patternCtx.lineTo(x + 14, y);
          patternCtx.stroke();
        });
        break;
      }
    }

    return ctx.createPattern(patternCanvas, "repeat");
  }

  function resolveAlliancePattern(ctx, district) {
    const allianceKey = resolveAlliancePatternKey(district);
    if (!allianceKey) return null;
    const variant = resolveAlliancePatternVariant(allianceKey);
    const cacheKey = `${allianceKey}:${variant}`;
    const cached = state.alliancePatternCache.get(cacheKey);
    if (cached) return cached;
    const next = createAlliancePattern(ctx, allianceKey, variant);
    if (!next) return null;
    state.alliancePatternCache.set(cacheKey, next);
    return next;
  }

  function districtFill(district) {
    if (isDistrictDestroyed(district)) {
      return "rgba(9, 9, 11, 0.9)";
    }

    if (shouldHideDistrictByVisibilityMode(district)) {
      return resolveHiddenDistrictFill();
    }

    if (state.vision.uniqueOwnerColors && district?.owner) {
      if (isDistrictOwnedByPlayer(district)) {
        const playerFill = resolveDistinctOwnerFill(district.owner, 0.5);
        if (playerFill) return playerFill;
      }
      if (isDistrictOwnedByAlly(district)) {
        const allyDistinctFill = resolveDistinctOwnerFill(district.owner, 0.46);
        if (allyDistinctFill) return allyDistinctFill;
      }
      if (isDistrictOwnedByEnemy(district)) {
        const enemyDistinctFill = resolveDistinctOwnerFill(district.owner, 0.42);
        if (enemyDistinctFill) return enemyDistinctFill;
      }
      const ownerDistinctFill = resolveDistinctOwnerFill(district.owner, 0.38);
      if (ownerDistinctFill) return ownerDistinctFill;
    }

      if (isDistrictOwnedByPlayer(district)) return resolvePlayerOwnedFill();
      if (isDistrictOwnedByAlly(district)) return allyFill(district.owner);
      if (isDistrictOwnedByEnemy(district)) return enemyFill(district.owner);
      if (district.owner) return ownerFill(district.owner);
      if (state.vision.fogPreviewMode) {
        if (district.type === "downtown") return "rgba(248,113,113,0.28)";
        if (state.vision.unknownNeutralFillEnabled) return "rgba(148,163,184,0.22)";
        return "rgba(0,0,0,0)";
      }
      switch (district.type) {
        case "downtown":
          return "rgba(248,113,113,0.28)";
        case "industrial":
          return "rgba(148,163,184,0.28)";
        case "commercial":
          return "rgba(56,189,248,0.28)";
        case "park":
          return "rgba(34,197,94,0.22)";
        case "residential":
        default:
          return "rgba(253,186,116,0.24)";
      }
    }

  function ownerFill(owner) {
    if (state.vision.uniqueOwnerColors) {
      const distinct = resolveDistinctOwnerFill(owner, 0.35);
      if (distinct) return distinct;
    }
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(34,197,94,0.35)";
    const index = hashOwner(normalized) % ownerPalette.length;
    return ownerPalette[index];
  }

  function enemyFill(owner) {
    if (state.vision.uniqueOwnerColors) {
      const distinct = resolveDistinctOwnerFill(owner, 0.22);
      if (distinct) return distinct;
    }
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(203,213,225,0.22)";
    const index = hashOwner(normalized) % enemyPalette.length;
    return enemyPalette[index];
  }

  function allyFill(owner) {
    if (state.vision.uniqueOwnerColors) {
      const distinct = resolveDistinctOwnerFill(owner, 0.46);
      if (distinct) return distinct;
    }
    const normalized = normalizeName(owner);
    if (!normalized) return allyPalette[0];
    const alliedOwners = Array.from(state.vision.alliedOwnerNames);
    const indexByOrder = alliedOwners.indexOf(normalized);
    if (indexByOrder >= 0) {
      return allyPalette[indexByOrder % allyPalette.length];
    }
    const indexByHash = hashOwner(normalized) % allyPalette.length;
    return allyPalette[indexByHash];
  }

  function resolvePlayerOwnedFill() {
    const stored = normalizeHexColor(localStorage.getItem("empire_gang_color"));
    if (!stored) return "rgba(34,197,94,0.45)";
    return hexToRgba(stored, 0.45);
  }

  function normalizeDistrictBorderMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "white" || mode === "black" || mode === "player") return mode;
    return "player";
  }

  function normalizeDistrictVisibilityMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "all" || mode === "hide-enemies" || mode === "only-player") return mode;
    return "all";
  }

  function shouldHideDistrictByVisibilityMode(district) {
    const mode = normalizeDistrictVisibilityMode(state.vision.districtVisibilityMode);
    if (mode === "all") return false;
    if (mode === "hide-enemies") return isDistrictOwnedByEnemy(district);
    if (mode === "only-player") return !isDistrictOwnedByPlayer(district);
    return false;
  }

  function shouldDrawDistrictBorders() {
    return state.vision.showDistrictBorders !== false;
  }

  function resolveDistrictBorderStroke() {
    const mode = normalizeDistrictBorderMode(state.vision.districtBorderMode);
    if (mode === "white") return "rgba(248,250,252,0.9)";
    if (mode === "black") return "rgba(2,6,23,0.92)";
    const playerColor = normalizeHexColor(localStorage.getItem("empire_gang_color"));
    if (!playerColor) return "rgba(34,211,238,0.78)";
    return hexToRgba(playerColor, 0.9);
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

  function hexToRgba(hex, alpha = 1) {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return "rgba(34,197,94,0.45)";
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const safeAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
    return `rgba(${r},${g},${b},${safeAlpha})`;
  }

  function clampColorChannel(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(255, Math.round(numeric)));
  }

  function parseCssColorChannels(colorValue) {
    const raw = String(colorValue || "").trim();
    if (!raw) return null;

    const rgbMatch = raw.match(/rgba?\(\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)/i);
    if (rgbMatch) {
      return [
        clampColorChannel(rgbMatch[1]),
        clampColorChannel(rgbMatch[2]),
        clampColorChannel(rgbMatch[3])
      ];
    }

    const normalizedHex = normalizeHexColor(raw);
    if (normalizedHex) {
      return [
        parseInt(normalizedHex.slice(1, 3), 16),
        parseInt(normalizedHex.slice(3, 5), 16),
        parseInt(normalizedHex.slice(5, 7), 16)
      ];
    }

    return null;
  }

  function resolveDistrictAccentChannels(district) {
    const channelsFromFill = parseCssColorChannels(districtFill(district));
    if (channelsFromFill) return channelsFromFill;
    return [34, 211, 238];
  }

  function resolveHiddenDistrictFill() {
    return "rgba(0,0,0,0)";
  }

  function applyDistrictModalAccent(district) {
    const content = state.modal?.root?.querySelector(".modal__content");
    if (!content) return;
    const [r, g, b] = resolveDistrictAccentChannels(district);
    content.style.setProperty("--district-accent-rgb", `${r}, ${g}, ${b}`);

    const glowAlpha = isDistrictOwnedByPlayer(district)
      ? 0.42
      : isDistrictOwnedByAlly(district)
        ? 0.36
        : isDistrictOwnedByEnemy(district)
          ? 0.33
          : 0.28;
    content.style.setProperty("--district-accent-glow-alpha", String(glowAlpha));
  }

  function isPlayerOwner(ownerName) {
    return getPlayerOwnerNames().has(normalizeName(ownerName));
  }

  function isDistrictDestroyed(district) {
    if (!district || typeof district !== "object") return false;
    return Boolean(district.isDestroyed || district.is_destroyed || district.destroyed);
  }

  function isDistrictOwnedByPlayer(district) {
    if (isDistrictDestroyed(district)) return false;
    if (!district?.owner) return false;
    return isPlayerOwner(String(district.owner).trim());
  }

  function isDistrictOwnedByAlly(district) {
    if (isDistrictDestroyed(district)) return false;
    if (!district?.owner) return false;
    const owner = normalizeName(district.owner);
    if (!owner) return false;
    if (isPlayerOwner(owner)) return false;
    return state.vision.alliedOwnerNames.has(owner);
  }

  function isDistrictOwnedByEnemy(district) {
    if (isDistrictDestroyed(district)) return false;
    if (!district?.owner) return false;
    const owner = normalizeName(district.owner);
    if (!owner) return false;
    if (isPlayerOwner(owner)) return false;
    if (state.vision.alliedOwnerNames.has(owner)) return false;
    return state.vision.enemyOwnerNames.has(owner);
  }

  function isDistrictDefendable(district) {
    return isDistrictOwnedByPlayer(district) || isDistrictOwnedByAlly(district);
  }

  function getPlayerOwnerNames() {
    const player = window.Empire.player || {};
    const names = [
      player.gangName,
      player.gang_name,
      player.gang,
      player.username,
      player.name,
      localStorage.getItem("empire_guest_username"),
      localStorage.getItem("empire_gang_name")
    ]
      .map((value) => normalizeName(value))
      .filter(Boolean);
    return new Set(names);
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function hashOwner(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function updateDistrictGallery(district) {
    const gallery = document.getElementById("modal-park-gallery");
    const grid = document.getElementById("modal-park-images");
    const title = document.querySelector("#modal-park-gallery .modal__gallery-title");
    if (!gallery || !grid) return;

    if (!district) {
      gallery.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    const imageSets = {
      park: { title: "Atmosféra parku", images: parkImages },
      downtown: { title: "Atmosféra downtownu", images: downtownImages },
      commercial: { title: "Atmosféra komerce", images: commercialImages },
      residential: { title: "Atmosféra rezidenční zóny", images: residentialImages },
      industrial: { title: "Atmosféra industriální zóny", images: industrialImages }
    };
    const set = imageSets[district.type];
    if (!set) {
      gallery.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    const total = set.images.length;
    if (total === 0) {
      gallery.classList.add("hidden");
      return;
    }

    const overrideKey = `${district.type}:${district.id}`;
    const overrideImages = districtImageOverrides[overrideKey];
    if (Array.isArray(overrideImages) && overrideImages.length) {
      grid.innerHTML = overrideImages
        .map((src, index) => `
          <img src="${src}" alt="${set.title} ${index + 1}" loading="lazy" />
        `)
        .join("");
      gallery.classList.remove("hidden");
      return;
    }

    const seedSource = typeof district.id === "number"
      ? district.id
      : String(district.id || "")
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const picks = [set.images[seedSource % total]];
    if (title) title.textContent = set.title;

    grid.innerHTML = picks
      .map((src, index) => `
        <img src="${src}" alt="${set.title} ${index + 1}" loading="lazy" />
      `)
      .join("");
    gallery.classList.remove("hidden");
  }



  function polygonCentroid(poly) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    const len = poly.length;
    for (let i = 0; i < len; i += 1) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % len];
      const a = x0 * y1 - x1 * y0;
      area += a;
      cx += (x0 + x1) * a;
      cy += (y0 + y1) * a;
    }
    area *= 0.5;
    if (Math.abs(area) < 1e-6) return [poly[0][0], poly[0][1]];
    return [cx / (6 * area), cy / (6 * area)];
  }

  function updateTooltip(district, clientX, clientY) {
    if (!state.tooltip) return;
    if (!district) {
      hideTooltip();
      return;
    }
    if (isDistrictDestroyed(district)) {
      state.tooltip.classList.remove("hidden");
      const districtNumber = resolveDistrictNumberLabel(district);
      state.tooltip.innerHTML = `
        <div class="map-tooltip__title">Vypálený distrikt</div>
        <div>Distrikt č.: ${districtNumber}</div>
        <div>Stav: Zničený a nepoužitelný</div>
        <div>Vlastník: Nikdo</div>
        <div>Příjem: 0</div>
      `;
      placeTooltipWithinMap(clientX, clientY);
      return;
    }
    const defendableByPlayer = isDistrictDefendable(district);
    const isDowntown = district.type === "downtown";
    const ownerRelation = resolveDistrictOwnerRelation(district);
    const ownerIntelSection = buildOwnerIntelSection(district, ownerRelation);

    state.tooltip.classList.remove("hidden");

    if (state.vision.fogPreviewMode && !defendableByPlayer) {
      const districtNumber = resolveDistrictNumberLabel(district);
      const gossipSection = buildTooltipGossipSection(district, 2);
      state.tooltip.innerHTML = ownerRelation === "enemy"
        ? `
          <div class="map-tooltip__title">Nepřátelský sektor</div>
          <div>Distrikt č.: ${districtNumber}</div>
          ${ownerIntelSection}
          <div>Detailní info sektoru je skryté.</div>
          ${gossipSection}
        `
        : isDowntown
          ? `
            <div class="map-tooltip__title">Downtown sektor</div>
            <div>Distrikt č.: ${districtNumber}</div>
            <div>Citlivá zóna města.</div>
            ${gossipSection}
          `
          : `
            <div class="map-tooltip__title">Distrikt č. ${districtNumber}</div>
            <div>Informace o cizím distriktu jsou skryté.</div>
            ${gossipSection}
          `;
      placeTooltipWithinMap(clientX, clientY);
      return;
    }

    const canViewDistrictBuildings = defendableByPlayer;
    const buildingLine =
      canViewDistrictBuildings && Array.isArray(district.buildings) && district.buildings.length
        ? `
          <div class="map-tooltip__section">
            <div class="map-tooltip__label">Budovy</div>
            <div class="map-tooltip__tags">
              ${district.buildings.map((building) => `<span class="map-tooltip__tag">${building}</span>`).join("")}
            </div>
          </div>
        `
        : "";
    const setLine = canViewDistrictBuildings && district.buildingSetTitle
      ? `<div class="map-tooltip__section"><div class="map-tooltip__label">Set</div><div>${district.buildingSetTitle}</div></div>`
      : "";
    const gossipLine = buildTooltipGossipSection(district, 2);

    const hideEnemyEconomyIntel = ownerRelation === "enemy";
    state.tooltip.innerHTML = `
      <div class="map-tooltip__title">${district.name}</div>
      <div>Typ: ${district.type}</div>
      <div>Vlastník: ${district.owner || "Neobsazeno"}</div>
      <div>Příjem: ${hideEnemyEconomyIntel ? "Skryto" : `$${district.income}/hod`}</div>
      <div>Vliv: ${hideEnemyEconomyIntel ? "Skryto" : district.influence}</div>
      ${ownerIntelSection}
      ${setLine}
      ${buildingLine}
      ${gossipLine}
    `;
    placeTooltipWithinMap(clientX, clientY);
  }

  function buildTooltipGossipSection(district, limit = 2) {
    const safeLimit = Math.max(1, Math.floor(Number(limit) || 1));
    const entries = getDistrictGossipEntries(district, safeLimit);
    if (!entries.length) {
      return `
        <div class="map-tooltip__section">
          <div class="map-tooltip__label">Drby</div>
          <div class="map-tooltip__gossip-empty">Zatím bez drbů.</div>
        </div>
      `;
    }
    const items = entries
      .map((entry) => `
        <div class="map-tooltip__gossip-item">
          <span class="map-tooltip__gossip-badge map-tooltip__gossip-badge--${entry.intelLevel === "verified" ? "verified" : "rumor"}">
            ${entry.intelLevel === "verified" ? "OVĚŘENO" : "DRB"}
          </span>
          <span>${escapeHtml(entry.text)}</span>
        </div>
      `)
      .join("");
    return `
      <div class="map-tooltip__section">
        <div class="map-tooltip__label">Drby</div>
        <div class="map-tooltip__gossip-list">${items}</div>
      </div>
    `;
  }

  function resolveDistrictNumberLabel(district) {
    const numericId = Number(district?.id);
    if (Number.isFinite(numericId)) {
      return `${Math.max(0, Math.floor(numericId))}`;
    }

    const name = String(district?.name || "");
    const fromName = name.match(/(\d+)/);
    if (fromName?.[1]) {
      return fromName[1];
    }

    const rawId = String(district?.id || "").trim();
    if (!rawId) return "?";
    if (rawId.includes("-")) {
      return rawId.split("-")[0];
    }
    return rawId;
  }

  function resolveDistrictOwnerRelation(district) {
    if (isDistrictOwnedByAlly(district)) return "ally";
    if (isDistrictOwnedByEnemy(district)) return "enemy";
    return "other";
  }

  function buildOwnerIntelSection(district, relation) {
    if (!district?.owner) return "";
    if (relation !== "ally" && relation !== "enemy") return "";
    const intel = resolveOwnerIntel(district, relation);
    if (!intel) return "";
    const relationLabel = relation === "ally" ? "Spojenecký hráč" : "Nepřátelský hráč";
    const members = intel.allianceMembers.map((nick) => escapeHtml(nick)).join(", ");
    return `
      <div class="map-tooltip__section">
        <div class="map-tooltip__label">${relationLabel}</div>
        <div>Nick: ${escapeHtml(intel.nick)}</div>
        <div>Gang: ${escapeHtml(intel.gangName)}</div>
        <div>Aliance: ${members}</div>
      </div>
    `;
  }

  function resolveOwnerIntel(district, relation) {
    const owner = normalizeName(district?.owner);
    if (!owner) return null;

    const ownerSeed = hashOwner(`${owner}:${relation}`);
    const nick = generateSyntheticNick(ownerSeed);
    const gangName = generateSyntheticGangName(ownerSeed);
    const allianceMembers = generateSyntheticAllianceMembers(owner, relation, ownerSeed, nick);

    return {
      nick,
      gangName,
      allianceMembers
    };
  }

  function generateSyntheticNick(seed) {
    const prefixes = ["Razor", "Ghost", "Viper", "Nyx", "Cipher", "Blaze", "Nova", "Kane", "Venom", "Sable"];
    const suffixes = ["Hex", "Prime", "Zero", "Fox", "Core", "Volt", "Reign", "Shade", "Drift", "Flux"];
    const first = prefixes[Math.abs(seed) % prefixes.length];
    const second = suffixes[Math.abs(Math.floor(seed / 7)) % suffixes.length];
    const number = 10 + (Math.abs(seed) % 90);
    return `${first} ${second}-${number}`;
  }

  function generateSyntheticGangName(seed) {
    const first = ["Neon", "Iron", "Black", "Shadow", "Obsidian", "Chrome", "Crimson", "Night", "Vortex", "Steel"];
    const second = ["Syndicate", "Cartel", "Legion", "Covenant", "Raiders", "Empire", "Network", "Coalition", "Order", "Circle"];
    return `${first[Math.abs(seed) % first.length]} ${second[Math.abs(Math.floor(seed / 11)) % second.length]}`;
  }

  function generateSyntheticAllianceMembers(owner, relation, seed, ownerNick) {
    const members = [ownerNick];
    const relationOwners = relation === "ally"
      ? Array.from(state.vision.alliedOwnerNames || [])
      : Array.from(state.vision.enemyOwnerNames || []);
    const uniqueOwners = Array.from(new Set(relationOwners.map((name) => normalizeName(name)).filter(Boolean)));

    uniqueOwners.forEach((candidate) => {
      if (members.length >= 3) return;
      if (candidate === owner) return;
      const candidateSeed = hashOwner(`${candidate}:${relation}`);
      const nick = generateSyntheticNick(candidateSeed);
      if (!members.includes(nick)) members.push(nick);
    });

    let fillerIndex = 0;
    while (members.length < 3) {
      const fillerNick = generateSyntheticNick(seed + 97 * (fillerIndex + 1));
      if (!members.includes(fillerNick)) members.push(fillerNick);
      fillerIndex += 1;
    }

    return members.slice(0, 3);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function placeTooltipWithinMap(clientX, clientY) {
    if (!state.tooltip) return;
    const margin = 12;
    const inset = 6;
    let left = Number(clientX || 0) + margin;
    let top = Number(clientY || 0) + margin;

    const mapRect = state.canvas?.getBoundingClientRect?.();
    if (!mapRect) {
      state.tooltip.style.left = `${left}px`;
      state.tooltip.style.top = `${top}px`;
      return;
    }

    const tooltipRect = state.tooltip.getBoundingClientRect();
    const minLeft = mapRect.left + inset;
    const maxLeft = mapRect.right - tooltipRect.width - inset;
    const minTop = mapRect.top + inset;
    const maxTop = mapRect.bottom - tooltipRect.height - inset;

    if (maxLeft < minLeft) {
      left = minLeft;
    } else {
      left = Math.min(maxLeft, Math.max(minLeft, left));
    }

    if (maxTop < minTop) {
      top = minTop;
    } else {
      top = Math.min(maxTop, Math.max(minTop, top));
    }

    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (!state.tooltip) return;
    state.tooltip.classList.add("hidden");
  }

  function applyUpdate(update) {
    if (!update || typeof update !== "object") return;
    if (Array.isArray(update.districts)) {
      setDistricts(update.districts);
    }
    if (Array.isArray(update.attackedDistricts)) {
      setUnderAttackDistricts(update.attackedDistricts, { replace: true });
    }
    if (Array.isArray(update.policeActions)) {
      setPoliceActionDistricts(update.policeActions, { replace: true });
    }
    if (Array.isArray(update.spyActions)) {
      setSpyActionDistricts(update.spyActions, { replace: true });
    }
    if (Array.isArray(update.raidActions)) {
      update.raidActions.forEach((item) => {
        const districtId = item?.districtId ?? item?.id;
        if (districtId == null) return;
        markDistrictRaidAction(districtId, {
          durationMs: item?.durationMs,
          source: item?.source || "map-update-raid"
        });
      });
    }
    const eventTargetId = update.attackEvent?.targetDistrictId
      ?? update.attackEvent?.districtId
      ?? update.underAttackDistrictId;
    if (eventTargetId != null) {
      markDistrictUnderAttack(eventTargetId, {
        attackerDistrictId: update.attackEvent?.sourceDistrictId ?? update.attackEvent?.attackerDistrictId,
        durationMs: update.attackEvent?.durationMs,
        source: update.attackEvent?.source || "map-update"
      });
    }
    const policeTargetId = update.policeEvent?.targetDistrictId
      ?? update.policeEvent?.districtId
      ?? update.policeActionDistrictId;
    if (policeTargetId != null) {
      markDistrictPoliceAction(policeTargetId, {
        durationMs: update.policeEvent?.durationMs,
        source: update.policeEvent?.source || "map-update",
        operationType: update.policeEvent?.operationType || "",
        raidSpecialtyKey: update.policeEvent?.raidSpecialtyKey || ""
      });
    }
    const spyTargetId = update.spyEvent?.targetDistrictId
      ?? update.spyEvent?.districtId
      ?? update.spyActionDistrictId;
    if (spyTargetId != null) {
      markDistrictSpyAction(spyTargetId, {
        durationMs: update.spyEvent?.durationMs,
        source: update.spyEvent?.source || "map-update-spy"
      });
    }
    const raidTargetId = update.raidEvent?.targetDistrictId
      ?? update.raidEvent?.districtId
      ?? update.raidActionDistrictId;
    if (raidTargetId != null) {
      markDistrictRaidAction(raidTargetId, {
        durationMs: update.raidEvent?.durationMs,
        source: update.raidEvent?.source || "map-update-raid"
      });
    }
  }

  function setVisionContext(context = {}) {
    state.vision.fogPreviewMode = Boolean(context.fogPreviewMode);
    const allied = Array.isArray(context.alliedOwnerNames) ? context.alliedOwnerNames : [];
    const enemies = Array.isArray(context.enemyOwnerNames) ? context.enemyOwnerNames : [];
    state.vision.allowEnemyModalIntelInFog = Boolean(context.allowEnemyModalIntelInFog);
    state.vision.uniqueOwnerColors = Boolean(context.uniqueOwnerColors);
    state.vision.districtBorderMode = normalizeDistrictBorderMode(context.districtBorderMode);
    state.vision.unknownNeutralFillEnabled = Boolean(context.unknownNeutralFillEnabled);
    state.vision.showDistrictBorders = context.showDistrictBorders !== false;
    state.vision.showAllianceSymbols = context.showAllianceSymbols !== false;
    state.vision.districtVisibilityMode = normalizeDistrictVisibilityMode(context.districtVisibilityMode);
    state.vision.alliedOwnerNames = new Set(
      allied
        .map((value) => normalizeName(value))
        .filter(Boolean)
    );
    state.vision.enemyOwnerNames = new Set(
      enemies
        .map((value) => normalizeName(value))
        .filter(Boolean)
    );
    rebuildDistinctOwnerColorIndex();
    render();
  }

  function buildDistrictTypeOverrides(districts) {
    const safeDistricts = Array.isArray(districts) ? districts : [];
    const incomingTypeById = new Map(
      safeDistricts.map((district) => [
        normalizeDistrictId(district?.id),
        String(district?.type || "residential")
      ])
    );
    const shouldRefreshBaseTypes =
      !state.baseDistrictTypeById.size
      || state.baseDistrictTypeById.size !== incomingTypeById.size
      || Array.from(incomingTypeById.keys()).some((districtId) => !state.baseDistrictTypeById.has(districtId));
    if (shouldRefreshBaseTypes) {
      state.baseDistrictTypeById = new Map(
        incomingTypeById
      );
    }
    const byId = new Map(state.baseDistrictTypeById);
    const swapTypeByDistrictIds = (a, b) => {
      const firstId = normalizeDistrictId(a);
      const secondId = normalizeDistrictId(b);
      if (!byId.has(firstId) || !byId.has(secondId)) return;
      const firstType = byId.get(firstId);
      const secondType = byId.get(secondId);
      byId.set(firstId, secondType);
      byId.set(secondId, firstType);
    };
    swapTypeByDistrictIds(114, 68);
    swapTypeByDistrictIds(95, 20);
    return byId;
  }

  function setDistricts(districts) {
    if (!Array.isArray(districts) || districts.length < 1) return;
    const districtTypeOverrides = buildDistrictTypeOverrides(districts);
    let normalized = districts.map((district, index) => {
      const districtId = normalizeDistrictId(district?.id);
      const districtType = districtTypeOverrides.get(districtId) || district.type || "residential";
      const basePolygon = resolveDistrictBasePolygon(district);
      return {
        id: district.id,
        name: district.name || `${districtType} #${index + 1}`,
        type: districtType,
        owner: district.owner || null,
        ownerPlayerId: district.ownerPlayerId || district.owner_player_id || null,
        ownerNick: district.ownerNick || district.owner_nick || district.ownerUsername || district.owner_username || null,
        ownerAllianceName: district.ownerAllianceName || district.owner_alliance_name || null,
        ownerAllianceIconKey: district.ownerAllianceIconKey || district.owner_alliance_icon_key || null,
        ownerAvatar: district.ownerAvatar || district.owner_avatar || null,
        ownerStructure: district.ownerStructure || district.owner_structure || district.faction || null,
        ownerFaction: district.ownerFaction || district.owner_faction || district.ownerStructure || district.faction || null,
        ownerAtmosphere: district.ownerAtmosphere || district.owner_atmosphere || null,
        influence: Number(district.influence || 0),
        income: Number(district.income || 0),
        isDestroyed: Boolean(district.isDestroyed || district.is_destroyed || district.destroyed),
        destroyedAt: district.destroyedAt || district.destroyed_at || null,
        basePolygon,
        polygon: basePolygon,
        buildings: Array.isArray(district.buildings) ? district.buildings : [],
        buildingNameOverrides: Array.isArray(district.buildingNameOverrides) ? district.buildingNameOverrides : [],
        buildingTier: district.buildingTier || null,
        buildingSetKey: district.buildingSetKey || null,
        buildingSetTitle: district.buildingSetTitle || null
      };
    });

    if (window.Empire.UI?.assignDistrictMetadata) {
      normalized = window.Empire.UI.assignDistrictMetadata(normalized);
    }
    normalized = fitDistrictPolygonsToMap(normalized);

    const hasPolygons = normalized.every((d) => Array.isArray(d.polygon));
    if (!hasPolygons) return;

    state.districts = normalized;
    state.districtIndexById = new Map(
      normalized
        .map((district) => [normalizeDistrictId(district?.id), district])
        .filter(([districtKey]) => Boolean(districtKey))
    );
    state.districtAdjacencyById = buildDistrictAdjacencyIndex(normalized);
    state.alliancePatternCache.clear();
    rebuildDistinctOwnerColorIndex();
    reconcileAttackMarkersWithDistricts();
    reconcilePoliceActionsWithDistricts();
    reconcileSpyActionsWithDistricts();
    reconcileRaidActionsWithDistricts();
    pruneExpiredAttackMarkers(Date.now());
    pruneExpiredPoliceActions(Date.now());
    pruneExpiredSpyActions(Date.now());
    pruneExpiredRaidActions(Date.now());
    syncAttackAnimationTicker();
    state.roads = buildRoadNetworkFromDistricts(normalized);
    window.Empire.districts = normalized;
    if (window.Empire.selectedDistrict?.id != null) {
      const selected = normalized.find((district) => String(district.id) === String(window.Empire.selectedDistrict.id)) || null;
      window.Empire.selectedDistrict = selected;
      state.selectedId = selected ? selected.id : null;
    }
    notifySelectedDistrictChange();
    render();
  }

  function initModal() {
    const root = document.getElementById("district-modal");
    const backdrop = document.getElementById("modal-backdrop");
    const closeBtn = document.getElementById("modal-close");
    if (!root) return;
    state.modal = { root, backdrop, closeBtn };
    if (backdrop) backdrop.addEventListener("click", hideModal);
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target === backdrop) {
        hideModal();
      }
    });
    if (closeBtn) closeBtn.addEventListener("click", hideModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hideModal();
      if (event.key === "Enter" && !state.modal?.root?.classList.contains("hidden")) {
        const defense = document.getElementById("defense-btn");
        if (defense && !defense.classList.contains("hidden") && !defense.disabled) {
          defense.click();
          return;
        }
        const attack = document.getElementById("attack-btn");
        if (attack && !attack.classList.contains("hidden") && !attack.disabled) attack.click();
      }
    });
  }

  let districtModalRefreshIntervalId = null;

  function startDistrictModalRefreshTicker() {
    if (districtModalRefreshIntervalId) return;
    districtModalRefreshIntervalId = setInterval(() => {
      if (!state.modal?.root || state.modal.root.classList.contains("hidden")) return;
      const selected = window.Empire.selectedDistrict?.id != null
        ? state.districts.find((district) => String(district?.id) === String(window.Empire.selectedDistrict.id)) || null
        : null;
      if (!selected) return;
      updateDistrictRaidLockRow(selected);
      updateModalActionsForDistrict(selected);
    }, 1000);
  }

  function stopDistrictModalRefreshTicker() {
    if (!districtModalRefreshIntervalId) return;
    clearInterval(districtModalRefreshIntervalId);
    districtModalRefreshIntervalId = null;
  }

  document.addEventListener("empire:onboarding:focus-district", (event) => {
    state.onboardingFocusDistrictId = event.detail?.districtId != null ? String(event.detail.districtId) : null;
    state.onboardingFocusMode = String(event.detail?.focusMode || "full").trim() || "full";
    render();
  });

  document.addEventListener("empire:spy-started", (event) => {
    const districtId = event.detail?.districtId != null ? String(event.detail.districtId) : "";
    if (!districtId || districtId !== String(state.onboardingFocusDistrictId || "")) return;
    state.onboardingFocusMode = "border";
    render();
  });

  document.addEventListener("empire:occupy-started", (event) => {
    const districtId = event.detail?.districtId != null ? String(event.detail.districtId) : "";
    if (!districtId || districtId !== String(state.onboardingFocusDistrictId || "")) return;
    state.onboardingFocusMode = "border";
    render();
  });

  document.addEventListener("empire:onboarding:finished", () => {
    state.onboardingFocusDistrictId = null;
    state.onboardingFocusMode = "full";
    render();
  });

  document.addEventListener("empire:onboarding:reset", () => {
    state.onboardingFocusDistrictId = null;
    state.onboardingFocusMode = "full";
    render();
  });

  function initBuildingDetailModal() {
    const root = document.getElementById("building-detail-modal");
    if (!root) return;

    const backdrop = document.getElementById("building-detail-modal-backdrop");
    const closeBtn = document.getElementById("building-detail-modal-close");
    const modalBody = root.querySelector(".modal__body");
    const tabButtons = Array.from(root.querySelectorAll("[data-building-tab]"));
    const actionButtons = Array.from(root.querySelectorAll("[data-building-action]"));
    const panelStats = document.getElementById("building-detail-panel-stats");
    const panelInfo = document.getElementById("building-detail-panel-info");
    let swipeState = null;

    const setTab = (tab) => {
      const showInfo = tab === "info";
      state.activeBuildingDetailTab = showInfo ? "info" : "stats";
      if (panelStats) panelStats.classList.toggle("hidden", showInfo);
      if (panelInfo) panelInfo.classList.toggle("hidden", !showInfo);
      root.classList.toggle("is-info-tab", showInfo);
      tabButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.buildingTab === tab);
      });
      updateArmoryMaterialsStickyCompactState();
    };

    const isMobileSwipeViewport = () => window.matchMedia("(max-width: 900px)").matches;
    const resetSwipeState = () => {
      swipeState = null;
    };
    const finalizeSwipe = () => {
      if (!swipeState) return;
      const now = Date.now();
      const { startX, startY, lastX, lastY, startedAt } = swipeState;
      resetSwipeState();
      if (!isMobileSwipeViewport()) return;
      const deltaX = lastX - startX;
      const deltaY = lastY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const elapsedMs = Math.max(0, now - startedAt);
      if (absX < 46) return;
      if (absX < absY * 1.25) return;
      if (elapsedMs > 850 && absX < 70) return;
      if (deltaX < 0) {
        setTab("info");
      } else if (deltaX > 0) {
        setTab("stats");
      }
    };

    const close = () => {
      root.classList.add("hidden");
      state.activeBuildingDetail = null;
      state.activeBuildingDetailTab = "stats";
      resetSwipeState();
    };

    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (panelStats) {
      panelStats.addEventListener("scroll", updateArmoryMaterialsStickyCompactState, { passive: true });
    }
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target === backdrop) close();
    });
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => setTab(button.dataset.buildingTab || "stats"));
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
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.buildingAction || "?";
        const activeContext = resolveActiveBuildingContext();
        const context = activeContext?.context || null;
        const buildingName = document.getElementById("building-detail-name")?.textContent || context?.baseName || "Budova";
        const baseName = String(context?.baseName || "").trim();
        if (isPoliceRaidAllActionsBlocked(Date.now())) {
          window.Empire.UI?.pushEvent?.("Během policejní razie jsou všechny akce v budovách dočasně zakázané.");
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === APARTMENT_BLOCK_NAME) {
          const result = handleApartmentBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === SCHOOL_BUILDING_NAME) {
          const result = handleSchoolBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (isFitnessClubBaseName(baseName)) {
          const result = handleFitnessBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === CASINO_BUILDING_NAME || isCasinoBaseName(baseName)) {
          const result = handleCasinoBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === ARCADE_BUILDING_NAME || isArcadeBaseName(baseName)) {
          const result = handleArcadeBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === AUTO_SALON_BUILDING_NAME || isAutoSalonBaseName(baseName)) {
          const result = handleAutoSalonBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === EXCHANGE_BUILDING_NAME || isExchangeBaseName(baseName)) {
          const result = handleExchangeBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === RESTAURANT_BUILDING_NAME || isRestaurantBaseName(baseName)) {
          const result = handleRestaurantBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === CONVENIENCE_STORE_BUILDING_NAME || isConvenienceStoreBaseName(baseName)) {
          const result = handleConvenienceStoreBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === ARMORY_BUILDING_NAME || isArmoryBaseName(baseName)) {
          const result = handleArmoryBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === FACTORY_BUILDING_NAME || isFactoryBaseName(baseName)) {
          const result = handleFactoryBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === PHARMACY_BUILDING_NAME || isPharmacyBaseName(baseName)) {
          const result = handlePharmacyBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === DRUG_LAB_BUILDING_NAME || isDrugLabBaseName(baseName)) {
          const result = handleDrugLabBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (baseName === ARMORY_BUILDING_NAME || isArmoryBaseName(baseName)) {
          const result = handleArmoryBuildingAction(actionId, activeContext);
          if (result?.message) {
            window.Empire.UI?.pushEvent?.(result.message);
          }
          refreshActiveBuildingDetailModal();
          return;
        }

        if (actionId === "upgrade") {
          window.Empire.UI?.pushEvent?.(`${buildingName}: Upgrade bude doplněn později.`);
          return;
        }

        if (actionId === "collect") {
          window.Empire.UI?.pushEvent?.(`${buildingName}: Výběr členů bude dostupný po nastavení mechaniky.`);
          return;
        }
        window.Empire.UI?.pushEvent?.(`${buildingName}: Akce ${actionId} bude doplněna později.`);
      });
    });
    root.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (isPoliceRaidAllActionsBlocked(Date.now())) {
        window.Empire.UI?.pushEvent?.("Během policejní razie jsou všechny akce v budovách dočasně zakázané.");
        refreshActiveBuildingDetailModal();
        return;
      }
      const activeContext = resolveActiveBuildingContext();
      const context = activeContext?.context || null;
      const baseName = String(context?.baseName || "").trim();
      let result = null;
      if (baseName === DRUG_LAB_BUILDING_NAME || isDrugLabBaseName(baseName)) {
        result = handleDrugLabInlineControl(target, activeContext);
      } else if (baseName === ARMORY_BUILDING_NAME || isArmoryBaseName(baseName)) {
        result = handleArmoryInlineControl(target, activeContext);
      } else if (baseName === FACTORY_BUILDING_NAME || isFactoryBaseName(baseName)) {
        result = handleFactoryInlineControl(target, activeContext);
      } else if (baseName === PHARMACY_BUILDING_NAME || isPharmacyBaseName(baseName)) {
        result = handlePharmacyInlineControl(target, activeContext);
      } else {
        return;
      }
      if (result?.message && !result?.silentUiEvent) {
        window.Empire.UI?.pushEvent?.(result.message);
      }
      if (result) {
        refreshActiveBuildingDetailModal();
      }
    });
    root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (isPoliceRaidAllActionsBlocked(Date.now())) {
        window.Empire.UI?.pushEvent?.("Během policejní razie jsou všechny akce v budovách dočasně zakázané.");
        refreshActiveBuildingDetailModal();
        return;
      }
      const titleActionBtn = target.closest("[data-building-title-action]");
      if (titleActionBtn instanceof HTMLElement) {
        const actionId = String(titleActionBtn.dataset.buildingTitleAction || "").trim();
        if (!actionId) return;
        const modalActionBtn = root.querySelector(`[data-building-action="${actionId}"]`);
        if (modalActionBtn instanceof HTMLButtonElement && !modalActionBtn.disabled) {
          modalActionBtn.click();
        }
        return;
      }
      if (target.closest("[data-drug-lab-slot-select]")) return;
      const activeContext = resolveActiveBuildingContext();
      const context = activeContext?.context || null;
      const baseName = String(context?.baseName || "").trim();
      let result = null;
      if (baseName === DRUG_LAB_BUILDING_NAME || isDrugLabBaseName(baseName)) {
        result = handleDrugLabInlineControl(target, activeContext);
      } else if (baseName === ARMORY_BUILDING_NAME || isArmoryBaseName(baseName)) {
        result = handleArmoryInlineControl(target, activeContext);
      } else if (baseName === FACTORY_BUILDING_NAME || isFactoryBaseName(baseName)) {
        result = handleFactoryInlineControl(target, activeContext);
      } else if (baseName === PHARMACY_BUILDING_NAME || isPharmacyBaseName(baseName)) {
        result = handlePharmacyInlineControl(target, activeContext);
      } else {
        return;
      }
      if (result?.message && !result?.silentUiEvent) {
        window.Empire.UI?.pushEvent?.(result.message);
      }
      if (result) {
        refreshActiveBuildingDetailModal();
      }
    });
    setInterval(() => {
      if (root.classList.contains("hidden")) return;
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement
        && activeElement.closest("#building-detail-modal")
        && activeElement.matches("[data-drug-lab-slot-select]")
      ) {
        return;
      }
      const active = resolveActiveBuildingContext();
      const baseName = String(active?.context?.baseName || "").trim();
      if (
        !(
          baseName === DRUG_LAB_BUILDING_NAME
          || isDrugLabBaseName(baseName)
          || baseName === ARMORY_BUILDING_NAME
          || isArmoryBaseName(baseName)
          || baseName === FACTORY_BUILDING_NAME
          || isFactoryBaseName(baseName)
          || baseName === PHARMACY_BUILDING_NAME
          || isPharmacyBaseName(baseName)
        )
      ) return;
      refreshActiveBuildingDetailModal();
    }, 1000);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function setBuildingDetailActionButtons(details) {
    const root = document.getElementById("building-detail-modal");
    if (!root) return;

    const actionButtons = Array.from(root.querySelectorAll("[data-building-action]"));
    const buttonByAction = new Map(actionButtons.map((button) => [button.dataset.buildingAction, button]));
    const collectBtn = buttonByAction.get("collect");
    const action1Btn = buttonByAction.get("1");
    const action2Btn = buttonByAction.get("2");
    const action3Btn = buttonByAction.get("3");
    const upgradeBtn = buttonByAction.get("upgrade");
    const specialActionsGroup = action1Btn?.closest(".building-detail-actions__group") || null;
    const upgradeGroup = upgradeBtn?.closest(".building-detail-actions__group") || null;

    actionButtons.forEach((button) => {
      button.classList.remove("hidden");
    });
    if (specialActionsGroup) specialActionsGroup.classList.remove("hidden");
    if (upgradeGroup) upgradeGroup.classList.remove("hidden");
    if (action1Btn) action1Btn.textContent = "Akce 1";
    if (action2Btn) action2Btn.textContent = "Akce 2";
    if (action3Btn) action3Btn.textContent = "Akce 3";
    if (collectBtn) collectBtn.textContent = "Vybrat členy";
    if (collectBtn) collectBtn.classList.add("hidden");
    if (upgradeBtn) upgradeBtn.textContent = "Upgrade";
    actionButtons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("title");
    });

    const mechanics = details?.mechanics;
    const mechanicsType = String(mechanics?.type || "").trim();
    const supportsCustomActions =
      mechanicsType === "apartment-block"
      || mechanicsType === "school"
      || mechanicsType === "fitness-club"
      || mechanicsType === "casino"
      || mechanicsType === "arcade"
      || mechanicsType === "auto-salon"
      || mechanicsType === "exchange"
      || mechanicsType === "restaurant"
      || mechanicsType === "convenience-store"
      || mechanicsType === "armory"
      || mechanicsType === "factory"
      || mechanicsType === "pharmacy"
      || mechanicsType === "drug-lab";
    if (!supportsCustomActions) {
      return;
    }

    if (collectBtn && (mechanicsType === "apartment-block" || mechanicsType === "school")) {
      collectBtn.classList.remove("hidden");
      collectBtn.disabled = mechanics.storedMembers <= 0;
      collectBtn.title = mechanics.storedMembers <= 0 ? "Budova nemá nasbírané členy." : "";
    } else if (collectBtn && mechanicsType === "drug-lab") {
      collectBtn.classList.remove("hidden");
      collectBtn.textContent = "Vybrat drogy";
      collectBtn.disabled = Math.max(0, Number(mechanics.storedTotal || 0)) <= 0;
      collectBtn.title = collectBtn.disabled ? "Drug Lab sklad je prázdný." : "";
    } else if (collectBtn && mechanicsType === "pharmacy") {
      collectBtn.classList.remove("hidden");
      collectBtn.textContent = "Vybrat suroviny";
      collectBtn.disabled = Math.max(0, Number(mechanics.storedTotal || 0)) <= 0;
      collectBtn.title = collectBtn.disabled ? "Lékárna nemá vyrobené suroviny." : "";
    } else if (collectBtn && mechanicsType === "factory") {
      collectBtn.classList.remove("hidden");
      collectBtn.textContent = "Vybrat materiály";
      collectBtn.disabled = Math.max(0, Number(mechanics.storedTotal || 0)) <= 0;
      collectBtn.title = collectBtn.disabled ? "Továrna nemá vyrobené materiály." : "";
    } else if (collectBtn && mechanicsType === "armory") {
      collectBtn.classList.add("hidden");
    }
    if (
      collectBtn
      && (
        mechanicsType === "armory"
        || mechanicsType === "pharmacy"
        || mechanicsType === "factory"
        || mechanicsType === "drug-lab"
      )
    ) {
      collectBtn.classList.add("hidden");
    }

    const applyActionButtonState = (button, label, cooldownMs) => {
      if (!button) return;
      const cooldownLeft = Math.max(0, Number(cooldownMs || 0));
      button.textContent = label;
      button.disabled = cooldownLeft > 0;
      button.title = cooldownLeft > 0 ? `Cooldown ${formatDurationLabel(cooldownLeft)}` : "";
    };

    if (mechanicsType === "apartment-block") {
      applyActionButtonState(action1Btn, "Nábor z ulice", mechanics.cooldowns?.recruit);
      applyActionButtonState(action2Btn, "Motivační večer", mechanics.cooldowns?.motivation);
      applyActionButtonState(action3Btn, "Skryté ubytování", mechanics.cooldowns?.hiddenHousing);
    } else if (mechanicsType === "school") {
      applyActionButtonState(action1Btn, "Náborová přednáška", mechanics.cooldowns?.lecture);
      applyActionButtonState(action2Btn, "Zrychlený kurz chemie", mechanics.cooldowns?.chemistry);
      applyActionButtonState(action3Btn, "Večerní program", mechanics.cooldowns?.evening);
    } else if (mechanicsType === "fitness-club") {
      applyActionButtonState(action1Btn, "Prémiové členství", mechanics.cooldowns?.premium);
      applyActionButtonState(action2Btn, "Intenzivní trénink", mechanics.cooldowns?.training);
      if (action3Btn) {
        action3Btn.classList.add("hidden");
        action3Btn.disabled = true;
        action3Btn.title = "";
      }
    } else if (mechanicsType === "casino") {
      applyActionButtonState(action1Btn, "VIP Turnaj", mechanics.cooldowns?.vip);
      applyActionButtonState(action2Btn, "Praní špinavých peněz", mechanics.cooldowns?.laundering);
      if (action3Btn) {
        action3Btn.classList.add("hidden");
        action3Btn.disabled = true;
        action3Btn.title = "";
      }
    } else if (mechanicsType === "arcade") {
      applyActionButtonState(action1Btn, "Rozjet automaty", mechanics.cooldowns?.slots);
      applyActionButtonState(action2Btn, "Zadní místnost", mechanics.cooldowns?.backroom);
      applyActionButtonState(action3Btn, "Deal přes automaty", mechanics.cooldowns?.deal);
    } else if (mechanicsType === "auto-salon") {
      applyActionButtonState(action1Btn, "Prémiová nabídka", mechanics.cooldowns?.premiumOffer);
      applyActionButtonState(action2Btn, "Šedý dovoz", mechanics.cooldowns?.grayImport);
      applyActionButtonState(action3Btn, "Rychlá flotila", mechanics.cooldowns?.fleet);
    } else if (mechanicsType === "exchange") {
      applyActionButtonState(action1Btn, "Výhodný kurz", mechanics.cooldowns?.favorableRate);
      applyActionButtonState(action2Btn, "Tichý převod", mechanics.cooldowns?.silentTransfer);
      applyActionButtonState(action3Btn, "Finanční síť", mechanics.cooldowns?.financialNetwork);
    } else if (mechanicsType === "restaurant") {
      applyActionButtonState(action1Btn, "Happy Hour", mechanics.cooldowns?.happyHour);
      applyActionButtonState(action2Btn, "Zadní stůl", mechanics.cooldowns?.backTable);
      applyActionButtonState(action3Btn, "Narozeninová párty", mechanics.cooldowns?.birthdayParty);
    } else if (mechanicsType === "convenience-store") {
      applyActionButtonState(action1Btn, "Noční směna", mechanics.cooldowns?.nightShift);
      applyActionButtonState(action2Btn, "Zadní pult", mechanics.cooldowns?.backCounter);
      applyActionButtonState(action3Btn, "Místní klepy", mechanics.cooldowns?.localRumors);
    } else if (mechanicsType === "armory") {
      applyActionButtonState(action1Btn, "Attack gun boost", mechanics.cooldowns?.attackBoost);
      applyActionButtonState(action2Btn, "Defense gun boost", mechanics.cooldowns?.defenseBoost);
      if (action3Btn) {
        action3Btn.classList.add("hidden");
        action3Btn.disabled = true;
        action3Btn.title = "";
      }
    } else if (mechanicsType === "factory") {
      applyActionButtonState(action1Btn, "Akce 1", 0);
      applyActionButtonState(action2Btn, "Akce 2", 0);
      if (action3Btn) {
        action3Btn.classList.add("hidden");
        action3Btn.disabled = true;
        action3Btn.title = "";
      }
    } else if (mechanicsType === "pharmacy") {
      applyActionButtonState(action1Btn, "Akce 1", 0);
      applyActionButtonState(action2Btn, "Akce 2", 0);
      if (action3Btn) {
        action3Btn.classList.add("hidden");
        action3Btn.disabled = true;
        action3Btn.title = "";
      }
    } else if (mechanicsType === "drug-lab") {
      applyActionButtonState(action1Btn, "Overclock výroby", mechanics.cooldowns?.overclock);
      applyActionButtonState(action2Btn, "Čistá várka", mechanics.cooldowns?.cleanBatch);
      applyActionButtonState(action3Btn, "Skrytý provoz", mechanics.cooldowns?.hiddenOperation);
    }

    if (upgradeBtn) {
      if (mechanics.nextLevel && mechanics.nextUpgradeCost > 0) {
        upgradeBtn.textContent = `Upgrade L${mechanics.nextLevel} ($${mechanics.nextUpgradeCost})`;
        upgradeBtn.disabled = false;
        upgradeBtn.title = "";
      } else {
        upgradeBtn.textContent = "MAX level";
        upgradeBtn.disabled = true;
        upgradeBtn.title = "Budova je na maximálním levelu.";
      }
      if (
        mechanicsType === "armory"
        || mechanicsType === "drug-lab"
        || mechanicsType === "pharmacy"
        || mechanicsType === "factory"
      ) {
        upgradeBtn.classList.add("hidden");
      }
    }
    if (upgradeGroup && (mechanicsType === "pharmacy" || mechanicsType === "factory" || mechanicsType === "armory")) {
      upgradeGroup.classList.add("hidden");
    }
  }

  function updateArmoryMaterialsStickyCompactState() {
    const root = document.getElementById("building-detail-modal");
    if (!root || root.classList.contains("hidden")) return;
    if (String(root.dataset.buildingMechanicsType || "").trim() !== "armory") return;
    const panelStats = document.getElementById("building-detail-panel-stats");
    if (!panelStats || panelStats.classList.contains("hidden")) return;
    const stickyCard = panelStats.querySelector(".armory-card--materials-sticky");
    if (!(stickyCard instanceof HTMLElement)) return;
    const isCompact = stickyCard.classList.contains("is-scroll-compact");
    const enterCompactAt = 12;
    const exitCompactAt = 4;
    const scrollTop = Math.max(0, Number(panelStats.scrollTop) || 0);
    const shouldCompact = isCompact ? scrollTop > exitCompactAt : scrollTop > enterCompactAt;
    stickyCard.classList.toggle("is-scroll-compact", shouldCompact);
  }

  function updateBuildingMechanicsPanel(details) {
    const root = document.getElementById("building-detail-mechanics");
    const storedLabel = document.getElementById("building-detail-label-stored");
    const productionLabel = document.getElementById("building-detail-label-production");
    const heatLabel = document.getElementById("building-detail-label-heat");
    const effectsLabel = document.getElementById("building-detail-label-effects");
    const level = document.getElementById("building-detail-level");
    const stored = document.getElementById("building-detail-stored-members");
    const production = document.getElementById("building-detail-member-production");
    const heat = document.getElementById("building-detail-heat");
    const effects = document.getElementById("building-detail-effects");
    const infoEffects = document.getElementById("building-info-effects");
    const effectsRow = effects?.closest(".modal__row") || null;
    const productionRow = production?.closest(".modal__row") || null;
    const levelRow = level?.closest(".modal__row") || null;
    if (!root || !level || !stored || !production || !heat || !effects) return;

    const mechanics = details?.mechanics;
    const mechanicsType = String(mechanics?.type || "").trim();
    if (
      !mechanics
      || (
        mechanicsType !== "apartment-block"
        && mechanicsType !== "school"
        && mechanicsType !== "fitness-club"
        && mechanicsType !== "casino"
        && mechanicsType !== "arcade"
        && mechanicsType !== "auto-salon"
        && mechanicsType !== "exchange"
        && mechanicsType !== "restaurant"
        && mechanicsType !== "convenience-store"
        && mechanicsType !== "armory"
        && mechanicsType !== "factory"
        && mechanicsType !== "pharmacy"
        && mechanicsType !== "drug-lab"
      )
    ) {
      root.classList.add("hidden");
      renderDrugLabDetailPanel(null);
      if (infoEffects) infoEffects.textContent = "Žádné aktivní mechaniky.";
      return;
    }

    if (storedLabel) storedLabel.textContent = "Uložení členové";
    if (productionLabel) productionLabel.textContent = "Produkce členů";
    if (heatLabel) heatLabel.textContent = "Heat";
    if (effectsLabel) effectsLabel.textContent = "Aktivní efekty";
    if (effectsRow) effectsRow.classList.remove("hidden");
    if (productionRow) productionRow.classList.remove("hidden");
    if (levelRow) levelRow.classList.remove("hidden");
    level.textContent = `L${mechanics.level}`;
    heat.textContent = `${formatDecimalValue(mechanics.heatPerDay, 2)} / 24h`;
    if (mechanicsType === "fitness-club") {
      if (storedLabel) storedLabel.textContent = "Bojový bonus";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = mechanics.trainingActive
        ? `+${formatDecimalValue(mechanics.trainingCombatBoostPct, 2)}%`
        : "0%";
      production.textContent = `x${formatDecimalValue(mechanics.currentIncomeMultiplier, 2)}`;
    } else if (mechanicsType === "casino") {
      if (storedLabel) storedLabel.textContent = "Praní bonus";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = `+${formatDecimalValue(mechanics.launderingPct, 2)}%`;
      production.textContent = `x${formatDecimalValue(mechanics.currentIncomeMultiplier, 2)}`;
    } else if (mechanicsType === "arcade") {
      if (storedLabel) storedLabel.textContent = "Bonus prodeje drog";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = mechanics.dealActive && mechanics.hasDrugSalesTargets
        ? `+${formatDecimalValue(mechanics.dealDrugSalesPct, 2)}%`
        : "0%";
      const dirtyBonusLabel = mechanics.dealDirtyBonusPerHour > 0
        ? ` (+$${formatDecimalValue(mechanics.dealDirtyBonusPerHour, 2)} D/h)`
        : "";
      production.textContent =
        `C x${formatDecimalValue(mechanics.currentCleanIncomeMultiplier, 2)} • `
        + `D x${formatDecimalValue(mechanics.currentDirtyIncomeMultiplier, 2)}${dirtyBonusLabel}`;
    } else if (mechanicsType === "auto-salon") {
      if (storedLabel) storedLabel.textContent = "Logistický bonus";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = mechanics.fleetActive && mechanics.hasLogisticsTargets
        ? `+${formatDecimalValue(mechanics.fleetLogisticsPct, 2)}%`
        : "0%";
      const fleetBonusLabel = mechanics.fleetCleanBonusPerHour > 0
        ? ` (+$${formatDecimalValue(mechanics.fleetCleanBonusPerHour, 2)} C/h)`
        : "";
      production.textContent =
        `C x${formatDecimalValue(mechanics.currentCleanIncomeMultiplier, 2)} • `
        + `D x${formatDecimalValue(mechanics.currentDirtyIncomeMultiplier, 2)}${fleetBonusLabel}`;
    } else if (mechanicsType === "exchange") {
      if (storedLabel) storedLabel.textContent = "Převod dirty cash";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = `+${formatDecimalValue(mechanics.silentTransferPct, 2)}%`;
      const districtBoostLabel = mechanics.districtIncomeBoostPct > 0
        ? ` • District +${formatDecimalValue(mechanics.districtIncomeBoostPct, 2)}%`
        : "";
      production.textContent =
        `C x${formatDecimalValue(mechanics.currentCleanIncomeMultiplier, 2)} • `
        + `D x${formatDecimalValue(mechanics.currentDirtyIncomeMultiplier, 2)}${districtBoostLabel}`;
    } else if (mechanicsType === "restaurant") {
      if (storedLabel) storedLabel.textContent = "Bonus vlivu";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = mechanics.backTableActive
        ? `+${formatDecimalValue(mechanics.backTableInfluenceBoostPct, 2)}%`
        : "0%";
      const districtBoostLabel = mechanics.districtIncomeBoostPct > 0
        ? ` • District +${formatDecimalValue(mechanics.districtIncomeBoostPct, 2)}%`
        : "";
      production.textContent =
        `C x${formatDecimalValue(mechanics.currentCleanIncomeMultiplier, 2)} • `
        + `D x${formatDecimalValue(mechanics.currentDirtyIncomeMultiplier, 2)} • `
        + `V x${formatDecimalValue(mechanics.currentInfluenceMultiplier, 2)}${districtBoostLabel}`;
    } else if (mechanicsType === "convenience-store") {
      if (storedLabel) storedLabel.textContent = "Riziko razie";
      if (productionLabel) productionLabel.textContent = "Income multiplikátor";
      stored.textContent = mechanics.activeRaidRiskPct > 0
        ? `+${formatDecimalValue(mechanics.activeRaidRiskPct, 2)}%`
        : "0%";
      const districtBoostLabel = mechanics.districtIncomeBoostPct > 0
        ? ` • District +${formatDecimalValue(mechanics.districtIncomeBoostPct, 2)}%`
        : "";
      production.textContent =
        `C x${formatDecimalValue(mechanics.currentCleanIncomeMultiplier, 2)} • `
        + `D x${formatDecimalValue(mechanics.currentDirtyIncomeMultiplier, 2)} • `
        + `V +${formatDecimalValue(mechanics.currentInfluencePerHour, 2)}/h${districtBoostLabel}`;
      heat.textContent = `${formatDecimalValue(mechanics.heatPerDay, 2)} / 24h`;
    } else if (mechanicsType === "armory") {
      if (storedLabel) storedLabel.textContent = "Vyrobené zbraně";
      if (productionLabel) productionLabel.textContent = "Aktivní sloty / výroba";
      if (heatLabel) heatLabel.textContent = "Heat výroby";
      if (levelRow) levelRow.classList.add("hidden");
      if (productionRow) productionRow.classList.add("hidden");
      if (effectsRow) effectsRow.classList.add("hidden");
      const activeAttackSlots = Math.max(0, Math.floor(Number(mechanics.activeAttackSlots || 0)));
      const totalAttackSlots = Math.max(1, Math.floor(Number((mechanics.attackSlots || []).length || 0)));
      const activeDefenseSlots = Math.max(0, Math.floor(Number(mechanics.activeDefenseSlots || 0)));
      const totalDefenseSlots = Math.max(1, Math.floor(Number((mechanics.defenseSlots || []).length || 0)));
      const storedAttackTotal = Math.max(0, Math.floor(Number(mechanics.storedAttackTotal || 0)));
      const storedDefenseTotal = Math.max(0, Math.floor(Number(mechanics.storedDefenseTotal || 0)));
      stored.textContent = `Útok ${storedAttackTotal} • Obrana ${storedDefenseTotal}`;
      production.textContent = `U ${activeAttackSlots}/${totalAttackSlots} • O ${activeDefenseSlots}/${totalDefenseSlots}`;
      heat.textContent = `${formatDecimalValue(mechanics.heatPerHour || 0, 2)} / h`;
    } else if (mechanicsType === "factory") {
      if (levelRow) levelRow.classList.add("hidden");
      if (storedLabel) storedLabel.textContent = "Suroviny MP/TC/CM";
      if (productionLabel) productionLabel.textContent = "Síť aktivních továren";
      if (heatLabel) heatLabel.textContent = "Heat";
      if (productionRow) productionRow.classList.add("hidden");
      const resources = mechanics.resources || {};
      const rates = mechanics.ratesPerHour || {};
      stored.textContent =
        `${Math.max(0, Math.floor(Number(resources.metalParts || 0)))}/`
        + `${Math.max(0, Math.floor(Number(resources.techCore || 0)))}/`
        + `${Math.max(0, Math.floor(Number(resources.combatModule || 0)))}`;
      production.textContent =
        `MP ${formatDecimalValue(rates.metalParts || 0, 2)}/h • `
        + `TC ${formatDecimalValue(rates.techCore || 0, 2)}/h • `
        + `CM ${formatDecimalValue(rates.combatModule || 0, 2)}/h`;
      heat.textContent = `+${FACTORY_CONFIG.combatModule.heatPerUnit} / Combat Module`;
    } else if (mechanicsType === "pharmacy") {
      if (levelRow) levelRow.classList.add("hidden");
      if (storedLabel) storedLabel.textContent = "Suroviny C/B/S";
      if (productionLabel) productionLabel.textContent = "Síťové bonusy";
      if (effectsRow) effectsRow.classList.add("hidden");
      const resources = mechanics.resources || {};
      stored.textContent =
        `${Math.max(0, Math.floor(Number(resources.chemicals || 0)))}/`
        + `${Math.max(0, Math.floor(Number(resources.biomass || 0)))}/`
        + `${Math.max(0, Math.floor(Number(resources.stimPack || 0)))}`;
      production.textContent =
        `Sklad(+${formatDecimalValue(mechanics.pharmacyStorageCapBonusPct || 0, 2)}%) • `
        + `Lékárna(+${formatDecimalValue(mechanics.pharmacyProductionBonusPct || 0, 2)}% rychlost)`;
      heat.textContent = `${formatDecimalValue(mechanics.heatPerDay || PHARMACY_CONFIG.baseHeatPerDay, 2)} / 24h`;
    } else if (mechanicsType === "drug-lab") {
      if (levelRow) levelRow.classList.add("hidden");
      if (storedLabel) storedLabel.textContent = "Interní sklad";
      if (productionLabel) productionLabel.textContent = "Aktivní sloty";
      if (heatLabel) heatLabel.textContent = "Heat z výroby";
      if (productionRow) productionRow.classList.add("hidden");
      if (effectsRow) effectsRow.classList.add("hidden");
      stored.textContent = `${Math.max(0, Math.floor(Number(mechanics.storedTotal || 0)))} / ${Math.max(1, Math.floor(Number(mechanics.storageCapacity || 0)))}`;
      production.textContent =
        `${Math.max(0, Math.floor(Number(mechanics.activeSlots || 0)))}/${Math.max(1, Math.floor(Number(mechanics.unlockedSlots || 0)))} • `
        + `x${formatDecimalValue(mechanics.currentProductionMultiplier || 1, 2)}`;
      heat.textContent = `${formatDecimalValue(mechanics.heatPerHour || 0, 2)} / h`;
    } else {
      stored.textContent = `${mechanics.storedMembers} / ${mechanics.capacity}`;
      production.textContent = `${formatDecimalValue(mechanics.productionPerCycle, 2)} / 10 min`;
      heat.textContent = `${formatDecimalValue(mechanics.heatPerDay, 2)} / 24h`;
    }
    effects.textContent = mechanics.effectsLabel || "Žádné";
    if (infoEffects) infoEffects.textContent = mechanics.effectsLabel || "Žádné aktivní mechaniky.";
    renderDrugLabDetailPanel(details);
    root.classList.remove("hidden");
  }

  function refreshActiveBuildingDetailModal() {
    const active = resolveActiveBuildingContext();
    if (!active) return;
    openBuildingDetailModal(active.context, active.district || null);
  }

  function resolveBuildingInfoActions(details) {
    const customActions = Array.isArray(details?.specialActions)
      ? details.specialActions.filter((entry) => typeof entry === "string" && entry.trim())
      : [];
    if (customActions.length) return customActions;

    const mechanicsType = String(details?.mechanics?.type || "").trim();
    if (mechanicsType === "apartment-block") {
      return [
        "Nábor z ulice: Cooldown 3h, okamžitě přidá náhodně 5 až 15 členů do kapacity budovy a přidá +5 heat.",
        "Motivační večer: Cooldown 6h, na 2h zdvojnásobí produkci členů v budově.",
        "Skryté ubytování: Cooldown 8h, na 2h nastaví income budovy na 0 a aktivuje ochranný režim proti razii."
      ];
    }
    if (mechanicsType === "school") {
      return [
        "Náborová přednáška: Cooldown 3h, okamžitě přidá náhodně 4 až 10 členů do kapacity školy a přidá +2 heat.",
        "Zrychlený kurz chemie: Cooldown 4h, trvá 2h a pokud je v districtu Drug Lab, zvýší jeho rychlost o +25 % (+3 heat).",
        "Večerní program: Cooldown 6h, trvá 2h, snižuje heat districtu o 20 %, ale income školy je během efektu 0."
      ];
    }
    if (mechanicsType === "fitness-club") {
      return [
        "Prémiové členství: Cooldown 4h, trvá 2h, zvýší income fitness centra o +50 % (škáluje s levelem) a přidá +2 heat (škáluje s levelem).",
        "Intenzivní trénink: Cooldown 6h, trvá 2h, dá +10 % síly pro útok/obranu ve všech tvých districtech (škáluje s levelem), ale fitness centrum má během efektu o 20 % nižší income (škáluje s levelem)."
      ];
    }
    if (mechanicsType === "casino") {
      return [
        "VIP Turnaj: Cooldown 4h, trvá 2h, zvýší income kasina o +60 % (škáluje s levelem) a přidá +4 heat.",
        "Praní špinavých peněz: Cooldown 6h, vypere 15 % špinavých peněz (škáluje s levelem), přidá +6 heat a na 3h zvýší riziko policejní razie v districtu o 20 % (škáluje s levelem)."
      ];
    }
    if (mechanicsType === "arcade") {
      return [
        "Rozjet automaty: Cooldown 4h, trvá 2h, zvýší legální income herny o +50 % (škáluje s levelem) a přidá +3 heat.",
        "Zadní místnost: Cooldown 6h, trvá 2h, zvýší dirty income herny o +75 % (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko policejní razie v districtu o +10 % (škáluje s levelem).",
        "Deal přes automaty: Cooldown 5h, trvá 2h, přidá herně +20 dirty cash/h (škáluje s levelem), a pokud vlastníš Drug Lab nebo Pouliční dealery, zvýší jejich prodej drog o +25 % (škáluje s levelem); zároveň přidá +6 heat a +15 % riziko razie na 2h (škáluje s levelem)."
      ];
    }
    if (mechanicsType === "auto-salon") {
      return [
        "Prémiová nabídka: Cooldown 4h, trvá 2h, zvýší legální income autosalonu o +50 % (škáluje s levelem) a přidá +2 heat.",
        "Šedý dovoz: Cooldown 6h, trvá 2h, zvýší dirty income autosalonu o +80 % (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko policejní razie v districtu o +10 % (škáluje s levelem).",
        "Rychlá flotila: Cooldown 5h, trvá 2h, přidá autosalonu +15 clean cash/h (škáluje s levelem), a pokud vlastníš Garage, Taxi služba nebo Pašovací tunel, zvýší jejich efektivitu o +20 % (škáluje s levelem); zároveň přidá +3 heat."
      ];
    }
    if (mechanicsType === "exchange") {
      return [
        "Výhodný kurz: Cooldown 4h, trvá 2h, zvýší legální income směnárny o +40 % (škáluje s levelem) a přidá +2 heat.",
        "Tichý převod: Cooldown 6h, okamžitě převede 12 % dirty cash na clean cash (škáluje s levelem), přidá +5 heat a na 2h zvýší riziko razie v districtu o +10 % (škáluje s levelem).",
        "Finanční síť: Cooldown 5h, trvá 2h, zvýší cash income všech income budov v districtu o +15 % (škáluje s levelem) a přidá +3 heat."
      ];
    }
    if (mechanicsType === "restaurant") {
      return [
        "Happy Hour: Cooldown 4h, trvá 2h, zvýší legální income restaurace o +35 % (škáluje s levelem) a přidá +1 heat.",
        "Zadní stůl: Cooldown 5h, trvá 2h, zvýší produkci vlivu restaurace o +100 % (škáluje s levelem), ale během efektu má restaurace o 15 % nižší legální income (škáluje s levelem).",
        "Narozeninová párty: Cooldown 2h, není časový buff, po spuštění vygeneruje drby o dění ve městě (škáluje s levelem), hned je zobrazí hráči a uloží do historie příslušných districtů."
      ];
    }
    if (mechanicsType === "convenience-store") {
      return [
        "Noční směna: Cooldown 4h, trvá 2h, zvýší legální income večerky o +30 % a dirty income o +20 % (oboje škáluje s levelem), přidá +2 heat.",
        "Zadní pult: Cooldown 5h, trvá 2h, zvýší dirty income večerky o +60 % (škáluje s levelem), přidá +4 heat a na 2h zvýší riziko policejní razie v districtu o +8 % (škáluje s levelem).",
        "Místní klepy: Cooldown 2h, okamžitě vygeneruje 1 districtový drb, uloží ho do historie districtu, přidá +1 heat a dá malý instantní bonus vlivu (+0.1, škáluje s levelem)."
      ];
    }
    if (mechanicsType === "armory") {
      return [
        "Útok: Baseballová pálka, Pouliční pistole, Granát, Samopal, Bazuka.",
        "Obrana: Neprůstřelná vesta, Ocelové barikády, Bezpečnostní kamery, Automatické kulometné stanoviště, Alarm.",
        "Attack gun boost: Cooldown 6h, trvá 2h, +20 % produkce útočných zbraní, okamžitě +10 heat a během trvání +5 heat/h.",
        "Defense gun boost: Cooldown 6h, trvá 2h, +20 % produkce obranných zbraní, okamžitě +10 heat a během trvání +5 heat/h."
      ];
    }
    if (mechanicsType === "factory") {
      return [
        "Slot 1 vyrábí Metal Parts (základní materiál pro zbraně).",
        "Slot 2 vyrábí Tech Core (pokročilý materiál).",
        `Slot 3 craftí Combat Module: ${FACTORY_CONFIG.combatModule.metalPartsCost} Metal Parts + ${FACTORY_CONFIG.combatModule.techCoreCost} Tech Core, ${formatDurationLabel(FACTORY_CONFIG.combatModule.durationMs)} na kus a +${FACTORY_CONFIG.combatModule.heatPerUnit} heat za kus.`,
        "Combat boosty se aktivují přes Boost nad mapou: Assault Protocol (2 CM), Rapid Strike (3 CM), Breach Mode (4 CM)."
      ];
    }
    if (mechanicsType === "pharmacy") {
      return [
        "Lékárna má 3 sloty: Chemicals, Biomass, Stim Pack. Každý slot lze zvlášť spustit/zastavit.",
        "Vybrat suroviny přesune vyrobené látky do zásob Drug Labu (centrální vstup C/B/S).",
        "Boosty aktivuješ tlačítkem Boost nad mapou: Recon (1 Ghost Serum), Action (1 Ghost Serum), Neuro (1 Overdrive X, +3 heat), trvání 2h."
      ];
    }
    if (mechanicsType === "drug-lab") {
      return [
        "Overclock výroby: Cooldown 6h, trvá 2h, +50 % produkce všech slotů a okamžitě +3 heat.",
        "Čistá várka: Cooldown 5h, trvá 2h, nově vyrobené drogy jsou enhanced (+20 % síla efektu při použití).",
        "Skrytý provoz: Cooldown 6h, trvá 2h, heat z výroby -30 %, ale produkce -20 %."
      ];
    }
    return ["Speciální akce této budovy budou doplněny."];
  }

  function renderBuildingInfoActions(details) {
    const list = document.getElementById("building-info-actions");
    if (!list) return;
    list.innerHTML = "";
    const mechanicsType = String(details?.mechanics?.type || "").trim();
    list.classList.toggle("building-info-card__actions--armory", mechanicsType === "armory");
    list.classList.toggle("building-info-card__actions--drug-lab", mechanicsType === "drug-lab");
    if (mechanicsType === "armory") {
      const attackRows = [
        ["Baseballová pálka", "AP 5 • 8s", "Rychlý low-tier tlak"],
        ["Pouliční pistole", "AP 10 • 10s", "Stabilní early pressure"],
        ["Granát", "AP 14 • 15s", "Ignoruje 0.3 % obrany za ks"],
        ["Samopal", "AP 18 • 20s", "+0.2 power za ks při full attack setu"],
        ["Bazuka", "AP 30 • 35s", "+0.5 % šance na totální destrukci za ks"]
      ];
      const defenseRows = [
        ["Neprůstřelná vesta", "DP 6 • 8s", "-0.5 % ztráty obránců za ks"],
        ["Ocelové barikády", "DP 12 • 15s", "+0.02 % délka útoku za ks"],
        ["Bezpečnostní kamery", "DP 6 • 18s", "5+ ks = vysoká šance odhalit špeha"],
        ["Kulometné stanoviště", "DP 20 • 25s", "-0.3 % síla útoku útočníka za ks"],
        ["Alarm", "DP 10 • 12s", "5+ ks = vysoká šance selhání vykradení"]
      ];
      const createSection = (title, tone, rows) => {
        const li = document.createElement("li");
        li.className = `armory-info-block armory-info-block--${tone}`;
        li.innerHTML = `
          <div class="armory-info-block__head">
            <span class="armory-info-block__badge">${title}</span>
            <span class="armory-info-block__hint"></span>
          </div>
          <div class="armory-info-block__grid">
            ${rows.map(([name, meta, effect]) => `
              <article class="armory-info-chip armory-info-chip--${tone}">
                <strong class="armory-info-chip__title">${name}</strong>
                <span class="armory-info-chip__meta">${meta}</span>
                <span class="armory-info-chip__effect">${effect}</span>
              </article>
            `).join("")}
          </div>
        `;
        return li;
      };
      const createBoostSection = () => {
        const li = document.createElement("li");
        li.className = "armory-info-block armory-info-block--boost";
        li.innerHTML = `
          <div class="armory-info-block__head">
            <span class="armory-info-block__badge">Boosty</span>
            <span class="armory-info-block__hint"></span>
          </div>
          <div class="armory-info-block__grid armory-info-block__grid--boosts">
            <article class="armory-info-chip armory-info-chip--boost">
              <strong class="armory-info-chip__title">Attack gun boost</strong>
              <span class="armory-info-chip__meta">2h • CD 6h</span>
              <span class="armory-info-chip__effect">+20 % produkce útočných zbraní • +10 heat • +5 heat/h</span>
            </article>
            <article class="armory-info-chip armory-info-chip--boost">
              <strong class="armory-info-chip__title">Defense gun boost</strong>
              <span class="armory-info-chip__meta">2h • CD 6h</span>
              <span class="armory-info-chip__effect">+20 % produkce obranných zbraní • +10 heat • +5 heat/h</span>
            </article>
          </div>
        `;
        return li;
      };
      list.appendChild(createSection("Útočné systémy", "attack", attackRows));
      list.appendChild(createSection("Obranné systémy", "defense", defenseRows));
      list.appendChild(createBoostSection());
      return;
    }
    if (mechanicsType === "drug-lab") {
      const productRows = [
        ["Velvet Smoke", "10s • 2C / 1B", "Nejlevnější tabáková droga, tlak na vliv a cashflow"],
        ["Neon Dust", "18s • 3C / 1B", "Chemický prášek podobný speedu, rychlý street push"],
        ["Pulse Shot", "35s • 2C / 1B / 2S", "Top tržní produkt s vysokou hodnotou a tlakem na výkon"],
        ["Ghost Serum", "40s • 1C / 2B / 2S", "Taktická látka pro stealth a nižší raid pressure"],
        ["Overdrive X", "55s • 3C / 1B / 3S", "Agresivní výkonový stimulant s vysokým výnosem"]
      ];
      const boostRows = [
        ["Overclock výroby", "2h • CD 6h", "+50 % produkce všech slotů • +3 heat"],
        ["Čistá várka", "2h • CD 5h", "Nové dávky jsou enhanced • +20 % síla efektu"],
        ["Skrytý provoz", "2h • CD 6h", "Heat z výroby -30 % • produkce -20 %"]
      ];
      const createSection = (title, tone, rows) => {
        const li = document.createElement("li");
        li.className = `lab-info-block lab-info-block--${tone}`;
        li.innerHTML = `
          <div class="lab-info-block__head">
            <span class="lab-info-block__badge">${title}</span>
            <span class="lab-info-block__hint"></span>
          </div>
          <div class="lab-info-block__grid ${tone === "boost" ? "lab-info-block__grid--boosts" : ""}">
            ${rows.map(([name, meta, effect]) => `
              <article class="lab-info-chip lab-info-chip--${tone}">
                <strong class="lab-info-chip__title">${name}</strong>
                <span class="lab-info-chip__meta">${meta}</span>
                <span class="lab-info-chip__effect">${effect}</span>
              </article>
            `).join("")}
          </div>
        `;
        return li;
      };
      list.appendChild(createSection("Produkce", "product", productRows));
      list.appendChild(createSection("Lab boosty", "boost", boostRows));
      return;
    }
    if (mechanicsType === "pharmacy") {
      const supplyRows = [
        ["Chemicals", "12s / ks • max 20 ks", "Základní chemická surovina pro výrobu v Drug Labu"],
        ["Biomass", "18s / ks • max 30 ks", "Biologická složka pro street a lab recepty"],
        ["Stim Pack", "25s / ks • max 30 ks", "Pokročilý vstup pro silnější recepty a boost chemii"]
      ];
      const utilityRows = [
        ["Ghost Serum boost", "1× Ghost Serum", "Stealth / recon boost přes panel Boost"],
        ["Overdrive X boost", "1× Overdrive X", "Akční výkonový boost přes panel Boost"]
      ];
      const createSection = (title, tone, rows, hint = "") => {
        const li = document.createElement("li");
        li.className = `lab-info-block lab-info-block--${tone}`;
        li.innerHTML = `
          <div class="lab-info-block__head">
            <span class="lab-info-block__badge">${title}</span>
            <span class="lab-info-block__hint">${hint}</span>
          </div>
          <div class="lab-info-block__grid ${tone === "boost" ? "lab-info-block__grid--boosts" : ""}">
            ${rows.map(([name, meta, effect]) => `
              <article class="lab-info-chip lab-info-chip--${tone}">
                <strong class="lab-info-chip__title">${name}</strong>
                <span class="lab-info-chip__meta">${meta}</span>
                <span class="lab-info-chip__effect">${effect}</span>
              </article>
            `).join("")}
          </div>
        `;
        return li;
      };
      list.appendChild(createSection("Výroba surovin", "product", supplyRows));
      list.appendChild(createSection("Boost utility", "boost", utilityRows));
      return;
    }
    if (mechanicsType === "factory") {
      const materialRows = [
        ["Metal Parts", "10s / ks", "Základní materiál pro zbraně a obranu"],
        ["Tech Core", "18s / ks", "Pokročilá komponenta pro silnější kusy"],
        ["Combat Module", "15m / ks", "Boost materiál pro fight akce a factory protokoly"]
      ];
      const boostRows = [
        ["Assault Protocol", "2 CM", "+attack tlak a agresivní tempo"],
        ["Rapid Strike", "3 CM", "+attack/raid speed, větší průraz"],
        ["Breach Mode", "4 CM", "+destroy chance a breach pressure"]
      ];
      const createSection = (title, tone, rows, hint = "") => {
        const li = document.createElement("li");
        li.className = `lab-info-block lab-info-block--${tone}`;
        li.innerHTML = `
          <div class="lab-info-block__head">
            <span class="lab-info-block__badge">${title}</span>
            <span class="lab-info-block__hint">${hint}</span>
          </div>
          <div class="lab-info-block__grid ${tone === "boost" ? "lab-info-block__grid--boosts" : ""}">
            ${rows.map(([name, meta, effect]) => `
              <article class="lab-info-chip lab-info-chip--${tone}">
                <strong class="lab-info-chip__title">${name}</strong>
                <span class="lab-info-chip__meta">${meta}</span>
                <span class="lab-info-chip__effect">${effect}</span>
              </article>
            `).join("")}
          </div>
        `;
        return li;
      };
      list.appendChild(createSection("Produkce", "product", materialRows));
      list.appendChild(createSection("Combat boosty", "boost", boostRows));
      return;
    }
    const actions = resolveBuildingInfoActions(details);
    actions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function openBuildingDetailModal(buildingName, district) {
    const root = document.getElementById("building-detail-modal");
    if (!root) return;
    const isMobileViewport = typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 720px)").matches;
    if (isMobileViewport) {
      document.getElementById("buildings-modal")?.classList.add("hidden");
      document.getElementById("district-modal")?.classList.add("hidden");
      document.getElementById("modal-buildings")?.classList.add("hidden");
    }

    const context = resolveBuildingDetailContext(buildingName);
    let details;
    try {
      details = resolveBuildingDetails(context, district);
    } catch (error) {
      console.error("Building detail open failed", {
        buildingName,
        context,
        district,
        error
      });
      details = {
        baseName: context.baseName,
        displayName: context.variantName || context.baseName,
        hourlyIncome: 0,
        dailyIncome: 0,
        info: "Detail budovy se nepodařilo načíst. Zkus to znovu.",
        mechanics: null,
        specialActions: []
      };
    }
    details = applyConfiguredBuildingCashFallback(details, context);
    const mechanics = details?.mechanics || null;
    const mechanicsType = String(details?.mechanics?.type || "").trim();
    if (mechanicsType) {
      root.dataset.buildingMechanicsType = mechanicsType;
    } else {
      delete root.dataset.buildingMechanicsType;
    }
    const title = document.getElementById("building-detail-title");
    const name = document.getElementById("building-detail-name");
    const hourly = document.getElementById("building-detail-hourly");
    const daily = document.getElementById("building-detail-daily");
    const cleanHourly = document.getElementById("building-detail-clean-hourly");
    const cleanDaily = document.getElementById("building-detail-clean-daily");
    const dirtyHourly = document.getElementById("building-detail-dirty-hourly");
    const dirtyDaily = document.getElementById("building-detail-dirty-daily");
    const info = document.getElementById("building-detail-info-text");
    const infoHeading = document.getElementById("building-info-heading");
    const infoSubtitle = document.getElementById("building-info-subtitle");
    const infoHourly = document.getElementById("building-info-hourly");
    const infoDaily = document.getElementById("building-info-daily");
    const infoCleanHourly = document.getElementById("building-info-clean-hourly");
    const infoCleanDaily = document.getElementById("building-info-clean-daily");
    const infoDirtyHourly = document.getElementById("building-info-dirty-hourly");
    const infoDirtyDaily = document.getElementById("building-info-dirty-daily");
    const infoEffects = document.getElementById("building-info-effects");
    const closeButton = document.getElementById("building-detail-modal-close");
    const panelStats = document.getElementById("building-detail-panel-stats");
    const panelInfo = document.getElementById("building-detail-panel-info");
    const tabButtons = Array.from(root.querySelectorAll("[data-building-tab]"));
    const hourlyRow = hourly?.closest(".modal__row") || null;
    const dailyRow = daily?.closest(".modal__row") || null;
    const cleanHourlyRow = cleanHourly?.closest(".modal__row") || null;
    const cleanDailyRow = cleanDaily?.closest(".modal__row") || null;
    const dirtyHourlyRow = dirtyHourly?.closest(".modal__row") || null;
    const dirtyDailyRow = dirtyDaily?.closest(".modal__row") || null;
    const infoHourlyRow = infoHourly?.closest(".building-info-card__stat") || null;
    const infoDailyRow = infoDaily?.closest(".building-info-card__stat") || null;
    const infoCleanHourlyRow = infoCleanHourly?.closest(".building-info-card__stat") || null;
    const infoCleanDailyRow = infoCleanDaily?.closest(".building-info-card__stat") || null;
    const infoDirtyHourlyRow = infoDirtyHourly?.closest(".building-info-card__stat") || null;
    const infoDirtyDailyRow = infoDirtyDaily?.closest(".building-info-card__stat") || null;
    const infoCard = panelInfo?.querySelector(".building-info-card") || null;
    const infoHead = infoHeading?.closest(".building-info-card__head") || null;
    const infoStatsSection = panelInfo?.querySelector(".building-info-card__stats") || null;
    const infoEffectsSection = infoEffects?.closest(".building-info-card__section") || null;

    let activeContext = context;
    let activeDistrict = district || null;
    const primaryContext = details?.mechanics?.primaryContext;
    if (primaryContext && typeof primaryContext === "object") {
      activeContext = primaryContext;
    }
    const primaryDistrictId = details?.mechanics?.primaryDistrictId;
    if (primaryDistrictId != null) {
      activeDistrict = resolveDistrictRecord(primaryDistrictId) || activeDistrict;
    } else if (primaryContext?.districtId != null) {
      activeDistrict = resolveDistrictRecord(primaryContext.districtId) || activeDistrict;
    }
    state.activeBuildingDetail = { context: activeContext, district: activeDistrict };

    if (title) {
      title.textContent = details.baseName;
      let slotBadgeText = "";
      if (mechanicsType === "pharmacy" || mechanicsType === "factory") {
        slotBadgeText =
          `Aktivní sloty ${Math.max(0, Math.floor(Number(mechanics.activeSlots || 0)))}/`
          + `${Math.max(1, Math.floor(Number((mechanics.slots || []).length || 0)))}`;
      } else if (mechanicsType === "drug-lab") {
        slotBadgeText =
          `Aktivní sloty ${Math.max(0, Math.floor(Number(mechanics.activeSlots || 0)))}/`
          + `${Math.max(1, Math.floor(Number(mechanics.unlockedSlots || 0)))}`;
      } else if (mechanicsType === "armory") {
        slotBadgeText =
          `Aktivní sloty ${Math.max(0, Math.floor(Number(mechanics.activeAttackSlots || 0))) + Math.max(0, Math.floor(Number(mechanics.activeDefenseSlots || 0)))}/`
          + `${Math.max(1, Math.floor(Number((mechanics.attackSlots || []).length || 0))) + Math.max(1, Math.floor(Number((mechanics.defenseSlots || []).length || 0)))}`;
      }
      if (slotBadgeText) {
        const badge = document.createElement("span");
        badge.className = "building-detail-title__badge";
        const compactSlotBadgeText = slotBadgeText.replace(/^Aktivní sloty/i, "AS");
        badge.innerHTML = `
          <span class="building-detail-title__badge-text building-detail-title__badge-text--full">${slotBadgeText}</span>
          <span class="building-detail-title__badge-text building-detail-title__badge-text--compact">${compactSlotBadgeText}</span>
        `;
        title.appendChild(badge);
      }
      const supportsTopTitleActions =
        mechanicsType === "armory"
        || mechanicsType === "pharmacy"
        || mechanicsType === "drug-lab"
        || mechanicsType === "factory";
      if (supportsTopTitleActions) {
        const canCollect = Math.max(0, Number(mechanics.storedTotal || 0)) > 0;
        const canUpgrade = Boolean(mechanics.nextLevel && Number(mechanics.nextUpgradeCost || 0) > 0);
        const collectVerb =
          mechanicsType === "armory" ? "zbraně"
          : mechanicsType === "pharmacy" ? "suroviny"
          : mechanicsType === "factory" ? "materiály"
          : "drogy";

        const collectPlusBtn = document.createElement("button");
        collectPlusBtn.type = "button";
        collectPlusBtn.className = "building-detail-title__action-btn building-detail-title__action-btn--collect";
        collectPlusBtn.dataset.buildingTitleAction = "collect";
        collectPlusBtn.textContent = "+";
        collectPlusBtn.disabled = !canCollect;
        collectPlusBtn.title = canCollect
          ? `Vybrat ${collectVerb} do inventáře`
          : `${details.baseName} nemá co vybrat.`;
        title.appendChild(collectPlusBtn);

        const upgradeBtn = document.createElement("button");
        upgradeBtn.type = "button";
        upgradeBtn.className = "building-detail-title__action-btn building-detail-title__action-btn--upgrade";
        upgradeBtn.dataset.buildingTitleAction = "upgrade";
        upgradeBtn.textContent = "↑";
        upgradeBtn.disabled = !canUpgrade;
        upgradeBtn.title = canUpgrade
          ? `Upgrade na L${Math.max(0, Math.floor(Number(mechanics.nextLevel || 0)))} za $${Math.max(0, Math.floor(Number(mechanics.nextUpgradeCost || 0)))}`
          : "Budova je na maximálním levelu.";
        title.appendChild(upgradeBtn);
      }
    }
    if (closeButton) {
      const headerLevelId = "building-detail-header-level";
      let levelBadge = document.getElementById(headerLevelId);
      if (!levelBadge) {
        levelBadge = document.createElement("span");
        levelBadge.id = headerLevelId;
        levelBadge.className = "building-detail-header-level";
        closeButton.parentElement?.insertBefore(levelBadge, closeButton);
      }
      const showHeaderLevel =
        mechanicsType === "pharmacy"
        || mechanicsType === "drug-lab"
        || mechanicsType === "factory"
        || mechanicsType === "armory";
      if (showHeaderLevel) {
        levelBadge.textContent = `L${Math.max(1, Math.floor(Number(mechanics?.level || 1)))}`;
        levelBadge.classList.remove("hidden");
      } else {
        levelBadge.classList.add("hidden");
      }
    }
    if (name) name.textContent = details.displayName;
    const hourlyLabel = formatBuildingIncomeLabel(details);
    const dailyLabel = `$${formatDecimalValue(details.dailyIncome, 2)} / den`;
    const cashBreakdown = resolveBuildingCashBreakdown(details);
    const cleanHourlyValue = cashBreakdown.hourlyCleanIncome || 0;
    const dirtyHourlyValue = cashBreakdown.hourlyDirtyIncome || 0;
    const totalHourlyValue = Math.max(0, Number(details?.hourlyIncome || 0));
    const hasCashBreakdown = cleanHourlyValue > 0 || dirtyHourlyValue > 0;
    const showBaseIncomeRows = totalHourlyValue > 0;
    if (hourlyRow) hourlyRow.classList.toggle("hidden", !showBaseIncomeRows);
    if (dailyRow) dailyRow.classList.toggle("hidden", !showBaseIncomeRows);
    if (infoHourlyRow) infoHourlyRow.classList.toggle("hidden", !showBaseIncomeRows);
    if (infoDailyRow) infoDailyRow.classList.toggle("hidden", !showBaseIncomeRows);
    if (cleanHourlyRow) cleanHourlyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (cleanDailyRow) cleanDailyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (dirtyHourlyRow) dirtyHourlyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (dirtyDailyRow) dirtyDailyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (infoCleanHourlyRow) infoCleanHourlyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (infoCleanDailyRow) infoCleanDailyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (infoDirtyHourlyRow) infoDirtyHourlyRow.classList.toggle("hidden", !hasCashBreakdown);
    if (infoDirtyDailyRow) infoDirtyDailyRow.classList.toggle("hidden", !hasCashBreakdown);
    const cleanHourlyLabel = `$${formatDecimalValue(cleanHourlyValue, 2)} / hod`;
    const cleanDailyLabel = formatBuildingDailyLabel(cleanHourlyValue);
    const dirtyHourlyLabel = `$${formatDecimalValue(dirtyHourlyValue, 2)} / hod`;
    const dirtyDailyLabel = formatBuildingDailyLabel(dirtyHourlyValue);
    if (hourly) hourly.textContent = hourlyLabel;
    if (daily) daily.textContent = dailyLabel;
    if (cleanHourly) cleanHourly.textContent = cleanHourlyLabel;
    if (cleanDaily) cleanDaily.textContent = cleanDailyLabel;
    if (dirtyHourly) dirtyHourly.textContent = dirtyHourlyLabel;
    if (dirtyDaily) dirtyDaily.textContent = dirtyDailyLabel;
    if (info) info.textContent = details.info;
    if (infoHourly) infoHourly.textContent = hourlyLabel;
    if (infoDaily) infoDaily.textContent = dailyLabel;
    if (infoCleanHourly) infoCleanHourly.textContent = cleanHourlyLabel;
    if (infoCleanDaily) infoCleanDaily.textContent = cleanDailyLabel;
    if (infoDirtyHourly) infoDirtyHourly.textContent = dirtyHourlyLabel;
    if (infoDirtyDaily) infoDirtyDaily.textContent = dirtyDailyLabel;
    if (infoEffects) infoEffects.textContent = details?.mechanics?.effectsLabel || "Žádné aktivní mechaniky.";
    renderBuildingInfoActions(details);
    const compactTechInfo =
      mechanicsType === "armory"
      || mechanicsType === "drug-lab"
      || mechanicsType === "pharmacy"
      || mechanicsType === "factory";
    if (infoCard) {
      infoCard.classList.toggle("building-info-card--compact-tech", compactTechInfo);
      infoCard.classList.toggle("building-info-card--compact-armory", mechanicsType === "armory");
      infoCard.classList.toggle("building-info-card--compact-drug-lab", mechanicsType === "drug-lab");
      infoCard.classList.toggle("building-info-card--compact-factory", mechanicsType === "factory");
    }
    if (infoHead) infoHead.classList.toggle("hidden", compactTechInfo);
    if (infoStatsSection) infoStatsSection.classList.toggle("hidden", compactTechInfo);
    if (infoEffectsSection) infoEffectsSection.classList.toggle("hidden", compactTechInfo);
    if (infoHeading) infoHeading.textContent = `Taktický profil: ${details.displayName}`;
    if (infoSubtitle) {
      let subtitle = "Přehled role budovy v districtu a ekonomice gangu.";
      if (mechanicsType === "apartment-block") {
        subtitle = "Personální budova zaměřená na růst členů, kapacitu a stabilní cashflow.";
      } else if (mechanicsType === "school") {
        subtitle = "Náborová a podpůrná budova, která zesiluje districtové mechaniky.";
      } else if (mechanicsType === "fitness-club") {
        subtitle = "Ekonomicko-bojová podpora: krátkodobé income boosty a tréninkový buff pro tvoje districty.";
      } else if (mechanicsType === "casino") {
        subtitle = "Finanční motor pro čisté i špinavé cashflow s VIP boostem a praním peněz.";
      } else if (mechanicsType === "arcade") {
        subtitle = "Hybrid clean/dirty budova s automatovými akcemi a napojením na drogový byznys.";
      } else if (mechanicsType === "auto-salon") {
        subtitle = "Logisticko-ekonomická budova s čistým i dirty income a bonusy pro mobilitu.";
      } else if (mechanicsType === "exchange") {
        subtitle = "Finanční uzel pro konverzi dirty cash, district boost příjmů a postupné zvyšování vlivu.";
      } else if (mechanicsType === "restaurant") {
        subtitle = "Nízkoprofilová ekonomická budova s vlivovým růstem a zpravodajskými drby z districtů.";
      } else if (mechanicsType === "convenience-store") {
        subtitle = "Nízko-heat lokální cashflow bod s hybridním příjmem, vlivem a district intel drby.";
      } else if (mechanicsType === "armory") {
        subtitle = "Výrobní zbrojní uzel pro útok i obranu districtů: recepty, časování a zásobování z Továrny.";
      } else if (mechanicsType === "factory") {
        subtitle = "Produkční jádro pro výrobu zbraňových materiálů a Combat Module.";
      } else if (mechanicsType === "pharmacy") {
        subtitle = "Support budova pro výrobu surovin a taktických boostů akcí napříč gangem.";
      } else if (mechanicsType === "drug-lab") {
        subtitle = "Produkční laboratoř pro drogy: sloty, heat risk management, buffy a skladová logistika.";
      }
      infoSubtitle.textContent = subtitle;
    }
    const preserveInfoTab = !root.classList.contains("hidden") && state.activeBuildingDetailTab === "info";
    const activeTab = preserveInfoTab ? "info" : "stats";
    if (!preserveInfoTab) {
      state.activeBuildingDetailTab = "stats";
    }
    if (panelStats) panelStats.classList.toggle("hidden", activeTab === "info");
    if (panelInfo) panelInfo.classList.toggle("hidden", activeTab !== "info");
    root.classList.toggle("is-info-tab", activeTab === "info");
    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.buildingTab === activeTab);
    });
    updateBuildingMechanicsPanel(details);
    setBuildingDetailActionButtons(details);

    root.classList.remove("hidden");
    updateArmoryMaterialsStickyCompactState();
  }

  function showBuildingDetail(buildingName, district) {
    openBuildingDetailModal(buildingName, district || null);
  }

  function resolveBuildingCashBreakdown(details) {
    const directCleanRaw = details?.hourlyCleanIncome;
    const directDirtyRaw = details?.hourlyDirtyIncome;
    const mechanicsCleanRaw = details?.mechanics?.hourlyCleanIncome;
    const mechanicsDirtyRaw = details?.mechanics?.hourlyDirtyIncome;
    const directClean = directCleanRaw == null ? null : Number(directCleanRaw);
    const directDirty = directDirtyRaw == null ? null : Number(directDirtyRaw);
    const mechanicsClean = mechanicsCleanRaw == null ? null : Number(mechanicsCleanRaw);
    const mechanicsDirty = mechanicsDirtyRaw == null ? null : Number(mechanicsDirtyRaw);
    const hourlyCleanIncome = Number.isFinite(directClean)
      ? Math.max(0, directClean)
      : Number.isFinite(mechanicsClean)
        ? Math.max(0, mechanicsClean)
        : null;
    const hourlyDirtyIncome = Number.isFinite(directDirty)
      ? Math.max(0, directDirty)
      : Number.isFinite(mechanicsDirty)
        ? Math.max(0, mechanicsDirty)
        : null;
    return { hourlyCleanIncome, hourlyDirtyIncome };
  }

  function resolveConfiguredBuildingCashProfile(buildingInput) {
    const context = resolveBuildingDetailContext(buildingInput);
    return CONFIGURED_BUILDING_CASH_RATES[context.baseName] || null;
  }

  function applyConfiguredBuildingCashFallback(details, buildingInput) {
    const configuredRates = resolveConfiguredBuildingCashProfile(buildingInput);
    if (!configuredRates) return details;
    const currentHourlyIncome = Number(details?.hourlyIncome);
    const currentDailyIncome = Number(details?.dailyIncome);
    const currentBreakdown = resolveBuildingCashBreakdown(details);
    const configuredHourlyIncome =
      Math.max(0, Number(configuredRates.hourlyCleanIncome || 0))
      + Math.max(0, Number(configuredRates.hourlyDirtyIncome || 0));
    const shouldPatchHourly = !Number.isFinite(currentHourlyIncome) || currentHourlyIncome <= 0;
    const shouldPatchDaily = !Number.isFinite(currentDailyIncome) || currentDailyIncome <= 0;
    const shouldPatchClean =
      !Number.isFinite(Number(currentBreakdown.hourlyCleanIncome))
      || Number(currentBreakdown.hourlyCleanIncome) <= 0;
    const shouldPatchDirty =
      !Number.isFinite(Number(currentBreakdown.hourlyDirtyIncome))
      || Number(currentBreakdown.hourlyDirtyIncome) <= 0;
    if (!shouldPatchHourly && !shouldPatchDaily && !shouldPatchClean && !shouldPatchDirty) {
      return details;
    }
    return {
      ...details,
      hourlyIncome: shouldPatchHourly ? configuredHourlyIncome : currentHourlyIncome,
      dailyIncome: shouldPatchDaily ? configuredHourlyIncome * 24 : currentDailyIncome,
      hourlyCleanIncome: shouldPatchClean
        ? Math.max(0, Number(configuredRates.hourlyCleanIncome || 0))
        : Number(currentBreakdown.hourlyCleanIncome || 0),
      hourlyDirtyIncome: shouldPatchDirty
        ? Math.max(0, Number(configuredRates.hourlyDirtyIncome || 0))
        : Number(currentBreakdown.hourlyDirtyIncome || 0)
    };
  }

  function resolveBuildingHourlyValue(value) {
    const safe = Number(value);
    return Number.isFinite(safe) ? Math.max(0, safe) : 0;
  }

  function formatBuildingDailyLabel(hourlyValue) {
    return `$${formatDecimalValue(resolveBuildingHourlyValue(hourlyValue) * 24, 2)} / den`;
  }

  function formatBuildingIncomeLabel(details) {
    const hourlyLabel = `$${formatDecimalValue(details?.hourlyIncome || 0, 2)} / hod`;
    const { hourlyCleanIncome, hourlyDirtyIncome } = resolveBuildingCashBreakdown(details);
    const cleanValue = Number(hourlyCleanIncome || 0);
    const dirtyValue = Number(hourlyDirtyIncome || 0);
    if ((hourlyCleanIncome == null && hourlyDirtyIncome == null) || (cleanValue <= 0 && dirtyValue <= 0)) {
      return hourlyLabel;
    }
    return `${hourlyLabel} • C ${formatDecimalValue(cleanValue / 60, 2)}/min • D ${formatDecimalValue(dirtyValue / 60, 2)}/min`;
  }

  function resolveSimpleCashBuildingDetails(context, district, fallback, cashProfile) {
    const now = Date.now();
    const key = resolveBuildingInstanceKey(context, district);
    const snapshot = getSimpleCashBuildingStateByKey(key, now);
    const syncResult = syncSimpleCashBuildingIncome(snapshot, cashProfile, now, district || context?.districtId);
    persistSimpleCashBuildingState(key, snapshot);
    const hourlyCleanIncome = Number(syncResult?.rates?.hourlyCleanIncome || cashProfile?.hourlyCleanIncome || 0);
    const hourlyDirtyIncome = Number(syncResult?.rates?.hourlyDirtyIncome || cashProfile?.hourlyDirtyIncome || 0);
    const hourlyIncome = hourlyCleanIncome + hourlyDirtyIncome;
    return {
      ...fallback,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome: hourlyIncome * 24
    };
  }

  function resolveBuildingDetails(buildingName, district) {
    const context = resolveBuildingDetailContext(buildingName);
    const safeName = context.baseName;
    const displayName = context.variantName || safeName;
    const districtSeed = district?.id || 0;
    const seed = hashOwner(`${districtSeed}:${safeName}:${context.variantName || ""}`);
    const mallProfiles = {
      "Neon Mall": {
        hourlyIncome: 612,
        info:
          "Neon Mall je high-volume retail uzel. Rychle točí hotovost a zvyšuje tempo příjmů v komerční zóně."
      },
      "Iron Market Plaza": {
        hourlyIncome: 576,
        info:
          "Iron Market Plaza je těžký tržní hub. Má stabilní výnos a bonus pro obchodní operace v širším okolí."
      },
      "Karina shopping center": {
        hourlyIncome: 648,
        info:
          "Karina shopping center je prémiové obchodní centrum s nejvyšším obratem. Je silné na dlouhodobý ekonomický tlak."
      }
    };
    const restaurantProfiles = {
      "Neon Bite": {
        hourlyIncome: 286,
        info: "Rychlá neonová kuchyně. Zvyšuje noční cashflow a pomáhá držet tlak na soupeře."
      },
      "Black Plate": {
        hourlyIncome: 278,
        info: "High-risk gastro front. Vhodné pro tiché praní menších částek při stabilní kontrole."
      },
      "Street Fuel": {
        hourlyIncome: 264,
        info: "Jídlo pro pouliční týmy. Posiluje operativu v okolních sektorech během konfliktu."
      },
      "Blood & Grill": {
        hourlyIncome: 298,
        info: "Agresivní grill point. Přináší vyšší příjem, ale přitahuje větší pozornost."
      },
      "Midnight Diner": {
        hourlyIncome: 272,
        info: "Noční diner s dlouhou provozní dobou. Stabilní income i mimo hlavní špičku."
      },
      "Iron Taste": {
        hourlyIncome: 266,
        info: "Tvrdý industriální styl. Dobře funguje v zónách s častým pohybem posil."
      },
      "Shadow Kitchen": {
        hourlyIncome: 281,
        info: "Skrytá kuchyně pro interní síť. Vhodná pro nenápadný růst vlivu."
      },
      "Dirty Spoon": {
        hourlyIncome: 252,
        info: "Levná frontová kuchyně. Nižší výnos, ale rychlá a spolehlivá rotace peněz."
      },
      "Vice Kitchen": {
        hourlyIncome: 294,
        info: "Silně napojená na noční trh. Zvyšuje obrat v rizikových časech."
      },
      "Urban Hunger": {
        hourlyIncome: 260,
        info: "Městský fast servis. Udržuje stabilní tok zákazníků celý den."
      },
      "Smoke & Meat": {
        hourlyIncome: 288,
        info: "Prémiový smokehouse. Vyšší marže a lepší efekt při dlouhodobém držení sektoru."
      },
      "The Last Bite": {
        hourlyIncome: 257,
        info: "Pozdní provoz pro poslední vlnu klientů. Dobré doplnění ekonomiky distriktu."
      },
      "Gangster Grill": {
        hourlyIncome: 301,
        info: "Silný brand pod kontrolou gangu. Roste rychleji, když je zóna bezpečná."
      },
      "Concrete Kitchen": {
        hourlyIncome: 269,
        info: "Betonový core point. Stabilní příjmy s nízkou volatilitou."
      },
      "Dark Appetite": {
        hourlyIncome: 284,
        info: "Noir restaurace pro VIP kontakty. Pomáhá budovat vliv mezi klíčovými lidmi."
      },
      "Night Feast": {
        hourlyIncome: 276,
        info: "Noční hostiny a eventy. Krátké špičky s výraznějším výdělkem."
      },
      "The Hungry Syndicate": {
        hourlyIncome: 305,
        info: "Syndikátní jídelní uzel. Výborný výkon při propojení více commercial sektorů."
      },
      "Rusty Fork": {
        hourlyIncome: 249,
        info: "Starší podnik s loajální klientelou. Pomalejší, ale velmi stabilní cashflow."
      },
      "Back Alley Bistro": {
        hourlyIncome: 262,
        info: "Bistro v zadních uličkách. Výhodné pro skrytý provoz bez velké publicity."
      },
      "Sinful Kitchen": {
        hourlyIncome: 292,
        info: "Rizikový nightlife spot. Umí tahat vyšší příjmy za cenu většího napětí."
      },
      "Underground Taste": {
        hourlyIncome: 274,
        info: "Podzemní kulinářská síť. Podporuje ekonomiku v konfliktních oblastech."
      },
      "Savage Kitchen": {
        hourlyIncome: 297,
        info: "Tvrdý street koncept. Silný výnos během agresivní expanze."
      },
      "Chrome Diner": {
        hourlyIncome: 267,
        info: "Chromový diner nové generace. Konzistentní příjem s dobrým poměrem rizika."
      },
      "Heat Kitchen": {
        hourlyIncome: 289,
        info: "Horká kuchyně s rychlým obratem. Funguje nejlépe při aktivním trhu."
      },
      "No Mercy Meals": {
        hourlyIncome: 303,
        info: "Bezkompromisní provozní model. Vysoký potenciál výdělku pro ofenzivní hru."
      },
      "Broken Plate": {
        hourlyIncome: 255,
        info: "Low-profile spot. Menší výnos, ale výborná odolnost při výkyvech."
      },
      "Elite Hunger": {
        hourlyIncome: 312,
        info: "Elitní koncept pro horní vrstvu města. Nejvyšší restauranční obrat v síti."
      }
    };
    const activeSpecialProfile =
      context.variantName && safeName === "Obchodní centrum"
        ? mallProfiles[context.variantName] || null
        : context.variantName && safeName === "Restaurace"
          ? restaurantProfiles[context.variantName] || null
          : null;
    const simpleCashProfile = SIMPLE_BUILDING_CASH_RATES[safeName] || null;
    const hourlyCleanIncome = simpleCashProfile
      ? simpleCashProfile.hourlyCleanIncome
      : activeSpecialProfile?.hourlyIncome || 0;
    const hourlyDirtyIncome = simpleCashProfile
      ? simpleCashProfile.hourlyDirtyIncome
      : activeSpecialProfile?.hourlyDirtyIncome || 0;
    const hourlyIncome = simpleCashProfile
      ? hourlyCleanIncome + hourlyDirtyIncome
      : activeSpecialProfile
        ? activeSpecialProfile.hourlyIncome
        : 60 + (seed % 31) * 12;
    const dailyIncome = hourlyIncome * 24;
    const infoSamples = [
      "Tahle budova drží lokální cashflow a pomáhá stabilizovat kontrolu sektoru při dlouhých konfliktech.",
      "Budova funguje jako logistický uzel. Je vhodná pro podporu útoku i obrany podle aktuální situace.",
      "Poskytuje operativní zázemí pro lidi v terénu, takže zvyšuje efektivitu gangových aktivit v okolí.",
      "Je to strategický bod pro ekonomiku distriktu. V pozdější fázi hry může výrazně zvednout výnosy.",
      "Budova je vhodná pro tichý růst vlivu. Největší přínos má při držení sektoru delší dobu."
    ];
    const info = activeSpecialProfile?.info || infoSamples[seed % infoSamples.length];
    const fallbackDetails = {
      baseName: safeName,
      displayName,
      hourlyCleanIncome,
      hourlyDirtyIncome,
      hourlyIncome,
      dailyIncome,
      info,
      specialActions: []
    };
    if (simpleCashProfile) {
      return resolveSimpleCashBuildingDetails(context, district, fallbackDetails, simpleCashProfile);
    }
    if (safeName === APARTMENT_BLOCK_NAME) {
      return resolveApartmentBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === SCHOOL_BUILDING_NAME) {
      return resolveSchoolBuildingDetails(context, district, fallbackDetails);
    }
    if (isFitnessClubBaseName(safeName)) {
      return resolveFitnessBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === CASINO_BUILDING_NAME || isCasinoBaseName(safeName)) {
      return resolveCasinoBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === ARCADE_BUILDING_NAME || isArcadeBaseName(safeName)) {
      return resolveArcadeBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === AUTO_SALON_BUILDING_NAME || isAutoSalonBaseName(safeName)) {
      return resolveAutoSalonBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === EXCHANGE_BUILDING_NAME || isExchangeBaseName(safeName)) {
      return resolveExchangeBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === RESTAURANT_BUILDING_NAME || isRestaurantBaseName(safeName)) {
      return resolveRestaurantBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === CONVENIENCE_STORE_BUILDING_NAME || isConvenienceStoreBaseName(safeName)) {
      return resolveConvenienceStoreBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === ARMORY_BUILDING_NAME || isArmoryBaseName(safeName)) {
      return resolveArmoryBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === FACTORY_BUILDING_NAME || isFactoryBaseName(safeName)) {
      return resolveFactoryBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === PHARMACY_BUILDING_NAME || isPharmacyBaseName(safeName)) {
      return resolvePharmacyBuildingDetails(context, district, fallbackDetails);
    }
    if (safeName === DRUG_LAB_BUILDING_NAME || isDrugLabBaseName(safeName)) {
      return resolveDrugLabBuildingDetails(context, district, fallbackDetails);
    }
    return fallbackDetails;
  }

  function showModal(district) {
    if (!state.modal?.root) return;
    const districtKey = normalizeDistrictId(district?.id);
    const activePoliceAction = districtKey ? state.policeDistrictActions.get(districtKey) : null;
    if (activePoliceAction && Number(activePoliceAction.expiresAt || 0) > Date.now()) {
      window.Empire.UI?.openDistrictPoliceRaidWarningModal?.(district, activePoliceAction);
      return;
    }
    const defendableByPlayer = isDistrictDefendable(district);
    const isDowntown = district.type === "downtown";
    const districtNumber = resolveDistrictNumberLabel(district);
    const isEnemyDistrict = isEnemyOwnedDistrictForModal(district);
    const revealEnemyIntelInFog = state.vision.fogPreviewMode
      && state.vision.allowEnemyModalIntelInFog
      && isEnemyDistrict;
    const revealDistrictDetails = !state.vision.fogPreviewMode || defendableByPlayer || revealEnemyIntelInFog;
    const spyIntel = window.Empire.UI?.getDistrictSpyIntel?.(district?.id) || null;
    const hasSpyIntel = Boolean(spyIntel);
    applyDistrictModalAccent(district);
    updateModalActionsForDistrict(district);
    updateDistrictRaidLockRow(district);

    if (isDistrictDestroyed(district)) {
      document.getElementById("modal-name").textContent = district.name || "Distrikt";
      document.getElementById("modal-name-income").textContent = "0 / nepoužitelný";
      document.getElementById("modal-owner").textContent = "Nikdo";
      updateDistrictDefenseSummary(null, { spyIntel });
      updateDistrictBuildings(null, { spyIntel });
      updateDistrictGossip(district);
      updateDistrictOwnerProfile(district, { visible: false, spyIntel });
      state.modal.root.classList.remove("hidden");
      startDistrictModalRefreshTicker();
      return;
    }

    if (revealDistrictDetails) {
      document.getElementById("modal-name").textContent = district.name || "Distrikt";
      document.getElementById("modal-name-income").textContent = isEnemyDistrict ? "Skryto" : `$${district.income || 0}/hod`;
      document.getElementById("modal-owner").textContent = district.owner || "Neobsazeno";
      updateDistrictBuildings(defendableByPlayer ? district : null, { spyIntel });
      updateDistrictGossip(district);
    } else {
      document.getElementById("modal-name").textContent = isDowntown
        ? `Downtown sektor #${districtNumber}`
        : `District č. ${districtNumber}`;
      document.getElementById("modal-name-income").textContent = "Skryto";
      document.getElementById("modal-owner").textContent = "Skryto";
      updateDistrictDefenseSummary(null, { spyIntel });
      updateDistrictBuildings(null, { spyIntel });
      updateDistrictGossip(district);
    }

    if (revealDistrictDetails) {
      updateDistrictDefenseSummary(district, {
        knownSelf: defendableByPlayer,
        knownAlly: defendableByPlayer,
        spyIntel
      });
    } else if (hasSpyIntel) {
      updateDistrictDefenseSummary(null, { spyIntel });
    }

    updateDistrictOwnerProfile(district, {
      visible: revealDistrictDetails,
      isEnemy: isEnemyDistrict,
      spyIntel
    });
    state.modal.root.classList.remove("hidden");
    startDistrictModalRefreshTicker();
    document.dispatchEvent(new CustomEvent("empire:district-modal-opened", {
      detail: {
        districtId: district?.id ?? null,
        district,
        revealDistrictDetails,
        spyIntel
      }
    }));
  }

  function isEnemyOwnedDistrictForModal(district) {
    if (!district?.owner) return false;
    if (isDistrictOwnedByPlayer(district)) return false;
    if (isDistrictOwnedByAlly(district)) return false;
    return true;
  }

  function resolveDistrictOwnerAvatar(district) {
    const explicitAvatar = String(district?.ownerAvatar || "").trim();
    if (explicitAvatar) return explicitAvatar;
    if (!districtOwnerAvatarPool.length) return "";
    const seedSource = String(district?.ownerPlayerId || district?.ownerNick || district?.owner || "")
      .trim()
      .toLowerCase();
    if (!seedSource) return districtOwnerAvatarPool[0];
    const avatarIndex = hashOwner(seedSource) % districtOwnerAvatarPool.length;
    return districtOwnerAvatarPool[avatarIndex];
  }

  function resolveDistrictAtmosphereImage(district, isEnemy = false) {
    if (isEnemy) return "";
    const type = String(district?.type || "").trim().toLowerCase();
    const imageSets = {
      park: parkImages,
      downtown: downtownImages,
      commercial: commercialImages,
      residential: residentialImages,
      industrial: industrialImages
    };
    const set = imageSets[type];
    if (!Array.isArray(set) || !set.length) return "";
    const overrideKey = `${type}:${district?.id}`;
    const overrideImages = districtImageOverrides[overrideKey];
    if (Array.isArray(overrideImages) && overrideImages.length) {
      return overrideImages[0] || "";
    }
    const seedSource = typeof district?.id === "number"
      ? district.id
      : String(district?.id || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return set[seedSource % set.length] || "";
  }

  function resolveDistrictFactionLabel(district, isEnemy = false) {
    if (isEnemy) return "Neznámá";
    const explicit = String(
      district?.ownerStructure ||
      district?.ownerFaction ||
      district?.owner_structure ||
      district?.owner_faction ||
      ""
    ).trim();
    return explicit || "Neznámá";
  }

  function deriveAllianceNameFromOwnerLabel(ownerLabel) {
    const raw = String(ownerLabel || "").trim();
    if (!raw) return "";
    const withoutIndex = raw.replace(/\s+\d+$/u, "").trim();
    const allyMatch = withoutIndex.match(/^(.*?)\s*-\s*spojenec(?:\s+[A-Z])?$/iu);
    if (allyMatch?.[1]) return String(allyMatch[1]).trim();
    if (withoutIndex && withoutIndex !== raw) return withoutIndex;
    return "";
  }

  function updateDistrictOwnerProfile(district, options = {}) {
    const visible = typeof options === "object" ? Boolean(options.visible) : Boolean(options);
    const isEnemy = typeof options === "object" ? Boolean(options.isEnemy) : false;
    const spyIntel = typeof options === "object" ? options.spyIntel || null : null;
    const content = state.modal?.root?.querySelector(".modal__content");
    const ownerValue = document.getElementById("modal-owner");
    const ownerRow = ownerValue?.closest(".modal__row") || null;
    const ownerLabel = ownerRow?.querySelector("span") || null;
    const allianceRow = document.getElementById("modal-owner-alliance-row");
    const allianceValue = document.getElementById("modal-owner-alliance");
    const allianceLabel = allianceRow?.querySelector("span") || null;
    const factionRow = document.getElementById("modal-owner-faction-row");
    const factionValue = document.getElementById("modal-owner-faction");
    const factionLabelNode = factionRow?.querySelector("span") || null;
    const atmosphereRow = document.getElementById("modal-owner-atmosphere-row");
    const atmosphereValue = document.getElementById("modal-owner-atmosphere");
    const atmosphereImage = document.getElementById("modal-owner-atmosphere-image");
    if (!content || !ownerValue || !allianceRow || !allianceValue || !factionRow || !factionValue || !atmosphereRow || !atmosphereValue || !atmosphereImage) return;

    content.classList.toggle("district-modal--spy-intel-compact", !visible && Boolean(spyIntel));
    if (ownerLabel) ownerLabel.textContent = "Vlastník";
    if (allianceLabel) allianceLabel.textContent = "Aliance";
    if (factionLabelNode) factionLabelNode.textContent = "Frakce";

    if (!visible && !spyIntel) {
      allianceRow.classList.add("hidden");
      factionRow.classList.add("hidden");
      atmosphereRow.classList.add("hidden");
      allianceValue.textContent = "Bez aliance";
      factionValue.textContent = "Neznámá";
      atmosphereValue.textContent = "Neznámá";
      atmosphereImage.removeAttribute("src");
      atmosphereImage.removeAttribute("data-district-name");
      atmosphereImage.removeAttribute("data-district-type");
      atmosphereImage.removeAttribute("data-district-owner");
      atmosphereImage.classList.add("hidden");
      atmosphereValue.classList.remove("hidden");
      content.classList.remove("district-owner-bg-active");
      content.style.setProperty("--district-owner-avatar-url", "none");
      content.style.setProperty("--district-owner-avatar-opacity", "0");
      return;
    }

    const useSpyOnlyIntel = !visible && Boolean(spyIntel);
    const hasNoOwner = !district?.owner;
    const explicitOwnerNick = String(district?.ownerNick || "").trim();
    const explicitOwnerAlliance = String(district?.ownerAllianceName || "").trim();
    const fallbackOwnerNick = String(district?.owner || "Neznámý");
    const fallbackAllianceName = deriveAllianceNameFromOwnerLabel(district?.owner);
    const ownerNick = useSpyOnlyIntel
      ? (hasNoOwner ? "Prázdné" : "Skryto")
      : (explicitOwnerNick || fallbackOwnerNick);
    const ownerAlliance = useSpyOnlyIntel
      ? (hasNoOwner ? "Prázdné" : "Skryto")
      : (explicitOwnerAlliance || fallbackAllianceName || "Bez aliance");
    const avatarSrc = useSpyOnlyIntel ? "" : resolveDistrictOwnerAvatar(district);
    const spyKnownFields = spyIntel?.knownFields && typeof spyIntel.knownFields === "object"
      ? spyIntel.knownFields
      : {};
    const factionLabel = useSpyOnlyIntel
      ? `Typ: ${spyKnownFields.districtType === false ? "Nezjištěno" : (String(spyIntel?.districtType || "").trim() || "Neznámý")}`
      : resolveDistrictFactionLabel(district, isEnemy);
    const atmosphereLabel = spyKnownFields.atmosphere === false
      ? "Nezjištěno"
      : String(spyIntel?.atmosphere || "").trim();
    const atmosphereSrc = useSpyOnlyIntel ? "" : resolveDistrictAtmosphereImage(district, isEnemy);

    ownerValue.textContent = ownerNick;
    allianceValue.textContent = ownerAlliance;
    factionValue.textContent = factionLabel;
    atmosphereValue.textContent = atmosphereSrc
      ? ""
      : (atmosphereLabel || "Neznámá");
    allianceRow.classList.remove("hidden");
    factionRow.classList.remove("hidden");
    atmosphereRow.classList.toggle("hidden", useSpyOnlyIntel);
    content.classList.toggle("district-owner-bg-active", !useSpyOnlyIntel);
    if (useSpyOnlyIntel && hasNoOwner) {
      if (ownerLabel) ownerLabel.textContent = "Aliance / Vlastník";
      ownerValue.textContent = "Prázdné";
      allianceRow.classList.add("hidden");
    } else if (useSpyOnlyIntel) {
      if (ownerLabel) ownerLabel.textContent = "Vlastník";
      if (allianceLabel) allianceLabel.textContent = "Aliance";
    }
    if (useSpyOnlyIntel && factionLabelNode) {
      factionLabelNode.textContent = "Typ distriktu";
    }
    if (atmosphereSrc) {
      atmosphereImage.src = atmosphereSrc;
      atmosphereImage.dataset.districtName = district?.name || `Distrikt ${resolveDistrictNumberLabel(district)}`;
      atmosphereImage.dataset.districtType = String(district?.type || "-");
      atmosphereImage.dataset.districtOwner = ownerNick;
      atmosphereImage.classList.remove("hidden");
      atmosphereValue.classList.add("hidden");
    } else {
      atmosphereImage.removeAttribute("src");
      atmosphereImage.removeAttribute("data-district-name");
      atmosphereImage.removeAttribute("data-district-type");
      atmosphereImage.removeAttribute("data-district-owner");
      atmosphereImage.classList.add("hidden");
      atmosphereValue.classList.remove("hidden");
    }

    if (!avatarSrc) {
      content.style.setProperty("--district-owner-avatar-url", "none");
      content.style.setProperty("--district-owner-avatar-opacity", "0");
      return;
    }

    const safeAvatar = avatarSrc
      .replace(/\\/g, "\\\\")
      .replace(/"/g, "\\\"");
    content.style.setProperty("--district-owner-avatar-url", `url("${safeAvatar}")`);
    content.style.setProperty("--district-owner-avatar-opacity", "0.98");
  }

  function formatDistrictDefenseSummary(entry) {
    if (!entry || !entry.hasData) return "";
    const weapons = Math.max(0, Math.floor(Number(entry.weapons) || 0));
    const members = Math.max(0, Math.floor(Number(entry.members) || 0));
    const power = Math.max(0, Math.floor(Number(entry.power) || 0));
    return `Zbraně: ${weapons} • Lidé: ${members} • Síla: ${power}`;
  }

  function formatDistrictRaidLockLabel(ms) {
    const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (hours > 0 || minutes > 0) {
      parts.push(`${String(minutes).padStart(hours > 0 ? 2 : 1, "0")}m`);
    }
    parts.push(`${String(seconds).padStart(hours > 0 || minutes > 0 ? 2 : 1, "0")}s`);
    return parts.join(" ");
  }

  function updateDistrictRaidLockRow(district) {
    const row = document.getElementById("modal-raid-lock-row");
    const value = document.getElementById("modal-raid-lock");
    if (!row || !value) return;
    const remainingMs = window.Empire.UI?.getDistrictRaidLockRemainingMs?.(district?.id) || 0;
    row.classList.toggle("hidden", remainingMs <= 0);
    value.textContent = remainingMs > 0 ? formatDistrictRaidLockLabel(remainingMs) : "";
  }

  function updateDistrictDefenseSummary(district, options = {}) {
    const selfValue = document.getElementById("modal-defense-self");
    const allyValue = document.getElementById("modal-defense-ally");
    const selfRow = selfValue?.closest(".modal__row");
    const allyRow = allyValue?.closest(".modal__row");
    const spyIntel = options?.spyIntel || null;
    if (!selfValue || !allyValue) return;
    if (!district?.id && !spyIntel) {
      selfValue.textContent = "";
      allyValue.textContent = "";
      if (selfRow) selfRow.classList.add("hidden");
      if (allyRow) allyRow.classList.add("hidden");
      return;
    }
    if (!district?.id && spyIntel) {
      const knownFields = spyIntel?.knownFields && typeof spyIntel.knownFields === "object"
        ? spyIntel.knownFields
        : {};
      const weapons = knownFields.weapons === false
        ? "Nezjištěno"
        : `${Math.max(0, Math.floor(Number(spyIntel.weapons) || 0))}`;
      const powerRangeLabel = knownFields.powerRangeLabel === false
        ? "Nezjištěno"
        : (String(spyIntel.powerRangeLabel || "").trim() || "Neznámá");
      selfValue.textContent = `Odhad obrany • Zbraně: ${weapons} • Síla: ${powerRangeLabel}`;
      allyValue.textContent = "";
      if (selfRow) selfRow.classList.remove("hidden");
      if (allyRow) allyRow.classList.add("hidden");
      return;
    }
    const snapshot = window.Empire.UI?.getDistrictDefenseSnapshot?.(district.id) || null;
    const selfEntry = snapshot?.self || { hasData: false };
    const allyEntry = snapshot?.ally || { hasData: false };
    const knownSelf = Boolean(options.knownSelf);
    const knownAlly = Boolean(options.knownAlly);
    const showSelf = Boolean(selfEntry.hasData) || knownSelf;
    const showAlly = Boolean(allyEntry.hasData) || knownAlly;

    if (!selfEntry.hasData && spyIntel) {
      const knownFields = spyIntel?.knownFields && typeof spyIntel.knownFields === "object"
        ? spyIntel.knownFields
        : {};
      const weapons = knownFields.weapons === false
        ? "Nezjištěno"
        : `${Math.max(0, Math.floor(Number(spyIntel.weapons) || 0))}`;
      const powerRangeLabel = knownFields.powerRangeLabel === false
        ? "Nezjištěno"
        : (String(spyIntel.powerRangeLabel || "").trim() || "Neznámá");
      selfValue.textContent = `Odhad obrany • Zbraně: ${weapons} • Síla: ${powerRangeLabel}`;
    } else {
      selfValue.textContent = selfEntry.hasData ? formatDistrictDefenseSummary(selfEntry) : "Bez obrany";
    }
    allyValue.textContent = allyEntry.hasData ? formatDistrictDefenseSummary(allyEntry) : "Bez obrany";
    if (selfRow) selfRow.classList.toggle("hidden", !showSelf);
    if (allyRow) allyRow.classList.toggle("hidden", !showAlly);
    if (spyIntel && selfRow) selfRow.classList.remove("hidden");
  }

  function updateModalActionsForDistrict(district) {
    const attackBtn = document.getElementById("attack-btn");
    const raidBtn = document.getElementById("raid-btn");
    const spyBtn = document.getElementById("spy-btn");
    const defenseBtn = document.getElementById("defense-btn");
    const trapBtn = document.getElementById("trap-btn");
    const actionWrap = document.getElementById("district-modal-actions");
    if (!attackBtn || !raidBtn || !spyBtn || !defenseBtn || !trapBtn || !actionWrap) return;

    const defendableByPlayer = isDistrictDefendable(district);
    const evaluateAction = window.Empire.UI?.evaluateDistrictActionAvailability;
    const ownerValue = String(district?.owner || "").trim().toLowerCase();
    const isUnowned = !ownerValue || ownerValue === "neobsazeno" || ownerValue === "nikdo";
    const isEnemyDistrict = !defendableByPlayer && !isUnowned;
    const hasSpyIntel = Boolean(window.Empire.UI?.getDistrictSpyIntel?.(district?.id));
    const attackActionMode = isUnowned && hasSpyIntel ? "occupy" : "attack";
    const attackState = typeof evaluateAction === "function"
      ? evaluateAction(district, attackActionMode)
      : { allowed: !defendableByPlayer, reason: "" };
    const raidState = typeof evaluateAction === "function"
      ? evaluateAction(district, "raid")
      : { allowed: !defendableByPlayer, reason: "" };
    const spyState = typeof evaluateAction === "function"
      ? evaluateAction(district, "spy")
      : { allowed: !defendableByPlayer, reason: "" };
    const trapControlState = window.Empire.UI?.getDistrictTrapControlState?.(district)
      || { visible: false, label: "Past", title: "", isActiveHere: false };
    const destroyed = isDistrictDestroyed(district);
    const raidLockRemainingMs = window.Empire.UI?.getDistrictRaidLockRemainingMs?.(district?.id) || 0;

    const showAttack = !destroyed && !defendableByPlayer && attackState.allowed;
    const showRaid = !destroyed && !defendableByPlayer && raidState.allowed;
    const showSpy = !destroyed && !defendableByPlayer && spyState.allowed && !hasSpyIntel;
    const showOccupyRaidPair = showAttack && showRaid && attackActionMode === "occupy";
    const showSpyRaidPair = !showAttack && showRaid && showSpy;

    attackBtn.classList.toggle("hidden", !showAttack);
    raidBtn.classList.toggle("hidden", !showRaid);
    spyBtn.classList.toggle("hidden", !showSpy);
    defenseBtn.classList.toggle("hidden", destroyed || !defendableByPlayer);
    trapBtn.classList.toggle("hidden", destroyed || !defendableByPlayer || !trapControlState.visible);
    actionWrap.classList.toggle("district-modal__actions--occupy-raid", showOccupyRaidPair);
    actionWrap.classList.toggle("district-modal__actions--spy-raid", showSpyRaidPair);
    actionWrap.classList.toggle("district-modal__actions--defense-trap", !destroyed && defendableByPlayer && trapControlState.visible);
    actionWrap.classList.toggle("district-modal__actions--enemy", !destroyed && isEnemyDistrict && showAttack && showSpy);
    attackBtn.dataset.actionMode = attackActionMode;
    attackBtn.textContent = attackActionMode === "occupy" ? "Obsadit" : "Zaútočit";
    raidBtn.textContent = raidLockRemainingMs > 0
      ? `Vykrást • ${formatDistrictRaidLockLabel(raidLockRemainingMs)}`
      : "Vykrást";
    defenseBtn.textContent = "Obrana";
    const trapLabel = trapControlState.label || "Past";
    const trapSubtitle = String(trapControlState.subtitle || "").trim();
    trapBtn.innerHTML = trapSubtitle
      ? `<span class="district-action-btn__label">${trapLabel}</span><span class="district-action-btn__sub">${trapSubtitle}</span>`
      : `<span class="district-action-btn__label">${trapLabel}</span>`;
    attackBtn.disabled = false;
    raidBtn.disabled = false;
    spyBtn.disabled = false;
    defenseBtn.disabled = false;
    trapBtn.disabled = Boolean(trapControlState.buttonDisabled);
    attackBtn.setAttribute("aria-disabled", "false");
    raidBtn.setAttribute("aria-disabled", "false");
    spyBtn.setAttribute("aria-disabled", "false");
    defenseBtn.setAttribute("aria-disabled", "false");
    trapBtn.setAttribute("aria-disabled", trapControlState.buttonDisabled ? "true" : "false");
    attackBtn.title = "";
    raidBtn.title = "";
    spyBtn.title = "";
    defenseBtn.title = "Nastav obranu districtu.";
    trapBtn.title = trapControlState.title || "";
    trapBtn.classList.toggle("district-action-btn--cooldown", Boolean(trapControlState.moveLocked));
    trapBtn.classList.toggle("district-action-btn--active", Boolean(trapControlState.isActiveHere));
    trapBtn.setAttribute("aria-label", trapSubtitle ? `${trapLabel} ${trapSubtitle}` : trapLabel);
  }

  function hideModal() {
    if (!state.modal?.root) return;
    stopDistrictModalRefreshTicker();
    state.modal.root.classList.add("hidden");
  }

  function refreshSelectedDistrictModal() {
    if (!state.modal?.root || state.modal.root.classList.contains("hidden")) return;
    const selected = window.Empire.selectedDistrict?.id != null
      ? state.districts.find((district) => String(district?.id) === String(window.Empire.selectedDistrict.id)) || null
      : null;
    if (!selected) return;
    showModal(selected);
  }

  function updateDistrictBuildings(district, options = {}) {
    const root = document.getElementById("modal-buildings");
    const title = document.getElementById("modal-buildings-title");
    const list = document.getElementById("modal-buildings-list");
    const spyIntel = options?.spyIntel || null;
    if (!root || !title || !list) return;
    if (!district && !spyIntel) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    const knownFields = spyIntel?.knownFields && typeof spyIntel.knownFields === "object"
      ? spyIntel.knownFields
      : {};
    const buildings = district
      ? (Array.isArray(district.buildings) ? district.buildings : [])
      : (Array.isArray(spyIntel?.buildings) ? spyIntel.buildings : []);
    const trapControlState = district ? (window.Empire.UI?.getDistrictTrapControlState?.(district) || null) : null;
    const visibleBuildings = district && trapControlState?.buildingVisible
      ? [...buildings, "__district_trap__"]
      : buildings;
    if (!district && knownFields.buildings === false) {
      root.classList.remove("hidden");
      title.textContent = "Budovy v distriktu";
      list.innerHTML = '<div class="district-buildings__empty">Budovy se nepodařilo zjistit.</div>';
      return;
    }
    if (!visibleBuildings.length) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    const lockMeta = district ? resolveBuildingLockMeta(district) : { locked: true, label: "" };

    title.textContent = district?.buildingSetTitle
      ? `Budovy v distriktu • ${district.buildingSetTitle} (${district.buildingTier || "set"})`
      : "Budovy v distriktu";
    list.innerHTML = visibleBuildings
      .map(
        (building, index) => `
          ${building === "__district_trap__"
            ? `<div class="district-buildings__item district-buildings__item--trap">
                <span class="district-buildings__name">${trapControlState?.buildingLabel || "Past"}</span>
                <span class="district-buildings__lock district-buildings__lock--trap">${trapControlState?.buildingMeta || "aktivní"}</span>
              </div>`
            : `
          <button
            class="district-buildings__item district-buildings__item--interactive${lockMeta.locked ? " district-buildings__item--locked" : ""}"
            type="button"
            data-building-index="${index}"
            ${lockMeta.locked ? 'data-building-locked="1" disabled aria-disabled="true"' : ""}
          >
            <span class="district-buildings__name">${building}</span>
            ${lockMeta.locked && lockMeta.label ? `<span class="district-buildings__lock">${lockMeta.label}</span>` : ""}
          </button>
        `}`
      )
      .join("");
    if (!district) {
      root.classList.remove("hidden");
      return;
    }
    list.querySelectorAll("[data-building-index]:not([data-building-locked])").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-building-index"));
        const buildingName = visibleBuildings[index];
        if (buildingName === "__district_trap__") return;
        if (!buildingName) return;
        const detailInput = resolveBuildingDetailInput(district, index, buildingName);
        openBuildingDetailModal(detailInput, district);
      });
    });
    root.classList.remove("hidden");
  }

  function initDistrictAtmosphereLightbox() {
    const trigger = document.getElementById("modal-owner-atmosphere-image");
    const root = document.getElementById("district-atmosphere-lightbox");
    const backdrop = document.getElementById("district-atmosphere-lightbox-backdrop");
    const closeBtn = document.getElementById("district-atmosphere-lightbox-close");
    const image = document.getElementById("district-atmosphere-lightbox-image");
    const title = document.getElementById("district-atmosphere-lightbox-title");
    const meta = document.getElementById("district-atmosphere-lightbox-meta");
    if (!trigger || !root || !image || !title || !meta) return;

    const open = () => {
      const src = String(trigger.getAttribute("src") || "").trim();
      if (!src) return;
      image.src = src;
      title.textContent = trigger.dataset.districtName || "Atmosféra distriktu";
      const parts = [
        trigger.dataset.districtType ? `Typ: ${trigger.dataset.districtType}` : "",
        trigger.dataset.districtOwner ? `Vlastník: ${trigger.dataset.districtOwner}` : ""
      ].filter(Boolean);
      meta.textContent = parts.join(" • ");
      root.classList.remove("hidden");
    };

    const close = () => {
      root.classList.add("hidden");
      image.removeAttribute("src");
    };

    trigger.addEventListener("click", open);
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    root.addEventListener("click", (event) => {
      if (event.target === root) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.classList.contains("hidden")) close();
    });
  }

  function formatDistrictGossipTimestamp(timestamp) {
    const value = Math.max(0, Math.floor(Number(timestamp) || 0));
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}. ${hours}:${minutes}`;
  }

  function updateDistrictGossip(district) {
    const root = document.getElementById("modal-gossip");
    const list = document.getElementById("modal-gossip-list");
    if (!root || !list) return;
    if (!district) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    const entries = getDistrictGossipEntries(district, 24);
    if (!entries.length) {
      list.innerHTML = `
        <div class="district-gossip__item district-gossip__item--placeholder">
          <div class="district-gossip__text">Zatím žádné drby pro tento distrikt.</div>
        </div>
      `;
      root.classList.remove("hidden");
      return;
    }

    list.innerHTML = entries
      .map((entry) => `
        <div class="district-gossip__item">
          <div class="district-gossip__text">${escapeHtml(entry.text)}</div>
          <div class="district-gossip__meta-row">
            <span class="district-gossip__badge district-gossip__badge--${entry.intelLevel === "verified" ? "verified" : "rumor"}">
              ${entry.intelLevel === "verified" ? "OVĚŘENO" : "DRB"}
            </span>
            <div class="district-gossip__meta">${formatDistrictGossipTimestamp(entry.createdAt)}</div>
          </div>
        </div>
      `)
      .join("");
    root.classList.remove("hidden");
  }

  function refreshOpenDistrictGossipSection() {
    if (!state.modal?.root || state.modal.root.classList.contains("hidden")) return;
    const selected = state.districts.find((district) => String(district?.id) === String(state.selectedId));
    if (!selected) return;
    updateDistrictGossip(selected);
  }

  function resolveDistrictBuildingName(district, index, fallbackName) {
    const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
    const named = overrides[index];
    if (typeof named === "string" && named.trim()) {
      return named.trim();
    }
    return String(fallbackName || "Neznámá budova");
  }

  function resolveBuildingDetailInput(district, index, fallbackName) {
    const baseName = String(fallbackName || "Neznámá budova");
    const variantName = resolveDistrictBuildingName(district, index, baseName);
    return {
      baseName,
      variantName: variantName !== baseName ? variantName : null,
      districtId: district?.id ?? null,
      buildingIndex: Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : null
    };
  }

  function resolveBuildingDetailContext(buildingInput) {
    if (buildingInput && typeof buildingInput === "object") {
      const baseName = String(buildingInput.baseName || buildingInput.name || "Neznámá budova");
      const variantRaw = String(buildingInput.variantName || "").trim();
      const variantName = variantRaw && variantRaw !== baseName ? variantRaw : null;
      const districtId = buildingInput.districtId ?? null;
      const indexRaw = Number(buildingInput.buildingIndex);
      const buildingIndex = Number.isFinite(indexRaw) ? Math.max(0, Math.floor(indexRaw)) : null;
      return { baseName, variantName, districtId, buildingIndex };
    }
    return {
      baseName: String(buildingInput || "Neznámá budova"),
      variantName: null,
      districtId: null,
      buildingIndex: null
    };
  }

  function resolveBuildingLockMeta(district) {
    if (isDistrictOwnedByPlayer(district)) {
      return { locked: false, label: "" };
    }
    if (isDistrictOwnedByAlly(district)) {
      return { locked: true, label: "ALLY LOCKED" };
    }
    return { locked: true, label: "LOCKED" };
  }

  function clampPan() {
    const viewW = state.canvas.width / window.devicePixelRatio;
    const viewH = state.canvas.height / window.devicePixelRatio;
    const mapW = state.mapSize.width * state.scale;
    const mapH = state.mapSize.height * state.scale;

    if (mapW <= viewW) {
      state.offsetX = (viewW - mapW) / 2;
    } else {
      const minX = viewW - mapW;
      state.offsetX = clamp(state.offsetX, minX, 0);
    }

    if (mapH <= viewH) {
      state.offsetY = (viewH - mapH) / 2;
    } else {
      const minY = viewH - mapH;
      state.offsetY = clamp(state.offsetY, minY, 0);
    }
  }

  function loadMapImage() {
    const img = new Image();
    img.src = MAP_MODE_IMAGE_BY_KEY[state.mapMode] || MAP_MODE_IMAGE_BY_KEY.night;
    img.onload = () => {
      document.dispatchEvent(new CustomEvent("empire:map-mode-changed", {
        detail: { mapMode: state.mapMode }
      }));
      render();
    };
    state.mapImage = img;
  }

  function normalizeMapMode(value) {
    const key = String(value || "").trim().toLowerCase();
    if (key === "day") return "day";
    if (key === "blackout") return "blackout";
    return "night";
  }

  function resolveStoredMapMode() {
    try {
      return normalizeMapMode(localStorage.getItem(MAP_MODE_STORAGE_KEY) || "night");
    } catch {
      return "night";
    }
  }

  function setMapMode(mode) {
    const nextMode = normalizeMapMode(mode);
    if (state.mapMode === nextMode) return;
    state.mapMode = nextMode;
    try {
      localStorage.setItem(MAP_MODE_STORAGE_KEY, nextMode);
    } catch {}
    const img = new Image();
    img.src = MAP_MODE_IMAGE_BY_KEY[nextMode] || MAP_MODE_IMAGE_BY_KEY.night;
    img.onload = () => {
      state.mapImage = img;
      document.dispatchEvent(new CustomEvent("empire:map-mode-changed", {
        detail: { mapMode: nextMode }
      }));
      render();
    };
    img.onerror = () => {
      render();
    };
  }

  function getMapMode() {
    return normalizeMapMode(state.mapMode);
  }

  function buildRoadNetworkFromDistricts(districts) {
    const centroids = districts.map((district) => ({
      id: district.id,
      point: polygonCentroid(district.polygon)
    }));

    const roads = [];
    centroids.forEach((node) => {
      const nearest = centroids
        .filter((other) => other.id !== node.id)
        .map((other) => ({
          other,
          dist: Math.hypot(
            other.point[0] - node.point[0],
            other.point[1] - node.point[1]
          )
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      nearest.forEach((edge) => {
        roads.push({ from: node.point, to: edge.other.point });
      });
    });

    return roads;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getMinScale() {
    return Math.max(
      state.canvas.width / window.devicePixelRatio / state.mapSize.width,
      state.canvas.height / window.devicePixelRatio / state.mapSize.height
    );
  }

  function centerMap() {
    const viewW = state.canvas.width / window.devicePixelRatio;
    const viewH = state.canvas.height / window.devicePixelRatio;
    const mapW = state.mapSize.width * state.scale;
    const mapH = state.mapSize.height * state.scale;
    state.offsetX = (viewW - mapW) / 2;
    state.offsetY = (viewH - mapH) / 2;
  }

  function zoomAtPoint(viewX, viewY, newScale) {
    const worldBefore = toWorld(viewX, viewY);
    state.scale = newScale;
    state.offsetX = viewX - worldBefore.x * newScale;
    state.offsetY = viewY - worldBefore.y * newScale;
    clampPan();
    render();
  }

  function beginPinch(firstTouch, secondTouch) {
    const rect = state.canvas.getBoundingClientRect();
    const midpoint = midpointBetweenTouches(firstTouch, secondTouch);
    state.isPinching = true;
    state.isPanning = false;
    state.touchMoved = true;
    state.pinchStartDistance = Math.max(distanceBetweenTouches(firstTouch, secondTouch), 1);
    state.pinchStartScale = state.scale;
    state.pinchWorldCenter = toWorld(midpoint.x - rect.left, midpoint.y - rect.top);
  }

  function distanceBetweenTouches(firstTouch, secondTouch) {
    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY
    );
  }

  function midpointBetweenTouches(firstTouch, secondTouch) {
    return {
      x: (firstTouch.clientX + secondTouch.clientX) / 2,
      y: (firstTouch.clientY + secondTouch.clientY) / 2
    };
  }

  function isTouchGhost() {
    return Date.now() - state.lastTouchAt < 500;
  }

  return {
    init,
    render,
    getMapMode,
    setMapMode,
    setDistricts,
    refreshSelectedDistrictModal,
    applyUpdate,
    setVisionContext,
    showBuildingDetail,
    recordIntelEvent,
    markDistrictUnderAttack,
    clearDistrictUnderAttack,
    clearUnderAttackDistricts: clearAllUnderAttackDistricts,
    setUnderAttackDistricts,
    markDistrictPoliceAction,
    clearDistrictPoliceAction,
    clearPoliceActions: clearAllPoliceActions,
    setPoliceActionDistricts,
    markDistrictSpyAction,
    clearDistrictSpyAction,
    clearSpyActions: clearAllSpyActions,
    setSpyActionDistricts,
    markDistrictRaidAction,
    clearDistrictRaidAction,
    clearRaidActions: clearAllRaidActions,
    getPharmacyBoostSnapshot,
    usePharmacyBoost,
    getPoliceActionSnapshot,
    getFactoryBoostSnapshot,
    useFactoryBoost
  };
})();
