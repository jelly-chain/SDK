import type { BetfairConfig, BetfairEvent, BetfairMarket, BetfairRunner, BetfairPriceSummary } from './types.js';

export class BetfairClient {
  private readonly appKey: string;
  private readonly sessionToken: string;
  private readonly baseUrl: string;
  readonly enabled: boolean;

  constructor(config: BetfairConfig = {}) {
    this.appKey = config.appKey ?? process.env['BETFAIR_APP_KEY'] ?? '';
    this.sessionToken = config.sessionToken ?? process.env['BETFAIR_SESSION_TOKEN'] ?? '';
    this.baseUrl = config.baseUrl ?? 'https://api.betfair.com/ex/betting/rest/v1.0';
    this.enabled = config.enabled !== false && !!this.appKey;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Application': this.appKey,
      'X-Authentication': this.sessionToken,
    };
  }

  private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    } catch {
      return null;
    }
  }

  async getEventTypes(): Promise<Array<{ eventTypeId: string; eventType: { name: string } }>> {
    const result = await this.post<Array<{ eventTypeId: string; eventType: { name: string } }>>('/listEventTypes/', { filter: {} });
    return result ?? [];
  }

  async getEvents(eventTypeId: string, fromDate?: string): Promise<BetfairEvent[]> {
    const filter: Record<string, unknown> = { eventTypeId };
    if (fromDate) filter['fromDate'] = fromDate;
    const result = await this.post<BetfairEvent[]>('/listEvents/', { filter });
    return result ?? [];
  }

  async getMarkets(params: { eventTypeId?: string; eventId?: string; marketType?: string }): Promise<BetfairMarket[]> {
    const filter: Record<string, unknown> = {};
    if (params.eventTypeId) filter['eventTypeId'] = params.eventTypeId;
    if (params.eventId) filter['eventIds'] = [params.eventId];
    if (params.marketType) filter['marketType'] = params.marketType;

    const result = await this.post<BetfairMarket[]>('/listMarketCatalogue/', {
      filter,
      maxResults: 100,
      marketProjection: ['RUNNER_DESCRIPTION', 'RUNNER_METADATA', 'MARKET_START_TIME'],
    });
    return result ?? [];
  }

  async getMarketBook(marketId: string): Promise<BetfairMarket | null> {
    const result = await this.post<BetfairMarket[]>('/listMarketBook/', {
      marketIdss: [marketId],
      priceProjection: { priceData: ['EX_BEST_OFFERS', 'EX_TRADED'] },
    });
    return result?.[0] ?? null;
  }

  getRunnerPrices(runner: BetfairRunner): BetfairPriceSummary | null {
    if (!runner.ex) return null;

    const bestBack = runner.ex.availableToBack[0]?.price ?? 0;
    const bestLay = runner.ex.availableToLay[0]?.price ?? 0;
    const lastTraded = runner.lastPriceTraded ?? 0;
    const totalMatched = runner.totalMatched ?? 0;
    const impliedProbability = bestBack > 0 ? 1 / bestBack : 0;

    return {
      marketId: '',
      runnerId: runner.selectionId,
      runnerName: runner.runnerName,
      bestBack,
      bestLay,
      lastTraded,
      totalMatched,
      impliedProbability: Math.round(impliedProbability * 1000) / 1000,
    };
  }

  findSportsEvents(events: BetfairEvent[]): BetfairEvent[] {
    // Sport event type IDs: 1=Football, 2=Tennis, 3=Golf, 4=Cricket, 7=Horse Racing, etc.
    return events.filter((e) => ['1', '2', '3', '4', '7', '6423'].includes(e.eventTypeId));
  }

  calculateExchangeEdge(betfairImplied: number, modelProbability: number): {
    edge: number;
    direction: 'back' | 'lay' | 'pass';
    recommendation: string;
  } {
    const edge = modelProbability - betfairImplied;
    const direction = edge > 0.03 ? 'back' : edge < -0.03 ? 'lay' : 'pass';
    const recommendation = direction === 'back'
      ? 'Model higher than market — back opportunity'
      : direction === 'lay'
        ? 'Model lower than market — lay opportunity'
        : 'No edge — pass';

    return { edge: Math.round(edge * 1000) / 1000, direction, recommendation };
  }
}
