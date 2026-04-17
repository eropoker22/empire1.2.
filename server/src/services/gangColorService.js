const { pool } = require("../config/db");
const { assertDatabaseSchema } = require("../db/schemaGuard");

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
  return assertDatabaseSchema();
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
