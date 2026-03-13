// components/leaderboard-realtime.tsx
// Client Component: subscribes to Supabase Realtime changes on the
// `global_leaderboard` view and updates rankings live.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Trophy } from "lucide-react";
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

const PODIUM = [
  { ring: "ring-yellow-500/30 bg-yellow-500/10 text-yellow-400", label: "1st" },
  { ring: "ring-zinc-400/30 bg-zinc-400/10 text-zinc-300", label: "2nd" },
  { ring: "ring-amber-700/30 bg-amber-700/10 text-amber-600", label: "3rd" },
];

export function LeaderboardRealtime({ initialRows }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);

  useEffect(() => {
    const supabase = createClient();
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

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No leaderboard data yet — run the sync-leaderboard worker.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Column header */}
      <div className="grid grid-cols-[3rem_1fr_auto] gap-x-4 border-b border-border bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span>Rank</span>
        <span>Player</span>
        <span>Trophies</span>
      </div>

      {rows.map((player, i) => {
        const podium = i < 3 ? PODIUM[i] : null;
        return (
          <Link
            key={player.player_tag}
            href={`/players/${encodeURIComponent(player.player_tag)}`}
            className={cn(
              "group grid grid-cols-[3rem_1fr_auto] items-center gap-x-4 border-b border-border/50 px-4 py-3.5 last:border-0 transition-colors hover:bg-accent/40",
              i < 3 && "bg-card",
            )}
          >
            {/* Rank badge */}
            <div className="flex justify-center">
              {podium ? (
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full ring-1",
                    podium.ring,
                  )}
                >
                  <Crown size={13} />
                </div>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                  {player.current_rank}
                </span>
              )}
            </div>

            {/* Player name + clan */}
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                {player.player_name}
              </p>
              {player.clan_name && (
                <p className="truncate text-xs text-muted-foreground">
                  {player.clan_name}
                </p>
              )}
            </div>

            {/* Trophies */}
            <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 tabular-nums">
              <Trophy size={13} />
              {player.trophies.toLocaleString()}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
