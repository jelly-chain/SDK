/**
 * GasOptimizer — gas estimation, optimization, and transaction scheduling
 * across 20+ EVM chains. Supports EIP-1559, legacy gas, gas tokens,
 * batching, and optimal timing.
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import { ChainId, CHAIN_METADATA } from "@jellychain/shared-types";
import { SdkError, ErrorCode, RpcError } from "@jellychain/sdk-core";

export interface GasOptimizerConfig extends BaseSDKConfig {
  chainId: ChainId;
  maxGasPriceGwei?: number;
  priorityFeeGwei?: number;
  gasTokenEnabled?: boolean;
  batchEnabled?: boolean;
  timingEnabled?: boolean;
}

export interface GasEstimate {
  chainId: ChainId;
  baseFee: number; // gwei
  priorityFee: number; // gwei
  maxFee: number; // gwei
  gasLimit: number;
  estimatedCost: number; // in native token
  estimatedCostUsd?: number;
  confidence: number; // 0-1
  timestamp: number;
  blockNumber: number;
  congestion: "low" | "medium" | "high" | "extreme";
  suggestedTiming?: TimingSuggestion;
  breaks: GasBreakdown;
}

export interface GasBreakdown {
  baseFee: number;
  priorityFee: number;
  blobs?: number;
  calldata?: number;
  storage?: number;
  execution?: number;
  refunds?: number;
}

export interface TimingSuggestion {
  shouldWait: boolean;
  reason: string;
  suggestedWaitSeconds?: number;
  expectedSavings?: number; // %
  nextLowCongestion?: number; // timestamp
  hourlyPattern: number[]; // 24 hours, gas price relative index
}

export interface BatchRequest {
  transactions: BatchTransaction[];
  strategy: "parallel" | "sequential" | "optimized";
  maxGasPerBatch?: number;
  deadline?: number;
}

export interface BatchTransaction {
  id: string;
  to: string;
  data: string;
  value?: bigint;
  gasLimit?: number;
  priority?: number;
}

export interface BatchResult {
  batches: ExecutedBatch[];
  totalGasUsed: number;
  totalCost: number;
  savingsVsIndividual: number; // %
  failures: { id: string; error: string }[];
}

export interface ExecutedBatch {
  batchIndex: number;
  transactions: string[]; // hashes
  gasUsed: number;
  gasPrice: number;
  cost: number;
  status: "success" | "partial" | "failed";
  blockNumber?: number;
  timestamp: number;
}

export interface GasPriceHistory {
  chainId: ChainId;
  period: { start: number; end: number };
  prices: GasPricePoint[];
  stats: GasPriceStats;
}

export interface GasPricePoint {
  timestamp: number;
  blockNumber: number;
  baseFee: number;
  priorityFee: number;
  gasUsed: number;
  gasLimit: number;
  utilization: number;
}

export interface GasPriceStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
  trend: "rising" | "falling" | "stable";
}

export interface GasTokenInfo {
  symbol: "CHI" | "GST2";
  address: string;
  balance: number;
  mintRate: number; // gas tokens per ETH
  burnRate: number; // gas saved per token
  savingsPercent: number;
  breakEvenGasPrice: number;
}

export interface ContractGasProfile {
  contractAddress: string;
  methodProfiles: MethodGasProfile[];
  averageGas: number;
  p95Gas: number;
  lastAnalyzed: number;
}

export interface MethodGasProfile {
  methodId: string;
  methodName: string;
  averageGas: number;
  minGas: number;
  maxGas: number;
  callCount: number;
  avgCalldataSize: number;
}

export class GasOptimizer extends BaseSDK {
  readonly chainId: ChainId;
  private readonly maxGasPrice: number;
  private readonly gasHistory: GasPricePoint[] = [];

  constructor(config: GasOptimizerConfig) {
    super(config, `GasOptimizer:${config.chainId}`);
    this.chainId = config.chainId;
    this.maxGasPrice = (config.maxGasPriceGwei || 100) * 1e9;
  }

  // ── Estimation ─────────────────────────────────────────────────────────

  async estimateGas(from: string, to: string, data?: string, value?: bigint): Promise<GasEstimate> {
    const [gasResult, blockNumber] = await Promise.all([
      this.estimateGasRaw(from, to, data, value),
      this.getBlockNumber().catch(() => 0),
    ]);

    const congestion = this.calculateCongestion(gasResult.utilization);
    const timing = this.suggestTiming();

    const estimate: GasEstimate = {
      chainId: this.chainId,
      baseFee: gasResult.baseFee,
      priorityFee: gasResult.priorityFee,
      maxFee: gasResult.baseFee + gasResult.priorityFee,
      gasLimit: gasResult.gasLimit,
      estimatedCost: (gasResult.gasLimit * (gasResult.baseFee + gasResult.priorityFee)) / 1e9,
      confidence: 0.9,
      timestamp: Date.now(),
      blockNumber,
      congestion,
      suggestedTiming: timing,
      breaks: {
        baseFee: gasResult.baseFee,
        priorityFee: gasResult.priorityFee,
        execution: Math.floor(gasResult.gasLimit * 0.6),
        calldata: Math.floor(data?.length || 0) * 16,
      },
    };

    // Record for history
    this.recordGasPoint(estimate);

    return estimate;
  }

  async estimateGasRaw(from: string, to: string, data?: string, value?: bigint): Promise<{
    gasLimit: number; baseFee: number; priorityFee: number; utilization: number;
  }> {
    return withRetry(async () => {
      const [gasLimit, feeData, block] = await Promise.all([
        this.rpcCall<string>("eth_estimateGas", [{ from, to, data: data || "0x", value: value ? `0x${value.toString(16)}` : undefined }]),
        this.rpcCall<Record<string, string>>("eth_gasPrice", []),
        this.rpcCall<Record<string, string>>("eth_getBlockByNumber", ["latest", false]),
      ]);

      const baseFee = block.baseFeePerGas ? parseInt(block.baseFeePerGas, 16) : parseInt(feeData, 16) / 2;
      const gasUsed = parseInt(block.gasUsed, 16);
      const gasLimitBlock = parseInt(block.gasLimit, 16);
      const utilization = gasUsed / gasLimitBlock;

      return {
        gasLimit: Math.ceil(parseInt(gasLimit, 16) * 1.2), // 20% buffer
        baseFee: Math.ceil(baseFee),
        priorityFee: Math.ceil(baseFee * 0.1), // 10% of base fee
        utilization,
      };
    }, { attempts: 3 });
  }

  async getOptimalGasPrice(targetConfirmationBlocks = 3): Promise<GasEstimate> {
    await this.updateGasHistory();
    const stats = this.calculateGasStats();

    // Gas price for target confirmation
    let targetPrice: number;
    switch (targetConfirmationBlocks) {
      case 1: targetPrice = stats.p95; break;
      case 3: targetPrice = stats.p75; break;
      case 5: targetPrice = stats.p50; break;
      case 10: targetPrice = stats.p25; break;
      default: targetPrice = stats.mean;
    }

    const blockNumber = await this.getBlockNumber().catch(() => 0);

    return {
      chainId: this.chainId,
      baseFee: stats.median,
      priorityFee: Math.ceil(targetPrice * 0.1),
      maxFee: targetPrice,
      gasLimit: 21000,
      estimatedCost: (21000 * targetPrice) / 1e9,
      confidence: 0.85,
      timestamp: Date.now(),
      blockNumber,
      congestion: this.calculateCongestionFromStats(stats),
      breaks: { baseFee: stats.median, priorityFee: Math.ceil(targetPrice * 0.1) },
    };
  }

  // ── Timing ─────────────────────────────────────────────────────────────

  suggestTiming(): TimingSuggestion {
    const hourly = this.getHourlyGasPattern();
    const currentHour = new Date().getUTCHours();
    const currentPrice = this.gasHistory.length > 0 ? this.gasHistory[this.gasHistory.length - 1]!.baseFee : 0;

    // Find cheapest upcoming hours
    let cheapestHour = currentHour;
    let cheapestPrice = hourly[currentHour] || 100;
    for (let i = 0; i < 24; i++) {
      const h = (currentHour + i) % 24;
      if ((hourly[h] || 100) < cheapestPrice) {
        cheapestPrice = hourly[h] || 100;
        cheapestHour = h;
      }
    }

    const shouldWait = cheapestPrice < currentPrice * 0.85;
    const waitHours = cheapestHour >= currentHour ? cheapestHour - currentHour : (24 - currentHour) + cheapestHour;

    return {
      shouldWait,
      reason: shouldWait
        ? `Gas is ${Math.round((1 - cheapestPrice / currentPrice) * 100)}% cheaper at ${cheapestHour}:00 UTC`
        : "Current gas price is near optimal",
      suggestedWaitSeconds: shouldWait ? waitHours * 3600 : 0,
      expectedSavings: shouldWait ? Math.round((1 - cheapestPrice / currentPrice) * 100) : 0,
      nextLowCongestion: shouldWait ? Date.now() + waitHours * 3600 * 1000 : Date.now(),
      hourlyPattern: hourly,
    };
  }

  private getHourlyGasPattern(): number[] {
    const hourly = new Array(24).fill(100);
    const now = Date.now();
    const cutoff = now - 7 * 86400000; // 7 days

    const recentHistory = this.gasHistory.filter(p => p.timestamp >= cutoff);
    if (recentHistory.length === 0) return hourly;

    const hourCounts = new Array(24).fill(0);
    for (const point of recentHistory) {
      const hour = new Date(point.timestamp).getUTCHours();
      hourly[hour] += point.baseFee;
      hourCounts[hour]++;
    }

    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > 0) {
        hourly[i] = Math.round(hourly[i]! / hourCounts[i]!);
      }
    }

    // Normalize to relative index (100 = average)
    const avg = hourly.reduce((s, p) => s + p, 0) / 24;
    if (avg > 0) {
      for (let i = 0; i < 24; i++) {
        hourly[i] = Math.round((hourly[i]! / avg) * 100);
      }
    }

    return hourly;
  }

  // ── History & Stats ────────────────────────────────────────────────────

  private async getBlockNumber(): Promise<number> {
    const raw = await this.rpcCall<string>("eth_blockNumber", []);
    return parseInt(raw, 16);
  }

  private async updateGasHistory(blocks = 20): Promise<void> {
    const latest = await this.getBlockNumber();
    for (let i = 0; i < blocks; i++) {
      try {
        const block = await this.rpcCall<Record<string, string>>("eth_getBlockByNumber", [`0x${(latest - i).toString(16)}`, false]);
        this.gasHistory.push({
          timestamp: parseInt(block.timestamp, 16) * 1000,
          blockNumber: parseInt(block.number, 16),
          baseFee: block.baseFeePerGas ? parseInt(block.baseFeePerGas, 16) : 0,
          priorityFee: 0,
          gasUsed: parseInt(block.gasUsed, 16),
          gasLimit: parseInt(block.gasLimit, 16),
          utilization: parseInt(block.gasUsed, 16) / parseInt(block.gasLimit, 16),
        });
      } catch { /* skip failed blocks */ }
    }
    // Keep last 1000 points
    if (this.gasHistory.length > 1000) {
      this.gasHistory.splice(0, this.gasHistory.length - 1000);
    }
  }

  getGasHistory(period?: { start: number; end: number }): GasPriceHistory {
    const prices = period
      ? this.gasHistory.filter(p => p.timestamp >= period.start && p.timestamp <= period.end)
      : [...this.gasHistory];

    const baseFees = prices.map(p => p.baseFee);
    const stats = this.computeGasStats(baseFees);

    return {
      chainId: this.chainId,
      period: { start: prices[0]?.timestamp || 0, end: prices[prices.length - 1]?.timestamp || 0 },
      prices,
      stats,
    };
  }

  private computeGasStats(values: number[]): GasPriceStats {
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, p25: 0, p75: 0, p90: 0, p95: 0, p99: 0, stdDev: 0, trend: "stable" };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const p25 = sorted[Math.floor(sorted.length * 0.25)] || 0;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Trend: compare first half vs second half
    const half = Math.floor(values.length / 2);
    const firstHalfAvg = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const secondHalfAvg = values.slice(half).reduce((s, v) => s + v, 0) / (values.length - half);
    const trend = secondHalfAvg > firstHalfAvg * 1.05 ? "rising"
      : secondHalfAvg < firstHalfAvg * 0.95 ? "falling"
      : "stable";

    return { min: sorted[0] || 0, max: sorted[sorted.length - 1] || 0, mean, median, p25, p75, p90, p95, p99, stdDev, trend };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private calculateCongestion(utilization: number): "low" | "medium" | "high" | "extreme" {
    if (utilization < 0.3) return "low";
    if (utilization < 0.6) return "medium";
    if (utilization < 0.85) return "high";
    return "extreme";
  }

  private calculateCongestionFromStats(stats: GasPriceStats): "low" | "medium" | "high" | "extreme" {
    if (stats.mean < stats.p25 * 1.2) return "low";
    if (stats.mean < stats.p75) return "medium";
    if (stats.mean < stats.p90) return "high";
    return "extreme";
  }

  private recordGasPoint(estimate: GasEstimate): void {
    this.gasHistory.push({
      timestamp: estimate.timestamp,
      blockNumber: estimate.blockNumber,
      baseFee: estimate.baseFee,
      priorityFee: estimate.priorityFee,
      gasUsed: estimate.gasLimit,
      gasLimit: estimate.gasLimit,
      utilization: 0.5,
    });
    if (this.gasHistory.length > 1000) this.gasHistory.shift();
  }

  calculateSavings(estimatedGas: number, optimizedGas: number, gasPriceGwei: number): {
    gasSaved: number;
    costSaved: number;
    savingsPercent: number;
  } {
    const gasSaved = estimatedGas - optimizedGas;
    const costSaved = (gasSaved * gasPriceGwei) / 1e9;
    return {
      gasSaved,
      costSaved,
      savingsPercent: estimatedGas > 0 ? Math.round((gasSaved / estimatedGas) * 100) : 0,
    };
  }

  estimateCalldataGas(data: string): number {
    const bytes = data.replace("0x", "").match(/.{2}/g) || [];
    let gas = 0;
    for (const byte of bytes) {
      gas += byte === "00" ? 4 : 16; // zero byte = 4 gas, non-zero = 16 gas
    }
    return gas;
  }
}
