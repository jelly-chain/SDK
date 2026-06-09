export interface RiskMetrics { sharpe: number; sortino: number; maxDrawdown: number; var95: number; beta: number; alpha: number; }
export interface ExposureLimit { chain: string; maxUsd: string; currentUsd: string; utilization: number; }
export interface CircuitBreaker { triggered: boolean; reason: string; timestamp: number; cooldownMs: number; }
