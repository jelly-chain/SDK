/**
 * Baseball-specific Sportradar integration
 * MLB with pitcher tracking, batting stats, and park factors
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch, SportradarPlayer } from '../types.js';

export interface BaseballMatch extends SportradarMatch {
  inning: number;
  halfInning: 'top' | 'bottom';
  outs: number;
  balls: number;
  strikes: number;
  bases: { first: boolean; second: boolean; third: boolean };
  pitcher: { id: string; name: string; pitchCount: number; era: number };
  batter: { id: string; name: string; avg: number; ops: number };
}

export interface PitcherStats {
  id: string;
  name: string;
  team: string;
  wins: number;
  losses: number;
  era: number;
  innings: number;
  strikeouts: number;
  walks: number;
  whip: number;
  k9: number; // strikeouts per 9 innings
  bb9: number; // walks per 9 innings
  hr9: number; // home runs per 9 innings
  fip: number; // fielding independent pitching
  recentForm: Array<{ date: string; innings: number; er: number; strikeouts: number }>;
}

export interface BatterStats {
  id: string;
  name: string;
  team: string;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  war: number;
  recentForm: Array<{ date: string; ab: number; hits: number; hr: number; rbi: number }>;
}

export interface ParkFactor {
  venue: string;
  runs: number; // >1 = hitter-friendly, <1 = pitcher-friendly
  homeRuns: number;
  hits: number;
  walks: number;
  strikeouts: number;
  classification: 'extreme-hitter' | 'hitter-friendly' | 'neutral' | 'pitcher-friendly' | 'extreme-pitcher';
}

export class SportradarBaseball {
  constructor(private readonly client: SportradarClient) {}

  /** Get MLB schedule */
  async getMLBSchedule(seasonId?: string): Promise<BaseballMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:109');
    if (!season) return [];
    return this.client.getSchedule(season) as Promise<BaseballMatch[]>;
  }

  /** Get live MLB games */
  async getLiveGames(): Promise<BaseballMatch[]> {
    return this.client.getLiveMatches('sr:sport:3') as Promise<BaseballMatch[]>;
  }

  /** Get pitcher vs batter matchup history */
  async getPitcherBatterMatchup(pitcherId: string, batterId: string): Promise<{
    atBats: number;
    hits: number;
    avg: number;
    homeRuns: number;
    strikeouts: number;
    walks: number;
  } | null> {
    // Would query Sportradar matchup endpoint
    return null;
  }

  /** Analyze pitching matchup */
  analyzePitchingMatchup(
    homePitcher: PitcherStats,
    awayPitcher: PitcherStats,
  ): {
    advantage: string;
    factors: string[];
    confidence: number;
  } {
    const factors: string[] = [];
    let homeScore = 0;

    // ERA comparison
    const eraDiff = awayPitcher.era - homePitcher.era;
    if (Math.abs(eraDiff) > 0.5) {
      factors.push(`${eraDiff > 0 ? 'Home' : 'Away'} pitcher has better ERA (${Math.abs(eraDiff).toFixed(2)} difference)`);
      homeScore += eraDiff > 0 ? 0.1 : -0.1;
    }

    // Strikeout rate
    const kDiff = homePitcher.k9 - awayPitcher.k9;
    if (Math.abs(kDiff) > 1) {
      factors.push(`${kDiff > 0 ? 'Home' : 'Away'} pitcher has higher K/9 rate`);
    }

    // Recent form
    const homeRecentERA = this.calculateRecentERA(homePitcher.recentForm);
    const awayRecentERA = this.calculateRecentERA(awayPitcher.recentForm);
    if (Math.abs(homeRecentERA - awayRecentERA) > 1) {
      factors.push(`Recent form: ${homeRecentERA < awayRecentERA ? 'Home' : 'Away'} pitcher trending better`);
    }

    return {
      advantage: homeScore > 0 ? 'home' : homeScore < 0 ? 'away' : 'even',
      factors,
      confidence: Math.min(0.8, 0.5 + Math.abs(homeScore)),
    };
  }

  /** Get park factors for a venue */
  getParkFactor(venue: string): ParkFactor | null {
    const parkFactors: Record<string, ParkFactor> = {
      'Coors Field': { venue: 'Coors Field', runs: 1.15, homeRuns: 1.12, hits: 1.08, walks: 0.98, strikeouts: 0.95, classification: 'extreme-hitter' },
      'Fenway Park': { venue: 'Fenway Park', runs: 1.04, homeRuns: 1.02, hits: 1.06, walks: 1.0, strikeouts: 0.98, classification: 'hitter-friendly' },
      'Yankee Stadium': { venue: 'Yankee Stadium', runs: 1.02, homeRuns: 1.08, hits: 0.98, walks: 1.0, strikeouts: 1.0, classification: 'hitter-friendly' },
      'Oracle Park': { venue: 'Oracle Park', runs: 0.92, homeRuns: 0.88, hits: 0.95, walks: 1.02, strikeouts: 1.02, classification: 'pitcher-friendly' },
      'T-Mobile Park': { venue: 'T-Mobile Park', runs: 0.94, homeRuns: 0.92, hits: 0.96, walks: 1.0, strikeouts: 1.02, classification: 'pitcher-friendly' },
    };
    return parkFactors[venue] ?? null;
  }

  private calculateRecentERA(games: PitcherStats['recentForm']): number {
    if (games.length === 0) return 4.0;
    const totalER = games.reduce((sum, g) => sum + g.er, 0);
    const totalIP = games.reduce((sum, g) => sum + g.innings, 0);
    return totalIP > 0 ? (totalER * 9) / totalIP : 4.0;
  }

  private async getCurrentSeasonId(tournamentId: string): Promise<string | undefined> {
    const season = await this.client.getCurrentSeason(tournamentId);
    return season?.id;
  }
}
