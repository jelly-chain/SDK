import { AgentRuntime } from './agent-runtime.js';
import { MarketPlatform } from '../types.js';
import { MarketCommon } from '../markets/common/market-types.js';
import { kellyStake } from '../bankroll/kelly.js';
import { fixedUnitStake } from '../bankroll/fixed-units.js';
import { analyzePortfolioRisk } from '../bankroll/portfolio.js';
import { AlertEngine } from '../live/alert-engine.js';
import { ResearchSessionManager } from '../research/session.js';

export type ToolName =
  | 'resolve_sports_question'
  | 'get_match_context'
  | 'get_league_table'
  | 'explain_sports_prediction'
  | 'detect_arbitrage'
  | 'compare_markets'
  | 'calculate_ev'
  | 'kelly_stake'
  | 'fixed_unit_stake'
  | 'portfolio_risk'
  | 'fetch_with_failover'
  | 'validate_data_quality'
  | 'subscribe_live'
  | 'detect_odds_spike'
  | 'start_research_session'
  | 'gather_evidence'
  | 'synthesize_findings';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface ToolCall {
  name: ToolName;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  tool: ToolName;
  success: boolean;
  data: unknown;
  error?: string;
}

/** Adapts the SDK as Claude/Jelly agent tools. */
export class ToolAdapter {
  constructor(
    private readonly runtime: AgentRuntime,
    private readonly marketCommon: MarketCommon = new MarketCommon(),
    private readonly alertEngine: AlertEngine = new AlertEngine(),
    private readonly research: ResearchSessionManager = new ResearchSessionManager(),
  ) {}

