/**
 * Sportradar SDK Cache Layer
 */

export interface CacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: CacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 120_000; // 2 min default
    this.maxEntries = options.maxEntries ?? 1000;
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
    if (this.store.size >= this.maxEntries) {
      this.evict();
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
      createdAt: Date.now(),
    });
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

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    // If still over limit, remove oldest
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
  }
}

export class CacheKeys {
  static sports(): string { return 'sports:list'; }
  static sport(id: string): string { return `sport:${id}`; }
  static tournaments(sportId: string): string { return `tournaments:${sportId}`; }
  static tournament(id: string): string { return `tournament:${id}`; }
  static seasons(tournamentId: string): string { return `seasons:${tournamentId}`; }
  static currentSeason(tournamentId: string): string { return `season:current:${tournamentId}`; }
  static schedule(seasonId: string): string { return `schedule:${seasonId}`; }
  static liveMatches(sportId: string): string { return `live:${sportId}`; }
  static match(matchId: string): string { return `match:${matchId}`; }
  static matchSummary(matchId: string): string { return `summary:${matchId}`; }
  static playByPlay(matchId: string): string { return `pbp:${matchId}`; }
  static standings(seasonId: string): string { return `standings:${seasonId}`; }
  static injuries(tournamentId: string): string { return `injuries:${tournamentId}`; }
  static lineup(matchId: string): string { return `lineup:${matchId}`; }
  static statistics(matchId: string): string { return `stats:${matchId}`; }
}
