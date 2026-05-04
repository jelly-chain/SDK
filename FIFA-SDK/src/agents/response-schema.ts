import { AgentPredictionContext, MarketPlatform, MarketType } from '../types.js';

/** Validates and ensures agent response objects conform to the expected schema. */
export class ResponseSchema {
  /** Validate that an object has the required AgentPredictionContext fields. */
  validate(obj: unknown): obj is AgentPredictionContext {
    if (typeof obj !== 'object' || obj === null) return false;
    const ctx = obj as Record<string, unknown>;
    return (
      typeof ctx['question'] === 'string' &&
      typeof ctx['marketPlatform'] === 'string' &&
      typeof ctx['marketType'] === 'string' &&
      Array.isArray((ctx['entities'] as any)?.teams) &&
      typeof (ctx['signals'] as any)?.confidence === 'number' &&
      typeof ctx['explanation'] === 'string' &&
      typeof ctx['generatedAt'] === 'string'
    );
  }

  /** Create a minimal valid AgentPredictionContext for error fallback. */
  fallback(question: string, platform: MarketPlatform = 'POLYMARKET'): AgentPredictionContext {
    return {
      question,
      marketPlatform: platform,
      marketType: 'MATCH_WINNER',
      entities: { teams: [], tournament: 'fifa-wc-2026' },
      evidence: {},
      signals: { confidence: 0, riskFlags: ['data-unavailable'], narrativeTags: [] },
      explanation: 'Unable to generate prediction context due to missing data.',
      generatedAt: new Date().toISOString(),
    };
  }
}
