export interface BrainDecision {
  action: 'buy' | 'sell' | 'hold' | 'scan';
  confidence: number;
  targetModule?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  brain?: any;
  memory?: any;
  scanIntervalMs?: number;
}

export interface AgentState {
  status: 'idle' | 'scanning' | 'analyzing' | 'executing' | 'error';
  currentTask?: string;
  lastDecision?: BrainDecision;
  timestamp: number;
}

export interface BrainConfig {
  strategy: 'momentum' | 'mean-reversion' | 'sentiment' | 'custom';
  confidenceThreshold?: number;
  riskTolerance?: number;
}

export interface MemoryEntry {
  id?: string;
  type: string;
  data: unknown;
  timestamp: number;
  tags?: string[];
}

export interface MemoryConfig {
  maxEntries?: number;
  ttlMs?: number;
}
