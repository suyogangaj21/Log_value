// app/(public)/clans/[tag]/page.tsx
// SSR Clan Profile — member list, war stats.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getClan,
  getClanRiverRaceLog,
  getClanCurrentRiverRace,
  CRAPIError,
} from "@/lib/cr-api/client";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Trophy,
  Users,
  Swords,
  ChevronRight,
  Star,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  params: Promise<{ tag: string }>;
}

function decodeTag(raw: string) {
  return decodeURIComponent(raw);
}

const ROLE_LABELS: Record<string, string> = {
  leader: "Leader",
  coLeader: "Co-Leader",
  elder: "Elder",
  member: "Member",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  try {
    const clan = await getClan(decodeTag(tag));
    return {
      title: `${clan.name} (${clan.tag})`,
      description: `${clan.description ?? ""} · ${clan.members} members · ${clan.clanWarTrophies} war trophies.`,
      openGraph: { title: `${clan.name} — LogValue` },
    };
  } catch {
    return { title: "Clan Profile" };
  }
}

export default async function ClanPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeTag(tag);

  let clan;
  try {
    clan = await getClan(decodedTag);
  } catch (e) {
    if (e instanceof CRAPIError && e.status === 404) notFound();
    throw e;
  }

  // River Race log (non-critical)
  let raceLog: Awaited<ReturnType<typeof getClanRiverRaceLog>> | null = null;
  try {
    raceLog = await getClanRiverRaceLog(decodedTag);
  } catch {
    /* possibly private */
  }

  // Current River Race (non-critical)
  let currentRace: Awaited<ReturnType<typeof getClanCurrentRiverRace>> | null =
    null;
  try {
    currentRace = await getClanCurrentRiverRace(decodedTag);
  } catch {
    /* possibly between seasons */
  }

  const sorted = [...(clan.memberList ?? [])].sort(
    (a, b) => b.trophies - a.trophies,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      {/* Clan Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {clan.badgeId && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
              <Shield size={28} className="text-purple-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white">{clan.name}</h1>
            <p className="font-mono text-sm text-zinc-500">{clan.tag}</p>
            {clan.description && (
              <p className="mt-1 max-w-md text-sm text-zinc-400">
                {clan.description}
              </p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {clan.type === "open"
            ? "Open"
            : clan.type === "inviteOnly"
              ? "Invite Only"
              : "Closed"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="War Trophies"
          value={clan.clanWarTrophies.toLocaleString()}
          icon={<Star size={14} />}
          highlight="yellow"
        />
        <StatCard
          label="Members"
          value={`${clan.members}/50`}
          icon={<Users size={14} />}
        />
        <StatCard
          label="Required Trophies"
          value={clan.requiredTrophies.toLocaleString()}
          icon={<Trophy size={14} />}
        />
        <StatCard
          label="Donations/wk"
          value={clan.donationsPerWeek.toLocaleString()}
          icon={<Swords size={14} />}
          highlight="green"
        />
      </div>

      <Tabs defaultValue="members">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="members">Members ({clan.members})</TabsTrigger>
          <TabsTrigger value="war">River Race</TabsTrigger>
        </TabsList>

        {/* Members Table */}
        <TabsContent value="members" className="mt-4">
          <div className="rounded-xl border border-zinc-700/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700/50 hover:bg-transparent">
                  <TableHead className="text-zinc-500">#</TableHead>
                  <TableHead className="text-zinc-500">Player</TableHead>
                  <TableHead className="text-zinc-500">Role</TableHead>
                  <TableHead className="text-right text-zinc-500">
                    Trophies
                  </TableHead>
                  <TableHead className="text-right text-zinc-500 hidden sm:table-cell">
                    Donations
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m, i) => (
                  <TableRow
                    key={m.tag}
                    className="border-zinc-800/60 hover:bg-zinc-800/30"
                  >
                    <TableCell className="text-zinc-600 w-8">{i + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/players/${encodeURIComponent(m.tag)}`}
                        className="font-medium text-white hover:text-purple-300 transition-colors"
                      >
                        {m.name}
                      </Link>
                      <p className="font-mono text-xs text-zinc-600">{m.tag}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.role === "leader" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {ROLE_LABELS[m.role] ?? m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-yellow-400">
                      {m.trophies.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-zinc-400 hidden sm:table-cell">
                      {m.donations.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* River Race / War */}
        <TabsContent value="war" className="mt-4">
          {!currentRace && !raceLog ? (
            <p className="text-sm text-zinc-600">
              River Race data unavailable.
            </p>
          ) : null}

          {currentRace && (
            <div className="mb-6 space-y-3">
              <h2 className="text-lg font-bold text-white">
                Current River Race — Day {currentRace.sectionIndex + 1}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentRace.clan && (
                  <>
                    <StatCard
                      label="Fame"
                      value={currentRace.clan.fame.toLocaleString()}
                      highlight="yellow"
                    />
                    <StatCard
                      label="Repair Points"
                      value={currentRace.clan.repairPoints.toLocaleString()}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {raceLog && raceLog.items.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">War History</h2>
              <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-700/50 overflow-hidden">
                {raceLog.items.slice(0, 5).map((season, i) => {
                  const myClan = season.standings.find(
                    (s) => s.clan.tag === decodedTag,
                  );
                  const rank = myClan?.rank ?? null;
                  const won = rank === 1;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-4 py-3 ${won ? "bg-yellow-950/20" : "bg-zinc-900/40"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          Season {season.seasonId}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {season.standings.length} clans competed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">
                          {rank ? `#${rank}` : "—"}
                        </p>
                        {myClan && (
                          <p className="text-xs text-zinc-500">
                            {myClan.clan.fame.toLocaleString()} fame
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
