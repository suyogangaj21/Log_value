// app/api/seed/route.ts
// DEV-ONLY seed endpoint — populates the DB with realistic sample CR data
// so the UI can be previewed without live CR API access.
//
// Usage (dev server running):
//   curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/seed
//
// NEVER deploy this to production (guarded by NODE_ENV check + CRON_SECRET).

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeDeckHash } from "@/lib/cr-api/deck-hash";

// ─── Guard ────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

// ─── Sample Cards ─────────────────────────────────────────────────────────────
const CARDS = [
  { id: 26000000, name: "Knight", elixir: 3, rarity: "common", type: "troop" },
  { id: 26000001, name: "Archers", elixir: 3, rarity: "common", type: "troop" },
  { id: 26000002, name: "Goblins", elixir: 2, rarity: "common", type: "troop" },
  { id: 26000003, name: "Giant", elixir: 5, rarity: "rare", type: "troop" },
  {
    id: 26000004,
    name: "P.E.K.K.A.",
    elixir: 7,
    rarity: "epic",
    type: "troop",
  },
  { id: 26000005, name: "Minions", elixir: 3, rarity: "common", type: "troop" },
  { id: 26000006, name: "Balloon", elixir: 5, rarity: "epic", type: "troop" },
  { id: 26000007, name: "Witch", elixir: 5, rarity: "epic", type: "troop" },
  {
    id: 26000008,
    name: "Barbarians",
    elixir: 5,
    rarity: "common",
    type: "troop",
  },
  { id: 26000009, name: "Golem", elixir: 8, rarity: "epic", type: "troop" },
  {
    id: 26000010,
    name: "Skeleton Army",
    elixir: 3,
    rarity: "epic",
    type: "troop",
  },
  {
    id: 26000012,
    name: "Mini P.E.K.K.A.",
    elixir: 4,
    rarity: "rare",
    type: "troop",
  },
  {
    id: 26000013,
    name: "Baby Dragon",
    elixir: 4,
    rarity: "epic",
    type: "troop",
  },
  { id: 26000014, name: "Prince", elixir: 5, rarity: "epic", type: "troop" },
  {
    id: 26000015,
    name: "Skeletons",
    elixir: 1,
    rarity: "common",
    type: "troop",
  },
  { id: 26000017, name: "Valkyrie", elixir: 4, rarity: "rare", type: "troop" },
  { id: 26000018, name: "Hog Rider", elixir: 4, rarity: "rare", type: "troop" },
  { id: 26000019, name: "Ice Golem", elixir: 2, rarity: "rare", type: "troop" },
  { id: 26000020, name: "Musketeer", elixir: 4, rarity: "rare", type: "troop" },
  {
    id: 26000021,
    name: "Ice Wizard",
    elixir: 3,
    rarity: "legendary",
    type: "troop",
  },
  {
    id: 27000000,
    name: "Bomb Tower",
    elixir: 4,
    rarity: "rare",
    type: "building",
  },
  {
    id: 27000002,
    name: "Cannon",
    elixir: 3,
    rarity: "common",
    type: "building",
  },
  {
    id: 27000003,
    name: "Tesla",
    elixir: 4,
    rarity: "common",
    type: "building",
  },
  {
    id: 27000001,
    name: "Inferno Tower",
    elixir: 5,
    rarity: "rare",
    type: "building",
  },
  { id: 28000000, name: "Fireball", elixir: 4, rarity: "rare", type: "spell" },
  { id: 28000001, name: "Arrows", elixir: 3, rarity: "common", type: "spell" },
  { id: 28000003, name: "Rocket", elixir: 6, rarity: "rare", type: "spell" },
  { id: 28000006, name: "Zap", elixir: 2, rarity: "common", type: "spell" },
  { id: 28000009, name: "Tornado", elixir: 3, rarity: "epic", type: "spell" },
  {
    id: 28000011,
    name: "The Log",
    elixir: 2,
    rarity: "legendary",
    type: "spell",
  },
];

