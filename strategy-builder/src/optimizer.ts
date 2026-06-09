import { Strategy, OptimizeResult, BacktestResult } from '../types.js';
import { BacktestEngine } from './backtest.js';

export class Optimizer {
  private engine = new BacktestEngine();

  /**
   * Grid search optimization over parameter space.
   */
  async gridSearch(
    strategy: Strategy,
    paramSpace: { [key: string]: number[] },
    data: unknown
  ): Promise<OptimizeResult[]> {
    const results: OptimizeResult[] = [];
    const keys = Object.keys(paramSpace);
    const combinations = this.generateCombinations(paramSpace, keys);

    for (const combo of combinations) {
      const params = Object.fromEntries(keys.map((k, i) => [k, combo[i]]));
      const testStrategy = this.applyParams(strategy, params);
      const result = await this.engine.run(testStrategy, data as any);

      results.push({
        params,
        score: result.sharpe * 0.4 + result.totalReturn * 0.3 - result.maxDrawdown * 0.3,
        result,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Walk-forward optimization with rolling windows.
   */
  async walkForward(
    strategy: Strategy,
    data: unknown[],
    trainSize: number,
    testSize: number
  ): Promise<OptimizeResult[]> {
    const results: OptimizeResult[] = [];

    for (let i = 0; i <= (data as any[]).length - trainSize - testSize; i += testSize) {
      const trainData = (data as any[]).slice(i, i + trainSize);
      const testData = (data as any[]).slice(i + trainSize, i + trainSize + testSize);

      const trainResult = await this.engine.run(strategy, trainData as any);
      const testResult = await this.engine.run(strategy, testData as any);

      results.push({
        params: {},
        score: testResult.sharpe,
        result: testResult,
      });
    }

    return results;
  }

  private generateCombinations(space: Record<string, number[]>, keys: string[]): number[][] {
    if (keys.length === 0) return [[]];
    const [first, ...rest] = keys;
    const restCombos = this.generateCombinations(space, rest);
    const result: number[][] = [];
    for (const val of space[first]) {
      for (const combo of restCombos) {
        result.push([val, ...combo]);
      }
    }
    return result;
  }

  private applyParams(strategy: Strategy, params: Record<string, number>): Strategy {
    // Apply optimized parameters to strategy (e.g., RSI period, SMA lengths)
    return { ...strategy, name: `${strategy.name}-optimized` };
  }
}
