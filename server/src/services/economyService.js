const { pool } = require("../config/db");
const { ensureMarketSchema } = require("./marketService");
const { ensureMoneySchema, normalizeMoneyRow } = require("./moneyService");
const { ensureDrugSchema, getDrugRuntimeFromRow, serializeDrugStatus } = require("./drugService");

async function getEconomyStatus(playerId) {
  await ensureMarketSchema();
  await ensureMoneySchema();
  await ensureDrugSchema();
  const balanceRes = await pool.query(
    `SELECT money, clean_money, dirty_money, influence_points, alliance_id, heat, drugs,
            weapons, defense, materials, data_shards,
            drug_neon_dust, drug_pulse_shot, drug_velvet_smoke, drug_ghost_serum, drug_overdrive_x,
            drug_neon_dust_active_until, drug_pulse_shot_active_until, drug_velvet_smoke_active_until, drug_ghost_serum_active_until, drug_overdrive_x_active_until,
            drug_neon_dust_active_dose, drug_pulse_shot_active_dose, drug_velvet_smoke_active_dose, drug_ghost_serum_active_dose, drug_overdrive_x_active_dose
       FROM players
      WHERE id = $1`,
    [playerId]
  );
  const player = balanceRes.rows[0];
  if (!player) {
    const error = new Error("player_not_found");
    error.status = 404;
    throw error;
  }
  const money = normalizeMoneyRow(player);
  const drugRuntime = getDrugRuntimeFromRow(player);
  const drugStatus = serializeDrugStatus(drugRuntime);

  const districtRes = await pool.query(
    "SELECT COALESCE(SUM(base_income), 0) AS income FROM districts WHERE owner_player_id = $1",
    [playerId]
  );

  let income = Number(districtRes.rows[0].income);

  if (player.alliance_id) {
    const allianceRes = await pool.query(
      "SELECT bonus_income_pct FROM alliances WHERE id = $1",
      [player.alliance_id]
    );
    const bonusPct = allianceRes.rows[0]?.bonus_income_pct || 0;
    income = Math.floor(income * (1 + bonusPct / 100));
  }

  income = Math.floor(income * drugRuntime.modifiers.incomeMultiplier * drugRuntime.modifiers.dirtyIncomeMultiplier);

  return {
    balance: money.totalMoney,
    cleanMoney: money.cleanMoney,
    dirtyMoney: money.dirtyMoney,
    incomePerHour: income,
    influence: Number(player.influence_points),
    drugs: drugStatus.drugs,
    drugInventory: drugStatus.drugInventory,
    activeDrugs: drugStatus.activeDrugs,
    weapons: Number(player.weapons || 0),
    defense: Number(player.defense || 0),
    materials: Number(player.materials || 0),
    dataShards: Number(player.data_shards || 0),
    heat: Number(player.heat || 0),
    raidRiskPct: drugStatus.raidRiskPct,
    drugModifiers: drugStatus.modifiers
  };
}

module.exports = { getEconomyStatus };
