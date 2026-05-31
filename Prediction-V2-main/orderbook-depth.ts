/**
 * Prediction Market Orderbook Depth Analysis
 * Not just price — liquidity, spread, and market microstructure.
 */

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
  numOrders: number;
}

export interface OrderbookSnapshot {
  marketId: string;
  platform: string;
  timestamp: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  totalBidDepth: number;
  totalAskDepth: number;
  imbalance: number; // -1 to 1, positive = more bids
}

export interface DepthAnalysis {
  marketId: string;
  liquidity: {
    bidDepth: number;
    askDepth: number;
    totalDepth: number;
    depthRatio: number;
    liquidityScore: number; // 0-1
  };
  spread: {
    absolute: number;
    percentage: number;
    isWide: boolean;
    costToTrade: number;
  };
  imbalance: {
    ratio: number;
    direction: 'bid-heavy' | 'ask-heavy' | 'balanced';
    signal: string;
  };
  walls: {
    bidWalls: OrderbookLevel[];
    askWalls: OrderbookLevel[];
    wallSignal: string;
  };
  microstructure: {
    avgOrderSize: number;
    orderCount: number;
    isThin: boolean;
    slippage: {
      buy1k: number;
      buy5k: number;
      buy10k: number;
      sell1k: number;
      sell5k: number;
      sell10k: number;
    };
  };
  tradingSignal: {
    direction: 'buy' | 'sell' | 'hold';
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  };
}

export class OrderbookAnalyzer {
  /** Analyze an orderbook snapshot */
  analyze(snapshot: OrderbookSnapshot): DepthAnalysis {
    const { bids, asks, midPrice, spread, spreadPercent } = snapshot;

    // Depth analysis
    const bidDepth = bids.reduce((sum, level) => sum + level.size, 0);
    const askDepth = asks.reduce((sum, level) => sum + level.size, 0);
    const totalDepth = bidDepth + askDepth;
    const depthRatio = bidDepth / Math.max(1, askDepth);
    const liquidityScore = Math.min(1, totalDepth / 10000); // Normalize to 10k

    // Spread analysis
    const isWide = spreadPercent > 5; // 5% is wide for prediction markets
    const costToTrade = spread / 2; // Cost per side

    // Imbalance
    const imbalanceRatio = (bidDepth - askDepth) / Math.max(1, totalDepth);
    const imbalanceDirection: DepthAnalysis['imbalance']['direction'] =
      imbalanceRatio > 0.2 ? 'bid-heavy' :
      imbalanceRatio < -0.2 ? 'ask-heavy' : 'balanced';

    const imbalanceSignal = imbalanceDirection === 'bid-heavy'
      ? 'More buyers than sellers — bullish pressure'
      : imbalanceDirection === 'ask-heavy'
        ? 'More sellers than buyers — bearish pressure'
        : 'Balanced orderbook';

    // Wall detection (large orders)
    const avgBidSize = bidDepth / Math.max(1, bids.length);
    const avgAskSize = askDepth / Math.max(1, asks.length);
    const bidWalls = bids.filter((level) => level.size > avgBidSize * 3);
    const askWalls = asks.filter((level) => level.size > avgAskSize * 3);

    let wallSignal = 'No significant walls';
    if (bidWalls.length > 0 && askWalls.length === 0) wallSignal = 'Bid wall support — price likely to hold';
    if (askWalls.length > 0 && bidWalls.length === 0) wallSignal = 'Ask wall resistance — price likely capped';
    if (bidWalls.length > 0 && askWalls.length > 0) wallSignal = 'Walls on both sides — range-bound';

    // Slippage calculation
    const calculateSlippage = (side: 'buy' | 'sell', amount: number): number => {
      const levels = side === 'buy' ? asks : bids;
      let remaining = amount;
      let totalCost = 0;

      for (const level of levels) {
        const fillAmount = Math.min(remaining, level.size);
        totalCost += fillAmount * level.price;
        remaining -= fillAmount;
        if (remaining <= 0) break;
      }

      if (remaining > 0) return Infinity; // Not enough liquidity
      const avgPrice = totalCost / amount;
      return Math.abs(avgPrice - midPrice) / midPrice;
    };

    // Trading signal
    let direction: DepthAnalysis['tradingSignal']['direction'] = 'hold';
    let urgency: DepthAnalysis['tradingSignal']['urgency'] = 'low';
    let reason = 'No clear signal';

    if (imbalanceDirection === 'bid-heavy' && liquidityScore > 0.5) {
      direction = 'buy';
      urgency = spreadPercent < 2 ? 'high' : 'medium';
      reason = 'Strong bid support with tight spread';
    } else if (imbalanceDirection === 'ask-heavy' && liquidityScore > 0.5) {
      direction = 'sell';
      urgency = spreadPercent < 2 ? 'high' : 'medium';
      reason = 'Heavy selling pressure detected';
    }

    return {
      marketId: snapshot.marketId,
      liquidity: {
        bidDepth,
        askDepth,
        totalDepth,
        depthRatio: Math.round(depthRatio * 100) / 100,
        liquidityScore: Math.round(liquidityScore * 100) / 100,
      },
      spread: {
        absolute: spread,
        percentage: spreadPercent,
        isWide,
        costToTrade: Math.round(costToTrade * 1000) / 1000,
      },
      imbalance: {
        ratio: Math.round(imbalanceRatio * 100) / 100,
        direction: imbalanceDirection,
        signal: imbalanceSignal,
      },
      walls: {
        bidWalls,
        askWalls,
        wallSignal,
      },
      microstructure: {
        avgOrderSize: Math.round((avgBidSize + avgAskSize) / 2),
        orderCount: bids.length + asks.length,
        isThin: totalDepth < 1000,
        slippage: {
          buy1k: Math.round(calculateSlippage('buy', 1000) * 1000) / 1000,
          buy5k: Math.round(calculateSlippage('buy', 5000) * 1000) / 1000,
          buy10k: Math.round(calculateSlippage('buy', 10000) * 1000) / 1000,
          sell1k: Math.round(calculateSlippage('sell', 1000) * 1000) / 1000,
          sell5k: Math.round(calculateSlippage('sell', 5000) * 1000) / 1000,
          sell10k: Math.round(calculateSlippage('sell', 10000) * 1000) / 1000,
        },
      },
      tradingSignal: { direction, urgency, reason },
    };
  }

