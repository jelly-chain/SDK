/**
 * PriceOracle — multi-source price feed aggregator with TWAP, confidence scoring,
 * deviation detection, and fallback chain.
 */

import { BaseSDK, type BaseSDKConfig, type RetryConfig } from "@jellychain/sdk-core";
import { SdkError, ErrorCode } from "@jellychain/sdk-core";
import type { TokenPrice, TokenRef } from "@jellychain/shared-types";
import { ChainId } from "@jellychain/shared-types";

export interface PriceOracleConfig extends BaseSDKConfig {
  sources?: PriceSource[];
  defaultSource?: string;
  maxDeviationPercent?: number;
  twapWindow?: number; // seconds
  staleThreshold?: number; // seconds
  confidenceThreshold?: number;
}

export enum PriceSourceType {
  CHAINLINK = "chainlink",
  PYTH = "pyth",
  REDSTONE = "redstone",
  UNISWAP_V3 = "uniswap_v3",
  CURVE = "curve",
  BALANCER = "balancer",
  COINGECKO = "coingecko",
  COINMARKETCAP = "coinmarketcap",
  BINANCE = "binance",
  BYBIT = "bybit",
  OKX = "okx",
  KRAKEN = "kraken",
  CUSTOM = "custom",
}

export interface PriceSource {
  name: string;
  type: PriceSourceType;
  weight: number; // 0-1, confidence weight
  priority: number; // lower = higher priority
  baseUrl?: string;
  apiKey?: string;
  chainId?: number;
  enabled: boolean;
}

export interface PriceResult {
  token: TokenRef;
  price: number;
  confidence: number; // 0-1
  sources: SourcePrice[];
  aggregated: string; // "median" | "weighted_mean" | "best_source"
  twap?: number;
  lastUpdated: number;
  stale: boolean;
  deviation?: number; // % deviation from median
}

export interface SourcePrice {
  source: string;
  type: PriceSourceType;
  price: number;
  confidence: number;
  timestamp: number;
  raw: Record<string, unknown>;
}

export interface TWAPResult {
  token: TokenRef;
  twap: number;
  window: number;
  samples: number;
  min: number;
  max: number;
  stdDev: number;
  lastUpdated: number;
}

export interface PriceAlert {
  id: string;
  token: TokenRef;
  condition: "above" | "below" | "change_above" | "change_below" | "deviation_above";
  value: number;
  timeframe?: number;
  triggered: boolean;
  lastTriggered?: number;
}

export class PriceOracle extends BaseSDK {
  private sources: PriceSource[];
  private readonly maxDeviation: number;
  private readonly staleThreshold: number;
  private readonly twapWindow: number;
  private priceHistory: Map<string, Array<{ price: number; timestamp: number }>> = new Map();

  constructor(config: PriceOracleConfig) {
    super(config, "PriceOracle");
    this.sources = config.sources || this.getDefaultSources();
    this.maxDeviation = config.maxDeviationPercent ?? 2;
    this.staleThreshold = config.staleThreshold ?? 60;
    this.twapWindow = config.twapWindow ?? 3600;
  }

  private getDefaultSources(): PriceSource[] {
    return [
      { name: "chainlink", type: PriceSourceType.CHAINLINK, weight: 0.9, priority: 1, chainId: 1, enabled: true },
      { name: "coingecko", type: PriceSourceType.COINGECKO, weight: 0.7, priority: 2, baseUrl: "https://api.coingecko.com/api/v3", enabled: true },
      { name: "binance", type: PriceSourceType.BINANCE, weight: 0.6, priority: 3, baseUrl: "https://api.binance.com/api/v3", enabled: true },
      { name: "bybit", type: PriceSourceType.BYBIT, weight: 0.5, priority: 4, baseUrl: "https://api.bybit.com/v5", enabled: true },
      { name: "kraken", type: PriceSourceType.KRAKEN, weight: 0.5, priority: 5, baseUrl: "https://api.kraken.com/0", enabled: true },
    ];
  }

