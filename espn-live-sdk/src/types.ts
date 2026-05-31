export interface EspnConfig {
  enabled?: boolean;
}

export interface EspnLeague {
  id: string;
  name: string;
  slug: string; // e.g. 'nfl', 'nba', 'mlb', 'nhl', 'soccer.uefa.champions'
}

export interface EspnTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
  record?: string;
}

export interface EspnScore {
  id: string;
  league: string;
  name: string;
  shortName: string;
  status: string; // 'pre', 'in', 'post'
  period?: number;
  clock?: string;
  displayClock?: string;
  homeTeam: EspnTeam & { score: string };
  awayTeam: EspnTeam & { score: string };
  venue?: string;
  date: string;
  odds?: { spread: number; overUnder: number };
}

export interface EspnStanding {
  team: EspnTeam;
  wins: number;
  losses: number;
  ties?: number;
  winPercent: number;
  gamesBehind?: number;
  streak?: string;
  rank: number;
}

export interface EspnSchedule {
  league: string;
  season: string;
  events: EspnScore[];
}

export interface EspnPlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  stats: Record<string, number>;
}
