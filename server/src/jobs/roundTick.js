const { pool } = require("../config/db");
const { ROUND_DAYS } = require("../config/constants");
const { ensureMoneySchema } = require("../services/moneyService");
const { ensureDrugSchema } = require("../services/drugService");
const { ensureDistrictDestructionSchema } = require("../services/districtService");

async function runRoundTick() {
  await ensureMoneySchema();
  await ensureDrugSchema();
  await ensureDistrictDestructionSchema();
  const activeRes = await pool.query("SELECT * FROM rounds WHERE active = true ORDER BY started_at DESC LIMIT 1");
  if (activeRes.rowCount === 0) return;

  const round = activeRes.rows[0];
  const now = new Date();
  if (new Date(round.ends_at) > now) return;

  await pool.query("BEGIN");
  try {
    await pool.query("UPDATE rounds SET active = false WHERE id = $1", [round.id]);

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + ROUND_DAYS * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO rounds (started_at, ends_at, active) VALUES ($1, $2, true)",
      [startedAt, endsAt]
    );

    await pool.query(
      "UPDATE districts SET owner_player_id = NULL, influence_level = 0, is_destroyed = false, destroyed_at = NULL"
    );
    await pool.query(`
      UPDATE players
         SET money = 0,
             clean_money = 0,
             dirty_money = 0,
             influence_points = 0,
             heat = 0,
             drug_neon_dust_active_until = NULL,
             drug_pulse_shot_active_until = NULL,
             drug_velvet_smoke_active_until = NULL,
             drug_ghost_serum_active_until = NULL,
             drug_overdrive_x_active_until = NULL,
             drug_neon_dust_active_dose = 0,
             drug_pulse_shot_active_dose = 0,
             drug_velvet_smoke_active_dose = 0,
             drug_ghost_serum_active_dose = 0,
             drug_overdrive_x_active_dose = 0
    `);

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

module.exports = { runRoundTick };
