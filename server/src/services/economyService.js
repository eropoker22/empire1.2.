const { pool } = require("../config/db");
const { ensureMarketSchema } = require("./marketService");

async function getEconomyStatus(playerId) {
  await ensureMarketSchema();
  const balanceRes = await pool.query(
    `SELECT money, influence_points, alliance_id, drugs, garage, weapons, defense, materials, data_shards
       FROM players
      WHERE id = $1`,
    [playerId]
  );
  const player = balanceRes.rows[0];

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

  return {
    balance: Number(player.money),
    incomePerHour: income,
    influence: Number(player.influence_points),
    drugs: Number(player.drugs || 0),
    garage: Number(player.garage || 0),
    weapons: Number(player.weapons || 0),
    defense: Number(player.defense || 0),
    materials: Number(player.materials || 0),
    dataShards: Number(player.data_shards || 0)
  };
}

module.exports = { getEconomyStatus };
