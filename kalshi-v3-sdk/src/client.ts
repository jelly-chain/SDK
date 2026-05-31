import type { KalshiConfig, KalshiEvent, KalshiMarket, KalshiOrderbook, KalshiOrder } from './types.js';

export class KalshiV3Client {
  private readonly baseUrl: string;
  private readonly keyId: string;
  readonly enabled: boolean;
  private authToken?: string;

  constructor(config: KalshiConfig = {}) {
    this.baseUrl = config.baseUrl ?? (config.testnet
      ? 'https://demo-api.kalshi.co/trade-api/v3'
      : 'https://trading-api.kalshi.com/trade-api/v3');
    this.keyId = config.keyId ?? process.env['KALSHI_KEY_ID'] ?? '';
    this.enabled = config.enabled !== false && !!this.keyId;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) h['Authorization'] = `Bearer ${this.authToken}`;
    return h;
  }

  async login(privateKey: string): Promise<boolean> {
    // RSA signature-based auth for V3
    try {
      const res = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ email: this.keyId, password: '' }),
      });
      if (!res.ok) return false;
      const data = await res.json() as { token: string };
      this.authToken = data.token;
      return true;
    } catch {
      return false;
    }
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  async getEvents(params: { category?: string; status?: string; limit?: number } = {}): Promise<KalshiEvent[]> {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.status) qs.set('status', params.status);
    if (params.limit) qs.set('limit', String(params.limit));

    const res = await fetch(`${this.baseUrl}/events?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json() as { events: KalshiEvent[] };
    return data.events ?? [];
  }

  async getEvent(eventTicker: string): Promise<KalshiEvent | null> {
    const res = await fetch(`${this.baseUrl}/events/${eventTicker}`, { headers: this.headers() });
    if (!res.ok) return null;
    const data = await res.json() as { event: KalshiEvent };
    return data.event ?? null;
  }

  // ─── Markets ────────────────────────────────────────────────────────────────

  async getMarkets(params: { category?: string; status?: string; limit?: number; event_ticker?: string } = {}): Promise<KalshiMarket[]> {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.status) qs.set('status', params.status);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.event_ticker) qs.set('event_ticker', params.event_ticker);

    const res = await fetch(`${this.baseUrl}/markets?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json() as { markets: KalshiMarket[] };
    return data.markets ?? [];
  }

  async getMarket(ticker: string): Promise<KalshiMarket | null> {
    const res = await fetch(`${this.baseUrl}/markets/${ticker}`, { headers: this.headers() });
    if (!res.ok) return null;
    const data = await res.json() as { market: KalshiMarket };
    return data.market ?? null;
  }

  async getOrderbook(ticker: string): Promise<KalshiOrderbook | null> {
    const res = await fetch(`${this.baseUrl}/markets/${ticker}/orderbook`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<KalshiOrderbook>;
  }

  // ─── Orders ─────────────────────────────────────────────────────────────────

  async placeOrder(order: {
    ticker: string;
    action: 'buy' | 'sell';
    side: 'yes' | 'no';
    type: 'limit' | 'market';
    quantity: number;
    price?: number;
  }): Promise<KalshiOrder | null> {
    const res = await fetch(`${this.baseUrl}/portfolio/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(order),
    });
    if (!res.ok) return null;
    const data = await res.json() as { order: KalshiOrder };
    return data.order ?? null;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/portfolio/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    return res.ok;
  }

  async getOrders(params: { status?: string; ticker?: string } = {}): Promise<KalshiOrder[]> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.ticker) qs.set('ticker', params.ticker);

    const res = await fetch(`${this.baseUrl}/portfolio/orders?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json() as { orders: KalshiOrder[] };
    return data.orders ?? [];
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  extractMidPrice(market: KalshiMarket): number {
    return (market.yes_bid + market.yes_ask) / 2 / 100;
  }

  findSportsMarkets(markets: KalshiMarket[]): KalshiMarket[] {
    const sportsTags = ['sports', 'nba', 'nfl', 'mlb', 'nhl', 'soccer', 'tennis', 'ufc', 'f1'];
    return markets.filter((m) =>
      sportsTags.some((tag) =>
        m.category?.toLowerCase().includes(tag) || m.tags.some((t) => t.toLowerCase().includes(tag))
      )
    );
  }

  findPoliticsMarkets(markets: KalshiMarket[]): KalshiMarket[] {
    const politicsTags = ['politics', 'election', 'president', 'congress', 'senate'];
    return markets.filter((m) =>
      politicsTags.some((tag) =>
        m.category?.toLowerCase().includes(tag) || m.tags.some((t) => t.toLowerCase().includes(tag))
      )
    );
  }
}
