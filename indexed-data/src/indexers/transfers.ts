import { IndexedRecord, IndexerConfig } from "../types.js";
export class TransferIndexer { constructor(private config: IndexerConfig) {} async index(fromBlock: number, toBlock: number): Promise<IndexedRecord[]> { return []; } async getTransfers(address: string, limit = 100): Promise<IndexedRecord[]> { return []; } }
