import { Strategy, Rule, Action, BacktestResult, OptimizeResult } from './types.js';
import { ConditionEngine } from './conditions.js';
import { ActionEngine } from './actions.js';
import { BacktestEngine } from './backtest.js';
import { Optimizer } from './optimizer.js';

export class StrategyBuilder {
  private rules: Rule[] = [];
  private currentConditions: { op: 'and' | 'or'; items: any[] }[] = [];
  private _name = 'custom';
  private _timeframe = '1h';
  private _riskPerTrade = 2;
  private _maxPositions = 5;
  private ruleCounter = 0;

  private conditions = new ConditionEngine();
  private actions = new ActionEngine();
  private backtest = new BacktestEngine();
  private optimizer = new Optimizer();

  when(indicator: string, operator: any, value: number | string): this {
    this.currentConditions = [{ op: 'and', items: [{ indicator, operator, value }] }];
    return this;
  }

  and(indicator: string, operator: any, value: number | string): this {
    const lastGroup = this.currentConditions[this.currentConditions.length - 1];
    if (lastGroup) {
      lastGroup.items.push({ indicator, operator, value });
    }
    return this;
  }

  or(indicator: string, operator: any, value: number | string): this {
    this.currentConditions.push({ op: 'or', items: [{ indicator, operator, value }] });
    return this;
  }

  then(type: any, params: Record<string, unknown> = {}): this {
    const id = `rule-${++this.ruleCounter}`;
    this.rules.push({
      id,
      conditions: [...this.currentConditions],
      action: { type, params },
      priority: this.ruleCounter,
    });
    this.currentConditions = [];
    return this;
  }

  name(n: string): this { this._name = n; return this; }
  timeframe(t: string): this { this._timeframe = t; return this; }
  riskPerTrade(r: number): this { this._riskPerTrade = r; return this; }
  maxPositions(m: number): this { this._maxPositions = m; return this; }

  build(): BuiltStrategy {
    const strategy: Strategy = {
      name: this._name,
      rules: this.rules,
      riskPerTrade: this._riskPerTrade,
      maxPositions: this._maxPositions,
      timeframe: this._timeframe,
    };
    return new BuiltStrategy(strategy, this.conditions, this.actions, this.backtest, this.optimizer);
  }
}

export class BuiltStrategy {
  constructor(
    public readonly definition: Strategy,
    private conditions: ConditionEngine,
    private actions: ActionEngine,
    private backtest: BacktestEngine,
    private optimizer: Optimizer,
  ) {}

  async backtest(data: unknown): Promise<BacktestResult> {
    return this.backtest.run(this.definition, data as any);
  }

  async optimize(paramSpace: Record<string, number[]>, data: unknown): Promise<OptimizeResult[]> {
    return this.optimizer.gridSearch(this.definition, paramSpace, data);
  }

  evaluate(indicators: Record<string, number>): Record<string, unknown> | null {
    const sorted = [...this.definition.rules].sort((a, b) => b.priority - a.priority);
    for (const rule of sorted) {
      if (this.conditions.evaluateGroup(rule.conditions as any, indicators)) {
        return this.actions.execute(rule.action, indicators);
      }
    }
    return null;
  }
}

export { BacktestEngine } from './backtest.js';
export { Optimizer } from './optimizer.js';
export { ConditionEngine } from './conditions.js';
export { ActionEngine } from './actions.js';
export { getTemplate, listTemplates } from './templates.js';
export type { Strategy, Rule, Action, BacktestResult, OptimizeResult } from './types.js';
