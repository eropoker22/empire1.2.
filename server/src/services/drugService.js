const { pool } = require("../config/db");
const { ensureMoneySchema } = require("./moneyService");
const {
  ONE_HOUR_MS,
  OVERDRIVE_CRASH_MS,
  OVERDRIVE_CRASH_EFFECTS,
  HEAT_BALANCE,
  DRUG_DEFINITIONS,
  DRUG_KEYS,
  DRUG_INVENTORY_COLUMNS,
  DRUG_DB_COLUMNS,
  normalizeInteger,
  normalizeDrugKey,
  buildDrugSelectSql,
  getDrugInventoryFromRow,
  sumDrugInventory,
  toApiDrugInventory
} = require("../config/drugs");

let drugSchemaReady = false;

async function ensureDrugSchema() {
  if (drugSchemaReady) return;
  await ensureMoneySchema();

  await pool.query(`
    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS heat INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_neon_dust INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_pulse_shot INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_velvet_smoke INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_ghost_serum INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_overdrive_x INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_neon_dust_active_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS drug_pulse_shot_active_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS drug_velvet_smoke_active_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS drug_ghost_serum_active_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS drug_overdrive_x_active_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS drug_neon_dust_active_dose INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_pulse_shot_active_dose INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_velvet_smoke_active_dose INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_ghost_serum_active_dose INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS drug_overdrive_x_active_dose INT NOT NULL DEFAULT 0
  `);

  await pool.query(`
    UPDATE players
       SET drug_neon_dust = FLOOR(COALESCE(drugs, 0) * 0.55)::int,
           drug_pulse_shot = FLOOR(COALESCE(drugs, 0) * 0.18)::int,
           drug_velvet_smoke = FLOOR(COALESCE(drugs, 0) * 0.15)::int,
           drug_ghost_serum = FLOOR(COALESCE(drugs, 0) * 0.08)::int,
           drug_overdrive_x = GREATEST(
             0,
             COALESCE(drugs, 0)
             - FLOOR(COALESCE(drugs, 0) * 0.55)::int
             - FLOOR(COALESCE(drugs, 0) * 0.18)::int
             - FLOOR(COALESCE(drugs, 0) * 0.15)::int
             - FLOOR(COALESCE(drugs, 0) * 0.08)::int
           )
     WHERE COALESCE(drugs, 0) > 0
       AND (
         COALESCE(drug_neon_dust, 0)
         + COALESCE(drug_pulse_shot, 0)
         + COALESCE(drug_velvet_smoke, 0)
         + COALESCE(drug_ghost_serum, 0)
         + COALESCE(drug_overdrive_x, 0)
       ) = 0
  `);

  await pool.query(`
    UPDATE players
       SET drugs = COALESCE(drug_neon_dust, 0)
         + COALESCE(drug_pulse_shot, 0)
         + COALESCE(drug_velvet_smoke, 0)
         + COALESCE(drug_ghost_serum, 0)
         + COALESCE(drug_overdrive_x, 0)
     WHERE COALESCE(drugs, 0) <> (
       COALESCE(drug_neon_dust, 0)
       + COALESCE(drug_pulse_shot, 0)
       + COALESCE(drug_velvet_smoke, 0)
       + COALESCE(drug_ghost_serum, 0)
       + COALESCE(drug_overdrive_x, 0)
     )
  `);

  drugSchemaReady = true;
}

