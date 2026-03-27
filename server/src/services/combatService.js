const { pool } = require("../config/db");
const { ATTACK_COOLDOWN_SECONDS, MAX_INFLUENCE } = require("../config/constants");
const { ensureMoneySchema, spendPlayerMoney } = require("./moneyService");
const { HEAT_BALANCE } = require("../config/drugs");
const { ensureDistrictDestructionSchema } = require("./districtService");
const {
  ensureDrugSchema,
  getDrugRuntimeFromRow,
  projectHeatGain
} = require("./drugService");

const DISTRICT_DESTROY_CHANCE = 0.1;
const COMBAT_WEAPON_TIERS = Object.freeze({
  attack: [
    { name: "Baseballová pálka", requiredMembers: 50, power: 10 },
    { name: "Pouliční pistole", requiredMembers: 100, power: 20 },
    { name: "Granát", requiredMembers: 150, power: 30 },
    { name: "Samopal", requiredMembers: 200, power: 40 },
    { name: "Bazuka", requiredMembers: 250, power: 50 }
  ],
  defense: [
    { name: "Neprůstřelná vesta", requiredMembers: 50, power: 10 },
    { name: "Ocelové barikády", requiredMembers: 100, power: 20 },
    { name: "Bezpečnostní kamery", requiredMembers: 150, power: 30 },
    { name: "Automatické kulometné stanoviště", requiredMembers: 200, power: 40 },
    { name: "Alarm", requiredMembers: 250, power: 50 }
  ]
});
const DISTRICT_POPULATION_WEIGHTS = Object.freeze({
  downtown: 3600,
  commercial: 2600,
  residential: 5400,
  industrial: 1900,
  park: 1300
});

async function attackDistrict({ playerId, districtId }) {
  await ensureMoneySchema();
  await ensureDrugSchema();
  await ensureDistrictDestructionSchema();
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
      `SELECT d.id, d.type, d.influence_level, d.owner_player_id, d.is_destroyed,
              p.influence_points AS owner_influence,
              p.alliance_id AS owner_alliance_id,
              p.weapons AS owner_weapons,
              p.defense AS owner_defense,
              p.heat AS owner_heat,
              p.drug_neon_dust AS owner_drug_neon_dust,
              p.drug_pulse_shot AS owner_drug_pulse_shot,
              p.drug_velvet_smoke AS owner_drug_velvet_smoke,
              p.drug_ghost_serum AS owner_drug_ghost_serum,
              p.drug_overdrive_x AS owner_drug_overdrive_x,
              p.drug_neon_dust_active_until AS owner_drug_neon_dust_active_until,
              p.drug_pulse_shot_active_until AS owner_drug_pulse_shot_active_until,
              p.drug_velvet_smoke_active_until AS owner_drug_velvet_smoke_active_until,
              p.drug_ghost_serum_active_until AS owner_drug_ghost_serum_active_until,
              p.drug_overdrive_x_active_until AS owner_drug_overdrive_x_active_until,
              p.drug_neon_dust_active_dose AS owner_drug_neon_dust_active_dose,
              p.drug_pulse_shot_active_dose AS owner_drug_pulse_shot_active_dose,
              p.drug_velvet_smoke_active_dose AS owner_drug_velvet_smoke_active_dose,
              p.drug_ghost_serum_active_dose AS owner_drug_ghost_serum_active_dose,
              p.drug_overdrive_x_active_dose AS owner_drug_overdrive_x_active_dose
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
      `SELECT clean_money, dirty_money, influence_points, alliance_id, heat, weapons, defense,
              drug_neon_dust, drug_pulse_shot, drug_velvet_smoke, drug_ghost_serum, drug_overdrive_x,
              drug_neon_dust_active_until, drug_pulse_shot_active_until, drug_velvet_smoke_active_until, drug_ghost_serum_active_until, drug_overdrive_x_active_until,
              drug_neon_dust_active_dose, drug_pulse_shot_active_dose, drug_velvet_smoke_active_dose, drug_ghost_serum_active_dose, drug_overdrive_x_active_dose
         FROM players
        WHERE id = $1
        FOR UPDATE`,
      [playerId]
    );

    if (playerRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "not_found" };
    }

    const player = playerRes.rows[0];
    const district = districtRes.rows[0];
    if (district.is_destroyed) {
      await client.query("ROLLBACK");
      return { ok: false, error: "destroyed_district" };
    }
    const attackerDrugs = getDrugRuntimeFromRow(player);
    const defenderDrugs = district.owner_player_id
      ? getDrugRuntimeFromRow(district, { prefix: "owner_" })
      : null;
    const attackerGangMembers = await estimateGangMembers(client, playerId);
    const defenderGangMembers = district.owner_player_id
      ? await estimateGangMembers(client, district.owner_player_id)
      : 0;
    const attackerWeaponTier = resolveCombatWeaponTier("attack", attackerGangMembers);
    const defenderWeaponTier = district.owner_player_id
      && Number(district.owner_defense || 0) > 0
      ? resolveCombatWeaponTier("defense", defenderGangMembers)
      : null;

    if (Number(player.weapons || 0) <= 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "insufficient_weapons" };
    }
    if (!attackerWeaponTier) {
      await client.query("ROLLBACK");
      return { ok: false, error: "insufficient_members" };
    }

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

    const sourceDistrictId = resolveOwnedAdjacentDistrictId({
      districts: mapRes.rows,
      targetDistrictId: district.id,
      playerId
    });

    if (sourceDistrictId == null) {
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
    const attackerCombatPower = Number(attackerDrugs.modifiers.attackPowerMultiplier || 1)
      * (1 + Number(attackerWeaponTier.power || 0) / 100);
    const defenderCombatPower = Number(defenderDrugs?.modifiers?.defensePowerMultiplier || 1)
      * (1 + Number(defenderWeaponTier?.power || 0) / 100);
    const combatPowerDelta = ((attackerCombatPower / Math.max(0.1, defenderCombatPower)) - 1) * 0.25;
    const baseChance = 0.5
      + (attackerInfluence - defenderInfluence) / 200
      - defensePenalty
      + combatPowerDelta;
    const successChance = Math.min(0.95, Math.max(0.1, baseChance));
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
    const destroyed = Math.random() < DISTRICT_DESTROY_CHANCE;
    if (destroyed) {
      newInfluence = 0;
      newOwner = null;
    }

    await client.query(
      `UPDATE districts
          SET influence_level = $1,
              owner_player_id = $2,
              is_destroyed = $3,
              destroyed_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
              updated_at = NOW()
        WHERE id = $4`,
      [newInfluence, newOwner, destroyed, districtId]
    );

    const baseInfluenceGain = success ? Math.ceil(influenceChange / 4) : Math.floor(influenceChange / 8);
    const influenceGain = Math.max(
      0,
      Math.floor(baseInfluenceGain * Number(attackerDrugs.modifiers.influenceGainMultiplier || 1))
    );
    await spendPlayerMoney(client, { playerId, amount: attackCost, preferDirty: true });
    await client.query(
      "UPDATE players SET influence_points = influence_points + $1 WHERE id = $2",
      [influenceGain, playerId]
    );

    const attackHeatBase = attackerDrugs.activeByKey.overdrive_x?.active
      ? Number(HEAT_BALANCE.overdriveAttackHeatGain || 5)
      : Number(HEAT_BALANCE.baseAttackHeatGain || 2);
    const attackHeatGain = projectHeatGain(attackHeatBase, attackerDrugs);
    if (attackHeatGain > 0) {
      await client.query(
        `UPDATE players
            SET heat = heat + $1,
                updated_at = NOW()
          WHERE id = $2`,
        [attackHeatGain, playerId]
      );
    }

    await client.query(
      `INSERT INTO combat_logs (attacker_player_id, district_id, defender_player_id, success, attack_cost, influence_change)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [playerId, districtId, district.owner_player_id, success, attackCost, influenceChange]
    );

    const nextAttackAt = new Date(Date.now() + ATTACK_COOLDOWN_SECONDS * 1000);
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
      destroyed,
      influenceChange,
      heatGain: attackHeatGain,
      sourceDistrictId,
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

