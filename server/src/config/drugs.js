const ONE_HOUR_MS = 60 * 60 * 1000;

const DRUG_DEFINITIONS = Object.freeze({
  neon_dust: Object.freeze({
    key: "neon_dust",
    label: "Neon Dust",
    apiKey: "neonDust",
    inventoryColumn: "drug_neon_dust",
    activeUntilColumn: "drug_neon_dust_active_until",
    activeDoseColumn: "drug_neon_dust_active_dose",
    durationMs: 4 * ONE_HOUR_MS,
    activationHeat: 0,
    largeDoseThreshold: 4,
    effects: Object.freeze({
      incomeMultiplier: 1.04,
      dirtyIncomeMultiplier: 1.05,
      hourlyHeatOnLargeDose: 1
    })
  }),
  pulse_shot: Object.freeze({
    key: "pulse_shot",
    label: "Pulse Shot",
    apiKey: "pulseShot",
    inventoryColumn: "drug_pulse_shot",
    activeUntilColumn: "drug_pulse_shot_active_until",
    activeDoseColumn: "drug_pulse_shot_active_dose",
    durationMs: 2 * ONE_HOUR_MS,
    activationHeat: 2,
    effects: Object.freeze({
      productionSpeedMultiplier: 1.15,
      incomeMultiplier: 1.12,
      influenceGainMultiplier: 0.95
    })
  }),
  velvet_smoke: Object.freeze({
    key: "velvet_smoke",
    label: "Velvet Smoke",
    apiKey: "velvetSmoke",
    inventoryColumn: "drug_velvet_smoke",
    activeUntilColumn: "drug_velvet_smoke_active_until",
    activeDoseColumn: "drug_velvet_smoke_active_dose",
    durationMs: 3 * ONE_HOUR_MS,
    activationHeat: 3,
    effects: Object.freeze({
      incomeMultiplier: 1.1,
      influenceGainMultiplier: 1.2,
      raidRiskPctModifier: 8
    })
  }),
  ghost_serum: Object.freeze({
    key: "ghost_serum",
    label: "Ghost Serum",
    apiKey: "ghostSerum",
    inventoryColumn: "drug_ghost_serum",
    activeUntilColumn: "drug_ghost_serum_active_until",
    activeDoseColumn: "drug_ghost_serum_active_dose",
    durationMs: 3 * ONE_HOUR_MS,
    activationHeat: 0,
    effects: Object.freeze({
      incomeMultiplier: 0.9,
      heatGainMultiplier: 0.85,
      raidRiskPctModifier: -20
    })
  }),
  overdrive_x: Object.freeze({
    key: "overdrive_x",
    label: "Overdrive X",
    apiKey: "overdriveX",
    inventoryColumn: "drug_overdrive_x",
    activeUntilColumn: "drug_overdrive_x_active_until",
    activeDoseColumn: "drug_overdrive_x_active_dose",
    durationMs: 2 * ONE_HOUR_MS,
    activationHeat: 8,
    effects: Object.freeze({
      incomeMultiplier: 1.2,
      dirtyIncomeMultiplier: 1.2,
      attackPowerMultiplier: 1.25,
      defensePowerMultiplier: 1.25,
      raidRiskPctModifier: 20
    })
  })
});

const DRUG_KEYS = Object.freeze(Object.keys(DRUG_DEFINITIONS));
const DRUG_INVENTORY_COLUMNS = Object.freeze(
  DRUG_KEYS.map((key) => DRUG_DEFINITIONS[key].inventoryColumn)
);
const DRUG_ACTIVE_UNTIL_COLUMNS = Object.freeze(
  DRUG_KEYS.map((key) => DRUG_DEFINITIONS[key].activeUntilColumn)
);
const DRUG_ACTIVE_DOSE_COLUMNS = Object.freeze(
  DRUG_KEYS.map((key) => DRUG_DEFINITIONS[key].activeDoseColumn)
);
const DRUG_DB_COLUMNS = Object.freeze([
  ...DRUG_INVENTORY_COLUMNS,
  ...DRUG_ACTIVE_UNTIL_COLUMNS,
  ...DRUG_ACTIVE_DOSE_COLUMNS
]);
const DRUG_RESOURCE_COLUMN_MAP = Object.freeze(
  DRUG_KEYS.reduce((acc, key) => {
    acc[key] = DRUG_DEFINITIONS[key].inventoryColumn;
    return acc;
  }, {})
);
const OVERDRIVE_CRASH_MS = ONE_HOUR_MS;
const OVERDRIVE_CRASH_EFFECTS = Object.freeze({
  incomeMultiplier: 0.9,
  dirtyIncomeMultiplier: 0.9,
  productionSpeedMultiplier: 0.9,
  influenceGainMultiplier: 0.9,
  attackPowerMultiplier: 0.9,
  defensePowerMultiplier: 0.9
});