// ─── Meta Deck Definitions ────────────────────────────────────────────────────
const DECK_DEFS: { name: string; archetype: string; ids: number[] }[] = [
  {
    name: "Giant Witch Beatdown",
    archetype: "beatdown",
    ids: [
      26000003, 26000007, 26000013, 26000017, 26000005, 28000000, 28000001,
      28000006,
    ],
  },
  {
    name: "Hog Cycle",
    archetype: "cycle",
    ids: [
      26000018, 26000000, 26000015, 26000019, 27000002, 28000000, 28000006,
      28000011,
    ],
  },
  {
    name: "Golem Beatdown",
    archetype: "beatdown",
    ids: [
      26000009, 26000013, 26000007, 28000009, 26000001, 28000001, 26000000,
      28000006,
    ],
  },
  {
    name: "PEKKA Bridge Spam",
    archetype: "bridge_spam",
    ids: [
      26000004, 26000006, 26000012, 26000013, 26000017, 28000000, 28000001,
      28000006,
    ],
  },
  {
    name: "Balloon Freeze Cycle",
    archetype: "cycle",
    ids: [
      26000006, 26000019, 26000013, 26000005, 28000001, 28000003, 28000006,
      26000010,
    ],
  },
  {
    name: "Mortar Siege",
    archetype: "siege",
    ids: [
      26000000, 26000015, 27000002, 26000002, 28000006, 28000011, 28000001,
      26000018,
    ],
  },
];

