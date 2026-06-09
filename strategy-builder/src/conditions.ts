import { Condition, ConditionOperator } from '../types.js';

export class ConditionEngine {
  /**
   * Evaluate a single condition against indicator data.
   */
  evaluate(condition: Condition, indicatorValue: number): boolean {
    const target = Number(condition.value);
    switch (condition.operator) {
      case '<': return indicatorValue < target;
      case '>': return indicatorValue > target;
      case '<=': return indicatorValue <= target;
      case '>=': return indicatorValue >= target;
      case '==': return indicatorValue === target;
      case '!=': return indicatorValue !== target;
      case 'crosses_above': return indicatorValue > target; // Simplified
      case 'crosses_below': return indicatorValue < target;
      default: return false;
    }
  }

  /**
   * Evaluate a set of conditions with AND/OR logic.
   */
  evaluateGroup(
    conditions: { op: 'and' | 'or'; items: Condition[] }[],
    indicators: Record<string, number>
  ): boolean {
    return conditions.every(group => {
      const results = group.items.map(c => this.evaluate(c, indicators[c.indicator] ?? 0));
      return group.op === 'and' ? results.every(Boolean) : results.some(Boolean);
    });
  }

  /**
   * Compute common indicators.
   */
  static computeSMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  static computeRSI(values: number[], period = 14): number {
    if (values.length < period + 1) return 50;
    const changes = values.slice(1).map((v, i) => v - values[i]);
    const recent = changes.slice(-period);
    const gains = recent.filter(c => c > 0);
    const losses = recent.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / period : 0;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  static computeEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    return ema;
  }
}
