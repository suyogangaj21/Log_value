# Plan: Clash Royale Analytics Platform (RoyaleAPI Clone)

## Stack

- Next.js 15 App Router (existing project at E:\New Tech Trial\LogValue)
- Supabase (PostgreSQL, Auth, Realtime, RLS) — credentials in .env
- Clash Royale API — SUPERCELL_API_KEY already in .env
- No Redis — Supabase Materialized Views + pg_cron for cache invalidation
- No Discord bot
- Auth: Public-first browsing; email+game token for verified accounts
- Polling: Next.js API Routes (not Edge Functions)
- Full feature set (all 4 areas)

## Decisions

- No Upstash Redis: use Supabase materialized views + `REFRESH MATERIALIZED VIEW CONCURRENTLY` for hot stats
- Data polling via Next.js Route Handlers (cron-triggered via pg_cron calling a webhook or external cron)
- API key in server-only env var, never exposed to client
- RLS on all user-owned tables; public read on analytics tables

---

## Phase 1 — Database Schema (SQL migrations)

Files to create: `supabase/migrations/001_core_schema.sql`

Tables:

- `players` — tag PK, name, trophies, exp_level, updated_at
- `clans` — tag PK, name, members JSONB, updated_at
- `cards` — id PK, name, max_level, elixir_cost, type, JSONB attributes
- `decks` — composite hash PK (8 card ids sorted), archetype, avg_elixir
- `battles` — partitioned by month (battle_time), player_tag, opponent_tag, deck_hash, result, elixir_leaked, mode, season_id
- `deck_stats` — deck_hash, season_id, win_count, loss_count, use_count, cwr (materialized or computed)
- `card_matchups` — card_a_id, card_b_id, wins, losses, season_id
- `leaderboard_global` — materialized view over battles last 24h
- `clan_wars` — clan_tag, race_id, participants JSONB, created_at
- `user_profiles` — id (FK auth.users), player_tag, verified bool
- `chest_cycle` — player_tag, position, chests JSONB

Indexes: btree on battle_time, tag columns; GIN on JSONB cols

## Phase 2 — Clash Royale API Client

Files: `lib/cr-api/client.ts`, `lib/cr-api/types.ts`, `lib/cr-api/rate-limiter.ts`

- Typed fetch wrapper with Authorization: Bearer header
- Rate limiter: token bucket (10 req/s developer tier)
- Endpoints: /players/{tag}, /clans/{tag}, /cards, /players/{tag}/battlelog, /players/{tag}/upcomingchests, /clans/{tag}/riverracelog, /locations/{id}/rankings/players
- Proxy via server-only (never client-side)

## Phase 3 — Data Ingestion (Polling Workers)

Files: `app/api/workers/sync-battles/route.ts`, `app/api/workers/sync-leaderboard/route.ts`, `app/api/workers/sync-cards/route.ts`

- Protected by CRON_SECRET env var (compare Authorization header)
- sync-cards: fetch all cards, upsert into `cards` table
- sync-leaderboard: fetch top 1000 global rankings, upsert players, queue battle fetches
- sync-battles: for each player in queue, fetch last battle log, deduplicate by composite key (battle_time + player_tag + opponent_tag), insert into battles partition
- Deduplication: ON CONFLICT DO NOTHING
- pg_cron or external cron (Vercel cron jobs via vercel.json) triggering these routes every 60s

## Phase 4 — Analytics Engine

Files: `lib/analytics/rating.ts`, `lib/analytics/cwr.ts`, `lib/analytics/archetypes.ts`, `lib/analytics/matchups.ts`

**Rating Formula:**
R = WR \* log(1 + UR) (use rate weighted win rate for statistical confidence)
Exact: R = f(UR, WR) where R = WR × (1 - e^(-UR/UR_baseline))

**CWR (Clean Win Rate):**
Exclude battles where both decks contain same card; recalculate WR from filtered set

**Archetypes:**

- Beatdown: avg_elixir >= 4.0, contains Giant/Golem/Lava
- Siege: contains X-Bow/Mortar
- Control: avg_elixir <= 3.5, no win condition
- Bridge Spam: avg_elixir <= 3.8 with high-pressure cards
- Cycle: avg_elixir <= 2.9

**Similarity Engine:**
Jaccard similarity on card sets (normalized for evolution/max level variants)

## Phase 5 — Database Views & Materialized Views

SQL file: `supabase/migrations/002_views.sql`

