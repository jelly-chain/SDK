import { ScannerSignal, NewListingMetadata } from '../types.js';

export class NewListingScanner {
  private knownPairs: Set<string> = new Set();
  private readonly DEX_FACTORIES: Record<string, string> = {
    uniswap_v2: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    uniswap_v3: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    pancakeswap: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  };

  /**
   * Check if a pair is newly listed (not in known set).
   */
  detect(chain: string, dex: string, tokenA: string, tokenB: string, liquidityUsd: number, blockNumber: number): ScannerSignal | null {
    const pairKey = `${chain}:${dex}:${tokenA}/${tokenB}`;
    if (this.knownPairs.has(pairKey)) return null;

    this.knownPairs.add(pairKey);

    // Only signal if there's meaningful liquidity
    if (liquidityUsd < 1000) return null;

    const metadata: NewListingMetadata = {
      dex,
      pair: `${tokenA}/${tokenB}`,
      initialLiquidityUsd: liquidityUsd.toString(),
      blockNumber,
    };

    return {
      id: `nl-${pairKey}-${blockNumber}`,
      type: 'newListing',
      chain,
      tokenAddress: tokenA,
      tokenSymbol: '???',
      timestamp: Date.now(),
      confidence: Math.min(liquidityUsd / 50000, 1),
      metadata,
    };
  }

  /**
   * Get the known pair count (useful for monitoring).
   */
  getKnownPairCount(): number {
    return this.knownPairs.size;
  }

  /**
   * Register a pair as known without signaling.
   */
  registerPair(chain: string, dex: string, tokenA: string, tokenB: string): void {
    this.knownPairs.add(`${chain}:${dex}:${tokenA}/${tokenB}`);
  }
}
