import { clamp, weightedAverage } from '../utils/math.js';

export interface ConfidenceComponents {
  dataQuality: number;
  signalAgreement: number;
  sentimentStrength: number;
  volatilityPenalty: number;
  sourceCount: number;
}

export class ConfidenceEngine {
  compute(components: ConfidenceComponents): number {
    const sourceBoost = Math.min(0.15, (components.sourceCount - 1) * 0.05);
    const base = weightedAverage(
      [components.dataQuality, components.signalAgreement, components.sentimentStrength],
      [0.3, 0.4, 0.3],
    );
    return clamp(base + sourceBoost - components.volatilityPenalty * 0.2, 0, 1);
  }

  breakdown(components: ConfidenceComponents): Record<string, number> {
    return {
      base: this.compute({ ...components, volatilityPenalty: 0 }),
      volatilityDeduction: -components.volatilityPenalty * 0.2,
      sourceBoost: Math.min(0.15, (components.sourceCount - 1) * 0.05),
      final: this.compute(components),
    };
  }
}
