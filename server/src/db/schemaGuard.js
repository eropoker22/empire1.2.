const { pool } = require("../config/db");

const REQUIRED_BASELINE_MIGRATION = "001_initial_schema";
const REQUIRED_TABLES = Object.freeze([
  "schema_migrations",
  "players",
  "alliances",
  "alliance_join_requests",
  "alliance_member_invites",
  "alliance_notifications",
  "alliance_kick_votes",
  "alliance_kick_vote_ballots",
  "alliance_audit_logs",
  "districts",
  "combat_logs",
  "cooldowns",
  "attack_target_cooldowns",
  "raid_player_cooldowns",
  "district_raid_locks",
  "district_raid_stashes",
  "rounds",
  "upgrades",
  "economy_ledger",
  "market_orders",
  "market_trades",
  "bounties"
]);

const REQUIRED_COLUMNS = Object.freeze({
  players: [
    "username", "password_hash", "game_mode", "server_key", "gang_name", "gang_structure", "gang_color",
    "money", "clean_money", "dirty_money", "influence_points", "heat", "drugs",
    "drug_neon_dust", "drug_pulse_shot", "drug_velvet_smoke", "drug_ghost_serum", "drug_overdrive_x",
    "drug_neon_dust_active_until", "drug_pulse_shot_active_until", "drug_velvet_smoke_active_until",
    "drug_ghost_serum_active_until", "drug_overdrive_x_active_until",
    "drug_neon_dust_active_dose", "drug_pulse_shot_active_dose", "drug_velvet_smoke_active_dose",
    "drug_ghost_serum_active_dose", "drug_overdrive_x_active_dose",
    "weapons", "defense", "materials", "data_shards",
    "district_income_dirty_remainder", "raid_member_losses", "alliance_id", "alliance_ready_at",
    "created_at", "updated_at"
  ],
  alliances: ["owner_player_id", "game_mode", "server_key", "description", "icon_key", "bonus_income_pct", "bonus_influence_pct"],
  districts: ["name", "type", "polygon", "game_mode", "server_key", "base_income", "owner_player_id", "influence_level", "is_destroyed", "destroyed_at", "updated_at"],
  rounds: ["started_at", "ends_at", "active", "game_mode", "server_key"],
  combat_logs: ["attacker_player_id", "district_id", "defender_player_id", "server_key", "success", "attack_cost", "influence_change", "created_at"],
  bounties: ["created_by_player_id", "target_player_id", "target_district_id", "game_mode", "server_key", "objective_type", "is_anonymous", "expires_at", "rewards", "status", "claimed_by_player_id", "claimed_at", "contributors", "total_value", "hunt_mode_active", "created_at"],
  market_orders: ["player_id", "game_mode", "server_key", "resource_key", "side", "quantity", "remaining_quantity", "price_per_unit", "status", "created_at", "updated_at"],
  market_trades: ["buy_order_id", "sell_order_id", "buyer_player_id", "seller_player_id", "game_mode", "server_key", "resource_key", "quantity", "price_per_unit", "fee_paid", "created_at"],
  attack_target_cooldowns: ["attacker_player_id", "target_player_id", "next_attack_at"],
  raid_player_cooldowns: ["player_id", "next_raid_at"],
  district_raid_locks: ["district_id", "locked_until"],
  district_raid_stashes: ["district_id", "materials", "drugs", "weapons", "updated_at"]
});

let schemaCheckPromise = null;

function createSchemaError(messages) {
  const error = new Error(`database_schema_outdated: ${messages.join("; ")}`);
  error.code = "database_schema_outdated";
  error.status = 500;
  return error;
}

async function assertDatabaseSchema() {
  if (schemaCheckPromise) return schemaCheckPromise;

  schemaCheckPromise = (async () => {
    const client = await pool.connect();
    try {
      const migrationTableRes = await client.query(`
        SELECT EXISTS (
          SELECT 1
            FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'schema_migrations'
        ) AS exists
      `);
      if (!migrationTableRes.rows[0]?.exists) {
        throw createSchemaError([
          "missing table public.schema_migrations",
          "run `npm run migrate` in server/"
        ]);
      }

      const migrationRes = await client.query(
        "SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1",
        [REQUIRED_BASELINE_MIGRATION]
      );
      if (migrationRes.rowCount === 0) {
        throw createSchemaError([
          `missing migration ${REQUIRED_BASELINE_MIGRATION}`,
          "run `npm run migrate` in server/"
        ]);
      }

      const tableRes = await client.query(`
        SELECT table_name
          FROM information_schema.tables
         WHERE table_schema = 'public'
      `);
      const tables = new Set(tableRes.rows.map((row) => String(row.table_name)));
      const missingTables = REQUIRED_TABLES.filter((tableName) => !tables.has(tableName));
      if (missingTables.length > 0) {
        throw createSchemaError(missingTables.map((tableName) => `missing table public.${tableName}`));
      }

      const columnRes = await client.query(`
        SELECT table_name, column_name
          FROM information_schema.columns
         WHERE table_schema = 'public'
      `);
      const columnsByTable = columnRes.rows.reduce((acc, row) => {
        const tableName = String(row.table_name);
        if (!acc.has(tableName)) acc.set(tableName, new Set());
        acc.get(tableName).add(String(row.column_name));
        return acc;
      }, new Map());

      const missingColumns = [];
      Object.entries(REQUIRED_COLUMNS).forEach(([tableName, columnNames]) => {
        const existingColumns = columnsByTable.get(tableName) || new Set();
        columnNames.forEach((columnName) => {
          if (!existingColumns.has(columnName)) {
            missingColumns.push(`missing column public.${tableName}.${columnName}`);
          }
        });
      });
      if (missingColumns.length > 0) {
        throw createSchemaError(missingColumns);
      }
    } finally {
      client.release();
    }
  })().catch((error) => {
    schemaCheckPromise = null;
    throw error;
  });

  return schemaCheckPromise;
}

module.exports = {
  assertDatabaseSchema
};
