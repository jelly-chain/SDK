export interface KalshiConfig {
  keyId?: string;
  privateKey?: string;
  baseUrl?: string;
  testnet?: boolean;
  enabled?: boolean;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  sub_title?: string;
  status: 'open' | 'closed' | 'settled';
  markets: KalshiMarket[];
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  status: 'open' | 'closed' | 'settled';
  result?: 'yes' | 'no';
  close_time?: string;
  expiration_time?: string;
  category: string;
  tags: string[];
}

export interface KalshiOrderbook {
  ticker: string;
  yes: Array<{ price: number; quantity: number }>;
  no: Array<{ price: number; quantity: number }>;
  timestamp: string;
}

export interface KalshiOrder {
  order_id: string;
  ticker: string;
  action: 'buy' | 'sell';
  side: 'yes' | 'no';
  type: 'limit' | 'market';
  quantity: number;
  price?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled';
  filled_quantity: number;
  created_time: string;
}

export interface KalshiPosition {
  ticker: string;
  title: string;
  quantity: number;
  side: 'yes' | 'no';
  average_price: number;
  current_value: number;
  pnl: number;
}

export interface KalshiPortfolio {
  balance: number;
  positions: KalshiPosition[];
  total_value: number;
  total_pnl: number;
}
