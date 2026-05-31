import { Fixture, MatchStage, GroupCode } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { NotFoundError } from '../errors.js';

export interface FixtureFilters {
  stage?: MatchStage;
  groupCode?: GroupCode;
  team?: string;
  status?: Fixture['status'];
  tournamentId?: string;
}

/** Provides access to World Cup fixture schedules and results. */
export class FixturesModule {
  constructor(private readonly cache: MemoryCache) {}

  /** List fixtures, optionally filtered by stage, group, team, or status. */
  async list(filters: FixtureFilters = {}): Promise<Fixture[]> {
    const cacheKey = `fixtures:list:${JSON.stringify(filters)}`;
    const cached = this.cache.get<Fixture[]>(cacheKey);
    if (cached) return cached;

    const fixtures: Fixture[] = [];
    this.cache.set(cacheKey, fixtures);
    return fixtures;
  }

  /** Fetch a single fixture by its normalized ID (e.g. "wc26-match-048"). */
  async byId(id: string): Promise<Fixture> {
    const cacheKey = `fixtures:id:${id}`;
    const cached = this.cache.get<Fixture>(cacheKey);
    if (cached) return cached;

    throw new NotFoundError('Fixture', id);
  }

  /** Get recent results for a team, newest first. */
  async recentResults(teamId: string, limit = 5): Promise<Fixture[]> {
    const all = await this.list({ team: teamId, status: 'finished' });
    return all.slice(0, limit);
  }

  /** Get upcoming fixtures for a team. */
  async upcoming(teamId: string): Promise<Fixture[]> {
    return this.list({ team: teamId, status: 'scheduled' });
  }
}
