export enum RiskLevel { LOW = "low", MEDIUM = "medium", HIGH = "high", CRITICAL = "critical", EXTREME = "extreme" }
export enum RiskFactor { CONCENTRATION = "concentration", LEVERAGE = "leverage", LIQUIDITY = "liquidity", VOLATILITY = "volatility", CORRELATION = "correlation", SMART_CONTRACT = "smart_contract", COUNTERPARTY = "counterparty", REGULATORY = "regulatory" }

export interface RiskLimit {
  factor: RiskFactor;
  threshold: number;
  currentValue: number;
  utilization: number;
  level: RiskLevel;
  action: "warn" | "block" | "reduce" | "hedge";
}

export interface RiskCheck {
  passed: boolean;
  level: RiskLevel;
  score: number;
  limits: RiskLimit[];
  warnings: string[];
  recommendations: string[];
  timestamp: number;
}

export interface PortfolioRisk {
  totalValue: number;
  totalExposure: number;
  netExposure: number;
  grossExposure: number;
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  maxDrawdownDuration: number;
  volatility: number;
  downsideVolatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;
  concentration: number;
  diversificationRatio: number;
  correlation: number;
  skewness: number;
  kurtosis: number;
  riskContribution: { token: string; contribution: number; percent: number }[];
  factorExposure: { factor: RiskFactor; exposure: number }[];
  stressResults: StressTestResult[];
  scenarioResults: ScenarioResult[];
  timestamp: number;
}

export interface PositionRisk {
  token: string;
  size: number;
  value: number;
  var95: number;
  var99: number;
  contribution: number;
  percentOfPortfolio: number;
  liquidityRisk: number;
  smartContractRisk: number;
  volatilityRisk: number;
  level: RiskLevel;
}

export interface VaRInput { returns: number[]; confidence: number; holdingPeriod?: number }
export interface VaRResult { var: number; cvar: number; confidence: number; method: string; samples: number }

export interface CorrelationMatrix {
  tokens: string[];
  matrix: number[][];
  eigenvalues: number[];
  conditionNumber: number;
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
  highlyCorrelated: { token1: string; token2: string; correlation: number }[];
}

export interface StressTestResult {
  scenario: string;
  description: string;
  shocks: { factor: string; shock: number }[];
  portfolioLoss: number;
  portfolioLossPercent: number;
  positionsAffected: number;
  breakEvenPrice?: number;
}

export interface ScenarioResult {
  name: string;
  description: string;
  probability: number;
  expectedReturn: number;
  worstCase: number;
  bestCase: number;
  assumptions: Record<string, number>;
}

export interface RiskReport {
  portfolioRisk: PortfolioRisk;
  positionRisks: PositionRisk[];
  riskChecks: RiskCheck[];
  correlationMatrix: CorrelationMatrix;
  recommendations: string[];
  alerts: string[];
  generatedAt: number;
  period: { start: number; end: number };
}
