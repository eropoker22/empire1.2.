const { pool } = require("../config/db");
const { CityGen } = require("./mapGen");
const { MAP_SEED } = require("../config/constants");

async function ensureDistricts() {
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
  await ensureDistricts();
  const result = await pool.query(
    `SELECT d.id, d.name, d.type, d.base_income, d.influence_level, d.polygon,
            p.gang_name AS owner_name
     FROM districts d
     LEFT JOIN players p ON p.id = d.owner_player_id
     ORDER BY d.name ASC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    owner: row.owner_name,
    influence: row.influence_level,
    income: row.base_income,
    polygon: typeof row.polygon === "string" ? JSON.parse(row.polygon) : row.polygon
  }));
}

module.exports = { listDistricts, ensureDistricts };
