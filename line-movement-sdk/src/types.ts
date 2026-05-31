export interface LineMovementConfig {
  storageBackend?: 'memory' | 'redis';
  maxHistoryDays?: number;
}

export interface OddsSnapshot {
  timestamp: string;
  sportsbook: string;
  fixtureId: string;
  market: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  spread?: number;
  total?: number;
}

export interface LineMovementData {
  fixtureId: string;
  market: string;
  snapshots: OddsSnapshot[];
  openingLine: OddsSnapshot;
  currentLine: OddsSnapshot;
  movement: {
    homeOddsDelta: number;
    awayOddsDelta: number;
    direction: 'toward-home' | 'toward-away' | 'stable';
    sharpMoney: 'home' | 'away' | 'none' | 'unclear';
  };
  steamMoves: SteamMove[];
}

export interface SteamMove {
  timestamp: string;
  direction: 'home' | 'away';
  magnitude: number;
  sportsbook: string;
  possibleCauses: string[];
}

export interface LineValueAnalysis {
  currentOdds: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  bestOdds: number;
  bestSportsbook: string;
  recommendation: 'bet' | 'pass';
}
