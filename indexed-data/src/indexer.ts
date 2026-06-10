/**
 * IndexedData — on-chain data indexer for efficient blockchain queries
 * Address indexing, transaction history, token transfers, event logs, NFT tracking
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
import { RpcError, ErrorCode } from "@jellychain/sdk-core";

export interface IndexConfig extends BaseSDKConfig {
  chainId: ChainId; batchSize?: number; maxBlocks?: number;
  enableAddressIndex?: boolean; enableTransferIndex?: boolean;
  enableNftIndex?: boolean; enableEventIndex?: boolean;
}

export interface AddressIndex {
  address: string; chainId: ChainId;
  firstSeen: number; lastSeen: number;
  txCount: number; tokenTransfers: number; nftTransfers: number;
  volume: bigint; volumeUsd: number;
  sentCount: number; receivedCount: number;
  uniqueCounterparties: number;
  tags: string[];
  riskScore: number;
  isContract: boolean; isExchange: boolean; isWhale: boolean; isBot: boolean;
  firstTxBlock: number; lastTxBlock: number;
  erc20Tokens: string[]; nftCollections: string[];
  lastIndexed: number;
}

export interface TransferRecord {
  from: string; to: string; token: string; tokenSymbol: string; tokenDecimals: number;
  amount: bigint; amountFormatted: string; amountUsd?: number;
  txHash: string; blockNumber: number; timestamp: number; logIndex: number;
  direction: "in" | "out"; counterparty: string;
  isFromContract: boolean; isToContract: boolean;
  gasPrice?: bigint; gasUsed?: bigint;
}

export interface BlockSummary {
  number: number; hash: string; timestamp: number;
  gasUsed: bigint; gasLimit: bigint; baseFee?: bigint;
  txCount: number; transferCount: number;
  volume: bigint; volumeUsd: number;
  miner: string; blobs?: number;
}

export interface TokenIndex {
  address: string; symbol: string; name: string; decimals: number;
  chainId: ChainId; totalSupply: bigint; holders: number;
  transferCount: number; volume24h: number; volumeTotal: number;
  price?: number; marketCap?: number;
  firstTransfer: number; lastTransfer: number;
  isStablecoin: boolean; isWrapped: boolean;
  lastIndexed: number;
}

export interface NftIndex {
  contractAddress: string; name: string; symbol: string;
  chainId: ChainId; standard: "ERC721" | "ERC1155";
  totalSupply: number; holders: number; transfers: number;
  floorPrice?: number; volume24h?: number; volumeTotal?: number;
  lastIndexed: number;
}

export interface EventIndex {
  address: string; signature: string; name: string;
  topics: string[]; data: string;
  txHash: string; blockNumber: number; logIndex: number; timestamp: number;
  decoded?: Record<string, unknown>;
}

export interface IndexStatus {
  chainId: ChainId;
  lastIndexedBlock: number; latestBlock: number;
  indexedAddresses: number; indexedTransfers: number;
  indexedTokens: number; indexedNfts: number;
  indexingProgress: number; isIndexing: boolean;
  errors: number; lastError?: string;
}

export class IndexedData extends BaseSDK {
  readonly chainId: ChainId;
  private readonly batchSize: number;
  private addresses: Map<string, AddressIndex> = new Map();
  private transfers: TransferRecord[] = [];
  private blocks: Map<number, BlockSummary> = new Map();
  private tokens: Map<string, TokenIndex> = new Map();
  private nfts: Map<string, NftIndex> = new Map();
  private events: EventIndex[] = [];
  private lastIndexedBlock = 0;
  private indexing = false;
  private errors = 0;

  constructor(config: IndexConfig) {
    super(config, "IndexedData");
    this.chainId = config.chainId;
    this.batchSize = config.batchSize || 1000;
  }

  // ── Address Indexing ───────────────────────────────────────────────────

  async indexAddress(address: string, fromBlock?: number, toBlock?: number): Promise<AddressIndex> {
    const latest = toBlock || await this.getBlockNumberSafe();
    const start = fromBlock || Math.max(0, latest - 10000);
    const existing = this.addresses.get(address);
    const index: AddressIndex = existing || {
      address, chainId: this.chainId, firstSeen: Date.now(), lastSeen: Date.now(),
      txCount: 0, tokenTransfers: 0, nftTransfers: 0, volume: 0n, volumeUsd: 0,
      sentCount: 0, receivedCount: 0, uniqueCounterparties: 0, tags: [],
      riskScore: 0, isContract: false, isExchange: false, isWhale: false, isBot: false,
      firstTxBlock: 0, lastTxBlock: 0, erc20Tokens: [], nftCollections: [], lastIndexed: 0,
    };

    const code = await this.getCodeSafe(address);
    index.isContract = code !== "0x" && code.length > 2;

    const transfers = await this.indexTransfersForAddress(address, start, latest);
    index.tokenTransfers = transfers.length;
    index.lastSeen = Date.now();
    index.lastIndexed = Date.now();
    index.lastTxBlock = latest;

    const sent = transfers.filter(t => t.from.toLowerCase() === address.toLowerCase());
    const received = transfers.filter(t => t.to.toLowerCase() === address.toLowerCase());
    index.sentCount = sent.length;
    index.receivedCount = received.length;
    index.volume = transfers.reduce((s, t) => s + t.amount, 0n);
    index.uniqueCounterparties = new Set(transfers.map(t => t.from === address ? t.to : t.from)).size;
    index.isWhale = index.volume > BigInt(1e24);
    index.isBot = index.txCount > 10000 && index.uniqueCounterparties < 10;
    index.riskScore = this.calculateRiskScore(index);

    this.addresses.set(address, index);
    return index;
  }

  calculateRiskScore(index: AddressIndex): number {
    let score = 50;
    if (index.isContract) score -= 10;
    if (index.isExchange) score -= 20;
    if (index.txCount < 5) score += 20;
    if (index.uniqueCounterparties < 3 && index.txCount > 100) score += 30;
    if (index.isBot) score += 25;
    if (index.volume > BigInt(1e24)) score -= 15;
    return Math.max(0, Math.min(100, score));
  }

  // ── Transfer Indexing ──────────────────────────────────────────────────

  async indexTransfers(token: string, fromBlock?: number, toBlock?: number): Promise<TransferRecord[]> {
    const latest = toBlock || await this.getBlockNumberSafe();
    const start = fromBlock || Math.max(0, latest - 1000);
    const records: TransferRecord[] = [];

    for (let block = start; block <= latest; block += this.batchSize) {
      const end = Math.min(block + this.batchSize - 1, latest);
      try {
        const logs = await this.getLogs({ address: token, topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"], fromBlock: block, toBlock: end });
        for (const log of logs) {
          const amount = BigInt(log.data as string);
          const from = `0x${(log.topics[1] as string).slice(26)}`;
          const to = `0x${(log.topics[2] as string).slice(26)}`;
          records.push({
            from, to, token, tokenSymbol: "", tokenDecimals: 18,
            amount, amountFormatted: Number(amount) / 1e18, amountUsd: 0,
            txHash: log.transactionHash, blockNumber: log.blockNumber,
            timestamp: 0, logIndex: log.logIndex,
            direction: "out", counterparty: to,
            isFromContract: false, isToContract: false,
          });
        }
      } catch { this.errors++; }
    }

    this.transfers.push(...records);
    this.indexToken(token, records);
    return records;
  }

  private async indexTransfersForAddress(address: string, from: number, to: number): Promise<TransferRecord[]> {
    return this.transfers.filter(t => (t.from.toLowerCase() === address.toLowerCase() || t.to.toLowerCase() === address.toLowerCase()) && t.blockNumber >= from && t.blockNumber <= to);
  }

  private indexToken(token: string, records: TransferRecord[]): void {
    const existing = this.tokens.get(token);
    const index: TokenIndex = existing || {
      address: token, symbol: "", name: "", decimals: 18, chainId: this.chainId,
      totalSupply: 0n, holders: 0, transferCount: 0, volume24h: 0, volumeTotal: 0,
      firstTransfer: Date.now(), lastTransfer: 0, isStablecoin: false, isWrapped: false, lastIndexed: 0,
    };
    index.transferCount += records.length;
    index.lastTransfer = Date.now();
    index.lastIndexed = Date.now();
    this.tokens.set(token, index);
  }

  // ── Query Methods ──────────────────────────────────────────────────────

  async getAddressHistory(address: string, limit = 50): Promise<{ transfers: TransferRecord[]; totalVolume: bigint; uniqueCounterparties: number; sentCount: number; receivedCount: number }> {
    const sent = this.transfers.filter(t => t.from.toLowerCase() === address.toLowerCase());
    const received = this.transfers.filter(t => t.to.toLowerCase() === address.toLowerCase());
    const all = [...sent, ...received].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    const volume = all.reduce((s, t) => s + t.amount, 0n);
    const counterparties = new Set(all.map(t => t.from === address ? t.to : t.from));
    return { transfers: all, totalVolume: volume, uniqueCounterparties: counterparties.size, sentCount: sent.length, receivedCount: received.length };
  }

  async getTokenHolders(token: string, minBalance = 0n): Promise<{ address: string; balance: bigint; percent: number }[]> {
    const balances = new Map<string, bigint>();
    for (const t of this.transfers.filter(tr => tr.token === token)) {
      balances.set(t.to, (balances.get(t.to) || 0n) + t.amount);
      balances.set(t.from, (balances.get(t.from) || 0n) - t.amount);
    }
    const total = [...balances.values()].filter(b => b > 0n).reduce((s, b) => s + b, 0n);
    return [...balances.entries()].filter(([, b]) => b >= minBalance).map(([addr, bal]) => ({ address: addr, balance: bal, percent: total > 0n ? Number(bal * 100n / total) : 0 })).sort((a, b) => (b.balance > a.balance ? 1 : -1));
  }

  async getTopTokensByVolume(fromBlock?: number, toBlock?: number, limit = 20): Promise<{ token: string; volume: bigint; transfers: number; uniqueHolders: number }[]> {
    const tokenStats = new Map<string, { volume: bigint; transfers: number; holders: Set<string> }>();
    for (const t of this.transfers) {
      const s = tokenStats.get(t.token) || { volume: 0n, transfers: 0, holders: new Set() };
      s.volume += t.amount; s.transfers++; s.holders.add(t.from); s.holders.add(t.to);
      tokenStats.set(t.token, s);
    }
    return [...tokenStats.entries()].map(([token, s]) => ({ token, volume: s.volume, transfers: s.transfers, uniqueHolders: s.holders.size })).sort((a, b) => (b.volume > a.volume ? 1 : -1)).slice(0, limit);
  }

  async getBlockRange(from: number, to: number): Promise<BlockSummary[]> { return [...this.blocks.values()].filter(b => b.number >= from && b.number <= to).sort((a, b) => a.number - b.number); }
  getAddressIndex(address: string): AddressIndex | undefined { return this.addresses.get(address); }
  getTokenIndex(token: string): TokenIndex | undefined { return this.tokens.get(token); }
  getTransferCount(): number { return this.transfers.length; }
  getIndexedAddressCount(): number { return this.addresses.size; }
  getIndexedTokenCount(): number { return this.tokens.size; }
  getIndexStatus(): IndexStatus { return { chainId: this.chainId, lastIndexedBlock: this.lastIndexedBlock, latestBlock: this.lastIndexedBlock, indexedAddresses: this.addresses.size, indexedTransfers: this.transfers.length, indexedTokens: this.tokens.size, indexedNfts: this.nfts.size, indexingProgress: 100, isIndexing: this.indexing, errors: this.errors }; }
  clearIndex(): void { this.addresses.clear(); this.transfers = []; this.blocks.clear(); this.tokens.clear(); this.nfts.clear(); this.events = []; this.lastIndexedBlock = 0; this.errors = 0; }

  // ── Private Helpers ────────────────────────────────────────────────────

  private async getBlockNumberSafe(): Promise<number> { try { const raw = await this.rpcCall<string>("eth_blockNumber", []); return parseInt(raw, 16); } catch { return 0; } }
  private async getCodeSafe(address: string): Promise<string> { try { return await this.rpcCall<string>("eth_getCode", [address, "latest"]); } catch { return "0x"; } }
  private async getLogs(filter: { address: string; topics: string[]; fromBlock: number; toBlock: number }): Promise<Array<{ topics: string[]; data: string; transactionHash: string; blockNumber: number; logIndex: number }>> { const result = await this.rpcCall<Record<string, unknown>[]>("eth_getLogs", [filter]); return (result || []).map(r => ({ topics: r.topics as string[], data: r.data as string, transactionHash: r.transactionHash as string, blockNumber: parseInt(r.blockNumber as string, 16), logIndex: parseInt(r.logIndex as string, 16) })); }
}
