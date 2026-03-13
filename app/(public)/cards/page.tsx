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

const RARITY_BADGE: Record<string, string> = {
  common: "border-zinc-600/50 bg-zinc-800/60 text-zinc-400",
  rare: "border-blue-700/50 bg-blue-950/60 text-blue-400",
  epic: "border-violet-700/50 bg-violet-950/60 text-violet-400",
  legendary: "border-yellow-600/50 bg-yellow-950/50 text-yellow-400",
  champion: "border-red-700/50 bg-red-950/60 text-red-400",
};

const RANK_MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

export default async function CardsPage() {
  const cards = await fetchCards();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-primary" />
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
            Card Tier List
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by Rating — R = WR × (1 − e<sup>−UR/baseline</sup>). Last 7
            days ladder.
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No card data yet — run the sync-cards and sync-battles workers to
          populate.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_4.5rem] sm:grid-cols-[2.5rem_1fr_4.5rem_8rem_4.5rem] md:grid-cols-[2.5rem_1fr_5rem_9rem_6rem_5rem] gap-x-3 border-b border-border bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span>#</span>
            <span>Card</span>
            <span className="hidden sm:block">Elixir</span>
            <span className="hidden sm:block">WR / CWR</span>
            <span className="hidden md:block">Battles</span>
            <span>Rating</span>
          </div>
          {cards.map((card, i) => (
            <Link
              key={card.card_id}
              href={`/cards/${card.card_id}`}
              className="group grid grid-cols-[2rem_1fr_4.5rem] sm:grid-cols-[2.5rem_1fr_4.5rem_8rem_4.5rem] md:grid-cols-[2.5rem_1fr_5rem_9rem_6rem_5rem] items-center gap-x-3 border-b border-border/50 px-4 py-3 last:border-0 transition-colors hover:bg-accent/40"
            >
              {/* Rank */}
              <span className="text-center text-sm">
                {i < 3 ? (
                  <span role="img" aria-label={`rank ${i + 1}`}>
                    {RANK_MEDALS[i]}
                  </span>
                ) : (
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                )}
              </span>

              {/* Card info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-9 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-secondary">
                  {card.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.icon_url}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {card.name.slice(0, 4)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {card.name}
                  </p>
                  {card.rarity && (
                    <span
                      className={`inline-block rounded-md border px-1.5 py-px text-[9px] font-semibold uppercase ${
                        RARITY_BADGE[card.rarity] ?? RARITY_BADGE.common
                      }`}
                    >
                      {card.rarity}
                    </span>
                  )}
                </div>
              </div>

              {/* Elixir */}
              <div className="hidden sm:block">
                <ElixirBadge cost={card.elixir_cost} size="md" />
              </div>

              {/* WR Bar */}
              <div className="hidden sm:block">
                <WinRateBar winRate={card.win_rate} cwr={card.cwr} />
              </div>

              {/* Battles */}
              <span className="hidden text-xs tabular-nums text-muted-foreground md:block">
                {(card.use_count ?? 0).toLocaleString()}
              </span>

              {/* Rating */}
              <span className="text-sm font-black tabular-nums text-primary">
                {((card.rating ?? 0) * 100).toFixed(1)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
