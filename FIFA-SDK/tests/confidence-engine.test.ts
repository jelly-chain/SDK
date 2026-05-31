import { describe, it, expect } from 'vitest';
import { ConfidenceEngine } from '../src/prediction/confidence-engine.js';
import type { PredictionFeatures } from '../src/prediction/feature-builder.js';

describe('ConfidenceEngine', () => {
  const engine = new ConfidenceEngine();

  function makeFeatures(overrides: Partial<PredictionFeatures['features']> = {}): PredictionFeatures {
    return {
      marketType: 'MATCH_WINNER',
      teamIds: ['team-a', 'team-b'],
      features: { homeFormRating: 0.7, awayFormRating: 0.4, homeRanking: 5, awayRanking: 30, ...overrides },
      featureTimestamp: new Date().toISOString(),
    };
  }

  it('returns confidence between 0 and 1', () => {
    const result = engine.score(makeFeatures());
    expect(result.score).toBeGreaterThanOrEqual(0.05);
    expect(result.score).toBeLessThanOrEqual(0.95);
  });

  it('gives higher confidence with bigger form gap', () => {
    const lowGap = engine.score(makeFeatures({ homeFormRating: 0.5, awayFormRating: 0.5 }));
    const highGap = engine.score(makeFeatures({ homeFormRating: 0.9, awayFormRating: 0.1 }));
    expect(highGap.score).toBeGreaterThan(lowGap.score);
  });

  it('notes uncertainty when data is missing', () => {
    const result = engine.score(makeFeatures({ homeFormRating: undefined, awayFormRating: undefined }));
    expect(result.uncertaintyNotes.length).toBeGreaterThan(0);
  });

  it('returns a valid tier', () => {
    const result = engine.score(makeFeatures());
    expect(['very-high', 'high', 'medium', 'low', 'uncertain']).toContain(result.tier);
  });
});
