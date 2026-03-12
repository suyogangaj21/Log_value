// app/(public)/cards/page.tsx
// Card tier list — sorted by Rating, showing WR and CWR.
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { WinRateBar } from "@/components/ui/win-rate-bar";
import { ElixirBadge } from "@/components/ui/elixir-badge";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Card Tier List",
  description:
    "Clash Royale card rankings by Rating (R), Win Rate, and Clean Win Rate.",
};

const fetchCards = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("card_performance")
      .select(
        "card_id, name, icon_url, elixir_cost, rarity, card_type, win_rate, cwr, rating, use_count",
      )
      .order("rating", { ascending: false });
    return data ?? [];
  },
  ["card-tier-list"],
  { revalidate: 300 },
);

const RARITY_COLOR: Record<string, string> = {
  common: "bg-zinc-700 text-zinc-300",
  rare: "bg-blue-900/60 text-blue-300",
  epic: "bg-purple-900/60 text-purple-300",
  legendary: "bg-yellow-900/60 text-yellow-300",
  champion: "bg-red-900/60 text-red-300",
};

export default async function CardsPage() {
  const cards = await fetchCards();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-black text-white">Card Tier List</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ranked by Rating — R = WR × (1 − e<sup>−UR/baseline</sup>). Last 7
          days ladder.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-600">
          No card data yet — run the sync-cards and sync-battles workers to
          populate.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_5rem_6rem_6rem_4rem] gap-x-4 bg-zinc-800/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <span>#</span>
            <span>Card</span>
            <span>Elixir</span>
            <span>WR / CWR</span>
            <span className="hidden sm:block">Battles</span>
            <span>Rating</span>
          </div>
          {cards.map((card, i) => (
            <Link
              key={card.card_id}
              href={`/cards/${card.card_id}`}
              className="grid grid-cols-[2.5rem_1fr_5rem_6rem_6rem_4rem] items-center gap-x-4 bg-zinc-950/50 px-4 py-3 transition-colors hover:bg-zinc-800/50"
            >
              <span className="text-xs font-bold text-zinc-500 tabular-nums">
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-10 w-9 shrink-0 overflow-hidden rounded border border-zinc-700/40 bg-zinc-800">
                  {card.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.icon_url}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-zinc-500">
                      {card.name.slice(0, 4)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-200">
                    {card.name}
                  </p>
                  {card.rarity && (
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${RARITY_COLOR[card.rarity] ?? RARITY_COLOR.common}`}
                    >
                      {card.rarity}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <ElixirBadge cost={card.elixir_cost} size="md" />
              </div>
              <WinRateBar winRate={card.win_rate} cwr={card.cwr} />
              <span className="hidden text-xs text-zinc-500 tabular-nums sm:block">
                {(card.use_count ?? 0).toLocaleString()}
              </span>
              <span className="text-sm font-black text-purple-400 tabular-nums">
                {((card.rating ?? 0) * 100).toFixed(1)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
