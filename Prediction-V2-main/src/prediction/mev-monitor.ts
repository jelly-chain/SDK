/**
 * MEV Activity Monitor
 * Sandwich attacks and frontrunning as market microstructure signals.
 */

export interface MEVTransaction {
  id: string;
  hash: string;
  chain: string;
  block: number;
  timestamp: string;
  type: 'sandwich' | 'frontrun' | 'backrun' | 'liquidation' | 'arbitrage' | 'jit';
  attacker: string;
  victim?: string;
  token: string;
  profitUsd: number;
  gasUsed: number;
  gasPrice: number;
  details: {
    targetTx?: string;
    profitToken?: string;
    profitAmount?: number;
    slippage?: number;
    poolAddress?: string;
  };
}

export interface MEVStats {
  chain: string;
  token: string;
  period: string;
  totalAttacks: number;
  totalProfit: number;
  avgProfit: number;
  topAttackers: Array<{ address: string; profit: number; count: number }>;
  attackTypes: Record<string, number>;
  mostTargetedPools: string[];
}

export interface MEVSignal {
  token: string;
  chain: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  attackFrequency: number; // attacks per hour
  avgLossPerTrade: number;
  recommendation: string;
  factors: string[];
}

export interface SandwichDetection {
  isSandwich: boolean;
  frontrunTx: string;
  backrunTx: string;
  victimTx: string;
  profit: number;
  slippage: number;
  token: string;
}

export class MEVMonitor {
  private transactions: MEVTransaction[] = [];
  private alerts: Array<{ token: string; message: string; severity: string; timestamp: string }> = [];

  /** Record an MEV transaction */
  record(tx: MEVTransaction): void {
    this.transactions.push(tx);

    // Check for concerning patterns
    this.checkPatterns(tx);
  }

  /** Record multiple transactions */
  recordMany(txs: MEVTransaction[]): void {
    for (const tx of txs) this.record(tx);
  }

  /** Check for concerning patterns */
  private checkPatterns(tx: MEVTransaction): void {
    // High-profit sandwich
    if (tx.type === 'sandwich' && tx.profitUsd > 10000) {
      this.alerts.push({
        token: tx.token,
        message: `High-profit sandwich attack: $${tx.profitUsd.toFixed(0)} extracted`,
        severity: 'warning',
        timestamp: tx.timestamp,
      });
    }

    // Frequent attacks on same token
    const recentTokenAttacks = this.transactions.filter(
      (t) => t.token === tx.token &&
        new Date(t.timestamp).getTime() > Date.now() - 60 * 60 * 1000
    );
    if (recentTokenAttacks.length > 10) {
      this.alerts.push({
        token: tx.token,
        message: `High MEV activity: ${recentTokenAttacks.length} attacks in last hour`,
        severity: 'critical',
        timestamp: tx.timestamp,
      });
    }
  }

  /** Detect sandwich attack pattern */
  detectSandwich(
    frontrunHash: string,
    victimHash: string,
    backrunHash: string,
    token: string,
    profit: number,
    slippage: number,
  ): SandwichDetection {
    return {
      isSandwich: true,
      frontrunTx: frontrunHash,
      backrunTx: backrunHash,
      victimTx: victimHash,
      profit,
      slippage,
      token,
    };
  }

  /** Get MEV stats for a token */
  getTokenStats(token: string, hours: number = 24): MEVStats {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const relevant = this.transactions.filter(
      (tx) => tx.token === token && tx.timestamp >= cutoff
    );

    const totalProfit = relevant.reduce((sum, tx) => sum + tx.profitUsd, 0);
    const avgProfit = relevant.length > 0 ? totalProfit / relevant.length : 0;

    // Top attackers
    const attackerProfits: Record<string, { profit: number; count: number }> = {};
    for (const tx of relevant) {
      if (!attackerProfits[tx.attacker]) attackerProfits[tx.attacker] = { profit: 0, count: 0 };
      attackerProfits[tx.attacker].profit += tx.profitUsd;
      attackerProfits[tx.attacker].count++;
    }
    const topAttackers = Object.entries(attackerProfits)
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Attack types
    const attackTypes: Record<string, number> = {};
    for (const tx of relevant) {
      attackTypes[tx.type] = (attackTypes[tx.type] ?? 0) + 1;
    }

    return {
      chain: relevant[0]?.chain ?? 'unknown',
      token,
      period: `last ${hours}h`,
      totalAttacks: relevant.length,
      totalProfit,
      avgProfit,
      topAttackers,
      attackTypes,
      mostTargetedPools: [], // Would aggregate from details
    };
  }

  /** Get MEV signal for a token */
  getSignal(token: string): MEVSignal {
    const stats = this.getTokenStats(token);
    const attacksPerHour = stats.totalAttacks / 24;
    const avgLoss = stats.avgProfit;

    let riskLevel: MEVSignal['riskLevel'] = 'low';
    if (attacksPerHour > 5) riskLevel = 'extreme';
    else if (attacksPerHour > 2) riskLevel = 'high';
    else if (attacksPerHour > 0.5) riskLevel = 'medium';

    const factors: string[] = [];
    if (stats.attackTypes['sandwich'] && stats.attackTypes['sandwich'] > 0) {
      factors.push(`${stats.attackTypes['sandwich']} sandwich attacks detected`);
    }
    if (stats.attackTypes['frontrun'] && stats.attackTypes['frontrun'] > 0) {
      factors.push(`${stats.attackTypes['frontrun']} frontrunning attacks detected`);
    }
    if (avgLoss > 1000) {
      factors.push(`Average loss per attack: $${avgLoss.toFixed(0)}`);
    }

    let recommendation = '';
    if (riskLevel === 'extreme') {
      recommendation = 'High MEV risk — use private RPCs, set tight slippage, consider MEV protection';
    } else if (riskLevel === 'high') {
      recommendation = 'Elevated MEV activity — set slippage to 0.5% or less';
    } else if (riskLevel === 'medium') {
      recommendation = 'Moderate MEV activity — standard precautions';
    } else {
      recommendation = 'Low MEV risk — normal trading conditions';
    }

    return {
      token,
      chain: stats.chain,
      riskLevel,
      attackFrequency: Math.round(attacksPerHour * 10) / 10,
      avgLossPerTrade: Math.round(avgLoss),
      recommendation,
      factors,
    };
  }

  /** Get alerts */
  getAlerts(token?: string): Array<{ token: string; message: string; severity: string; timestamp: string }> {
    if (token) return this.alerts.filter((a) => a.token === token);
    return [...this.alerts];
  }

  /** Scan all tokens for MEV risk */
  scanForHighRisk(): MEVSignal[] {
    const tokens = new Set(this.transactions.map((tx) => tx.token));
    return Array.from(tokens)
      .map((token) => this.getSignal(token))
      .filter((s) => s.riskLevel === 'high' || s.riskLevel === 'extreme')
      .sort((a, b) => b.attackFrequency - a.attackFrequency);
  }
}
