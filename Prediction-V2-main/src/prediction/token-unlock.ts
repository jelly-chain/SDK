/**
 * Token Unlock Schedule Integration
 * Vesting cliffs create predictable sell pressure.
 */

export interface TokenUnlockEvent {
  id: string;
  token: string;
  chain: string;
  date: string;
  amount: number;
  usdValue: number;
  recipient: string; // e.g. "team", "investors", "ecosystem", "advisors"
  percentOfSupply: number;
  percentOfCirculating: number;
  isCliff: boolean; // True if this is a cliff unlock (large, one-time)
  vestingContract?: string;
}

export interface UnlockSchedule {
  token: string;
  chain: string;
  totalSupply: number;
  circulatingSupply: number;
  percentUnlocked: number;
  events: TokenUnlockEvent[];
  nextUnlock?: TokenUnlockEvent;
  upcoming30Days: TokenUnlockEvent[];
  upcoming90Days: TokenUnlockEvent[];
}

export interface UnlockImpact {
  event: TokenUnlockEvent;
  estimatedSellPressure: number; // 0-1
  estimatedPriceImpact: number; // % change
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  historicalComparison?: {
    token: string;
    unlockDate: string;
    priceChange7d: number;
    priceChange30d: number;
  };
}

export interface UnlockSignal {
  token: string;
  signal: 'sell-pressure' | 'neutral' | 'accumulation-opportunity';
  confidence: number;
  details: string;
  nextUnlockDate?: string;
  nextUnlockAmount?: number;
  nextUnlockPercent?: number;
}

const RECIPIENT_SELL_RATES: Record<string, number> = {
  'team': 0.15, // Teams sell ~15% of unlocks
  'investors': 0.40, // Investors sell ~40% of unlocks
  'ecosystem': 0.10, // Ecosystem funds sell ~10%
  'advisors': 0.30, // Advisors sell ~30%
  'treasury': 0.05, // Treasury sells ~5%
  'airdrop': 0.60, // Airdrop recipients sell ~60%
  'staking': 0.05, // Staking rewards mostly held
  'liquidity': 0.00, // Liquidity provision
};

export class TokenUnlockAnalyzer {
  private schedules: Map<string, UnlockSchedule> = new Map();

  /** Register an unlock schedule */
  addSchedule(schedule: UnlockSchedule): void {
    this.schedules.set(schedule.token, schedule);
  }

  /** Add an unlock event */
  addEvent(event: TokenUnlockEvent): void {
    const existing = this.schedules.get(event.token);
    if (existing) {
      existing.events.push(event);
      existing.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.updateDerivedFields(existing);
    }
  }

  /** Get unlock schedule for a token */
  getSchedule(token: string): UnlockSchedule | undefined {
    return this.schedules.get(token);
  }

  /** Analyze impact of an unlock event */
  analyzeImpact(event: TokenUnlockEvent): UnlockImpact {
    const sellRate = RECIPIENT_SELL_RATES[event.recipient] ?? 0.2;
    const estimatedSellPressure = sellRate * event.percentOfCirculating;

    // Price impact estimation
    // Simple model: 1% of circulating sold = ~2% price impact
    const estimatedPriceImpact = -(estimatedSellPressure * 200);

    // Risk level
    const riskLevel: UnlockImpact['riskLevel'] =
      event.percentOfCirculating > 5 ? 'critical' :
      event.percentOfCirculating > 2 ? 'high' :
      event.percentOfCirculating > 0.5 ? 'medium' : 'low';

    // Factors
    const factors: string[] = [];
    if (event.isCliff) factors.push('Cliff unlock — large one-time release');
    if (event.recipient === 'investors') factors.push('Investor unlock — higher sell likelihood');
    if (event.recipient === 'team') factors.push('Team unlock — may be OTC deal');
    if (event.percentOfCirculating > 3) factors.push('Significant % of circulating supply');
    factors.push(`Estimated ${sellRate * 100}% sell rate for ${event.recipient}`);

    return {
      event,
      estimatedSellPressure: Math.round(estimatedSellPressure * 100) / 100,
      estimatedPriceImpact: Math.round(estimatedPriceImpact * 100) / 100,
      riskLevel,
      factors,
    };
  }

  /** Get signal for a token */
  getSignal(token: string): UnlockSignal {
    const schedule = this.schedules.get(token);
    if (!schedule) {
      return { token, signal: 'neutral', confidence: 0, details: 'No unlock data available' };
    }

    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcoming = schedule.events.filter(
      (e) => new Date(e.date) > now && new Date(e.date) <= next30Days
    );

    if (upcoming.length === 0) {
      return {
        token,
        signal: 'neutral',
        confidence: 0.7,
        details: 'No unlocks in next 30 days',
      };
    }

    const nextUnlock = upcoming[0];
    const totalUnlockPercent = upcoming.reduce((sum, e) => sum + e.percentOfCirculating, 0);

    let signal: UnlockSignal['signal'] = 'neutral';
    let details = '';

    if (totalUnlockPercent > 3) {
      signal = 'sell-pressure';
      details = `${totalUnlockPercent.toFixed(1)}% of circulating supply unlocking in 30 days — expect sell pressure`;
    } else if (totalUnlockPercent > 1) {
      signal = 'sell-pressure';
      details = `${totalUnlockPercent.toFixed(1)}% unlocking — moderate sell pressure expected`;
    } else {
      details = `Minor unlock: ${totalUnlockPercent.toFixed(1)}% — limited impact`;
    }

    return {
      token,
      signal,
      confidence: 0.75,
      details,
      nextUnlockDate: nextUnlock.date,
      nextUnlockAmount: nextUnlock.amount,
      nextUnlockPercent: nextUnlock.percentOfCirculating,
    };
  }

  /** Scan all tokens for upcoming sell pressure */
  scanForSellPressure(days: number = 30, minPercent: number = 1): UnlockSignal[] {
    const results: UnlockSignal[] = [];
    for (const token of this.schedules.keys()) {
      const signal = this.getSignal(token);
      if (signal.signal === 'sell-pressure' && (signal.nextUnlockPercent ?? 0) >= minPercent) {
        results.push(signal);
      }
    }
    return results.sort((a, b) => (b.nextUnlockPercent ?? 0) - (a.nextUnlockPercent ?? 0));
  }

  private updateDerivedFields(schedule: UnlockSchedule): void {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    schedule.nextUnlock = schedule.events.find((e) => new Date(e.date) > now);
    schedule.upcoming30Days = schedule.events.filter(
      (e) => new Date(e.date) > now && new Date(e.date) <= in30Days
    );
    schedule.upcoming90Days = schedule.events.filter(
      (e) => new Date(e.date) > now && new Date(e.date) <= in90Days
    );
    schedule.percentUnlocked = 1 - (schedule.totalSupply - schedule.circulatingSupply) / schedule.totalSupply;
  }
}