- `meta_deck_stats` materialized: deck_hash, win_rate, use_rate, cwr, rating, archetype, avg_elixir, updated_at
- `global_leaderboard` materialized: rank, player_tag, name, trophies, season_id
- `card_performance` materialized: card_id, win_rate, use_rate, cwr, rating, season_id
- Refresh via pg_cron every 5 min: `REFRESH MATERIALIZED VIEW CONCURRENTLY`

## Phase 6 — Frontend: App Router Pages & Server Components

Directory structure under `app/`:

```
app/
  (public)/
    layout.tsx         — main nav, footer
    page.tsx           — home/meta dashboard
    players/
      [tag]/
        page.tsx       — SSR player profile (SEO)
        battles/page.tsx — battle log
        chests/page.tsx  — chest cycle
    clans/
      [tag]/
        page.tsx       — clan profile + war stats
    decks/
      page.tsx         — meta deck search (Client Component with filters)
      [hash]/
        page.tsx       — deck detail + matchup grid
    cards/
      page.tsx         — card tier list
      [id]/
        page.tsx       — card detail + matchup matrix
    leaderboard/
      page.tsx         — global rankings (Realtime updates)
    search/
      page.tsx         — player/clan search
  (auth)/
    layout.tsx         — reuse existing auth pages
```

**Server Components (SEO-critical):**

- Player profile: `generateMetadata` with player name/tag
- Clan profile
- Card detail
- Deck detail

**Client Components (interactive):**

- `components/deck-search-filters.tsx` — elixir slider, card include/exclude, archetype filter
- `components/leaderboard-realtime.tsx` — Supabase Realtime subscription
- `components/battle-log.tsx` — paginated table
- `components/matchup-grid.tsx` — 2D matrix with heat map colors
- `components/chest-tracker.tsx` — visual cycle display
- `components/clan-war-dashboard.tsx` — participation tracker

## Phase 7 — Caching Layer (Supabase-only)

- Materialized views serve as cache
- Server Components use `unstable_cache` (Next.js) with 60s TTL for heavy queries
- ISR revalidation: player profiles revalidate every 300s

## Phase 8 — Auth & RLS

- Public browsing: no login needed
- Account verification: user provides player tag + API token from game settings → server validates against `/players/{tag}` verify token endpoint → sets `user_profiles.verified = true`
- RLS policies:
  - `user_profiles`: users can only read/write their own row
  - `battles`, `players`, `cards`, `decks`, `deck_stats`: public SELECT, no direct INSERT (worker service role only)
  - `clan_wars`: public SELECT

## Phase 9 — UI Components

Using existing shadcn/ui setup:

- Install missing components: table, tabs, slider, select, sheet, skeleton, tooltip, progress
- `components/ui/data-table.tsx` — reusable sortable table
- `components/ui/stat-card.tsx` — metric display card
- `components/ui/deck-card.tsx` — 8-card deck display with images
- `components/ui/elixir-badge.tsx` — colored elixir cost display
- `components/ui/win-rate-bar.tsx` — visual WR/CWR comparison

## Phase 10 — Configuration & Deployment

- `vercel.json` — cron job definitions (sync-battles every 60s, sync-leaderboard every 5min)
- `app/layout.tsx` — update metadata for LogValue branding
- `next.config.ts` — add `images.remotePatterns` for Clash Royale CDN assets
- `.env` — add CRON_SECRET, CR_API_BASE_URL=https://api.clashroyale.com/v1

---

## Relevant Files

- `e:\New Tech Trial\LogValue\app\layout.tsx` — update branding/metadata
- `e:\New Tech Trial\LogValue\next.config.ts` — add image domains
- `e:\New Tech Trial\LogValue\lib\supabase\server.ts` — reuse for all server queries
- `e:\New Tech Trial\LogValue\lib\supabase\client.ts` — reuse for Realtime Client Components
- `e:\New Tech Trial\LogValue\.env` — add CRON_SECRET, CR_API_BASE_URL

## Verification

1. `pnpm run build` — zero TypeScript errors
2. Test API route workers manually: `GET /api/workers/sync-cards` with correct Authorization header
3. Verify RLS: anonymous client cannot INSERT into battles table
4. Verify player profile renders SSR with correct og:title meta tag
5. Test CWR calculation unit: feed mock battle with shared card, verify it's excluded
6. Test Rating formula: sanity check R values are between 0-1, higher WR + higher UR → higher R
7. Verify Realtime leaderboard updates in browser when materialized view is refreshed
