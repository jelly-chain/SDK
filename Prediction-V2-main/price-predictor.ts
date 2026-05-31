import type { SignalDirection } from '../types.js';
import { clamp } from '../utils/math.js';

export interface PricePrediction {
  direction: SignalDirection;
  confidence: number;
  targetChange?: number;
  timeframe?: string;
}

export class PricePredictor {
  predict(currentPrice: number, historicalPrices: number[], sentimentScore: number): PricePrediction {
    if (historicalPrices.length < 2) {
      return { direction: 'neutral', confidence: 0.3 };
    }
    const recentAvg = historicalPrices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, historicalPrices.length);
    const trend = (currentPrice - recentAvg) / Math.max(1, recentAvg);
    const combined = trend * 0.6 + (sentimentScore - 0.5) * 0.4;
    const direction: SignalDirection = combined > 0.02 ? 'bullish' : combined < -0.02 ? 'bearish' : 'neutral';
    const confidence = clamp(0.5 + Math.abs(combined) * 3, 0.3, 0.9);
    return { direction, confidence, targetChange: combined };
  }
}
