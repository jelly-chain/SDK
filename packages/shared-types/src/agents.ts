/**
 * Agent types — agent definitions, capabilities, execution contexts
 */

export enum AgentStatus {
  IDLE = "idle",
  RUNNING = "running",
  WAITING = "waiting",
  PAUSED = "paused",
  STOPPED = "stopped",
  ERROR = "error",
  COMPLETED = "completed",
}

export enum AgentCapability {
  TRADING = "trading",
  ANALYSIS = "analysis",
  MONITORING = "monitoring",
  ARBITRAGE = "arbitrage",
  PORTFOLIO_MANAGEMENT = "portfolio_management",
  RISK_MANAGEMENT = "risk_management",
  YIELD_OPTIMIZATION = "yield_optimization",
  PREDICTION = "prediction",
  SENTIMENT_ANALYSIS = "sentiment_analysis",
  ON_CHAIN_ANALYSIS = "on_chain_analysis",
  SOCIAL_MONITORING = "social_monitoring",
  NEWS_MONITORING = "news_monitoring",
  WALLET_MANAGEMENT = "wallet_management",
  BRIDGING = "bridging",
  STAKING = "staking",
  LENDING = "lending",
  NFT_TRADING = "nft_trading",
  GOVERNANCE = "governance",
  AIRDROP_HUNTING = "airdrop_hunting",
  MEV = "mev",
  LIQUIDATION = "liquidation",
  MARKET_MAKING = "market_making",
  COPY_TRADING = "copy_trading",
  ALERTING = "alerting",
  REPORTING = "reporting",
  TAX_REPORTING = "tax_reporting",
  COMPLIANCE = "compliance",
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  skills: string[];
  tools: string[];
  permissions: AgentPermission[];
  schedule?: AgentSchedule;
  triggers: AgentTrigger[];
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxIterations?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  budget?: AgentBudget;
  riskLimits: RiskLimits;
  notifications: NotificationConfig;
  logging: LoggingConfig;
  custom: Record<string, unknown>;
}

export interface AgentBudget {
  dailyUsd?: number;
  weeklyUsd?: number;
  monthlyUsd?: number;
  perTradeUsd?: number;
  maxGasPerDay?: number;
  maxTransactionsPerDay?: number;
}

export interface RiskLimits {
  maxPositionSize: number; // USD
  maxPositionPercent: number; // % of portfolio
  maxDrawdown: number; // %
  maxDailyLoss: number; // USD
  maxLeverage: number;
  maxSlippage: number; // %
  minLiquidity: number; // USD
  maxConcentration: number; // % in single token
  stopLossPercent?: number;
  takeProfitPercent?: number;
  trailingStopPercent?: number;
  maxOpenPositions: number;
  maxTradesPerDay: number;
  allowedChains: number[];
  allowedVenues: string[];
  blockedTokens: string[];
  requireConfirmation: boolean;
  confirmationThreshold: number; // USD
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  onTrade: boolean;
  onError: boolean;
  onLimit: boolean;
  onSignal: boolean;
  onProfit: boolean;
  onLoss: boolean;
  profitThreshold?: number;
  lossThreshold?: number;
}

export interface NotificationChannel {
  type: "webhook" | "telegram" | "discord" | "slack" | "email" | "sms";
  target: string;
  enabled: boolean;
}

export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  fileOutput: boolean;
  consoleOutput: boolean;
  logDirectory?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export interface AgentPermission {
  action: string;
  resource: string;
  allowed: boolean;
  conditions?: Record<string, unknown>;
}

export interface AgentSchedule {
  type: "cron" | "interval" | "event" | "manual";
  expression?: string; // cron expression
  intervalMs?: number;
  timezone?: string;
  enabled: boolean;
  nextRun?: number;
  lastRun?: number;
}

export interface AgentTrigger {
  type: "price" | "volume" | "time" | "event" | "signal" | "webhook" | "custom";
  name: string;
  description: string;
  conditions: TriggerCondition[];
  enabled: boolean;
  cooldown?: number;
}

export interface TriggerCondition {
  field: string;
  operator: string;
  value: number | string | boolean;
  lookback?: number;
}

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTask?: string;
  iteration: number;
  startTime: number;
  lastActionTime: number;
  lastError?: string;
  errorCount: number;
  metrics: AgentMetrics;
  context: AgentContext;
  memory: AgentMemory;
}

export interface AgentMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalFees: number;
  totalGasSpent: number;
  signalsGenerated: number;
  signalsActedOn: number;
  accuracy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  uptime: number;
  apiCalls: number;
  tokensUsed: number;
  costUsd: number;
}

export interface AgentContext {
  chainId?: number;
  token?: string;
  venue?: string;
  position?: PositionInfo;
  portfolio?: PortfolioInfo;
  market?: MarketInfo;
  recentSignals: string[];
  recentTrades: string[];
  pendingActions: PendingAction[];
  variables: Record<string, unknown>;
}

export interface AgentMemory {
  shortTerm: MemoryEntry[];
  longTerm: MemoryEntry[];
  episodic: EpisodicMemory[];
  semantic: SemanticMemory[];
  maxShortTerm: number;
  maxLongTerm: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  type: string;
  importance: number;
  timestamp: number;
  expiresAt?: number;
  metadata: Record<string, unknown>;
}

export interface EpisodicMemory {
  id: string;
  event: string;
  context: Record<string, unknown>;
  outcome: string;
  timestamp: number;
  lessons: string[];
}

export interface SemanticMemory {
  id: string;
  concept: string;
  facts: string[];
  relationships: { concept: string; relation: string }[];
  confidence: number;
  lastUpdated: number;
}

export interface PositionInfo {
  id: string;
  token: string;
  chainId: number;
  direction: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  venue: string;
  openedAt: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PortfolioInfo {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PositionInfo[];
  balances: { token: string; balance: number; value: number }[];
  allocation: { category: string; value: number; percent: number }[];
  riskMetrics: PortfolioRisk;
}

export interface PortfolioRisk {
  totalExposure: number;
  netExposure: number;
  grossExposure: number;
  concentration: number;
  correlation: number;
  var95: number; // Value at Risk 95%
  cvar95: number; // Conditional VaR 95%
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface MarketInfo {
  token: string;
  chainId: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  volatility: number;
  trend: number;
  regime: string;
  supportLevels: number[];
  resistanceLevels: number[];
  indicators: Record<string, number>;
}

export interface PendingAction {
  id: string;
  type: string;
  description: string;
  params: Record<string, unknown>;
  priority: number;
  deadline?: number;
  status: "pending" | "approved" | "rejected" | "executed";
}

export interface AgentExecution {
  id: string;
  agentId: string;
  trigger: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "cancelled";
  steps: ExecutionStep[];
  result?: Record<string, unknown>;
  error?: string;
  cost: number;
  gasUsed: number;
}

export interface ExecutionStep {
  id: string;
  name: string;
  type: "think" | "act" | "observe" | "decide" | "execute";
  status: "pending" | "running" | "completed" | "failed";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startTime: number;
  endTime?: number;
  error?: string;
  substeps?: ExecutionStep[];
}
