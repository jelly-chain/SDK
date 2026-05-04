import { Player } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';

/** Provides squad (roster) data for teams. */
export class SquadsModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Get all players in a team's squad for the tournament. */
  async byTeam(teamId: string): Promise<Player[]> {
    const cacheKey = `squads:team:${teamId}`;
    const cached = this.cache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const players: Player[] = [];
    this.cache.set(cacheKey, players);
    return players;
  }

  /** Get available (non-injured) players for a team. */
  async available(teamId: string): Promise<Player[]> {
    const squad = await this.byTeam(teamId);
    return squad.filter(p => p.available);
  }

  /** Get players currently unavailable due to injury or suspension. */
  async unavailable(teamId: string): Promise<Player[]> {
    const squad = await this.byTeam(teamId);
    return squad.filter(p => !p.available);
  }
}
