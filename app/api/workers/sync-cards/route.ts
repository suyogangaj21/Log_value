// app/api/workers/sync-cards/route.ts
// Fetches all Clash Royale cards and upserts them into the `cards` table.
// Protected by CRON_SECRET — only callable by Vercel Cron or internal services.

import { NextRequest, NextResponse } from "next/server";
import { getAllCards } from "@/lib/cr-api/client";
import { createClient } from "@/lib/supabase/server";

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items: cards } = await getAllCards();
    const supabase = await createClient();

    const rows = cards.map((c) => ({
      id: c.id,
      name: c.name,
      max_level: c.maxLevel,
      elixir_cost: c.elixirCost ?? null,
      icon_url: c.iconUrls?.medium ?? null,
      rarity: c.rarity ?? null,
      attributes: {
        maxEvolutionLevel: c.maxEvolutionLevel ?? null,
      },
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("cards")
      .upsert(rows, { onConflict: "id" });

    if (error) throw error;

    return NextResponse.json({ synced: rows.length });
  } catch (err) {
    console.error("[sync-cards]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
