import type { FifaNamespace, IntelligenceNamespace } from '../sdk.js';

export interface MatchNarrative {
  fixtureId: string;
  tags: string[];
  summary: string;
  keyStorylines: string[];
}

const NARRATIVE_TAGS = {
  MUST_WIN: 'must-win',
  ELIMINATION_PRESSURE: 'elimination-pressure',
  REVENGE_MATCH: 'revenge-match',
  GROUP_DECIDER: 'group-decider',
  ROTATION_RISK: 'rotation-risk',
  ALREADY_QUALIFIED: 'already-qualified',
  UNDERDOG: 'underdog',
  FORM_CONTRAST: 'form-contrast',
  HISTORICAL_RIVALRY: 'historical-rivalry',
} as const;

/** Generates human-readable and tag-based narrative context for matches. */
export class NarrativeEngine {
  constructor(
    private readonly fifa: FifaNamespace,
    private readonly intelligence: IntelligenceNamespace,
  ) {}

  /** Build match narrative tags and story lines for a fixture. */
  async forMatch(fixtureId: string): Promise<MatchNarrative> {
    const fixture = await this.fifa.fixtures.byId(fixtureId).catch(() => null);
    if (!fixture) {
      return { fixtureId, tags: [], summary: 'Fixture not found', keyStorylines: [] };
    }

    const tags: string[] = [];
    const keyStorylines: string[] = [];

    const [homeQual, awayQual, homeForm, awayForm] = await Promise.all([
      this.intelligence.qualification.path(fixture.homeTeamId),
      this.intelligence.qualification.path(fixture.awayTeamId),
      this.intelligence.form.team(fixture.homeTeamId),
      this.intelligence.form.team(fixture.awayTeamId),
    ]);

    if (homeQual.eliminationRisk === 'high') {
      tags.push(NARRATIVE_TAGS.MUST_WIN);
      keyStorylines.push(`${fixture.homeTeamId} must win to stay in contention`);
    }
    if (awayQual.eliminationRisk === 'high') {
      tags.push(NARRATIVE_TAGS.ELIMINATION_PRESSURE);
      keyStorylines.push(`${fixture.awayTeamId} faces elimination`);
    }

    const formDiff = Math.abs(homeForm.formRating - awayForm.formRating);
    if (formDiff > 0.3) {
      tags.push(NARRATIVE_TAGS.FORM_CONTRAST);
      keyStorylines.push('Teams arrive in very different form');
    }

    const summary =
      tags.length > 0
        ? `Key fixture — themes: ${tags.join(', ')}`
        : 'Standard group fixture with normal stakes';

    return { fixtureId, tags, summary, keyStorylines };
  }
}
