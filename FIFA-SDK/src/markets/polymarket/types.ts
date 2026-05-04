/** Raw Polymarket CLOB API response types. */

export interface PolymarketCondition {
  condition_id: string;
  question_id: string;
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string;
  outcomes: string[];
  outcome_prices: string[];
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
}

export interface PolymarketBook {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  best_bid: string;
  best_ask: string;
  spread: string;
}
