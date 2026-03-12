// app/api/workers/sync-battles/route.ts
// Fetches battle logs for a batch of top players, deduplicates,
// and inserts into the partitioned `battles` table.
//
// Called with: GET /api/workers/sync-battles?offset=0&limit=50
// The Vercel cron strides through offsets over successive runs.

import { NextRequest, NextResponse } from "next/server";
import {
  getPlayerBattleLog,
  parseBattleTime,
  CRAPIError,
} from "@/lib/cr-api/client";
import { computeDeckHash } from "@/lib/cr-api/deck-hash";
import { classifyArchetype } from "@/lib/analytics/archetypes";
import { createServiceClient } from "@/lib/supabase/service";

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
  );

  try {
    const supabase = createServiceClient();

    // Pull a batch of players from the latest leaderboard snapshot
    const { data: playerBatch, error: fetchErr } = await supabase
      .from("players")
      .select("tag")
      .order("trophies", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchErr) throw fetchErr;
    if (!playerBatch || playerBatch.length === 0) {
      return NextResponse.json({ message: "No players in batch" });
    }

    // Fetch cards for elixir mapping
    const { data: cardRows } = await supabase
      .from("cards")
      .select("id, elixir_cost");
    const elixirMap = new Map<number, number>(
      (cardRows ?? [])
        .filter((c) => c.elixir_cost !== null)
        .map((c) => [c.id, c.elixir_cost!]),
    );

    let insertedBattles = 0;
    let insertedDecks = 0;

    for (const { tag } of playerBatch) {
      try {
        const battles = await getPlayerBattleLog(tag);

        for (const battle of battles) {
          const me = battle.team[0];
          const opp = battle.opponent[0];
          if (!me || !opp) continue;

          const myCardIds = me.cards.map((c) => c.id);
          const oppCardIds = opp.cards.map((c) => c.id);
          if (myCardIds.length !== 8 || oppCardIds.length !== 8) continue;

          const myHash = computeDeckHash(myCardIds);
          const oppHash = computeDeckHash(oppCardIds);

          // Upsert decks
          const sortedMyIds = [...myCardIds].sort((a, b) => a - b);
          const sortedOppIds = [...oppCardIds].sort((a, b) => a - b);

          const deckRows = [
            {
              deck_hash: myHash,
              card_ids: sortedMyIds,
              avg_elixir: computeAvgElixir(myCardIds, elixirMap),
              archetype: classifyArchetype(sortedMyIds, elixirMap),
            },
            {
              deck_hash: oppHash,
              card_ids: sortedOppIds,
              avg_elixir: computeAvgElixir(oppCardIds, elixirMap),
              archetype: classifyArchetype(sortedOppIds, elixirMap),
            },
          ];

          const { error: deckErr } = await supabase
            .from("decks")
            .upsert(deckRows, {
              onConflict: "deck_hash",
              ignoreDuplicates: true,
            });
          if (!deckErr) insertedDecks += deckRows.length;

          // Determine result
          const myCrowns = me.crowns ?? 0;
          const oppCrowns = opp.crowns ?? 0;
          const result: "win" | "loss" | "draw" =
            myCrowns > oppCrowns
              ? "win"
              : myCrowns < oppCrowns
                ? "loss"
                : "draw";

          const battleRow = {
            battle_time: parseBattleTime(battle.battleTime).toISOString(),
            player_tag: me.tag,
            opponent_tag: opp.tag,
            deck_hash: myHash,
            opponent_deck_hash: oppHash,
            result,
            crowns: myCrowns,
            opponent_crowns: oppCrowns,
            elixir_leaked: me.elixirLeaked ?? null,
            opponent_elixir_leaked: opp.elixirLeaked ?? null,
            game_mode: battle.gameMode?.name ?? null,
            arena_id: battle.arena?.id ?? null,
            is_ladder: !battle.isHostedMatch,
            raw: battle,
          };

          const { error: battleErr } = await supabase
            .from("battles")
            .insert(battleRow);

          // Ignore unique constraint violations (deduplication)
          if (!battleErr) insertedBattles++;
          else if (battleErr.code !== "23505") {
            console.warn("[sync-battles] insert error", battleErr.message);
          }
        }
      } catch (e) {
        // 404 = player not found / private; log and continue
        if (e instanceof CRAPIError && e.status === 404) continue;
        console.warn(`[sync-battles] error for tag ${tag}:`, e);
      }
    }

    return NextResponse.json({
      processed: playerBatch.length,
      insertedBattles,
      insertedDecks,
    });
  } catch (err) {
    console.error("[sync-battles]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function computeAvgElixir(ids: number[], map: Map<number, number>): number {
  let total = 0;
  let count = 0;
  for (const id of ids) {
    const cost = map.get(id);
    if (cost !== undefined) {
      total += cost;
      count++;
    }
  }
  return count ? Math.round((total / count) * 100) / 100 : 0;
}
