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
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-primary" />
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
              Meta Decks
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredDecks.length.toLocaleString()} decks matched
            </p>
          </div>
        </div>
        <SlidersHorizontal className="mt-1 text-muted-foreground" size={20} />
      </div>

      {/* Filters row */}
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Elixir range */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Avg Elixir {elixirRange[0].toFixed(1)}–{elixirRange[1].toFixed(1)}
          </label>
          <Slider
            min={1}
            max={9}
            step={0.1}
            value={elixirRange}
            onValueChange={(v) => setElixirRange(v as [number, number])}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary"
          />
        </div>

        {/* Archetype */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Archetype
          </label>
          <Select value={archetype} onValueChange={setArchetype}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Sort By
          </label>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="win_rate">Win Rate</SelectItem>
              <SelectItem value="cwr">Clean WR</SelectItem>
              <SelectItem value="use_count">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Card Filter
          </label>
          <Input
            placeholder="Search card…"
            value={cardSearch}
            onChange={(e) => setCardSearch(e.target.value)}
          />
          {cardSearch && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-popover text-xs shadow-md">
              {filteredCards.map((card) => {
                const isIncluded = includeCard.includes(card.id);
                const isExcluded = excludeCard.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-accent/50"
                  >
                    <span className="text-foreground">{card.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleInclude(card.id)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                          isIncluded
                            ? "bg-emerald-700/60 text-emerald-300"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => toggleExclude(card.id)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                          isExcluded
                            ? "bg-red-800/60 text-red-300"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
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
                  className="gap-1 border-emerald-700/40 bg-emerald-900/30 text-emerald-400"
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
                  className="gap-1 border-red-800/40 bg-red-900/30 text-red-400"
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
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
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
                className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-[0_0_14px_hsl(var(--primary)/0.15)]"
              >
                <DeckCard
                  cards={cards}
                  avgElixir={deck.avg_elixir}
                  archetype={deck.archetype}
                  compact
                />
                <div className="mt-3 space-y-1.5">
                  <WinRateBar winRate={deck.win_rate} cwr={deck.cwr} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Rating{" "}
                      <span className="font-bold text-primary">
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
