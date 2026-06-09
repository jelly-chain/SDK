export interface MemoryEntry {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  tags?: string[];
}

export interface MemoryConfig {
  maxEntries?: number;
  ttlMs?: number;
}

export class Memory {
  private entries: MemoryEntry[] = [];
  private maxEntries: number;
  private ttlMs?: number;
  private idCounter = 0;

  constructor(config: MemoryConfig = {}) {
    this.maxEntries = config.maxEntries || 10000;
    this.ttlMs = config.ttlMs;
  }

  add(entry: Omit<MemoryEntry, 'id'>): MemoryEntry {
    const full: MemoryEntry = { ...entry, id: `mem-${++this.idCounter}` };
    this.entries.push(full);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    if (this.ttlMs) {
      this.evictExpired();
    }

    return full;
  }

  query(filter: Partial<MemoryEntry>): MemoryEntry[] {
    return this.entries.filter(e => {
      if (filter.type && e.type !== filter.type) return false;
      if (filter.tags && !filter.tags.some(t => e.tags?.includes(t))) return false;
      return true;
    });
  }

  getRecent(count = 10): MemoryEntry[] {
    return this.entries.slice(-count);
  }

  clear(): void {
    this.entries = [];
  }

  get size(): number {
    return this.entries.length;
  }

  private evictExpired(): void {
    if (!this.ttlMs) return;
    const cutoff = Date.now() - this.ttlMs;
    this.entries = this.entries.filter(e => e.timestamp > cutoff);
  }
}

export type { MemoryEntry, MemoryConfig };
