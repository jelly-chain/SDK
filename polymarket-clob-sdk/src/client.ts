import type { PolymarketClobConfig, ClobMarket, ClobTradeHistory } from './types.js';

export class PolymarketClobClient {
  private readonly apiUrl: string;
  private readonly gammaUrl: string;
  readonly enabled: boolean;

  constructor(config: PolymarketClobConfig = {}) {
    this.apiUrl = config.apiUrl ?? 'https://clob.polymarket.com';
    this.gammaUrl = config.gammaUrl ?? 'https://gamma-api.polymarket.com';
    this.enabled = config.enabled !== false;
  }

  async getMarkets(params: { limit?: number; active?: boolean; closed?: boolean } = {}): Promise<ClobMarket[]> {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.active !== undefined) qs.set('active', String(params.active));
    if (params.closed !== undefined) qs.set('closed', String(params.closed));

    const res = await fetch(`${this.gammaUrl}/markets?${qs}`);
    if (!res.ok) return [];
    return res.json() as Promise<ClobMarket[]>;
  }

  async getMarket(conditionId: string): Promise<ClobMarket | null> {
    const res = await fetch(`${this.gammaUrl}/markets/${conditionId}`);
    if (!res.ok) return null;
    return res.json() as Promise<ClobMarket>;
  }

  async searchMarkets(query: string): Promise<ClobMarket[]> {
    const res = await fetch(`${this.gammaUrl}/markets?_q=${encodeURIComponent(query)}&active=true`);
    if (!res.ok) return [];
    return res.json() as Promise<ClobMarket[]>;
  }

  async getTrades(tokenId: string, limit: number = 100): Promise<ClobTradeHistory> {
    const res = await fetch(`${this.apiUrl}/trades?asset_id=${tokenId}&limit=${limit}`);
    if (!res.ok) return { trades: [] };
    return res.json() as Promise<ClobTradeHistory>;
  }

  async getTradeHistory(market: string): Promise<ClobTradeHistory> {
    const res = await fetch(`${this.apiUrl}/trade-history?market=${market}`);
    if (!res.ok) return { trades: [] };
    return res.json() as Promise<ClobTradeHistory>;
  }

  extractMidPrice(market: ClobMarket): number {
    const yesToken = market.tokens.find((t) => t.outcome === 'Yes');
    return yesToken?.price ?? 0.5;
  }
}
