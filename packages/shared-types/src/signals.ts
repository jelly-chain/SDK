/**
 * Signal & Prediction types — trading signals, predictions, alerts
 */

export enum SignalType {
  PRICE = "price",
  VOLUME = "volume",
  VOLATILITY = "volatility",
  MOMENTUM = "momentum",
  TREND = "trend",
  SENTIMENT = "sentiment",
  WHALE = "whale",
  ON_CHAIN = "on_chain",
  SOCIAL = "social",
  NEWS = "news",
  ARBITRAGE = "arbitrage",
  LIQUIDATION = "liquidation",
  FUNDING = "funding",
  GOVERNANCE = "governance",
  TECHNICAL = "technical",
  CUSTOM = "custom",
}

export enum SignalDirection {
  BULLISH = "bullish",
  BEARISH = "bearish",
  NEUTRAL = "neutral",
}

export enum SignalStrength {
  WEAK = 1,
  MODERATE = 2,
  STRONG = 3,
  VERY_STRONG = 4,
  EXTREME = 5,
}

export enum SignalTimeframe {
  SCALP = "scalping",       // < 1 hour
  INTRADAY = "intraday",    // 1-24 hours
  SWING = "swing",          // 1-7 days
  POSITION = "position",    // 1-4 weeks
  LONG_TERM = "long_term",  // 1-12 months
  MACRO = "macro",          // 1+ years
}

export interface TradingSignal {
  id: string;
  type: SignalType;
  direction: SignalDirection;
  strength: SignalStrength;
  timeframe: SignalTimeframe;
  token?: { symbol: string; address?: string; chainId: number };
  chainId?: number;
  venue?: string;
  price?: number;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence: number; // 0-1
  score: number; // 0-100
  reasoning: string[];
  sources: SignalSource[];
  indicators: SignalIndicator[];
  metadata: Record<string, unknown>;
  timestamp: number;
  expiresAt?: number;
  status: SignalStatus;
  outcome?: SignalOutcome;
}

export enum SignalStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  TRIGGERED = "triggered",
  CANCELLED = "cancelled",
  WON = "won",
  LOST = "lost",
}

export interface SignalOutcome {
  result: "win" | "loss" | "breakeven";
  entryPrice: number;
  exitPrice: number;
  pnlPercent: number;
  holdingPeriod: number;
  closedAt: number;
}

export interface SignalSource {
  name: string;
  type: string;
  weight: number;
  data: Record<string, unknown>;
}

export interface SignalIndicator {
  name: string;
  value: number;
  signal: SignalDirection;
  weight: number;
  parameters?: Record<string, number>;
}

export interface Prediction {
  id: string;
  statement: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  direction: SignalDirection;
  token?: { symbol: string; address?: string; chainId: number };
  timeframe: SignalTimeframe;
  targetDate?: number;
  reasoning: string[];
  evidence: Evidence[];
  sources: string[];
  methodology: string;
  baseRate: number;
  edge: number; // probability - base rate
  expectedValue: number;
  kellyFraction: number;
  recommendedStake?: number;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolution?: boolean;
  accuracy?: number;
}

export interface Evidence {
  type: string;
  description: string;
  weight: number;
  source: string;
  data: Record<string, unknown>;
}

export interface Alert {
  id: string;
  type: SignalType;
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  cooldown: number; // seconds between triggers
  lastTriggered?: number;
  triggerCount: number;
  createdAt: number;
  expiresAt?: number;
  metadata: Record<string, unknown>;
}

export interface AlertCondition {
  type: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between" | "changes_by" | "crosses_above" | "crosses_below";
  value: number;
  value2?: number; // for "between"
  lookback?: number; // seconds
  token?: string;
  chainId?: number;
  venue?: string;
}

export interface AlertAction {
  type: "webhook" | "email" | "telegram" | "discord" | "slack" | "sms" | "trade" | "log";
  config: Record<string, string>;
  enabled: boolean;
}

export interface BacktestResult {
  strategy: string;
  period: { start: number; end: number };
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingPeriod: number;
  calmarRatio: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; value: number }[];
}

export interface BacktestTrade {
  id: string;
  signalId: string;
  entryPrice: number;
  exitPrice: number;
  direction: "long" | "short";
  size: number;
  pnl: number;
  pnlPercent: number;
  entryTime: number;
  exitTime: number;
  holdingPeriod: number;
  fees: number;
  reason: string;
}

export interface MarketRegime {
  type: "trending_up" | "trending_down" | "ranging" | "volatile" | "low_volatility" | "crash" | "pump" | "distribution" | "accumulation";
  confidence: number;
  duration: number; // seconds in current regime
  volatility: number;
  volume: number;
  trend: number; // -1 to 1
  supportLevels: number[];
  resistanceLevels: number[];
  indicators: Record<string, number>;
}
