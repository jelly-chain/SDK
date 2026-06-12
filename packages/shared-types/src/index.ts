/**
 * Shared Types across all JellyOS SDKs
 */
export enum ChainId {
  ETHEREUM = 1, ARBITRUM = 42161, POLYGON = 137, OPTIMISM = 10, BASE = 8453,
  SOLANA = 101, BSC = 56, AVALANCHE = 43114
}
export interface TokenRef { symbol: string; decimals: number; chainId: number; address?: string }
