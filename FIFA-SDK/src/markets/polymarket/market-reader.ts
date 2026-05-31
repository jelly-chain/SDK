import { PolymarketClient, PolymarketMarket } from './client.js';

export interface MarketSnapshot {
  market: PolymarketMarket;
  bestYesPrice: number;
  bestNoPrice: number;
  impliedProbability: number;
  fetchedAt: string;
}

/** Reads and interprets live Polymarket prices for World Cup markets. */
export class PolymarketMarketReader {
  constructor(private readonly client: PolymarketClient) {}

  /** Get a real-time snapshot of a market including implied probability. */
  async snapshot(conditionId: string): Promise<MarketSnapshot | null> {
    const market = await this.client.market(conditionId);
    if (!market) return null;

    const yesPrice = market.outcomePrices[0] ?? 0.5;
    const noPrice = market.outcomePrices[1] ?? 0.5;

    return {
      market,
      bestYesPrice: yesPrice,
      bestNoPrice: noPrice,
      impliedProbability: yesPrice,
      fetchedAt: new Date().toISOString(),
    };
  }
}
