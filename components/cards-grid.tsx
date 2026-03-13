// components/cards-grid.tsx
// Client component — tab switching + card image grid for the Cards page.
"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardData {
  id: number;
  name: string;
  icon_url: string | null;
  elixir_cost: number | null;
  rarity: string | null;
  card_type: string | null;
  is_evo: boolean;
  win_rate?: number | null;
  cwr?: number | null;
  rating?: number | null;
  use_count?: number | null;
}

type Tab = "All" | "Hero" | "Evo" | "Win Con" | "Spells" | "Tower";

const TABS: Tab[] = ["All", "Hero", "Evo", "Win Con", "Spells", "Tower"];

// ─── Win Condition card names ─────────────────────────────────────────────────

const WIN_CON_NAMES = new Set([
  "Hog Rider",
  "Balloon",
  "Giant",
  "Golem",
  "Miner",
  "Graveyard",
  "Royal Giant",
  "Goblin Giant",
  "Lava Hound",
  "Three Musketeers",
  "X-Bow",
  "Mortar",
  "Ram Rider",
  "Giant Skeleton",
  "Siege Barracks",
  "Wall Breakers",
  "Battle Ram",
  "Goblin Drill",
  "Royal Hogs",
  "Skeleton Barrel",
  "Flying Machine",
  "Goblin Barrel",
  "Sparky",
  "Witch",
  "Night Witch",
  "Electro Giant",
  "Mega Knight",
  "Pekka",
  "P.E.K.K.A",
]);

// ─── Infer card type from id prefix when card_type is null ───────────────────

function inferType(card: CardData): string {
  if (card.card_type) return card.card_type.toLowerCase();
  if (card.elixir_cost === null || card.elixir_cost === undefined)
    return "tower";
  const prefix = Math.floor(card.id / 1000000);
  if (prefix === 28) return "spell";
  if (prefix === 27) return "building";
  return "troop";
}

// ─── Rarity border colours ───────────────────────────────────────────────────

const RARITY_RING: Record<string, string> = {
  common: "ring-zinc-600/50",
  rare: "ring-blue-500/60",
  epic: "ring-violet-500/70",
  legendary: "ring-yellow-500/70",
  champion: "ring-red-500/80",
};

const RARITY_GLOW: Record<string, string> = {
  common: "",
  rare: "group-hover:shadow-blue-500/20",
  epic: "group-hover:shadow-violet-500/20",
  legendary: "group-hover:shadow-yellow-500/30",
  champion: "group-hover:shadow-red-500/30",
};

const ELIXIR_COLOURS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-zinc-700", text: "text-zinc-300" },
  1: { bg: "bg-purple-900", text: "text-purple-200" },
  2: { bg: "bg-purple-800", text: "text-purple-100" },
  3: { bg: "bg-purple-700", text: "text-purple-100" },
  4: { bg: "bg-violet-700", text: "text-violet-100" },
  5: { bg: "bg-violet-600", text: "text-white" },
  6: { bg: "bg-fuchsia-700", text: "text-white" },
  7: { bg: "bg-fuchsia-600", text: "text-white" },
  8: { bg: "bg-pink-700", text: "text-white" },
  9: { bg: "bg-pink-600", text: "text-white" },
  10: { bg: "bg-rose-700", text: "text-white" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function CardsGrid({ cards }: { cards: CardData[] }) {
  const [tab, setTab] = useState<Tab>("All");

  const filtered = cards.filter((card) => {
    if (tab === "All") return true;
    if (tab === "Hero") return card.rarity?.toLowerCase() === "champion";
    if (tab === "Evo") return card.is_evo;
    if (tab === "Win Con") return WIN_CON_NAMES.has(card.name);
    const t = inferType(card);
    if (tab === "Spells") return t === "spell";
    if (tab === "Tower") return t === "tower";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Tab bar ── */}
      <div className="flex gap-0 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
              ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Card count ── */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} card{filtered.length !== 1 ? "s" : ""}
        {tab !== "All" ? ` in ${tab}` : ""}
      </p>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No cards found.{" "}
          {cards.length === 0
            ? "Run the sync-cards worker to populate card data."
            : `No cards match the "${tab}" filter.`}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-x-1.5 gap-y-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(auto-fill,minmax(68px,1fr))]">
          {filtered.map((card) => {
            const rarity = (card.rarity ?? "common").toLowerCase();
            const ring = RARITY_RING[rarity] ?? RARITY_RING.common;
            const glow = RARITY_GLOW[rarity] ?? "";
            const elixir = card.elixir_cost;
            const elixirStyle =
              elixir !== null && elixir !== undefined
                ? (ELIXIR_COLOURS[elixir] ?? ELIXIR_COLOURS[5])
                : null;
            const ratingPct =
              card.rating != null
                ? ((card.rating as number) * 100).toFixed(1)
                : null;

            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className={`group flex flex-col items-center gap-1`}
                title={card.name}
              >
                {/* Name */}
                <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                  {card.name.length > 9
                    ? card.name.slice(0, 8) + "…"
                    : card.name}
                </span>

                {/* Card image */}
                <div
                  className={`relative w-full overflow-hidden rounded-lg ring-1 ${ring} shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg ${glow} aspect-[5/6]`}
                >
                  {card.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.icon_url}
                      alt={card.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-[8px] font-bold text-muted-foreground">
                      {card.name.slice(0, 3)}
                    </div>
                  )}

                  {/* Evo indicator */}
                  {card.is_evo && (
                    <div className="absolute left-0.5 top-0.5 rounded-sm bg-cyan-500/90 px-0.5 text-[7px] font-black uppercase text-white leading-tight">
                      Evo
                    </div>
                  )}

                  {/* Elixir pip */}
                  {elixirStyle && (
                    <div
                      className={`absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black shadow ${elixirStyle.bg} ${elixirStyle.text}`}
                    >
                      {elixir}
                    </div>
                  )}

                  {/* Rating badge (only when available) */}
                  {ratingPct !== null && (
                    <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex items-center justify-center bg-black/70 py-0.5">
                      <span className="text-[8px] font-black text-primary tabular-nums">
                        {ratingPct}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── CWR footnote ── */}
      <p className="text-xs leading-relaxed text-muted-foreground border-t border-border pt-5">
        <strong className="text-foreground">CWR: Clean Win Rate.</strong> Clean
        Win Rate is the win rate of a card against decks that don&apos;t have
        that card. Normally, CWR would be almost the same as WR, except when the
        card&apos;s usage is exceptionally high — then CWR can be very
        different. A card is considered strong when{" "}
        <span className="font-mono">abs(CWR − WR) &gt; 2%</span>.
      </p>
    </div>
  );
}
