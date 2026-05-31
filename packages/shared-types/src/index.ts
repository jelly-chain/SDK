/**
 * @jelly-chain/shared-types
 * Shared TypeScript types across all Jelly Chain SDKs.
 */

// ─── Chain & Network ─────────────────────────────────────────────────────────

export type ChainId = string;
export type Ecosystem = 'evm' | 'solana' | 'cosmos' | 'move';

export interface ChainDefinition {
  id: ChainId;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  isTestnet: boolean;
  ecosystem: Ecosystem;
}

// ─── Time & Scheduling ───────────────────────────────────────────────────────

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface TimeRange {
  start: string;
  end: string;
}

export interface Schedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

// ─── Signals & Predictions ───────────────────────────────────────────────────

export type SignalDirection = 'bullish' | 'bearish' | 'neutral';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceTier = 'very-high' | 'high' | 'medium' | 'low' | 'uncertain';

export interface Signal {
  id: string;
  source: string;
  direction: SignalDirection;
  strength: number;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PredictionOutput {
  signal: SignalDirection;
  confidence: number;
  riskScore: number;
  factors: string[];
  explanations: string[];
  metadata: PredictionMetadata;
  timestamp: string;
}

export interface PredictionMetadata {
  sourceCount: number;
  cached: boolean;
  strategy: string;
  triggeredBy: string;
  latencyMs?: number;
  predictionId?: string;
}

// ─── Sports ──────────────────────────────────────────────────────────────────

export type Sport = 'football' | 'basketball' | 'american-football' | 'tennis' | 'baseball' | 'ice-hockey' | 'mma' | 'formula1' | 'cricket' | 'esports';
export type MarketPlatform = 'POLYMARKET' | 'KALSHI' | 'BETFAIR' | 'MANIFOLD';
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  sport: Sport;
  league: string;
  countryCode?: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  sport: Sport;
  position: string;
  available: boolean;
  injuryNote?: string;
}

export interface Fixture {
  id: string;
  sport: Sport;
  league: string;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffUtc: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

export interface Standing {
  teamId: string;
  league: string;
  season: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

// ─── Prediction Markets ──────────────────────────────────────────────────────

export interface MarketOutcome {
  name: string;
  probability: number;
  price: number;
}

export interface PredictionMarket {
  id: string;
  platform: MarketPlatform;
  title: string;
  description: string;
  outcomes: MarketOutcome[];
  volume: number;
  liquidity: number;
  createdAt: string;
  endDate?: string;
  resolved: boolean;
  resolvedOutcome?: string;
}

// ─── Events & Alerts ────────────────────────────────────────────────────────

export type EventType = string;

export interface EventPayload {
  id: string;
  type: EventType;
  chain?: ChainId;
  data: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ProviderConfig {
  name: string;
  type: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  enabled?: boolean;
}

export interface ProviderHealth {
  name: string;
  healthy: boolean;
  latencyMs: number;
  lastCheck: string;
  error?: string;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

export type CacheAdapter = 'memory' | 'redis' | 'file';

export interface CacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  adapter?: CacheAdapter;
  redisUrl?: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export type AgentFormat = 'claude-json' | 'raw' | 'markdown';

export interface AgentConfig {
  format: AgentFormat;
  maxEvidenceItems?: number;
  includeDisclaimer?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
}

// ─── Utility Types ───────────────────────────────────────────────────────────

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type AsyncResult<T> = Promise<{ data: T | null; error: Error | null }>;
