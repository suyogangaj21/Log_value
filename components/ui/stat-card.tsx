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

const highlightClasses = {
  green: "border-green-700/50 bg-green-950/30",
  red: "border-red-700/50 bg-red-950/30",
  yellow: "border-yellow-700/50 bg-yellow-950/30",
  blue: "border-blue-700/50 bg-blue-950/30",
  default: "border-zinc-700/50 bg-zinc-900/40",
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
        "rounded-xl border px-5 py-4 backdrop-blur-sm transition-all",
        highlightClasses[highlight],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </p>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums text-zinc-50">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
