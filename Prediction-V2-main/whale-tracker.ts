/**
 * Whale Wallet Tracker
 * Monitor large on-chain movements as prediction signals.
 */

export interface WhaleTransaction {
  id: string;
  hash: string;
  chain: string;
  from: string;
  to: string;
  token: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  type: 'transfer' | 'swap' | 'deposit' | 'withdrawal' | 'bridge' | 'stake' | 'unstake';
  fromLabel?: string; // e.g. "Binance", "Wintermute"
  toLabel?: string;
}

export interface WhaleWallet {
  address: string;
  chain: string;
  label?: string;
  tags: string[]; // e.g. "exchange", "fund", "market-maker", "degen"
  holdings: Array<{
    token: string;
    amount: number;
    usdValue: number;
    percentOfPortfolio: number;
  }>;
  totalValue: number;
  lastActivity: string;
  performance?: {
    winRate: number;
    avgReturn: number;
    totalTrades: number;
  };
}

export interface WhaleSignal {
  id: string;
  type: 'accumulation' | 'distribution' | 'large-transfer' | 'exchange-flow' | 'new-position' | 'exit';
  token: string;
  chain: string;
  whaleAddress: string;
  whaleLabel?: string;
  amount: number;
  usdValue: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: string;
  details: string;
  historicalAccuracy?: number;
}

export interface WhaleFlowSummary {
  token: string;
  chain: string;
  period: string;
  inflow: { amount: number; usdValue: number; txCount: number };
  outflow: { amount: number; usdValue: number; txCount: number };
  netFlow: number;
  netFlowUsd: number;
  signal: 'accumulation' | 'distribution' | 'neutral';
  topWhales: Array<{ address: string; action: string; amount: number }>;
}

export class WhaleTracker {
  private transactions: WhaleTransaction[] = [];
  private wallets: Map<string, WhaleWallet> = new Map();
  private signals: WhaleSignal[] = [];

  /** Register a whale wallet for tracking */
  trackWallet(wallet: WhaleWallet): void {
    this.wallets.set(wallet.address.toLowerCase(), wallet);
  }

  /** Record a whale transaction */
  recordTransaction(tx: WhaleTransaction): void {
    this.transactions.push(tx);

    // Check if this creates a signal
    const signal = this.analyzeTransaction(tx);
    if (signal) {
      this.signals.push(signal);
    }
  }

  /** Analyze a transaction for signals */
  private analyzeTransaction(tx: WhaleTransaction): WhaleSignal | null {
    const fromWallet = this.wallets.get(tx.from.toLowerCase());
    const toWallet = this.wallets.get(tx.to.toLowerCase());

    // Only track known whale wallets
    if (!fromWallet && !toWallet) return null;

    const isExchangeDeposit = tx.toLabel?.toLowerCase().includes('exchange') ||
      tx.toLabel?.toLowerCase().includes('binance') ||
      tx.toLabel?.toLowerCase().includes('coinbase');

    const isExchangeWithdrawal = tx.fromLabel?.toLowerCase().includes('exchange') ||
      tx.fromLabel?.toLowerCase().includes('binance') ||
      tx.fromLabel?.toLowerCase().includes('coinbase');

    let signalType: WhaleSignal['type'] = 'large-transfer';
    let direction: WhaleSignal['direction'] = 'neutral';
    let details = '';

    // Exchange deposit = bearish (whale selling)
    if (isExchangeDeposit && tx.usdValue > 100000) {
      signalType = 'exchange-flow';
      direction = 'bearish';
      details = `Whale deposited $${(tx.usdValue / 1000).toFixed(0)}k ${tx.token} to exchange — potential sell`;
    }
    // Exchange withdrawal = bullish (whale buying)
    else if (isExchangeWithdrawal && tx.usdValue > 100000) {
      signalType = 'exchange-flow';
      direction = 'bullish';
      details = `Whale withdrew $${(tx.usdValue / 1000).toFixed(0)}k ${tx.token} from exchange — holding`;
    }
    // Large accumulation
    else if (toWallet && tx.usdValue > 500000) {
      signalType = 'accumulation';
      direction = 'bullish';
      details = `Known whale accumulated $${(tx.usdValue / 1000).toFixed(0)}k ${tx.token}`;
    }
    // Large distribution
    else if (fromWallet && tx.usdValue > 500000) {
      signalType = 'distribution';
      direction = 'bearish';
      details = `Known whale distributed $${(tx.usdValue / 1000).toFixed(0)}k ${tx.token}`;
    }

    if (!details) return null;

    return {
      id: `signal-${tx.id}`,
      type: signalType,
      token: tx.token,
      chain: tx.chain,
      whaleAddress: fromWallet ? tx.from : tx.to,
      whaleLabel: fromWallet?.label ?? toWallet?.label,
      amount: tx.amount,
      usdValue: tx.usdValue,
      direction,
      confidence: this.calculateConfidence(tx, fromWallet, toWallet),
      timestamp: tx.timestamp,
      details,
      historicalAccuracy: fromWallet?.performance?.winRate ?? toWallet?.performance?.winRate,
    };
  }