function parseTimestampMs(rawValue) {
  if (!rawValue) return 0;
  const ms = new Date(rawValue).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeRaidRiskFromHeat(heatValue, raidRiskModifier = 0) {
  const heat = normalizeInteger(heatValue);
  const tier1 = Number(HEAT_BALANCE.raidRiskHeatTier1 || 40);
  const tier2 = Number(HEAT_BALANCE.raidRiskHeatTier2 || 100);
  const slope1 = Number(HEAT_BALANCE.raidRiskSlopeTier1 || 0.45);
  const slope2 = Number(HEAT_BALANCE.raidRiskSlopeTier2 || 0.6);
  const slope3 = Number(HEAT_BALANCE.raidRiskSlopeTier3 || 0.35);
  const base = Number(HEAT_BALANCE.baseRaidRiskPct || 4);
  const maxRisk = Number(HEAT_BALANCE.maxRaidRiskPct || 95);

  let fromHeat = 0;
  if (heat <= tier1) {
    fromHeat = heat * slope1;
  } else if (heat <= tier2) {
    fromHeat = tier1 * slope1 + (heat - tier1) * slope2;
  } else {
    fromHeat = tier1 * slope1 + (tier2 - tier1) * slope2 + (heat - tier2) * slope3;
  }

  return clamp(
    Math.round(base + fromHeat + Number(raidRiskModifier || 0)),
    0,
    maxRisk
  );
}

function getDrugRuntimeFromRow(row, { prefix = "", nowMs = Date.now() } = {}) {
  const inventory = getDrugInventoryFromRow(row, { prefix });
  const activeByKey = {};

  DRUG_KEYS.forEach((key) => {
    const definition = DRUG_DEFINITIONS[key];
    const activeUntilMs = parseTimestampMs(row?.[`${prefix}${definition.activeUntilColumn}`]);
    const dose = normalizeInteger(row?.[`${prefix}${definition.activeDoseColumn}`]);
    const isActive = activeUntilMs > nowMs && dose > 0;
    const remainingMs = isActive ? Math.max(0, activeUntilMs - nowMs) : 0;

    activeByKey[key] = {
      active: isActive,
      dose,
      endsAt: activeUntilMs > 0 ? new Date(activeUntilMs).toISOString() : null,
      remainingMs
    };
  });

  const overdriveUntilMs = parseTimestampMs(row?.[`${prefix}${DRUG_DEFINITIONS.overdrive_x.activeUntilColumn}`]);
  const overdriveCrashActive = overdriveUntilMs > 0
    && overdriveUntilMs <= nowMs
    && nowMs < overdriveUntilMs + OVERDRIVE_CRASH_MS;
  const overdriveCrashRemainingMs = overdriveCrashActive
    ? Math.max(0, overdriveUntilMs + OVERDRIVE_CRASH_MS - nowMs)
    : 0;

  const modifiers = {
    incomeMultiplier: 1,
    dirtyIncomeMultiplier: 1,
    productionSpeedMultiplier: 1,
    influenceGainMultiplier: 1,
    attackPowerMultiplier: 1,
    defensePowerMultiplier: 1,
    heatGainMultiplier: 1,
    raidRiskPctModifier: 0,
    hourlyHeatGain: 0
  };

  if (activeByKey.neon_dust.active) {
    const effects = DRUG_DEFINITIONS.neon_dust.effects || {};
    modifiers.incomeMultiplier *= Number(effects.incomeMultiplier || 1);
    modifiers.dirtyIncomeMultiplier *= Number(effects.dirtyIncomeMultiplier || 1);
    const largeDoseThreshold = Number(DRUG_DEFINITIONS.neon_dust.largeDoseThreshold || 5);
    if (activeByKey.neon_dust.dose >= largeDoseThreshold) {
      modifiers.hourlyHeatGain += normalizeInteger(effects.hourlyHeatOnLargeDose);
    }
  }

  if (activeByKey.pulse_shot.active) {
    const effects = DRUG_DEFINITIONS.pulse_shot.effects || {};
    modifiers.productionSpeedMultiplier *= Number(effects.productionSpeedMultiplier || 1);
    modifiers.incomeMultiplier *= Number(effects.incomeMultiplier || 1);
    modifiers.influenceGainMultiplier *= Number(effects.influenceGainMultiplier || 1);
  }

  if (activeByKey.velvet_smoke.active) {
    const effects = DRUG_DEFINITIONS.velvet_smoke.effects || {};
    modifiers.incomeMultiplier *= Number(effects.incomeMultiplier || 1);
    modifiers.influenceGainMultiplier *= Number(effects.influenceGainMultiplier || 1);
    modifiers.raidRiskPctModifier += Number(effects.raidRiskPctModifier || 0);
  }

  if (activeByKey.ghost_serum.active) {
    const effects = DRUG_DEFINITIONS.ghost_serum.effects || {};
    modifiers.incomeMultiplier *= Number(effects.incomeMultiplier || 1);
    modifiers.heatGainMultiplier *= Number(effects.heatGainMultiplier || 1);
    modifiers.raidRiskPctModifier += Number(effects.raidRiskPctModifier || 0);
  }

  if (activeByKey.overdrive_x.active) {
    const effects = DRUG_DEFINITIONS.overdrive_x.effects || {};
    modifiers.incomeMultiplier *= Number(effects.incomeMultiplier || 1);
    modifiers.dirtyIncomeMultiplier *= Number(effects.dirtyIncomeMultiplier || 1);
    modifiers.attackPowerMultiplier *= Number(effects.attackPowerMultiplier || 1);
    modifiers.defensePowerMultiplier *= Number(effects.defensePowerMultiplier || 1);
    modifiers.raidRiskPctModifier += Number(effects.raidRiskPctModifier || 0);
  }

  if (overdriveCrashActive) {
    modifiers.incomeMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.incomeMultiplier || 1);
    modifiers.dirtyIncomeMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.dirtyIncomeMultiplier || 1);
    modifiers.productionSpeedMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.productionSpeedMultiplier || 1);
    modifiers.influenceGainMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.influenceGainMultiplier || 1);
    modifiers.attackPowerMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.attackPowerMultiplier || 1);
    modifiers.defensePowerMultiplier *= Number(OVERDRIVE_CRASH_EFFECTS.defensePowerMultiplier || 1);
  }

  modifiers.hourlyHeatGain = Math.max(
    0,
    Math.round(modifiers.hourlyHeatGain * modifiers.heatGainMultiplier)
  );

  const currentHeat = normalizeInteger(row?.[`${prefix}heat`]);
  const raidRiskPct = computeRaidRiskFromHeat(currentHeat, modifiers.raidRiskPctModifier);

  return {
    inventory,
    totalUnits: sumDrugInventory(inventory),
    activeByKey,
    overdriveCrash: {
      active: overdriveCrashActive,
      remainingMs: overdriveCrashRemainingMs,
      endsAt: overdriveCrashActive ? new Date(nowMs + overdriveCrashRemainingMs).toISOString() : null
    },
    modifiers,
    heat: currentHeat,
    raidRiskPct
  };
}

