/**
 * BaseSDK — abstract base class for all Jelly Chain SDKs.
 * Provides: config management, logging, caching, rate limiting, retry, event emitter.
 */

import type { ChainId, ChainMetadata } from "@jellychain/shared-types";
import { getChainMetadata } from "@jellychain/shared-types";
import { SdkError, ErrorCode, RpcError } from "./errors.js";

// ── Config ──────────────────────────────────────────────────────────────────

export interface BaseSDKConfig {
  chainId?: ChainId;
  rpcUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
  rateLimit?: number; // requests per second
  logLevel?: "debug" | "info" | "warn" | "error";
  userAgent?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG: Partial<BaseSDKConfig> = {
  timeout: 30_000,
  retries: 3,
  retryDelay: 1_000,
  cacheEnabled: true,
  cacheTtl: 30_000,
  rateLimit: 10,
  logLevel: "warn",
};

// ── Event Emitter ──────────────────────────────────────────────────────────

export type EventCallback<T = unknown> = (data: T) => void;
export type ErrorCallback = (error: Error) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private errorListeners: Set<ErrorCallback> = new Set();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<T = unknown>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data as unknown); } catch { /* swallow listener errors */ }
    });
  }

  onError(cb: ErrorCallback): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  emitError(error: Error): void {
    this.errorListeners.forEach(cb => {
      try { cb(error); } catch { /* swallow */ }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
    this.errorListeners.clear();
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// ── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl: number): void {
    if (this.store.size >= this.maxSize) {
      // Evict oldest 10%
      const keys = [...this.store.keys()];
      for (let i = 0; i < Math.floor(this.maxSize * 0.1); i++) {
        this.store.delete(keys[i]!);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// ── Rate Limiter ────────────────────────────────────────────────────────────

class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private readonly maxConcurrent: number;
  private readonly minInterval: number;
  private lastRequest = 0;

  constructor(rps: number) {
    this.maxConcurrent = Math.max(1, rps);
    this.minInterval = 1000 / rps;
  }

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      this.process();
    });
  }

  private process(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
    const now = Date.now();
    const wait = Math.max(0, this.minInterval - (now - this.lastRequest));
    if (wait > 0) {
      setTimeout(() => this.process(), wait);
      return;
    }
    this.lastRequest = Date.now();
    this.running++;
    const next = this.queue.shift()!;
    next();
  }

  release(): void {
    this.running = Math.max(0, this.running - 1);
    this.process();
  }
}

// ── Logger ──────────────────────────────────────────────────────────────────

export class Logger {
  private level: number;
  private prefix: string;

  static levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(prefix?: string, level?: string) {
    this.prefix = prefix ? `[${prefix}]` : "[SDK]";
    this.level = Logger.levels[level ?? "warn"] ?? 2;
  }

  debug(msg: string, ...args: unknown[]): void {
    if (this.level <= 0) console.debug(this.prefix, msg, ...args);
  }
  info(msg: string, ...args: unknown[]): void {
    if (this.level <= 1) console.info(this.prefix, msg, ...args);
  }
  warn(msg: string, ...args: unknown[]): void {
    if (this.level <= 2) console.warn(this.prefix, msg, ...args);
  }
  error(msg: string, ...args: unknown[]): void {
    if (this.level <= 3) console.error(this.prefix, msg, ...args);
  }
}

// ── Retry ───────────────────────────────────────────────────────────────────

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: number; // multiplier
  maxDelay: number;
  retryOn?: (error: Error) => boolean;
}

