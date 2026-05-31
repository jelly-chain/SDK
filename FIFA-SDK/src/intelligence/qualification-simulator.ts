/**
 * WC Qualifier Pathway Simulator
 * Extends qualification-path engine to model all confederations.
 */

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC';

export interface QualifierGroup {
  id: string;
  confederation: Confederation;
  teams: string[];
  standings: QualifierStanding[];
  matchesRemaining: number;
}

export interface QualifierStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface QualifierPathReport {
  teamId: string;
  confederation: Confederation;
  groupId?: string;
  currentPosition: number;
  points: number;
  matchesPlayed: number;
  matchesRemaining: number;
  pointsNeeded: number;
  qualificationProbability: number;
  qualificationMethod: 'automatic' | 'playoff' | 'intercontinental-playoff' | 'elimination';
  scenarios: QualifierScenario[];
  riskLevel: 'safe' | 'comfortable' | 'tense' | 'critical' | 'eliminated';
  keyMatches: string[];
}

export interface QualifierScenario {
  description: string;
  probability: number;
  outcome: 'qualify' | 'eliminate' | 'playoff';
  requiredResults: string[];
}

export interface ConfederationSlots {
  confederation: Confederation;
  totalSlots: number;
  automaticSlots: number;
  playoffSlots: number;
  intercontinentalSlots: number;
}

/** Slots allocated for 2026 World Cup (48 teams) */
const CONFEDERATION_SLOTS: Record<Confederation, ConfederationSlots> = {
  UEFA: { confederation: 'UEFA', totalSlots: 16, automaticSlots: 12, playoffSlots: 4, intercontinentalSlots: 0 },
  CONMEBOL: { confederation: 'CONMEBOL', totalSlots: 6, automaticSlots: 6, playoffSlots: 0, intercontinentalSlots: 0 },
  CONCACAF: { confederation: 'CONCACAF', totalSlots: 6, automaticSlots: 3, playoffSlots: 2, intercontinentalSlots: 1 },
  AFC: { confederation: 'AFC', totalSlots: 8, automaticSlots: 8, playoffSlots: 0, intercontinentalSlots: 0 },
  CAF: { confederation: 'CAF', totalSlots: 9, automaticSlots: 9, playoffSlots: 0, intercontinentalSlots: 0 },
  OFC: { confederation: 'OFC', totalSlots: 1, automaticSlots: 1, playoffSlots: 0, intercontinentalSlots: 0 },
};

const INTERCONTINENTAL_PLAYOFF_SLOTS = 2;

export class QualificationSimulator {
  private groups: Map<string, QualifierGroup> = new Map();
  private confederation: Confederation;

  constructor(confederation: Confederation) {
    this.confederation = confederation;
  }

  /** Register a qualifier group */
  registerGroup(group: QualifierGroup): void {
    this.groups.set(group.id, group);
  }

  /** Get all groups for this confederation */
  getGroups(): QualifierGroup[] {
    return Array.from(this.groups.values()).filter((g) => g.confederation === this.confederation);
  }

  /** Get confederation slot allocation */
  getSlots(): ConfederationSlots {
    return CONFEDERATION_SLOTS[this.confederation];
  }

  /** Analyze a team's qualification path */
  analyze(teamId: string): QualifierPathReport | null {
    const group = this.findTeamGroup(teamId);
    if (!group) return null;

    const standing = group.standings.find((s) => s.teamId === teamId);
    if (!standing) return null;

    const slots = this.getSlots();
    const scenarios = this.simulateScenarios(group, standing, slots);

    // Calculate qualification probability
    const qualifyScenarios = scenarios.filter((s) => s.outcome === 'qualify');
    const playoffScenarios = scenarios.filter((s) => s.outcome === 'playoff');
    const qualificationProbability =
      qualifyScenarios.reduce((sum, s) => sum + s.probability, 0) +
      playoffScenarios.reduce((sum, s) => sum + s.probability, 0) * 0.4; // 40% chance through playoffs

    // Determine qualification method
    let qualificationMethod: QualifierPathReport['qualificationMethod'] = 'elimination';
    if (standing.position <= slots.automaticSlots) {
      qualificationMethod = 'automatic';
    } else if (standing.position <= slots.automaticSlots + slots.playoffSlots) {
      qualificationMethod = 'playoff';
    } else if (standing.position <= slots.automaticSlots + slots.playoffSlots + slots.intercontinentalSlots) {
      qualificationMethod = 'intercontinental-playoff';
    }

    // Risk level
    const riskLevel: QualifierPathReport['riskLevel'] =
      qualificationProbability > 0.85 ? 'safe' :
      qualificationProbability > 0.65 ? 'comfortable' :
      qualificationProbability > 0.45 ? 'tense' :
      qualificationProbability > 0.2 ? 'critical' : 'eliminated';

    // Points needed (approximate)
    const avgPointsPerPosition = this.calculateAveragePointsPerPosition(group);
    const pointsNeeded = Math.max(0, (avgPointsPerPosition[slots.automaticSlots - 1] ?? 20) - standing.points);

    // Key matches
    const keyMatches = this.identifyKeyMatches(group, teamId);

    return {
      teamId,
      confederation: this.confederation,
      groupId: group.id,
      currentPosition: standing.position,
      points: standing.points,
      matchesPlayed: standing.played,
      matchesRemaining: group.matchesRemaining,
      pointsNeeded,
      qualificationProbability,
      qualificationMethod,
      scenarios,
      riskLevel,
      keyMatches,
    };
  }

