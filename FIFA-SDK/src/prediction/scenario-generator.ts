import type { FifaNamespace, IntelligenceNamespace } from '../sdk.js';

export interface Scenario {
  label: string;
  probability: number;
  description: string;
  implications: string[];
}

/** Generates possible outcome scenarios for a fixture or group. */
export class ScenarioGenerator {
  constructor(
    private readonly fifa: FifaNamespace,
    private readonly intelligence: IntelligenceNamespace,
  ) {}

  /** Generate match outcome scenarios for a fixture. */
  async forFixture(fixtureId: string): Promise<Scenario[]> {
    const fixture = await this.fifa.fixtures.byId(fixtureId).catch(() => null);
    if (!fixture) return [];

    const [homeForm, awayForm] = await Promise.all([
      this.intelligence.form.team(fixture.homeTeamId),
      this.intelligence.form.team(fixture.awayTeamId),
    ]);

    const homeStrength = homeForm.formRating;
    const awayStrength = awayForm.formRating;
    const total = homeStrength + awayStrength + 0.2;

    const homeWinP = homeStrength / total;
    const drawP = 0.2 / total;
    const awayWinP = awayStrength / total;

    return [
      {
        label: `${fixture.homeTeamId} wins`,
        probability: homeWinP,
        description: `Home team wins in regular or extra time`,
        implications: [`${fixture.homeTeamId} advances or improves group position`],
      },
      {
        label: 'Draw',
        probability: drawP,
        description: 'Match ends level after 90 minutes',
        implications: ['Both teams share points in group stage'],
      },
      {
        label: `${fixture.awayTeamId} wins`,
        probability: awayWinP,
        description: `Away team wins the fixture`,
        implications: [`${fixture.awayTeamId} advances or improves group position`],
      },
    ];
  }
}
