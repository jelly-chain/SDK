import { describe, it, expect, vi } from 'vitest';
import { SportradarClient } from '../src/client.js';

describe('SportradarClient', () => {
  it('should initialize with config', () => {
    const client = new SportradarClient({ apiKey: 'test-key' });
    expect(client.enabled).toBe(true);
  });

  it('should be disabled without API key', () => {
    const client = new SportradarClient({ apiKey: '' });
    expect(client.enabled).toBe(false);
  });

  it('should return empty array when disabled', async () => {
    const client = new SportradarClient({ apiKey: '' });
    const sports = await client.getSports();
    expect(sports).toEqual([]);
  });

  it('should return null for match when disabled', async () => {
    const client = new SportradarClient({ apiKey: '' });
    const match = await client.getMatch('sr:sport_event:123');
    expect(match).toBeNull();
  });
});
