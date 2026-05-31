import type { ManifoldConfig, ManifoldMarket, ManifoldBet, ManifoldUser } from './types.js';

export class ManifoldClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  readonly enabled: boolean;

  constructor(config: ManifoldConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://api.manifold.markets/v0';
    this.apiKey = config.apiKey ?? process.env['MANIFOLD_API_KEY'] ?? '';
    this.enabled = config.enabled !== false;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  async getMarkets(params: { limit?: number; sort?: string; term?: string; groupSlug?: string } = {}): Promise<ManifoldMarket[]> {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.sort) qs.set('sort', params.sort);
    if (params.term) qs.set('term', params.term);
    if (params.groupSlug) qs.set('groupSlug', params.groupSlug);

    const res = await fetch(`${this.baseUrl}/markets?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    return res.json() as Promise<ManifoldMarket[]>;
  }

  async getMarket(marketId: string): Promise<ManifoldMarket | null> {
    const res = await fetch(`${this.baseUrl}/markets/${marketId}`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<ManifoldMarket>;
  }

  async getMarketBySlug(slug: string): Promise<ManifoldMarket | null> {
    const res = await fetch(`${this.baseUrl}/market/${slug}`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<ManifoldMarket>;
  }

  async search(query: string): Promise<ManifoldMarket[]> {
    return this.getMarketss({ term: query, limit: 20 });
  }

  async getMarketss(params: Parameters<typeof this.getMarkets>[0] = {}): Promise<ManifoldMarket[]> {
    return this.getMarkets(params);
  }

  async getBets(params: { marketId?: string; userId?: string; limit?: number } = {}): Promise<ManifoldBet[]> {
    const qs = new URLSearchParams();
    if (params.marketId) qs.set('contractId', params.marketId);
    if (params.userId) qs.set('userId', params.userId);
    if (params.limit) qs.set('limit', String(params.limit));

    const res = await fetch(`${this.baseUrl}/bets?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    return res.json() as Promise<ManifoldBet[]>;
  }

  async getUser(userId: string): Promise<ManifoldUser | null> {
    const res = await fetch(`${this.baseUrl}/users/${userId}`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<ManifoldUser>;
  }

  async getTrendingMarkets(): Promise<ManifoldMarket[]> {
    return this.getMarkets({ sort: 'liquidity', limit: 20 });
  }

  async getNewMarkets(): Promise<ManifoldMarket[]> {
    return this.getMarkets({ sort: 'newest', limit: 20 });
  }

  async getClosedMarkets(): Promise<ManifoldMarket[]> {
    const markets = await this.getMarkets({ limit: 100 });
    return markets.filter((m) => m.isResolved);
  }

  async placeBet(marketId: string, outcome: 'YES' | 'NO', amount: number): Promise<boolean> {
    if (!this.apiKey) return false;
    const res = await fetch(`${this.baseUrl}/bet`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ contractId: marketId, outcome, amount }),
    });
    return res.ok;
  }
}
