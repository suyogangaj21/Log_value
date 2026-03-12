// components/ui/deck-card.tsx
// Displays 8-card deck grid with card images, elixir costs, avg elixir.

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ElixirBadge, AvgElixirBadge } from "./elixir-badge";
import {
  ARCHETYPE_LABELS,
  ARCHETYPE_COLORS,
  type Archetype,
} from "@/lib/analytics/archetypes";

interface CardSlot {
  id: number;
  name: string;
  icon_url?: string | null;
  elixir_cost?: number | null;
}

interface DeckCardProps {
  cards: CardSlot[];
  avgElixir?: number | null;
  archetype?: string | null;
  deckHash?: string;
  className?: string;
  compact?: boolean;
}

export function DeckCard({
  cards,
  avgElixir,
  archetype,
  className,
  compact = false,
}: DeckCardProps) {
  const arch = (archetype ?? "unknown") as Archetype;
  const archLabel = ARCHETYPE_LABELS[arch] ?? "Unknown";
  const archColor = ARCHETYPE_COLORS[arch] ?? ARCHETYPE_COLORS.unknown;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-3",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-1.5",
          compact ? "grid-cols-8" : "grid-cols-4 sm:grid-cols-8",
        )}
      >
        {cards.slice(0, 8).map((card) => (
          <div
            key={card.id}
            className="group relative flex flex-col items-center gap-0.5"
          >
            <div className="relative overflow-hidden rounded-lg border border-zinc-700/40 bg-zinc-800">
              {card.icon_url ? (
                <Image
                  src={card.icon_url}
                  alt={card.name}
                  width={compact ? 40 : 56}
                  height={compact ? 48 : 64}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center bg-zinc-700 text-zinc-400 text-[8px] font-bold text-center p-1",
                    compact ? "h-12 w-10" : "h-16 w-14",
                  )}
                >
                  {card.name.slice(0, 6)}
                </div>
              )}
              <div className="absolute bottom-0.5 right-0.5">
                <ElixirBadge cost={card.elixir_cost} size="sm" />
              </div>
            </div>
            {!compact && (
              <span className="w-full truncate text-center text-[9px] text-zinc-500 group-hover:text-zinc-300">
                {card.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {(avgElixir !== null && avgElixir !== undefined) || archetype ? (
        <div className="mt-2.5 flex items-center gap-2">
          {avgElixir !== null && avgElixir !== undefined && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>Avg</span>
              <AvgElixirBadge avgElixir={avgElixir} />
            </div>
          )}
          {archetype && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                archColor,
              )}
            >
              {archLabel}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
