export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'accumulation' | 'distribution';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number;
  duration: number;
  signals: string[];
}

export class MarketRegimeDetector {
  detect(prices: number[], volumes: number[], sentimentScore: number): RegimeAnalysis {
    if (prices.length < 10) return { regime: 'sideways', confidence: 0.3, duration: 0, signals: [] };
    const priceChange = (prices.at(-1)! - prices[0]!) / prices[0]!;
    const signals: string[] = [];
    let regime: MarketRegime = 'sideways';
    if (priceChange > 0.2 && sentimentScore > 0.6) { regime = 'bull'; signals.push('price rally', 'positive sentiment'); }
    else if (priceChange < -0.2 && sentimentScore < 0.4) { regime = 'bear'; signals.push('price decline', 'negative sentiment'); }
    else if (priceChange < -0.1 && volumes.at(-1)! < (volumes.reduce((a, b) => a + b, 0) / volumes.length)) { regime = 'distribution'; }
    else if (priceChange > -0.05 && priceChange < 0.05) { regime = 'accumulation'; }
    const confidence = 0.5 + Math.min(0.4, Math.abs(priceChange));
    return { regime, confidence, duration: prices.length, signals };
  }
}
