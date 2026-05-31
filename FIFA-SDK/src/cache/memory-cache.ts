export interface MemoryCacheOptions {
  ttlSeconds?: number;
}

/** Simple in-memory TTL cache used across all SDK modules. */
export class MemoryCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private ttlMs: number;

  constructor(options: MemoryCacheOptions = {}) {
    this.ttlMs = (options.ttlSeconds ?? 120) * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.ttlMs) });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
