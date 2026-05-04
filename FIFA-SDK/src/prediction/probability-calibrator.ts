/** Applies calibration corrections to raw probability estimates. */
export class ProbabilityCalibrator {
  /**
   * Platt scaling calibration: maps a raw score to a calibrated probability.
   * Uses a simple sigmoid transform to prevent overconfidence.
   */
  calibrate(rawScore: number, alpha = 1.0, beta = 0.0): number {
    const logit = alpha * rawScore + beta;
    return 1 / (1 + Math.exp(-logit));
  }

  /** Apply historical bias correction for a given market type. */
  applyBiasCorrection(probability: number, marketType: string): number {
    const biasMap: Record<string, number> = {
      TOURNAMENT_WINNER: -0.03,
      GROUP_WINNER: -0.02,
      MATCH_WINNER: 0,
      QUALIFICATION: 0.01,
    };
    const correction = biasMap[marketType] ?? 0;
    return Math.min(0.99, Math.max(0.01, probability + correction));
  }

  /** Normalize a set of probabilities so they sum to 1. */
  normalize(probabilities: number[]): number[] {
    const sum = probabilities.reduce((a, b) => a + b, 0);
    if (sum === 0) return probabilities.map(() => 1 / probabilities.length);
    return probabilities.map(p => p / sum);
  }
}
