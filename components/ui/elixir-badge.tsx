// components/ui/elixir-badge.tsx
// Colored elixir cost badge — matches in-game purple gradient aesthetic.

import { cn } from "@/lib/utils";

interface ElixirBadgeProps {
  cost: number | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 text-[10px]",
  md: "h-6 w-6 text-xs",
  lg: "h-8 w-8 text-sm",
};

// Shade elixir costs from light (1) to dark (10+)
function elixirColor(cost: number): string {
  if (cost <= 2) return "from-violet-400 to-purple-600";
  if (cost <= 3) return "from-violet-500 to-purple-700";
  if (cost <= 4) return "from-purple-600 to-fuchsia-800";
  if (cost <= 5) return "from-purple-700 to-fuchsia-900";
  return "from-fuchsia-800 to-red-900";
}

export function ElixirBadge({
  cost,
  size = "md",
  className,
}: ElixirBadgeProps) {
  if (cost === null || cost === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-zinc-700 font-black text-zinc-400",
          sizeClasses[size],
          className,
        )}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={cn(
        `inline-flex items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-md`,
        elixirColor(cost),
        sizeClasses[size],
        className,
      )}
      title={`${cost} elixir`}
    >
      {cost}
    </span>
  );
}

/** Inline text version for avg elixir display in tables */
export function AvgElixirBadge({ avgElixir }: { avgElixir: number }) {
  const color =
    avgElixir <= 2.9
      ? "text-green-400"
      : avgElixir <= 3.5
        ? "text-yellow-400"
        : avgElixir <= 4.0
          ? "text-orange-400"
          : "text-red-400";
  return (
    <span className={cn("font-bold tabular-nums", color)}>
      {avgElixir.toFixed(1)}
    </span>
  );
}
