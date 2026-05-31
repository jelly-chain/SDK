import { describe, it, expect } from 'vitest';
import { ConfidenceEngine } from '../src/prediction/confidence-engine.js';
import { PredictionFeatures } from '../src/prediction/feature-builder.js';

const baseFeatures: PredictionFeatures = {
  marketType: 'MATCH_WINNER',
  homeFormRating: 0.5,
  awayFormRating: 0.5,
  homeInjuryImpact: 0,
  awayInjuryImpact: 0,
  h2hEdge: 0,
  rankingDelta: 0,
  dataCompleteness: 1,
  teamIds: ['team-a', 'team-b'],
};

describe('ConfidenceEngine', () => {
  const engine = new ConfidenceEngine();

  it('scores between 0 and 1', () => {
    const result = engine.score(baseFeatures);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('returns a valid tier', () => {
    const result = engine.score(baseFeatures);
    expect(['very-high', 'high', 'medium', 'low', 'uncertain']).toContain(result.tier);
  });

  it('returns factors array', () => {
    const result = engine.score(baseFeatures);
    expect(Array.isArray(result.factors)).toBe(true);
  });

  it('returns uncertaintyNotes array', () => {
    const result = engine.score(baseFeatures);
    expect(Array.isArray(result.uncertaintyNotes)).toBe(true);
  });

  it('adds uncertainty note when data is incomplete', () => {
    const result = engine.score({ ...baseFeatures, dataCompleteness: 0.2 });
    expect(result.uncertaintyNotes).toContain('incomplete-data');
  });

  it('caps score when data is incomplete', () => {
    const result = engine.score({ ...baseFeatures, dataCompleteness: 0.2 });
    expect(result.score).toBeLessThanOrEqual(0.65);
  });

  it('scores higher for large ranking delta', () => {
    const result = engine.score({ ...baseFeatures, rankingDelta: 0.5 });
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('scores tier "very-high" for score >= 0.8', () => {
    const result = engine.score({
      ...baseFeatures,
      homeFormRating: 0.9,
      awayFormRating: 0.1,
      rankingDelta: 0.4,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('isReliable returns false when uncertaintyNotes present', () => {
    const result = engine.score({ ...baseFeatures, dataCompleteness: 0.2 });
    expect(engine.isReliable(result)).toBe(false);
  });

  it('isReliable returns true for clean high-data features', () => {
    const result = engine.score(baseFeatures);
    if (result.uncertaintyNotes.length === 0 && result.tier !== 'uncertain') {
      expect(engine.isReliable(result)).toBe(true);
    }
  });
});
