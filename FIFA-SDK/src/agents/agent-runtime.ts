import { AgentPredictionContext, MarketPlatform, MarketType } from '../types.js';
import type { FifaNamespace, IntelligenceNamespace, PredictionNamespace, MarketsNamespace } from '../sdk.js';

export interface AgentRuntimeConfig {
  format?: 'claude-json' | 'raw';
  maxEvidenceItems?: number;
}

export interface MatchContextInput {
  fixtureId: string;
  platform?: MarketPlatform;
}

export interface GroupContextInput {
  groupCode: string;
  platform?: MarketPlatform;
}

export interface PredictionContextInput {
  question: string;
  platform: MarketPlatform;
}

/** High-level agent runtime that wires all SDK modules to answer prediction questions. */
export class AgentRuntime {
  constructor(
    private readonly fifa: FifaNamespace,
    private readonly intelligence: IntelligenceNamespace,
    private readonly prediction: PredictionNamespace,
    private readonly markets: MarketsNamespace,
    private readonly config: AgentRuntimeConfig = {},
  ) {}

  /** Answer a full natural-language prediction question and return structured context. */
  async getPredictionContext(input: PredictionContextInput): Promise<AgentPredictionContext> {
    const { question, platform } = input;

    const parsed = this.prediction.parser.parse(question);
    const [homeId, awayId] = parsed.extractedTeams;

    const evidence: AgentPredictionContext['evidence'] = {};
    const signals: AgentPredictionContext['signals'] = {
      confidence: 0.5,
      riskFlags: [],
      narrativeTags: [],
    };

    if (homeId) {
      const [formData, qualPath] = await Promise.all([
        this.intelligence.form.team(homeId),
        this.intelligence.qualification.path(homeId),
      ]);
      evidence.form = [formData];
      signals.riskFlags.push(...qualPath.eliminationRisk === 'high' ? ['elimination-risk'] : []);
    }

    if (parsed.extractedGroup) {
      const groupCode = parsed.extractedGroup.replace('wc26-group-', '').toUpperCase() as any;
      evidence.standings = await this.fifa.standings.group(groupCode);
    }

    const features = await this.prediction.features.build({
      marketType: parsed.marketType,
      teamIds: parsed.extractedTeams,
    });

    const confidence = this.prediction.confidence.score(features);
    signals.confidence = confidence.score;
    signals.favorite = homeId;

    const explanation = this.prediction.explanation.build(features, confidence, homeId);

    return {
      question,
      marketPlatform: platform,
      marketType: parsed.marketType,
      entities: {
        teams: parsed.extractedTeams,
        tournament: parsed.extractedTournament,
      },
      evidence,
      signals,
      explanation: explanation.summary,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Get structured match context for a fixture. */
  async getMatchContext(input: MatchContextInput): Promise<object> {
    const { fixtureId, platform = 'POLYMARKET' } = input;
    const [fixture, narrative] = await Promise.all([
      this.fifa.fixtures.byId(fixtureId).catch(() => null),
      this.intelligence.narratives.forMatch(fixtureId),
    ]);
    if (!fixture) return { error: `Fixture not found: ${fixtureId}` };

    const matchup = await this.intelligence.matchup.compare({
      homeTeam: fixture.homeTeamId,
      awayTeam: fixture.awayTeamId,
    });

    return { fixture, matchup, narrative, platform, fetchedAt: new Date().toISOString() };
  }

  /** Get structured group-stage context including standings and form. */
  async getGroupContext(input: GroupContextInput): Promise<object> {
    const { groupCode, platform = 'POLYMARKET' } = input;
    const code = groupCode.toUpperCase() as any;
    const [group, standings] = await Promise.all([
      this.fifa.groups.byCode(code),
      this.fifa.standings.group(code),
    ]);
    return { group, standings, platform, fetchedAt: new Date().toISOString() };
  }

  /** Build a Claude-compatible tool response object. */
  async buildClaudeToolResponse(input: PredictionContextInput): Promise<object> {
    const context = await this.getPredictionContext(input);
    return {
      tool: 'world_cup_prediction',
      version: '0.1.0',
      result: context,
    };
  }

  /** Build a compact evidence bundle for agent reasoning. */
  async buildEvidenceBundle(input: { teamIds: string[]; fixtureId?: string }): Promise<object> {
    const { teamIds, fixtureId } = input;
    const bundles = await Promise.all(
      teamIds.map(async id => ({
        teamId: id,
        form: await this.intelligence.form.team(id),
        injuries: await this.intelligence.injuries.summary(id),
        qualification: await this.intelligence.qualification.path(id),
      })),
    );
    return { teams: bundles, fixtureId, generatedAt: new Date().toISOString() };
  }
}
