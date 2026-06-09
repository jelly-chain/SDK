/**
 * World Cup Jelly SDK — In-Memory TTL Cache
 *
 * Fast key-value cache with TTL expiration, LRU eviction, and size limits.
 * Used by all SDK modules to avoid redundant API calls.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export interface MemoryCacheOptions {
  ttlSeconds?: number;
  maxSize?: number;
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  avgEntryAgeMs: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttlMs: number;
  private maxSize: number;
  private onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: MemoryCacheOptions = {}) {
    this.ttlMs = (options.ttlSeconds ?? 120) * 1000;
    this.maxSize = options.maxSize ?? 10000;
    this.onEvict = options.onEvict;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + (ttlMs ?? this.ttlMs),
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (entry) {
      this.store.delete(key);
      this.onEvict?.(key, entry);
      return true;
    }
    return false;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.store) {
        this.onEvict(key, entry);
      }
    }
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  getStats(): CacheStats {
    const now = Date.now();
    let totalAge = 0;
    for (const entry of this.store.values()) {
      totalAge += now - entry.createdAt;
    }
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
      avgEntryAgeMs: this.store.size > 0 ? totalAge / this.store.size : 0,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.store.get(oldestKey)!;
      this.store.delete(oldestKey);
      this.evictions++;
      this.onEvict?.(oldestKey, entry);
    }
  }

  /** Get multiple keys at once. Returns a map of key → value (only for existing, non-expired keys). */
  mget<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }

  /** Set multiple key-value pairs at once. */
  mset<T>(entries: Array<{ key: string; value: T; ttlMs?: number }>): void {
    for (const { key, value, ttlMs } of entries) {
      this.set(key, value, ttlMs);
    }
  }

  /** Get or set: if key exists return cached value, otherwise call factory and cache the result. */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Clean up expired entries. Returns the number of entries removed. */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }
}
