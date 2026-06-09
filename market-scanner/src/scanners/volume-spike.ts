import { ScannerSignal, VolumeSpikeMetadata } from '../types.js';

export class VolumeSpikeScanner {
  private history: Map<string, number[]> = new Map();

  constructor(private threshold: number = 3.0) {}

  /**
   * Analyze volume data and detect spikes.
   * A spike is defined as current volume > threshold * rolling average.
   */
  analyze(tokenAddress: string, volume24h: number, priceChange24h: number): ScannerSignal | null {
    const history = this.history.get(tokenAddress) || [];
    history.push(volume24h);

    // Keep last 7 data points
    if (history.length > 7) history.shift();
    this.history.set(tokenAddress, history);

    if (history.length < 3) return null; // Need minimum data

    const avg = history.slice(0, -1).reduce((a, b) => a + b, 0) / (history.length - 1);
    if (avg === 0) return null;

    const multiplier = volume24h / avg;
    if (multiplier < this.threshold) return null;

    const metadata: VolumeSpikeMetadata = {
      volume24h: volume24h.toString(),
      volumeAvg7d: avg.toString(),
      spikeMultiplier: multiplier,
      priceChange24h,
    };

    return {
      id: `vs-${tokenAddress}-${Date.now()}`,
      type: 'volumeSpike',
      chain: 'ethereum', // Would be dynamic
      tokenAddress,
      tokenSymbol: '???',
      timestamp: Date.now(),
      confidence: Math.min(multiplier / (this.threshold * 2), 1),
      metadata,
    };
  }

  /**
   * Clear history for a token.
   */
  reset(tokenAddress: string): void {
    this.history.delete(tokenAddress);
  }
}
