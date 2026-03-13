// app/(public)/leaderboard/page.tsx
// Global rankings page with Supabase Realtime push updates.
import { Suspense } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardRealtime } from "@/components/leaderboard-realtime";

export const metadata: Metadata = {
  title: "Global Leaderboard",
  description:
    "Top 1,000 Clash Royale players ranked by trophies with live updates.",
};

const fetchLeaderboard = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("global_leaderboard")
      .select(
        "current_rank, player_tag, player_name, trophies, clan_name, exp_level",
      )
      .order("current_rank", { ascending: true })
      .limit(200);
    return data ?? [];
  },
  ["global-leaderboard"],
  { revalidate: 120 },
);

export default async function LeaderboardPage() {
  const initialRows = await fetchLeaderboard();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 h-8 w-1 shrink-0 rounded-full bg-yellow-400" />
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
              Global Leaderboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Top 200 players · updates every 2 min
            </p>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10">
          <Crown className="text-yellow-400" size={24} />
        </div>
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardRealtime initialRows={initialRows} />
      </Suspense>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl bg-muted" />
      ))}
    </div>
  );
}
