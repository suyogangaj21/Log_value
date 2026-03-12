// app/(public)/players/[tag]/page.tsx
// SSR Player Profile — SEO-critical with generateMetadata.

import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  getPlayer,
  getPlayerBattleLog,
  getPlayerUpcomingChests,
  CRAPIError,
} from "@/lib/cr-api/client";
import { StatCard } from "@/components/ui/stat-card";
import { DeckCard } from "@/components/ui/deck-card";
import { WinRateBar } from "@/components/ui/win-rate-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Swords, Trophy, Shield, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  params: Promise<{ tag: string }>;
}

// Decode URL-encoded tag e.g. %23ABC123 → #ABC123
function decodeTag(raw: string) {
  return decodeURIComponent(raw);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  try {
    const player = await getPlayer(decodeTag(tag));
    return {
      title: `${player.name} (${player.tag})`,
      description: `Clash Royale stats for ${player.name}: ${player.trophies.toLocaleString()} trophies, ${player.wins} wins. Clan: ${player.clan?.name ?? "None"}.`,
      openGraph: { title: `${player.name} — LogValue`, type: "profile" },
    };
  } catch {
    return { title: "Player Profile" };
  }
}

export default async function PlayerPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeTag(tag);

  let player;
  try {
    player = await getPlayer(decodedTag);
  } catch (e) {
    if (e instanceof CRAPIError && e.status === 404) notFound();
    if (e instanceof CRAPIError && e.status === 403) {
      return (
        <div className="mx-auto max-w-2xl py-20 text-center">
          <p className="text-zinc-500">
            This player&apos;s profile is private.
          </p>
        </div>
      );
    }
    throw e;
  }

  // Fetch battle log (non-critical — soft fail)
  let recentBattles: Awaited<ReturnType<typeof getPlayerBattleLog>> = [];
  try {
    recentBattles = await getPlayerBattleLog(decodedTag);
  } catch {
    /* private or no battles */
  }

  // Fetch chest cycle (non-critical)
  let chests: Awaited<ReturnType<typeof getPlayerUpcomingChests>> | null = null;
  try {
    chests = await getPlayerUpcomingChests(decodedTag);
  } catch {
    /* private */
  }

  const winRate =
    player.wins + player.losses > 0
      ? player.wins / (player.wins + player.losses)
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      {/* Player Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">{player.name}</h1>
          <p className="font-mono text-sm text-zinc-500">{player.tag}</p>
          {player.clan && (
            <Link
              href={`/clans/${encodeURIComponent(player.clan.tag)}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
            >
              <Shield size={12} />
              {player.clan.name} · {player.role}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-2xl font-black text-yellow-400">
          <Crown size={20} />
          {player.trophies.toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Best Trophies"
          value={player.bestTrophies.toLocaleString()}
          icon={<Trophy size={14} />}
          highlight="yellow"
        />
        <StatCard
          label="Wins"
          value={player.wins.toLocaleString()}
          icon={<Swords size={14} />}
          highlight="green"
        />
        <StatCard
          label="Losses"
          value={player.losses.toLocaleString()}
          highlight="red"
        />
        <StatCard
          label="Win Rate"
          value={winRate !== null ? `${(winRate * 100).toFixed(1)}%` : "—"}
          sub={`${player.battleCount} battles`}
        />
      </div>
      {winRate !== null && <WinRateBar winRate={winRate} />}

      <Tabs defaultValue="battles">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="battles">Battle Log</TabsTrigger>
          <TabsTrigger value="chests">Chest Cycle</TabsTrigger>
          <TabsTrigger value="deck">Current Deck</TabsTrigger>
        </TabsList>

        {/* Battle Log */}
        <TabsContent value="battles" className="mt-4">
          {recentBattles.length === 0 ? (
            <p className="text-sm text-zinc-600">No recent battles found.</p>
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-700/50 overflow-hidden">
              {recentBattles.slice(0, 20).map((battle, i) => {
                const me = battle.team[0];
                const opp = battle.opponent[0];
                const myCrowns = me?.crowns ?? 0;
                const oppCrowns = opp?.crowns ?? 0;
                const won = myCrowns > oppCrowns;
                const draw = myCrowns === oppCrowns;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 ${won ? "bg-green-950/20" : draw ? "bg-zinc-900/40" : "bg-red-950/20"}`}
                  >
                    <span
                      className={`w-8 text-center text-xs font-black ${won ? "text-green-400" : draw ? "text-zinc-400" : "text-red-400"}`}
                    >
                      {won ? "WIN" : draw ? "DRAW" : "LOSS"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500">
                        {battle.gameMode?.name ?? "Ladder"}
                      </p>
                      <p className="text-sm font-medium text-zinc-300">
                        vs {opp?.name ?? "Unknown"}
                        <span className="ml-2 font-black">
                          {myCrowns}–{oppCrowns}
                        </span>
                      </p>
                    </div>
                    <time
                      className="text-xs text-zinc-600"
                      dateTime={battle.battleTime}
                    >
                      {new Date(
                        battle.battleTime.replace(
                          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                          "$1-$2-$3T$4:$5:$6",
                        ),
                      ).toLocaleDateString()}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Chest Cycle */}
        <TabsContent value="chests" className="mt-4">
          {!chests ? (
            <p className="text-sm text-zinc-600">Chest data unavailable.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {chests.items.slice(0, 12).map((chest) => (
                <div
                  key={chest.index}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-3 py-2 text-center"
                >
                  <span className="text-[10px] font-bold text-zinc-500">
                    +{chest.index}
                  </span>
                  {chest.iconUrls?.medium ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chest.iconUrls.medium}
                      alt={chest.name}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-zinc-800" />
                  )}
                  <span className="text-xs text-zinc-400">{chest.name}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Current Deck */}
        <TabsContent value="deck" className="mt-4">
          {!player.currentDeck || player.currentDeck.length === 0 ? (
            <p className="text-sm text-zinc-600">Current deck not available.</p>
          ) : (
            <DeckCard
              cards={player.currentDeck.map((c) => ({
                id: c.id,
                name: c.name,
                icon_url: c.iconUrls?.medium ?? null,
                elixir_cost: c.elixirCost ?? null,
              }))}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