async function estimateGangMembers(client, playerId) {
  const result = await client.query(
    "SELECT type FROM districts WHERE owner_player_id = $1",
    [playerId]
  );
  return result.rows.reduce((sum, row) => sum + (DISTRICT_POPULATION_WEIGHTS[String(row.type || "").trim().toLowerCase()] || 2200), 0);
}

function resolveCombatWeaponTier(category, gangMembers) {
  const tiers = COMBAT_WEAPON_TIERS[category] || [];
  const eligible = tiers.filter((tier) => Number(gangMembers || 0) >= Number(tier.requiredMembers || 0));
  return eligible.length ? eligible[eligible.length - 1] : null;
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
  return resolveOwnedAdjacentDistrictId({ districts, targetDistrictId, playerId }) != null;
}

function resolveOwnedAdjacentDistrictId({ districts, targetDistrictId, playerId }) {
  const safeDistricts = Array.isArray(districts) ? districts : [];
  if (!safeDistricts.length || !targetDistrictId || !playerId) return null;

  const targetKey = String(targetDistrictId);
  const playerKey = String(playerId);
  const districtsById = new Map(
    safeDistricts.map((district) => [String(district.id), district])
  );
  if (!districtsById.has(targetKey)) return null;

  const adjacency = buildDistrictAdjacency(safeDistricts);
  const neighbors = adjacency.get(targetKey);
  if (!neighbors || !neighbors.size) return null;

  const ownedNeighbors = [];

  for (const neighborKey of neighbors) {
    const neighbor = districtsById.get(neighborKey);
    if (!neighbor) continue;
    if (String(neighbor.owner_player_id) === playerKey) {
      ownedNeighbors.push(neighbor.id);
    }
  }

  if (!ownedNeighbors.length) return null;

  const numericOwned = ownedNeighbors
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (numericOwned.length) {
    numericOwned.sort((a, b) => a - b);
    return numericOwned[0];
  }
  return String(ownedNeighbors[0]);
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
