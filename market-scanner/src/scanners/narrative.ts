import { ScannerSignal } from '../types.ts';

interface NarrativeData {
  name: string;
  tokenCount: number;
  totalVolume24h: number;
  avgPriceChange: number;
  tokens: string[];
  startTime: number;
}

export class NarrativeScanner {
  private activeNarratives: Map<string, NarrativeData> = new Map();
  private readonly MIN_TOKENS = 3;
  private readonly MIN_VOLUME = 100000;

  /**
   * Register a token as belonging to a narrative/category.
   */
  categorizeToken(tokenAddress: string, tokenSymbol: string, narrative: string): void {
    const existing = this.activeNarratives.get(narrative);
    if (existing) {
      if (!existing.tokens.includes(tokenAddress)) {
        existing.tokens.push(tokenAddress);
      }
    } else {
      this.activeNarratives.set(narrative, {
        name: narrative,
        tokenCount: 1,
        totalVolume24h: 0,
        avgPriceChange: 0,
        tokens: [tokenAddress],
        startTime: Date.now(),
      });
    }
  }

  /**
   * Update volume data for a narrative and check if it's trending.
   */
  updateVolume(narrative: string, volume24h: number, avgPriceChange: number): ScannerSignal | null {
    const data = this.activeNarratives.get(narrative);
    if (!data) return null;

    data.totalVolume24h = volume24h;
    data.avgPriceChange = avgPriceChange;
    data.tokenCount = data.tokens.length;

    // Require minimum tokens and volume to be considered a narrative
    if (data.tokenCount < this.MIN_TOKENS) return null;
    if (volume24h < this.MIN_VOLUME) return null;

    // Don't re-signal the same narrative within 1 hour
    const lastSignal = (data as any)._lastSignalTime || 0;
    if (Date.now() - lastSignal < 3600000) return null;
    (data as any)._lastSignalTime = Date.now();

    const confidence = Math.min(
      (data.tokenCount / 20) * 0.4 +
      (volume24h / 10000000) * 0.3 +
      (Math.abs(avgPriceChange) / 50) * 0.3,
      1
    );

    return {
      id: `nr-${narrative}-${Date.now()}`,
      type: 'narrative',
      chain: 'multi',
      tokenAddress: data.tokens[0],
      tokenSymbol: narrative,
      timestamp: Date.now(),
      confidence,
      metadata: {
        narrativeName: data.name,
        tokenCount: data.tokenCount,
        tokens: data.tokens,
        totalVolume24h: volume24h.toString(),
        avgPriceChange,
        ageHours: (Date.now() - data.startTime) / 3600000,
      },
    };
  }

  getActiveNarratives(): NarrativeData[] {
    return Array.from(this.activeNarratives.values());
  }
}
