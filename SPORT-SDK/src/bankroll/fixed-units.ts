export interface FixedUnitStakeInput {
  bankroll: number;
  /** Size of 1 unit as a fraction of bankroll (e.g. 0.01 = 1% bankroll). */
  unitSizeFraction: number;
  /** Number of units for this bet. */
  units: number;
}

export interface FixedUnitStakeResult {
  stake: number;
  unitSizeFraction: number;
  units: number;
  /** Suggested updated bankroll after settlement. */
  updatedBankroll?: number;
}

export interface SettleFixedUnitInput {
  bankroll: number;
  stake: number;
  /** Decimal odds. If win: profit = stake * (oddsDecimal - 1). If lose: lose stake. */
  oddsDecimal: number;
  outcome: 'win' | 'loss';
}

/** Fixed-unit staking: stake = bankroll * unitSizeFraction * units. */
export function fixedUnitStake(input: FixedUnitStakeInput): FixedUnitStakeResult {
  const { bankroll, unitSizeFraction, units } = input;

  if (!Number.isFinite(bankroll) || bankroll <= 0) {
    throw new Error('Fixed unit: bankroll must be positive');
  }
  if (!Number.isFinite(unitSizeFraction) || unitSizeFraction <= 0) {
    throw new Error('Fixed unit: unitSizeFraction must be > 0');
  }
  if (!Number.isFinite(units) || units < 0) {
    throw new Error('Fixed unit: units must be >= 0');
  }

  const stake = bankroll * unitSizeFraction * units;
  return { stake, unitSizeFraction, units };
}

/** Settle a fixed-unit bet and return updated bankroll. */
export function settleFixedUnit(input: SettleFixedUnitInput): number {
  const { bankroll, stake, oddsDecimal, outcome } = input;
  if (stake < 0) throw new Error('Fixed unit: stake must be >= 0');
  if (!Number.isFinite(oddsDecimal) || oddsDecimal <= 1) {
    throw new Error('Fixed unit: oddsDecimal must be > 1');
  }

  if (outcome === 'win') {
    const profit = stake * (oddsDecimal - 1);
    return bankroll + profit;
  }

  // loss
  return bankroll - stake;
}
