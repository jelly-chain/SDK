/**
 * Funding Rate Arbitrage Detector
 * Perp vs spot divergence across exchanges.
 */

export interface FundingRate {
  exchange: string;
  token: string;
  rate: number; // % per 8h (or normalized)
  rateAnnualized: number;
  nextFundingTime: string;
  openInterest: number;
  timestamp: string;
}

export interface PerpSpotDivergence {
  exchange: string;
  token: string;
  perpPrice: number;
  spotPrice: number;
  basis: number; // (perp - spot) / spot
  basisAnnualized: number;
  fundingRate: number;
  direction: 'contango' | 'backwardation';
  signal: 'long-spot-short-perp' | 'long-perp-short-spot' | 'neutral';
  profitEstimate: number;
}

export interface FundingArbitrage {
  id: string;
  type: 'funding-arbitrage' | 'basis-trade' | 'cross-exchange';
  token: string;
  longExchange: string;
  shortExchange: string;
  longRate: number;
  shortRate: number;
  rateDifferential: number;
  estimatedProfit8h: number;
  estimatedProfitDaily: number;
  estimatedProfitAnnualized: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  requiredCapital: number;
}

export interface FundingSignal {
  token: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  avgFundingRate: number;
  maxFundingRate: number;
  exchangeRates: Array<{ exchange: string; rate: number }>;
  extremeFunding: boolean;
  details: string;
}

export class FundingRateArbitrage {
  private rates: Map<string, FundingRate[]> = new Map();
  private divergences: PerpSpotDivergence[] = [];
  private arbitrageOpportunities: FundingArbitrage[] = [];

  /** Record a funding rate */
  recordRate(rate: FundingRate): void {
    const key = `${rate.exchange}-${rate.token}`;
    const existing = this.rates.get(key) ?? [];
    existing.push(rate);
    this.rates.set(key, existing);
  }

  /** Record multiple rates */
  recordRates(rates: FundingRate[]): void {
    for (const rate of rates) this.recordRate(rate);
  }

  /** Get latest rate for an exchange/token */
  getRate(exchange: string, token: string): FundingRate | undefined {
    const key = `${exchange}-${token}`;
    const rates = this.rates.get(key);
    return rates?.[rates.length - 1];
  }

  /** Get all rates for a token across exchanges */
  getTokenRates(token: string): FundingRate[] {
    const result: FundingRate[] = [];
    for (const [key, rates] of this.rates) {
      if (key.endsWith(`-${token}`)) {
        const latest = rates[rates.length - 1];
        if (latest) result.push(latest);
      }
    }
    return result;
  }

  /** Detect funding rate arbitrage */
  detectArbitrage(token: string): FundingArbitrage[] {
    const rates = this.getTokenRates(token);
    if (rates.length < 2) return [];

    const opportunities: FundingArbitrage[] = [];

    for (let i = 0; i < rates.length; i++) {
      for (let j = i + 1; j < rates.length; j++) {
        const rate1 = rates[i];
        const rate2 = rates[j];

        // If one is positive and other is negative, arbitrage exists
        if (rate1.rate > 0.01 && rate2.rate < -0.01) {
          // Long on negative funding, short on positive funding
          const differential = rate1.rate - rate2.rate;
          const estimatedProfit8h = differential * 10000; // Per $10k capital

          opportunities.push({
            id: `arb-${token}-${rate1.exchange}-${rate2.exchange}`,
            type: 'funding-arbitrage',
            token,
            longExchange: rate2.exchange,
            shortExchange: rate1.exchange,
            longRate: rate2.rate,
            shortRate: rate1.rate,
            rateDifferential: differential,
            estimatedProfit8h: Math.round(estimatedProfit8h) / 100,
            estimatedProfitDaily: Math.round(estimatedProfit8h * 3) / 100,
            estimatedProfitAnnualized: Math.round(estimatedProfit8h * 3 * 365) / 100,
            riskLevel: Math.abs(differential) > 0.1 ? 'high' : Math.abs(differential) > 0.05 ? 'medium' : 'low',
            factors: [
              `Long ${token} on ${rate2.exchange} (funding: ${(rate2.rate * 100).toFixed(3)}%)`,
              `Short ${token} on ${rate1.exchange} (funding: ${(rate1.rate * 100).toFixed(3)}%)`,
              `Rate differential: ${(differential * 100).toFixed(3)}%`,
            ],
            requiredCapital: 10000,
          });
        }

        // Cross-exchange rate differential
        const rateDiff = Math.abs(rate1.rate - rate2.rate);
        if (rateDiff > 0.02) {
          opportunities.push({
            id: `cross-${token}-${rate1.exchange}-${rate2.exchange}`,
            type: 'cross-exchange',
            token,
            longExchange: rate1.rate < rate2.rate ? rate1.exchange : rate2.exchange,
            shortExchange: rate1.rate < rate2.rate ? rate2.exchange : rate1.exchange,
            longRate: Math.min(rate1.rate, rate2.rate),
            shortRate: Math.max(rate1.rate, rate2.rate),
            rateDifferential: rateDiff,
            estimatedProfit8h: Math.round(rateDiff * 10000) / 100,
            estimatedProfitDaily: Math.round(rateDiff * 30000) / 100,
            estimatedProfitAnnualized: Math.round(rateDiff * 30000 * 365) / 100,
            riskLevel: 'medium',
            factors: [`Cross-exchange rate differential: ${(rateDiff * 100).toFixed(3)}%`],
            requiredCapital: 10000,
          });
        }
      }
    }

    this.arbitrageOpportunities = opportunities;
    return opportunities;
  }

