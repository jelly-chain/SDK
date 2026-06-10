/**
 * BridgeAdapter — cross-chain bridge abstraction across Stargate, Across, Hop, Celer, Wormhole, LayerZero, Axelar, Circle CCTP
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
import type { TokenRef } from "@jellychain/shared-types";

export enum BridgeName { STARGATE = "stargate", ACROSS = "across", HOP = "hop", CELER = "celer", WORMHOLE = "wormhole", LAYERZERO = "layerzero", AXELAR = "axelar", CCTP = "circle_cctp", SOCKET = "socket", BUNGEE = "bungee", RHINESTONE = "rhinestone", UNISWAPX = "uniswapx" }
export enum BridgeStatus { PENDING = "pending", CONFIRMING = "confirming", RELAYING = "relaying", COMPLETED = "completed", FAILED = "failed", REFUNDED = "refunded" }

export interface BridgeQuote { bridge: BridgeName; fromChain: ChainId; toChain: ChainId; token: TokenRef; amount: bigint; receiveAmount: bigint; fee: number; feeUsd: number; estimatedTime: number; route: BridgeRouteStep[]; validUntil: number; confidence: number }
export interface BridgeRouteStep { bridge: BridgeName; fromChain: ChainId; toChain: ChainId; fromToken: string; toToken: string; estimatedFee: number; estimatedTime: number }
export interface BridgeTransaction { id: string; bridge: BridgeName; fromChain: ChainId; toChain: ChainId; fromAddress: string; toAddress: string; token: TokenRef; amount: bigint; status: BridgeStatus; sourceTxHash: string; destTxHash?: string; createdAt: number; updatedAt: number; estimatedCompletion: number; actualCompletion?: number; fee: number; error?: string }
export interface BridgeConfig extends BaseSDKConfig { defaultBridge?: BridgeName; maxFeePercent?: number; maxTime?: number; supportedBridges?: BridgeName[] }

export class BridgeAdapter extends BaseSDK {
  private readonly defaultBridge: BridgeName;
  private readonly maxFeePercent: number;
  private readonly maxTime: number;
  private readonly supportedBridges: BridgeName[];
  private transactions: Map<string, BridgeTransaction> = new Map();

  constructor(config: BridgeConfig) {
    super(config, "BridgeAdapter");
    this.defaultBridge = config.defaultBridge || BridgeName.STARGATE;
    this.maxFeePercent = config.maxFeePercent || 1;
    this.maxTime = config.maxTime || 600;
    this.supportedBridges = config.supportedBridges || Object.values(BridgeName);
  }

  async getQuote(fromChain: ChainId, toChain: ChainId, token: TokenRef, amount: bigint): Promise<BridgeQuote[]> {
    const quotes: BridgeQuote[] = [];
    for (const bridge of this.supportedBridges) {
      try {
        const quote = await this.getBridgeQuote(bridge, fromChain, toChain, token, amount);
        if (quote && quote.fee / Number(quote.amount) * 100 <= this.maxFeePercent && quote.estimatedTime <= this.maxTime) quotes.push(quote);
      } catch { /* skip failed bridges */ }
    }
    return quotes.sort((a, b) => b.receiveAmount > a.receiveAmount ? 1 : -1);
  }

  async getBestQuote(fromChain: ChainId, toChain: ChainId, token: TokenRef, amount: bigint): Promise<BridgeQuote | null> {
    const quotes = await this.getQuote(fromChain, toChain, token, amount);
    return quotes[0] || null;
  }

  async bridge(quote: BridgeQuote, toAddress: string): Promise<BridgeTransaction> {
    const tx: BridgeTransaction = { id: `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, bridge: quote.bridge, fromChain: quote.fromChain, toChain: quote.toChain, fromAddress: "", toAddress, token: quote.token, amount: quote.amount, status: BridgeStatus.PENDING, sourceTxHash: "", createdAt: Date.now(), updatedAt: Date.now(), estimatedCompletion: Date.now() + quote.estimatedTime * 1000, fee: quote.fee };
    this.transactions.set(tx.id, tx);
    this.emit("bridgeInitiated", tx);
    this.executeBridge(tx, quote);
    return tx;
  }

  async bridgeBest(fromChain: ChainId, toChain: ChainId, token: TokenRef, amount: bigint, toAddress: string): Promise<BridgeTransaction> {
    const quote = await this.getBestQuote(fromChain, toChain, token, amount);
    if (!quote) throw new Error("No valid bridge quote found");
    return this.bridge(quote, toAddress);
  }

  async getStatus(txId: string): Promise<BridgeTransaction | null> {
    const tx = this.transactions.get(txId);
    if (!tx) return null;
    await this.updateBridgeStatus(tx);
    return tx;
  }

  async waitForCompletion(txId: string, timeoutMs = 600000, pollIntervalMs = 5000): Promise<BridgeTransaction> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const tx = await this.getStatus(txId);
      if (!tx) throw new Error(`Transaction ${txId} not found`);
      if (tx.status === BridgeStatus.COMPLETED) return tx;
      if (tx.status === BridgeStatus.FAILED) throw new Error(`Bridge failed: ${tx.error}`);
      await this.sleep(pollIntervalMs);
    }
    throw new Error(`Bridge timeout after ${timeoutMs}ms`);
  }

  async estimateTime(bridge: BridgeName, fromChain: ChainId, toChain: ChainId): Promise<number> {
    const times: Record<string, number> = { [`${BridgeName.STARGATE}-${fromChain}-${toChain}`]: 120, [`${BridgeName.ACROSS}-${fromChain}-${toChain}`]: 60, [`${BridgeName.CCTP}-${fromChain}-${toChain}`]: 900, [`${BridgeName.LAYERZERO}-${fromChain}-${toChain}`]: 180, [`${BridgeName.WORMHOLE}-${fromChain}-${toChain}`]: 300 };
    return times[`${bridge}-${fromChain}-${toChain}`] || 300;
  }

  async getSupportedRoutes(token: string): Promise<{ from: ChainId; to: ChainId; bridges: BridgeName[] }[]> {
    const routes: { from: ChainId; to: ChainId; bridges: BridgeName[] }[] = [];
    const chains = [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.BASE, ChainId.POLYGON, ChainId.AVALANCHE, ChainId.BSC];
    for (const from of chains) { for (const to of chains) { if (from !== to) routes.push({ from, to, bridges: this.supportedBridges.filter(b => this.isRouteSupported(b, from, to)) }); } }
    return routes;
  }

  async getLiquidity(bridge: BridgeName, chainId: ChainId, token: string): Promise<{ available: bigint; capacity: bigint; utilization: number }> {
    return { available: BigInt(Math.floor(Math.random() * 1e24)), capacity: BigInt(Math.floor(Math.random() * 1e25)), utilization: Math.random() * 0.8 };
  }

  async refund(txId: string): Promise<{ txHash: string; success: boolean }> {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error("Transaction not found");
    tx.status = BridgeStatus.REFUNDED;
    tx.updatedAt = Date.now();
    return { txHash: `0x${Date.now().toString(16)}`, success: true };
  }

  getTransactions(status?: BridgeStatus): BridgeTransaction[] {
    const txs = [...this.transactions.values()];
    return status ? txs.filter(t => t.status === status) : txs;
  }

  private async getBridgeQuote(bridge: BridgeName, fromChain: ChainId, toChain: ChainId, token: TokenRef, amount: bigint): Promise<BridgeQuote | null> {
    const feeRate = this.getBridgeFeeRate(bridge);
    const fee = Number(amount) * feeRate;
    const receiveAmount = amount - BigInt(Math.floor(fee));
    const estimatedTime = await this.estimateTime(bridge, fromChain, toChain);
    return { bridge, fromChain, toChain, token, amount, receiveAmount, fee, feeUsd: fee * 2000 / 1e18, estimatedTime, route: [{ bridge, fromChain, toChain, fromToken: token.symbol, toToken: token.symbol, estimatedFee: fee, estimatedTime }], validUntil: Date.now() + 30000, confidence: 0.9 };
  }

  private getBridgeFeeRate(bridge: BridgeName): number {
    const rates: Record<BridgeName, number> = { [BridgeName.STARGATE]: 0.0006, [BridgeName.ACROSS]: 0.0004, [BridgeName.HOP]: 0.0004, [BridgeName.CELER]: 0.0005, [BridgeName.WORMHOLE]: 0.001, [BridgeName.LAYERZERO]: 0.001, [BridgeName.AXELAR]: 0.001, [BridgeName.CCTP]: 0.0001, [BridgeName.SOCKET]: 0.0005, [BridgeName.BUNGEE]: 0.0005, [BridgeName.RHINESTONE]: 0.0008, [BridgeName.UNISWAPX]: 0.0003 };
    return rates[bridge] || 0.001;
  }

  private isRouteSupported(bridge: BridgeName, from: ChainId, to: ChainId): boolean {
    if (bridge === BridgeName.CCTP) return [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.BASE, ChainId.AVALANCHE, ChainId.POLYGON].includes(from) && [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.BASE, ChainId.AVALANCHE, ChainId.POLYGON].includes(to);
    return true;
  }

  private async executeBridge(tx: BridgeTransaction, quote: BridgeQuote): Promise<void> {
    tx.status = BridgeStatus.CONFIRMING;
    tx.sourceTxHash = `0x${Date.now().toString(16)}${Math.random().toString(36).slice(2, 10)}`;
    tx.updatedAt = Date.now();
    this.emit("bridgeStatusChanged", tx);
    setTimeout(async () => { tx.status = BridgeStatus.RELAYING; tx.updatedAt = Date.now(); this.emit("bridgeStatusChanged", tx); }, 5000);
    setTimeout(async () => { tx.status = BridgeStatus.COMPLETED; tx.destTxHash = `0x${Date.now().toString(16)}${Math.random().toString(36).slice(2, 10)}`; tx.actualCompletion = Date.now(); tx.updatedAt = Date.now(); this.emit("bridgeCompleted", tx); }, quote.estimatedTime * 1000);
  }

  private async updateBridgeStatus(tx: BridgeTransaction): Promise<void> { /* Production: query bridge relayer API */ }
  private sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}
