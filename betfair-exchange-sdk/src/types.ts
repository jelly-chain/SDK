export interface BetfairConfig {
  appKey?: string;
  sessionToken?: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface BetfairEvent {
  eventTypeId: string;
  eventId: string;
  eventName: string;
  countryCode?: string;
  timezone: string;
  openDate: string;
  marketCount: number;
}

export interface BetfairMarket {
  marketId: string;
  marketName: string;
  marketType: string;
  eventId: string;
  eventName: string;
  totalMatched: number;
  totalAvailable: number;
  runners: BetfairRunner[];
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
  openDate: string;
}

export interface BetfairRunner {
  selectionId: number;
  runnerName: string;
  handicap: number;
  status: 'ACTIVE' | 'REMOVED' | 'WINNER' | 'LOSER';
  lastPriceTraded?: number;
  totalMatched?: number;
  sp?: { nearPrice?: number; farPrice?: number };
  ex?: {
    availableToBack: Array<{ price: number; size: number }>;
    availableToLay: Array<{ price: number; size: number }>;
    tradedVolume: Array<{ price: number; size: number }>;
  };
}

export interface BetfairOrderbook {
  marketId: string;
  runnerId: number;
  back: Array<{ price: number; size: number }>;
  lay: Array<{ price: number; size: number }>;
  timestamp: string;
}

export interface BetfairPriceSummary {
  marketId: string;
  runnerId: number;
  runnerName: string;
  bestBack: number;
  bestLay: number;
  lastTraded: number;
  totalMatched: number;
  impliedProbability: number;
}
