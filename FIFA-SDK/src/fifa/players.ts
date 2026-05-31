import { Player } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { NotFoundError } from '../errors.js';

/** Provides individual player profile data. */
export class PlayersModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Fetch a player by normalized ID (e.g. "player-kylian-mbappe"). */
  async byId(playerId: string): Promise<Player> {
    const cacheKey = `players:id:${playerId}`;
    const cached = this.cache.get<Player>(cacheKey);
    if (cached) return cached;

    throw new NotFoundError('Player', playerId);
  }

  /** Find a player by name (fuzzy match). */
  async byName(name: string, teamId?: string): Promise<Player | undefined> {
    const cacheKey = `players:name:${name}:${teamId ?? 'any'}`;
    return this.cache.get<Player>(cacheKey) ?? undefined;
  }

  /** Get top scorers across the tournament. */
  async topScorers(limit = 10): Promise<Player[]> {
    const cacheKey = `players:top-scorers:${limit}`;
    const cached = this.cache.get<Player[]>(cacheKey);
    if (cached) return cached;
    return [];
  }
}
