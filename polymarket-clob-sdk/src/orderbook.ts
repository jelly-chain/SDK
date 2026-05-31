import type { ClobOrderbook, OrderbookAnalysis } from './types.js';

export class OrderbookAnalyzer {
  analyze(orderbook: ClobOrderbook): OrderbookAnalysis {
    const { bids, asks } = orderbook;

    const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : 0;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : 1;
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

    const bidDepth = bids.reduce((sum, b) => sum + b.size, 0);
    const askDepth = asks.reduce((sum, a) => sum + a.size, 0);
    const totalDepth = bidDepth + askDepth;

    const imbalance = totalDepth > 0 ? (bidDepth - askDepth) / totalDepth : 0;
    const liquidityScore = Math.min(1, totalDepth / 100000);

    return {
      market: orderbook.market,
      midPrice: Math.round(midPrice * 10000) / 10000,
      bestBid,
      bestAsk,
      spread: Math.round(spread * 10000) / 10000,
      spreadPercent: Math.round(spreadPercent * 100) / 100,
      bidDepth,
      askDepth,
      imbalance: Math.round(imbalance * 100) / 100,
      liquidityScore: Math.round(liquidityScore * 100) / 100,
    };
  }

  findWalls(orderbook: ClobOrderbook, threshold: number = 3): {
    bidWalls: Array<{ price: number; size: number }>;
    askWalls: Array<{ price: number; size: number }>;
  } {
    const avgBidSize = orderbook.bids.reduce((s, b) => s + b.size, 0) / Math.max(1, orderbook.bids.length);
    const avgAskSize = orderbook.asks.reduce((s, a) => s + a.size, 0) / Math.max(1, orderbook.asks.length);

    return {
      bidWalls: orderbook.bids.filter((b) => b.size > avgBidSize * threshold),
      askWalls: orderbook.asks.filter((a) => a.size > avgAskSize * threshold),
    };
  }

  estimateSlippage(orderbook: ClobOrderbook, side: 'buy' | 'sell', amount: number): number {
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    let remaining = amount;
    let totalCost = 0;

    for (const level of levels) {
      const fill = Math.min(remaining, level.size);
      totalCost += fill * level.price;
      remaining -= fill;
      if (remaining <= 0) break;
    }

    if (remaining > 0) return Infinity;
    const midPrice = (orderbook.bids[0]?.price ?? 0 + orderbook.asks[0]?.price ?? 1) / 2;
    return Math.abs(totalCost / amount - midPrice) / midPrice;
  }
}
