ALTER TABLE players
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE players
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE players
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE players
  ALTER COLUMN server_key SET NOT NULL;

DROP INDEX IF EXISTS idx_players_username_game_mode_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_mode_server_unique
  ON players (username, game_mode, server_key);

ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE market_orders mo
   SET server_key = p.server_key
  FROM players p
 WHERE p.id = mo.player_id
   AND (
     mo.server_key IS NULL
     OR mo.server_key <> p.server_key
   );

UPDATE market_orders
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE market_orders
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE market_orders
  ALTER COLUMN server_key SET NOT NULL;

ALTER TABLE market_trades
  ADD COLUMN IF NOT EXISTS server_key TEXT;

UPDATE market_trades mt
   SET server_key = COALESCE(buyer.server_key, seller.server_key)
  FROM players buyer
  LEFT JOIN players seller
    ON seller.id = mt.seller_player_id
 WHERE buyer.id = mt.buyer_player_id
   AND (
     mt.server_key IS NULL
     OR mt.server_key <> COALESCE(buyer.server_key, seller.server_key)
   );

UPDATE market_trades mt
   SET server_key = seller.server_key
  FROM players seller
 WHERE seller.id = mt.seller_player_id
   AND mt.server_key IS NULL;

UPDATE market_trades
   SET server_key = CASE
     WHEN game_mode = 'free' THEN 'free-alpha'
     ELSE 'war-alpha'
   END
 WHERE server_key IS NULL;

ALTER TABLE market_trades
  ALTER COLUMN server_key SET DEFAULT 'war-alpha';

ALTER TABLE market_trades
  ALTER COLUMN server_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_market_orders_server_book
  ON market_orders (server_key, resource_key, side, status, price_per_unit, created_at);

CREATE INDEX IF NOT EXISTS idx_market_trades_server_resource_created
  ON market_trades (server_key, resource_key, created_at DESC);

INSERT INTO schema_migrations (id)
VALUES ('003_market_server_isolation')
ON CONFLICT (id) DO NOTHING;
