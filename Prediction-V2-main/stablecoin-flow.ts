/**
 * Stablecoin Flow Analyzer
 * USDC/USDT moving to exchanges = buying pressure.
 */

export interface StablecoinTransfer {
  id: string;
  hash: string;
  token: 'USDC' | 'USDT' | 'DAI' | 'FRAX' | 'TUSD' | 'BUSD';
  chain: string;
  from: string;
  to: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  fromLabel?: string; // e.g. "Binance", "Circle", "Treasury"
  toLabel?: string;
}

export interface ExchangeFlow {
  exchange: string;
  token: string;
  period: string;
  inflow: { amount: number; txCount: number };
  outflow: { amount: number; txCount: number };
  netFlow: number;
  signal: 'buying-pressure' | 'selling-pressure' | 'neutral';
}

export interface StablecoinMetrics {
  token: string;
  chain: string;
  totalSupply: number;
  circulatingSupply: number;
  dailyVolume: number;
  dailyTransferCount: number;
  avgTransferSize: number;
  whaleTransfers: number; // >$100k
  exchangeReserves: number;
  treasuryBalance: number;
}

export interface StablecoinSignal {
  token: string;
  signal: 'buying-pressure' | 'selling-pressure' | 'neutral' | 'de-peg-risk';
  confidence: number;
  details: string;
  exchangeFlow: number;
  mintBurn: number;
  whaleActivity: string;
}

export class StablecoinFlowAnalyzer {
  private transfers: StablecoinTransfer[] = [];
  private metrics: Map<string, StablecoinMetrics> = new Map();

  /** Record a stablecoin transfer */
  record(transfer: StablecoinTransfer): void {
    this.transfers.push(transfer);
  }

  /** Record multiple transfers */
  recordMany(transfers: StablecoinTransfer[]): void {
    this.transfers.push(...transfers);
  }

  /** Set metrics for a stablecoin */
  setMetrics(token: string, metrics: StablecoinMetrics): void {
    this.metrics.set(token, metrics);
  }

  /** Get exchange flow for a period */
  getExchangeFlow(exchange: string, token: string, hours: number = 24): ExchangeFlow {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const relevant = this.transfers.filter(
      (t) => t.token === token && t.timestamp >= cutoff &&
        (t.fromLabel?.toLowerCase().includes(exchange.toLowerCase()) ||
         t.toLabel?.toLowerCase().includes(exchange.toLowerCase()))
    );

    let inflow = 0;
    let inflowCount = 0;
    let outflow = 0;
    let outflowCount = 0;

    for (const tx of relevant) {
      if (tx.toLabel?.toLowerCase().includes(exchange.toLowerCase())) {
        inflow += tx.usdValue;
        inflowCount++;
      }
      if (tx.fromLabel?.toLowerCase().includes(exchange.toLowerCase())) {
        outflow += tx.usdValue;
        outflowCount++;
      }
    }

    const netFlow = inflow - outflow;
    const signal: ExchangeFlow['signal'] =
      netFlow > 1000000 ? 'buying-pressure' :
      netFlow < -1000000 ? 'selling-pressure' : 'neutral';

    return {
      exchange,
      token,
      period: `last ${hours}h`,
      inflow: { amount: inflow, txCount: inflowCount },
      outflow: { amount: outflow, txCount: outflowCount },
      netFlow,
      signal,
    };
  }

  /** Get stablecoin signal */
  getSignal(token: string): StablecoinSignal {
    const metrics = this.metrics.get(token);

    // Aggregate exchange flows
    const exchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
    let totalNetFlow = 0;
    for (const exchange of exchanges) {
      const flow = this.getExchangeFlow(exchange, token);
      totalNetFlow += flow.netFlow;
    }

    // Whale activity
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const whaleTransfers = this.transfers.filter(
      (t) => t.token === token && t.timestamp >= cutoff24h && t.usdValue > 100000
    );

    let signal: StablecoinSignal['signal'] = 'neutral';
    let details = '';

    // Large exchange inflows = buying pressure
    if (totalNetFlow > 10000000) {
      signal = 'buying-pressure';
      details = `$${(totalNetFlow / 1000000).toFixed(1)}M net inflow to exchanges — expect buying pressure`;
    }
    // Large exchange outflows = selling/hodling
    else if (totalNetFlow < -10000000) {
      signal = 'selling-pressure';
      details = `$${(Math.abs(totalNetFlow) / 1000000).toFixed(1)}M net outflow from exchanges — selling or cold storage`;
    }
    else {
      details = `Balanced flow: $${(totalNetFlow / 1000000).toFixed(1)}M net`;
    }

    // Check for de-peg risk
    if (metrics && Math.abs(metrics.totalSupply - metrics.circulatingSupply) > metrics.totalSupply * 0.1) {
      signal = 'de-peg-risk';
      details += ' — Warning: supply mismatch detected';
    }

    return {
      token,
      signal,
      confidence: 0.7,
      details,
      exchangeFlow: totalNetFlow,
      mintBurn: 0, // Would need mint/burn data
      whaleActivity: whaleTransfers.length > 0
        ? `${whaleTransfers.length} whale transfer(s) totaling $${(whaleTransfers.reduce((s, t) => s + t.usdValue, 0) / 1000000).toFixed(1)}M`
        : 'No significant whale activity',
    };
  }

  /** Scan all stablecoins for signals */
  scanForSignals(): StablecoinSignal[] {
    const tokens = new Set(this.transfers.map((t) => t.token));
    return Array.from(tokens)
      .map((token) => this.getSignal(token))
      .filter((s) => s.signal !== 'neutral');
  }

  /** Get aggregate market signal from all stablecoins */
  getMarketSignal(): {
    overallSignal: 'buying-pressure' | 'selling-pressure' | 'neutral';
    totalExchangeInflow: number;
    totalExchangeOutflow: number;
    details: string;
  } {
    const tokens = new Set(this.transfers.map((t) => t.token));
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const token of tokens) {
      const exchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
      for (const exchange of exchanges) {
        const flow = this.getExchangeFlow(exchange, token);
        totalInflow += flow.inflow.amount;
        totalOutflow += flow.outflow.amount;
      }
    }

    const netFlow = totalInflow - totalOutflow;
    const overallSignal: 'buying-pressure' | 'selling-pressure' | 'neutral' =
      netFlow > 50000000 ? 'buying-pressure' :
      netFlow < -50000000 ? 'selling-pressure' : 'neutral';

    return {
      overallSignal,
      totalExchangeInflow: totalInflow,
      totalExchangeOutflow: totalOutflow,
      details: overallSignal === 'buying-pressure'
        ? `Net $${(netFlow / 1000000).toFixed(0)}M stablecoins flowing to exchanges — bullish`
        : overallSignal === 'selling-pressure'
          ? `Net $${(Math.abs(netFlow) / 1000000).toFixed(0)}M stablecoins leaving exchanges — bearish`
          : 'Balanced stablecoin flows',
    };
  }
}
