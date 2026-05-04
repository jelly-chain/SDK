import type { FifaNamespace } from '../sdk.js';

export interface UpsetRisk {
  fixtureId: string;
  favoriteTeamId: string;
  underdogTeamId: string;
  upsetProbability: number;
  upsetFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/** Detects fixtures at risk of an upset based on contextual signals. */
export class UpsetDetector {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Evaluate upset risk for a specific fixture. */
  async evaluate(fixtureId: string): Promise<UpsetRisk | undefined> {
    const fixture = await this.fifa.fixtures.byId(fixtureId).catch(() => null);
    if (!fixture) return undefined;

    const [homeTeam, awayTeam] = await Promise.all([
      this.fifa.teams.byId(fixture.homeTeamId),
      this.fifa.teams.byId(fixture.awayTeamId),
    ]);

    const homeRank = homeTeam.fifaRanking ?? 50;
    const awayRank = awayTeam.fifaRanking ?? 50;
    const rankGap = Math.abs(homeRank - awayRank);

    const favoriteTeamId = homeRank < awayRank ? fixture.homeTeamId : fixture.awayTeamId;
    const underdogTeamId = favoriteTeamId === fixture.homeTeamId ? fixture.awayTeamId : fixture.homeTeamId;

    const upsetFactors: string[] = [];
    if (rankGap < 10) upsetFactors.push('close-ranking-gap');
    if (rankGap < 5) upsetFactors.push('near-equal-ranking');

    const upsetProbability = Math.max(0.05, 0.5 - rankGap / 200);
    const riskLevel =
      upsetProbability > 0.35 ? 'high' : upsetProbability > 0.2 ? 'medium' : 'low';

    return { fixtureId, favoriteTeamId, underdogTeamId, upsetProbability, upsetFactors, riskLevel };
  }
}
