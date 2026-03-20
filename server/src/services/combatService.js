const { pool } = require("../config/db");
const { ATTACK_COOLDOWN_MINUTES, MAX_INFLUENCE } = require("../config/constants");

async function attackDistrict({ playerId, districtId }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cooldown = await client.query(
      "SELECT next_attack_at FROM cooldowns WHERE player_id = $1",
      [playerId]
    );

    if (cooldown.rowCount > 0) {
      const nextAttack = cooldown.rows[0].next_attack_at;
      if (nextAttack && new Date(nextAttack) > new Date()) {
        await client.query("ROLLBACK");
        return { ok: false, error: "cooldown" };
      }
    }

    const districtRes = await client.query(
      `SELECT d.id, d.type, d.influence_level, d.owner_player_id, p.influence_points AS owner_influence
       FROM districts d
       LEFT JOIN players p ON p.id = d.owner_player_id
       WHERE d.id = $1
       FOR UPDATE`,
      [districtId]
    );

    if (districtRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "not_found" };
    }

    const playerRes = await client.query(
      "SELECT money, influence_points FROM players WHERE id = $1 FOR UPDATE",
      [playerId]
    );

    const player = playerRes.rows[0];
    const attackCost = 20;
    if (player.money < attackCost) {
      await client.query("ROLLBACK");
      return { ok: false, error: "insufficient_funds" };
    }

    const district = districtRes.rows[0];
    const defenderInfluence = district.owner_influence || 0;
    const attackerInfluence = player.influence_points || 0;

    const defensePenalty = typeDefensePenalty(district.type);
    const baseChance = 0.5 + (attackerInfluence - defenderInfluence) / 200 - defensePenalty;
    const successChance = Math.min(0.9, Math.max(0.1, baseChance));
    const success = Math.random() < successChance;
    const influenceChange = Math.floor((10 + Math.random() * 16) * typeInfluenceMultiplier(district.type));

    let newInfluence = district.influence_level;
    let newOwner = district.owner_player_id;

    if (success) {
      newInfluence = Math.min(MAX_INFLUENCE, district.influence_level + influenceChange);
      if (!district.owner_player_id || newInfluence >= MAX_INFLUENCE) {
        newOwner = playerId;
      }
    } else {
      newInfluence = Math.max(0, district.influence_level - influenceChange);
      if (newInfluence === 0) {
        newOwner = null;
      }
    }

    await client.query(
      "UPDATE districts SET influence_level = $1, owner_player_id = $2, updated_at = NOW() WHERE id = $3",
      [newInfluence, newOwner, districtId]
    );

    const influenceGain = success ? Math.ceil(influenceChange / 4) : Math.floor(influenceChange / 8);
    await client.query(
      "UPDATE players SET money = money - $1, influence_points = influence_points + $2 WHERE id = $3",
      [attackCost, influenceGain, playerId]
    );

    await client.query(
      `INSERT INTO combat_logs (attacker_player_id, district_id, defender_player_id, success, attack_cost, influence_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [playerId, districtId, district.owner_player_id, success, attackCost, influenceChange]
    );

    const nextAttackAt = new Date(Date.now() + ATTACK_COOLDOWN_MINUTES * 60 * 1000);
    await client.query(
      `INSERT INTO cooldowns (player_id, next_attack_at)
       VALUES ($1, $2)
       ON CONFLICT (player_id) DO UPDATE SET next_attack_at = EXCLUDED.next_attack_at`,
      [playerId, nextAttackAt]
    );

    await client.query("COMMIT");

    return {
      ok: true,
      success,
      influenceChange,
      newOwnerId: newOwner,
      newInfluence
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function typeDefensePenalty(type) {
  switch (type) {
    case "park":
      return 0.1;
    case "residential":
      return 0.05;
    case "downtown":
      return -0.05;
    case "commercial":
      return -0.02;
    case "industrial":
    default:
      return 0;
  }
}

function typeInfluenceMultiplier(type) {
  switch (type) {
    case "downtown":
      return 1.2;
    case "commercial":
      return 1.1;
    case "industrial":
      return 1.0;
    case "residential":
      return 0.95;
    case "park":
    default:
      return 0.85;
  }
}

module.exports = { attackDistrict };