  /** Calculate signal confidence */
  private calculateConfidence(
    tx: WhaleTransaction,
    fromWallet?: WhaleWallet,
    toWallet?: WhaleWallet,
  ): number {
    let confidence = 0.5;

    // Higher value = higher confidence
    if (tx.usdValue > 1000000) confidence += 0.2;
    else if (tx.usdValue > 500000) confidence += 0.1;

    // Known wallet = higher confidence
    if (fromWallet?.performance?.winRate && fromWallet.performance.winRate > 0.6) {
      confidence += 0.15;
    }
    if (toWallet?.performance?.winRate && toWallet.performance.winRate > 0.6) {
      confidence += 0.15;
    }

    // Labeled wallet = higher confidence
    if (fromWallet?.label || toWallet?.label) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  /** Get flow summary for a token */
  getTokenFlow(token: string, hours: number = 24): WhaleFlowSummary {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const relevant = this.transactions.filter(
      (tx) => tx.token === token && tx.timestamp >= cutoff
    );

    let inflowAmount = 0;
    let inflowUsd = 0;
    let inflowCount = 0;
    let outflowAmount = 0;
    let outflowUsd = 0;
    let outflowCount = 0;

    for (const tx of relevant) {
      const toTracked = this.wallets.has(tx.to.toLowerCase());
      const fromTracked = this.wallets.has(tx.from.toLowerCase());

      if (toTracked) {
        inflowAmount += tx.amount;
        inflowUsd += tx.usdValue;
        inflowCount++;
      }
      if (fromTracked) {
        outflowAmount += tx.amount;
        outflowUsd += tx.usdValue;
        outflowCount++;
      }
    }

    const netFlow = inflowAmount - outflowAmount;
    const netFlowUsd = inflowUsd - outflowUsd;

    return {
      token,
      chain: relevant[0]?.chain ?? 'unknown',
      period: `last ${hours}h`,
      inflow: { amount: inflowAmount, usdValue: inflowUsd, txCount: inflowCount },
      outflow: { amount: outflowAmount, usdValue: outflowUsd, txCount: outflowCount },
      netFlow,
      netFlowUsd,
      signal: netFlow > 0 ? 'accumulation' : netFlow < 0 ? 'distribution' : 'neutral',
      topWhales: [], // Would aggregate from transactions
    };
  }

  /** Get recent signals */
  getSignals(token?: string, limit: number = 20): WhaleSignal[] {
    let filtered = [...this.signals];
    if (token) filtered = filtered.filter((s) => s.token === token);
    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /** Get tracked wallets */
  getTrackedWallets(): WhaleWallet[] {
    return Array.from(this.wallets.values());
  }
}