  /** Compare orderbooks across platforms */
  crossPlatformAnalysis(snapshots: OrderbookSnapshot[]): {
    bestBid: { platform: string; price: number };
    bestAsk: { platform: string; price: number };
    arbitrageOpportunity: boolean;
    arbitrageProfit: number;
    recommendations: string[];
  } {
    let bestBidPlatform = '';
    let bestBidPrice = 0;
    let bestAskPlatform = '';
    let bestAskPrice = Infinity;

    for (const snapshot of snapshots) {
      if (snapshot.bestBid > bestBidPrice) {
        bestBidPrice = snapshot.bestBid;
        bestBidPlatform = snapshot.platform;
      }
      if (snapshot.bestAsk < bestAskPrice) {
        bestAskPrice = snapshot.bestAsk;
        bestAskPlatform = snapshot.platform;
      }
    }

    const arbitrageProfit = bestBidPrice - bestAskPrice;
    const arbitrageOpportunity = arbitrageProfit > 0 && bestBidPlatform !== bestAskPlatform;

    const recommendations: string[] = [];
    if (arbitrageOpportunity) {
      recommendations.push(`Buy on ${bestAskPlatform} at ${bestAskPrice}, sell on ${bestBidPlatform} at ${bestBidPrice}`);
      recommendations.push(`Profit per unit: ${arbitrageProfit.toFixed(4)}`);
    }

    // Find deepest book
    const deepest = snapshots.reduce((best, snap) =>
      snap.totalBidDepth + snap.totalAskDepth > best.totalBidDepth + best.totalAskDepth ? snap : best
    );
    recommendations.push(`Deapest liquidity: ${deepest.platform}`);

    // Find tightest spread
    const tightest = snapshots.reduce((best, snap) =>
      snap.spreadPercent < best.spreadPercent ? snap : best
    );
    recommendations.push(`Tightest spread: ${tightest.platform} (${tightest.spreadPercent.toFixed(2)}%)`);

    return {
      bestBid: { platform: bestBidPlatform, price: bestBidPrice },
      bestAsk: { platform: bestAskPlatform, price: bestAskPrice },
      arbitrageOpportunity,
      arbitrageProfit: Math.round(arbitrageProfit * 10000) / 10000,
      recommendations,
    };
  }
}
