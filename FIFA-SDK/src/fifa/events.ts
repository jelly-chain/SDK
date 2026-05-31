import { MatchEvent } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';

/** Provides match event data (goals, cards, substitutions). */
export class MatchEventsModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Get all events for a specific match. */
  async byMatch(matchId: string): Promise<MatchEvent[]> {
    const cacheKey = `events:match:${matchId}`;
    const cached = this.cache.get<MatchEvent[]>(cacheKey);
    if (cached) return cached;
    return [];
  }

  /** Get only goals from a match. */
  async goals(matchId: string): Promise<MatchEvent[]> {
    const events = await this.byMatch(matchId);
    return events.filter(e => e.type === 'goal' || e.type === 'own_goal');
  }

  /** Get all red card events from a match. */
  async redCards(matchId: string): Promise<MatchEvent[]> {
    const events = await this.byMatch(matchId);
    return events.filter(e => e.type === 'red_card');
  }
}
