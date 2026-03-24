window.Empire = window.Empire || {};

window.Empire.Map = (() => {
  const state = {
    canvas: null,
    ctx: null,
    tooltip: null,
    modal: null,
    districts: [],
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
    mapSize: { width: 1400, height: 900 },
    vision: {
      fogPreviewMode: false,
      alliedOwnerNames: new Set(),
      enemyOwnerNames: new Set()
    },
    activeBuildingDetail: null
  };

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
    baseIncomePerHour: 10,
    incomePerGangMemberPerHour: 0.5,
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
    baseIncomePerHour: 6,
    incomePerTenMembersPerHour: 0.2,
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
    baseIncomePerHour: 45,
    incomePerTenMembersPerHour: 0.2,
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
    baseCleanIncomePerHour: 90,
    baseDirtyIncomePerHour: 20,
    memberBonusPerTenMembersPerHour: 0.5,
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
    baseCleanIncomePerHour: 55,
    cleanIncomePerTenMembersPerHour: 0.3,
    baseDirtyIncomePerHour: 30,
    dirtyIncomePerTenMembersPerHour: 0.5,
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
    baseCleanIncomePerHour: 70,
    cleanIncomePerTenMembersPerHour: 0.4,
    baseDirtyIncomePerHour: 12,
    dirtyIncomePerTenMembersPerHour: 0.2,
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
    baseCleanIncomePerHour: 40,
    cleanIncomePerTenMembersPerHour: 0.3,
    baseDirtyIncomePerHour: 8,
    dirtyIncomePerTenMembersPerHour: 0.1,
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
    baseCleanIncomePerHour: 30,
    cleanIncomePerTenMembersPerHour: 0.2,
    baseDirtyIncomePerHour: 4,
    dirtyIncomePerTenMembersPerHour: 0.05,
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
    baseCleanIncomePerHour: 24,
    cleanIncomePerTenMembersPerHour: 0.15,
    baseDirtyIncomePerHour: 6,
    dirtyIncomePerTenMembersPerHour: 0.08,
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

  const DISTRICT_GOSSIP_STORAGE_KEY = "empire_district_gossip_history_v1";
  const DISTRICT_GOSSIP_MAX_PER_DISTRICT = 40;
  const DISTRICT_GOSSIP_DEMO_SEED_KEY = "empire_district_gossip_demo_seed_v1";

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
  let districtGossipStore = loadDistrictGossipStore();

  function init() {
    state.canvas = document.getElementById("city-map");
    state.tooltip = document.getElementById("map-tooltip");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");

    loadMapImage();
    generateCity();
    seedDemoDistrictGossip();
    initModal();
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
      incomeRemainder: 0,
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
    const incomeRemainder = Number(rawState?.incomeRemainder || 0);
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
      incomeRemainder: Number.isFinite(incomeRemainder) ? Math.max(0, incomeRemainder) : 0,
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
      incomeRemainder: 0,
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
    const incomeRemainder = Number(rawState?.incomeRemainder || 0);
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
      incomeRemainder: Number.isFinite(incomeRemainder) ? Math.max(0, incomeRemainder) : 0,
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
      incomeRemainder: 0,
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
    const incomeRemainder = Number(rawState?.incomeRemainder || 0);
    const influenceRemainder = Number(rawState?.influenceRemainder || 0);
    const lastIncomeAt = Number(rawState?.lastIncomeAt || now);
    const lastInfluenceAt = Number(rawState?.lastInfluenceAt || now);
    const cooldownsRaw = rawState?.cooldowns || {};
    const effectsRaw = rawState?.effects || {};

    return {
      level,
      incomeRemainder: Number.isFinite(incomeRemainder) ? Math.max(0, incomeRemainder) : 0,
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

    return Math.max(0, boostPct);
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
    return "komodita";
  }

  function formatMarketSideLabel(side) {
    return String(side || "").trim().toLowerCase() === "sell" ? "prodejní" : "nákupní";
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
      return `Potvrzený intel: V districtu ${districtLabel} byla potvrzena špionážní aktivita.`;
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

    let incomeGained = 0;
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
      const hourlyRate =
        (APARTMENT_BLOCK_CONFIG.baseIncomePerHour
          + Math.max(0, Number(totalGangMembers || 0)) * APARTMENT_BLOCK_CONFIG.incomePerGangMemberPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const gainedRaw = hoursElapsed * hourlyRate + Number(stateRef.incomeRemainder || 0);
      incomeGained = Math.max(0, Math.floor(gainedRaw));
      stateRef.incomeRemainder = Math.max(0, gainedRaw - incomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (incomeGained > 0) {
      payoutBuildingIncome(incomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { incomeGained };
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
    const hourlyIncome = hiddenHousingActive
      ? 0
      : (APARTMENT_BLOCK_CONFIG.baseIncomePerHour
        + totalGangMembers * APARTMENT_BLOCK_CONFIG.incomePerGangMemberPerHour)
      * levelMultiplier;
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
      hourlyIncome,
      dailyIncome,
      info:
        "Bytový blok je personální centrum gangu: každých 10 minut produkuje členy do kapacity, kterou musíš pravidelně vybírat tlačítkem Vybrat členy. Pokud je kapacita plná, produkce se zastaví. Budova generuje základní income + bonus podle celkového počtu členů gangu. Nábor z ulice okamžitě doplní část kapacity, Motivační večer na 2h zdvojnásobí produkci a Skryté ubytování na 2h vypne income, ale aktivuje ochranný režim. Každý upgrade zvyšuje produkci, kapacitu i income o 10 %.",
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
      const spend = window.Empire.UI?.trySpendCash;
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

    let incomeGained = 0;
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
      const hourlyRate =
        (SCHOOL_BUILDING_CONFIG.baseIncomePerHour
          + memberSteps * SCHOOL_BUILDING_CONFIG.incomePerTenMembersPerHour)
        * levelMultiplier
        * districtIncomeMultiplier;
      const gainedRaw = hoursElapsed * hourlyRate + Number(stateRef.incomeRemainder || 0);
      incomeGained = Math.max(0, Math.floor(gainedRaw));
      stateRef.incomeRemainder = Math.max(0, gainedRaw - incomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (incomeGained > 0) {
      payoutBuildingIncome(incomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { incomeGained };
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
    const hourlyIncome = eveningActive
      ? 0
      : (SCHOOL_BUILDING_CONFIG.baseIncomePerHour
        + memberSteps * SCHOOL_BUILDING_CONFIG.incomePerTenMembersPerHour)
      * levelMultiplier;
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
      hourlyIncome,
      dailyIncome,
      info:
        "Škola produkuje 1 člena každých 10 minut do kapacity 12 (škáluje s levelem) a přes Vybrat členy je převádí do gangu. Income: základ 6/h + 0.2/h za každých 10 členů gangu, heat 2/24h. Akce: Náborová přednáška (CD 3h, +4 až +10 členů, +2 heat), Zrychlený kurz chemie (CD 4h, 2h, Drug Lab +25 %, +3 heat), Večerní program (CD 6h, 2h, heat districtu -20 %, income školy 0). Upgrady L2/L3/L4 za $5000/$15000/$40000 dávají +10 % produkce, income, kapacity a síly pasivního bonusu Drug Lab.",
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
      const spend = window.Empire.UI?.trySpendCash;
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

    let incomeGained = 0;
    if (incomeFrom < nowMs) {
      const memberSteps = Math.max(0, Math.floor(Math.max(0, Number(totalGangMembers || 0)) / 10));
      const baseHourlyIncome =
        (FITNESS_BUILDING_CONFIG.baseIncomePerHour
          + memberSteps * FITNESS_BUILDING_CONFIG.incomePerTenMembersPerHour)
        * levelMultiplier;
      const premiumBoostPct = premiumActive ? FITNESS_BUILDING_CONFIG.premiumIncomeBoostPct * levelMultiplier : 0;
      const trainingPenaltyPct = trainingActive ? FITNESS_BUILDING_CONFIG.trainingIncomePenaltyPct * levelMultiplier : 0;
      const incomeMultiplier = Math.max(0, 1 + premiumBoostPct / 100 - trainingPenaltyPct / 100);
      const hourlyIncome = baseHourlyIncome * incomeMultiplier * districtIncomeMultiplier;
      const hoursElapsed = (nowMs - incomeFrom) / 3600000;
      const gainedRaw = hoursElapsed * hourlyIncome + Number(stateRef.incomeRemainder || 0);
      incomeGained = Math.max(0, Math.floor(gainedRaw));
      stateRef.incomeRemainder = Math.max(0, gainedRaw - incomeGained);
    }
    stateRef.lastIncomeAt = nowMs;

    if (incomeGained > 0) {
      payoutBuildingIncome(incomeGained);
    }

    applyBuildingInfluenceTick(stateRef, nowMs, BUILDING_INFLUENCE_PER_HOUR);

    return { incomeGained };
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
    const baseHourlyIncome =
      (FITNESS_BUILDING_CONFIG.baseIncomePerHour
        + memberSteps * FITNESS_BUILDING_CONFIG.incomePerTenMembersPerHour)
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
    const hourlyIncome = baseHourlyIncome * currentIncomeMultiplier;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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
      const spend = window.Empire.UI?.trySpendCash;
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

  function generateCity() {
    const seed = "empire-city-v1";
    const width = state.mapSize.width;
    const height = state.mapSize.height;
    const districtCount = 150;
    const city = window.Empire.CityGen.generate({ seed, width, height, districtCount });
    const enrichedDistricts = window.Empire.UI?.assignDistrictMetadata
      ? window.Empire.UI.assignDistrictMetadata(city.districts)
      : city.districts;
    state.districts = enrichedDistricts;
    state.roads = city.roads;
    window.Empire.districts = enrichedDistricts;
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
    drawDistricts(ctx);
    ctx.restore();
  }

  function drawBackground(ctx) {
    ctx.fillStyle = "#0b1119";
    ctx.fillRect(-2000, -2000, 6000, 6000);
    if (state.mapImage && state.mapImage.complete) {
      if (state.vision.fogPreviewMode) {
        ctx.save();
        ctx.filter = "grayscale(1) contrast(1.06)";
        ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
        ctx.restore();
      } else {
        ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
      }
    }
  }

  function drawDistricts(ctx) {
    state.districts.forEach((district) => {
      const fill = districtFill(district);
      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(15,23,42,0.7)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      district.polygon.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (district.id === state.hoverId || district.id === state.selectedId) {
        ctx.strokeStyle = district.id === state.selectedId ? "#facc15" : "#38bdf8";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }

  function districtFill(district) {
    if (isDistrictOwnedByPlayer(district)) return resolvePlayerOwnedFill();
    if (isDistrictOwnedByAlly(district)) return allyFill(district.owner);
    if (isDistrictOwnedByEnemy(district)) return enemyFill(district.owner);

    if (state.vision.fogPreviewMode) {
      switch (district.type) {
        case "downtown":
          return "rgba(248,113,113,0.4)";
        case "industrial":
          return "rgba(165,172,180,0.28)";
        case "commercial":
          return "rgba(152,160,168,0.28)";
        case "park":
          return "rgba(135,145,154,0.26)";
        case "residential":
        default:
          return "rgba(122,130,140,0.26)";
      }
    }

    if (district.owner) return ownerFill(district.owner);

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
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(34,197,94,0.35)";
    const index = hashOwner(normalized) % ownerPalette.length;
    return ownerPalette[index];
  }

  function enemyFill(owner) {
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(203,213,225,0.22)";
    const index = hashOwner(normalized) % enemyPalette.length;
    return enemyPalette[index];
  }

  function allyFill(owner) {
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

  function isPlayerOwner(ownerName) {
    return getPlayerOwnerNames().has(normalizeName(ownerName));
  }

  function isDistrictOwnedByPlayer(district) {
    if (!district?.owner) return false;
    return isPlayerOwner(String(district.owner).trim());
  }

  function isDistrictOwnedByAlly(district) {
    if (!district?.owner) return false;
    const owner = normalizeName(district.owner);
    if (!owner) return false;
    if (isPlayerOwner(owner)) return false;
    return state.vision.alliedOwnerNames.has(owner);
  }

  function isDistrictOwnedByEnemy(district) {
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
      player.username,
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

    const buildingLine =
      Array.isArray(district.buildings) && district.buildings.length
        ? `
          <div class="map-tooltip__section">
            <div class="map-tooltip__label">Budovy</div>
            <div class="map-tooltip__tags">
              ${district.buildings.map((building) => `<span class="map-tooltip__tag">${building}</span>`).join("")}
            </div>
          </div>
        `
        : "";
    const setLine = district.buildingSetTitle
      ? `<div class="map-tooltip__section"><div class="map-tooltip__label">Set</div><div>${district.buildingSetTitle}</div></div>`
      : "";
    const gossipLine = buildTooltipGossipSection(district, 2);

    state.tooltip.innerHTML = `
      <div class="map-tooltip__title">${district.name}</div>
      <div>Typ: ${district.type}</div>
      <div>Vlastník: ${district.owner || "Neobsazeno"}</div>
      <div>Příjem: $${district.income}/hod</div>
      <div>Vliv: ${district.influence}</div>
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
    if (!update || !Array.isArray(update.districts)) return;
    setDistricts(update.districts);
  }

  function setVisionContext(context = {}) {
    state.vision.fogPreviewMode = Boolean(context.fogPreviewMode);
    const allied = Array.isArray(context.alliedOwnerNames) ? context.alliedOwnerNames : [];
    const enemies = Array.isArray(context.enemyOwnerNames) ? context.enemyOwnerNames : [];
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
    render();
  }

  function setDistricts(districts) {
    if (!Array.isArray(districts) || districts.length < 1) return;
    let normalized = districts.map((district, index) => ({
      id: district.id,
      name: district.name || `${district.type} #${index + 1}`,
      type: district.type || "residential",
      owner: district.owner || null,
      influence: Number(district.influence || 0),
      income: Number(district.income || 0),
      polygon: district.polygon,
      buildings: Array.isArray(district.buildings) ? district.buildings : [],
      buildingNameOverrides: Array.isArray(district.buildingNameOverrides) ? district.buildingNameOverrides : [],
      buildingTier: district.buildingTier || null,
      buildingSetKey: district.buildingSetKey || null,
      buildingSetTitle: district.buildingSetTitle || null
    }));

    if (window.Empire.UI?.assignDistrictMetadata) {
      normalized = window.Empire.UI.assignDistrictMetadata(normalized);
    }

    const hasPolygons = normalized.every((d) => Array.isArray(d.polygon));
    if (!hasPolygons) return;

    state.districts = normalized;
    state.roads = buildRoadNetworkFromDistricts(normalized);
    window.Empire.districts = normalized;
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
        if (defense && !defense.classList.contains("hidden")) {
          defense.click();
          return;
        }
        const attack = document.getElementById("attack-btn");
        if (attack) attack.click();
      }
    });
  }

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
      if (panelStats) panelStats.classList.toggle("hidden", showInfo);
      if (panelInfo) panelInfo.classList.toggle("hidden", !showInfo);
      root.classList.toggle("is-info-tab", showInfo);
      tabButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.buildingTab === tab);
      });
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
      resetSwipeState();
    };

    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
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

    actionButtons.forEach((button) => {
      button.classList.remove("hidden");
    });
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
      || mechanicsType === "convenience-store";
    if (!supportsCustomActions) {
      return;
    }

    if (collectBtn && (mechanicsType === "apartment-block" || mechanicsType === "school")) {
      collectBtn.classList.remove("hidden");
      collectBtn.disabled = mechanics.storedMembers <= 0;
      collectBtn.title = mechanics.storedMembers <= 0 ? "Budova nemá nasbírané členy." : "";
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
    }
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
      )
    ) {
      root.classList.add("hidden");
      if (infoEffects) infoEffects.textContent = "Žádné aktivní mechaniky.";
      return;
    }

    if (storedLabel) storedLabel.textContent = "Uložení členové";
    if (productionLabel) productionLabel.textContent = "Produkce členů";
    if (heatLabel) heatLabel.textContent = "Heat";
    if (effectsLabel) effectsLabel.textContent = "Aktivní efekty";
    level.textContent = `L${mechanics.level}`;
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
    } else {
      stored.textContent = `${mechanics.storedMembers} / ${mechanics.capacity}`;
      production.textContent = `${formatDecimalValue(mechanics.productionPerCycle, 2)} / 10 min`;
    }
    heat.textContent = `${formatDecimalValue(mechanics.heatPerDay, 2)} / 24h`;
    effects.textContent = mechanics.effectsLabel || "Žádné";
    if (infoEffects) infoEffects.textContent = mechanics.effectsLabel || "Žádné aktivní mechaniky.";
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
    return ["Speciální akce této budovy budou doplněny."];
  }

  function renderBuildingInfoActions(details) {
    const list = document.getElementById("building-info-actions");
    if (!list) return;
    list.innerHTML = "";
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

    const context = resolveBuildingDetailContext(buildingName);
    const details = resolveBuildingDetails(context, district);
    const title = document.getElementById("building-detail-title");
    const name = document.getElementById("building-detail-name");
    const hourly = document.getElementById("building-detail-hourly");
    const daily = document.getElementById("building-detail-daily");
    const info = document.getElementById("building-detail-info-text");
    const infoHeading = document.getElementById("building-info-heading");
    const infoSubtitle = document.getElementById("building-info-subtitle");
    const infoHourly = document.getElementById("building-info-hourly");
    const infoDaily = document.getElementById("building-info-daily");
    const infoEffects = document.getElementById("building-info-effects");
    const panelStats = document.getElementById("building-detail-panel-stats");
    const panelInfo = document.getElementById("building-detail-panel-info");
    const tabButtons = Array.from(root.querySelectorAll("[data-building-tab]"));

    state.activeBuildingDetail = { context, district: district || null };

    if (title) title.textContent = `Budova: ${details.baseName}`;
    if (name) name.textContent = details.displayName;
    const hourlyLabel = `$${formatDecimalValue(details.hourlyIncome, 2)} / hod`;
    const dailyLabel = `$${formatDecimalValue(details.dailyIncome, 2)} / den`;
    if (hourly) hourly.textContent = hourlyLabel;
    if (daily) daily.textContent = dailyLabel;
    if (info) info.textContent = details.info;
    if (infoHourly) infoHourly.textContent = hourlyLabel;
    if (infoDaily) infoDaily.textContent = dailyLabel;
    if (infoEffects) infoEffects.textContent = details?.mechanics?.effectsLabel || "Žádné aktivní mechaniky.";
    renderBuildingInfoActions(details);
    if (infoHeading) infoHeading.textContent = `Taktický profil: ${details.displayName}`;
    if (infoSubtitle) {
      const mechanicsType = String(details?.mechanics?.type || "").trim();
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
      }
      infoSubtitle.textContent = subtitle;
    }
    if (panelStats) panelStats.classList.remove("hidden");
    if (panelInfo) panelInfo.classList.add("hidden");
    root.classList.remove("is-info-tab");
    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.buildingTab === "stats");
    });
    updateBuildingMechanicsPanel(details);
    setBuildingDetailActionButtons(details);

    root.classList.remove("hidden");
  }

  function showBuildingDetail(buildingName, district) {
    openBuildingDetailModal(buildingName, district || null);
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
    const hourlyIncome = activeSpecialProfile
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
      hourlyIncome,
      dailyIncome,
      info,
      specialActions: []
    };
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
    return fallbackDetails;
  }

  function showModal(district) {
    if (!state.modal?.root) return;
    const defendableByPlayer = isDistrictDefendable(district);
    const isDowntown = district.type === "downtown";
    const districtNumber = resolveDistrictNumberLabel(district);

    updateModalActionsForDistrict(district);

    if (!state.vision.fogPreviewMode || defendableByPlayer) {
      document.getElementById("modal-name").textContent = district.name || "Distrikt";
      document.getElementById("modal-type").textContent = district.type || "-";
      document.getElementById("modal-owner").textContent = district.owner || "Neobsazeno";
      document.getElementById("modal-income").textContent = `$${district.income || 0}/hod`;
      document.getElementById("modal-influence").textContent = district.influence || 0;
      updateDistrictBuildings(district);
      updateDistrictGossip(district);
      updateDistrictGallery(district);
    } else {
      document.getElementById("modal-name").textContent = isDowntown
        ? `Downtown sektor #${districtNumber}`
        : `District č. ${districtNumber}`;
      document.getElementById("modal-type").textContent = isDowntown ? "Downtown" : "Skryto";
      document.getElementById("modal-owner").textContent = "Skryto";
      document.getElementById("modal-income").textContent = "Skryto";
      document.getElementById("modal-influence").textContent = "Skryto";
      updateDistrictBuildings(null);
      updateDistrictGossip(district);
      updateDistrictGallery(null);
    }

    state.modal.root.classList.remove("hidden");
  }

  function updateModalActionsForDistrict(district) {
    const attackBtn = document.getElementById("attack-btn");
    const raidBtn = document.getElementById("raid-btn");
    const spyBtn = document.getElementById("spy-btn");
    const defenseBtn = document.getElementById("defense-btn");
    if (!attackBtn || !raidBtn || !spyBtn || !defenseBtn) return;

    const defendableByPlayer = isDistrictDefendable(district);
    const evaluateAction = window.Empire.UI?.evaluateDistrictActionAvailability;
    const attackState = typeof evaluateAction === "function"
      ? evaluateAction(district, "attack")
      : { allowed: !defendableByPlayer, reason: "" };
    const raidState = typeof evaluateAction === "function"
      ? evaluateAction(district, "raid")
      : { allowed: !defendableByPlayer, reason: "" };
    const spyState = typeof evaluateAction === "function"
      ? evaluateAction(district, "spy")
      : { allowed: !defendableByPlayer, reason: "" };

    const showAttack = !defendableByPlayer && attackState.allowed;
    const showRaid = !defendableByPlayer && raidState.allowed;
    const showSpy = !defendableByPlayer && spyState.allowed;

    attackBtn.classList.toggle("hidden", !showAttack);
    raidBtn.classList.toggle("hidden", !showRaid);
    spyBtn.classList.toggle("hidden", !showSpy);
    defenseBtn.classList.toggle("hidden", !defendableByPlayer);
    attackBtn.disabled = false;
    raidBtn.disabled = false;
    spyBtn.disabled = false;
    attackBtn.setAttribute("aria-disabled", "false");
    raidBtn.setAttribute("aria-disabled", "false");
    spyBtn.setAttribute("aria-disabled", "false");
    attackBtn.title = "";
    raidBtn.title = "";
    spyBtn.title = "";
  }

  function hideModal() {
    if (!state.modal?.root) return;
    state.modal.root.classList.add("hidden");
  }

  function updateDistrictBuildings(district) {
    const root = document.getElementById("modal-buildings");
    const title = document.getElementById("modal-buildings-title");
    const list = document.getElementById("modal-buildings-list");
    if (!root || !title || !list) return;
    if (!district) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    const buildings = Array.isArray(district.buildings) ? district.buildings : [];
    if (!buildings.length) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    const lockMeta = resolveBuildingLockMeta(district);

    title.textContent = district.buildingSetTitle
      ? `Budovy v distriktu • ${district.buildingSetTitle} (${district.buildingTier || "set"})`
      : "Budovy v distriktu";
    list.innerHTML = buildings
      .map(
        (building, index) => `
          <button
            class="district-buildings__item district-buildings__item--interactive${lockMeta.locked ? " district-buildings__item--locked" : ""}"
            type="button"
            data-building-index="${index}"
            ${lockMeta.locked ? 'data-building-locked="1" disabled aria-disabled="true"' : ""}
          >
            <span class="district-buildings__name">${building}</span>
            ${lockMeta.locked ? `<span class="district-buildings__lock">${lockMeta.label}</span>` : ""}
          </button>
        `
      )
      .join("");
    list.querySelectorAll("[data-building-index]:not([data-building-locked])").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-building-index"));
        const buildingName = buildings[index];
        if (!buildingName) return;
        const detailInput = resolveBuildingDetailInput(district, index, buildingName);
        openBuildingDetailModal(detailInput, district);
      });
    });
    root.classList.remove("hidden");
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
    const districtModal = document.getElementById("district-modal");
    if (!root || !list) return;
    if (!district) {
      root.classList.add("hidden");
      list.innerHTML = "";
      districtModal?.classList.remove("district-modal--has-gossip");
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
      districtModal?.classList.remove("district-modal--has-gossip");
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
    districtModal?.classList.add("district-modal--has-gossip");
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
    img.src = "../img/mapa.png";
    img.onload = () => render();
    state.mapImage = img;
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
    setDistricts,
    applyUpdate,
    setVisionContext,
    showBuildingDetail,
    recordIntelEvent
  };
})();
