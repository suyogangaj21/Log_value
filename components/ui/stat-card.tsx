// components/ui/stat-card.tsx
// Generic metric display tile used across player profiles, deck pages, etc.

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  highlight?: "green" | "red" | "yellow" | "blue" | "default";
  className?: string;
}

const topBarGradient = {
  green: "from-emerald-500 to-green-400",
  red: "from-red-500 to-rose-400",
  yellow: "from-yellow-400 to-amber-300",
  blue: "from-blue-500 to-cyan-400",
  default: "from-primary/60 to-violet-400/60",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  highlight = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-5 py-4 transition-all hover:border-primary/30",
        className,
      )}
    >
      {/* Gradient top accent bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          topBarGradient[highlight],
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2.5 text-3xl font-black tabular-nums text-foreground">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
