import { KalshiMarket } from './client.js';
import { MarketType } from '../../types.js';

export interface MappedKalshiMarket {
  ticker: string;
  title: string;
  marketType: MarketType;
  teamIds: string[];
  fixtureId?: string;
  yesImplied: number;
  noImplied: number;
}

/** Maps Kalshi tickers to SDK World Cup entities. */
export class KalshiMapper {
  map(market: KalshiMarket): MappedKalshiMarket {
    return {
      ticker: market.ticker,
      title: market.title,
      marketType: this.inferMarketType(market.title),
      teamIds: [],
      yesImplied: market.yesPrice / 100,
      noImplied: market.noPrice / 100,
    };
  }

  private inferMarketType(title: string): MarketType {
    const lower = title.toLowerCase();
    if (lower.includes('win the world cup')) return 'TOURNAMENT_WINNER';
    if (lower.includes('win group')) return 'GROUP_WINNER';
    if (lower.includes('qualify')) return 'QUALIFICATION';
    if (lower.includes('final')) return 'REACH_FINAL';
    if (lower.includes('semi')) return 'REACH_SF';
    if (lower.includes('quarter')) return 'REACH_QF';
    return 'MATCH_WINNER';
  }
}
