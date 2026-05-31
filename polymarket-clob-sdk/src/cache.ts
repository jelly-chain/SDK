export interface CacheEntry<T> { value: T; expiresAt: number; }
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  constructor(private ttlMs = 30000) {}
  get<T>(k: string): T | null {
    const e = this.store.get(k);
    if (!e || Date.now() > e.expiresAt) { this.store.delete(k); return null; }
    return e.value as T;
  }
  set<T>(k: string, v: T, ttl?: number) { this.store.set(k, { value: v, expiresAt: Date.now() + (ttl ?? this.ttlMs) }); }
  has(k: string) { return this.get(k) !== null; }
  clear() { this.store.clear(); }
}
