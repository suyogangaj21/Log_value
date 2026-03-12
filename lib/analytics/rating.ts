// lib/analytics/rating.ts
// The Rating (R) metric — balances Win Rate with statistical confidence from Use Rate.
//
// Formula:  R = WR × (1 − e^(−UR / UR_baseline))
//
// At low UR the term (1−e^…) ≈ 0 so R is heavily penalized.
// At high UR the term → 1 so R ≈ WR.
// UR_baseline controls the "confidence threshold" — decks with UR < baseline
// are considered statistically uncertain.

const UR_BASELINE = 0.01; // 1% use rate = "baseline confidence"

/**
 * Compute the Rating for a deck or card.
 *
 * @param winRate   fraction 0–1  (wins / total_battles)
 * @param useRate   fraction 0–1  (deck_battles / total_battles_in_dataset)
 * @returns rating  0–1
 */
export function computeRating(winRate: number, useRate: number): number {
  if (useRate <= 0 || winRate < 0) return 0;
  const confidence = 1 - Math.exp(-useRate / UR_BASELINE);
  return Math.min(1, winRate * confidence);
}

/**
 * Compute ratings for a collection of deck/card stats rows.
 * totalBattles is needed to normalise use rate across the dataset.
 */
export function computeRatings<
  T extends { win_count: number; use_count: number },
>(
  rows: T[],
  totalBattles: number,
): Array<T & { win_rate: number; use_rate: number; rating: number }> {
  if (totalBattles <= 0) return [];
  return rows.map((row) => {
    const use_rate = row.use_count / totalBattles;
    const win_rate = row.use_count > 0 ? row.win_count / row.use_count : 0;
    const rating = computeRating(win_rate, use_rate);
    return { ...row, win_rate, use_rate, rating };
  });
}
