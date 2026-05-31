import { MarketType, MarketPlatform } from '../types.js';

export interface NormalizedMarket {
  id: string;
  platform: MarketPlatform;
  question: string;
  marketType: MarketType;
  outcomes: Array<{ id: string; label: string; probability: number }>;
  volume?: number;
  liquidity?: number;
  expiresAt?: string;
  fetchedAt: string;
}

/** Normalizes prediction market data from Polymarket and Kalshi into a common format. */
export class MarketNormalizer {
  fromPolymarket(raw: Record<string, unknown>): NormalizedMarket {
    return {
      id: String(raw['id'] ?? raw['conditionId'] ?? ''),
      platform: 'POLYMARKET',
      question: String(raw['question'] ?? raw['title'] ?? ''),
      marketType: 'MATCH_WINNER',
      outcomes: [],
      volume: raw['volume'] as number | undefined,
      liquidity: raw['liquidity'] as number | undefined,
      expiresAt: raw['endDate'] as string | undefined,
      fetchedAt: new Date().toISOString(),
    };
  }

  fromKalshi(raw: Record<string, unknown>): NormalizedMarket {
    return {
      id: String(raw['ticker'] ?? raw['market_id'] ?? ''),
      platform: 'KALSHI',
      question: String(raw['title'] ?? raw['question'] ?? ''),
      marketType: 'MATCH_WINNER',
      outcomes: [],
      volume: raw['volume'] as number | undefined,
      expiresAt: raw['close_time'] as string | undefined,
      fetchedAt: new Date().toISOString(),
    };
  }
}
