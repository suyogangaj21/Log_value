// components/leaderboard-realtime.tsx
// Client Component: subscribes to Supabase Realtime changes on the
// `global_leaderboard` view and updates rankings live.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  current_rank: number;
  player_tag: string;
  player_name: string;
  trophies: number;
  clan_name?: string | null;
  exp_level?: number | null;
}

interface Props {
  initialRows: LeaderboardRow[];
}

export function LeaderboardRealtime({ initialRows }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);

  useEffect(() => {
    const supabase = createClient();

    // Re-fetch on any leaderboard_snapshots INSERT (worker just pushed new data)
    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leaderboard_snapshots" },
        async () => {
          const { data } = await supabase
            .from("global_leaderboard")
            .select(
              "current_rank, player_tag, player_name, trophies, clan_name, exp_level",
            )
            .order("current_rank", { ascending: true })
            .limit(200);
          if (data) setRows(data);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-700/50 overflow-hidden">
      {rows.map((player, i) => (
        <Link
          key={player.player_tag}
          href={`/players/${encodeURIComponent(player.player_tag)}`}
          className={cn(
            "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/60",
            i < 3 ? "bg-zinc-900" : "bg-zinc-950/50",
          )}
        >
          <div className="w-8 text-center">
            {i === 0 ? (
              <Crown className="mx-auto text-yellow-400" size={16} />
            ) : i === 1 ? (
              <Crown className="mx-auto text-zinc-300" size={14} />
            ) : i === 2 ? (
              <Crown className="mx-auto text-amber-600" size={13} />
            ) : (
              <span className="text-xs font-bold text-zinc-600">
                {player.current_rank}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-zinc-200">
              {player.player_name}
            </p>
            {player.clan_name && (
              <p className="truncate text-xs text-zinc-500">
                {player.clan_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 tabular-nums">
            <Crown size={12} />
            {player.trophies.toLocaleString()}
          </div>
        </Link>
      ))}
      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-600">
          No leaderboard data yet — run the sync-leaderboard worker.
        </p>
      )}
    </div>
  );
}
