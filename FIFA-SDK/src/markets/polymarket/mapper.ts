import { PolymarketMarket } from './client.js';
import { MarketType } from '../../types.js';

export interface MappedPolymarketMarket {
  conditionId: string;
  question: string;
  fixtureId?: string;
  teamIds: string[];
  marketType: MarketType;
  impliedProbabilities: Record<string, number>;
}

/** Maps Polymarket markets to SDK World Cup entities. */
export class PolymarketMapper {
  mapToFixture(market: PolymarketMarket): MappedPolymarketMarket {
    return {
      conditionId: market.conditionId,
      question: market.question,
      fixtureId: undefined,
      teamIds: [],
      marketType: 'MATCH_WINNER',
      impliedProbabilities: Object.fromEntries(
        market.outcomes.map((o, i) => [o, market.outcomePrices[i] ?? 0.5]),
      ),
    };
  }
}
