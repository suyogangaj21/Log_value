-- ============================================================
-- 003_rls.sql
-- Row Level Security policies for the Clash Royale Analytics Platform
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_matchups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chest_cycle       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ — analytics tables (no auth required to browse)
-- ============================================================

CREATE POLICY "public_read_players"
  ON players FOR SELECT USING (true);

CREATE POLICY "public_read_clans"
  ON clans FOR SELECT USING (true);

CREATE POLICY "public_read_cards"
  ON cards FOR SELECT USING (true);

CREATE POLICY "public_read_decks"
  ON decks FOR SELECT USING (true);

CREATE POLICY "public_read_battles"
  ON battles FOR SELECT USING (true);

CREATE POLICY "public_read_deck_stats"
  ON deck_stats FOR SELECT USING (true);

CREATE POLICY "public_read_card_matchups"
  ON card_matchups FOR SELECT USING (true);

CREATE POLICY "public_read_clan_wars"
  ON clan_wars FOR SELECT USING (true);

CREATE POLICY "public_read_leaderboard_snapshots"
  ON leaderboard_snapshots FOR SELECT USING (true);

-- ============================================================
-- USER PROFILES — users may only read/write their own row
-- ============================================================

CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete_own"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- CHEST CYCLE — users can read/write their own; public read disabled
-- (chest cycle is personal — requires verified account)
-- ============================================================

CREATE POLICY "chest_cycle_select_own"
  ON chest_cycle FOR SELECT
  USING (
    player_tag IN (
      SELECT player_tag FROM user_profiles
      WHERE id = auth.uid() AND verified = true
    )
  );

CREATE POLICY "chest_cycle_upsert_own"
  ON chest_cycle FOR INSERT
  WITH CHECK (
    player_tag IN (
      SELECT player_tag FROM user_profiles
      WHERE id = auth.uid() AND verified = true
    )
  );

CREATE POLICY "chest_cycle_update_own"
  ON chest_cycle FOR UPDATE
  USING (
    player_tag IN (
      SELECT player_tag FROM user_profiles
      WHERE id = auth.uid() AND verified = true
    )
  );

-- ============================================================
-- SERVICE ROLE bypasses RLS entirely — used by worker routes
-- (Workers use SUPABASE_SERVICE_ROLE_KEY, not the publishable key)
-- No additional policies needed; service role is pre-granted.
-- ============================================================
