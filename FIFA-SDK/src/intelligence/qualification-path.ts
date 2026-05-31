import { MatchStage } from '../types.js';
import type { FifaNamespace } from '../sdk.js';

export interface QualificationPathReport {
  teamId: string;
  currentStage: MatchStage | 'group';
  remainingGroupMatches: number;
  pointsNeededToQualify?: number;
  qualificationProbability: number;
  pathToFinal: string[];
  eliminationRisk: 'high' | 'medium' | 'low' | 'none';
}

/** Calculates a team's path and probability of advancing through the tournament. */
export class QualificationPath {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Return a qualification path report for a team. */
  async path(teamId: string): Promise<QualificationPathReport> {
    const [standing, fixtures] = await Promise.all([
      this.fifa.standings.forTeam(teamId),
      this.fifa.fixtures.list({ team: teamId, status: 'scheduled' }),
    ]);

    const remainingGroupMatches = fixtures.filter(f => f.stage === 'group').length;
    const points = standing?.points ?? 0;
    const pointsNeededToQualify = Math.max(0, 6 - points);

    let qualificationProbability = 0.5;
    if (points >= 6) qualificationProbability = 0.9;
    else if (points >= 4) qualificationProbability = 0.7;
    else if (points >= 1) qualificationProbability = 0.35;
    else qualificationProbability = 0.15;

    const eliminationRisk =
      qualificationProbability > 0.7
        ? 'none'
        : qualificationProbability > 0.5
          ? 'low'
          : qualificationProbability > 0.3
            ? 'medium'
            : 'high';

    return {
      teamId,
      currentStage: 'group',
      remainingGroupMatches,
      pointsNeededToQualify,
      qualificationProbability,
      pathToFinal: ['Round of 16', 'Quarterfinal', 'Semifinal', 'Final'],
      eliminationRisk,
    };
  }
}
