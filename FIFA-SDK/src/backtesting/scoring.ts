/** Scoring utilities for backtesting prediction accuracy. */
export class BacktestScoring {
  /** Brier score for a binary prediction (lower = better, 0 = perfect). */
  brierScore(predictedProbability: number, outcome: 0 | 1): number {
    return Math.pow(predictedProbability - outcome, 2);
  }

  /** Log loss for a binary prediction. */
  logLoss(predictedProbability: number, outcome: 0 | 1): number {
    const clipped = Math.min(Math.max(predictedProbability, 1e-15), 1 - 1e-15);
    return outcome === 1 ? -Math.log(clipped) : -Math.log(1 - clipped);
  }

  /** Expected calibration error across a set of predictions. */
  calibrationError(predictions: Array<{ probability: number; outcome: 0 | 1 }>): number {
    if (predictions.length === 0) return 0;
    const total = predictions.reduce((sum, p) => sum + Math.abs(p.probability - p.outcome), 0);
    return total / predictions.length;
  }

  /** Accuracy: fraction of predictions where round(probability) === outcome. */
  accuracy(predictions: Array<{ probability: number; outcome: 0 | 1 }>): number {
    if (predictions.length === 0) return 0;
    const correct = predictions.filter(p => (p.probability >= 0.5 ? 1 : 0) === p.outcome).length;
    return correct / predictions.length;
  }
}
