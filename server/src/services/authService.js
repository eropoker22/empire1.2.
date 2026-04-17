const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { assertDatabaseSchema } = require("../db/schemaGuard");
const { normalizeGameMode, normalizeServerKey } = require("../config/gameModes");
const { getStarterPlayerState } = require("../config/gameplayRules");
const { ensureMarketSchema } = require("./marketService");
const { ensureMoneySchema } = require("./moneyService");
const { ensureDrugSchema } = require("./drugService");
const { ensureGangColorSchema } = require("./gangColorService");

async function ensurePlayerModeSchema() {
  return assertDatabaseSchema();
}

async function registerPlayer({ username, password, gangName, gameMode = "war", serverKey = "" }) {
  const mode = normalizeGameMode(gameMode);
  const resolvedServerKey = normalizeServerKey(mode, serverKey);
  await ensureMarketSchema();
  await ensureMoneySchema();
  await ensureDrugSchema();
  await ensureGangColorSchema();
  await ensurePlayerModeSchema();
  const passwordHash = await bcrypt.hash(password, 12);
  const starterState = getStarterPlayerState({ gameMode: mode, serverKey: resolvedServerKey });

  const result = await pool.query(
    `INSERT INTO players (
       username, password_hash, gang_name,
       game_mode, server_key,
       money, clean_money, dirty_money,
       drugs, drug_neon_dust, drug_pulse_shot, drug_velvet_smoke, drug_ghost_serum, drug_overdrive_x,
       weapons, materials, data_shards
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING id, username, gang_name, gang_structure, gang_color, server_key`,
    [
      username,
      passwordHash,
      gangName,
      mode,
      resolvedServerKey,
      starterState.money,
      starterState.cleanMoney,
      starterState.dirtyMoney,
      starterState.drugs,
      starterState.drugNeonDust,
      starterState.drugPulseShot,
      starterState.drugVelvetSmoke,
      starterState.drugGhostSerum,
      starterState.drugOverdriveX,
      starterState.weapons,
      starterState.materials,
      starterState.dataShards
    ]
  );

  const player = result.rows[0];
  return createToken({ ...player, game_mode: mode, server_key: resolvedServerKey });
}

async function loginPlayer({ username, password, gameMode = "war", serverKey = "" }) {
  const mode = normalizeGameMode(gameMode);
  const resolvedServerKey = normalizeServerKey(mode, serverKey);
  await ensureGangColorSchema();
  await ensurePlayerModeSchema();
  const result = await pool.query(
    "SELECT id, username, gang_name, gang_structure, gang_color, password_hash, game_mode, server_key FROM players WHERE username = $1 AND game_mode = $2 AND server_key = $3",
    [username, mode, resolvedServerKey]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const player = result.rows[0];
  const ok = await bcrypt.compare(password, player.password_hash);
  if (!ok) return null;

  return createToken(player);
}

function createToken(player) {
  return jwt.sign(
    {
      id: player.id,
      username: player.username,
      gangName: player.gang_name,
      structure: player.gang_structure || null,
      gangColor: player.gang_color || null,
      gameMode: normalizeGameMode(player.game_mode || player.gameMode || "war"),
      serverKey: normalizeServerKey(
        player.game_mode || player.gameMode || "war",
        player.server_key || player.serverKey || ""
      )
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = {
  ensurePlayerModeSchema,
  registerPlayer,
  loginPlayer,
  createToken
};
