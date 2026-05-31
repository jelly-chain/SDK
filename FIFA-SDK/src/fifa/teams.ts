import { Team } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { NotFoundError } from '../errors.js';

/** Provides access to team data for the current tournament. */
export class TeamsModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Return all teams participating in the tournament. */
  async list(): Promise<Team[]> {
    const cacheKey = 'teams:list';
    const cached = this.cache.get<Team[]>(cacheKey);
    if (cached) return cached;

    const teams: Team[] = [];
    this.cache.set(cacheKey, teams);
    return teams;
  }

  /** Fetch a team by normalized ID (e.g. "team-argentina"). */
  async byId(teamId: string): Promise<Team> {
    const cacheKey = `teams:id:${teamId}`;
    const cached = this.cache.get<Team>(cacheKey);
    if (cached) return cached;

    const all = await this.list();
    const team = all.find(t => t.id === teamId);
    if (!team) throw new NotFoundError('Team', teamId);
    this.cache.set(cacheKey, team);
    return team;
  }

  /** Find team by common name (fuzzy match). */
  async byName(name: string): Promise<Team | undefined> {
    const all = await this.list();
    const lower = name.toLowerCase();
    return all.find(
      t => t.name.toLowerCase().includes(lower) || t.shortName.toLowerCase().includes(lower),
    );
  }
}
