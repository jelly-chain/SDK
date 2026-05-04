import { MarketType } from '../types.js';
import type { FifaNamespace, IntelligenceNamespace } from '../sdk.js';

export interface PredictionFeatures {
  fixtureId?: string;
  marketType: MarketType;
  teamIds: string[];
  features: {
    homeFormRating?: number;
    awayFormRating?: number;
    homeRanking?: number;
    awayRanking?: number;
    homeGoalsFor?: number;
    awayGoalsFor?: number;
    homeAvailabilityRatio?: number;
    awayAvailabilityRatio?: number;
    headToHeadHomeWinRate?: number;
    restDaysDifferential?: number;
    upsetProbability?: number;
  };
  featureTimestamp: string;
}

/** Builds normalized feature vectors for a market question. */
export class FeatureBuilder {
  constructor(
    private readonly fifa: FifaNamespace,
    private readonly intelligence: IntelligenceNamespace,
  ) {}

  /** Build a feature set for a given fixture and market type. */
  async build(input: { marketType: MarketType; fixtureId?: string; teamIds?: string[] }): Promise<PredictionFeatures> {
    const { marketType, fixtureId, teamIds = [] } = input;

    let fixture = null;
    if (fixtureId) {
      fixture = await this.fifa.fixtures.byId(fixtureId).catch(() => null);
    }

    const ids = fixture ? [fixture.homeTeamId, fixture.awayTeamId] : teamIds;
    const [homeId, awayId] = ids;

    const features: PredictionFeatures['features'] = {};

    if (homeId && awayId) {
      const [homeForm, awayForm, homeTeam, awayTeam, h2h] = await Promise.all([
        this.intelligence.form.team(homeId),
        this.intelligence.form.team(awayId),
        this.fifa.teams.byId(homeId).catch(() => null),
        this.fifa.teams.byId(awayId).catch(() => null),
        this.fifa.history.headToHead(homeId, awayId),
      ]);

      features.homeFormRating = homeForm.formRating;
      features.awayFormRating = awayForm.formRating;
      features.homeRanking = homeTeam?.fifaRanking;
      features.awayRanking = awayTeam?.fifaRanking;
      features.homeGoalsFor = homeForm.goalsScored;
      features.awayGoalsFor = awayForm.goalsScored;

      const totalH2H = h2h.teamAWins + h2h.teamBWins + h2h.draws;
      features.headToHeadHomeWinRate = totalH2H > 0 ? h2h.teamAWins / totalH2H : 0.33;
    }

    return {
      fixtureId,
      marketType,
      teamIds: ids,
      features,
      featureTimestamp: new Date().toISOString(),
    };
  }
}
