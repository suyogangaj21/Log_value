-- ============================================================
-- 001_core_schema.sql
-- Clash Royale Analytics Platform — Core Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  tag            TEXT PRIMARY KEY,          -- e.g. "#ABC123"
  name           TEXT NOT NULL,
  trophies       INTEGER NOT NULL DEFAULT 0,
  best_trophies  INTEGER NOT NULL DEFAULT 0,
  exp_level      INTEGER NOT NULL DEFAULT 1,
  exp_points     INTEGER NOT NULL DEFAULT 0,
  clan_tag       TEXT,
  clan_name      TEXT,
  role           TEXT,                       -- member|elder|coLeader|leader
  arena          JSONB,
  league_statistics JSONB,
  badges         JSONB,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_trophies ON players (trophies DESC);
CREATE INDEX IF NOT EXISTS idx_players_clan_tag ON players (clan_tag);

-- ============================================================
-- CLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS clans (
  tag              TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT,
  badge_id         INTEGER,
  clan_score       INTEGER NOT NULL DEFAULT 0,
  clan_war_trophies INTEGER NOT NULL DEFAULT 0,
  required_trophies INTEGER NOT NULL DEFAULT 0,
  donations_per_week INTEGER NOT NULL DEFAULT 0,
  members_count    INTEGER NOT NULL DEFAULT 0,
  location         JSONB,
  members          JSONB,                   -- full member list snapshot
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clans_score ON clans (clan_score DESC);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id             INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  max_level      INTEGER NOT NULL DEFAULT 14,
  elixir_cost    INTEGER,
  icon_url       TEXT,
  card_type      TEXT,                      -- troop|spell|building
  rarity         TEXT,                      -- common|rare|epic|legendary|champion
  arena          INTEGER,
  attributes     JSONB,                     -- evolves, shards, special abilities, etc.
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_elixir ON cards (elixir_cost);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards (card_type);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards (rarity);
CREATE INDEX IF NOT EXISTS idx_cards_attributes ON cards USING GIN (attributes);

-- ============================================================
-- DECKS
-- ============================================================
CREATE TABLE IF NOT EXISTS decks (
  deck_hash      TEXT PRIMARY KEY,           -- SHA-256 of sorted card_ids joined by ','
  card_ids       INTEGER[] NOT NULL,         -- always 8 elements, sorted ASC
  avg_elixir     NUMERIC(4,2),
  archetype      TEXT,                       -- beatdown|siege|control|bridge_spam|cycle|unknown
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decks_archetype ON decks (archetype);
CREATE INDEX IF NOT EXISTS idx_decks_avg_elixir ON decks (avg_elixir);
CREATE INDEX IF NOT EXISTS idx_decks_card_ids ON decks USING GIN (card_ids);

-- ============================================================
-- BATTLES (range-partitioned by battle_time, monthly)
-- ============================================================
CREATE TABLE IF NOT EXISTS battles (
  id               BIGSERIAL,
  battle_time      TIMESTAMPTZ NOT NULL,
  player_tag       TEXT NOT NULL,
  opponent_tag     TEXT NOT NULL,
  deck_hash        TEXT NOT NULL,
  opponent_deck_hash TEXT NOT NULL,
  result           TEXT NOT NULL CHECK (result IN ('win','loss','draw')),
  crowns           INTEGER NOT NULL DEFAULT 0,
  opponent_crowns  INTEGER NOT NULL DEFAULT 0,
  elixir_leaked    NUMERIC(5,2),
  opponent_elixir_leaked NUMERIC(5,2),
  game_mode        TEXT,
  arena_id         INTEGER,
  season_id        INTEGER,
  is_ladder        BOOLEAN DEFAULT TRUE,
  raw              JSONB,                    -- full API response for future-proofing
  PRIMARY KEY (id, battle_time)
) PARTITION BY RANGE (battle_time);

-- Seed partitions (current + 12 months ahead)
CREATE TABLE IF NOT EXISTS battles_2026_01 PARTITION OF battles
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS battles_2026_02 PARTITION OF battles
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS battles_2026_03 PARTITION OF battles
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS battles_2026_04 PARTITION OF battles
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS battles_2026_05 PARTITION OF battles
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS battles_2026_06 PARTITION OF battles
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS battles_2026_07 PARTITION OF battles
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS battles_2026_08 PARTITION OF battles
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS battles_2026_09 PARTITION OF battles
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS battles_2026_10 PARTITION OF battles
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS battles_2026_11 PARTITION OF battles
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS battles_2026_12 PARTITION OF battles
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS battles_2027_01 PARTITION OF battles
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE IF NOT EXISTS battles_default  PARTITION OF battles DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_battles_dedup
  ON battles (battle_time, player_tag, opponent_tag);
CREATE INDEX IF NOT EXISTS idx_battles_player ON battles (player_tag, battle_time DESC);
CREATE INDEX IF NOT EXISTS idx_battles_deck ON battles (deck_hash);
CREATE INDEX IF NOT EXISTS idx_battles_season ON battles (season_id);

-- ============================================================
-- DECK_STATS  (aggregate counts, updated by worker after ingestion)
-- ============================================================
CREATE TABLE IF NOT EXISTS deck_stats (
  deck_hash      TEXT NOT NULL,
  season_id      INTEGER NOT NULL,
  win_count      BIGINT NOT NULL DEFAULT 0,
  loss_count     BIGINT NOT NULL DEFAULT 0,
  draw_count     BIGINT NOT NULL DEFAULT 0,
  use_count      BIGINT NOT NULL DEFAULT 0,  -- win+loss+draw
  cwr            NUMERIC(6,4),               -- clean win rate, recomputed by workers
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (deck_hash, season_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_stats_season ON deck_stats (season_id);

-- ============================================================
-- CARD_MATCHUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS card_matchups (
  card_a_id      INTEGER NOT NULL,
  card_b_id      INTEGER NOT NULL,
  season_id      INTEGER NOT NULL,
  wins_with_a    BIGINT NOT NULL DEFAULT 0,  -- player using card_a won vs player using card_b
  total_a_vs_b   BIGINT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (card_a_id, card_b_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_matchups_card_a ON card_matchups (card_a_id, season_id);
CREATE INDEX IF NOT EXISTS idx_matchups_card_b ON card_matchups (card_b_id, season_id);

-- ============================================================
-- CLAN_WARS
-- ============================================================
CREATE TABLE IF NOT EXISTS clan_wars (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_tag       TEXT NOT NULL,
  race_id        TEXT NOT NULL,             -- season+section identifier
  state          TEXT,                      -- warDay|riverRaceEnded|notInWar
  participants   JSONB,                     -- [{tag, name, fame, repairPoints, attacks}]
  standings      JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clan_tag, race_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_wars_tag ON clan_wars (clan_tag);

-- ============================================================
-- CHEST_CYCLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chest_cycle (
  player_tag     TEXT PRIMARY KEY,
  position       INTEGER NOT NULL DEFAULT 0,
  upcoming       JSONB,                     -- [{index, name, icon}]
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER_PROFILES  (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  player_tag     TEXT UNIQUE,
  display_name   TEXT,
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  api_token      TEXT,                      -- hashed; used for verification
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_player_tag ON user_profiles (player_tag);

-- ============================================================
-- LEADERBOARD_SNAPSHOTS  (raw data for history)
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id             BIGSERIAL PRIMARY KEY,
  location_id    INTEGER NOT NULL DEFAULT 57000006,  -- global
  season_id      INTEGER,
  rank           INTEGER NOT NULL,
  player_tag     TEXT NOT NULL,
  player_name    TEXT NOT NULL,
  trophies       INTEGER NOT NULL,
  clan_name      TEXT,
  snapped_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_snapshots_season ON leaderboard_snapshots (season_id, rank);
CREATE INDEX IF NOT EXISTS idx_lb_snapshots_player ON leaderboard_snapshots (player_tag);

-- ============================================================
-- AUTO-CREATE future monthly partitions via pg_cron
-- ============================================================
CREATE OR REPLACE FUNCTION create_battles_partition_for_next_month()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  next_month DATE := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  partition_name := 'battles_' || TO_CHAR(next_month, 'YYYY_MM');
  start_date     := TO_CHAR(next_month, 'YYYY-MM-DD');
  end_date       := TO_CHAR(next_month + INTERVAL '1 month', 'YYYY-MM-DD');

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE FORMAT(
      'CREATE TABLE %I PARTITION OF battles FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END IF;
END;
$$;

-- Run on the 25th of every month at 00:00 UTC
SELECT cron.schedule(
  'create-battles-partition',
  '0 0 25 * *',
  'SELECT create_battles_partition_for_next_month()'
);
