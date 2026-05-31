import type { SignalDirection } from '../types.js';
import { weightedAverage } from '../utils/math.js';

export interface EnsembleInput {
  direction: SignalDirection;
  confidence: number;
  weight?: number;
  strategy?: string;
}

export interface EnsembleOutput {
  direction: SignalDirection;
  confidence: number;
  agreementScore: number;
  strategyWeights: Record<string, number>;
}

export class EnsembleModel {
  combine(inputs: EnsembleInput[]): EnsembleOutput {
    if (inputs.length === 0) return { direction: 'neutral', confidence: 0.3, agreementScore: 0, strategyWeights: {} };
    const weights = inputs.map((i) => i.weight ?? 1);
    const bullishWeight = inputs.filter((i) => i.direction === 'bullish').reduce((s, i, idx) => s + (weights[idx] ?? 1), 0);
    const bearishWeight = inputs.filter((i) => i.direction === 'bearish').reduce((s, i, idx) => s + (weights[idx] ?? 1), 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const direction: SignalDirection = bullishWeight > bearishWeight ? 'bullish' : bearishWeight > bullishWeight ? 'bearish' : 'neutral';
    const confidence = weightedAverage(inputs.map((i) => i.confidence), weights);
    const agreementScore = Math.max(bullishWeight, bearishWeight) / totalWeight;
    const strategyWeights: Record<string, number> = {};
    for (const input of inputs) {
      if (input.strategy) strategyWeights[input.strategy] = (strategyWeights[input.strategy] ?? 0) + (input.weight ?? 1);
    }
    return { direction, confidence, agreementScore, strategyWeights };
  }
}
