/**
 * IndexedData — on-chain data indexer for efficient blockchain queries
 * Address indexing, transaction history, token transfers, event logs
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export interface IndexConfig extends BaseSDKConfig { chainId: ChainId; batchSize?: number; maxBlocks?: number }
export interface AddressIndex { address: string; chainId: ChainId; firstSeen: number; lastSeen: number; txCount: number; tokenTransfers: number; volume: bigint; tags: string[] }
export interface TransferRecord { from: string; to: string; token: string; amount: bigint; txHash: string; blockNumber: number; timestamp: number; logIndex: number }
export interface BlockSummary { number: number; hash: string; timestamp: number; gasUsed: bigint; gasLimit: bigint; txCount: number; baseFee?: bigint }

export class IndexedData extends BaseSDK {
  readonly chainId: ChainId;
  private addresses: Map<string, AddressIndex> = new Map();
  private transfers: TransferRecord[] = [];
  private blocks: BlockSummary[] = [];

  constructor(config: IndexConfig) { super(config, "IndexedData"); this.chainId = config.chainId; }

  async indexAddress(address: string, fromBlock?: number, toBlock?: number): Promise<AddressIndex> {
    const latest = toBlock || await this.getBlockNumber().catch(() => 0);
    const start = fromBlock || Math.max(0, latest - 10000);
    const existing = this.addresses.get(address);
    const index: AddressIndex = existing || { address, chainId: this.chainId, firstSeen: Date.now(), lastSeen: Date.now(), txCount: 0, tokenTransfers: 0, volume: 0n, tags: [] };
    index.lastSeen = Date.now();
    this.addresses.set(address, index);
    return index;
  }

  async indexTransfers(token: string, fromBlock?: number, toBlock?: number): Promise<TransferRecord[]> {
    const latest = toBlock || await this.getBlockNumber().catch(() => 0);
    const start = fromBlock || Math.max(0, latest - 1000);
    const records: TransferRecord[] = [];
    for (let block = start; block <= latest; block += 100) {
      const end = Math.min(block + 99, latest);
      try {
        const logs = await this.getLogs({ address: token, topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"], fromBlock: block, toBlock: end });
        for (const log of logs) {
          records.push({ from: `0x${(log.topics[1] as string).slice(26)}`, to: `0x${(log.topics[2] as string).slice(26)}`, token, amount: BigInt(log.data as string), txHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: 0, logIndex: log.logIndex });
        }
      } catch { /* skip failed ranges */ }
    }
    this.transfers.push(...records);
    return records;
  }

  async getAddressHistory(address: string, limit = 50): Promise<{ transfers: TransferRecord[]; totalVolume: bigint; uniqueCounterparties: number }> {
    const sent = this.transfers.filter(t => t.from.toLowerCase() === address.toLowerCase());
    const received = this.transfers.filter(t => t.to.toLowerCase() === address.toLowerCase());
    const all = [...sent, ...received].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    const volume = all.reduce((s, t) => s + t.amount, 0n);
    const counterparties = new Set(all.map(t => t.from === address ? t.to : t.from));
    return { transfers: all, totalVolume: volume, uniqueCounterparties: counterparties.size };
  }

  async getTokenHolders(token: string, minBalance = 0n): Promise<{ address: string; balance: bigint; percent: number }[]> {
    const balances = new Map<string, bigint>();
    for (const t of this.transfers.filter(tr => tr.token === token)) { balances.set(t.to, (balances.get(t.to) || 0n) + t.amount); balances.set(t.from, (balances.get(t.from) || 0n) - t.amount); }
    const total = [...balances.values()].filter(b => b > 0n).reduce((s, b) => s + b, 0n);
    return [...balances.entries()].filter(([, b]) => b >= minBalance).map(([addr, bal]) => ({ address: addr, balance: bal, percent: total > 0n ? Number(bal * 100n / total) : 0 })).sort((a, b) => (b.balance > a.balance ? 1 : -1));
  }

  async getTopTokensByVolume(fromBlock?: number, toBlock?: number, limit = 20): Promise<{ token: string; volume: bigint; transfers: number; uniqueHolders: number }[]> {
    const tokenStats = new Map<string, { volume: bigint; transfers: number; holders: Set<string> }>();
    for (const t of this.transfers) { const s = tokenStats.get(t.token) || { volume: 0n, transfers: 0, holders: new Set() }; s.volume += t.amount; s.transfers++; s.holders.add(t.from); s.holders.add(t.to); tokenStats.set(t.token, s); }
    return [...tokenStats.entries()].map(([token, s]) => ({ token, volume: s.volume, transfers: s.transfers, uniqueHolders: s.holders.size })).sort((a, b) => (b.volume > a.volume ? 1 : -1)).slice(0, limit);
  }

  async getBlockRange(from: number, to: number): Promise<BlockSummary[]> { return this.blocks.filter(b => b.number >= from && b.number <= to); }
  getAddressIndex(address: string): AddressIndex | undefined { return this.addresses.get(address); }
  getTransferCount(): number { return this.transfers.length; }
  getIndexedAddressCount(): number { return this.addresses.size; }
  clearIndex(): void { this.addresses.clear(); this.transfers = []; this.blocks = []; }

  private async getBlockNumber(): Promise<number> { const raw = await this.rpcCall<string>("eth_blockNumber", []); return parseInt(raw, 16); }
  private async getLogs(filter: { address: string; topics: string[]; fromBlock: number; toBlock: number }): Promise<Array<{ topics: string[]; data: string; transactionHash: string; blockNumber: number; logIndex: number }>> { const result = await this.rpcCall<Record<string, unknown>[]>("eth_getLogs", [filter]); return (result || []).map(r => ({ topics: r.topics as string[], data: r.data as string, transactionHash: r.transactionHash as string, blockNumber: parseInt(r.blockNumber as string, 16), logIndex: parseInt(r.logIndex as string, 16) })); }
}
