import type { MarketSignal, SignalDirection, ChainId } from '../types.js';

export class SignalGenerator {
  generate(
    direction: SignalDirection,
    confidence: number,
    chain: ChainId,
    source: string,
    token?: string,
  ): MarketSignal {
    return {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source,
      direction,
      strength: confidence,
      confidence,
      chain,
      token,
      timestamp: new Date().toISOString(),
    };
  }

  generateMany(
    inputs: Array<{ direction: SignalDirection; confidence: number; chain: ChainId; source: string; token?: string }>,
  ): MarketSignal[] {
    return inputs.map((i) => this.generate(i.direction, i.confidence, i.chain, i.source, i.token));
  }
}
