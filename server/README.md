# Server migrations

## Commands

- Run migrations: `npm run migrate`
- Start backend after migrations: `npm start`
- Clean bootstrap into empty database: `psql "$DATABASE_URL" -f src/db/schema.sql`

## Notes

- Migrations live in `server/src/db/migrations`.
- Applied migrations are tracked in `schema_migrations`.
- `server/src/db/schema.sql` is the clean bootstrap for the current backend shape and records `001_initial_schema` for compatibility with the migration runner.
