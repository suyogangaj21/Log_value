// app/api/workers/sync-leaderboard/route.ts
// Fetches top 1000 global player rankings, upserts players,
// and queues their tags into `leaderboard_snapshots` for battle syncing.

import { NextRequest, NextResponse } from "next/server";
import { getPlayerLeaderboard } from "@/lib/cr-api/client";
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

  try {
    const leaderboard = await getPlayerLeaderboard(57000006, 1000);
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Upsert player stubs (lightweight — full sync happens in sync-battles)
    const playerRows = leaderboard.items.map((entry) => ({
      tag: entry.tag,
      name: entry.name,
      trophies: entry.trophies,
      exp_level: entry.expLevel,
      clan_tag: entry.clan?.tag ?? null,
      clan_name: entry.clan?.name ?? null,
      arena: entry.arena,
      updated_at: now,
    }));

    const { error: playerErr } = await supabase
      .from("players")
      .upsert(playerRows, { onConflict: "tag" });
    if (playerErr) throw playerErr;

    // Insert leaderboard snapshot rows
    const snapshotRows = leaderboard.items.map((entry) => ({
      location_id: 57000006,
      rank: entry.rank,
      player_tag: entry.tag,
      player_name: entry.name,
      trophies: entry.trophies,
      clan_name: entry.clan?.name ?? null,
      snapped_at: now,
    }));

    // Keep only today's latest snapshot per rank — truncate approach using upsert with snapped_at
    const { error: snapErr } = await supabase
      .from("leaderboard_snapshots")
      .insert(snapshotRows);
    if (snapErr) throw snapErr;

    return NextResponse.json({ synced: leaderboard.items.length });
  } catch (err) {
    console.error("[sync-leaderboard]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
