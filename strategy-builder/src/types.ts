export type ConditionOperator = '<' | '>' | '<=' | '>=' | '==' | '!=' | 'crosses_above' | 'crosses_below';
export type ActionType = 'buy' | 'sell' | 'swap' | 'rebalance' | 'hold' | 'exit' | 'alert';
export type LogicalOp = 'and' | 'or';

export interface Condition {
  indicator: string;
  operator: ConditionOperator;
  value: number | string;
}

export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
}

export interface Rule {
  id: string;
  conditions: { op: LogicalOp; items: Condition[] }[];
  action: Action;
  priority: number;
}

export interface Strategy {
  name: string;
  rules: Rule[];
  riskPerTrade: number; // percentage
  maxPositions: number;
  timeframe: string;
}

export interface BacktestResult {
  strategy: string;
  from: string;
  to: string;
  totalReturn: number; // percentage
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: { date: string; value: number }[];
}

export interface OptimizeResult {
  params: Record<string, number>;
  score: number;
  result: BacktestResult;
}

export interface StrategyTemplate {
  name: string;
  description: string;
  strategy: Strategy;
}
