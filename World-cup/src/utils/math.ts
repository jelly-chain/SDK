/** Convert American odds to decimal odds. */
export function americanToDecimal(american: number): number {
  if (american > 0) return (american / 100) + 1;
  if (american < 0) return (100 / Math.abs(american)) + 1;
  return 1;
}

/** Convert decimal odds to American odds. */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  if (decimal > 1) return Math.round(-100 / (decimal - 1));
  return 0;
}

/** Calculate implied probability from American odds. */
export function impliedProbability(americanOdds: number): number {
  if (americanOdds > 0) return 100 / (americanOdds + 100);
  if (americanOdds < 0) return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  return 0;
}

/** Remove overround to get true probability. */
export function trueProbability(impliedProbs: number[]): number[] {
  const total = impliedProbs.reduce((s, p) => s + p, 0);
  if (total === 0) return impliedProbs;
  return impliedProbs.map(p => p / total);
}

/** Kelly Criterion: optimal stake fraction. */
export function kellyCriterion(probability: number, decimalOdds: number, fraction = 0.25): number {
  const b = decimalOdds - 1;
  const q = 1 - probability;
  const kelly = (b * probability - q) / b;
  return Math.max(0, kelly * fraction);
}

/** Calculate ROI from wins/losses. */
export function calculateROI(profit: number, totalStaked: number): number {
  return totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
}

/** Sharpe ratio for betting returns. */
export function sharpeRatio(returns: number[], riskFreeRate = 0): number {
  if (returns.length < 2) return 0;
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? (avg - riskFreeRate) / stdDev : 0;
}

/** Max drawdown from a series of cumulative returns. */
export function maxDrawdown(cumulative: number[]): number {
  let peak = cumulative[0];
  let maxDD = 0;
  for (const value of cumulative) {
    if (value > peak) peak = value;
    const dd = (peak - value) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

/** Weighted average. */
export function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;
}

/** Normalize a value to 0-1 range given min/max. */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimal places. */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Percentage change. */
export function pctChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

/** Poisson probability. */
export function poissonProb(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Expected goals model: simple Poisson from xG. */
export function expectedGoalsFromShots(shots: Array<{ xg: number }>): { homeGoals: number; awayGoals: number; homeProb: number; drawProb: number; awayProb: number } {
  const homeXG = shots.filter(s => s.xg > 0).reduce((s, shot) => s + (shot.xg || 0), 0);
  const awayXG = shots.filter(s => s.xg <= 0).reduce((s, shot) => s + (Math.abs(shot.xg) || 0), 0);
  const homeGoals = Math.round(homeXG * 10) / 10;
  const awayGoals = Math.round(awayXG * 10) / 10;
  let homeProb = 0, drawProb = 0, awayProb = 0;
  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const p = poissonProb(homeXG, h) * poissonProb(awayXG, a);
      if (h > a) homeProb += p;
      else if (h === a) drawProb += p;
      else awayProb += p;
    }
  }
  return { homeGoals, awayGoals, homeProb: round(homeProb, 4), drawProb: round(drawProb, 4), awayProb: round(awayProb, 4) };
}