  async getPrice(token: TokenRef, sources?: string[]): Promise<PriceResult> {
    const activeSources = sources
      ? this.sources.filter(s => sources.includes(s.name) && s.enabled)
      : this.sources.filter(s => s.enabled);

    if (activeSources.length === 0) {
      throw new SdkError("No active price sources", ErrorCode.INVALID_CONFIG);
    }

    const results = await Promise.allSettled(
      activeSources.map(source => this.fetchFromSource(token, source))
    );

    const validPrices: SourcePrice[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        validPrices.push(result.value);
      }
    }

    if (validPrices.length === 0) {
      throw new SdkError(`No price available for ${token.symbol}`, ErrorCode.DATA_NOT_FOUND);
    }

    // Check deviation
    const prices = validPrices.map(p => p.price);
    const median = this.calculateMedian(prices);
    const deviation = this.calculateMaxDeviation(prices, median);

    if (deviation > this.maxDeviation && validPrices.length > 1) {
      this.emit("priceDeviation", { token, deviation, prices: validPrices });
    }

    // Weighted aggregation
    const aggregatedPrice = this.aggregateWeighted(validPrices);
    const avgConfidence = validPrices.reduce((sum, p) => sum + p.confidence, 0) / validPrices.length;

    // Record for TWAP
    this.recordPrice(token, aggregatedPrice);

    // Calculate TWAP if enough history
    let twap: number | undefined;
    try { twap = this.calculateTWAP(token, this.twapWindow); } catch { /* not enough history */ }

