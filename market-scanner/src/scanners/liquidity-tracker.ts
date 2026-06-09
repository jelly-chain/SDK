import { ScannerSignal } from '../types.js';

interface LPEvent {
  tokenAddress: string;
  tokenSymbol: string;
  dex: string;
  chain: string;
  liquidityUsd: number;
  timestamp: number;
}

export class LiquidityTracker {
  private snapshots: Map<string, LPEvent[]> = new Map();

  /**
   * Record a liquidity snapshot for a token.
   */
  record(event: LPEvent): ScannerSignal | null {
    const key = `${event.chain}:${event.tokenAddress}:${event.dex}`;
    const history = this.snapshots.get(key) || [];
    history.push(event);

    // Keep last 24 entries
    if (history.length > 24) history.shift();
    this.snapshots.set(key, history);

    if (history.length < 2) return null;

    const prev = history[history.length - 2];
    const change = event.liquidityUsd - prev.liquidityUsd;
    const changePercent = prev.liquidityUsd > 0 ? (change / prev.liquidityUsd) * 100 : 0;

    // Only signal significant changes (>20%)
    if (Math.abs(changePercent) < 20) return null;

    return {
      id: `lq-${key}-${event.timestamp}`,
      type: 'liquidityChange',
      chain: event.chain,
      tokenAddress: event.tokenAddress,
      tokenSymbol: event.tokenSymbol,
      timestamp: event.timestamp,
      confidence: Math.min(Math.abs(changePercent) / 100, 1),
      metadata: {
        dex: event.dex,
        previousLiquidityUsd: prev.liquidityUsd.toString(),
        currentLiquidityUsd: event.liquidityUsd.toString(),
        changeUsd: change.toString(),
        changePercent,
        direction: change > 0 ? 'inflow' : 'outflow',
      },
    };
  }
}
