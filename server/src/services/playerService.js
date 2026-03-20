const { pool } = require("../config/db");

async function getPlayerProfile(playerId) {
  const result = await pool.query(
    `SELECT p.id, p.username, p.gang_name, p.money, p.influence_points,
            p.gang_structure,
            a.name AS alliance_name,
            (SELECT COUNT(*) FROM districts d WHERE d.owner_player_id = p.id) AS district_count
     FROM players p
     LEFT JOIN alliances a ON a.id = p.alliance_id
     WHERE p.id = $1`,
    [playerId]
  );

  return result.rows[0] || null;
}

async function setPlayerStructure(playerId, structure) {
  const result = await pool.query(
    "UPDATE players SET gang_structure = $1 WHERE id = $2 RETURNING gang_structure",
    [structure, playerId]
  );
  return result.rows[0]?.gang_structure || null;
}

module.exports = { getPlayerProfile, setPlayerStructure };
