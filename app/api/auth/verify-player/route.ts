// app/api/auth/verify-player/route.ts
// Verifies a Clash Royale player's ownership by comparing an API token
// they provide (found in game settings) against their player tag.
//
// Flow:
//  1. User provides: playerTag + apiToken (from in-game Settings > Supercell ID → API Token)
//  2. Server calls CR API /players/{tag} with the user's own apiToken as Bearer
//  3. If successful (200), the token is valid and the player owns this account
//  4. Server updates user_profiles: player_tag = tag, verified = true

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encodeTag } from "@/lib/cr-api/client";

const CR_BASE = process.env.CR_API_BASE_URL ?? "https://api.clashroyale.com/v1";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      playerTag?: string;
      apiToken?: string;
    };
    const { playerTag, apiToken } = body;

    if (!playerTag || typeof playerTag !== "string") {
      return NextResponse.json(
        { error: "playerTag is required" },
        { status: 400 },
      );
    }
    if (!apiToken || typeof apiToken !== "string") {
      return NextResponse.json(
        { error: "apiToken is required" },
        { status: 400 },
      );
    }

    // Sanitize tag
    const tag = playerTag.trim().toUpperCase().replace(/^#/, "");
    if (!/^[0-9A-Z]{3,12}$/.test(tag)) {
      return NextResponse.json(
        { error: "Invalid player tag format" },
        { status: 400 },
      );
    }

    // Validate the user's api token by calling the CR API with it
    const verifyRes = await fetch(`${CR_BASE}/players/${encodeTag(tag)}`, {
      headers: { Authorization: `Bearer ${apiToken.trim()}` },
      cache: "no-store",
    });

    if (verifyRes.status === 403 || verifyRes.status === 401) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 403 });
    }
    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: `CR API returned ${verifyRes.status}` },
        { status: 400 },
      );
    }

    // Token is valid — link it to the authenticated Supabase user
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error: upsertErr } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        player_tag: `#${tag}`,
        verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ verified: true, playerTag: `#${tag}` });
  } catch (err) {
    console.error("[verify-player]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
