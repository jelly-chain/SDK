/** Safe math and scoring helpers. */

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function weightedAverage(pairs: Array<{ value: number; weight: number }>): number {
  const totalWeight = pairs.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return 0;
  return pairs.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
