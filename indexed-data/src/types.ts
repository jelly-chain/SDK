export type IndexerType = "transfers" | "swaps" | "approvals" | "blocks";
export interface IndexerConfig { chain: string; rpcUrl: string; batchSize: number; startBlock?: number; }
export interface IndexedRecord { id: string; type: IndexerType; chain: string; blockNumber: number; txHash: string; timestamp: number; data: unknown; }
