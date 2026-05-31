import { MarketType, MarketPlatform } from '../types.js';

export interface MarketSchemaObject {
  id: string;
  platform: MarketPlatform;
  question: string;
  marketType: MarketType;
  yesImpliedProbability: number;
  fetchedAt: string;
}

export const MarketSchema = {
  validate(obj: unknown): obj is MarketSchemaObject {
    if (typeof obj !== 'object' || obj === null) return false;
    const m = obj as Record<string, unknown>;
    return (
      typeof m['id'] === 'string' &&
      typeof m['platform'] === 'string' &&
      typeof m['question'] === 'string' &&
      typeof m['yesImpliedProbability'] === 'number'
    );
  },

  example(): MarketSchemaObject {
    return {
      id: 'pm-will-argentina-win-wc26',
      platform: 'POLYMARKET',
      question: 'Will Argentina win the 2026 FIFA World Cup?',
      marketType: 'TOURNAMENT_WINNER',
      yesImpliedProbability: 0.22,
      fetchedAt: new Date().toISOString(),
    };
  },
};
