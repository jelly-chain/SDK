import type { ArbitrageOpportunity } from './types.js';

export interface ExternalPrice {
  platform: string;
  market: string;
  price: number;
  liquidity?: number;
}

export class ArbitrageDetector {
  /** Detect arbitrage between Polymarket and external platform */
  detect(polymarketPrice: number, external: ExternalPrice, market: string): ArbitrageOpportunity | null {
    const priceDiff = Math.abs(polymarketPrice - external.price);
    const avgPrice = (polymarketPrice + external.price) / 2;
    const profitPercent = (priceDiff / avgPrice) * 100;

    // Need at least 2% edge after fees
    if (profitPercent < 2) return null;

    const buyLow = polymarketPrice < external.price
      ? { name: 'Polymarket', price: polymarketPrice }
      : { name: external.platform, price: external.price };
    const sellHigh = polymarketPrice < external.price
      ? { name: external.platform, price: external.price }
      : { name: 'Polymarket', price: polymarketPrice };

    return {
      market,
      platform1: buyLow,
      platform2: sellHigh,
      profit: Math.round(priceDiff * 10000) / 10000,
      profitPercent: Math.round(profitPercent * 100) / 100,
      direction: `Buy on ${buyLow.name}, sell on ${sellHigh.name}`,
      confidence: Math.min(0.9, profitPercent / 10),
    };
  }

  /** Detect multi-leg arbitrage (market must sum to ~1) */
  detectMultiLeg(outcomes: Array<{ name: string; price: number }>): {
    hasArbitrage: boolean;
    totalCost: number;
    profit: number;
    legs: string[];
  } {
    const totalCost = outcomes.reduce((sum, o) => sum + o.price, 0);
    const hasArbitrage = totalCost < 0.98; // Buy all outcomes for less than $1

    return {
      hasArbitrage,
      totalCost: Math.round(totalCost * 10000) / 10000,
      profit: hasArbitrage ? Math.round((1 - totalCost) * 10000) / 10000 : 0,
      legs: outcomes.map((o) => `Buy ${o.name} at ${o.price}`),
    };
  }

  /** Scan multiple markets for arbitrage */
  scan(markets: Array<{ market: string; polymarketPrice: number; externalPrices: ExternalPrice[] }>): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const m of markets) {
      for (const ext of m.externalPrices) {
        const opp = this.detect(m.polymarketPrice, ext, m.market);
        if (opp) opportunities.push(opp);
      }
    }

    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
  }
}
