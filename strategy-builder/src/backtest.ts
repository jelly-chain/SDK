import { Strategy, BacktestResult, Rule, ConditionEngine } from '../types.js';

interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class BacktestEngine {
  private conditionEngine = new ConditionEngine();

  /**
   * Run a backtest of a strategy against historical price data.
   */
  async run(strategy: Strategy, data: PriceBar[]): Promise<BacktestResult> {
    const trades: { entry: number; exit: number; pnl: number; type: string }[] = [];
    let capital = 100000; // Starting capital
    let position = 0;
    let entryPrice = 0;
    const equityCurve: { date: string; value: number }[] = [];

    for (let i = 20; i < data.length; i++) {
      const bar = data[i];
      const indicators = this.computeIndicators(data.slice(0, i));

      // Evaluate rules in priority order
      const sortedRules = [...strategy.rules].sort((a, b) => b.priority - a.priority);
      for (const rule of sortedRules) {
        const triggered = this.conditionEngine.evaluateGroup(
          rule.conditions as any,
          indicators
        );

        if (triggered) {
          if (rule.action.type === 'buy' && position === 0) {
            position = (capital * (strategy.riskPerTrade / 100)) / bar.close;
            entryPrice = bar.close;
            capital -= position * bar.close;
            trades.push({ entry: bar.close, exit: 0, pnl: 0, type: 'long' });
          } else if (rule.action.type === 'sell' && position > 0) {
            const pnl = (bar.close - entryPrice) * position;
            capital += position * bar.close;
            if (trades.length > 0 && trades[trades.length - 1].exit === 0) {
              trades[trades.length - 1].exit = bar.close;
              trades[trades.length - 1].pnl = pnl;
            }
            position = 0;
          }
          break; // Only execute first matching rule
        }
      }

      const portfolioValue = capital + position * bar.close;
      equityCurve.push({ date: bar.date, value: portfolioValue });
    }

    return this.computeMetrics(trades, equityCurve, capital, strategy.name);
  }

  private computeIndicators(data: PriceBar[]): Record<string, number> {
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    return {
      sma20: ConditionEngine.computeSMA(closes, 20),
      sma50: ConditionEngine.computeSMA(closes, 50),
      rsi: ConditionEngine.computeRSI(closes),
      ema12: ConditionEngine.computeEMA(closes, 12),
      ema26: ConditionEngine.computeEMA(closes, 26),
      volume: volumes[volumes.length - 1] || 0,
      close: closes[closes.length - 1] || 0,
    };
  }

  private computeMetrics(
    trades: { pnl: number }[],
    equityCurve: { value: number }[],
    finalCapital: number,
    strategyName: string
  ): BacktestResult {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

    // Max drawdown
    let peak = 0;
    let maxDD = 0;
    for (const pt of equityCurve) {
      if (pt.value > peak) peak = pt.value;
      const dd = (peak - pt.value) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      returns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length) || 1;

    return {
      strategy: strategyName,
      from: 'unknown',
      to: 'unknown',
      totalReturn: ((finalCapital - 100000) / 100000) * 100,
      sharpe: (avgReturn / stdDev) * Math.sqrt(252),
      sortino: avgReturn / stdDev * Math.sqrt(252), // Simplified
      maxDrawdown: maxDD * 100,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      trades: trades.length,
      profitFactor: losses.length > 0
        ? Math.abs(wins.reduce((s, w) => s + w.pnl, 0) / losses.reduce((s, l) => s + l.pnl, 0))
        : 0,
      avgWin: wins.length > 0 ? wins.reduce((s, w) => s + w.pnl, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((s, l) => s + l.pnl, 0) / losses.length : 0,
      equityCurve: equityCurve.map(e => ({ date: e.date, value: e.value })),
    };
  }
}
