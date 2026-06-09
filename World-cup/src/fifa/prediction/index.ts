/**
 * World Cup Jelly SDK — Prediction Module
 * Market question parsing, confidence scoring, scenario generation, explanation building.
 */
import type { AgentPredictionContext, MarketQuestion, Prediction, SeasonYear, GroupCode } from '../../types.js';
import type { TeamsModule } from '../teams.js';
import type { MatchesModule } from '../matches.js';
import type { GroupsModule } from '../groups.js';
import type { OddsModule } from '../odds.js';
import type { IntelligenceEngine } from '../intelligence/index.js';
import { Logger } from '../../logger.js';

export class PredictionModule {
  private readonly logger = Logger.getInstance().module('Prediction');

  constructor(
    private readonly teams: TeamsModule,
    private readonly matches: MatchesModule,
    private readonly groups: GroupsModule,
    private readonly odds: OddsModule,
    private readonly intelligence: IntelligenceEngine,
  ) {}

  /** Parse a natural-language market question. */
  parseQuestion(raw: string): MarketQuestion {
    const normalized = raw.toLowerCase().trim();
    let marketType: any = 'match_winner';
    const extractedTeams: string[] = [];
    let extractedGroup: GroupCode | null = null;
    let extractedSeason: SeasonYear = 2026;

    // Detect market type
    if (/group\s+[a-h]\s+winner|winner\s+of\s+group/i.test(normalized)) marketType = 'group_winner';
    else if (/qualif|advance|progress/i.test(normalized)) marketType = 'qualification';
    else if (/win\s+(the\s+)?(world\s+)?cup|tournament\s+winner|outright/i.test(normalized)) marketType = 'tournament_winner';
    else if (/top\s+scorer|golden\s+boot|most\s+goals/i.test(normalized)) marketType = 'top_scorer';

    // Extract group
    const groupMatch = normalized.match(/group\s+([a-h])/i);
    if (groupMatch) extractedGroup = groupMatch[1].toUpperCase() as GroupCode;

    // Extract season
    const yearMatch = normalized.match(/\b(2018|2022|2026)\b/);
    if (yearMatch) extractedSeason = parseInt(yearMatch[1]) as SeasonYear;

    return { raw, normalized, marketType, extractedTeams, extractedGroup, extractedTournament: `fifa-wc-${extractedSeason}`, extractedSeason };
  }

  /** Build a full prediction context for a market question. */
  async buildContext(question: string, platform = 'POLYMARKET'): Promise<AgentPredictionContext> {
    const parsed = this.parseQuestion(question);
    const evidence: AgentPredictionContext['evidence'] = { standings: [], form: [], squadNews: [], matchStats: [], shots: [], momentum: [], odds: [], prediction: null, qualificationPath: null };
    const signals: AgentPredictionContext['signals'] = { favorite: null, confidence: 0.5, riskFlags: [], narrativeTags: [], upsetPotential: 0.5, valueBet: false, valueEdge: null };

    try {
      if (parsed.extractedGroup) {
        evidence.standings = await this.groups.standings(parsed.extractedGroup, parsed.extractedSeason);
        const pred = await this.groups.prediction(parsed.extractedGroup, parsed.extractedSeason);
        if (pred) evidence.prediction = pred as any;
      }
    } catch (e) {
      signals.riskFlags.push('data-fetch-error');
    }

    return {
      question, marketPlatform: platform as any, marketType: parsed.marketType,
      entities: { teams: parsed.extractedTeams, fixtureId: null, tournament: parsed.extractedTournament, groupCode: parsed.extractedGroup },
      evidence, signals, explanation: this.generateExplanation(question, evidence, signals), generatedAt: new Date().toISOString(),
    };
  }

  /** Score confidence for a set of features. */
  scoreConfidence(features: Record<string, number>): { score: number; breakdown: Record<string, number> } {
    const weights: Record<string, number> = { form: 0.25, ranking: 0.15, h2h: 0.15, market: 0.2, stats: 0.15, momentum: 0.1 };
    let score = 0.5;
    const breakdown: Record<string, number> = {};
    for (const [key, value] of Object.entries(features)) {
      const weight = weights[key] ?? 0.1;
      const contribution = value * weight;
      breakdown[key] = Math.round(contribution * 1000) / 1000;
      score += contribution;
    }
    return { score: Math.min(0.95, Math.max(0.05, score)), breakdown };
  }

  /** Generate human-readable explanation. */
  generateExplanation(question: string, evidence: AgentPredictionContext['evidence'], signals: AgentPredictionContext['signals']): string {
    const parts: string[] = [];
    parts.push(`Analysis for: "${question}"`);
    if (evidence.standings.length > 0) parts.push(`Group standings: ${evidence.standings.map(s => `${s.teamName} (P${s.position}, ${s.points}pts)`).join(', ')}`);
    if (evidence.form.length > 0) parts.push(`Form: ${evidence.form.map(f => `${f.teamName} ${f.formRating.toFixed(2)} (${f.trend})`).join(', ')}`);
    parts.push(`Confidence: ${(signals.confidence * 100).toFixed(1)}%`);
    if (signals.riskFlags.length > 0) parts.push(`Risks: ${signals.riskFlags.join(', ')}`);
    return parts.join('. ');
  }
}
