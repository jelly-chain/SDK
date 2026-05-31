/**
 * Parlay/Accumulator Calculator
 * Multi-leg bet math with correlation adjustments.
 */

export interface ParlayLeg {
  id: string;
  description: string;
  odds: number; // Decimal odds
  probability: number; // Model-estimated probability
  correlation?: number; // -1 to 1, how correlated with other legs
}

export interface ParlayBet {
  legs: ParlayLeg[];
  stake: number;
}

export interface ParlayResult {
  combinedOdds: number;
  combinedProbability: number;
  impliedProbability: number;
  edge: number;
  expectedValue: number;
  potentialPayout: number;
  potentialProfit: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  recommendation: 'bet' | 'pass' | 'reduce-legs';
  warnings: string[];
  correlationAdjustedProbability: number;
}

export interface ParlayConfig {
  maxLegs: number;
  minEdge: number;
  maxRisk: number;
  correlationPenalty: number; // How much to penalize correlated legs
}

export class ParlayCalculator {
  private config: ParlayConfig;

  constructor(config: Partial<ParlayConfig> = {}) {
    this.config = {
      maxLegs: config.maxLegs ?? 8,
      minEdge: config.minEdge ?? 0.05,
      maxRisk: config.maxRisk ?? 0.8,
      correlationPenalty: config.correlationPenalty ?? 0.1,
    };
  }

  /** Calculate parlay result */
  calculate(bet: ParlayBet): ParlayResult {
    const { legs, stake } = bet;
    const warnings: string[] = [];

    // Combined odds (product of all decimal odds)
    const combinedOdds = legs.reduce((product, leg) => product * leg.odds, 1);

    // Combined probability (product of all probabilities, adjusted for correlation)
    let combinedProbability = legs.reduce((product, leg) => product * leg.probability, 1);

    // Implied probability from odds
    const impliedProbability = 1 / combinedOdds;

    // Correlation adjustment
    let correlationPenalty = 0;
    for (let i = 0; i < legs.length; i++) {
      for (let j = i + 1; j < legs.length; j++) {
        const correlation = this.getCorrelation(legs[i], legs[j]);
        if (correlation > 0.3) {
          correlationPenalty += correlation * this.config.correlationPenalty;
          warnings.push(`Correlated legs: ${legs[i].description} & ${legs[j].description}`);
        }
      }
    }
    const correlationAdjustedProbability = Math.max(0.01, combinedProbability - correlationPenalty);

    // Edge
    const edge = correlationAdjustedProbability - impliedProbability;

    // Expected value
    const expectedValue = edge * stake;

    // Potential payout/profit
    const potentialPayout = stake * combinedOdds;
    const potentialProfit = potentialPayout - stake;

    // Risk level
    const riskLevel: ParlayResult['riskLevel'] =
      legs.length <= 2 ? 'low' :
      legs.length <= 4 ? 'medium' :
      legs.length <= 6 ? 'high' : 'extreme';

    // Recommendation
    let recommendation: ParlayResult['recommendation'] = 'pass';
    if (edge > this.config.minEdge && legs.length <= this.config.maxLegs) {
      recommendation = 'bet';
    } else if (legs.length > this.config.maxLegs) {
      recommendation = 'reduce-legs';
      warnings.push(`Too many legs (${legs.length}). Consider reducing to ${this.config.maxLegs}.`);
    }

    if (correlationPenalty > 0.1) {
      warnings.push('High correlation between legs reduces true probability');
    }

    if (riskLevel === 'extreme') {
      warnings.push('Extreme risk — 6+ leg parlays rarely hit');
    }

    return {
      combinedOdds: Math.round(combinedOdds * 100) / 100,
      combinedProbability: Math.round(combinedProbability * 1000) / 1000,
      impliedProbability: Math.round(impliedProbability * 1000) / 1000,
      edge: Math.round(edge * 1000) / 1000,
      expectedValue: Math.round(expectedValue * 100) / 100,
      potentialPayout: Math.round(potentialPayout * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
      riskLevel,
      recommendation,
      warnings,
      correlationAdjustedProbability: Math.round(correlationAdjustedProbability * 1000) / 1000,
    };
  }

  /** Estimate correlation between two legs */
  private getCorrelation(leg1: ParlayLeg, leg2: ParlayLeg): number {
    // If explicitly set, use that
    if (leg1.correlation !== undefined) return leg1.correlation;
    if (leg2.correlation !== undefined) return leg2.correlation;

    // Simple heuristic: same game = higher correlation
    if (leg1.id.includes(leg2.id.split('-')[0]) || leg2.id.includes(leg1.id.split('-')[0])) {
      return 0.3; // Moderate correlation for same-game parlays
    }

    return 0; // Default: independent
  }

  /** Calculate optimal stake using Kelly for parlays */
  kellyParlayStake(params: {
    bankroll: number;
    probability: number;
    odds: number;
    fraction?: number;
  }): number {
    const { bankroll, probability, odds, fraction = 0.25 } = params;
    const b = odds - 1;
    const q = 1 - probability;
    const kelly = (probability * b - q) / b;
    return Math.max(0, bankroll * kelly * fraction);
  }

  /** Generate common parlay structures */
  suggestStructures(legs: ParlayLeg[]): {
    conservative: ParlayLeg[];
    moderate: ParlayLeg[];
    aggressive: ParlayLeg[];
  } {
    const sorted = [...legs].sort((a, b) => b.probability - a.probability);

    return {
      conservative: sorted.slice(0, 2),
      moderate: sorted.slice(0, 4),
      aggressive: sorted.slice(0, 6),
    };
  }

  /** Calculate round-robin parlay combinations */
  roundRobin(legs: ParlayLeg[], parlaySize: number): ParlayBet[] {
    const combinations = this.getCombinations(legs, parlaySize);
    return combinations.map((combo) => ({
      legs: combo,
      stake: 0, // User sets stake per combination
    }));
  }

  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 0) return [[]];
    if (arr.length < size) return [];

    const result: T[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const rest = this.getCombinations(arr.slice(i + 1), size - 1);
      for (const combo of rest) {
        result.push([arr[i], ...combo]);
      }
    }
    return result;
  }
}
