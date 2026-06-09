/**
 * World Cup Jelly SDK — Intelligence Engine
 *
 * Combines multiple data sources to produce match predictions,
 * team ratings, upset detection, and narrative analysis.
 */

import type { Team, Fixture, GroupStanding, FormRecord, Prediction, PredictionFactor, QualificationPath } from '../../types.js';
import type { TeamsModule } from '../teams.js';
import type { MatchesModule } from '../matches.js';
import type { GroupsModule } from '../groups.js';
import type { OddsModule } from '../odds.js';
import { Logger } from '../../logger.js';

export interface MatchPredictionInput {
  fixture: Fixture;
  homeTeam: Team;
  awayTeam: Team;
  homeForm: FormRecord | null;
  awayForm: FormRecord | null;
  standings: GroupStanding[];
  odds: any[];
}

export interface TeamRating {
  teamId: string;
  attack: number;
  defense: number;
  overall: number;
  form: number;
  momentum: number;
}

export class IntelligenceEngine {
  private readonly logger = Logger.getInstance().module('Intelligence');

  constructor(
    private readonly teams: TeamsModule,
    private readonly matches: MatchesModule,
    private readonly groups: GroupsModule,
    private readonly odds: OddsModule,
  ) {}

  /** Generate a full match prediction with factors. */
  async predictMatch(input: MatchPredictionInput): Promise<Prediction> {
    const { fixture, homeTeam, awayTeam, homeForm, awayForm, standings, odds } = input;
    const factors: PredictionFactor[] = [];

    // Factor 1: FIFA Ranking
    if (homeTeam.fifaRanking && awayTeam.fifaRanking) {
      const rankDiff = awayTeam.fifaRanking - homeTeam.fifaRanking;
      const impact = rankDiff > 0 ? 'positive' : rankDiff < 0 ? 'negative' : 'neutral';
      factors.push({ name: 'FIFA Ranking', impact, weight: 0.15, description: `${homeTeam.name} ranked ${homeTeam.fifaRanking}, ${awayTeam.name} ranked ${awayTeam.fifaRanking}` });
    }

    // Factor 2: Recent Form
    if (homeForm && awayForm) {
      const formDiff = homeForm.formRating - awayForm.formRating;
      const impact = formDiff > 0.1 ? 'positive' : formDiff < -0.1 ? 'negative' : 'neutral';
      factors.push({ name: 'Recent Form', impact, weight: 0.25, description: `${homeTeam.name} form: ${homeForm.formRating.toFixed(2)}, ${awayTeam.name} form: ${awayForm.formRating.toFixed(2)}` });
    }

    // Factor 3: Home advantage
    factors.push({ name: 'Home Advantage', impact: 'positive', weight: 0.1, description: `${homeTeam.name} playing at home` });

    // Factor 4: Group position
    const homeStanding = standings.find(s => s.teamId === homeTeam.id);
    const awayStanding = standings.find(s => s.teamId === awayTeam.id);
    if (homeStanding && awayStanding) {
      const posDiff = awayStanding.position - homeStanding.position;
      const impact = posDiff > 0 ? 'positive' : posDiff < 0 ? 'negative' : 'neutral';
      factors.push({ name: 'Group Position', impact, weight: 0.15, description: `${homeStanding.teamName} P${homeStanding.position} vs ${awayStanding.teamName} P${awayStanding.position}` });
    }

    // Factor 5: Market odds
    if (odds.length > 0) {
      const bestOdds = odds[0];
      const homeImplied = bestOdds.moneylineHome ? 1 / ((bestOdds.moneylineHome > 0 ? bestOdds.moneylineHome / 100 : 100 / Math.abs(bestOdds.moneylineHome)) + 1) : 0.5;
      factors.push({ name: 'Market Odds', impact: homeImplied > 0.5 ? 'positive' : 'negative', weight: 0.2, description: `Market implies ${(homeImplied * 100).toFixed(1)}% home win probability` });
    }

    // Calculate probabilities
    let homeWeight = 0.33;
    let drawWeight = 0.34;
    let awayWeight = 0.33;

    for (const factor of factors) {
      const adjustment = factor.weight * 0.1;
      if (factor.impact === 'positive') { homeWeight += adjustment; awayWeight -= adjustment / 2; drawWeight -= adjustment / 2; }
      else if (factor.impact === 'negative') { homeWeight -= adjustment; awayWeight += adjustment / 2; drawWeight += adjustment / 2; }
    }

    // Normalize
    const total = homeWeight + drawWeight + awayWeight;
    homeWeight /= total; drawWeight /= total; awayWeight /= total;

    const confidence = Math.min(0.95, 0.5 + factors.reduce((s, f) => s + f.weight, 0) * 0.5);
    const predictedWinner = homeWeight > awayWeight && homeWeight > drawWeight ? homeTeam.name : awayWeight > homeWeight && awayWeight > drawWeight ? awayTeam.name : 'Draw';

    return {
      id: `pred-${fixture.id}`,
      matchId: fixture.id,
      groupCode: fixture.groupCode,
      tournamentId: null,
      type: 'match_winner',
      homeWinProbability: Math.round(homeWeight * 1000) / 1000,
      drawProbability: Math.round(drawWeight * 1000) / 1000,
      awayWinProbability: Math.round(awayWeight * 1000) / 1000,
      predictedWinner,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      riskFlags: this.identifyRisks(input),
      narrativeTags: this.generateNarratives(input),
      generatedAt: new Date().toISOString(),
    };
  }

