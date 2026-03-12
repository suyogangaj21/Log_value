// lib/cr-api/types.ts
// Full TypeScript type definitions for the Clash Royale API v1

export interface CRArena {
  id: number;
  name: string;
}

export interface CRLeague {
  id: number;
  name: string;
  iconUrls?: { small: string; medium?: string; large?: string };
}

export interface CRClanBadge {
  name: string;
  id: number;
  maxLevel: number;
  progress: number;
  target?: number;
  iconUrls?: { small: string; medium?: string; large?: string };
}

export interface CRPlayerClan {
  tag: string;
  name: string;
  badgeId: number;
}

export interface CRCard {
  id: number;
  name: string;
  maxLevel: number;
  maxEvolutionLevel?: number;
  elixirCost?: number;
  iconUrls: { medium: string };
  rarity?: string;
}

export interface CRPlayerCard extends CRCard {
  level: number;
  count: number;
  starLevel?: number;
  evolutionLevel?: number;
}

export interface CRPlayerLeagueStatistics {
  currentSeason?: { trophies: number; bestTrophies?: number; rank?: number };
  previousSeason?: {
    id: string;
    trophies: number;
    bestTrophies?: number;
    rank?: number;
  };
  bestSeason?: { id: string; trophies: number; rank?: number };
}

export interface CRPlayer {
  tag: string;
  name: string;
  expLevel: number;
  expPoints?: number;
  trophies: number;
  bestTrophies: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  challengeCardsWon: number;
  challengeMaxWins: number;
  tournamentCardsWon: number;
  tournamentBattleCount: number;
  role?: string;
  donations: number;
  donationsReceived: number;
  totalDonations: number;
  warDayWins?: number;
  clanCardsCollected?: number;
  arena: CRArena;
  leagueStatistics?: CRPlayerLeagueStatistics;
  badges?: CRClanBadge[];
  achievements?: Array<{
    name: string;
    stars: number;
    value: number;
    target: number;
    info: string;
  }>;
  cards?: CRPlayerCard[];
  currentDeck?: CRPlayerCard[];
  clan?: CRPlayerClan;
  supportCards?: CRPlayerCard[];
}

export interface CRBattleTeamMember {
  tag: string;
  name: string;
  startingTrophies?: number;
  trophyChange?: number;
  crowns: number;
  clan?: { tag: string; name: string; badgeId: number };
  cards: CRPlayerCard[];
  elixirLeaked?: number;
}

export interface CRBattle {
  type: string;
  battleTime: string; // ISO 8601 e.g. "20240315T120000.000Z"
  arena: CRArena;
  gameMode: { id: number; name: string };
  deckSelection?: string;
  team: CRBattleTeamMember[];
  opponent: CRBattleTeamMember[];
  isLadderTournament?: boolean;
  isHostedMatch?: boolean;
}

export interface CRChest {
  index: number;
  name: string;
  iconUrls?: { medium: string };
}

export interface CRUpcomingChests {
  items: CRChest[];
}

export interface CRClanMember {
  tag: string;
  name: string;
  role: string;
  expLevel: number;
  trophies: number;
  arena: CRArena;
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
  clanChestPoints?: number;
}

export interface CRClan {
  tag: string;
  name: string;
  type: string;
  description?: string;
  badgeId: number;
  clanScore: number;
  clanWarTrophies: number;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode?: string;
  };
  requiredTrophies: number;
  donationsPerWeek: number;
  clanChestLevel?: number;
  clanChestStatus?: string;
  members: number;
  memberList?: CRClanMember[];
}

export interface CRRiverRaceParticipant {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
}

export interface CRRiverRaceClan {
  tag: string;
  name: string;
  badgeId: number;
  clanScore: number;
  participants: CRRiverRaceParticipant[];
  periodPoints: number;
  fame: number;
  repairPoints: number;
  finishTime?: string;
}

export interface CRRiverRaceLog {
  items: Array<{
    seasonId: number;
    sectionIndex: number;
    createdDate: string;
    standings: Array<{
      rank: number;
      trophyChange?: number;
      clan: CRRiverRaceClan;
    }>;
  }>;
}

export interface CRCurrentRiverRace {
  state: string;
  clan: CRRiverRaceClan;
  clans: CRRiverRaceClan[];
  sectionIndex: number;
  periodIndex: number;
  periodType: string;
  periodLogs?: Array<{
    sectionIndex: number;
    items: Array<{ clan: CRRiverRaceClan; pointsEarned: number }>;
  }>;
}

export interface CRLeaderboardEntry {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  rank: number;
  previousRank?: number;
  arena: CRArena;
  clan?: { tag: string; name: string; badgeId: number };
}

export interface CRLeaderboard {
  items: CRLeaderboardEntry[];
  paging?: { cursors: { after?: string; before?: string } };
}

export interface CRCardList {
  items: CRCard[];
}

export interface CRAPIError {
  reason: string;
  message?: string;
  type?: string;
  detail?: unknown;
}