function mapActiveDrugsToApi(activeByKey, overdriveCrash) {
  const payload = {};
  DRUG_KEYS.forEach((key) => {
    const definition = DRUG_DEFINITIONS[key];
    const value = activeByKey[key] || { active: false, dose: 0, endsAt: null, remainingMs: 0 };
    payload[definition.apiKey] = {
      active: Boolean(value.active),
      dose: normalizeInteger(value.dose),
      remainingSeconds: Math.ceil((Number(value.remainingMs || 0) || 0) / 1000),
      endsAt: value.endsAt
    };
  });
  payload.overdriveCrash = {
    active: Boolean(overdriveCrash?.active),
    remainingSeconds: Math.ceil((Number(overdriveCrash?.remainingMs || 0) || 0) / 1000),
    endsAt: overdriveCrash?.endsAt || null
  };
  return payload;
}

function serializeDrugStatus(runtime) {
  return {
    drugs: runtime.totalUnits,
    drugInventory: toApiDrugInventory(runtime.inventory),
    activeDrugs: mapActiveDrugsToApi(runtime.activeByKey, runtime.overdriveCrash),
    heat: runtime.heat,
    raidRiskPct: runtime.raidRiskPct,
    modifiers: {
      incomeMultiplier: runtime.modifiers.incomeMultiplier,
      dirtyIncomeMultiplier: runtime.modifiers.dirtyIncomeMultiplier,
      productionSpeedMultiplier: runtime.modifiers.productionSpeedMultiplier,
      influenceGainMultiplier: runtime.modifiers.influenceGainMultiplier,
      attackPowerMultiplier: runtime.modifiers.attackPowerMultiplier,
      defensePowerMultiplier: runtime.modifiers.defensePowerMultiplier,
      heatGainMultiplier: runtime.modifiers.heatGainMultiplier,
      hourlyHeatGain: runtime.modifiers.hourlyHeatGain
    }
  };
}

