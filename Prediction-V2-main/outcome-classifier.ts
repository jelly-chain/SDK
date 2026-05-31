import type { SignalDirection } from '../types.js';

export interface ClassificationResult {
  direction: SignalDirection;
  probability: number;
  label: string;
}

export class OutcomeClassifier {
  classify(bullishScore: number, bearishScore: number): ClassificationResult {
    const total = bullishScore + bearishScore + 0.0001;
    const bullProb = bullishScore / total;
    const bearProb = bearishScore / total;
    if (bullProb > 0.6) return { direction: 'bullish', probability: bullProb, label: 'Strong bullish signal' };
    if (bearProb > 0.6) return { direction: 'bearish', probability: bearProb, label: 'Strong bearish signal' };
    if (bullProb > 0.5) return { direction: 'bullish', probability: bullProb, label: 'Weak bullish signal' };
    if (bearProb > 0.5) return { direction: 'bearish', probability: bearProb, label: 'Weak bearish signal' };
    return { direction: 'neutral', probability: 0.5, label: 'No clear directional signal' };
  }

  classifyFromScore(score: number): ClassificationResult {
    return this.classify(score, 1 - score);
  }
}
