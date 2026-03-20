const { pool } = require("../config/db");
const { ROUND_DAYS } = require("../config/constants");

async function getOrCreateActiveRound() {
  const res = await pool.query("SELECT * FROM rounds WHERE active = true ORDER BY started_at DESC LIMIT 1");
  if (res.rowCount > 0) return res.rows[0];

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + ROUND_DAYS * 24 * 60 * 60 * 1000);
  const insert = await pool.query(
    "INSERT INTO rounds (started_at, ends_at, active) VALUES ($1, $2, true) RETURNING *",
    [startedAt, endsAt]
  );

  return insert.rows[0];
}

async function getRoundStatus() {
  const round = await getOrCreateActiveRound();
  const now = new Date();
  const endsAt = new Date(round.ends_at);
  const msLeft = Math.max(0, endsAt - now);
  const daysRemaining = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  return {
    roundStartedAt: round.started_at,
    roundEndsAt: round.ends_at,
    daysRemaining
  };
}

module.exports = { getRoundStatus, getOrCreateActiveRound };
