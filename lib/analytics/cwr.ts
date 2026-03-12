// lib/analytics/cwr.ts
// Clean Win Rate (CWR) — recalculates WR after filtering "mirror matches"
// (battles where both decks share at least one card).
// Reveals true deck strength against a diverse field.

export interface BattleRecord {
  result: "win" | "loss" | "draw";
  deck_card_ids: number[]; // player's 8 cards
  opponent_deck_card_ids: number[]; // opponent's 8 cards
}

/**
 * Returns true if the two decks share at least one card ID.
 */
export function hasMirrorCard(deckA: number[], deckB: number[]): boolean {
  const setB = new Set(deckB);
  return deckA.some((id) => setB.has(id));
}

/**
 * Compute Clean Win Rate for a set of battle records.
 * Filters out any battle where the opponent shares a card with us.
 *
 * @returns { cwr, cleanWins, cleanLosses, cleanTotal } or null if no clean battles
 */
export function computeCWR(battles: BattleRecord[]): {
  cwr: number;
  cleanWins: number;
  cleanLosses: number;
  cleanTotal: number;
} | null {
  const clean = battles.filter(
    (b) => !hasMirrorCard(b.deck_card_ids, b.opponent_deck_card_ids),
  );

  if (clean.length === 0) return null;

  const wins = clean.filter((b) => b.result === "win").length;
  const losses = clean.filter((b) => b.result === "loss").length;
  const total = wins + losses; // exclude draws from WR denominator

  return {
    cwr: total > 0 ? wins / total : 0,
    cleanWins: wins,
    cleanLosses: losses,
    cleanTotal: clean.length,
  };
}

/**
 * SQL-compatible helper: given pre-aggregated per-deck data,
 * estimate CWR from the stored `cwr` column (computed by a Postgres worker function).
 * This is used when we don't have individual battle records available.
 */
export function formatCWR(cwr: number | null): string {
  if (cwr === null) return "N/A";
  return `${(cwr * 100).toFixed(1)}%`;
}
