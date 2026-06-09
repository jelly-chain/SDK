import { Memory, MemoryEntry } from './memory.js';
import { BrainDecision } from '../types.js';

export interface BrainConfig {
  strategy: 'momentum' | 'mean-reversion' | 'sentiment' | 'custom';
  confidenceThreshold?: number;
  riskTolerance?: number; // 0-1
}

export class Brain {
  private strategy: string;
  private confidenceThreshold: number;
  private riskTolerance: number;

  constructor(config: BrainConfig) {
    this.strategy = config.strategy;
    this.confidenceThreshold = config.confidenceThreshold || 0.6;
    this.riskTolerance = config.riskTolerance || 0.5;
  }

  /**
   * Make a decision based on observations and memory.
   */
  async decide(observations: unknown[], memory: Memory): Promise<BrainDecision> {
    // Weight observations by recency and confidence
    const recentMemory = memory.query({ type: 'decision' });
    const historicalBias = this.computeHistoricalBias(recentMemory);

    // Simple decision logic — production would use ML models
    const observation = observations[0] as Record<string, unknown>;
    const confidence = Number(observation?.confidence) || 0;

    if (confidence < this.confidenceThreshold) {
      return { action: 'hold', confidence, reason: 'Below confidence threshold' };
    }

    const signal = (observation?.signal as string) || 'neutral';
    const action = this.strategy === 'momentum'
      ? (signal === 'bullish' ? 'buy' : signal === 'bearish' ? 'sell' : 'hold')
      : signal === 'oversold' ? 'buy' : signal === 'overbought' ? 'sell' : 'hold';

    const decision: BrainDecision = {
      action,
      confidence,
      targetModule: this.selectModule(action),
      reason: `${this.strategy} strategy: ${signal} signal with ${confidence.toFixed(2)} confidence`,
      metadata: { historicalBias, signal, observations: observations.length },
    };

    return decision;
  }

  private computeHistoricalBias(entries: MemoryEntry[]): number {
    if (entries.length === 0) return 0;
    const recent = entries.slice(-10);
    let wins = 0;
    for (const entry of recent) {
      if ((entry.data as any)?.outcome === 'profit') wins++;
    }
    return wins / recent.length;
  }

  private selectModule(action: string): string {
    if (action === 'buy' || action === 'sell') return 'trading';
    if (action === 'scan') return 'scanning';
    return 'analyzing';
  }
}
