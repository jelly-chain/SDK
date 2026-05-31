export interface EsportsConfig {
  pandascoreApiKey?: string;
  liquipediaApiKey?: string;
  enabled?: boolean;
}

export type EsportTitle = 'lol' | 'cs2' | 'dota2' | 'valorant' | 'overwatch' | 'rocket-league';

export interface EsportTeam {
  id: string;
  name: string;
  shortName: string;
  title: EsportTitle;
  region: string;
  country: string;
  rating: number;
  worldRanking?: number;
  recentForm: string[];
  players: EsportPlayer[];
}

export interface EsportPlayer {
  id: string;
  name: string;
  realName?: string;
  teamId: string;
  role: string;
  country: string;
  rating: number;
  stats: Record<string, number>;
}

export interface EsportMatch {
  id: string;
  title: EsportTitle;
  tournament: string;
  tier: 'S-tier' | 'A-tier' | 'B-tier' | 'C-tier';
  bestOf: 1 | 2 | 3 | 5;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  maps: EsportMap[];
}

export interface EsportMap {
  number: number;
  name: string;
  homeScore: number;
  awayScore: number;
  winner?: string;
}

export interface EsportTournament {
  id: string;
  name: string;
  title: EsportTitle;
  tier: string;
  region: string;
  startDate: string;
  endDate: string;
  prizePool?: number;
  teams: string[];
}

export interface EsportPrediction {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeWinProb: number;
  awayWinProb: number;
  mapAdvantage: string;
  factors: string[];
  confidence: number;
}
