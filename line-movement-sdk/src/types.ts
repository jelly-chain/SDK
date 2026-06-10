export enum MovementType { NORMAL = "normal", STEAM = "steam", REVERSE = "reverse_line_movement", STALE = "stale", SHARP = "sharp", PUBLIC = "public" }
export enum MarketSport { GENERIC = "generic", NFL = "nfl", NBA = "nba", MLB = "mlb", NHL = "nhl", SOCCER = "soccer", TENNIS = "tennis", MMA = "mma", BOXING = "boxing", F1 = "f1", POLITICS = "politics", CRYPTO = "crypto" }

export interface LineSnapshot {
  id: string;
  marketId: string;
  sport: MarketSport;
  eventName: string;
  selection: string;
  odds: number;
  impliedProbability: number;
  volume: number;
  timestamp: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface LineMovement {
  marketId: string;
  selection: string;
  startOdds: number;
  endOdds: number;
  startProbability: number;
  endProbability: number;
  change: number;
  changePercent: number;
  direction: "toward" | "against";
  type: MovementType;
  startTime: number;
  endTime: number;
  duration: number;
  volumeAtStart: number;
  volumeAtEnd: number;
  significance: number;
}

export interface SteamMove {
  marketId: string;
  selection: string;
  snapshots: LineSnapshot[];
  totalMovement: number;
  duration: number;
  confirmed: boolean;
  expectedValue?: number;
  recommendation?: string;
}

export interface ReverseLineMovement {
  marketId: string;
  selection: string;
  publicSide: string;
  lineDirection: "against_public" | "with_public";
  publicPercent: number;
  lineChange: number;
  significance: number;
  expectedValue: number;
}

export interface SharpMoneyIndicator {
  marketId: string;
  selection: string;
  confidence: number;
  evidence: string[];
  estimatedSharpPercent: number;
  lineEfficiency: number;
  recommendation: string;
  expectedValue: number;
  timestamp: number;
}

export interface ClosingLineValue {
  marketId: string;
  selection: string;
  betOdds: number;
  closingOdds: number;
  clv: number;
  clvPercent: number;
  edge: number;
  beatsClo?: boolean;
}

export interface MarketEfficiency {
  marketId: string;
  sport: MarketSport;
  efficiency: number;
  sampleSize: number;
  avgClv: number;
  beatRate: number;
  sharpeRatio: number;
  analysisPeriod: { start: number; end: number };
}
