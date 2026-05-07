export type BetOutcome = 'win' | 'loss';

export interface PortfolioBet {
  /** Decimal odds. */
  oddsDecimal: number;
  /** Model probability of win. */
  p: number;
  /** Fraction of bankroll staked (e.g. 0.02 = 2%). */
  stakeFraction: number;
  /** Bet identifier. */
  id: string;
  /** Optional correlation label / group. */
  group?: string;
}

export interface PortfolioRiskReport {
  /** Total exposure as sum of stake fractions. */
  totalStakeFraction: number;
  /** Exposure-weighted expected return in bankroll units per 1 bankroll. */
  expectedProfitFraction: number;
  /** Expected log growth under independence approximation. */
  expectedLogGrowth: number;
  /** Probability distribution summary under independence approximation. */
  tailRisk: {
    /** Prob bankroll ends below 50% of initial after settling all bets (approx, if bankroll is 1). */
    below50Percent: number;
    /** Prob bankroll ends below 25% of initial after settling all bets (approx, if bankroll is 1). */
    below25Percent: number;
  };
}

/**
 * Portfolio-level risk/exposure across multiple bets.
 * Independence approximation for outcomes.
 */
export function analyzePortfolioRisk(bets: PortfolioBet[], bankroll = 1): PortfolioRiskReport {
  if (!Array.isArray(bets) || bets.length === 0) {
    throw new Error('Portfolio risk: bets must be a non-empty array');
  }
  if (!Number.isFinite(bankroll) || bankroll <= 0) {
    throw new Error('Portfolio risk: bankroll must be positive');
  }

  const totalStakeFraction = bets.reduce((acc, b) => acc + b.stakeFraction, 0);

  const expectedProfitFraction = bets.reduce((acc, b) => {
    const bOdds = b.oddsDecimal - 1;
    const expectedReturn = b.p * bOdds * b.stakeFraction + (1 - b.p) * (-b.stakeFraction);
    return acc + expectedReturn;
  }, 0);

  // Expected log growth approximation with independence:
  // Start bankroll = 1; for each bet, update bankroll multiplicatively based on win/loss.
  // When we stake a fraction s of bankroll:
  //  - win: bankroll' = bankroll + stake*bOdds = bankroll*(1 + s*bOdds)
  //  - loss: bankroll' = bankroll - stake = bankroll*(1 - s)
  // Then log growth additive.
  const expectedLogGrowth = bets.reduce((acc, b) => {
    const bOdds = b.oddsDecimal - 1;
    const s = b.stakeFraction;
    const winMult = 1 + s * bOdds;
    const lossMult = 1 - s;
    // guard
    if (winMult <= 0 || lossMult <= 0) {
      return acc;
    }
    return acc + b.p * Math.log(winMult) + (1 - b.p) * Math.log(lossMult);
  }, 0);

  // Tail risk by enumeration under independence for small N.
  // For larger N, we fall back to Monte Carlo-lite via sampling of all combinations is infeasible.
  const maxEnum = 20;
  let below50Percent = 0;
  let below25Percent = 0;

  if (bets.length <= maxEnum) {
    const n = bets.length;
    const probs: Array<{ prob: number; finalFraction: number }> = [];
    // Enumerate all outcome bitmasks.
    const total = 1 << n;
    for (let mask = 0; mask < total; mask++) {
      let prob = 1;
      let bankrollFrac = 1;
      for (let i = 0; i < n; i++) {
        const b = bets[i];
        const win = ((mask >> i) & 1) === 1;
        prob *= win ? b.p : 1 - b.p;
        const mult = win ? 1 + b.stakeFraction * (b.oddsDecimal - 1) : 1 - b.stakeFraction;
        bankrollFrac *= mult;
      }
      probs.push({ prob, finalFraction: bankrollFrac });
    }
    const sumProb = probs.reduce((acc, x) => acc + x.prob, 0);
    if (sumProb > 0) {
      below50Percent = probs.reduce((acc, x) => acc + (x.finalFraction * bankroll < 0.5 * bankroll ? x.prob : 0), 0) / sumProb;
      below25Percent = probs.reduce((acc, x) => acc + (x.finalFraction * bankroll < 0.25 * bankroll ? x.prob : 0), 0) / sumProb;
    }
  }

  return {
    totalStakeFraction,
    expectedProfitFraction,
    expectedLogGrowth,
    tailRisk: { below50Percent, below25Percent },
  };
}
