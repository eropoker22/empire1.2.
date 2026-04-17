ALTER TABLE market_orders
  ADD COLUMN IF NOT EXISTS game_mode TEXT;

UPDATE market_orders mo
   SET game_mode = p.game_mode
  FROM players p
 WHERE p.id = mo.player_id
   AND (
     mo.game_mode IS NULL
     OR mo.game_mode <> p.game_mode
   );

UPDATE market_orders
   SET game_mode = 'war'
 WHERE game_mode IS NULL;

ALTER TABLE market_orders
  ALTER COLUMN game_mode SET DEFAULT 'war';

ALTER TABLE market_orders
  ALTER COLUMN game_mode SET NOT NULL;

ALTER TABLE market_trades
  ADD COLUMN IF NOT EXISTS game_mode TEXT;

UPDATE market_trades mt
   SET game_mode = COALESCE(buyer.game_mode, seller.game_mode, 'war')
  FROM players buyer
  LEFT JOIN players seller
    ON seller.id = mt.seller_player_id
 WHERE buyer.id = mt.buyer_player_id
   AND (
     mt.game_mode IS NULL
     OR mt.game_mode <> COALESCE(buyer.game_mode, seller.game_mode, 'war')
   );

UPDATE market_trades mt
   SET game_mode = seller.game_mode
  FROM players seller
 WHERE seller.id = mt.seller_player_id
   AND mt.game_mode IS NULL;

UPDATE market_trades
   SET game_mode = 'war'
 WHERE game_mode IS NULL;

ALTER TABLE market_trades
  ALTER COLUMN game_mode SET DEFAULT 'war';

ALTER TABLE market_trades
  ALTER COLUMN game_mode SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_market_orders_mode_book
  ON market_orders (game_mode, resource_key, side, status, price_per_unit, created_at);

CREATE INDEX IF NOT EXISTS idx_market_trades_mode_resource_created
  ON market_trades (game_mode, resource_key, created_at DESC);

INSERT INTO schema_migrations (id)
VALUES ('002_market_game_mode_isolation')
ON CONFLICT (id) DO NOTHING;
