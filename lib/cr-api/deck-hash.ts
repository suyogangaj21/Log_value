// lib/cr-api/deck-hash.ts
// Deterministic deck fingerprint: SHA-256 of sorted card IDs

import { createHash } from "crypto";

/**
 * Compute a stable deck hash from an array of card IDs.
 * Always sorts ascending so card order doesn't matter.
 */
export function computeDeckHash(cardIds: number[]): string {
  const sorted = [...cardIds].sort((a, b) => a - b).join(",");
  return createHash("sha256").update(sorted).digest("hex");
}

/**
 * Compute average elixir cost for a deck.
 * cardElixirMap: { cardId -> elixirCost }
 */
export function computeAvgElixir(
  cardIds: number[],
  cardElixirMap: Map<number, number>,
): number {
  let total = 0;
  let count = 0;
  for (const id of cardIds) {
    const cost = cardElixirMap.get(id);
    if (cost !== undefined) {
      total += cost;
      count++;
    }
  }
  return count ? Math.round((total / count) * 100) / 100 : 0;
}
