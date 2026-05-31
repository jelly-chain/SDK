/**
 * Redis-backed cache stub.
 * Provides the same interface as MemoryCache but persists across process restarts.
 * Requires a Redis connection URL configured via WorldCupSDKConfig.cache.redisUrl.
 */
export class RedisCache {
  private url: string;

  constructor(redisUrl: string) {
    this.url = redisUrl;
  }

  async get<T>(key: string): Promise<T | null> {
    throw new Error('RedisCache: not yet connected. Provide a valid redisUrl in config.');
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    throw new Error('RedisCache: not yet connected. Provide a valid redisUrl in config.');
  }

  async delete(key: string): Promise<void> {
    throw new Error('RedisCache: not yet connected.');
  }

  async clear(): Promise<void> {
    throw new Error('RedisCache: not yet connected.');
  }
}
