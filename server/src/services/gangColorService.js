const { pool } = require("../config/db");

const GANG_COLOR_HEX_PATTERN = /^#[0-9a-f]{6}$/;

function normalizeGangColor(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  if (GANG_COLOR_HEX_PATTERN.test(raw)) return raw;
  return null;
}

async function ensureGangColorSchema() {
  await pool.query(`
    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS gang_color TEXT NULL
  `);

  await pool.query(`
    UPDATE players
       SET gang_color = LOWER(gang_color)
     WHERE gang_color IS NOT NULL
  `);

  await pool.query(`
    WITH ranked AS (
      SELECT
        id,
        LOWER(gang_color) AS normalized_color,
        ROW_NUMBER() OVER (PARTITION BY LOWER(gang_color) ORDER BY created_at ASC, id ASC) AS rn
      FROM players
      WHERE gang_color IS NOT NULL
    )
    UPDATE players p
       SET gang_color = CASE
         WHEN ranked.rn = 1 THEN ranked.normalized_color
         ELSE NULL
       END
      FROM ranked
     WHERE p.id = ranked.id
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_players_gang_color_unique
      ON players (gang_color)
      WHERE gang_color IS NOT NULL
  `);
}

async function claimGangColor({ playerId, color }) {
  await ensureGangColorSchema();
  const normalized = normalizeGangColor(color);
  if (!normalized) {
    return { ok: false, error: "invalid_color" };
  }

  try {
    const result = await pool.query(
      `UPDATE players
          SET gang_color = $1,
              updated_at = NOW()
        WHERE id = $2
      RETURNING gang_color`,
      [normalized, playerId]
    );
    if (result.rowCount < 1) {
      return { ok: false, error: "not_found" };
    }
    return { ok: true, gangColor: result.rows[0].gang_color };
  } catch (err) {
    if (err?.code === "23505") {
      return { ok: false, error: "gang_color_taken" };
    }
    throw err;
  }
}

module.exports = {
  normalizeGangColor,
  ensureGangColorSchema,
  claimGangColor
};
