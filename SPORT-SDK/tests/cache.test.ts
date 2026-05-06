import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../src/cache/memory-cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ ttlSeconds: 60 });
  });

  it('returns null for missing key', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cache.set('key', { name: 'Arsenal' });
    expect(cache.get('key')).toEqual({ name: 'Arsenal' });
  });

  it('stores and retrieves a string', () => {
    cache.set('str', 'hello');
    expect(cache.get('str')).toBe('hello');
  });

  it('stores and retrieves a number', () => {
    cache.set('num', 42);
    expect(cache.get('num')).toBe(42);
  });

  it('has() returns true for existing key', () => {
    cache.set('x', 1);
    expect(cache.has('x')).toBe(true);
  });

  it('has() returns false for missing key', () => {
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('delete removes a key', () => {
    cache.set('k', 'v');
    cache.delete('k');
    expect(cache.get('k')).toBeNull();
  });

  it('clear removes all keys', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('size() returns correct count', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
    cache.delete('a');
    expect(cache.size()).toBe(1);
  });

  it('entries expire after TTL', async () => {
    const c = new MemoryCache({ ttlSeconds: 0 });
    c.set('k', 'v', 1);
    await new Promise((r) => setTimeout(r, 10));
    expect(c.get('k')).toBeNull();
  });

  it('custom ttlMs overrides default', () => {
    cache.set('soon', 'value', 50000);
    expect(cache.get('soon')).toBe('value');
  });

  it('overwriting a key updates the value', () => {
    cache.set('k', 'first');
    cache.set('k', 'second');
    expect(cache.get('k')).toBe('second');
  });
});
