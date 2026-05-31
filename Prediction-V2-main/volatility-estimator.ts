import { stdDev } from '../utils/math.js';

export interface VolatilityEstimate {
  realized: number;
  annualized: number;
  regime: 'low' | 'medium' | 'high' | 'extreme';
}

export class VolatilityEstimator {
  estimate(prices: number[], periodsPerYear = 365): VolatilityEstimate {
    if (prices.length < 2) return { realized: 0, annualized: 0, regime: 'low' };
    const returns = prices.slice(1).map((p, i) => Math.log(p / (prices[i] ?? p)));
    const realized = stdDev(returns);
    const annualized = realized * Math.sqrt(periodsPerYear);
    const regime = annualized > 1.5 ? 'extreme' : annualized > 0.8 ? 'high' : annualized > 0.3 ? 'medium' : 'low';
    return { realized, annualized, regime };
  }
}
