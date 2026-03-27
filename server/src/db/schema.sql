CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  gang_name TEXT NOT NULL,
  gang_structure TEXT NULL,
  gang_color TEXT NULL,
  money BIGINT NOT NULL DEFAULT 0,
  clean_money BIGINT NOT NULL DEFAULT 0,
  dirty_money BIGINT NOT NULL DEFAULT 0,
  influence_points INT NOT NULL DEFAULT 0,
  heat INT NOT NULL DEFAULT 0,
  drugs INT NOT NULL DEFAULT 0,
  drug_neon_dust INT NOT NULL DEFAULT 0,
  drug_pulse_shot INT NOT NULL DEFAULT 0,
  drug_velvet_smoke INT NOT NULL DEFAULT 0,
  drug_ghost_serum INT NOT NULL DEFAULT 0,
  drug_overdrive_x INT NOT NULL DEFAULT 0,
  drug_neon_dust_active_until TIMESTAMP NULL,
  drug_pulse_shot_active_until TIMESTAMP NULL,
  drug_velvet_smoke_active_until TIMESTAMP NULL,
  drug_ghost_serum_active_until TIMESTAMP NULL,
  drug_overdrive_x_active_until TIMESTAMP NULL,
  drug_neon_dust_active_dose INT NOT NULL DEFAULT 0,
  drug_pulse_shot_active_dose INT NOT NULL DEFAULT 0,
  drug_velvet_smoke_active_dose INT NOT NULL DEFAULT 0,
  drug_ghost_serum_active_dose INT NOT NULL DEFAULT 0,
  drug_overdrive_x_active_dose INT NOT NULL DEFAULT 0,
  weapons INT NOT NULL DEFAULT 0,
  defense INT NOT NULL DEFAULT 0,
  materials INT NOT NULL DEFAULT 0,
  data_shards INT NOT NULL DEFAULT 0,
  alliance_id UUID NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Alliances
CREATE TABLE IF NOT EXISTS alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  owner_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  bonus_income_pct INT NOT NULL DEFAULT 0,
  bonus_influence_pct INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE players
  ADD CONSTRAINT players_alliance_fk
  FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE SET NULL;

-- Districts (static map)
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  polygon JSONB NOT NULL,
  base_income INT NOT NULL DEFAULT 10,
  owner_player_id UUID NULL REFERENCES players(id) ON DELETE SET NULL,
  influence_level INT NOT NULL DEFAULT 0,
  is_destroyed BOOLEAN NOT NULL DEFAULT FALSE,
  destroyed_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_owner ON districts(owner_player_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_gang_color_unique
  ON players (gang_color)
  WHERE gang_color IS NOT NULL;

-- Combat logs
CREATE TABLE IF NOT EXISTS combat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  defender_player_id UUID NULL REFERENCES players(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL,
  attack_cost INT NOT NULL,
  influence_change INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cooldowns
CREATE TABLE IF NOT EXISTS cooldowns (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  next_attack_at TIMESTAMP NOT NULL
);

-- Round metadata
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rounds_active ON rounds(active);

-- Player upgrades
CREATE TABLE IF NOT EXISTS upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  upgrade_key TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, upgrade_key)
);

-- Economy ledger (optional, for auditing)
CREATE TABLE IF NOT EXISTS economy_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  delta BIGINT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity INT NOT NULL CHECK (quantity > 0),
  remaining_quantity INT NOT NULL CHECK (remaining_quantity >= 0),
  price_per_unit INT NOT NULL CHECK (price_per_unit > 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_orders_book
  ON market_orders (resource_key, side, status, price_per_unit, created_at);

CREATE TABLE IF NOT EXISTS market_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order_id UUID NULL REFERENCES market_orders(id) ON DELETE SET NULL,
  sell_order_id UUID NULL REFERENCES market_orders(id) ON DELETE SET NULL,
  buyer_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seller_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit INT NOT NULL CHECK (price_per_unit > 0),
  fee_paid INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_trades_resource_created
  ON market_trades (resource_key, created_at DESC);
