export interface StrategyConfig { name: string; timeframe: string; indicators: string[]; riskPerTrade: number; }
export interface Signal { action: "buy" | "sell" | "hold"; confidence: number; reason: string; }
