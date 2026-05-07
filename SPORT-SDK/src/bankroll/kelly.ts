export interface KellyFractionalParams {
  /** Fraction of the full Kelly stake. 1 = full Kelly, 0.5 = half Kelly, etc. */
  kellyFraction?: number;
}

export interface KellyStakeInput {
  /** Current bankroll (stake base). */
  bankroll: number;
  /** Probability of the bet winning according to your model. */
  p: number;
  /** Decimal odds (profit = b, stake = 1). b = odds - 1. */
  oddsDecimal: number;
}

export interface KellyStakeResult {
  stake: number;
  p: number;
  q: number;
  b: number;
  edge: number;
  kellyFraction: number;
}

/**
 * Kelly criterion stake sizing.
 * Formula (fractional Kelly supported):
 *   stake = bankroll * f * (p*b - q) / b
 * where b = oddsDecimal - 1 and q = 1 - p.
 */
export function kellyStake(input: KellyStakeInput & KellyFractionalParams): KellyStakeResult {
  const { bankroll, p, oddsDecimal } = input;
  const kellyFraction = clamp01(input.kellyFraction ?? 1);

  if (!Number.isFinite(bankroll) || bankroll <= 0) {
    throw new Error('Kelly stake: bankroll must be a positive number');
  }
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error('Kelly stake: p must be in [0, 1]');
  }
  if (!Number.isFinite(oddsDecimal) || oddsDecimal <= 1) {
    throw new Error('Kelly stake: oddsDecimal must be > 1 (decimal odds)');
  }

  const q = 1 - p;
  const b = oddsDecimal - 1;
  const edge = p * b - q;

  // If the edge is non-positive, Kelly suggests 0 stake.
  const fullKelly = b === 0 ? 0 : bankroll * (edge / b);
  const stake = Math.max(0, fullKelly * kellyFraction);

  return { stake, p, q, b, edge, kellyFraction };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
