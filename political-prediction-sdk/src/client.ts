import type { PoliticalConfig, PoliticalMarket, PoliticalOutcome } from './types.js';

export class PoliticalClient {
  private readonly predictitApiKey: string;
  readonly enabled: boolean;

  constructor(config: PoliticalConfig = {}) {
    this.predictitApiKey = config.predictitApiKey ?? process.env['PREDICTIT_API_KEY'] ?? '';
    this.enabled = config.enabled !== false;
  }

  async getPredictItMarkets(params: { category?: string; status?: string } = {}): Promise<PoliticalMarket[]> {
    try {
      const res = await fetch('https://www.predictit.org/api/marketdata/all/');
      if (!res.ok) return [];
      const data = await res.json() as { markets: any[] };
      return (data.markets ?? []).map((m) => this.normalizePredictIt(m));
    } catch {
      return [];
    }
  }

  async getPredictItMarket(marketId: string): Promise<PoliticalMarket | null> {
    try {
      const res = await fetch(`https://www.predictit.org/api/marketdata/markets/${marketId}`);
      if (!res.ok) return null;
      const data = await res.json() as { market: any };
      return this.normalizePredictIt(data.market);
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<PoliticalMarket[]> {
    const markets = await this.getPredictItMarkets();
    const lower = query.toLowerCase();
    return markets.filter((m) =>
      m.name.toLowerCase().includes(lower) ||
      m.shortName.toLowerCase().includes(lower) ||
      m.category.toLowerCase().includes(lower)
    );
  }

  async getPresidentialMarkets(): Promise<PoliticalMarket[]> {
    const markets = await this.getPredictItMarkets();
    return markets.filter((m) =>
      m.category.toLowerCase().includes('president') ||
      m.name.toLowerCase().includes('president')
    );
  }

  async getSenateMarkets(): Promise<PoliticalMarket[]> {
    const markets = await this.getPredictItMarkets();
    return markets.filter((m) =>
      m.category.toLowerCase().includes('senate') ||
      m.name.toLowerCase().includes('senate')
    );
  }

  async getHouseMarkets(): Promise<PoliticalMarket[]> {
    const markets = await this.getPredictItMarkets();
    return markets.filter((m) =>
      m.category.toLowerCase().includes('house') ||
      m.name.toLowerCase().includes('house')
    );
  }

  private normalizePredictIt(m: any): PoliticalMarket {
    return {
      id: m.id?.toString() ?? '',
      name: m.name ?? '',
      shortName: m.shortName ?? '',
      category: m.category ?? '',
      status: m.status === 'Open' ? 'open' : m.status === 'Closed' ? 'closed' : 'resolved',
      url: m.url ?? '',
      image: m.image,
      outcomes: (m.contracts ?? []).map((c: any) => ({
        id: c.id?.toString() ?? '',
        name: c.name ?? '',
        shortName: c.shortName ?? '',
        price: c.lastTradePrice ?? 0,
        bestBuyYes: c.bestBuyYesCost ?? 0,
        bestBuyNo: c.bestBuyNoCost ?? 0,
        bestSellYes: c.bestSellYesCost ?? 0,
        bestSellNo: c.bestSellNoCost ?? 0,
        lastTradePrice: c.lastTradePrice ?? 0,
        volume: c.volume ?? 0,
      })),
      lastTradePrice: m.contracts?.[0]?.lastTradePrice ?? 0,
      volume: m.contracts?.reduce((s: number, c: any) => s + (c.volume ?? 0), 0) ?? 0,
      liquidity: 0,
      endDate: m.endDateTime,
    };
  }

  /** Compare prediction market to polls */
  compare(market: PoliticalMarket, pollingAverage: number): {
    marketImplied: number;
    polling: number;
    divergence: number;
    signal: string;
  } {
    const marketImplied = market.outcomes[0]?.price ?? 0.5;
    const divergence = Math.abs(marketImplied - pollingAverage / 100);

    let signal = 'Aligned';
    if (divergence > 0.1) {
      signal = marketImplied > pollingAverage / 100
        ? 'Market more bullish than polls'
        : 'Polls more bullish than market';
    }

    return {
      marketImplied: Math.round(marketImplied * 100) / 100,
      polling: pollingAverage,
      divergence: Math.round(divergence * 100) / 100,
      signal,
    };
  }
}
