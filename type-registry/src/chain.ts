export interface ChainInfo { chainId: number; name: string; symbol: string; decimals: number; rpcUrl: string; explorerUrl: string; isEvm: boolean; }
export interface Block { number: number; hash: string; timestamp: number; transactions: string[]; }
