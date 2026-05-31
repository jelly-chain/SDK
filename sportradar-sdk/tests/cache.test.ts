import { describe, it, expect, vi } from 'vitest';
import { MemoryCache, CacheKeys } from '../src/cache.js';

describe('MemoryCache', () => {
  it('should store and retrieve values', () => {
    const cache = new MemoryCache();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    const cache = new MemoryCache();
    expect(cache.get('missing')).toBeNull();
  });

  it('should respect TTL', () => {
    const cache = new MemoryCache({ ttlMs: 100 });
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(150);
    expect(cache.get('key1')).toBeNull();
  });

  it('should evict when max entries reached', () => {
    const cache = new MemoryCache({ maxEntries: 2 });
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    expect(cache.size()).toBeLessThanOrEqual(2);
  });

  it('should clear all entries', () => {
    const cache = new MemoryCache();
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

describe('CacheKeys', () => {
  it('should generate correct keys', () => {
    expect(CacheKeys.sports()).toBe('sports:list');
    expect(CacheKeys.match('123')).toBe('match:123');
    expect(CacheKeys.standings('456')).toBe('standings:456');
  });
});
