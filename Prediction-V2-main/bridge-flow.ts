/**
 * Cross-Chain Bridge Flow Monitor
 * Capital moving chains = signal.
 */

export interface BridgeTransaction {
  id: string;
  hash: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  bridge: string; // e.g. "stargate", "wormhole", "layerzero", "axelar"
  from: string;
  to: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface ChainFlow {
  chain: string;
  period: string;
  inflow: { amount: number; usdValue: number; txCount: number };
  outflow: { amount: number; usdValue: number; txCount: number };
  netFlow: number;
  netFlowUsd: number;
  topTokens: Array<{ token: string; netFlow: number }>;
  topBridges: Array<{ bridge: string; volume: number }>;
}

export interface BridgeFlowSignal {
  id: string;
  type: 'capital-inflow' | 'capital-outflow' | 'whale-migration' | 'yield-seeking' | 'de-risking';
  sourceChain: string;
  destChain: string;
  token: string;
  amount: number;
  usdValue: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  details: string;
  timestamp: string;
}

export interface CrossChainSummary {
  period: string;
  totalVolume: number;
  totalTransactions: number;
  topRoutes: Array<{
    source: string;
    dest: string;
    volume: number;
    txCount: number;
  }>;
  chainRankings: Array<{
    chain: string;
    netFlow: number;
    netFlowUsd: number;
    signal: string;
  }>;
  signals: BridgeFlowSignal[];
}

const CHAIN_ECOSYSTEMS: Record<string, string> = {
  'ethereum': 'evm',
  'bsc': 'evm',
  'polygon': 'evm',
  'arbitrum': 'evm',
  'optimism': 'evm',
  'base': 'evm',
  'avalanche': 'evm',
  'solana': 'solana',
  'aptos': 'move',
  'sui': 'move',
};

export class BridgeFlowMonitor {
  private transactions: BridgeTransaction[] = [];
  private signals: BridgeFlowSignal[] = [];

  /** Record a bridge transaction */
  record(tx: BridgeTransaction): void {
    this.transactions.push(tx);

    // Analyze for signals
    const signal = this.analyzeTransaction(tx);
    if (signal) {
      this.signals.push(signal);
    }
  }

  /** Record multiple transactions */
  recordMany(txs: BridgeTransaction[]): void {
    for (const tx of txs) this.record(tx);
  }

  /** Analyze a bridge transaction for signals */
  private analyzeTransaction(tx: BridgeTransaction): BridgeFlowSignal | null {
    if (tx.usdValue < 100000) return null; // Only track significant moves

    let type: BridgeFlowSignal['type'] = 'capital-inflow';
    let direction: BridgeFlowSignal['direction'] = 'neutral';
    let details = '';

    const sourceEco = CHAIN_ECOSYSTEMS[tx.sourceChain] ?? 'unknown';
    const destEco = CHAIN_ECOSYSTEMS[tx.destChain] ?? 'unknown';

    // Cross-ecosystem migration (e.g., ETH -> SOL)
    if (sourceEco !== destEco && tx.usdValue > 500000) {
      type = 'whale-migration';
      direction = 'bullish'; // Bullish for destination chain
      details = `Whale migrating $${(tx.usdValue / 1000).toFixed(0)}k from ${tx.sourceChain} to ${tx.destChain}`;
    }
    // L2 inflow (capital moving to scaling solution)
    else if (['arbitrum', 'optimism', 'base', 'zksync'].includes(tx.destChain)) {
      type = 'capital-inflow';
      direction = 'bullish';
      details = `$${(tx.usdValue / 1000).toFixed(0)}k bridged to ${tx.destChain} — L2 adoption`;
    }
    // Capital leaving L2
    else if (['arbitrum', 'optimism', 'base', 'zksync'].includes(tx.sourceChain)) {
      type = 'capital-outflow';
      direction = 'bearish';
      details = `$${(tx.usdValue / 1000).toFixed(0)}k leaving ${tx.sourceChain}`;
    }
    // Large stablecoin movement
    else if (['USDC', 'USDT', 'DAI'].includes(tx.token) && tx.usdValue > 1000000) {
      type = 'yield-seeking';
      direction = 'neutral';
      details = `$${(tx.usdValue / 1000000).toFixed(1)}M stablecoin bridge — likely yield seeking`;
    }

    if (!details) return null;

    return {
      id: `bridge-signal-${tx.id}`,
      type,
      sourceChain: tx.sourceChain,
      destChain: tx.destChain,
      token: tx.token,
      amount: tx.amount,
      usdValue: tx.usdValue,
      direction,
      confidence: Math.min(0.9, 0.5 + Math.log10(tx.usdValue / 100000) * 0.2),
      details,
      timestamp: tx.timestamp,
    };
  }

