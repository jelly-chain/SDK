export interface AgentConfig { name: string; strategy: string; riskTolerance: number; maxPositions: number; }
export interface AgentState { status: string; positions: number; pnl: string; lastAction: string; }
