// components/ui/win-rate-bar.tsx
// Side-by-side Win Rate (WR) vs Clean Win Rate (CWR) visual bar.

import { cn } from "@/lib/utils";

interface WinRateBarProps {
  winRate: number | null; // 0–1
  cwr?: number | null; // 0–1
  showLabels?: boolean;
  className?: string;
}

function pct(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function barGradient(v: number): string {
  if (v >= 0.6) return "from-emerald-500 to-green-400";
  if (v >= 0.52) return "from-emerald-400 to-teal-500";
  if (v >= 0.48) return "from-yellow-400 to-amber-500";
  if (v >= 0.4) return "from-orange-400 to-red-400";
  return "from-red-500 to-rose-600";
}

export function WinRateBar({
  winRate,
  cwr,
  showLabels = true,
  className,
}: WinRateBarProps) {
  const wr = winRate ?? 0;
  const cwrV = cwr ?? null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            WR <span className="font-bold text-foreground">{pct(winRate)}</span>
          </span>
          {cwrV !== null && (
            <span className="text-muted-foreground">
              CWR <span className="font-bold text-foreground">{pct(cwrV)}</span>
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all",
            barGradient(wr),
          )}
          style={{ width: `${Math.min(100, wr * 100)}%` }}
        />
      </div>
      {cwrV !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r opacity-75 transition-all",
              barGradient(cwrV),
            )}
            style={{ width: `${Math.min(100, cwrV * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
