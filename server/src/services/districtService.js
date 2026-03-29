const { pool } = require("../config/db");
const { CityGen } = require("./mapGen");
const { MAP_SEED } = require("../config/constants");

async function ensureDistrictDestructionSchema() {
  await pool.query(`
    ALTER TABLE districts
      ADD COLUMN IF NOT EXISTS is_destroyed BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS destroyed_at TIMESTAMP NULL
  `);
}

async function ensureDistricts() {
  await ensureDistrictDestructionSchema();
  const existing = await pool.query("SELECT COUNT(*) FROM districts");
  const count = Number(existing.rows[0].count);
  if (count > 0) return;

  const seed = MAP_SEED;
  const city = CityGen.generate({
    seed,
    width: 1400,
    height: 900,
    districtCount: 130
  });

  const values = [];
  const params = [];
  let idx = 1;

  city.districts.forEach((district) => {
    params.push(district.name, district.type, JSON.stringify(district.polygon), district.income, district.influence);
    values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`);
    idx += 5;
  });

  await pool.query(
    `INSERT INTO districts (name, type, polygon, base_income, influence_level)
     VALUES ${values.join(",")}`,
    params
  );
}

async function listDistricts() {
  await ensureDistrictDestructionSchema();
  await ensureDistricts();
  const result = await pool.query(
    `SELECT d.id, d.name, d.type, d.base_income, d.influence_level, d.polygon,
            d.owner_player_id, d.is_destroyed, d.destroyed_at,
            p.gang_name AS owner_name,
            p.username AS owner_username,
            a.name AS owner_alliance_name,
            a.icon_key AS owner_alliance_icon_key
     FROM districts d
      LEFT JOIN players p ON p.id = d.owner_player_id
      LEFT JOIN alliances a ON a.id = p.alliance_id
     ORDER BY d.name ASC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    owner: row.owner_name,
    ownerPlayerId: row.owner_player_id || null,
    ownerNick: row.owner_username || null,
    ownerAllianceName: row.owner_alliance_name || null,
    ownerAllianceIconKey: row.owner_alliance_icon_key || null,
    influence: row.influence_level,
    income: row.base_income,
    isDestroyed: Boolean(row.is_destroyed),
    destroyedAt: row.destroyed_at || null,
    polygon: typeof row.polygon === "string" ? JSON.parse(row.polygon) : row.polygon
  }));
}

module.exports = { listDistricts, ensureDistricts, ensureDistrictDestructionSchema };
