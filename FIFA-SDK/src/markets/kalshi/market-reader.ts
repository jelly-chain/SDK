import { KalshiClient, KalshiMarket } from './client.js';

export interface KalshiSnapshot {
  market: KalshiMarket;
  impliedYesProbability: number;
  impliedNoProbability: number;
  fetchedAt: string;
}

/** Reads live Kalshi market prices for World Cup events. */
export class KalshiMarketReader {
  constructor(private readonly client: KalshiClient) {}

  /** Get a snapshot of a Kalshi market's current prices. */
  async snapshot(ticker: string): Promise<KalshiSnapshot | null> {
    const market = await this.client.market(ticker);
    if (!market) return null;

    return {
      market,
      impliedYesProbability: market.yesPrice / 100,
      impliedNoProbability: market.noPrice / 100,
      fetchedAt: new Date().toISOString(),
    };
  }
}
