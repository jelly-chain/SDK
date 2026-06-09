import { Position } from '../types.js';

export class PositionTracker {
  private positions: Map<string, Position> = new Map();

  /**
   * Calculate unrealized PnL for all positions at current prices.
   */
  calculateUnrealizedPnl(prices: Map<string, string>): Map<string, string> {
    const pnl = new Map<string, string>();
    for (const [key, pos] of this.positions) {
      const currentPrice = prices.get(key);
      if (!currentPrice) continue;

      const entry = BigInt(pos.entryPrice);
      const current = BigInt(currentPrice);
      const amount = BigInt(pos.amount);

      const upnl = pos.side === 'long'
        ? (current - entry) * amount
        : (entry - current) * amount;

      pnl.set(key, upnl.toString());
    }
    return pnl;
  }

  /**
   * Calculate portfolio-wide metrics.
   */
  getPortfolioSummary(): {
    totalValue: string;
    totalUnrealizedPnl: string;
    totalRealizedPnl: number;
    positionCount: number;
  } {
    let totalPnl = 0n;
    let realizedPnl = 0;

    for (const pos of this.positions.values()) {
      totalPnl += BigInt(pos.unrealizedPnl || '0');
      realizedPnl += Number(pos.realizedPnl || '0');
    }

    return {
      totalValue: '0', // Would sum all position values
      totalUnrealizedPnl: totalPnl.toString(),
      totalRealizedPnl: realizedPnl,
      positionCount: this.positions.size,
    };
  }
}
