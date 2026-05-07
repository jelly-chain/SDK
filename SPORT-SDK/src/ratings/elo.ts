import { League } from '../types.js';

export type EloSport = 'NFL' | 'NBA' | 'EPL' | 'MLB' | 'NHL' | 'Tennis' | 'GENERIC';

export interface EloRating {
  mu: number;
  homeMu: number;
  awayMu: number;
}

export interface EloMatch {
  league: League;
  homeTeamId: string;
  awayTeamId: string;
  homeRating: EloRating;
  awayRating: EloRating;
  homeScore: number;
  awayScore: number;
  // Optional: days since match for K-factor modulation
  daysAgo?: number;
  // Optional: crowd/home-field handled via homeMu/awayMu already
}

const SPORT_K: Record<EloSport, number> = {
  NFL: 32,
  NBA: 20,
  EPL: 30,
  MLB: 16,
  NHL: 24,
  Tennis: 32,
  GENERIC: 20,
};

function inferSportK(league: League): EloSport {
  const l = league.toLowerCase();
  if (l.includes('nfl')) return 'NFL';
  if (l.includes('nba')) return 'NBA';
  if (l.includes('premier-league') || l.includes('epl') || l.includes('premier league')) return 'EPL';
  if (l.includes('mlb')) return 'MLB';
  if (l.includes('nhl') || l.includes('ice-hockey')) return 'NHL';
  if (l.includes('wimbledon') || l.includes('us-open') || l.includes('australian-open') || l.includes('french-open') || l.includes('atp') || l.includes('wta')) {
    return 'Tennis';
  }
  return 'GENERIC';
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function marginMultiplier(homeScore: number, awayScore: number): number {
  const margin = Math.abs(homeScore - awayScore);
  if (!Number.isFinite(margin) || margin <= 0) return 1;
  // Scale linearly with margin then cap at 2x
  return Math.min(2, 1 + margin / 10);
}

function encodeResult(homeScore: number, awayScore: number): 1 | 0.5 | 0 {
  if (homeScore > awayScore) return 1;
  if (homeScore === awayScore) return 0.5;
  return 0;
}

function applyEloDelta(current: number, expected: number, actual: number, k: number, multiplier: number): number {
  const delta = k * multiplier * (actual - expected);
  const next = current + delta;
  // Keep Elo in sane bounds
  return Number.isFinite(next) ? next : current;
}

export function calculateElo(match: Omit<EloMatch, 'homeRating' | 'awayRating'> & {
  homeRating: EloRating;
  awayRating: EloRating;
}): {
  homeExpected: number;
  awayExpected: number;
  homeActual: 1 | 0.5 | 0;
  awayActual: 1 | 0.5 | 0;
  k: number;
  multiplier: number;
} {
  const { league, homeScore, awayScore, homeRating, awayRating } = match;
  const sport = inferSportK(league);
  const k = SPORT_K[sport];
  const multiplier = marginMultiplier(homeScore, awayScore);

  // Use home/away-specific ratings
  const homeMu = homeRating.homeMu;
  const awayMu = awayRating.awayMu;

  const homeExpected = expectedScore(homeMu, awayMu);
  const awayExpected = expectedScore(awayMu, homeMu);

  const homeActual = encodeResult(homeScore, awayScore);
  const awayActual = homeActual === 1 ? 0 : homeActual === 0 ? 1 : 0.5;

  return { homeExpected, awayExpected, homeActual, awayActual, k, multiplier };
}

export function updateElo(match: EloMatch): EloRating & { homeUpdated: EloRating; awayUpdated: EloRating } {
  const { homeRating, awayRating, homeScore, awayScore, league } = match;
  const sport = inferSportK(league);
  const k = SPORT_K[sport];
  const multiplier = marginMultiplier(homeScore, awayScore);

  const homeExpected = expectedScore(homeRating.homeMu, awayRating.awayMu);
  const awayExpected = expectedScore(awayRating.awayMu, homeRating.homeMu);

  const homeActual = encodeResult(homeScore, awayScore);
  const awayActual = homeActual === 1 ? 0 : homeActual === 0 ? 1 : 0.5;

  const homeDeltaMu = applyEloDelta(homeRating.homeMu, homeExpected, homeActual, k, multiplier);
  const awayDeltaMu = applyEloDelta(awayRating.awayMu, awayExpected, awayActual, k, multiplier);

  // Maintain overall mu as average of home+away components
  const nextHome: EloRating = {
    mu: (homeRating.homeMu + homeRating.awayMu) / 2,
    homeMu: homeDeltaMu,
    awayMu: homeRating.awayMu,
  };
  nextHome.mu = (nextHome.homeMu + nextHome.awayMu) / 2;

  const nextAway: EloRating = {
    mu: (awayRating.homeMu + awayRating.awayMu) / 2,
    homeMu: awayRating.homeMu,
    awayMu: awayDeltaMu,
  };
  nextAway.mu = (nextAway.homeMu + nextAway.awayMu) / 2;

  return { ...nextHome, homeUpdated: nextHome, awayUpdated: nextAway };
}

export function expectedScorePublic(teamARating: number, teamBRating: number): number {
  return expectedScore(teamARating, teamBRating);
}

// Back-compat exports expected by Phase 2a spec
export { expectedScorePublic as expectedScore };
