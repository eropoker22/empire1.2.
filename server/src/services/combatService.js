const { pool } = require("../config/db");
const { ATTACK_COOLDOWN_MINUTES, MAX_INFLUENCE } = require("../config/constants");
const { ensureMoneySchema, spendPlayerMoney } = require("./moneyService");

async function attackDistrict({ playerId, districtId }) {
  await ensureMoneySchema();
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
      `SELECT d.id, d.type, d.influence_level, d.owner_player_id, p.influence_points AS owner_influence, p.alliance_id AS owner_alliance_id
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
      "SELECT clean_money, dirty_money, influence_points, alliance_id FROM players WHERE id = $1 FOR UPDATE",
      [playerId]
    );

    if (playerRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "not_found" };
    }

    const player = playerRes.rows[0];
    const district = districtRes.rows[0];

    if (district.owner_player_id === playerId) {
      await client.query("ROLLBACK");
      return { ok: false, error: "own_district" };
    }

    if (player.alliance_id && district.owner_alliance_id && player.alliance_id === district.owner_alliance_id) {
      await client.query("ROLLBACK");
      return { ok: false, error: "allied_district" };
    }

    const mapRes = await client.query(
      "SELECT id, owner_player_id, polygon FROM districts"
    );

    const isAdjacent = isAttackTargetAdjacentToOwnedDistrict({
      districts: mapRes.rows,
      targetDistrictId: district.id,
      playerId
    });

    if (!isAdjacent) {
      await client.query("ROLLBACK");
      return { ok: false, error: "not_adjacent" };
    }

    const attackCost = 20;
    if (Number(player.clean_money || 0) + Number(player.dirty_money || 0) < attackCost) {
      await client.query("ROLLBACK");
      return { ok: false, error: "insufficient_funds" };
    }

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
    await spendPlayerMoney(client, { playerId, amount: attackCost, preferDirty: true });
    await client.query(
      "UPDATE players SET influence_points = influence_points + $1 WHERE id = $2",
      [influenceGain, playerId]
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

function isAttackTargetAdjacentToOwnedDistrict({ districts, targetDistrictId, playerId }) {
  const safeDistricts = Array.isArray(districts) ? districts : [];
  if (!safeDistricts.length || !targetDistrictId || !playerId) return false;

  const targetKey = String(targetDistrictId);
  const districtsById = new Map(
    safeDistricts.map((district) => [String(district.id), district])
  );
  if (!districtsById.has(targetKey)) return false;

  const adjacency = buildDistrictAdjacency(safeDistricts);
  const neighbors = adjacency.get(targetKey);
  if (!neighbors || !neighbors.size) return false;

  for (const neighborKey of neighbors) {
    const neighbor = districtsById.get(neighborKey);
    if (!neighbor) continue;
    if (neighbor.owner_player_id === playerId) {
      return true;
    }
  }

  return false;
}

function buildDistrictAdjacency(districts) {
  const adjacency = new Map();
  const edgeOwners = new Map();

  (districts || []).forEach((district) => {
    const districtKey = String(district.id);
    if (!adjacency.has(districtKey)) {
      adjacency.set(districtKey, new Set());
    }

    const polygon = normalizePolygonPoints(district.polygon);
    if (polygon.length < 2) return;

    for (let i = 0; i < polygon.length; i += 1) {
      const from = polygon[i];
      const to = polygon[(i + 1) % polygon.length];
      const edgeKey = normalizeEdgeKey(from, to);
      if (!edgeOwners.has(edgeKey)) {
        edgeOwners.set(edgeKey, []);
      }
      edgeOwners.get(edgeKey).push(districtKey);
    }
  });

  edgeOwners.forEach((owners) => {
    const uniqueOwners = Array.from(new Set(owners));
    for (let i = 0; i < uniqueOwners.length; i += 1) {
      for (let j = i + 1; j < uniqueOwners.length; j += 1) {
        const a = uniqueOwners[i];
        const b = uniqueOwners[j];
        adjacency.get(a)?.add(b);
        adjacency.get(b)?.add(a);
      }
    }
  });

  return adjacency;
}

function normalizePolygonPoints(polygon) {
  if (!Array.isArray(polygon)) return [];
  return polygon
    .map((point) => {
      if (Array.isArray(point)) {
        return [Number(point[0] || 0), Number(point[1] || 0)];
      }
      if (point && typeof point === "object") {
        return [Number(point.x || 0), Number(point.y || 0)];
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeEdgeKey(from, to) {
  const a = normalizePointKey(from);
  const b = normalizePointKey(to);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function normalizePointKey(point) {
  const x = Number(point?.[0] || 0).toFixed(3);
  const y = Number(point?.[1] || 0).toFixed(3);
  return `${x},${y}`;
}

module.exports = { attackDistrict };
