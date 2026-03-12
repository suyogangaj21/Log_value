// lib/analytics/archetypes.ts
// Rule-based deck archetype classification.
// Card IDs sourced from the official Clash Royale API card list.

export type Archetype =
  | "beatdown"
  | "siege"
  | "control"
  | "bridge_spam"
  | "cycle"
  | "unknown";

// --- Known card IDs grouped by role ---
// IDs from https://api.clashroyale.com/v1/cards
// Update when new cards are released.

const BEATDOWN_TANKS = new Set([
  26000006, // Giant
  26000012, // Golem
  26000015, // Lava Hound
  26000073, // Giant Skeleton (anchor)
  26000058, // Mega Knight
  26000091, // Goblin Giant
  26000099, // Electro Giant
]);

const SIEGE_BUILDINGS = new Set([
  27000005, // X-Bow
  27000009, // Mortar
]);

// Cards that define "Bridge Spam" pressure
const BRIDGE_SPAM_CARDS = new Set([
  26000029, // Battle Ram
  26000043, // Bandit
  26000051, // Royal Ghost
  26000059, // Ram Rider
  26000084, // Goblin Drill
  26000063, // Dark Prince (often paired)
]);

// Win conditions that disqualify pure "control" label
const WIN_CONDITIONS = new Set([
  ...BEATDOWN_TANKS,
  ...SIEGE_BUILDINGS,
  26000009, // Hog Rider
  26000032, // Balloon
  26000038, // Miner
  26000042, // Graveyard
  26000052, // Sparky
  26000085, // Prince
]);

/**
 * Classify a deck into an archetype.
 *
 * @param sortedCardIds    sorted ascending array of 8 card IDs
 * @param elixirMap        card ID → elixir cost (used for avg elixir calc)
 */
export function classifyArchetype(
  sortedCardIds: number[],
  elixirMap: Map<number, number>,
): Archetype {
  const idSet = new Set(sortedCardIds);

  // Compute avg elixir
  let total = 0;
  let count = 0;
  for (const id of sortedCardIds) {
    const cost = elixirMap.get(id);
    if (cost !== undefined) {
      total += cost;
      count++;
    }
  }
  const avgElixir = count ? total / count : 0;

  // Beatdown: has a tank + avg elixir ≥ 3.8
  const hasTank = [...BEATDOWN_TANKS].some((id) => idSet.has(id));
  if (hasTank && avgElixir >= 3.8) return "beatdown";

  // Siege: contains X-Bow or Mortar
  const hasSiege = [...SIEGE_BUILDINGS].some((id) => idSet.has(id));
  if (hasSiege) return "siege";

  // Cycle: very low average elixir
  if (avgElixir <= 2.9) return "cycle";

  // Bridge Spam: medium elixir + bridge spam pressure cards
  const bridgeCount = [...BRIDGE_SPAM_CARDS].filter((id) =>
    idSet.has(id),
  ).length;
  if (bridgeCount >= 2 && avgElixir <= 3.9) return "bridge_spam";

  // Control: no clear win condition, avg ≤ 3.6
  const hasWinCon = [...WIN_CONDITIONS].some((id) => idSet.has(id));
  if (!hasWinCon && avgElixir <= 3.6) return "control";

  return "unknown";
}

/** Human-readable archetype label */
export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  beatdown: "Beatdown",
  siege: "Siege",
  control: "Control",
  bridge_spam: "Bridge Spam",
  cycle: "Cycle",
  unknown: "Unknown",
};

/** Tailwind color classes per archetype for badges */
export const ARCHETYPE_COLORS: Record<Archetype, string> = {
  beatdown: "bg-red-900/60 text-red-300 border-red-700",
  siege: "bg-orange-900/60 text-orange-300 border-orange-700",
  control: "bg-blue-900/60 text-blue-300 border-blue-700",
  bridge_spam: "bg-purple-900/60 text-purple-300 border-purple-700",
  cycle: "bg-green-900/60 text-green-300 border-green-700",
  unknown: "bg-zinc-800/60 text-zinc-400 border-zinc-600",
};
