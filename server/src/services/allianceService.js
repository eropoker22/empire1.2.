const { pool } = require("../config/db");

async function getAlliance(playerId) {
  const res = await pool.query(
    `SELECT a.id, a.name, a.owner_player_id, a.bonus_income_pct, a.bonus_influence_pct
     FROM players p
     LEFT JOIN alliances a ON a.id = p.alliance_id
     WHERE p.id = $1`,
    [playerId]
  );
  const alliance = res.rows[0] || null;
  if (!alliance || !alliance.id) return null;

  const membersRes = await pool.query(
    `SELECT id, username, gang_name
       FROM players
      WHERE alliance_id = $1
      ORDER BY username ASC`,
    [alliance.id]
  );

  return {
    ...alliance,
    members: membersRes.rows,
    member_count: membersRes.rowCount
  };
}

async function createAlliance({ playerId, name }) {
  const res = await pool.query(
    `INSERT INTO alliances (name, owner_player_id)
     VALUES ($1, $2)
     RETURNING id, name, bonus_income_pct, bonus_influence_pct`,
    [name, playerId]
  );

  await pool.query(
    "UPDATE players SET alliance_id = $1 WHERE id = $2",
    [res.rows[0].id, playerId]
  );

  return res.rows[0];
}

async function joinAlliance({ playerId, allianceId }) {
  await pool.query(
    "UPDATE players SET alliance_id = $1 WHERE id = $2",
    [allianceId, playerId]
  );
}

async function leaveAlliance(playerId) {
  await pool.query("UPDATE players SET alliance_id = NULL WHERE id = $1", [playerId]);
}

async function listAlliances() {
  const res = await pool.query(
    `SELECT a.id, a.name, a.owner_player_id, a.bonus_income_pct, a.bonus_influence_pct,
            COUNT(p.id)::int AS member_count
       FROM alliances a
       LEFT JOIN players p ON p.alliance_id = a.id
      GROUP BY a.id
      ORDER BY member_count DESC, a.name ASC`
  );
  return res.rows;
}

module.exports = {
  getAlliance,
  createAlliance,
  joinAlliance,
  leaveAlliance,
  listAlliances
};
