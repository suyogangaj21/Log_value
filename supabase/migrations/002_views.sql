-- ============================================================
-- 002_views.sql
-- Clash Royale Analytics Platform — Materialized Views
-- Refreshed every 5 min via pg_cron (concurrently = no read locks).
-- ============================================================

-- ============================================================
-- META_DECK_STATS  — top decks with analytics metrics
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS meta_deck_stats AS
WITH battle_window AS (
  SELECT
    deck_hash,
    opponent_deck_hash,
    result,
    season_id
  FROM battles
  WHERE battle_time >= NOW() - INTERVAL '7 days'
    AND is_ladder = TRUE
),
deck_win_counts AS (
  SELECT
    deck_hash,
    COUNT(*) FILTER (WHERE result = 'win')  AS win_count,
    COUNT(*) FILTER (WHERE result = 'loss') AS loss_count,
    COUNT(*)                                AS use_count
  FROM battle_window
  GROUP BY deck_hash
),
total AS (
  SELECT COUNT(*) AS total_battles FROM battle_window
),
-- Clean Win Rate: exclude battles where opponent shares a card
clean_battles AS (
  SELECT
    b.deck_hash,
    b.result
  FROM battle_window b
  JOIN decks d_me  ON d_me.deck_hash  = b.deck_hash
  JOIN decks d_opp ON d_opp.deck_hash = b.opponent_deck_hash
  WHERE NOT (d_me.card_ids && d_opp.card_ids)  -- no overlapping cards
),
cwr_counts AS (
  SELECT
    deck_hash,
    COUNT(*) FILTER (WHERE result = 'win')                     AS clean_wins,
    COUNT(*) FILTER (WHERE result IN ('win','loss'))           AS clean_total
  FROM clean_battles
  GROUP BY deck_hash
)
SELECT
  d.deck_hash,
  d.card_ids,
  d.avg_elixir,
  d.archetype,
  dwc.win_count,
  dwc.loss_count,
  dwc.use_count,
  CASE WHEN dwc.use_count > 0 THEN dwc.win_count::NUMERIC / dwc.use_count END AS win_rate,
  CASE WHEN t.total_battles > 0 THEN dwc.use_count::NUMERIC / t.total_battles END AS use_rate,
  CASE WHEN cc.clean_total > 0 THEN cc.clean_wins::NUMERIC / cc.clean_total END  AS cwr,
  -- Rating: R = WR × (1 − e^(−UR / 0.01))
  CASE
    WHEN dwc.use_count > 0 AND t.total_battles > 0 THEN
      (dwc.win_count::NUMERIC / dwc.use_count)
      * (1 - EXP(-(dwc.use_count::NUMERIC / t.total_battles) / 0.01))
    ELSE 0
  END AS rating,
  NOW() AS updated_at
FROM decks d
JOIN deck_win_counts dwc ON dwc.deck_hash = d.deck_hash
CROSS JOIN total t
LEFT JOIN cwr_counts cc ON cc.deck_hash = d.deck_hash
WHERE dwc.use_count >= 5  -- minimum games threshold
ORDER BY rating DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_deck_stats_pk
  ON meta_deck_stats (deck_hash);
CREATE INDEX IF NOT EXISTS idx_meta_deck_stats_archetype
  ON meta_deck_stats (archetype);
CREATE INDEX IF NOT EXISTS idx_meta_deck_stats_elixir
  ON meta_deck_stats (avg_elixir);
CREATE INDEX IF NOT EXISTS idx_meta_deck_stats_rating
  ON meta_deck_stats (rating DESC);

-- ============================================================
-- GLOBAL_LEADERBOARD  — latest rank per player
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS global_leaderboard AS
WITH latest AS (
  SELECT DISTINCT ON (player_tag)
    rank,
    player_tag,
    player_name,
    trophies,
    clan_name,
    season_id,
    snapped_at
  FROM leaderboard_snapshots
  ORDER BY player_tag, snapped_at DESC
)
SELECT
  ROW_NUMBER() OVER (ORDER BY l.trophies DESC) AS current_rank,
  l.*,
  p.exp_level,
  p.arena,
  p.clan_tag
