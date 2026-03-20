const { pool } = require("../config/db");
const { ROUND_DAYS } = require("../config/constants");

async function runRoundTick() {
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

    await pool.query("UPDATE districts SET owner_player_id = NULL, influence_level = 0");
    await pool.query("UPDATE players SET money = 0, influence_points = 0");

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

module.exports = { runRoundTick };