const DEFAULT_RETRY: RetryConfig = {
  attempts: 3,
  delay: 1_000,
  backoff: 2,
  maxDelay: 30_000,
  retryOn: (err) => {
    if (err instanceof SdkError) return err.retryable;
    return true;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY, ...config };
  let lastError: Error = new Error("No attempts made");
  for (let attempt = 0; attempt < cfg.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < cfg.attempts - 1 && (!cfg.retryOn || cfg.retryOn(lastError))) {
        const delay = Math.min(cfg.delay * Math.pow(cfg.backoff, attempt), cfg.maxDelay);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ── BaseSDK Class ───────────────────────────────────────────────────────────

export abstract class BaseSDK {
  protected readonly config: BaseSDKConfig;
  protected readonly logger: Logger;
  protected readonly cache: SimpleCache;
  protected readonly events: EventEmitter;
  protected readonly rateLimiter: RateLimiter;
  protected _initialized = false;

  constructor(config: BaseSDKConfig = {}, name?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger(name, this.config.logLevel);
    this.cache = new SimpleCache();
    this.events = new EventEmitter();
    this.rateLimiter = new RateLimiter(this.config.rateLimit ?? 10);
  }

  // ── Initialization ─────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this._initialized) return;
    this.logger.debug("Initializing...");
    await this.onInitialize();
    this._initialized = true;
    this.events.emit("initialized");
    this.logger.info("Initialized");
  }

  async dispose(): Promise<void> {
    this.logger.debug("Disposing...");
    await this.onDispose();
    this.cache.clear();
    this.events.removeAllListeners();
    this._initialized = false;
    this.events.emit("disposed");
  }

  protected async onInitialize(): Promise<void> {}
  protected async onDispose(): Promise<void> {}

  get initialized(): boolean {
    return this._initialized;
  }

  // ── Events ─────────────────────────────────────────────────────────────

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    return this.events.on(event, callback);
  }

  onError(callback: ErrorCallback): () => void {
    return this.events.onError(callback);
  }

  protected emit<T = unknown>(event: string, data?: T): void {
    this.events.emit(event, data);
  }

  protected emitError(error: Error): void {
    this.events.emitError(error);
  }

  // ── Chain Helpers ──────────────────────────────────────────────────────

  protected getChainMetadata(chainId?: ChainId): ChainMetadata | undefined {
    const id = chainId ?? this.config.chainId;
    return id !== undefined ? getChainMetadata(id) : undefined;
  }

  // ── HTTP Client ────────────────────────────────────────────────────────

  protected async request<T>(
    url: string,
    options: {
      method?: string;
      body?: string;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
      cacheKey?: string;
      cacheTtl?: number;
    } = {}
  ): Promise<T> {
    const {
      method = "GET", body, headers = {},
      timeout = this.config.timeout,
      retries = this.config.retries,
      cacheKey, cacheTtl,
    } = options;

    // Check cache
    if (cacheKey && this.config.cacheEnabled) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    const result = await withRetry(async () => {
      await this.rateLimiter.acquire();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          body,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": this.config.userAgent ?? "JellyChain-SDK/1.0",
            ...headers,
            ...this.config.customHeaders,
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new SdkError(
            `HTTP ${response.status}: ${text || response.statusText}`,
            response.status === 429 ? ErrorCode.RATE_LIMITED
              : response.status >= 500 ? ErrorCode.API_ERROR
              : ErrorCode.API_ERROR,
            { retryable: response.status >= 500 || response.status === 429 }
          );
        }

        const data = await response.json() as T;

        // Cache result
        if (cacheKey && this.config.cacheEnabled) {
          this.cache.set(cacheKey, data, cacheTtl ?? this.config.cacheTtl ?? 30_000);
        }

        return data;
      } finally {
        this.rateLimiter.release();
      }
    }, { attempts: retries ?? 3 });

    return result;
  }

  // ── RPC Client ─────────────────────────────────────────────────────────

  protected async rpcCall<T>(
    method: string,
    params: unknown[] = [],
    options?: { chainId?: number; rpcUrl?: string; retries?: number }
  ): Promise<T> {
    const chainId = options?.chainId ?? this.config.chainId ?? 1;
    const meta = this.getChainMetadata(chainId);
    const rpcUrl = options?.rpcUrl ?? this.config.rpcUrl ?? meta?.rpcUrls[0];
    if (!rpcUrl) {
      throw new RpcError(
        `No RPC URL for chain ${chainId}`,
        chainId,
        "",
        { retryable: false }
      );
    }

    return withRetry(async () => {
      await this.rateLimiter.acquire();
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method,
            params,
          }),
        });

        if (!response.ok) {
          throw new RpcError(
            `RPC HTTP ${response.status}`,
            chainId,
            rpcUrl,
            { statusCode: response.status, retryable: response.status >= 500 }
          );
        }

        const data = await response.json() as { result?: T; error?: { code: number; message: string } };

        if (data.error) {
          throw new RpcError(
            data.error.message,
            chainId,
            rpcUrl,
            { rpcCode: data.error.code, rpcMessage: data.error.message, retryable: false }
          );
        }

        return data.result as T;
      } finally {
        this.rateLimiter.release();
      }
    }, { attempts: options?.retries ?? 3 });
  }

  // ── Cache Helpers ──────────────────────────────────────────────────────

  protected cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<T>(key);
      if (cached !== undefined) return Promise.resolve(cached);
    }
    return fn().then(result => {
      if (this.config.cacheEnabled) {
        this.cache.set(key, result, ttl ?? this.config.cacheTtl ?? 30_000);
      }
      return result;
    });
  }

  protected invalidateCache(key?: string): void {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }

  // ── Utility ────────────────────────────────────────────────────────────

  protected assertInitialized(): void {
    if (!this._initialized) {
      throw new SdkError(
        `${this.constructor.name} not initialized. Call initialize() first.`,
        ErrorCode.INVALID_CONFIG,
        { retryable: false }
      );
    }
  }

  protected assertChainId(): number {
    if (this.config.chainId === undefined) {
      throw new SdkError(
        "chainId not configured",
        ErrorCode.INVALID_CONFIG,
        { retryable: false }
      );
    }
    return this.config.chainId;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  protected formatAmount(amount: bigint, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, "0");
    const intPart = str.slice(0, -decimals) || "0";
    const fracPart = str.slice(-decimals).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }

  protected parseAmount(amount: string, decimals: number): bigint {
    const [intPart, fracPart = ""] = amount.split(".");
    const padded = (fracPart + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(intPart! + padded);
  }
}
