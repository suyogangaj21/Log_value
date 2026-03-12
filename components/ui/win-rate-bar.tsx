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

function barColor(v: number): string {
  if (v >= 0.6) return "bg-green-500";
  if (v >= 0.52) return "bg-emerald-500";
  if (v >= 0.48) return "bg-yellow-500";
  if (v >= 0.4) return "bg-orange-500";
  return "bg-red-500";
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
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            WR <span className="font-bold text-zinc-200">{pct(winRate)}</span>
          </span>
          {cwrV !== null && (
            <span>
              CWR <span className="font-bold text-zinc-200">{pct(cwrV)}</span>
            </span>
          )}
        </div>
      )}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all", barColor(wr))}
          style={{ width: `${Math.min(100, wr * 100)}%` }}
        />
      </div>
      {cwrV !== null && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full opacity-75 transition-all",
              barColor(cwrV),
            )}
            style={{ width: `${Math.min(100, cwrV * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
