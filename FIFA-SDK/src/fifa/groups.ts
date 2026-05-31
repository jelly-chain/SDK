import { GroupCode, Team } from '../types.js';
import { MemoryCache } from '../cache/memory-cache.js';
import { TeamsModule } from './teams.js';

export interface Group {
  code: GroupCode;
  name: string;
  teams: Team[];
}

/** Provides group-stage structure information. */
export class GroupsModule {
  private teams: TeamsModule;

  constructor(private readonly cache: MemoryCache) {
    this.teams = new TeamsModule(cache);
  }

  /** Return all groups in the tournament. */
  async list(): Promise<Group[]> {
    const cacheKey = 'groups:list';
    const cached = this.cache.get<Group[]>(cacheKey);
    if (cached) return cached;

    const allTeams = await this.teams.list();
    const groupMap = new Map<GroupCode, Team[]>();

    for (const team of allTeams) {
      if (team.groupCode) {
        const existing = groupMap.get(team.groupCode) ?? [];
        existing.push(team);
        groupMap.set(team.groupCode, existing);
      }
    }

    const groups: Group[] = Array.from(groupMap.entries()).map(([code, teams]) => ({
      code,
      name: `Group ${code}`,
      teams,
    }));

    this.cache.set(cacheKey, groups);
    return groups;
  }

  /** Get a specific group by its letter code. */
  async byCode(code: GroupCode): Promise<Group | undefined> {
    const groups = await this.list();
    return groups.find(g => g.code === code);
  }
}
