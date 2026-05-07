import { SportMarketType, MarketPlatform, Sport, League } from '../../types.js';
import { NormalizedMarket } from '../../normalizers/market-normalizer.js';

export class MarketCommon {
  /**
   * Detect cross-platform arbitrage between two platforms by comparing
   * implied probabilities / model probabilities.
   */
  detectArbitrage(
    params: {
      polymarketProb: number | undefined;
      kalshiProb: number | undefined;
      /** Minimum divergence to call an opportunity. Default 0.03 */
      threshold?: number;
    }
  ): {
    arbitrage: boolean;
    divergence: number;
    direction: 'poly-higher' | 'kalshi-higher' | 'aligned';
  } {
    const { polymarketProb, kalshiProb, threshold = 0.03 } = params;
    const { divergence, direction } = this.compareAcrossPlatforms(polymarketProb, kalshiProb);
    const arbitrage = polymarketProb !== undefined && kalshiProb !== undefined
      ? Math.abs(polymarketProb - kalshiProb) > threshold
      : false;
    return { arbitrage, divergence, direction };
  }

  /** Expected value given model probability vs decimal odds. */
  calculateEV(params: {
    modelProb: number;
    oddsDecimal: number;
    /** If provided, returns EV per bankroll unit if bankrollUnitStake=1. */
    stake?: number;
  }): { ev: number; roi: number } {
    const { modelProb, oddsDecimal, stake = 1 } = params;
    if (!Number.isFinite(modelProb) || modelProb < 0 || modelProb > 1) {
      throw new Error('calculateEV: modelProb must be in [0,1]');
    }
    if (!Number.isFinite(oddsDecimal) || oddsDecimal <= 1) {
      throw new Error('calculateEV: oddsDecimal must be > 1');
    }

    // Profit on win = stake * (oddsDecimal - 1)
    // Loss on lose = -stake
    const profitWin = stake * (oddsDecimal - 1);
    const profitLoss = -stake;

    const ev = modelProb * profitWin + (1 - modelProb) * profitLoss;
    const roi = ev / stake;
    return { ev, roi };
  }

  compareAcrossPlatforms(
    polymarketProb: number | undefined,
    kalshiProb: number | undefined,
  ): { divergence: number; direction: 'poly-higher' | 'kalshi-higher' | 'aligned' } {
    if (polymarketProb === undefined || kalshiProb === undefined) {
      return { divergence: 0, direction: 'aligned' };
    }
    const divergence = Math.abs(polymarketProb - kalshiProb);
    const direction =
      polymarketProb > kalshiProb ? 'poly-higher'
      : kalshiProb > polymarketProb ? 'kalshi-higher'
      : 'aligned';
    return { divergence, direction };
  }


  filterBySport(markets: NormalizedMarket[], sport: Sport): NormalizedMarket[] {
    return markets.filter((m) => m.sport === sport);
  }

  filterByLeague(markets: NormalizedMarket[], league: League): NormalizedMarket[] {
    return markets.filter((m) => m.league === league);
  }

  filterByType(markets: NormalizedMarket[], type: SportMarketType): NormalizedMarket[] {
    return markets.filter((m) => m.marketType === type);
  }

  filterByPlatform(markets: NormalizedMarket[], platform: MarketPlatform): NormalizedMarket[] {
    return markets.filter((m) => m.platform === platform);
  }
}
