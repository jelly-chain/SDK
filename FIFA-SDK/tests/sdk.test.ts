import { describe, it, expect, beforeEach } from 'vitest';
import { WorldCupJellySDK } from '../src/sdk.js';

describe('WorldCupJellySDK', () => {
  let sdk: WorldCupJellySDK;

  beforeEach(() => {
    sdk = new WorldCupJellySDK({
      cache: { type: 'memory', ttlSeconds: 10 },
      agent: { format: 'claude-json' },
    });
  });

  it('initializes all namespaces', () => {
    expect(sdk.fifa).toBeDefined();
    expect(sdk.intelligence).toBeDefined();
    expect(sdk.prediction).toBeDefined();
    expect(sdk.markets).toBeDefined();
    expect(sdk.agents).toBeDefined();
    expect(sdk.backtesting).toBeDefined();
  });

  it('fifa.fixtures.list returns empty array when no provider configured', async () => {
    const fixtures = await sdk.fifa.fixtures.list({ stage: 'group' });
    expect(Array.isArray(fixtures)).toBe(true);
  });

  it('fifa.standings.group returns empty array when no data', async () => {
    const standings = await sdk.fifa.standings.group('A');
    expect(Array.isArray(standings)).toBe(true);
  });

  it('fifa.bracket.current returns array', async () => {
    const bracket = await sdk.fifa.bracket.current();
    expect(Array.isArray(bracket)).toBe(true);
  });

  it('prediction.parser.parse extracts market type', () => {
    const result = sdk.prediction.parser.parse('Will Brazil win the 2026 FIFA World Cup?');
    expect(result.marketType).toBe('TOURNAMENT_WINNER');
    expect(result.extractedTeams).toContain('team-brazil');
  });

  it('prediction.parser.parse detects group winner', () => {
    const result = sdk.prediction.parser.parse('Will France win Group B?');
    expect(result.marketType).toBe('GROUP_WINNER');
  });

  it('prediction.confidence.score returns valid result', () => {
    const features = {
      fixtureId: 'wc26-match-001',
      marketType: 'MATCH_WINNER' as const,
      teamIds: ['team-argentina', 'team-brazil'],
      features: { homeFormRating: 0.8, awayFormRating: 0.6, homeRanking: 1, awayRanking: 5 },
      featureTimestamp: new Date().toISOString(),
    };
    const result = sdk.prediction.confidence.score(features);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(['very-high', 'high', 'medium', 'low', 'uncertain']).toContain(result.tier);
  });

  it('agents.getPredictionContext returns valid context', async () => {
    const context = await sdk.agents.getPredictionContext({
      question: 'Will Argentina win Group A?',
      platform: 'POLYMARKET',
    });
    expect(context.question).toBe('Will Argentina win Group A?');
    expect(context.marketPlatform).toBe('POLYMARKET');
    expect(typeof context.signals.confidence).toBe('number');
    expect(typeof context.explanation).toBe('string');
    expect(typeof context.generatedAt).toBe('string');
  });

  it('agents.getGroupContext returns object', async () => {
    const ctx = await sdk.agents.getGroupContext({ groupCode: 'A' });
    expect(ctx).toBeDefined();
  });

  it('markets.common.resolveQuestion returns POLYMARKET for unknown', () => {
    const result = sdk.markets.common.resolveQuestion('Will Spain win?');
    expect(result.platform).toBe('POLYMARKET');
  });
});
