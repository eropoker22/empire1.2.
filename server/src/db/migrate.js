const fs = require("fs/promises");
const path = require("path");

const { pool } = require("../config/db");

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function ensureSchemaMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function runMigrations({ logger = console } = {}) {
  const client = await pool.connect();

  try {
    await ensureSchemaMigrationsTable(client);

    const files = await listMigrationFiles();
    const appliedRes = await client.query("SELECT id FROM schema_migrations");
    const appliedIds = new Set(appliedRes.rows.map((row) => String(row.id)));
    const newlyApplied = [];

    for (const file of files) {
      const migrationId = path.basename(file, ".sql");
      if (appliedIds.has(migrationId)) continue;

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const sql = await fs.readFile(migrationPath, "utf8");

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (id)
           VALUES ($1)
           ON CONFLICT (id) DO NOTHING`,
          [migrationId]
        );
        await client.query("COMMIT");
        newlyApplied.push(migrationId);
        logger.log(`Applied migration ${migrationId}`);
      } catch (error) {
        await client.query("ROLLBACK");
        error.message = `Migration ${migrationId} failed: ${error.message}`;
        throw error;
      }
    }

    if (newlyApplied.length === 0) {
      logger.log("No pending migrations.");
    }

    return { applied: newlyApplied, available: files.map((file) => path.basename(file, ".sql")) };
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await runMigrations();
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runMigrations
};
