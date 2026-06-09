import { Quote, QuoteRequest, Token } from '../types.js';

/**
 * Find the best quote across multiple DEXes.
 */
export function findBestQuote(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((best, current) =>
    BigInt(current.amountOut) > BigInt(best.amountOut) ? current : best
  );
}

/**
 * Calculate price impact: (executionPrice - marketPrice) / marketPrice * 100
 */
export function calculatePriceImpact(amountIn: string, amountOut: string, marketPrice: string): number {
  const execPrice = Number(amountOut) / Number(amountIn);
  const impact = ((execPrice - Number(marketPrice)) / Number(marketPrice)) * 100;
  return Math.abs(impact);
}

/**
 * Calculate minimum received amount after slippage.
 */
export function calculateMinimumReceived(amountOut: string, slippagePercent: number): string {
  const amount = BigInt(amountOut);
  const basisPoints = BigInt(Math.round(slippagePercent * 100));
  const minReceived = amount - (amount * basisPoints) / 10000n;
  return minReceived.toString();
}

/**
 * Build a multi-hop route through intermediate tokens.
 */
export function buildRoute(tokenIn: string, intermediates: string[], tokenOut: string): string[] {
  return [tokenIn, ...intermediates, tokenOut];
}

/**
 * Estimate gas for a swap based on route complexity.
 */
export function estimateSwapGas(hops: number, isV3: boolean): string {
  const baseGas = isV3 ? 180000 : 120000;
  const perHop = isV3 ? 60000 : 40000;
  return (baseGas + perHop * hops).toString();
}

/**
 * Sort quotes by output amount (best first).
 */
export function sortQuotesByOutput(quotes: Quote[]): Quote[] {
  return [...quotes].sort((a, b) => (BigInt(b.amountOut) > BigInt(a.amountOut) ? 1 : -1));
}

/**
 * Filter quotes by maximum acceptable price impact.
 */
export function filterByPriceImpact(quotes: Quote[], maxImpact: number): Quote[] {
  return quotes.filter(q => q.priceImpact <= maxImpact);
}
