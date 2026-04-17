ALTER TABLE districts
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE districts
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE districts
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE districts
  ALTER COLUMN server_key SET NOT NULL;

ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE rounds
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE rounds
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE rounds
  ALTER COLUMN server_key SET NOT NULL;

ALTER TABLE combat_logs
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE combat_logs c
   SET server_key = p.server_key
  FROM players p
 WHERE p.id = c.attacker_player_id
   AND (
     c.server_key IS NULL
     OR c.server_key <> p.server_key
   );

UPDATE combat_logs
   SET server_key = CASE
     WHEN EXISTS (SELECT 1 FROM players p WHERE p.id = attacker_player_id AND p.game_mode = 'free') THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE combat_logs
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE combat_logs
  ALTER COLUMN server_key SET NOT NULL;

ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS game_mode TEXT;

ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE bounties b
   SET game_mode = creator.game_mode,
       server_key = creator.server_key
  FROM players creator
 WHERE creator.id = b.created_by_player_id
   AND (
     b.game_mode IS NULL
     OR b.server_key IS NULL
     OR b.game_mode <> creator.game_mode
     OR b.server_key <> creator.server_key
   );

UPDATE bounties
   SET game_mode = 'war'
 WHERE game_mode IS NULL;

UPDATE bounties
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE bounties
  ALTER COLUMN game_mode SET DEFAULT 'war';

ALTER TABLE bounties
  ALTER COLUMN game_mode SET NOT NULL;

ALTER TABLE bounties
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE bounties
  ALTER COLUMN server_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_districts_mode_server
  ON districts (game_mode, server_key);

CREATE INDEX IF NOT EXISTS idx_rounds_active_scope
  ON rounds (game_mode, server_key, active, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_combat_logs_server_created
  ON combat_logs (server_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bounties_scope_status_created
  ON bounties (server_key, status, created_at DESC);

INSERT INTO schema_migrations (id)
VALUES ('005_server_scope_core_entities')
ON CONFLICT (id) DO NOTHING;
