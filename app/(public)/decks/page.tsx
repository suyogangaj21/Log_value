// app/(public)/decks/page.tsx
// Meta Deck Search — interactive filters via Client Component.
import { Suspense } from "react";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import { Skeleton } from "@/components/ui/skeleton";
import { DeckSearchPage } from "@/components/deck-search-filters";

export const metadata: Metadata = {
  title: "Meta Decks",
  description:
    "Search and filter the top Clash Royale meta decks by elixir, archetype, and card inclusion.",
};

const fetchInitialDecks = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("meta_deck_stats")
      .select(
        "deck_hash, card_ids, avg_elixir, archetype, win_rate, cwr, rating, use_count",
      )
      .order("rating", { ascending: false })
      .limit(200);
    return data ?? [];
  },
  ["meta-decks-all"],
  { revalidate: 60 },
);

const fetchAllCards = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cards")
      .select("id, name, icon_url, elixir_cost")
      .order("elixir_cost", { ascending: true });
    return data ?? [];
  },
  ["all-cards-filter"],
  { revalidate: 3600 },
);

export default async function DecksPage() {
  const [decks, cards] = await Promise.all([
    fetchInitialDecks(),
    fetchAllCards(),
  ]);

  return (
    <Suspense fallback={<DecksSkeleton />}>
      <DeckSearchPage initialDecks={decks} allCards={cards} />
    </Suspense>
  );
}

function DecksSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-10">
      <Skeleton className="h-8 w-48 bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