  async execute(call: ToolCall): Promise<ToolResult> {
    try {
      let data: unknown;

      switch (call.name) {
        case 'resolve_sports_question':
          data = await this.runtime.getSportsContext({
            question: String(call.parameters['question'] ?? ''),
            platform: (call.parameters['platform'] as MarketPlatform | undefined) ?? 'POLYMARKET',
          });
          break;
        case 'get_match_context':
          data = await this.runtime.getMatchContext({
            fixtureId: String(call.parameters['fixtureId'] ?? ''),
            platform: call.parameters['platform'] as MarketPlatform | undefined,
          });
          break;
        case 'get_league_table':
          data = await this.runtime.getLeagueContext({
            league: String(call.parameters['league'] ?? 'premier-league'),
            season: call.parameters['season'] ? String(call.parameters['season']) : undefined,
          });
          break;
        case 'explain_sports_prediction':
          data = await this.runtime.buildClaudeToolResponse({
            question: String(call.parameters['question'] ?? ''),
            platform: 'POLYMARKET',
          });
          break;

        case 'detect_arbitrage': {
          const polymarketProb = call.parameters['polymarketProb'] as number | undefined;
          const kalshiProb = call.parameters['kalshiProb'] as number | undefined;
          data = this.marketCommon.detectArbitrage({ polymarketProb, kalshiProb });
          break;
        }

        case 'compare_markets': {
          const polymarketProb = call.parameters['polymarketProb'] as number | undefined;
          const kalshiProb = call.parameters['kalshiProb'] as number | undefined;
          data = this.marketCommon.compareAcrossPlatforms(polymarketProb, kalshiProb);
          break;
        }

        case 'calculate_ev': {
          const modelProb = Number(call.parameters['modelProb']);
          const oddsDecimal = Number(call.parameters['oddsDecimal']);
          const stake = call.parameters['stake'] !== undefined ? Number(call.parameters['stake']) : undefined;
          data = this.marketCommon.calculateEV({ modelProb, oddsDecimal, stake });
          break;
        }

        case 'kelly_stake': {
          const bankroll = Number(call.parameters['bankroll']);
          const p = Number(call.parameters['p']);
          const oddsDecimal = Number(call.parameters['oddsDecimal']);
          const kellyFraction = call.parameters['kellyFraction'] !== undefined ? Number(call.parameters['kellyFraction']) : undefined;
          data = kellyStake({ bankroll, p, oddsDecimal, kellyFraction });
          break;
        }

        case 'fixed_unit_stake': {
          const bankroll = Number(call.parameters['bankroll']);
          const unitSizeFraction = Number(call.parameters['unitSizeFraction']);
          const units = Number(call.parameters['units']);
          data = fixedUnitStake({ bankroll, unitSizeFraction, units });
          break;
        }

        case 'portfolio_risk': {
          const bets = call.parameters['bets'] as Array<{
            oddsDecimal: number;
            p: number;
            stakeFraction: number;
            id: string;
            group?: string;
          }>;
          const bankroll = call.parameters['bankroll'] !== undefined ? Number(call.parameters['bankroll']) : 1;
          data = analyzePortfolioRisk(bets, bankroll);
          break;
        }

        // Placeholders for agent wiring. They are registered so the LLM can call them.
        case 'fetch_with_failover':
          data = { note: 'fetch_with_failover not wired to live providers yet' };
          break;
        case 'validate_data_quality':
          data = { note: 'validate_data_quality not implemented yet' };
          break;
        case 'subscribe_live':
          data = { note: 'subscribe_live not implemented yet' };
          break;
        case 'detect_odds_spike': {
          const oddsBefore = Number(call.parameters['oddsBefore']);
          const oddsAfter = Number(call.parameters['oddsAfter']);
          const matchId = call.parameters['matchId'] ? String(call.parameters['matchId']) : undefined;
          data = this.alertEngine.detectOddsSpike({
            matchId,
            oddsBefore,
            oddsAfter,
            threshold: call.parameters['threshold'] !== undefined ? Number(call.parameters['threshold']) : undefined,
            absoluteThreshold: call.parameters['absoluteThreshold'] !== undefined ? Number(call.parameters['absoluteThreshold']) : undefined,
          });
          break;
        }

        case 'start_research_session': {
          const question = String(call.parameters['question'] ?? '');
          data = this.research.start({
            question,
            sport: call.parameters['sport'] ? String(call.parameters['sport']) : undefined,
            league: call.parameters['league'] ? String(call.parameters['league']) : undefined,
            marketPlatform: call.parameters['marketPlatform'] ? String(call.parameters['marketPlatform']) : undefined,
          });
          break;
        }

        case 'gather_evidence': {
          const sessionId = String(call.parameters['sessionId'] ?? '');
          const evidence = call.parameters['evidence'] as Array<{
            source: string;
            type: 'odds' | 'standings' | 'injuries' | 'form' | 'news' | 'market' | 'other';
            payload: unknown;
          }>;
          // naive: add each evidence item
          if (Array.isArray(evidence)) {
            for (const e of evidence) {
              this.research.addEvidence({ sessionId, evidence: e });
            }
          }
          data = this.research.gatherEvidenceSummary(sessionId);
          break;
        }

        case 'synthesize_findings': {
          const sessionId = String(call.parameters['sessionId'] ?? '');
          const highlights = (call.parameters['highlights'] as string[] | undefined) ?? [];
          const concerns = (call.parameters['concerns'] as string[] | undefined) ?? [];
          data = this.research.synthesize({ sessionId, highlights, concerns });
          break;
        }

        default:
          throw new Error(`Unknown tool: ${call.name}`);
      }

      return { tool: call.name, success: true, data };
    } catch (error) {
      return {
        tool: call.name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'resolve_sports_question' as const,
        description: 'Parse any sports prediction market question and return structured context including confidence, evidence, and signals',
        input_schema: {
          type: 'object' as const,
          properties: {
            question: { type: 'string', description: 'The market question to resolve (e.g. "Will the Lakers beat the Celtics?")' },
            platform: { type: 'string', description: 'Prediction market platform', enum: ['POLYMARKET', 'KALSHI'] },
          },
          required: ['question'],
        },
      },
      {
        name: 'get_match_context' as const,
        description: 'Get full context for a specific match including form, matchup analysis, narratives, and key risk flags',
        input_schema: {
          type: 'object' as const,
          properties: {
            fixtureId: { type: 'string', description: 'Normalized fixture ID' },
            platform: { type: 'string', enum: ['POLYMARKET', 'KALSHI'] },
          },
          required: ['fixtureId'],
        },
      },
      {
        name: 'get_league_table' as const,
        description: 'Get current league standings table with title race, playoff bubble, and relegation zone context',
        input_schema: {
          type: 'object' as const,
          properties: {
            league: { type: 'string', description: 'League ID (e.g. "premier-league", "nba", "nfl")' },
            season: { type: 'string', description: 'Season (e.g. "2025/2026")' },
          },
          required: ['league'],
        },
      },
      {
        name: 'explain_sports_prediction' as const,
        description: 'Get a full explanation with confidence score, key factors, counter-factors, and model disclaimer for a sports prediction question',
        input_schema: {
          type: 'object' as const,
          properties: {
            question: { type: 'string', description: 'The prediction question to explain' },
          },
          required: ['question'],
        },
      },

      {
        name: 'detect_arbitrage' as const,
        description: 'Detect cross-platform arbitrage between Polymarket and Kalshi by comparing probabilities',
        input_schema: {
          type: 'object' as const,
          properties: {
            polymarketProb: { type: 'number', description: 'Model probability from Polymarket pricing' },
            kalshiProb: { type: 'number', description: 'Model probability from Kalshi pricing' },
            threshold: { type: 'number', description: 'Minimum divergence to call arbitrage' },
          },
          required: [],
        },
      },
      {
        name: 'compare_markets' as const,
        description: 'Compare implied probabilities across platforms and report divergence direction',
        input_schema: {
          type: 'object' as const,
          properties: {
            polymarketProb: { type: 'number', description: 'Polymarket probability' },
            kalshiProb: { type: 'number', description: 'Kalshi probability' },
          },
          required: [],
        },
      },
      {
        name: 'calculate_ev' as const,
        description: 'Calculate expected value (EV) for a bet given model probability and decimal odds',
        input_schema: {
          type: 'object' as const,
          properties: {
            modelProb: { type: 'number', description: 'Model probability in [0,1]' },
            oddsDecimal: { type: 'number', description: 'Decimal odds (>1)' },
            stake: { type: 'number', description: 'Stake base used for EV per stake unit' },
          },
          required: ['modelProb', 'oddsDecimal'],
        },
      },
      {
        name: 'kelly_stake' as const,
        description: 'Compute fractional Kelly stake for a single bet',
        input_schema: {
          type: 'object' as const,
          properties: {
            bankroll: { type: 'number', description: 'Current bankroll' },
            p: { type: 'number', description: 'Win probability in [0,1]' },
            oddsDecimal: { type: 'number', description: 'Decimal odds (>1)' },
            kellyFraction: { type: 'number', description: 'Fraction of full Kelly (1=full)' },
          },
          required: ['bankroll', 'p', 'oddsDecimal'],
        },
      },
      {
        name: 'fixed_unit_stake' as const,
        description: 'Compute fixed-unit stake (stake = bankroll * unitSizeFraction * units)',
        input_schema: {
          type: 'object' as const,
          properties: {
            bankroll: { type: 'number', description: 'Current bankroll' },
            unitSizeFraction: { type: 'number', description: 'Unit size as fraction of bankroll' },
            units: { type: 'number', description: 'Number of units' },
          },
          required: ['bankroll', 'unitSizeFraction', 'units'],
        },
      },
      {
        name: 'portfolio_risk' as const,
        description: 'Analyze portfolio exposure and tail risk across multiple bets',
        input_schema: {
          type: 'object' as const,
          properties: {
            bankroll: { type: 'number', description: 'Starting bankroll base (default 1)' },
            bets: { type: 'array' as unknown as string, description: 'Array of bets with oddsDecimal, p, stakeFraction, id' },
          },
          required: ['bets'],
        },
      },

      {
        name: 'fetch_with_failover' as const,
        description: 'Fetch data using provider failover chain (to be wired in Phase 1e)',
        input_schema: {
          type: 'object' as const,
          properties: {
            providerNames: { type: 'array' as unknown as string, description: 'Ordered provider names' },
            endpoint: { type: 'string', description: 'Endpoint/URL to fetch' },
          },
          required: [],
        },
      },
      {
        name: 'validate_data_quality' as const,
        description: 'Score odds/market data quality for downstream weighting',
        input_schema: {
          type: 'object' as const,
          properties: {
            data: { type: 'object', description: 'Raw data to score' },
          },
          required: [],
        },
      },

      {
        name: 'subscribe_live' as const,
        description: 'Subscribe to live event stream and route alerts (to be wired in Phase 1e)',
        input_schema: {
          type: 'object' as const,
          properties: {
            matchId: { type: 'string' },
          },
          required: [],
        },
      },
      {
        name: 'detect_odds_spike' as const,
        description: 'Detect odds spike alerts based on before/after decimal odds',
        input_schema: {
          type: 'object' as const,
          properties: {
            matchId: { type: 'string' },
            oddsBefore: { type: 'number' },
            oddsAfter: { type: 'number' },
            threshold: { type: 'number', description: 'Relative spike threshold' },
            absoluteThreshold: { type: 'number', description: 'Absolute odds delta threshold' },
          },
          required: ['oddsBefore', 'oddsAfter'],
        },
      },

      {
        name: 'start_research_session' as const,
        description: 'Start a research session for evidence gathering and later synthesis',
        input_schema: {
          type: 'object' as const,
          properties: {
            question: { type: 'string' },
            sport: { type: 'string' },
            league: { type: 'string' },
            marketPlatform: { type: 'string' },
          },
          required: ['question'],
        },
      },
      {
        name: 'gather_evidence' as const,
        description: 'Add evidence items to an existing research session',
        input_schema: {
          type: 'object' as const,
          properties: {
            sessionId: { type: 'string' },
            evidence: { type: 'array' as unknown as string },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'synthesize_findings' as const,
        description: 'Finalize a research session with highlights and concerns',
        input_schema: {
          type: 'object' as const,
          properties: {
            sessionId: { type: 'string' },
            highlights: { type: 'array' as unknown as string },
            concerns: { type: 'array' as unknown as string },
          },
          required: ['sessionId'],
        },
      },
    ];
  }
}
