// components/deck-search-filters.tsx
// Interactive deck search: elixir slider, archetype filter, card include/exclude.
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DeckCard } from "@/components/ui/deck-card";
import { WinRateBar } from "@/components/ui/win-rate-bar";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ARCHETYPE_LABELS, type Archetype } from "@/lib/analytics/archetypes";
import { X, SlidersHorizontal } from "lucide-react";

interface DeckRow {
  deck_hash: string;
  card_ids: number[];
  avg_elixir: number;
  archetype: string | null;
  win_rate: number | null;
  cwr: number | null;
  rating: number | null;
  use_count: number | null;
}

interface CardInfo {
  id: number;
  name: string;
  icon_url?: string | null;
  elixir_cost?: number | null;
}

interface Props {
  initialDecks: DeckRow[];
  allCards: CardInfo[];
}

export function DeckSearchPage({ initialDecks, allCards }: Props) {
  const [elixirRange, setElixirRange] = useState<[number, number]>([1, 9]);
  const [archetype, setArchetype] = useState<string>("all");
  const [includeCard, setIncludeCard] = useState<number[]>([]);
  const [excludeCard, setExcludeCard] = useState<number[]>([]);
  const [cardSearch, setCardSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "rating" | "win_rate" | "cwr" | "use_count"
  >("rating");

  const cardMap = useMemo(() => {
    const m = new Map<number, CardInfo>();
    for (const c of allCards) m.set(c.id, c);
    return m;
  }, [allCards]);

  const filteredCards = useMemo(
    () =>
      allCards
        .filter((c) => c.name.toLowerCase().includes(cardSearch.toLowerCase()))
        .slice(0, 40),
    [allCards, cardSearch],
  );

  const filteredDecks = useMemo(() => {
    return initialDecks
      .filter((d) => {
        const avg = d.avg_elixir ?? 0;
        if (avg < elixirRange[0] || avg > elixirRange[1]) return false;
        if (archetype !== "all" && d.archetype !== archetype) return false;
        const ids = new Set(d.card_ids);
        if (includeCard.some((id) => !ids.has(id))) return false;
        if (excludeCard.some((id) => ids.has(id))) return false;
        return true;
      })
      .sort((a, b) => {
        const va = (a[sortBy] ?? 0) as number;
        const vb = (b[sortBy] ?? 0) as number;
        return vb - va;
      });
  }, [initialDecks, elixirRange, archetype, includeCard, excludeCard, sortBy]);

  function toggleInclude(id: number) {
    setIncludeCard((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setExcludeCard((prev) => prev.filter((x) => x !== id));
  }

  function toggleExclude(id: number) {
    setExcludeCard((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setIncludeCard((prev) => prev.filter((x) => x !== id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Meta Decks</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filteredDecks.length.toLocaleString()} decks matched
          </p>
        </div>
        <SlidersHorizontal className="text-zinc-500" size={20} />
      </div>

      {/* Filters row */}
      <div className="mb-6 grid gap-4 rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Elixir range */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Avg Elixir {elixirRange[0].toFixed(1)}–{elixirRange[1].toFixed(1)}
          </label>
          <Slider
            min={1}
            max={9}
            step={0.1}
            value={elixirRange}
            onValueChange={(v) => setElixirRange(v as [number, number])}
            className="[&_[role=slider]]:border-purple-500 [&_[role=slider]]:bg-purple-600"
          />
        </div>

        {/* Archetype */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Archetype
          </label>
          <Select value={archetype} onValueChange={setArchetype}>
            <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-200">
              <SelectItem value="all">All Archetypes</SelectItem>
              {Object.entries(ARCHETYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Sort By
          </label>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-200">
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="win_rate">Win Rate</SelectItem>
              <SelectItem value="cwr">Clean WR</SelectItem>
              <SelectItem value="use_count">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Card Filter
          </label>
          <Input
            placeholder="Search card…"
            value={cardSearch}
            onChange={(e) => setCardSearch(e.target.value)}
            className="border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600"
          />
          {cardSearch && (
            <div className="max-h-40 overflow-y-auto rounded border border-zinc-700 bg-zinc-900 text-xs">
              {filteredCards.map((card) => {
                const isIncluded = includeCard.includes(card.id);
                const isExcluded = excludeCard.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-zinc-800"
                  >
                    <span className="text-zinc-300">{card.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleInclude(card.id)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isIncluded ? "bg-green-700 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"}`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => toggleExclude(card.id)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isExcluded ? "bg-red-700 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"}`}
                      >
                        −
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Active card filters */}
          {(includeCard.length > 0 || excludeCard.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {includeCard.map((id) => (
                <Badge
                  key={id}
                  className="gap-1 bg-green-900/50 text-green-300 border-green-700/50"
                >
                  +{cardMap.get(id)?.name ?? id}
                  <button onClick={() => toggleInclude(id)}>
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              {excludeCard.map((id) => (
                <Badge
                  key={id}
                  className="gap-1 bg-red-900/50 text-red-300 border-red-700/50"
                >
                  −{cardMap.get(id)?.name ?? id}
                  <button onClick={() => toggleExclude(id)}>
                    <X size={10} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results grid */}
      {filteredDecks.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-600">
          No decks match your filters. Try relaxing the constraints.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.slice(0, 60).map((deck) => {
            const cards = (deck.card_ids as number[]).map((cardId) => {
              const info = cardMap.get(cardId);
              return {
                id: cardId,
                name: info?.name ?? `Card ${cardId}`,
                icon_url: info?.icon_url,
                elixir_cost: info?.elixir_cost,
              };
            });
            return (
              <Link
                key={deck.deck_hash}
                href={`/decks/${deck.deck_hash}`}
                className="group block rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-4 transition-all hover:border-purple-700/40 hover:bg-zinc-900"
              >
                <DeckCard
                  cards={cards}
                  avgElixir={deck.avg_elixir}
                  archetype={deck.archetype}
                  compact
                />
                <div className="mt-3 space-y-1.5">
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
    </div>
  );
}