  /** Simulate all possible outcomes */
  private simulateScenarios(
    group: QualifierGroup,
    standing: QualifierStanding,
    slots: ConfederationSlots,
  ): QualifierScenario[] {
    const scenarios: QualifierScenario[] = [];
    const remaining = group.matchesRemaining;

    // Best case: win all remaining
    const bestCasePoints = standing.points + remaining * 3;
    const bestPosition = this.estimatePosition(group, standing.teamId, bestCasePoints);
    scenarios.push({
      description: `Win all ${remaining} remaining matches`,
      probability: Math.pow(0.4, remaining), // ~40% per match
      outcome: bestPosition <= slots.automaticSlots ? 'qualify' : 'playoff',
      requiredResults: Array(remaining).fill('win'),
    });

    // Realistic: win 60%, draw 20%, lose 20%
    const realisticPoints = standing.points + Math.round(remaining * 0.6 * 3 + remaining * 0.2 * 1);
    const realisticPosition = this.estimatePosition(group, standing.teamId, realisticPoints);
    scenarios.push({
      description: `Realistic scenario: ~${Math.round(remaining * 0.6)}W, ${Math.round(remaining * 0.2)}D, ${Math.round(remaining * 0.2)}L`,
      probability: 0.4,
      outcome: realisticPosition <= slots.automaticSlots ? 'qualify' :
               realisticPosition <= slots.automaticSlots + slots.playoffSlots ? 'playoff' : 'eliminate',
      requiredResults: ['realistic-mix'],
    });

    // Worst case: lose all
    scenarios.push({
      description: `Lose all ${remaining} remaining matches`,
      probability: Math.pow(0.2, remaining),
      outcome: 'eliminate',
      requiredResults: Array(remaining).fill('loss'),
    });

    // Draw-heavy scenario
    const drawPoints = standing.points + remaining;
    const drawPosition = this.estimatePosition(group, standing.teamId, drawPoints);
    scenarios.push({
      description: `Draw all ${remaining} remaining matches`,
      probability: Math.pow(0.3, remaining),
      outcome: drawPosition <= slots.automaticSlots ? 'qualify' :
               drawPosition <= slots.automaticSlots + slots.playoffSlots ? 'playoff' : 'eliminate',
      requiredResults: Array(remaining).fill('draw'),
    });

    return scenarios;
  }

  private findTeamGroup(teamId: string): QualifierGroup | undefined {
    for (const group of this.groups.values()) {
      if (group.teams.includes(teamId)) return group;
    }
    return undefined;
  }

  private estimatePosition(group: QualifierGroup, teamId: string, projectedPoints: number): number {
    let position = 1;
    for (const standing of group.standings) {
      if (standing.teamId === teamId) continue;
      // Project other teams' final points (rough estimate)
      const avgPointsPerMatch = standing.played > 0 ? standing.points / standing.played : 1;
      const projectedOther = standing.points + Math.round(avgPointsPerMatch * group.matchesRemaining);
      if (projectedOther > projectedPoints) position++;
    }
    return position;
  }

  private calculateAveragePointsPerPosition(group: QualifierGroup): number[] {
    const sorted = [...group.standings].sort((a, b) => a.position - b.position);
    return sorted.map((s) => s.points);
  }

  private identifyKeyMatches(group: QualifierGroup, teamId: string): string[] {
    // Identify matches against direct rivals (teams close in standings)
    const standing = group.standings.find((s) => s.teamId === teamId);
    if (!standing) return [];

    const rivals = group.standings
      .filter((s) => s.teamId !== teamId && Math.abs(s.position - standing.position) <= 2)
      .map((s) => s.teamId);

    return rivals;
  }

  /** Get summary of all confederation qualifier races */
  async getConfederationOverview(): Promise<{
    confederation: Confederation;
    slots: ConfederationSlots;
    groups: Array<{
      groupId: string;
      leaders: string[];
      bubbleTeams: string[];
      eliminatedTeams: string[];
    }>;
  }> {
    const slots = this.getSlots();
    const groups = this.getGroups().map((group) => {
      const sorted = [...group.standings].sort((a, b) => a.position - b.position);
      return {
        groupId: group.id,
        leaders: sorted.slice(0, slots.automaticSlots).map((s) => s.teamId),
        bubbleTeams: sorted.slice(slots.automaticSlots, slots.automaticSlots + slots.playoffSlots + 1).map((s) => s.teamId),
        eliminatedTeams: sorted.slice(-3).map((s) => s.teamId),
      };
    });

    return { confederation: this.confederation, slots, groups };
  }
}
