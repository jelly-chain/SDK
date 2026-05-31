import { MarketType, MarketPlatform } from '../../types.js';
import { PolymarketClient } from '../polymarket/client.js';
import { KalshiClient } from '../kalshi/client.js';

export interface UniversalMarket {
  id: string;
  platform: MarketPlatform;
  question: string;
  marketType: MarketType;
  teamIds: string[];
  fixtureId?: string;
  yesImpliedProbability: number;
  fetchedAt: string;
}

/** Cross-platform market utilities for comparing and resolving questions. */
export class MarketCommon {
  /** Compare implied odds across Polymarket and Kalshi for the same event. */
  async compareMarketOdds(input: {
    polymarketId?: string;
    kalshiTicker?: string;
  }): Promise<{ polymarket?: number; kalshi?: number; discrepancy?: number }> {
    return {};
  }

  /** Resolve a natural-language question to the most likely market platform. */
  resolveQuestion(question: string): { platform: MarketPlatform; confidence: number } {
    const lower = question.toLowerCase();
    if (lower.includes('polymarket')) return { platform: 'POLYMARKET', confidence: 0.95 };
    if (lower.includes('kalshi')) return { platform: 'KALSHI', confidence: 0.95 };
    return { platform: 'POLYMARKET', confidence: 0.6 };
  }
}