function projectHeatGain(baseHeat, runtime) {
  const safeBase = normalizeInteger(baseHeat);
  if (!safeBase) return 0;
  const multiplier = Number(runtime?.modifiers?.heatGainMultiplier || 1);
  return Math.max(0, Math.round(safeBase * multiplier));
}

async function getPlayerDrugStatus(playerId) {
  await ensureDrugSchema();
  const result = await pool.query(
    `SELECT heat, ${buildDrugSelectSql()}
       FROM players
      WHERE id = $1`,
    [playerId]
  );
  if (result.rowCount === 0) {
    const error = new Error("player_not_found");
    error.status = 404;
    throw error;
  }
  const runtime = getDrugRuntimeFromRow(result.rows[0]);
  return serializeDrugStatus(runtime);
}

async function useDrug({ playerId, drugKey, amount = 1 }) {
  await ensureDrugSchema();

  const normalizedDrugKey = normalizeDrugKey(drugKey);
  if (!normalizedDrugKey) {
    const error = new Error("invalid_drug_key");
    error.status = 400;
    throw error;
  }

  const safeAmount = normalizeInteger(amount);
  if (safeAmount <= 0) {
    const error = new Error("invalid_drug_amount");
    error.status = 400;
    throw error;
  }

  const definition = DRUG_DEFINITIONS[normalizedDrugKey];
  const inventoryColumn = definition.inventoryColumn;
  const activeUntilColumn = definition.activeUntilColumn;
  const activeDoseColumn = definition.activeDoseColumn;
  const activationHeat = normalizeInteger(definition.activationHeat) * safeAmount;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const playerRes = await client.query(
      `SELECT heat, ${buildDrugSelectSql()}
         FROM players
        WHERE id = $1
        FOR UPDATE`,
      [playerId]
    );
    if (playerRes.rowCount === 0) {
      const error = new Error("player_not_found");
      error.status = 404;
      throw error;
    }

    const playerRow = playerRes.rows[0];
    const available = normalizeInteger(playerRow[inventoryColumn]);
    if (available < safeAmount) {
      const error = new Error("insufficient_drug_inventory");
      error.status = 400;
      throw error;
    }

    const nowMs = Date.now();
    const currentUntilMs = parseTimestampMs(playerRow[activeUntilColumn]);
    const currentDose = normalizeInteger(playerRow[activeDoseColumn]);
    const startsFromMs = Math.max(nowMs, currentUntilMs);
    const nextUntilMs = startsFromMs + Number(definition.durationMs || 0) * safeAmount;
    const nextDose = currentUntilMs > nowMs ? currentDose + safeAmount : safeAmount;

    const updatedRes = await client.query(
      `UPDATE players
          SET ${inventoryColumn} = ${inventoryColumn} - $1,
              ${activeUntilColumn} = $2,
              ${activeDoseColumn} = $3,
              heat = heat + $4,
              drugs = GREATEST(0, COALESCE(drugs, 0) - $1),
              updated_at = NOW()
        WHERE id = $5
        RETURNING heat, ${buildDrugSelectSql()}`,
      [safeAmount, new Date(nextUntilMs), nextDose, activationHeat, playerId]
    );

    await client.query("COMMIT");

    const runtime = getDrugRuntimeFromRow(updatedRes.rows[0]);
    return {
      ok: true,
      used: {
        drugKey: normalizedDrugKey,
        amount: safeAmount
      },
      ...serializeDrugStatus(runtime)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  ensureDrugSchema,
  computeRaidRiskFromHeat,
  getDrugRuntimeFromRow,
  serializeDrugStatus,
  projectHeatGain,
  getPlayerDrugStatus,
  useDrug,
  DRUG_DEFINITIONS,
  DRUG_KEYS,
  DRUG_INVENTORY_COLUMNS,
  DRUG_DB_COLUMNS,
  buildDrugSelectSql,
  getDrugInventoryFromRow,
  sumDrugInventory,
  toApiDrugInventory,
  ONE_HOUR_MS
};
