import { BracketNode, MatchStage } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';

/** Provides the current state of the knockout bracket. */
export class BracketModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Get the full current bracket state. */
  async current(): Promise<BracketNode[]> {
    const cacheKey = 'bracket:current';
    const cached = this.cache.get<BracketNode[]>(cacheKey);
    if (cached) return cached;
    return [];
  }

  /** Get bracket nodes for a specific round. */
  async byRound(round: MatchStage): Promise<BracketNode[]> {
    const all = await this.current();
    return all.filter(n => n.round === round);
  }

  /** Check whether a team has been eliminated. */
  async isEliminated(teamId: string): Promise<boolean> {
    const nodes = await this.current();
    const advanced = nodes.filter(n => n.winnerId === teamId);
    const appeared = nodes.filter(n => n.homeTeamId === teamId || n.awayTeamId === teamId);
    if (appeared.length === 0) return false;
    const lastRound = appeared[appeared.length - 1];
    return lastRound?.winnerId !== undefined && lastRound.winnerId !== teamId;
  }
}
