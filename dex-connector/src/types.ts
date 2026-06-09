export type DexName = 'uniswap_v2' | 'uniswap_v3' | 'raydium' | 'orca' | 'curve' | 'balancer' | 'pancakeswap' | 'camelot' | 'traderjoe';
export type ChainId = number;

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: ChainId;
}

export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number; // percentage, e.g. 0.5 = 0.5%
  recipient?: string;
  deadline?: number;
}

export interface Quote {
  dex: DexName;
  chainId: ChainId;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  priceImpact: number; // percentage
  slippage: number;
  route: string[]; // token addresses in path
  gasEstimate?: string;
  executionPrice: string;
  minimumReceived: string;
}

export interface SwapRequest extends QuoteRequest {
  recipient: string;
  deadline: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SwapResult {
  hash: string;
  dex: DexName;
  chainId: ChainId;
  amountIn: string;
  amountOut: string;
  gasUsed: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

export interface LiquidityPosition {
  dex: DexName;
  chainId: ChainId;
  tokenA: Token;
  tokenB: Token;
  liquidity: string;
  amountA: string;
  amountB: string;
  share: number; // percentage of pool
}

export interface DexConfig {
  name: DexName;
  chainId: ChainId;
  routerAddress: string;
  factoryAddress: string;
  quoterAddress?: string;
  isV3: boolean;
  isClmm: boolean;
  feeTiers?: number[];
}

export interface DexConnectorConfig {
  chainId: ChainId;
  rpcUrl: string;
  privateKey?: string;
  slippage?: number;
  deadline?: number;
}
