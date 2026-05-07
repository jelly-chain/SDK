import { League } from '../types.js';

export interface HomeAdvantage {
  league: League;
  // home offset applied to home rating only
  homeOffset: number;
}

export interface HomeAdvantageCalibration {
  league: League;
  matches: number;
  homeWinRate: number;
  awayWinRate: number;
  draws?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const DEFAULT_OFFSETS: Partial<Record<League, number>> = {
  'nfl': 55,
  'nba': 45,
  'premier-league': 50,
  'mlb': 25,
  'nhl': 40,
  'wimbledon': 20,
};

export function getHomeAdvantage(league: League): HomeAdvantage {
  const normalized = league.toLowerCase();
  const offset = (DEFAULT_OFFSETS as Record<string, number>)[normalized] ?? 40;
  return { league, homeOffset: offset };
}

/**
 * Calibrate based on observed home bias.
 *
 * Simple mapping: convert win-rate difference into an Elo-ish offset.
 */
export function calibrateHomeAdvantage(params: HomeAdvantageCalibration): HomeAdvantage {
  const { league, homeWinRate, awayWinRate } = params;
  const total = homeWinRate + awayWinRate;
  if (total <= 0) return getHomeAdvantage(league);

  const diff = (homeWinRate - awayWinRate) / total; // [-1,1]

  // Map diff to an offset. Empirically, small diff => moderate offset.
  const base = getHomeAdvantage(league).homeOffset;
  const calibrated = base * (1 + diff * 0.8);

  // Clamp to avoid crazy swings
  const homeOffset = clamp(calibrated, -30, 90);
  return { league, homeOffset };
}