    return {
      token,
      price: aggregatedPrice,
      confidence: avgConfidence * (1 - deviation / 100),
      sources: validPrices,
      aggregated: "weighted_mean",
      twap,
      lastUpdated: Math.max(...validPrices.map(p => p.timestamp)),
      stale: Date.now() - Math.max(...validPrices.map(p => p.timestamp)) > this.staleThreshold * 1000,
      deviation,
    };
  }

  async getPrices(tokens: TokenRef[]): Promise<Map<string, PriceResult>> {
    const results = new Map<string, PriceResult>();
    const settled = await Promise.allSettled(
      tokens.map(t => this.getPrice(t).then(r => ({ symbol: t.symbol, result: r })))
    );
    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.set(s.value.symbol, s.value.result);
      }
    }
    return results;
  }

  async getTWAP(token: TokenRef, window?: number): Promise<TWAPResult> {
    const w = window ?? this.twapWindow;
    const history = this.priceHistory.get(token.symbol);
    if (!history || history.length < 2) {
      throw new SdkError(`Insufficient price history for ${token.symbol}`, ErrorCode.DATA_NOT_FOUND);
    }

    const cutoff = Date.now() - w * 1000;
    const samples = history.filter(h => h.timestamp >= cutoff);
    if (samples.length < 2) throw new SdkError("Not enough samples for TWAP", ErrorCode.DATA_NOT_FOUND);

    const prices = samples.map(s => s.price);
    const twap = this.calculateTimeWeightedAverage(samples);

    return {
      token,
      twap,
      window: w,
      samples: samples.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      stdDev: this.calculateStdDev(prices),
      lastUpdated: samples[samples.length - 1]!.timestamp,
    };
  }

  // ── Source Fetchers ────────────────────────────────────────────────────

  private async fetchFromSource(token: TokenRef, source: PriceSource): Promise<SourcePrice | null> {
    try {
      switch (source.type) {
        case PriceSourceType.COINGECKO:
          return this.fetchCoinGecko(token, source);
        case PriceSourceType.BINANCE:
          return this.fetchBinance(token, source);
        case PriceSourceType.BYBIT:
          return this.fetchBybit(token, source);
        case PriceSourceType.KRAKEN:
          return this.fetchKraken(token, source);
        default:
          return null;
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch ${token.symbol} from ${source.name}: ${err}`);
      return null;
    }
  }

  private async fetchCoinGecko(token: TokenRef, source: PriceSource): Promise<SourcePrice | null> {
    if (!token.coingeckoId) return null;
    const url = `${source.baseUrl}/simple/price?ids=${token.coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    const data = await this.request<Record<string, Record<string, number>>>(url);
    const tokenData = data[token.coingeckoId];
    if (!tokenData) return null;
    return {
      source: source.name,
      type: source.type,
      price: tokenData.usd,
      confidence: source.weight,
      timestamp: Date.now(),
      raw: tokenData as unknown as Record<string, unknown>,
    };
  }

  private async fetchBinance(token: TokenRef, source: PriceSource): Promise<SourcePrice | null> {
    const symbol = `${token.symbol}USDT`;
    const url = `${source.baseUrl}/ticker/24hr?symbol=${symbol}`;
    const data = await this.request<Record<string, string>>(url);
    return {
      source: source.name,
      type: source.type,
      price: parseFloat(data.lastPrice),
      confidence: source.weight,
      timestamp: Date.now(),
      raw: data as unknown as Record<string, unknown>,
    };
  }

  private async fetchBybit(token: TokenRef, source: PriceSource): Promise<SourcePrice | null> {
    const symbol = `${token.symbol}USDT`;
    const url = `${source.baseUrl}/market/tickers?category=spot&symbol=${symbol}`;
    const data = await this.request<{ result: { list: Record<string, string>[] } }>(url);
    const ticker = data.result.list[0];
    if (!ticker) return null;
    return {
      source: source.name,
      type: source.type,
      price: parseFloat(ticker.lastPrice),
      confidence: source.weight,
      timestamp: Date.now(),
      raw: ticker as unknown as Record<string, unknown>,
    };
  }

  private async fetchKraken(token: TokenRef, source: PriceSource): Promise<SourcePrice | null> {
    const pair = `X${token.symbol}ZUSD`;
    const url = `${source.baseUrl}/public/Ticker?pair=${pair}`;
    const data = await this.request<{ result: Record<string, Record<string, string | string[]>> }>(url);
    const ticker = data.result[pair];
    if (!ticker) return null;
    return {
      source: source.name,
      type: source.type,
      price: parseFloat(ticker.c?.[0] as string || "0"),
      confidence: source.weight,
      timestamp: Date.now(),
      raw: ticker as unknown as Record<string, unknown>,
    };
  }

  // ── Aggregation ────────────────────────────────────────────────────────

  private aggregateWeighted(prices: SourcePrice[]): number {
    const totalWeight = prices.reduce((sum, p) => sum + p.confidence, 0);
    return prices.reduce((sum, p) => sum + p.price * (p.confidence / totalWeight), 0);
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  private calculateMaxDeviation(values: number[], median: number): number {
    if (median === 0) return 0;
    const deviations = values.map(v => Math.abs(v - median) / median * 100);
    return Math.max(...deviations);
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squared = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squared.reduce((s, v) => s + v, 0) / values.length);
  }

  // ── TWAP ───────────────────────────────────────────────────────────────

  private recordPrice(token: TokenRef, price: number): void {
    if (!this.priceHistory.has(token.symbol)) {
      this.priceHistory.set(token.symbol, []);
    }
    const history = this.priceHistory.get(token.symbol)!;
    history.push({ price, timestamp: Date.now() });
    // Keep last 24 hours of data
    const cutoff = Date.now() - 86400000;
    while (history.length > 1 && history[0]!.timestamp < cutoff) {
      history.shift();
    }
  }

  private calculateTimeWeightedAverage(samples: Array<{ price: number; timestamp: number }>): number {
    if (samples.length < 2) return samples[0]?.price || 0;
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 1; i < samples.length; i++) {
      const dt = samples[i]!.timestamp - samples[i - 1]!.timestamp;
      weightedSum += samples[i - 1]!.price * dt;
      totalWeight += dt;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : samples[0]!.price;
  }

  // ── Config ─────────────────────────────────────────────────────────────

  addSource(source: PriceSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => a.priority - b.priority);
  }

  removeSource(name: string): void {
    this.sources = this.sources.filter(s => s.name !== name);
  }

  enableSource(name: string, enabled: boolean): void {
    const source = this.sources.find(s => s.name === name);
    if (source) source.enabled = enabled;
  }

  getSources(): ReadonlyArray<PriceSource> {
    return this.sources;
  }

  clearHistory(tokenSymbol?: string): void {
    if (tokenSymbol) {
      this.priceHistory.delete(tokenSymbol);
    } else {
      this.priceHistory.clear();
    }
  }
}
