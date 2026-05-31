import type { SettlementInfo, PredictionProtocolMarket } from './types.js';

export class SettlementAnalyzer {
  /** Analyze settlement status across protocols */
  async analyzeSettlement(
    market: PredictionProtocolMarket,
    gnosisPayout?: number,
    augurPayout?: number,
  ): Promise<SettlementInfo> {
    const status: SettlementInfo['status'] = market.resolved ? 'settled' : 'pending';

    let payoutPerShare = 0;
    if (market.protocol === 'gnosis' && gnosisPayout !== undefined) {
      payoutPerShare = gnosisPayout;
    } else if (market.protocol === 'augur' && augurPayout !== undefined) {
      payoutPerShare = augurPayout;
    }

    return {
      marketId: market.id,
      protocol: market.protocol,
      status,
      winningOutcome: market.winningOutcome,
      settlementTime: market.resolved ? new Date().toISOString() : undefined,
      oracleAddress: market.oracle,
      payoutPerShare,
    };
  }

  /** Compare settlement across protocols for same market */
  compareSettlements(settlements: SettlementInfo[]): {
    consistent: boolean;
    discrepancies: string[];
    recommendation: string;
  } {
    if (settlements.length < 2) {
      return { consistent: true, discrepancies: [], recommendation: 'Single source — no comparison available' };
    }

    const winners = settlements.map((s) => s.winningOutcome).filter(Boolean);
    const uniqueWinners = new Set(winners);
    const consistent = uniqueWinners.size <= 1;

    const discrepancies: string[] = [];
    if (!consistent) {
      discrepancies.push('Different protocols settled to different outcomes');
    }

    return {
      consistent,
      discrepancies,
      recommendation: consistent
        ? 'Settlements consistent — safe to proceed'
        : 'WARNING: Settlements conflict — investigate before acting',
    };
  }

  /** Estimate payout for a position */
  estimatePayout(params: {
    shares: number;
    price: number;
    outcome: string;
    resolved: boolean;
    winningOutcome?: string;
    protocolFees: number;
  }): {
    cost: number;
    potentialPayout: number;
    profit: number;
    roi: number;
  } {
    const cost = params.shares * params.price;
    const payout = params.resolved && params.winningOutcome === params.outcome ? params.shares : 0;
    const fees = payout * params.protocolFees;
    const profit = payout - cost - fees;

    return {
      cost: Math.round(cost * 100) / 100,
      potentialPayout: Math.round(payout * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      roi: cost > 0 ? Math.round((profit / cost) * 10000) / 100 : 0,
    };
  }
}
