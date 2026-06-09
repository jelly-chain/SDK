import { IndexedRecord, IndexerConfig } from "../types.js";
export class SwapIndexer { constructor(private config: IndexerConfig) {} async index(fromBlock: number, toBlock: number): Promise<IndexedRecord[]> { return []; } async getSwaps(token: string, limit = 100): Promise<IndexedRecord[]> { return []; } }