// ─── Sample Players ───────────────────────────────────────────────────────────
const PLAYERS = [
  {
    tag: "#PQ2JVLG8",
    name: "NovaStar",
    trophies: 9842,
    exp: 55,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#8YCJG9U",
    name: "CrownKing",
    trophies: 9711,
    exp: 52,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#L2CVRU9",
    name: "FireStrike",
    trophies: 9650,
    exp: 50,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#GV8CCVV2",
    name: "QuickCycle",
    trophies: 9599,
    exp: 51,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#R0YQLGY",
    name: "GolemPush",
    trophies: 9530,
    exp: 49,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#J2G2PRQY",
    name: "RocketLaunch",
    trophies: 9490,
    exp: 52,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#9PJ2PUCL",
    name: "SilentArrow",
    trophies: 9441,
    exp: 48,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#28ULQJC",
    name: "TeslaDefend",
    trophies: 9388,
    exp: 50,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#8RVJ28LC",
    name: "BridgeBoss",
    trophies: 9320,
    exp: 47,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
  {
    tag: "#QY2RGLVY",
    name: "HogMaster",
    trophies: 9280,
    exp: 46,
    arena: { id: 54000019, name: "Ultimate Champion" },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();

  // 1 ── Cards ──────────────────────────────────────────────────────────────
  const cardRows = CARDS.map((c) => ({
    id: c.id,
    name: c.name,
    max_level: 14,
    elixir_cost: c.elixir,
    // RoyaleAPI CDN uses kebab-case card names
    icon_url: `https://cdn.royaleapi.com/static/img/cards-150/${c.name.toLowerCase().replace(/[\s.]/g, "-").replace(/-+/g, "-")}.png`,
    rarity: c.rarity,
    card_type: c.type,
    updated_at: new Date().toISOString(),
  }));

  const { error: cardErr } = await supabase
    .from("cards")
    .upsert(cardRows, { onConflict: "id" });
  if (cardErr)
    return NextResponse.json(
      { step: "cards", error: cardErr.message },
      { status: 500 },
    );

  // Build elixir map
  const elixirMap = new Map(CARDS.map((c) => [c.id, c.elixir]));

  // 2 ── Decks ───────────────────────────────────────────────────────────────
  const decks = DECK_DEFS.map((def) => {
    const sorted = [...def.ids].sort((a, b) => a - b);
    const hash = computeDeckHash(sorted);
    const avgElixir =
      Math.round(
        (sorted.reduce((s, id) => s + (elixirMap.get(id) ?? 4), 0) / 8) * 100,
      ) / 100;
    return { hash, sorted, def, avgElixir };
  });

  const deckRows = decks.map(({ hash, sorted, def, avgElixir }) => ({
    deck_hash: hash,
    card_ids: sorted,
    avg_elixir: avgElixir,
    archetype: def.archetype,
    created_at: new Date().toISOString(),
  }));

  const { error: deckErr } = await supabase
    .from("decks")
    .upsert(deckRows, { onConflict: "deck_hash", ignoreDuplicates: true });
  if (deckErr)
    return NextResponse.json(
      { step: "decks", error: deckErr.message },
      { status: 500 },
    );

  // 3 ── Players ─────────────────────────────────────────────────────────────
  const playerRows = PLAYERS.map((p) => ({
    tag: p.tag,
    name: p.name,
    trophies: p.trophies,
    exp_level: p.exp,
    arena: p.arena,
    updated_at: new Date().toISOString(),
  }));

  const { error: playerErr } = await supabase
    .from("players")
    .upsert(playerRows, { onConflict: "tag" });
  if (playerErr)
    return NextResponse.json(
      { step: "players", error: playerErr.message },
      { status: 500 },
    );

  // 4 ── Battles ─────────────────────────────────────────────────────────────
  // Simulate 600 realistic battles spread across the last 7 days
  const battleRows = [];
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Win-rate biases per deck to make data interesting
  const deckWrBias = [0.62, 0.58, 0.64, 0.55, 0.6, 0.52];

  for (let i = 0; i < 600; i++) {
    const attackerDeckIdx = i % decks.length;
    const defenderDeckIdx = (i + randBetween(1, 5)) % decks.length;
    const attacker = randFrom(PLAYERS);
    const defender = randFrom(PLAYERS.filter((p) => p.tag !== attacker.tag));
    const timestamp = new Date(
      now - Math.random() * SEVEN_DAYS_MS,
    ).toISOString();
    const bias = deckWrBias[attackerDeckIdx] ?? 0.58;
    const won = Math.random() < bias;

    battleRows.push({
      battle_time: timestamp,
      player_tag: attacker.tag,
      opponent_tag: defender.tag,
      deck_hash: decks[attackerDeckIdx].hash,
      opponent_deck_hash: decks[defenderDeckIdx].hash,
      result: won ? "win" : "loss",
      crowns: won ? randBetween(1, 3) : randBetween(0, 2),
      opponent_crowns: won ? randBetween(0, 2) : randBetween(1, 3),
      elixir_leaked: Math.round(Math.random() * 4 * 10) / 10,
      opponent_elixir_leaked: Math.round(Math.random() * 4 * 10) / 10,
      game_mode: "Ladder",
      arena_id: 54000019,
      is_ladder: true,
      raw: {},
    });
  }

  const { error: battleErr } = await supabase
    .from("battles")
    .insert(battleRows);
  if (battleErr && battleErr.code !== "23505") {
    return NextResponse.json(
      { step: "battles", error: battleErr.message },
      { status: 500 },
    );
  }

  // 5 ── Leaderboard Snapshots ───────────────────────────────────────────────
  const snapTime = new Date().toISOString();
  const snapRows = PLAYERS.map((p, i) => ({
    location_id: 57000006,
    rank: i + 1,
    player_tag: p.tag,
    player_name: p.name,
    trophies: p.trophies,
    clan_name: null,
    snapped_at: snapTime,
  }));

  const { error: snapErr } = await supabase
    .from("leaderboard_snapshots")
    .insert(snapRows);
  if (snapErr && snapErr.code !== "23505") {
    return NextResponse.json(
      { step: "snapshots", error: snapErr.message },
      { status: 500 },
    );
  }

  // 6 ── Refresh Materialized Views ──────────────────────────────────────────
  // These must be plain REFRESH (not CONCURRENT) since it may be the first refresh.
  const views = ["meta_deck_stats", "global_leaderboard", "card_performance"];
  for (const view of views) {
    try {
      const { error: refreshErr } = await supabase.rpc("exec_sql", {
        sql: `REFRESH MATERIALIZED VIEW ${view}`,
      });
      if (refreshErr) {
        console.warn(
          `[seed] Could not auto-refresh ${view}:`,
          refreshErr.message,
        );
      }
    } catch (e) {
      console.warn(
        `[seed] exec_sql RPC unavailable, skip refresh of ${view}`,
        e,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    cards: cardRows.length,
    decks: deckRows.length,
    players: playerRows.length,
    battles: battleRows.length,
    snapshots: snapRows.length,
    note: "Run in Supabase SQL editor: REFRESH MATERIALIZED VIEW meta_deck_stats; REFRESH MATERIALIZED VIEW global_leaderboard; REFRESH MATERIALIZED VIEW card_performance;",
  });
}
