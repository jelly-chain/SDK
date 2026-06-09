import { DexConnectorConfig, DexName, Quote, QuoteRequest, SwapRequest, SwapResult, LiquidityPosition } from './types.js';
import { getDexesForChain, getDexConfig } from './router.js';
import { findBestQuote, calculateMinimumReceived, estimateSwapGas } from './quote.js';

export class DexConnector {
  private config: DexConnectorConfig;

  constructor(config: DexConnectorConfig) {
    this.config = config;
  }

  /**
   * Get quotes from all available DEXes on the chain.
   */
  async getQuotes(request: QuoteRequest): Promise<Quote[]> {
    const dexes = getDexesForChain(this.config.chainId);
    const quotes: Quote[] = [];

    for (const dex of dexes) {
      try {
        const quote = await this.getQuoteFromDex(dex.name, request);
        if (quote) quotes.push(quote);
      } catch {
        // Skip failed DEX quotes
      }
    }

    return quotes;
  }

  /**
   * Get the best quote across all DEXes.
   */
  async getBestQuote(request: QuoteRequest): Promise<Quote | null> {
    const quotes = await this.getQuotes(request);
    return findBestQuote(quotes);
  }

  /**
   * Execute a swap on the best available DEX.
   */
  async swap(request: SwapRequest): Promise<SwapResult> {
    const best = await this.getBestQuote(request);
    if (!best) throw new Error('No valid quote found');

    return this.executeSwap(best.dex, request);
  }

  /**
   * Get a quote from a specific DEX.
   */
  async getQuoteFromDex(dex: DexName, request: QuoteRequest): Promise<Quote | null> {
    const dexConfig = getDexConfig(this.config.chainId, dex);
    if (!dexConfig) return null;

    // Placeholder: production would call DEX-specific quoter contracts
    const mockAmountOut = (BigInt(request.amountIn) * 98n / 100n).toString(); // 2% slippage mock

    return {
      dex,
      chainId: this.config.chainId,
      tokenIn: { address: request.tokenIn, symbol: '???', decimals: 18, chainId: this.config.chainId },
      tokenOut: { address: request.tokenOut, symbol: '???', decimals: 18, chainId: this.config.chainId },
      amountIn: request.amountIn,
      amountOut: mockAmountOut,
      priceImpact: 0.5,
      slippage: request.slippage,
      route: [request.tokenIn, request.tokenOut],
      gasEstimate: estimateSwapGas(1, dexConfig.isV3),
      executionPrice: mockAmountOut,
      minimumReceived: calculateMinimumReceived(mockAmountOut, request.slippage),
    };
  }

  /**
   * Execute a swap on a specific DEX.
   */
  async executeSwap(dex: DexName, request: SwapRequest): Promise<SwapResult> {
    // Placeholder: production would build and sign DEX-specific calldata
    return {
      hash: `0x${Date.now().toString(16)}`,
      dex,
      chainId: this.config.chainId,
      amountIn: request.amountIn,
      amountOut: '0',
      gasUsed: '150000',
      status: 'pending',
    };
  }

  /**
   * Add liquidity to a DEX pool.
   */
  async addLiquidity(dex: DexName, tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<SwapResult> {
    return {
      hash: `0x${Date.now().toString(16)}`,
      dex, chainId: this.config.chainId,
      amountIn: amountA, amountOut: amountB,
      gasUsed: '200000', status: 'pending',
    };
  }

  /**
   * Remove liquidity from a DEX pool.
   */
  async removeLiquidity(dex: DexName, position: LiquidityPosition): Promise<SwapResult> {
    return {
      hash: `0x${Date.now().toString(16)}`,
      dex, chainId: this.config.chainId,
      amountIn: position.liquidity, amountOut: '0',
      gasUsed: '180000', status: 'pending',
    };
  }

  /**
   * Get all DEXes available on the current chain.
   */
  getAvailableDexes(): DexName[] {
    return getDexesForChain(this.config.chainId).map(d => d.name);
  }
}
