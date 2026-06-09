export type PriceSource = "binance" | "coingecko" | "coinmarketcap" | "dexscreener" | "chainlink";
export interface PriceData { source: PriceSource; token: string; price: string; timestamp: number; confidence: number; }
export interface AggregatedPrice { token: string; price: string; sources: number; spread: number; timestamp: number; }
