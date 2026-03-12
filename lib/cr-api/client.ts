// lib/cr-api/client.ts
// Server-only Clash Royale API v1 typed client.
// Never import this from client components — API key stays server-side.

import type {
  CRPlayer,
  CRBattle,
  CRUpcomingChests,
  CRClan,
  CRRiverRaceLog,
  CRCurrentRiverRace,
  CRLeaderboard,
  CRCardList,
  CRAPIError as CRAPIErrorType,
} from "./types";
import { acquireToken } from "./rate-limiter";

const BASE_URL =
  process.env.CR_API_BASE_URL ?? "https://api.clashroyale.com/v1";

/** Encode a player/clan tag for use in URL paths (# → %23) */
export function encodeTag(tag: string): string {
  return encodeURIComponent(tag.startsWith("#") ? tag : `#${tag}`);
}

/** Parse the Supercell battle timestamp "20240315T120000.000Z" into a Date */
export function parseBattleTime(ts: string): Date {
  // Format: YYYYMMDDTHHmmss.SSSZ
  const iso = ts.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/,
    "$1-$2-$3T$4:$5:$6.$7Z",
  );
  return new Date(iso);
}

class CRAPIError extends Error {
  constructor(
    public status: number,
    public reason: string,
    message?: string,
  ) {
    super(message ?? reason);
    this.name = "CRAPIError";
  }
}

async function crFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.SUPERCELL_API_KEY;
  if (!apiKey) throw new Error("SUPERCELL_API_KEY is not set");

  await acquireToken();

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    // do not cache at the fetch layer — workers control freshness
    cache: "no-store",
  });

  if (!res.ok) {
    let errBody: CRAPIErrorType | null = null;
    try {
      errBody = (await res.json()) as CRAPIErrorType;
    } catch {
      // ignore parse error
    }
    throw new CRAPIError(
      res.status,
      errBody?.reason ?? "unknown",
      errBody?.message,
    );
  }

  return res.json() as Promise<T>;
}

// ============================================================
// Players
// ============================================================

export async function getPlayer(tag: string): Promise<CRPlayer> {
  return crFetch<CRPlayer>(`/players/${encodeTag(tag)}`);
}

export async function getPlayerBattleLog(tag: string): Promise<CRBattle[]> {
  return crFetch<CRBattle[]>(`/players/${encodeTag(tag)}/battlelog`);
}

export async function getPlayerUpcomingChests(
  tag: string,
): Promise<CRUpcomingChests> {
  return crFetch<CRUpcomingChests>(`/players/${encodeTag(tag)}/upcomingchests`);
}

// ============================================================
// Clans
// ============================================================

export async function getClan(tag: string): Promise<CRClan> {
  return crFetch<CRClan>(`/clans/${encodeTag(tag)}`);
}

export async function getClanRiverRaceLog(
  tag: string,
): Promise<CRRiverRaceLog> {
  return crFetch<CRRiverRaceLog>(`/clans/${encodeTag(tag)}/riverracelog`);
}

export async function getClanCurrentRiverRace(
  tag: string,
): Promise<CRCurrentRiverRace> {
  return crFetch<CRCurrentRiverRace>(
    `/clans/${encodeTag(tag)}/currentriverrace`,
  );
}

// ============================================================
// Cards
// ============================================================

export async function getAllCards(): Promise<CRCardList> {
  return crFetch<CRCardList>("/cards");
}

// ============================================================
// Leaderboards
// ============================================================

/**
 * @param locationId  57000006 = global; pass a country ID for regional
 * @param limit       max 1000
 */
export async function getPlayerLeaderboard(
  locationId = 57000006,
  limit = 1000,
): Promise<CRLeaderboard> {
  return crFetch<CRLeaderboard>(
    `/locations/${locationId}/rankings/players?limit=${limit}`,
  );
}

export async function getClanLeaderboard(
  locationId = 57000006,
  limit = 200,
): Promise<CRLeaderboard> {
  return crFetch<CRLeaderboard>(
    `/locations/${locationId}/rankings/clans?limit=${limit}`,
  );
}

export { CRAPIError };
