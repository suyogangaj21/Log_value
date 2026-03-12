// app/(public)/cards/[id]/page.tsx
// Card detail: stats + matchup matrix.
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { buildMatchupResults } from "@/lib/analytics/matchups";
import { ElixirBadge } from "@/components/ui/elixir-badge";
import { StatCard } from "@/components/ui/stat-card";
import { WinRateBar } from "@/components/ui/win-rate-bar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: card } = await supabase
    .from("card_performance")
    .select("name")
    .eq("card_id", Number(id))
    .single();
  return {
    title: card?.name ? `${card.name} Stats` : "Card Stats",
    description: `Win rate, clean win rate, and matchup data for ${card?.name ?? "this card"} in Clash Royale.`,
  };
}

const fetchCardDetail = unstable_cache(
  async (cardId: number) => {
    const supabase = createPublicClient();
    const [{ data: perf }, { data: matchups }] = await Promise.all([
      supabase
        .from("card_performance")
        .select("*")
        .eq("card_id", cardId)
        .single(),
      supabase
        .from("card_matchups")
        .select("card_a_id, card_b_id, wins_with_a, total_a_vs_b")
        .eq("card_a_id", cardId)
        .order("total_a_vs_b", { ascending: false })
        .limit(100),
    ]);
    return { perf, matchups: matchups ?? [] };
  },
  ["card-detail"],
  { revalidate: 300 },
);

const fetchAllCardNames = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cards")
      .select("id, name, icon_url, elixir_cost");
    const map = new Map<
      number,
      { name: string; icon_url?: string; elixir_cost?: number }
    >();
    for (const c of data ?? []) map.set(c.id, c);
    return map;
  },
  ["card-names"],
  { revalidate: 3600 },
);

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const cardId = Number(id);
  if (isNaN(cardId)) notFound();

  const [{ perf, matchups }, cardMap] = await Promise.all([
    fetchCardDetail(cardId),
    fetchAllCardNames(),
  ]);
  if (!perf) notFound();

  const matchupResults = buildMatchupResults(matchups);
  const favorable = matchupResults.filter((m) => m.isFavorable);
  const counters = matchupResults.filter((m) => m.isHardCounter);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-20 w-16 overflow-hidden rounded-xl border border-zinc-700/40 bg-zinc-800 shrink-0">
          {perf.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={perf.icon_url}
              alt={perf.name}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">{perf.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <ElixirBadge cost={perf.elixir_cost} size="md" />
            <span className="text-sm capitalize text-zinc-500">
              {perf.rarity}
            </span>
            <span className="text-sm text-zinc-600">·</span>
            <span className="text-sm capitalize text-zinc-500">
              {perf.card_type}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Rating"
          value={((perf.rating ?? 0) * 100).toFixed(1)}
          sub="R score"
          highlight="blue"
        />
        <StatCard
          label="Win Rate"
          value={perf.win_rate ? `${(perf.win_rate * 100).toFixed(1)}%` : "—"}
          sub="7-day ladder"
        />
        <StatCard
          label="Clean WR"
          value={perf.cwr ? `${(perf.cwr * 100).toFixed(1)}%` : "—"}
          sub="mirror filtered"
          highlight="green"
        />
        <StatCard
          label="Use Rate"
          value={perf.use_count ? perf.use_count.toLocaleString() : "—"}
          sub="battles"
        />
      </div>
      <WinRateBar winRate={perf.win_rate} cwr={perf.cwr} />

      {/* Matchup sections */}
      {matchupResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Matchup Data</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {favorable.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-green-400">
                  Favorable ({favorable.length})
                </p>
                <MatchupList entries={favorable} cardMap={cardMap} />
              </div>
            )}
            {counters.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-red-400">
                  Hard Counters ({counters.length})
                </p>
                <MatchupList entries={counters} cardMap={cardMap} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchupList({
  entries,
  cardMap,
}: {
  entries: Array<{ cardBId: number; winRate: number; totalGames: number }>;
  cardMap: Map<
    number,
    { name: string; icon_url?: string; elixir_cost?: number }
  >;
}) {
  return (
    <div className="divide-y divide-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden">
      {entries.slice(0, 10).map((e) => {
        const card = cardMap.get(e.cardBId);
        return (
          <div
            key={e.cardBId}
            className="flex items-center gap-3 bg-zinc-950/60 px-3 py-2"
          >
            <div className="h-8 w-7 shrink-0 overflow-hidden rounded bg-zinc-800">
              {card?.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.icon_url}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-zinc-300">
                {card?.name ?? `Card ${e.cardBId}`}
              </p>
              <WinRateBar winRate={e.winRate} showLabels={false} />
            </div>
            <span className="text-xs font-bold tabular-nums text-zinc-400">
              {(e.winRate * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
