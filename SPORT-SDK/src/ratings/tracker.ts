import { League } from '../types.js';

export interface RatingPoint {
  at: string; // ISO date
  rating: number;
  delta: number;
}

export interface TeamRatingHistory {
  teamId: string;
  league: League;
  points: RatingPoint[];
}

export interface RatingTracker {
  team: string;
  league: League;
  history: TeamRatingHistory;
}

export class InMemoryRatingTracker {
  private readonly histories: Map<string, TeamRatingHistory> = new Map();

  private key(teamId: string, league: League): string {
    return `${league}::${teamId}`;
  }

  trackRating(params: {
    teamId: string;
    league: League;
    at?: string;
    rating: number;
  }): void {
    const at = params.at ?? new Date().toISOString();
    const k = this.key(params.teamId, params.league);
    const existing = this.histories.get(k);

    const prev = existing?.points[existing.points.length - 1]?.rating;
    const delta = prev == null ? 0 : params.rating - prev;

    const history: TeamRatingHistory = existing ?? { teamId: params.teamId, league: params.league, points: [] };
    history.points.push({ at, rating: params.rating, delta });
    this.histories.set(k, history);
  }

  getMomentum(params: {
    teamId: string;
    league: League;
    windowSize?: number;
  }): number {
    const windowSize = params.windowSize ?? 5;
    const history = this.histories.get(this.key(params.teamId, params.league));
    if (!history || history.points.length < 2) return 0;
    const pts = history.points;
    const slice = pts.slice(Math.max(0, pts.length - windowSize));
    const first = slice[0]?.rating;
    const last = slice[slice.length - 1]?.rating;
    if (first == null || last == null) return 0;
    return last - first;
  }

  getTrend(params: {
    teamId: string;
    league: League;
    windowSize?: number;
  }): { slope: number; direction: 'up' | 'down' | 'flat' } {
    const windowSize = params.windowSize ?? 8;
    const history = this.histories.get(this.key(params.teamId, params.league));
    if (!history || history.points.length < 3) return { slope: 0, direction: 'flat' };

    const pts = history.points.slice(Math.max(0, history.points.length - windowSize));
    const n = pts.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const ys = pts.map((p) => p.rating);

    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;

    const num = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0);
    const den = xs.reduce((acc, x) => acc + (x - xMean) * (x - xMean), 0) || 1;
    const slope = num / den;

    const direction = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'flat';
    return { slope, direction };
  }
}

// Phase 2a spec export names (functional wrappers)
const trackerSingleton = new InMemoryRatingTracker();

export function trackRating(params: { teamId: string; league: League; at?: string; rating: number }): void {
  trackerSingleton.trackRating(params);
}

export function getMomentum(params: { teamId: string; league: League; windowSize?: number }): number {
  return trackerSingleton.getMomentum(params);
}

export function getTrend(params: { teamId: string; league: League; windowSize?: number }): { slope: number; direction: 'up' | 'down' | 'flat' } {
  return trackerSingleton.getTrend(params);
}
