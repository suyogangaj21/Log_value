// app/(public)/page.tsx
// Home — animated landing hero (above fold) + live meta dashboard (below fold).

import { Suspense } from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import { DeckCard } from "@/components/ui/deck-card";
import { WinRateBar } from "@/components/ui/win-rate-bar";
import { StatCard } from "@/components/ui/stat-card";
import { AvgElixirBadge } from "@/components/ui/elixir-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, Crown, TrendingUp, Zap } from "lucide-react";
import { LandingHero } from "@/components/landing-hero";

// ---- Data Fetchers -------------------------------------------------------

const fetchMetaDecks = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("meta_deck_stats")
      .select(
        "deck_hash, card_ids, avg_elixir, archetype, win_rate, cwr, rating, use_count",
      )
      .order("rating", { ascending: false })
      .limit(12);
    return data ?? [];
  },
  ["meta-decks-home"],
  { revalidate: 60 },
);

const fetchTopCards = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("card_performance")
      .select(
        "card_id, name, icon_url, elixir_cost, win_rate, cwr, rating, use_count",
      )
      .order("rating", { ascending: false })
      .limit(10);
    return data ?? [];
  },
  ["top-cards-home"],
  { revalidate: 60 },
);

const fetchTopPlayers = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("global_leaderboard")
      .select("current_rank, player_tag, player_name, trophies, clan_name")
      .order("current_rank", { ascending: true })
      .limit(10);
    return data ?? [];
  },
  ["top-players-home"],
  { revalidate: 120 },
);

const fetchCardMap = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cards")
      .select("id, name, icon_url, elixir_cost");
    const map = new Map<
      number,
      { name: string; icon_url?: string; elixir_cost?: number }
    >();
    for (const c of data ?? []) map.set(c.id, c);
    return map;
  },
  ["card-map-home"],
  { revalidate: 3600 },
);

// ---- Page ----------------------------------------------------------------

export default async function HomePage() {
  const [metaDecks, topCards, topPlayers, cardMap] = await Promise.all([
    fetchMetaDecks(),
    fetchTopCards(),
    fetchTopPlayers(),
    fetchCardMap(),
  ]);

  return (
    <>
      {/* ── Animated landing hero + features (above the fold) ── */}
      <LandingHero
        topDeckCards={
          metaDecks[0]
            ? (metaDecks[0].card_ids as number[]).map((id) => {
                const info = cardMap.get(id);
                return {
                  id,
                  name: info?.name ?? `Card ${id}`,
                  icon_url: info?.icon_url,
                  elixir_cost: info?.elixir_cost,
                };
              })
            : undefined
        }
        topDeckWinRate={metaDecks[0]?.win_rate ?? undefined}
        topDeckArchetype={metaDecks[0]?.archetype ?? undefined}
        topDeckAvgElixir={metaDecks[0]?.avg_elixir ?? undefined}
      />

      {/* ── Below-fold analytics data ─────────────────────────── */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-16 sm:px-6">
        {/* Top Meta Decks */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-white">Top Meta Decks</h2>
            <Link
              href="/decks"
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              View all →
            </Link>
          </div>
          {metaDecks.length === 0 ? (
            <EmptyState message="No deck data yet — run the sync-battles worker to populate." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metaDecks.slice(0, 6).map((deck) => {
                const cards = (deck.card_ids as number[]).map((id) => ({
                  id,
                  ...(cardMap.get(id) ?? { name: `Card ${id}` }),
                }));
                return (
                  <Link
                    key={deck.deck_hash}
                    href={`/decks/${deck.deck_hash}`}
                    className="group block rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-4 transition-all hover:border-purple-700/60 hover:bg-zinc-900"
                  >
                    <DeckCard
                      cards={cards}
                      avgElixir={deck.avg_elixir}
                      archetype={deck.archetype}
                      compact
                    />
                    <div className="mt-3 space-y-1">
                      <WinRateBar winRate={deck.win_rate} cwr={deck.cwr} />
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          Rating{" "}
                          <span className="font-bold text-purple-400">
                            {((deck.rating ?? 0) * 100).toFixed(1)}
                          </span>
                        </span>
                        <span>
                          {(deck.use_count ?? 0).toLocaleString()} battles
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Cards + Top Players side by side */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top Cards */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-white">Card Tier List</h2>
              <Link
                href="/cards"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>
            {topCards.length === 0 ? (
              <EmptyState message="No card data yet." />
            ) : (
              <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-700/50 overflow-hidden">
                {topCards.map((card, i) => (
                  <Link
                    key={card.card_id}
                    href={`/cards/${card.card_id}`}
                    className="flex items-center gap-3 bg-zinc-900/60 px-4 py-3 transition-colors hover:bg-zinc-800/80"
                  >
                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      {i + 1}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-zinc-800">
                      {card.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.icon_url}
                          alt={card.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[8px] font-bold text-zinc-400">
                          {card.name.slice(0, 4)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">
                        {card.name}
                      </p>
                      <WinRateBar
                        winRate={card.win_rate}
                        cwr={card.cwr}
                        showLabels={false}
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-400 tabular-nums">
                      {((card.rating ?? 0) * 100).toFixed(1)}R
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Top Players */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-white">
                Global Leaderboard
              </h2>
              <Link
                href="/leaderboard"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>
            {topPlayers.length === 0 ? (
              <EmptyState message="No leaderboard data yet — run sync-leaderboard." />
            ) : (
              <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-700/50 overflow-hidden">
                {topPlayers.map((player) => (
                  <Link
                    key={player.player_tag}
                    href={`/players/${encodeURIComponent(player.player_tag)}`}
                    className="flex items-center gap-3 bg-zinc-900/60 px-4 py-3 transition-colors hover:bg-zinc-800/80"
                  >
                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      {player.current_rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">
                        {player.player_name}
                      </p>
                      {player.clan_name && (
                        <p className="truncate text-xs text-zinc-500">
                          {player.clan_name}
                        </p>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 tabular-nums">
                      <Crown size={12} />
                      {player.trophies.toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700/50 py-12 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}
