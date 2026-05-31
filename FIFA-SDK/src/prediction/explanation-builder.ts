import type { PredictionFeatures } from './feature-builder.js';
import type { ConfidenceResult } from './confidence-engine.js';

export interface PredictionExplanation {
  summary: string;
  keyFactors: string[];
  counterFactors: string[];
  dataQualityNote: string;
  modelDisclaimer: string;
}

/** Builds human-readable explanations for prediction outputs. */
export class ExplanationBuilder {
  /** Build an explanation for a prediction from features and confidence. */
  build(
    features: PredictionFeatures,
    confidence: ConfidenceResult,
    favored?: string,
  ): PredictionExplanation {
    const keyFactors: string[] = [...confidence.contributingFactors];
    const counterFactors: string[] = [];

    const { homeFormRating, awayFormRating } = features.features;
    if (homeFormRating !== undefined && awayFormRating !== undefined) {
      if (homeFormRating > awayFormRating) {
        keyFactors.push(`Home team in better recent form (${(homeFormRating * 100).toFixed(0)}% vs ${(awayFormRating * 100).toFixed(0)}%)`);
      } else if (awayFormRating > homeFormRating) {
        keyFactors.push(`Away team in better recent form`);
        counterFactors.push('Home advantage may offset form gap');
      }
    }

    const summary = favored
      ? `${favored} is the model-preferred outcome with ${(confidence.score * 100).toFixed(0)}% confidence (${confidence.tier}).`
      : `Prediction generated with ${confidence.tier} confidence.`;

    const dataQualityNote =
      confidence.uncertaintyNotes.length > 0
        ? `Data gaps noted: ${confidence.uncertaintyNotes.join(', ')}`
        : 'All expected data sources available';

    return {
      summary,
      keyFactors,
      counterFactors,
      dataQualityNote,
      modelDisclaimer:
        'This prediction is model-generated and should not be treated as financial advice. Outcomes are probabilistic estimates.',
    };
  }
}
