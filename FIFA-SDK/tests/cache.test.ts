import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/cache/memory-cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ ttlSeconds: 1 });
  });

  it('stores and retrieves values', () => {
    cache.set('key', { value: 42 });
    expect(cache.get('key')).toEqual({ value: 42 });
  });

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('respects TTL and expires entries', async () => {
    cache.set('expiring', 'value', 50);
    expect(cache.get('expiring')).toBe('value');
    await new Promise(r => setTimeout(r, 100));
    expect(cache.get('expiring')).toBeNull();
  });

  it('has() reflects TTL correctly', async () => {
    cache.set('exists', true, 50);
    expect(cache.has('exists')).toBe(true);
    await new Promise(r => setTimeout(r, 100));
    expect(cache.has('exists')).toBe(false);
  });

  it('delete() removes entries', () => {
    cache.set('del', 'bye');
    cache.delete('del');
    expect(cache.get('del')).toBeNull();
  });

  it('clear() empties all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
