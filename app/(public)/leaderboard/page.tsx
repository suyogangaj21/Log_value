// app/(public)/leaderboard/page.tsx
// Global rankings page with Supabase Realtime push updates.
import { Suspense } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Global Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Top 200 players · Updates every 2 min
          </p>
        </div>
        <Crown className="text-yellow-400" size={28} />
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardRealtime initialRows={initialRows} />
      </Suspense>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg bg-zinc-800" />
      ))}
    </div>
  );
}
