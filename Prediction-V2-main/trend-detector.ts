export type TrendType = 'uptrend' | 'downtrend' | 'sideways' | 'reversal';

export interface TrendAnalysis {
  type: TrendType;
  strength: number;
  duration: number;
  confidence: number;
}

export class TrendDetector {
  detect(prices: number[]): TrendAnalysis {
    if (prices.length < 3) return { type: 'sideways', strength: 0, duration: 0, confidence: 0.3 };
    const ups = prices.slice(1).filter((p, i) => p > (prices[i] ?? p)).length;
    const downs = prices.length - 1 - ups;
    const ratio = ups / (prices.length - 1);
    let type: TrendType = 'sideways';
    if (ratio > 0.65) type = 'uptrend';
    else if (ratio < 0.35) type = 'downtrend';
    const strength = Math.abs(ratio - 0.5) * 2;
    const confidence = 0.4 + strength * 0.4;
    return { type, strength, duration: prices.length, confidence };
  }
}
