/** Raw Kalshi API response types. */

export interface KalshiMarketRaw {
  ticker: string;
  event_ticker: string;
  series_ticker: string;
  title: string;
  status: 'open' | 'closed' | 'settled';
  close_time: string;
  yes_ask: number;
  yes_bid: number;
  no_ask: number;
  no_bid: number;
  volume: number;
  volume_24h: number;
  category: string;
}

export interface KalshiEventRaw {
  event_ticker: string;
  series_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarketRaw[];
}
