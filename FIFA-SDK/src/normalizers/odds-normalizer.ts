export interface NormalizedOdds {
  outcomeId: string;
  label: string;
  probability: number;
  impliedProbability: number;
  decimalOdds: number;
  source: string;
  fetchedAt: string;
}

/** Normalizes market odds from various formats (decimal, fractional, American) to probability. */
export class OddsNormalizer {
  fromDecimal(decimal: number, label: string, source: string): NormalizedOdds {
    const implied = 1 / decimal;
    return {
      outcomeId: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      probability: implied,
      impliedProbability: implied,
      decimalOdds: decimal,
      source,
      fetchedAt: new Date().toISOString(),
    };
  }

  fromAmerican(american: number, label: string, source: string): NormalizedOdds {
    const decimal = american > 0 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
    return this.fromDecimal(decimal, label, source);
  }

  fromFractional(numerator: number, denominator: number, label: string, source: string): NormalizedOdds {
    const decimal = numerator / denominator + 1;
    return this.fromDecimal(decimal, label, source);
  }

  /** Remove overround bias from a set of odds so probabilities sum to 1. */
  removeOverround(odds: NormalizedOdds[]): NormalizedOdds[] {
    const total = odds.reduce((s, o) => s + o.impliedProbability, 0);
    return odds.map(o => ({ ...o, probability: o.impliedProbability / total }));
  }
}
