/**
 * ChainConnector — unified RPC interface for 20+ blockchain networks.
 * Provides: balances, transactions, events, traces, token info, gas estimation.
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import { ChainId, ChainFamily, CHAIN_METADATA, getChainMetadata } from "@jellychain/shared-types";
import type { ChainMetadata } from "@jellychain/shared-types";
import { RpcError, SdkError, ErrorCode } from "@jellychain/sdk-core";

export interface ChainConnectorConfig extends BaseSDKConfig {
  chainId: ChainId;
  rpcUrls?: string[];
  fallbackRpcs?: boolean;
  maxConcurrency?: number;
}

export interface BalanceResult {
  address: string;
  chainId: ChainId;
  nativeBalance: bigint;
  nativeBalanceFormatted: string;
  tokenBalances: TokenBalanceResult[];
  blockNumber: number;
  timestamp: number;
}

export interface TokenBalanceResult {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  usdPrice?: number;
  usdValue?: number;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  data: string;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  status?: "pending" | "confirmed" | "failed";
  confirmations: number;
  logs?: LogEntry[];
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  decoded?: { name: string; params: Record<string, unknown> };
}

export interface EventFilter {
  address?: string | string[];
  topics?: (string | string[] | null)[];
  fromBlock?: number | "latest" | "earliest" | "pending" | "safe" | "finalized";
  toBlock?: number | "latest" | "earliest" | "pending" | "safe" | "finalized";
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostUsd?: number;
  baseFee?: bigint;
}

export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: string[];
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas?: bigint;
  miner: string;
  difficulty?: bigint;
  totalDifficulty?: bigint;
  size: number;
  parentHash: string;
}

export interface TraceResult {
  type: "call" | "create" | "suicide" | "reward";
  from: string;
  to?: string;
  value: bigint;
  gas: bigint;
  gasUsed: bigint;
  input: string;
  output?: string;
  error?: string;
  revertReason?: string;
  calls?: TraceResult[];
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  chainId: ChainId;
}

export class ChainConnector extends BaseSDK {
  readonly chainId: ChainId;
  readonly metadata: ChainMetadata;
  private readonly rpcUrls: string[];
  private rpcIndex = 0;

  constructor(config: ChainConnectorConfig) {
    super(config, `ChainConnector:${config.chainId}`);
    this.chainId = config.chainId;
    this.metadata = CHAIN_METADATA[config.chainId] || this.buildCustomMetadata(config);
    this.rpcUrls = config.rpcUrls || this.metadata.rpcUrls;
    if (this.rpcUrls.length === 0) {
      throw new SdkError(`No RPC URLs for chain ${this.chainId}`, ErrorCode.INVALID_CONFIG);
    }
  }

  private buildCustomMetadata(config: ChainConnectorConfig): ChainMetadata {
    return {
      chainId: config.chainId,
      name: `Chain ${config.chainId}`,
      symbol: "ETH",
      family: ChainFamily.EVM,
      decimals: 18,
      rpcUrls: config.rpcUrls || [],
      blockExplorerUrls: [],
      testnet: false,
      layer: "L1",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      features: [],
    };
  }

  protected get rpcUrl(): string {
    return this.rpcUrls[this.rpcIndex % this.rpcUrls.length]!;
  }

  protected rotateRpc(): void {
    this.rpcIndex = (this.rpcIndex + 1) % this.rpcUrls.length;
    this.logger.debug(`Rotated to RPC: ${this.rpcUrl}`);
  }

  // ── RPC Core ────────────────────────────────────────────────────────────

  protected async call<T>(method: string, params: unknown[] = []): Promise<T> {
    return withRetry(async () => {
      try {
        return await this.rpcCall<T>(method, params);
      } catch (err) {
        if (err instanceof RpcError && this.config.fallbackRpcs !== false) {
          this.rotateRpc();
        }
        throw err;
      }
    }, { attempts: 3 });
  }

  // ── Block ───────────────────────────────────────────────────────────────

  async getBlockNumber(): Promise<number> {
    return this.cached("blockNumber", () =>
      this.call<number>("eth_blockNumber").then(n => parseInt(n as unknown as string, 16)),
      3_000
    );
  }

  async getBlock(blockNumber?: number | "latest"): Promise<BlockInfo> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const result = await this.call<Record<string, unknown>>("eth_getBlockByNumber", [blockParam, false]);
    return this.parseBlock(result);
  }

  async getBlockWithTransactions(blockNumber?: number | "latest"): Promise<BlockInfo & { transactions: TransactionResult[] }> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const result = await this.call<Record<string, unknown>>("eth_getBlockByNumber", [blockParam, true]);
    const block = this.parseBlock(result);
    const txs = (result.transactions as Record<string, unknown>[] || []).map(tx => this.parseTransaction(tx));
    return { ...block, transactions: txs };
  }

  // ── Balance ─────────────────────────────────────────────────────────────

  async getBalance(address: string, blockNumber?: number | "latest"): Promise<bigint> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const result = await this.call<string>("eth_getBalance", [address, blockParam]);
    return BigInt(result);
  }

  async getBalances(addresses: string[], blockNumber?: number | "latest"): Promise<Map<string, bigint>> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const results = await Promise.all(
      addresses.map(addr => this.getBalance(addr, blockNumber).catch(() => 0n))
    );
    const map = new Map<string, bigint>();
    addresses.forEach((addr, i) => map.set(addr, results[i]!));
    return map;
  }

  async getFullBalance(address: string, tokenAddresses?: string[]): Promise<BalanceResult> {
    const blockNumber = await this.getBlockNumber();
    const nativeBalance = await this.getBalance(address);

    const tokenBalances: TokenBalanceResult[] = [];
    if (tokenAddresses) {
      const results = await Promise.allSettled(
        tokenAddresses.map(addr => this.getTokenBalance(addr, address))
      );
      for (const result of results) {
        if (result.status === "fulfilled") tokenBalances.push(result.value);
      }
    }

    return {
      address,
      chainId: this.chainId,
      nativeBalance,
      nativeBalanceFormatted: this.formatAmount(nativeBalance, this.metadata.decimals),
      tokenBalances,
      blockNumber,
      timestamp: Date.now(),
    };
  }

  // ── Token ───────────────────────────────────────────────────────────────

  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<TokenBalanceResult> {
    const data = "0x70a08231" + walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    const result = await this.call<string>("eth_call", [{ to: tokenAddress, data }, "latest"]);
    const balance = BigInt(result);
    const info = await this.getTokenInfo(tokenAddress);
    return {
      tokenAddress,
      symbol: info.symbol,
      decimals: info.decimals,
      balance,
      balanceFormatted: this.formatAmount(balance, info.decimals),
    };
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const cached = this.cache.get<TokenInfo>(`token:${this.chainId}:${tokenAddress}`);
    if (cached) return cached;

    const calls = [
      this.call<string>("eth_call", [{ to: tokenAddress, data: "0x06fdde03" }, "latest"]).catch(() => "0x"), // name
      this.call<string>("eth_call", [{ to: tokenAddress, data: "0x95d89b41" }, "latest"]).catch(() => "0x"), // symbol
      this.call<string>("eth_call", [{ to: tokenAddress, data: "0x313ce567" }, "latest"]).catch(() => "0x"), // decimals
      this.call<string>("eth_call", [{ to: tokenAddress, data: "0x18160ddd" }, "latest"]).catch(() => "0x"), // totalSupply
    ];

    const [nameRaw, symbolRaw, decimalsRaw, supplyRaw] = await Promise.all(calls);

    const info: TokenInfo = {
      address: tokenAddress,
      name: this.decodeString(nameRaw),
      symbol: this.decodeString(symbolRaw),
      decimals: parseInt(decimalsRaw, 16) || 18,
      totalSupply: supplyRaw !== "0x" ? BigInt(supplyRaw) : undefined,
      chainId: this.chainId,
    };

    this.cache.set(`token:${this.chainId}:${tokenAddress}`, info, 300_000);
    return info;
  }

  async getTokenAllowance(tokenAddress: string, owner: string, spender: string): Promise<bigint> {
    const data = "0xdd62ed3e" + owner.toLowerCase().replace("0x", "").padStart(64, "0") + spender.toLowerCase().replace("0x", "").padStart(64, "0");
    const result = await this.call<string>("eth_call", [{ to: tokenAddress, data }, "latest"]);
    return BigInt(result);
  }

  // ── Transaction ────────────────────────────────────────────────────────

  async getTransaction(hash: string): Promise<TransactionResult | null> {
    const result = await this.call<Record<string, unknown> | null>("eth_getTransactionByHash", [hash]);
    if (!result) return null;
    return this.parseTransaction(result);
  }

  async getTransactionReceipt(hash: string): Promise<TransactionResult | null> {
    const result = await this.call<Record<string, unknown> | null>("eth_getTransactionReceipt", [hash]);
    if (!result) return null;
    return this.parseTransactionReceipt(result);
  }

  async getTransactionCount(address: string, blockNumber?: number | "latest"): Promise<number> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const result = await this.call<string>("eth_getTransactionCount", [address, blockParam]);
    return parseInt(result, 16);
  }

  async estimateGas(from: string, to: string, value?: bigint, data?: string): Promise<GasEstimate> {
    const callParams: Record<string, string> = { from, to };
    if (value) callParams.value = `0x${value.toString(16)}`;
    if (data) callParams.data = data;

    const [gasLimit, feeData] = await Promise.all([
      this.call<string>("eth_estimateGas", [callParams]).catch(() => "0x5208"),
      this.call<Record<string, string>>("eth_gasPrice", []).catch(() => ({ gasPrice: "0x1" })),
    ]);

    const gasPrice = BigInt(feeData.gasPrice || "0x1");
    const gas = BigInt(gasLimit);

    return {
      gasLimit: gas,
      gasPrice,
      estimatedCost: gas * gasPrice,
    };
  }

  async estimateGasEIP1559(from: string, to: string, value?: bigint, data?: string): Promise<GasEstimate> {
    const callParams: Record<string, string> = { from, to };
    if (value) callParams.value = `0x${value.toString(16)}`;
    if (data) callParams.data = data;

    const [gasLimit, feeHistory, baseFee] = await Promise.all([
      this.call<string>("eth_estimateGas", [callParams]).catch(() => "0x5208"),
      this.call<Record<string, string[]>>("eth_feeHistory", ["0x5", "latest", [10, 50, 90]]).catch(() => ({ reward: [["0x1"]] })),
      this.call<string>("eth_getBlockByNumber", ["latest", false]).then(b => (b as Record<string, string>).baseFeePerGas || "0x1").catch(() => "0x1"),
    ]);

    const gas = BigInt(gasLimit);
    const base = BigInt(baseFee);
    const rewards = feeHistory.reward?.map(r => BigInt(r[0]!)) || [1_000_000_000n];
    const priorityFee = rewards[1] || 1_000_000_000n; // 50th percentile
    const maxFee = base * 2n + priorityFee;

    return {
      gasLimit: gas,
      gasPrice: maxFee,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: priorityFee,
      estimatedCost: gas * maxFee,
      baseFee: base,
    };
  }

  // ── Events ──────────────────────────────────────────────────────────────

  async getLogs(filter: EventFilter): Promise<LogEntry[]> {
    const params: Record<string, unknown> = {};
    if (filter.address) params.address = filter.address;
    if (filter.topics) params.topics = filter.topics;
    if (filter.fromBlock !== undefined) params.fromBlock = typeof filter.fromBlock === "number" ? `0x${filter.fromBlock.toString(16)}` : filter.fromBlock;
    if (filter.toBlock !== undefined) params.toBlock = typeof filter.toBlock === "number" ? `0x${filter.toBlock.toString(16)}` : filter.toBlock;

    const results = await this.call<Record<string, unknown>[]>("eth_getLogs", [params]);
    return results.map(r => this.parseLog(r));
  }

  async getLogsBatched(filter: EventFilter, batchSize = 2000): Promise<LogEntry[]> {
    const fromBlock = typeof filter.fromBlock === "number" ? filter.fromBlock : await this.getBlockNumber();
    const toBlock = typeof filter.toBlock === "number" ? filter.toBlock : await this.getBlockNumber();
    const allLogs: LogEntry[] = [];

    for (let start = fromBlock; start <= toBlock; start += batchSize) {
      const end = Math.min(start + batchSize - 1, toBlock);
      const logs = await this.getLogs({ ...filter, fromBlock: start, toBlock: end });
      allLogs.push(...logs);
    }
    return allLogs;
  }

  // ── Trace ───────────────────────────────────────────────────────────────

  async traceTransaction(hash: string): Promise<TraceResult[]> {
    const results = await this.call<Record<string, unknown>[]>("trace_transaction", [hash]);
    return results.map(r => this.parseTrace(r));
  }

  async traceBlock(blockNumber: number): Promise<TraceResult[]> {
    const results = await this.call<Record<string, unknown>[]>("trace_block", [`0x${blockNumber.toString(16)}`]);
    return results.map(r => this.parseTrace(r));
  }

  async traceCall(from: string, to: string, data: string, blockNumber?: number | "latest"): Promise<TraceResult> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    const result = await this.call<Record<string, unknown>>("trace_call", [{ from, to, data }, ["trace"], blockParam]);
    return this.parseTrace(result);
  }

  // ── Contract ────────────────────────────────────────────────────────────

  async callContract(to: string, data: string, blockNumber?: number | "latest"): Promise<string> {
    const blockParam = typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : (blockNumber || "latest");
    return this.call<string>("eth_call", [{ to, data }, blockParam]);
  }

  async getCode(address: string): Promise<string> {
    return this.call<string>("eth_getCode", [address, "latest"]);
  }

  async isContract(address: string): Promise<boolean> {
    const code = await this.getCode(address);
    return code !== "0x" && code.length > 2;
  }

  // ── Parsers ─────────────────────────────────────────────────────────────

  private parseBlock(raw: Record<string, unknown>): BlockInfo {
    return {
      number: parseInt(raw.number as string, 16),
      hash: raw.hash as string,
      timestamp: parseInt(raw.timestamp as string, 16),
      transactions: (raw.transactions as string[]) || [],
      gasUsed: BigInt(raw.gasUsed as string),
      gasLimit: BigInt(raw.gasLimit as string),
      baseFeePerGas: raw.baseFeePerGas ? BigInt(raw.baseFeePerGas as string) : undefined,
      miner: raw.miner as string,
      difficulty: raw.difficulty ? BigInt(raw.difficulty as string) : undefined,
      totalDifficulty: raw.totalDifficulty ? BigInt(raw.totalDifficulty as string) : undefined,
      size: parseInt(raw.size as string, 16),
      parentHash: raw.parentHash as string,
    };
  }

  private parseTransaction(raw: Record<string, unknown>): TransactionResult {
    return {
      hash: raw.hash as string,
      from: raw.from as string,
      to: (raw.to as string) || "",
      value: BigInt((raw.value as string) || "0"),
      data: (raw.data as string) || "0x",
      gasLimit: BigInt((raw.gas as string) || "0"),
      gasPrice: raw.gasPrice ? BigInt(raw.gasPrice as string) : undefined,
      maxFeePerGas: raw.maxFeePerGas ? BigInt(raw.maxFeePerGas as string) : undefined,
      maxPriorityFeePerGas: raw.maxPriorityFeePerGas ? BigInt(raw.maxPriorityFeePerGas as string) : undefined,
      nonce: parseInt(raw.nonce as string, 16),
      blockNumber: raw.blockNumber ? parseInt(raw.blockNumber as string, 16) : undefined,
      blockHash: raw.blockHash as string | undefined,
      status: raw.blockNumber ? "confirmed" : "pending",
      confirmations: 0,
    };
  }

  private parseTransactionReceipt(raw: Record<string, unknown>): TransactionResult {
    const tx = this.parseTransaction(raw);
    tx.status = raw.status === "0x1" ? "confirmed" : "failed";
    tx.gasUsed = raw.gasUsed ? BigInt(raw.gasUsed as string) : undefined;
    tx.effectiveGasPrice = raw.effectiveGasPrice ? BigInt(raw.effectiveGasPrice as string) : undefined;
    tx.logs = (raw.logs as Record<string, unknown>[] || []).map(l => this.parseLog(l));
    return tx;
  }

  private parseLog(raw: Record<string, unknown>): LogEntry {
    return {
      address: raw.address as string,
      topics: (raw.topics as string[]) || [],
      data: raw.data as string,
      blockNumber: parseInt(raw.blockNumber as string, 16),
      transactionHash: raw.transactionHash as string,
      logIndex: parseInt(raw.logIndex as string, 16),
    };
  }

  private parseTrace(raw: Record<string, unknown>): TraceResult {
    return {
      type: (raw.type as string) as TraceResult["type"],
      from: raw.from as string,
      to: raw.to as string | undefined,
      value: BigInt((raw.value as string) || "0"),
      gas: BigInt((raw.gas as string) || "0"),
      gasUsed: BigInt((raw.gasUsed as string) || "0"),
      input: (raw.input as string) || "0x",
      output: raw.output as string | undefined,
      error: raw.error as string | undefined,
      calls: raw.calls ? (raw.calls as Record<string, unknown>[]).map(c => this.parseTrace(c)) : undefined,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private decodeString(hex: string): string {
    if (!hex || hex === "0x") return "";
    try {
      const bytes = hex.replace("0x", "").match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
      // Handle ABI-encoded strings
      if (bytes.length > 64) {
        const offset = parseInt(hex.slice(2, 66), 16) * 2;
        const length = parseInt(hex.slice(offset + 2, offset + 66), 16) * 2;
        const data = hex.slice(offset + 66, offset + 66 + length);
        return Buffer.from(data, "hex").toString("utf8").replace(/\0/g, "");
      }
      return Buffer.from(bytes).toString("utf8").replace(/\0/g, "");
    } catch {
      return hex;
    }
  }

  protected formatAmount(amount: bigint, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, "0");
    const intPart = str.slice(0, -decimals) || "0";
    const fracPart = str.slice(-decimals).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }
}
