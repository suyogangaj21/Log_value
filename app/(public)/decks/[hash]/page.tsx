// app/(public)/decks/[hash]/page.tsx
// Deck detail: stats, similar decks, card matchup grid.
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeckCard } from "@/components/ui/deck-card";
import { StatCard } from "@/components/ui/stat-card";
import { WinRateBar } from "@/components/ui/win-rate-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { findSimilarDecks } from "@/lib/analytics/matchups";
import {
  ARCHETYPE_LABELS,
  ARCHETYPE_COLORS,
  type Archetype,
} from "@/lib/analytics/archetypes";

interface Props {
  params: Promise<{ hash: string }>;
}

const fetchDeck = unstable_cache(
  async (hash: string) => {
    const supabase = createPublicClient();
    const [{ data: deck }, { data: stats }] = await Promise.all([
      supabase.from("decks").select("*").eq("deck_hash", hash).single(),
      supabase
        .from("meta_deck_stats")
        .select("*")
        .eq("deck_hash", hash)
        .single(),
    ]);
    return { deck, stats };
  },
  ["deck-detail"],
  { revalidate: 120 },
);

const fetchSimilarDecks = unstable_cache(
  async (cardIds: number[]) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("meta_deck_stats")
      .select(
        "deck_hash, card_ids, avg_elixir, archetype, win_rate, cwr, rating",
      )
      .order("rating", { ascending: false })
      .limit(500);
    return findSimilarDecks(cardIds, data ?? [], 0.5, 8);
  },
  ["similar-decks"],
  { revalidate: 120 },
);

const fetchCardMap = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cards")
      .select("id, name, icon_url, elixir_cost");
    const m = new Map<
      number,
      { name: string; icon_url?: string; elixir_cost?: number }
    >();
    for (const c of data ?? []) m.set(c.id, c);
    return m;
  },
  ["card-map"],
  { revalidate: 3600 },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("meta_deck_stats")
    .select("archetype, avg_elixir, win_rate")
    .eq("deck_hash", hash)
    .single();
  if (!data) return { title: "Deck Detail" };
  const arch =
    ARCHETYPE_LABELS[(data.archetype as Archetype) ?? "unknown"] ?? "Unknown";
  return {
    title: `${arch} Deck — ${data.avg_elixir?.toFixed(1)} elixir`,
    description: `${arch} deck with ${(data.win_rate ?? 0 * 100).toFixed(1)}% win rate in Clash Royale.`,
  };
}

export default async function DeckDetailPage({ params }: Props) {
  const { hash } = await params;
  const [{ deck, stats }, cardMap] = await Promise.all([
    fetchDeck(hash),
    fetchCardMap(),
  ]);

  if (!deck) notFound();

  const cards = (deck.card_ids as number[]).map((id: number) => ({
    id,
    ...(cardMap.get(id) ?? { name: `Card ${id}` }),
  }));

  const similarDecks = stats
    ? await fetchSimilarDecks(deck.card_ids as number[])
    : [];

  const arch = (deck.archetype ?? "unknown") as Archetype;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      {/* Deck display */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-2xl font-black text-white">Deck Analysis</h1>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${ARCHETYPE_COLORS[arch]}`}
          >
            {ARCHETYPE_LABELS[arch]}
          </span>
        </div>
        <DeckCard
          cards={cards}
          avgElixir={deck.avg_elixir}
          archetype={deck.archetype}
        />
      </div>

      {/* Stats */}
      {stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Rating"
              value={((stats.rating ?? 0) * 100).toFixed(1)}
              highlight="blue"
            />
            <StatCard
              label="Win Rate"
              value={
                stats.win_rate ? `${(stats.win_rate * 100).toFixed(1)}%` : "—"
              }
            />
            <StatCard
              label="Clean WR"
              value={stats.cwr ? `${(stats.cwr * 100).toFixed(1)}%` : "—"}
              highlight="green"
            />
            <StatCard
              label="Battles"
              value={(stats.use_count ?? 0).toLocaleString()}
            />
          </div>
          <WinRateBar winRate={stats.win_rate} cwr={stats.cwr} />
        </>
      ) : (
        <p className="text-sm text-zinc-600">
          No aggregated stats yet for this deck.
        </p>
      )}

      {/* Similar Decks */}
      {similarDecks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">Similar Decks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {similarDecks.map((sd) => {
              const simCards = (sd.card_ids as number[]).map((id: number) => ({
                id,
                ...(cardMap.get(id) ?? { name: `Card ${id}` }),
              }));
              return (
                <Link
                  key={sd.deck_hash}
                  href={`/decks/${sd.deck_hash}`}
                  className="block rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-3 transition-all hover:border-purple-700/40"
                >
                  <DeckCard
                    cards={simCards}
                    avgElixir={sd.avg_elixir}
                    archetype={sd.archetype}
                    compact
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      Similarity{" "}
                      <span className="font-bold text-zinc-300">
                        {(sd.similarity * 100).toFixed(0)}%
                      </span>
                    </span>
                    {sd.win_rate && (
                      <span>WR {(sd.win_rate * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
