/**
 * Ice Hockey-specific Sportradar integration
 * NHL with goalie tracking, power play stats, and advanced metrics
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch } from '../types.js';

export interface HockeyMatch extends SportradarMatch {
  period: number;
  periodType: 'regular' | 'overtime' | 'shootout';
  powerPlay: { home: boolean; away: boolean };
  shots: { home: number; away: number };
  faceoffPct: { home: number; away: number };
}

export interface GoalieStats {
  id: string;
  name: string;
  team: string;
  wins: number;
  losses: number;
  otLosses: number;
  gaa: number; // goals against average
  savePct: number;
  shutouts: number;
  qualityStarts: number;
  gsax: number; // goals saved above expected
  recentForm: Array<{ date: string; saves: number; goalsAgainst: number; savePct: number }>;
}

export interface SkaterStats {
  id: string;
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number; // penalty minutes
  toi: number; // time on ice (minutes)
  corsi: number; // shot attempts for %
  fenwick: number; // unblocked shot attempts for %
  expectedGoals: number;
}

export interface PowerPlayStats {
  team: string;
  ppPct: number; // power play percentage
  ppGoals: number;
  ppOpportunities: number;
  pkPct: number; // penalty kill percentage
  pkGoalsAgainst: number;
  pkOpportunities: number;
}

export class SportradarHockey {
  constructor(private readonly client: SportradarClient) {}

  /** Get NHL schedule */
  async getNHLSchedule(seasonId?: string): Promise<HockeyMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:131');
    if (!season) return [];
    return this.client.getSchedule(season) as Promise<HockeyMatch[]>;
  }

  /** Get live NHL games */
  async getLiveGames(): Promise<HockeyMatch[]> {
    return this.client.getLiveMatches('sr:sport:4') as Promise<HockeyMatch[]>;
  }

  /** Analyze goalie matchup */
  analyzeGoalieMatchup(
    homeGoalie: GoalieStats,
    awayGoalie: GoalieStats,
  ): {
    advantage: string;
    factors: string[];
    confidence: number;
  } {
    const factors: string[] = [];
    let homeScore = 0;

    // Save percentage
    const svPctDiff = homeGoalie.savePct - awayGoalie.savePct;
    if (Math.abs(svPctDiff) > 0.01) {
      factors.push(`${svPctDiff > 0 ? 'Home' : 'Away'} goalie has better save % (${(Math.abs(svPctDiff) * 100).toFixed(1)}% difference)`);
      homeScore += svPctDiff > 0 ? 0.1 : -0.1;
    }

    // GAA
    const gaaDiff = awayGoalie.gaa - homeGoalie.gaa;
    if (Math.abs(gaaDiff) > 0.3) {
      factors.push(`${gaaDiff > 0 ? 'Home' : 'Away'} goalie has better GAA`);
    }

    // Recent form
    const homeRecent = this.calculateRecentSavePct(homeGoalie.recentForm);
    const awayRecent = this.calculateRecentSavePct(awayGoalie.recentForm);
    if (Math.abs(homeRecent - awayRecent) > 0.02) {
      factors.push(`Recent form: ${homeRecent > awayRecent ? 'Home' : 'Away'} goalie trending better`);
    }

    return {
      advantage: homeScore > 0 ? 'home' : homeScore < 0 ? 'away' : 'even',
      factors,
      confidence: Math.min(0.8, 0.5 + Math.abs(homeScore)),
    };
  }

  /** Analyze special teams matchup */
  analyzeSpecialTeams(
    homePP: PowerPlayStats,
    awayPP: PowerPlayStats,
  ): {
    advantage: string;
    factors: string[];
    ppGoalExpectation: { home: number; away: number };
  } {
    const factors: string[] = [];

    // Power play vs penalty kill
    const homePPvsAwayPK = (homePP.ppPct + (100 - awayPP.pkPct)) / 2;
    const awayPPvsHomePK = (awayPP.ppPct + (100 - homePP.pkPct)) / 2;

    if (homePPvsAwayPK > awayPPvsHomePK + 5) {
      factors.push('Home team has special teams advantage');
    } else if (awayPPvsHomePK > homePPvsAwayPK + 5) {
      factors.push('Away team has special teams advantage');
    }

    return {
      advantage: homePPvsAwayPK > awayPPvsHomePK ? 'home' : 'away',
      factors,
      ppGoalExpectation: {
        home: (homePPvsAwayPK / 100) * 3, // ~3 power plays per game average
        away: (awayPPvsHomePK / 100) * 3,
      },
    };
  }

  private calculateRecentSavePct(games: GoalieStats['recentForm']): number {
    if (games.length === 0) return 0.91;
    const totalSaves = games.reduce((sum, g) => sum + g.saves, 0);
    const totalShots = games.reduce((sum, g) => sum + g.saves + g.goalsAgainst, 0);
    return totalShots > 0 ? totalSaves / totalShots : 0.91;
  }

  private async getCurrentSeasonId(tournamentId: string): Promise<string | undefined> {
    const season = await this.client.getCurrentSeason(tournamentId);
    return season?.id;
  }
}
