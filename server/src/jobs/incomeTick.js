const { pool } = require("../config/db");

async function runIncomeTick() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const earnings = await client.query(
      `SELECT d.owner_player_id AS player_id,
              SUM(d.base_income) AS income,
              COALESCE(a.bonus_income_pct, 0) AS bonus_pct
       FROM districts d
       JOIN players p ON p.id = d.owner_player_id
       LEFT JOIN alliances a ON a.id = p.alliance_id
       WHERE d.owner_player_id IS NOT NULL
       GROUP BY d.owner_player_id, a.bonus_income_pct`
    );

    for (const row of earnings.rows) {
      const income = Number(row.income);
      const bonusPct = Number(row.bonus_pct || 0);
      const payout = Math.floor(income * (1 + bonusPct / 100));
      await client.query(
        "UPDATE players SET money = money + $1 WHERE id = $2",
        [payout, row.player_id]
      );
      await client.query(
        "INSERT INTO economy_ledger (player_id, delta, reason) VALUES ($1, $2, $3)",
        [row.player_id, payout, "income_tick"]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runIncomeTick };