  /** Analyze perp-spot divergence */
  analyzeDivergence(
    exchange: string,
    token: string,
    perpPrice: number,
    spotPrice: number,
    fundingRate: number,
  ): PerpSpotDivergence {
    const basis = (perpPrice - spotPrice) / spotPrice;
    const basisAnnualized = basis * 365 * 3; // 3 funding periods per day
    const direction: PerpSpotDivergence['direction'] = basis > 0 ? 'contango' : 'backwardation';

    let signal: PerpSpotDivergence['signal'] = 'neutral';
    let profitEstimate = 0;

    if (basis > 0.02) {
      // Perp premium — short perp, long spot
      signal = 'long-spot-short-perp';
      profitEstimate = basis * 100;
    } else if (basis < -0.02) {
      // Perp discount — long perp, short spot
      signal = 'long-perp-short-spot';
      profitEstimate = Math.abs(basis) * 100;
    }

    const divergence: PerpSpotDivergence = {
      exchange,
      token,
      perpPrice,
      spotPrice,
      basis: Math.round(basis * 10000) / 10000,
      basisAnnualized: Math.round(basisAnnualized * 100) / 100,
      fundingRate,
      direction,
      signal,
      profitEstimate: Math.round(profitEstimate * 100) / 100,
    };

    this.divergences.push(divergence);
    return divergence;
  }

  /** Get funding signal for a token */
  getFundingSignal(token: string): FundingSignal {
    const rates = this.getTokenRates(token);
    if (rates.length === 0) {
      return { token, signal: 'neutral', avgFundingRate: 0, maxFundingRate: 0, exchangeRates: [], extremeFunding: false, details: 'No funding data' };
    }

    const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
    const maxRate = Math.max(...rates.map((r) => Math.abs(r.rate)));
    const extremeFunding = maxRate > 0.1; // 10% annualized is extreme

    let signal: FundingSignal['signal'] = 'neutral';
    let details = '';

    if (avgRate > 0.05) {
      signal = 'bearish'; // High positive funding = crowded longs
      details = `Average funding ${(avgRate * 100).toFixed(3)}% — crowded longs, expect pullback`;
    } else if (avgRate < -0.05) {
      signal = 'bullish'; // Negative funding = crowded shorts
      details = `Average funding ${(avgRate * 100).toFixed(3)}% — crowded shorts, expect squeeze`;
    } else {
      details = `Neutral funding at ${(avgRate * 100).toFixed(3)}%`;
    }

    return {
      token,
      signal,
      avgFundingRate: avgRate,
      maxFundingRate: maxRate,
      exchangeRates: rates.map((r) => ({ exchange: r.exchange, rate: r.rate })),
      extremeFunding,
      details,
    };
  }

  /** Get all arbitrage opportunities */
  getOpportunities(): FundingArbitrage[] {
    return [...this.arbitrageOpportunities];
  }
}