const HEAT_BALANCE = Object.freeze({
  baseHourlyHeatDecay: 1,
  baseRaidRiskPct: 4,
  raidRiskHeatTier1: 40,
  raidRiskHeatTier2: 100,
  raidRiskSlopeTier1: 0.45,
  raidRiskSlopeTier2: 0.6,
  raidRiskSlopeTier3: 0.35,
  maxRaidRiskPct: 95,
  baseAttackHeatGain: 2,
  overdriveAttackHeatGain: 5
});

const STARTER_DRUG_DISTRIBUTION_RATIOS = Object.freeze({
  neon_dust: 0.55,
  pulse_shot: 0.18,
  velvet_smoke: 0.15,
  ghost_serum: 0.08,
  overdrive_x: 0.04
});

function normalizeInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDrugKey(rawKey) {
  const value = String(rawKey || "").trim();
  if (!value) return null;

  if (DRUG_DEFINITIONS[value]) {
    return value;
  }

  const lower = value.toLowerCase();
  const byApiKey = DRUG_KEYS.find((key) => DRUG_DEFINITIONS[key].apiKey.toLowerCase() === lower);
  return byApiKey || null;
}

function buildDrugSelectSql({ tableAlias = "", outputPrefix = "" } = {}) {
  const prefix = tableAlias ? `${tableAlias}.` : "";
  return DRUG_DB_COLUMNS
    .map((column) => `${prefix}${column} AS ${outputPrefix}${column}`)
    .join(", ");
}

function getDrugInventoryFromRow(row, { prefix = "" } = {}) {
  return DRUG_KEYS.reduce((acc, key) => {
    const column = `${prefix}${DRUG_DEFINITIONS[key].inventoryColumn}`;
    acc[key] = normalizeInteger(row?.[column]);
    return acc;
  }, {});
}

function sumDrugInventory(inventory) {
  return DRUG_KEYS.reduce((sum, key) => sum + normalizeInteger(inventory?.[key]), 0);
}

function toApiDrugInventory(inventory) {
  return DRUG_KEYS.reduce((acc, key) => {
    acc[DRUG_DEFINITIONS[key].apiKey] = normalizeInteger(inventory?.[key]);
    return acc;
  }, {});
}

function allocateDrugDistribution(totalUnits) {
  const total = normalizeInteger(totalUnits);
  if (total <= 0) {
    return DRUG_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
  }

  const allocation = {};
  let used = 0;

  DRUG_KEYS.forEach((key, index) => {
    if (index === DRUG_KEYS.length - 1) {
      allocation[key] = Math.max(0, total - used);
      return;
    }
    const ratio = Number(STARTER_DRUG_DISTRIBUTION_RATIOS[key] || 0);
    const value = Math.floor(total * clamp(ratio, 0, 1));
    allocation[key] = value;
    used += value;
  });

  return allocation;
}

module.exports = {
  ONE_HOUR_MS,
  OVERDRIVE_CRASH_MS,
  OVERDRIVE_CRASH_EFFECTS,
  HEAT_BALANCE,
  DRUG_DEFINITIONS,
  DRUG_KEYS,
  DRUG_INVENTORY_COLUMNS,
  DRUG_ACTIVE_UNTIL_COLUMNS,
  DRUG_ACTIVE_DOSE_COLUMNS,
  DRUG_DB_COLUMNS,
  DRUG_RESOURCE_COLUMN_MAP,
  STARTER_DRUG_DISTRIBUTION_RATIOS,
  normalizeInteger,
  normalizeDrugKey,
  buildDrugSelectSql,
  getDrugInventoryFromRow,
  sumDrugInventory,
  toApiDrugInventory,
  allocateDrugDistribution
};
