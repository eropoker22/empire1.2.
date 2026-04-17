ALTER TABLE alliances
  ADD COLUMN IF NOT EXISTS game_mode TEXT;

ALTER TABLE alliances
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE alliances a
   SET game_mode = p.game_mode,
       server_key = p.server_key
  FROM players p
 WHERE p.id = a.owner_player_id
   AND (
     a.game_mode IS NULL
     OR a.server_key IS NULL
     OR a.game_mode <> p.game_mode
     OR a.server_key <> p.server_key
   );

UPDATE alliances
   SET game_mode = 'war'
 WHERE game_mode IS NULL;

UPDATE alliances
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE alliances
  ALTER COLUMN game_mode SET DEFAULT 'war';

ALTER TABLE alliances
  ALTER COLUMN game_mode SET NOT NULL;

ALTER TABLE alliances
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE alliances
  ALTER COLUMN server_key SET NOT NULL;

ALTER TABLE alliances
  DROP CONSTRAINT IF EXISTS alliances_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alliances_name_scope_unique
  ON alliances (name, game_mode, server_key);

INSERT INTO schema_migrations (id)
VALUES ('004_alliances_server_isolation')
ON CONFLICT (id) DO NOTHING;