  /** Get chain flow summary */
  getChainFlow(chain: string, hours: number = 24): ChainFlow {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const relevant = this.transactions.filter(
      (tx) => (tx.sourceChain === chain || tx.destChain === chain) && tx.timestamp >= cutoff
    );

    let inflowAmount = 0;
    let inflowUsd = 0;
    let inflowCount = 0;
    let outflowAmount = 0;
    let outflowUsd = 0;
    let outflowCount = 0;
    const tokenFlows: Record<string, number> = {};
    const bridgeVolumes: Record<string, number> = {};

    for (const tx of relevant) {
      if (tx.destChain === chain) {
        inflowAmount += tx.amount;
        inflowUsd += tx.usdValue;
        inflowCount++;
        tokenFlows[tx.token] = (tokenFlows[tx.token] ?? 0) + tx.amount;
        bridgeVolumes[tx.bridge] = (bridgeVolumes[tx.bridge] ?? 0) + tx.usdValue;
      }
      if (tx.sourceChain === chain) {
        outflowAmount += tx.amount;
        outflowUsd += tx.usdValue;
        outflowCount++;
        tokenFlows[tx.token] = (tokenFlows[tx.token] ?? 0) - tx.amount;
      }
    }

    return {
      chain,
      period: `last ${hours}h`,
      inflow: { amount: inflowAmount, usdValue: inflowUsd, txCount: inflowCount },
      outflow: { amount: outflowAmount, usdValue: outflowUsd, txCount: outflowCount },
      netFlow: inflowAmount - outflowAmount,
      netFlowUsd: inflowUsd - outflowUsd,
      topTokens: Object.entries(tokenFlows)
        .map(([token, netFlow]) => ({ token, netFlow }))
        .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
        .slice(0, 5),
      topBridges: Object.entries(bridgeVolumes)
        .map(([bridge, volume]) => ({ bridge, volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5),
    };
  }

  /** Get cross-chain summary */
  getSummary(hours: number = 24): CrossChainSummary {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const relevant = this.transactions.filter((tx) => tx.timestamp >= cutoff);

    // Aggregate routes
    const routeVolumes: Record<string, { volume: number; count: number }> = {};
    for (const tx of relevant) {
      const route = `${tx.sourceChain}-${tx.destChain}`;
      if (!routeVolumes[route]) routeVolumes[route] = { volume: 0, count: 0 };
      routeVolumes[route].volume += tx.usdValue;
      routeVolumes[route].count++;
    }

    const topRoutes = Object.entries(routeVolumes)
      .map(([route, data]) => ({
        source: route.split('-')[0],
        dest: route.split('-')[1],
        volume: data.volume,
        txCount: data.count,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Chain rankings
    const chains = new Set(relevant.flatMap((tx) => [tx.sourceChain, tx.destChain]));
    const chainRankings = Array.from(chains).map((chain) => {
      const flow = this.getChainFlow(chain, hours);
      return {
        chain,
        netFlow: flow.netFlow,
        netFlowUsd: flow.netFlowUsd,
        signal: flow.netFlowUsd > 1000000 ? 'capital-inflow' : flow.netFlowUsd < -1000000 ? 'capital-outflow' : 'neutral',
      };
    }).sort((a, b) => b.netFlowUsd - a.netFlowUsd);

    return {
      period: `last ${hours}h`,
      totalVolume: relevant.reduce((sum, tx) => sum + tx.usdValue, 0),
      totalTransactions: relevant.length,
      topRoutes,
      chainRankings,
      signals: this.signals.filter((s) => s.timestamp >= cutoff).slice(0, 10),
    };
  }

  /** Get recent signals */
  getSignals(limit: number = 20): BridgeFlowSignal[] {
    return [...this.signals]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}
