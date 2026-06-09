// chain-connector/src/types.ts

export type ChainId =
  | 'ethereum' | 'bnb' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
  | 'avalanche' | 'cronos' | 'solana' | 'bitcoin' | 'dogecoin'
  | 'litecoin' | 'xrp' | 'polkadot' | 'sui' | 'ton'
  | 'fantom' | 'gnosis' | 'celo' | 'harmony';

export interface RpcEndpoint {
  url: string;
  weight: number;
  isWs?: boolean;
  rateLimitPerSecond: number;
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  rpc: RpcEndpoint[];
  nativeSymbol: string;
  nativeDecimals: number;
  chainIdNumeric: number;
  isEvm: boolean;
  isSolana: boolean;
  isUtxo: boolean;
  blockTimeMs: number;
}

export interface Balance {
  value: string;
  decimals: number;
  symbol: string;
  usdValue?: string;
}

export interface TokenBalance extends Balance {
  contractAddress: string;
  name: string;
}

export interface TransactionRequest {
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  confirmations: number;
}

export interface ConnectorConfig {
  [chainId: string]: {
    rpc: string[];
    ws?: string[];
    timeout?: number;
    retries?: number;
  };
}

export interface RpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}
