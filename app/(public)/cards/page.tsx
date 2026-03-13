// app/(public)/cards/page.tsx
// Cards gallery — image grid with category tabs (All / Hero / Evo / Win Con / Spells / Tower).
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { CardsGrid, type CardData } from "@/components/cards-grid";

export const metadata: Metadata = {
  title: "Cards",
  description:
    "Browse all Clash Royale cards by category: Hero, Evo, Win Con, Spells, and Tower troops.",
};

const fetchCards = unstable_cache(
  async (): Promise<CardData[]> => {
    const supabase = createPublicClient();

    // All cards — with attributes so we can detect evolutions client-side
    const { data: cards } = await supabase
      .from("cards")
      .select("id, name, icon_url, elixir_cost, rarity, card_type, attributes")
      .order("name");

    // Performance data (optional — only present after battle sync)
    const { data: perf } = await supabase
      .from("card_performance")
      .select("card_id, win_rate, cwr, rating, use_count");

    const perfMap = Object.fromEntries(
      (perf ?? []).map((p) => [p.card_id, p]),
    );

    return (cards ?? []).map((c) => {
      const attrs = c.attributes as { maxEvolutionLevel?: number | null } | null;
      const p = perfMap[c.id] ?? null;
      return {
        id: c.id,
        name: c.name,
        icon_url: c.icon_url ?? null,
        elixir_cost: c.elixir_cost ?? null,
        rarity: c.rarity ?? null,
        card_type: c.card_type ?? null,
        is_evo: !!(attrs?.maxEvolutionLevel),
        win_rate: p?.win_rate ?? null,
        cwr: p?.cwr ?? null,
        rating: p?.rating ?? null,
        use_count: p?.use_count ?? null,
      };
    });
  },
  ["cards-gallery"],
  { revalidate: 3600 },
);

export default async function CardsPage() {
  const cards = await fetchCards();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-primary" />
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
            Cards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All Clash Royale cards — hover for rating, filter by category.
          </p>
        </div>
      </div>

      <CardsGrid cards={cards} />
    </div>
  );
}
