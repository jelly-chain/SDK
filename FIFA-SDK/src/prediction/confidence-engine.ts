import type { PredictionFeatures } from './feature-builder.js';

export interface ConfidenceResult {
  score: number;
  tier: 'very-high' | 'high' | 'medium' | 'low' | 'uncertain';
  contributingFactors: string[];
  uncertaintyNotes: string[];
}

/** Computes a calibrated confidence score from prediction features. */
export class ConfidenceEngine {
  /** Score confidence (0-1) from a feature set. */
  score(features: PredictionFeatures): ConfidenceResult {
    let score = 0.5;
    const contributingFactors: string[] = [];
    const uncertaintyNotes: string[] = [];

    const { homeFormRating, awayFormRating, homeRanking, awayRanking } = features.features;

    if (homeFormRating !== undefined && awayFormRating !== undefined) {
      const formDiff = Math.abs(homeFormRating - awayFormRating);
      score += formDiff * 0.2;
      if (formDiff > 0.2) contributingFactors.push('clear-form-differential');
    } else {
      uncertaintyNotes.push('form-data-unavailable');
    }

    if (homeRanking !== undefined && awayRanking !== undefined) {
      const rankDiff = Math.abs(homeRanking - awayRanking);
      score += Math.min(rankDiff / 100, 0.2);
      if (rankDiff > 20) contributingFactors.push('significant-ranking-gap');
    } else {
      uncertaintyNotes.push('ranking-data-unavailable');
    }

    score = Math.min(0.95, Math.max(0.05, score));

    const tier =
      score >= 0.8
        ? 'very-high'
        : score >= 0.65
          ? 'high'
          : score >= 0.5
            ? 'medium'
            : score >= 0.35
              ? 'low'
              : 'uncertain';

    return { score, tier, contributingFactors, uncertaintyNotes };
  }
}
