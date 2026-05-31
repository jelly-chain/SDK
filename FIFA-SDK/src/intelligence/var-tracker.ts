/**
 * VAR Decision Tracking Module
 * Tracks penalties, disallowed goals, and red card reviews that shift live markets.
 */

export interface VARDecision {
  id: string;
  fixtureId: string;
  minute: number;
  type: 'goal-awarded' | 'goal-disallowed' | 'penalty-awarded' | 'penalty-denied' | 'red-card' | 'red-card-overturned' | 'offside' | 'handball' | 'foul';
  originalDecision: string;
  varDecision: string;
  reason: string;
  teamAffected: string;
  playerName?: string;
  impactScore: number; // 0-1, how much this shifts the match
}

export interface VARImpactSummary {
  fixtureId: string;
  totalReviews: number;
  goalsOverturned: number;
  penaltiesAwarded: number;
  penaltiesDenied: number;
  redCardsGiven: number;
  redCardsOverturned: number;
  netImpactHome: number;
  netImpactAway: number;
  controversialCalls: VARDecision[];
}

export interface VARMatchContext {
  fixtureId: string;
  homeTeamId: string;
  awayTeamId: string;
  currentScore: { home: number; away: number };
  decisions: VARDecision[];
  adjustedProbability: number; // Home win probability after VAR adjustments
}

export class VARTracker {
  private decisions: Map<string, VARDecision[]> = new Map();

  /** Record a VAR decision */
  record(decision: VARDecision): void {
    const existing = this.decisions.get(decision.fixtureId) ?? [];
    existing.push(decision);
    this.decisions.set(decision.fixtureId, existing);
  }

  /** Get all VAR decisions for a fixture */
  getDecisions(fixtureId: string): VARDecision[] {
    return this.decisions.get(fixtureId) ?? [];
  }

  /** Summarize VAR impact for a fixture */
  summarize(fixtureId: string): VARImpactSummary {
    const decisions = this.getDecisions(fixtureId);
    let netImpactHome = 0;
    let netImpactAway = 0;

    for (const d of decisions) {
      const impact = d.impactScore * (d.type.includes('goal') ? 0.3 : d.type.includes('penalty') ? 0.2 : 0.1);
      if (d.teamAffected === 'home') {
        netImpactHome += d.type.includes('awarded') || d.type.includes('given') ? impact : -impact;
      } else {
        netImpactAway += d.type.includes('awarded') || d.type.includes('given') ? impact : -impact;
      }
    }

    return {
      fixtureId,
      totalReviews: decisions.length,
      goalsOverturned: decisions.filter((d) => d.type === 'goal-disallowed').length,
      penaltiesAwarded: decisions.filter((d) => d.type === 'penalty-awarded').length,
      penaltiesDenied: decisions.filter((d) => d.type === 'penalty-denied').length,
      redCardsGiven: decisions.filter((d) => d.type === 'red-card').length,
      redCardsOverturned: decisions.filter((d) => d.type === 'red-card-overturned').length,
      netImpactHome,
      netImpactAway,
      controversialCalls: decisions.filter((d) => d.impactScore > 0.5),
    };
  }

  /** Calculate adjusted match probability after VAR decisions */
  calculateAdjustedProbability(
    baseHomeWinProb: number,
    fixtureId: string,
  ): { adjusted: number; factors: string[] } {
    const summary = this.summarize(fixtureId);
    let adjusted = baseHomeWinProb;
    const factors: string[] = [];

    // Goals overturned shift probability
    if (summary.goalsOverturned > 0) {
      adjusted += summary.netImpactHome * 0.15;
      factors.push(`${summary.goalsOverturned} goal(s) overturned by VAR`);
    }

    // Penalties are huge
    if (summary.penaltiesAwarded > 0) {
      adjusted += summary.netImpactHome * 0.2;
      factors.push(`${summary.penaltiesAwarded} penalty(ies) awarded by VAR`);
    }

    // Red cards shift heavily
    if (summary.redCardsGiven > 0) {
      adjusted += summary.netImpactHome * 0.25;
      factors.push(`${summary.redCardsGiven} red card(s) given by VAR`);
    }

    adjusted = Math.max(0.05, Math.min(0.95, adjusted));

    return { adjusted, factors };
  }

  /** Detect if a match had controversial VAR activity */
  hasControversialActivity(fixtureId: string): boolean {
    const decisions = this.getDecisions(fixtureId);
    return decisions.some((d) => d.impactScore > 0.6) || decisions.length >= 3;
  }

  /** Clear decisions for a fixture (e.g., for testing) */
  clear(fixtureId: string): void {
    this.decisions.delete(fixtureId);
  }
}
