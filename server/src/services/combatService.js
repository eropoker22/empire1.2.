const { pool } = require("../config/db");
const { ATTACK_COOLDOWN_SECONDS, ATTACK_ACTION_DURATION_SECONDS, MAX_INFLUENCE } = require("../config/constants");
const { ensureMoneySchema, spendPlayerMoney } = require("./moneyService");
const { HEAT_BALANCE } = require("../config/drugs");
const { ensureDistrictDestructionSchema } = require("./districtService");
const {
  ensureDrugSchema,
  getDrugRuntimeFromRow,
  projectHeatGain
} = require("./drugService");

const DISTRICT_DESTROY_CHANCE = 0.08;
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
let attackTargetCooldownSchemaEnsured = false;

async function ensureAttackTargetCooldownSchema(client) {
  if (attackTargetCooldownSchemaEnsured) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS attack_target_cooldowns (
      attacker_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      target_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      next_attack_at TIMESTAMP NOT NULL,
      PRIMARY KEY (attacker_player_id, target_player_id)
    )
  `);
  attackTargetCooldownSchemaEnsured = true;
}

async function attackDistrict({ playerId, districtId }) {
  await ensureMoneySchema();
  await ensureDrugSchema();
  await ensureDistrictDestructionSchema();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureAttackTargetCooldownSchema(client);

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

    const targetPlayerId = district.owner_player_id || null;
    if (targetPlayerId) {
      const cooldown = await client.query(
        `SELECT next_attack_at
           FROM attack_target_cooldowns
          WHERE attacker_player_id = $1
            AND target_player_id = $2`,
        [playerId, targetPlayerId]
      );
      if (cooldown.rowCount > 0) {
        const nextAttack = cooldown.rows[0].next_attack_at;
        const now = Date.now();
        const nextAttackMs = nextAttack ? new Date(nextAttack).getTime() : 0;
        if (nextAttackMs > now) {
          await client.query("ROLLBACK");
          return {
            ok: false,
            error: "cooldown",
            cooldownMs: Math.max(0, nextAttackMs - now),
            targetPlayerId
          };
        }
      }
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
    const attackerPower = Number(attackerDrugs.modifiers.attackPowerMultiplier || 1)
      * (1 + Number(attackerWeaponTier.power || 0) / 100);
    const defenderPower = Number(defenderDrugs?.modifiers?.defensePowerMultiplier || 1)
      * (1 + Number(defenderWeaponTier?.power || 0) / 100);
    const attackScore = attackerPower * (1 + Math.max(0, Number(attackerInfluence || 0)) / 500);
    const defenseScore = defenderPower * (1 + Math.max(0, Number(defenderInfluence || 0)) / 500) * (1 + defensePenalty);

    const catastrophe = Math.random() < DISTRICT_DESTROY_CHANCE;
    let outcomeKey = "failure";
    if (catastrophe) {
      outcomeKey = "catastrophe";
    } else if (attackScore > defenseScore) {
      outcomeKey = Math.random() < 0.7 ? "total_success" : "pyrrhic_victory";
    }

    const attackPowerDisplay = Math.max(1, Math.round(attackScore * 100));
    const defensePowerDisplay = Math.max(1, Math.round(defenseScore * 100));
    const attackStrengthGap = attackPowerDisplay - defensePowerDisplay;

    let newInfluence = district.influence_level;
    let newOwner = district.owner_player_id;
    let destroyed = false;
    let defenderDefenseLossPct = 0;
    let defenderInfluenceLossPct = 0;
    let districtDestroyed = false;

    if (outcomeKey === "total_success") {
      newInfluence = MAX_INFLUENCE;
      newOwner = playerId;
      defenderDefenseLossPct = 100;
      defenderInfluenceLossPct = 100;
    } else if (outcomeKey === "pyrrhic_victory") {
      newInfluence = Math.max(0, Math.floor(Number(district.influence_level || 0) * 0.75));
      defenderDefenseLossPct = 100;
      defenderInfluenceLossPct = 25;
    } else if (outcomeKey === "failure") {
      newInfluence = Math.max(0, Math.floor(Number(district.influence_level || 0) * 0.8));
      defenderDefenseLossPct = 20;
      defenderInfluenceLossPct = 20;
    } else if (outcomeKey === "catastrophe") {
      destroyed = true;
      districtDestroyed = true;
      newInfluence = 0;
      newOwner = null;
      defenderDefenseLossPct = 100;
      defenderInfluenceLossPct = 100;
    }

    if (destroyed) {
      newInfluence = 0;
      newOwner = null;
    }

    if (district.owner_player_id && defenderDefenseLossPct > 0) {
      const defenseLossMultiplier = Math.max(0, 1 - (defenderDefenseLossPct / 100));
      await client.query(
        `UPDATE players
            SET defense = GREATEST(0, FLOOR(defense * $1)::int),
                updated_at = NOW()
          WHERE id = $2`,
        [defenseLossMultiplier, district.owner_player_id]
      );
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

    const influenceChange = Math.floor((10 + Math.random() * 16) * typeInfluenceMultiplier(district.type));
    const baseInfluenceGain = outcomeKey === "total_success"
      ? Math.ceil(influenceChange / 4)
      : Math.floor(influenceChange / 8);
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
      [playerId, districtId, district.owner_player_id, outcomeKey === "total_success", attackCost, influenceChange]
    );

    if (targetPlayerId) {
      const nextAttackAt = new Date(
        Date.now() + ((ATTACK_ACTION_DURATION_SECONDS + ATTACK_COOLDOWN_SECONDS) * 1000)
      );
      await client.query(
        `INSERT INTO attack_target_cooldowns (attacker_player_id, target_player_id, next_attack_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (attacker_player_id, target_player_id)
         DO UPDATE SET next_attack_at = EXCLUDED.next_attack_at`,
        [playerId, targetPlayerId, nextAttackAt]
      );
    }

    await client.query("COMMIT");

    return {
      ok: true,
      success: outcomeKey === "total_success",
      outcomeKey,
      destroyed: districtDestroyed,
      influenceChange,
      heatGain: attackHeatGain,
      sourceDistrictId,
      newOwnerId: newOwner,
      newInfluence,
      attackPower: attackPowerDisplay,
      defensePower: defensePowerDisplay,
      attackerLossPct: outcomeKey === "pyrrhic_victory" ? 50 : (outcomeKey === "failure" || outcomeKey === "catastrophe" ? 100 : 0),
      defenderLossPct: defenderDefenseLossPct,
      districtLossPct: defenderInfluenceLossPct,
      message: formatAttackOutcomeMessage({
        outcomeKey,
        destroyed: districtDestroyed
      })
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function formatAttackOutcomeMessage({ outcomeKey, destroyed }) {
  if (destroyed || outcomeKey === "catastrophe") {
    return "Všechno shořelo do prdele. Baráky, lidi, zásoby. Jen popel a smrad. Tady už není co brát, jen prázdná díra.";
  }
  if (outcomeKey === "total_success") {
    return "Rozjebali jste je na kusy. District je tvůj. Kdo tam ještě dýchá, už maká pro tebe nebo chcípne do rána.";
  }
  if (outcomeKey === "pyrrhic_victory") {
    return "Sejmul jsi jejich obranu, ale tvoji lidi šli do sraček s nima. Půlka chcípla, zbraně v hajzlu. District pořád stojí ale sotva.";
  }
  return "Totální průser. Vběhli jste tam jak idioti a nechali tam krev i výbavu. Oni taky něco ztratili, ale ty jsi ten, co dostal přes držku.";
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
