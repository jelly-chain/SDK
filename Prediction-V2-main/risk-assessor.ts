import type { RiskProfile, RiskLevel } from '../types.js';
import { clamp } from '../utils/math.js';
import { scoreToLevel } from '../models/risk-profile.js';

export class RiskAssessor {
  assess(input: {
    confidence: number;
    volatility?: number;
    sentimentMagnitude?: number;
    isSpike?: boolean;
  }): RiskProfile {
    const volComponent = clamp(input.volatility ?? 0.2, 0, 1) * 0.4;
    const confComponent = (1 - input.confidence) * 0.4;
    const spikeComponent = input.isSpike ? 0.2 : 0;
    const score = clamp(volComponent + confComponent + spikeComponent, 0, 1);
    const level = scoreToLevel(score);
    const factors: string[] = [];
    if (volComponent > 0.2) factors.push('high volatility');
    if (confComponent > 0.2) factors.push('low confidence');
    if (spikeComponent > 0) factors.push('volume spike');
    return { score, level, factors };
  }
}
