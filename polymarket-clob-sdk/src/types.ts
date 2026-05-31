export interface PolymarketClobConfig {
  apiUrl?: string;
  gammaUrl?: string;
  credentials?: { apiKey: string; secret: string; passphrase: string };
  enabled?: boolean;
}

export interface ClobMarket {
  condition_id: string;
  question: string;
  tokens: ClobToken[];
  end_date_iso: string;
  active: boolean;
  closed: boolean;
  market_slug: string;
  min_incentive_size: string;
  max_incentive_spread: string;
}

export interface ClobToken {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface ClobOrderbook {
  market: string;
  asset_id: string;
  bids: ClobOrder[];
  asks: ClobOrder[];
  timestamp: string;
}

export interface ClobOrder {
  price: number;
  size: number;
  order_id?: string;
}

export interface ClobTrade {
  id: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  timestamp: string;
  maker?: string;
  taker?: string;
}

export interface ClobTradeHistory {
  trades: ClobTrade[];
  next_cursor?: string;
}

export interface OrderbookAnalysis {
  market: string;
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  bidDepth: number;
  askDepth: number;
  imbalance: number;
  liquidityScore: number;
}

export interface ArbitrageOpportunity {
  market: string;
  platform1: { name: string; price: number };
  platform2: { name: string; price: number };
  profit: number;
  profitPercent: number;
  direction: string;
  confidence: number;
}