FROM latest l
LEFT JOIN players p ON p.tag = l.player_tag
ORDER BY l.trophies DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_lb_player
  ON global_leaderboard (player_tag);
CREATE INDEX IF NOT EXISTS idx_global_lb_rank
  ON global_leaderboard (current_rank);

-- ============================================================
-- CARD_PERFORMANCE  — per-card analytics metrics
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS card_performance AS
WITH battle_window AS (
  SELECT
    b.deck_hash,
    b.opponent_deck_hash,
    b.result
  FROM battles b
  WHERE b.battle_time >= NOW() - INTERVAL '7 days'
    AND b.is_ladder = TRUE
),
card_battles AS (
  -- Explode deck_hash → individual card IDs
  SELECT
    UNNEST(d.card_ids) AS card_id,
    bw.result,
    bw.deck_hash,
    bw.opponent_deck_hash
  FROM battle_window bw
  JOIN decks d ON d.deck_hash = bw.deck_hash
),
card_wins AS (
  SELECT
    card_id,
    COUNT(*) FILTER (WHERE result = 'win')  AS win_count,
    COUNT(*) FILTER (WHERE result = 'loss') AS loss_count,
    COUNT(*)                                AS use_count
  FROM card_battles
  GROUP BY card_id
),
clean_card_battles AS (
  SELECT
    cb.card_id,
    cb.result
  FROM card_battles cb
  JOIN decks d_me  ON d_me.deck_hash  = cb.deck_hash
  JOIN decks d_opp ON d_opp.deck_hash = cb.opponent_deck_hash
  WHERE NOT (d_me.card_ids && d_opp.card_ids)
),
cwr_card AS (
  SELECT
    card_id,
    COUNT(*) FILTER (WHERE result = 'win')               AS clean_wins,
    COUNT(*) FILTER (WHERE result IN ('win','loss'))     AS clean_total
  FROM clean_card_battles
  GROUP BY card_id
),
total AS (SELECT COUNT(*) AS total_battles FROM battle_window)
SELECT
  c.id  AS card_id,
  c.name,
  c.elixir_cost,
  c.rarity,
  c.card_type,
  c.icon_url,
  cw.win_count,
  cw.use_count,
  CASE WHEN cw.use_count > 0 THEN cw.win_count::NUMERIC / cw.use_count END AS win_rate,
  CASE WHEN t.total_battles > 0 THEN cw.use_count::NUMERIC / t.total_battles END AS use_rate,
  CASE WHEN cc.clean_total > 0 THEN cc.clean_wins::NUMERIC / cc.clean_total END  AS cwr,
  CASE
    WHEN cw.use_count > 0 AND t.total_battles > 0 THEN
      (cw.win_count::NUMERIC / cw.use_count)
      * (1 - EXP(-(cw.use_count::NUMERIC / t.total_battles) / 0.01))
    ELSE 0
  END AS rating,
  NOW() AS updated_at
FROM cards c
JOIN card_wins cw ON cw.card_id = c.id
CROSS JOIN total t
LEFT JOIN cwr_card cc ON cc.card_id = c.id
WHERE cw.use_count >= 10
ORDER BY rating DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_card_perf_pk
  ON card_performance (card_id);
CREATE INDEX IF NOT EXISTS idx_card_perf_rating
  ON card_performance (rating DESC);
CREATE INDEX IF NOT EXISTS idx_card_perf_rarity
  ON card_performance (rarity);

-- ============================================================
-- REFRESH SCHEDULE via pg_cron
-- ============================================================

-- Refresh meta_deck_stats every 5 minutes
SELECT cron.schedule(
  'refresh-meta-deck-stats',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY meta_deck_stats'
);

-- Refresh global_leaderboard every 2 minutes
SELECT cron.schedule(
  'refresh-global-leaderboard',
  '*/2 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard'
);

-- Refresh card_performance every 10 minutes
SELECT cron.schedule(
  'refresh-card-performance',
  '*/10 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY card_performance'
);