  /** Calculate ELO-style team ratings. */
  async calculateRatings(season?: number): Promise<TeamRating[]> {
    const teams = await this.teams.list(season ? { season: season as any } : {});
    const ratings: TeamRating[] = [];

    for (const team of teams) {
      const form = await this.teams.form(team.id).catch(() => null);
      const matches = await this.teams.matches(team.id, season ? { season: season as any } : {}).catch(() => []);

      const attack = form ? form.goalsScored / Math.max(form.results.length, 1) : 1;
      const defense = form ? Math.max(0, 2 - form.goalsConceded / Math.max(form.results.length, 1)) : 1;
      const formScore = form ? form.formRating : 0.5;
      const momentum = form?.trend === 'improving' ? 0.7 : form?.trend === 'declining' ? 0.3 : 0.5;

      ratings.push({
        teamId: team.id,
        attack: Math.round(attack * 100) / 100,
        defense: Math.round(defense * 100) / 100,
        overall: Math.round(((attack + defense + formScore) / 3) * 100) / 100,
        form: Math.round(formScore * 100) / 100,
        momentum: Math.round(momentum * 100) / 100,
      });
    }

    return ratings;
  }

  /** Detect upset potential in a match. */
  async upsetPotential(fixture: Fixture): Promise<{ score: number; reasons: string[] }> {
    const [homeTeam, awayTeam] = await Promise.all([
      this.teams.byId(fixture.homeTeamId).catch(() => null),
      this.teams.byId(fixture.awayTeamId).catch(() => null),
    ]);

    if (!homeTeam || !awayTeam) return { score: 0.5, reasons: ['Insufficient data'] };

    const [homeForm, awayForm] = await Promise.all([
      this.teams.form(fixture.homeTeamId).catch(() => null),
      this.teams.form(fixture.awayTeamId).catch(() => null),
    ]);

    let score = 0.5;
    const reasons: string[] = [];

    // Ranking gap
    if (homeTeam.fifaRanking && awayTeam.fifaRanking) {
      const gap = Math.abs(homeTeam.fifaRanking - awayTeam.fifaRanking);
      if (gap > 30) { score += 0.15; reasons.push(`Large ranking gap (${gap} positions)`); }
      if (gap < 10) { score -= 0.1; reasons.push('Teams closely ranked'); }
    }

    // Form contrast
    if (homeForm && awayForm) {
      const formDiff = Math.abs(homeForm.formRating - awayForm.formRating);
      if (formDiff > 0.3) { score += 0.1; reasons.push('Significant form difference'); }
    }

    return { score: Math.min(1, Math.max(0, score)), reasons };
  }

  /** Generate narrative tags for a match. */
  private generateNarratives(input: MatchPredictionInput): string[] {
    const tags: string[] = [];
    const { homeForm, awayForm, standings } = input;

    if (homeForm && homeForm.formRating > 0.7) tags.push('home-in-form');
    if (awayForm && awayForm.formRating > 0.7) tags.push('away-in-form');
    if (homeForm && homeForm.formRating < 0.3) tags.push('home-struggling');
    if (awayForm && awayForm.formRating < 0.3) tags.push('away-struggling');

    const homeStanding = standings.find(s => s.teamId === input.homeTeam.id);
    const awayStanding = standings.find(s => s.teamId === input.awayTeam.id);
    if (homeStanding && awayStanding) {
      if (homeStanding.position <= 2 && awayStanding.position <= 2) tags.push('top-of-group');
      if (homeStanding.position >= 3 && awayStanding.position >= 3) tags.push('must-win');
    }

    return tags;
  }

  private identifyRisks(input: MatchPredictionInput): string[] {
    const risks: string[] = [];
    if (!input.homeForm) risks.push('missing-home-form');
    if (!input.awayForm) risks.push('missing-away-form');
    if (input.odds.length === 0) risks.push('no-market-data');
    if (input.standings.length === 0) risks.push('no-standings-data');
    return risks;
  }
}
