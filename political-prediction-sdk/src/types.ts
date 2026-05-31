export interface PoliticalConfig {
  predictitApiKey?: string;
  enabled?: boolean;
}

export interface PoliticalMarket {
  id: string;
  name: string;
  shortName: string;
  category: string;
  status: 'open' | 'closed' | 'resolved';
  url: string;
  image?: string;
  outcomes: PoliticalOutcome[];
  lastTradePrice: number;
  volume: number;
  liquidity: number;
  endDate?: string;
}

export interface PoliticalOutcome {
  id: string;
  name: string;
  shortName: string;
  price: number;
  bestBuyYes: number;
  bestBuyNo: number;
  bestSellYes: number;
  bestSellNo: number;
  lastTradePrice: number;
  volume: number;
}

export interface PoliticalPoll {
  id: string;
  race: string;
  pollster: string;
  date: string;
  sampleSize: number;
  marginOfError: number;
  results: Array<{ candidate: string; party: string; percentage: number }>;
  grade?: string;
}

export interface ElectionForecast {
  race: string;
  candidates: Array<{
    name: string;
    party: string;
    winProbability: number;
    pollingAverage: number;
    bettingOdds: number;
  }>;
  lastUpdated: string;
  confidence: number;
}
