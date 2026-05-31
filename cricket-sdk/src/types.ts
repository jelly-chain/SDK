export interface CricketConfig {
  apiKey?: string;
  provider?: 'cricapi' | 'sportmonks';
  enabled?: boolean;
}

export type CricketFormat = 't20' | 'odi' | 'test' | 'hundred';
export type CricketLeague = 'ipl' | 'big-bash' | 'cpl' | 'psl' | 'icc-world-cup' | 'icc-t20-world-cup';

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league?: CricketLeague;
}

export interface CricketPlayer {
  id: string;
  name: string;
  teamId: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: string;
  bowlingStyle?: string;
  stats: {
    matches: number;
    runs?: number;
    battingAvg?: number;
    strikeRate?: number;
    wickets?: number;
    bowlingAvg?: number;
    economy?: number;
  };
}

export interface CricketMatch {
  id: string;
  league: CricketLeague;
  format: CricketFormat;
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  startDate: string;
  status: 'upcoming' | 'live' | 'finished' | 'abandoned';
  result?: string;
  innings: CricketInnings[];
  tossWinner?: string;
  tossDecision?: 'bat' | 'field';
}

export interface CricketInnings {
  teamId: string;
  runs: number;
  wickets: number;
  overs: number;
  runRate: number;
}

export interface CricketPrediction {
  matchId: string;
  homeWinProb: number;
  awayWinProb: number;
  drawProb: number;
  factors: string[];
  tossImpact: string;
  pitchCondition: string;
}
