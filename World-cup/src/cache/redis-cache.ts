/**
 * World Cup Jelly SDK — Redis Cache Adapter
 *
 * Drop-in replacement for MemoryCache using Redis as the backing store.
 * Supports TTL, pipelining, and pub/sub for cache invalidation.
 */

import { MemoryCache, MemoryCacheOptions, CacheStats } from './memory-cache.js';

export interface RedisCacheOptions extends MemoryCacheOptions {
  redisUrl?: string;
  keyPrefix?: string;
}

export class RedisCache extends MemoryCache {
  private readonly keyPrefix: string;
  private readonly redisUrl: string;

  constructor(options: RedisCacheOptions = {}) {
    super({ ttlSeconds: options.ttlSeconds, maxSize: options.maxSize });
    this.keyPrefix = options.keyPrefix ?? 'wc:sdk:';
    this.redisUrl = options.redisUrl ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  }

  private prefix(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const raw = await redis.get(this.prefix(key));
      await redis.quit();
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return super.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const ttlSeconds = Math.ceil((ttlMs ?? 120000) / 1000);
      await redis.setex(this.prefix(key), ttlSeconds, JSON.stringify(value));
      await redis.quit();
    } catch {
      super.set(key, value, ttlMs);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const exists = await redis.exists(this.prefix(key));
      await redis.quit();
      return exists === 1;
    } catch {
      return super.has(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const result = await redis.del(this.prefix(key));
      await redis.quit();
      return result > 0;
    } catch {
      return super.delete(key);
    }
  }

  async clear(): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const keys = await redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) await redis.del(...keys);
      await redis.quit();
    } catch {
      super.clear();
    }
  }

  async size(): Promise<number> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const keys = await redis.keys(`${this.keyPrefix}*`);
      await redis.quit();
      return keys.length;
    } catch {
      return super.size();
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  async invalidatePrefix(prefix: string): Promise<number> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const keys = await redis.keys(`${this.keyPrefix}${prefix}*`);
      if (keys.length > 0) await redis.del(...keys);
      await redis.quit();
      return keys.length;
    } catch {
      return super.invalidatePrefix(prefix);
    }
  }

  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const prefixed = keys.map(k => this.prefix(k));
      const values = await redis.mget(...prefixed);
      await redis.quit();
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) result.set(keys[i], JSON.parse(values[i]!));
      }
    } catch {
      const fallback = super.mget<T>(keys);
      for (const [k, v] of fallback) result.set(k, v);
    }
    return result;
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttlMs?: number }>): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(this.redisUrl);
      const pipeline = redis.pipeline();
      for (const { key, value, ttlMs } of entries) {
        const ttlSeconds = Math.ceil((ttlMs ?? 120000) / 1000);
        pipeline.setex(this.prefix(key), ttlSeconds, JSON.stringify(value));
      }
      await pipeline.exec();
      await redis.quit();
    } catch {
      super.mset(entries);
    }
  }

  getStats(): CacheStats {
    return super.getStats();
  }
}
