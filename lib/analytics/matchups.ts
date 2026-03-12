// lib/analytics/matchups.ts
// Card matchup analysis — computes win rates for card A vs card B.
// Also provides the Jaccard-based deck similarity engine.

export interface MatchupEntry {
  card_a_id: number;
  card_b_id: number;
  wins_with_a: number;
  total_a_vs_b: number;
}

export interface MatchupResult {
  cardBId: number;
  winRate: number; // wins_with_a / total_a_vs_b
  totalGames: number;
  isHardCounter: boolean; // opp WR > 60%
  isFavorable: boolean; // own WR > 60%
}

const MIN_GAMES = 30; // minimum games to be considered statistically significant

/**
 * Process raw matchup rows for a given card into structured results.
 */
export function buildMatchupResults(entries: MatchupEntry[]): MatchupResult[] {
  return entries
    .filter((e) => e.total_a_vs_b >= MIN_GAMES)
    .map((e) => {
      const winRate = e.total_a_vs_b > 0 ? e.wins_with_a / e.total_a_vs_b : 0.5;
      return {
        cardBId: e.card_b_id,
        winRate,
        totalGames: e.total_a_vs_b,
        isHardCounter: winRate < 0.4, // opponent wins > 60%
        isFavorable: winRate > 0.6,
      };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

/**
 * Jaccard similarity between two decks (sets of card IDs).
 * Returns 0–1 where 1 = identical decks.
 */
export function jaccardSimilarity(deckA: number[], deckB: number[]): number {
  const setA = new Set(deckA);
  const setB = new Set(deckB);
  const intersection = [...setA].filter((id) => setB.has(id)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Find the most similar decks to a reference deck from a candidate list.
 * Returns candidates sorted by descending similarity, with a minimum threshold.
 */
export function findSimilarDecks<T extends { card_ids: number[] }>(
  reference: number[],
  candidates: T[],
  minSimilarity = 0.5,
  maxResults = 20,
): Array<T & { similarity: number }> {
  return candidates
    .map((c) => ({
      ...c,
      similarity: jaccardSimilarity(reference, c.card_ids),
    }))
    .filter((c) => c.similarity >= minSimilarity && c.similarity < 1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}
