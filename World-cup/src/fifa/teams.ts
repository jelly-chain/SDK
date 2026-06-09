/**
 * World Cup Jelly SDK — Teams Module
 *
 * Provides access to team data: list, by ID, by name, roster, form, matches.
 * All results are cached via the MemoryCache layer.
 */

import { MemoryCache } from '../cache/memory-cache.js';
import { CacheKey } from '../cache/cache-keys.js';
import { NotFoundError } from '../errors.js';
import { Logger } from '../logger.js';
import type { Team, SeasonYear, GroupCode } from '../types.js';
import type { JellyApiClient } from '../providers/jelly-api/client.js';
import type { JellyApiAdapter } from '../providers/jelly-api/adapter.js';

export interface TeamFilters {
  season?: SeasonYear;
  groupCode?: GroupCode;
  confederation?: string;
  minRanking?: number;
  maxRanking?: number;
}

export interface TeamSearchResult {
  team: Team;
  matchScore: number;
  matchType: 'exact' | 'prefix' | 'fuzzy' | 'abbreviation';
}

export class TeamsModule {
  private readonly cache: MemoryCache;
  private readonly client: JellyApiClient;
  private readonly adapter: JellyApiAdapter;
  private readonly logger = Logger.getInstance().module('TeamsModule');
  private teamIndex = new Map<string, Team>();
  private nameIndex = new Map<string, string>(); // normalized name → team id
  private abbreviationIndex = new Map<string, string>(); // abbreviation → team id

  constructor(cache: MemoryCache, client: JellyApiClient, adapter: JellyApiAdapter) {
    this.cache = cache;
    this.client = client;
    this.adapter = adapter;
  }

  /** List all teams, optionally filtered. */
  async list(filters: TeamFilters = {}): Promise<Team[]> {
    const cacheKey = CacheKey.teams(filters.season);
    const cached = this.cache.get<Team[]>(cacheKey);
    if (cached) return this.applyFilters(cached, filters);

    this.logger.info('Fetching teams', { filters });
    const response = await this.client.getTeams(filters.season ? [filters.season] : undefined);
    const teams = (response.data ?? []).map(t => this.adapter.normalizeTeam(t));

    // Update indexes
    for (const team of teams) {
      this.teamIndex.set(team.id, team);
      this.nameIndex.set(team.name.toLowerCase(), team.id);
      this.nameIndex.set(team.shortName.toLowerCase(), team.id);
      if (team.countryCode) this.nameIndex.set(team.countryCode.toLowerCase(), team.id);
    }

    this.cache.set(cacheKey, teams, 300000); // 5 min TTL
    return this.applyFilters(teams, filters);
  }

  /** Get a single team by ID. */
  async byId(teamId: string): Promise<Team> {
    // Check local index first
    const indexed = this.teamIndex.get(teamId);
    if (indexed) return indexed;

    const cacheKey = CacheKey.team(teamId);
    const cached = this.cache.get<Team>(cacheKey);
    if (cached) return cached;

    // Try to find by numeric ID
    const numericId = parseInt(teamId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      try {
        const response = await this.client.getTeam(numericId);
        const team = this.adapter.normalizeTeam(response.data);
        this.cache.set(cacheKey, team, 300000);
        this.teamIndex.set(team.id, team);
        return team;
      } catch (e) {
        this.logger.warn(`Team not found by numeric ID: ${numericId}`);
      }
    }

    throw new NotFoundError('Team', teamId);
  }

  /** Find a team by name (fuzzy match). */
  async byName(name: string): Promise<Team | undefined> {
    const normalized = name.toLowerCase().trim();

    // Check name index
    const id = this.nameIndex.get(normalized);
    if (id) return this.teamIndex.get(id);

    // Search all teams
    const all = await this.list();
    const results = this.searchTeams(name, all);
    return results[0]?.team;
  }

  /** Search teams with scoring. */
  async search(query: string, limit = 10): Promise<TeamSearchResult[]> {
    const all = await this.list();
    const results = this.searchTeams(query, all);
    return results.slice(0, limit);
  }

  /** Get teams by group. */
  async byGroup(groupCode: GroupCode, season?: SeasonYear): Promise<Team[]> {
    const all = await this.list({ season });
    return all.filter(t => t.groupCode === groupCode);
  }

  /** Get teams by confederation. */
  async byConfederation(confederation: string, season?: SeasonYear): Promise<Team[]> {
    return this.list({ season, confederation });
  }

  /** Get top-ranked teams. */
  async topRanked(limit = 10, season?: SeasonYear): Promise<Team[]> {
    const all = await this.list({ season });
    return all
      .filter(t => t.fifaRanking != null)
      .sort((a, b) => (a.fifaRanking ?? 999) - (b.fifaRanking ?? 999))
      .slice(0, limit);
  }

  /** Get team roster for a season. */
  async roster(teamId: string, season?: SeasonYear) {
    const team = await this.byId(teamId);
    const numericId = parseInt(teamId.replace(/\D/g, ''), 10);
    const id = !isNaN(numericId) ? numericId : team.seasonYear; // fallback
    const cacheKey = CacheKey.teamRoster(teamId, season);
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getTeamRoster(id, season);
      return (response.data ?? []).map(r => this.adapter.normalizeRosterEntry(r));
    }, 300000);
  }

  /** Get team form (recent results). */
  async form(teamId: string, window = 5) {
    const team = await this.byId(teamId);
    const numericId = parseInt(teamId.replace(/\D/g, ''), 10);
    const id = !isNaN(numericId) ? numericId : 0;
    const cacheKey = CacheKey.teamForm(teamId, window);
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getTeamForm(id, window);
      return response.data;
    }, 120000);
  }

  /** Get team matches. */
  async matches(teamId: string, season?: SeasonYear) {
    const team = await this.byId(teamId);
    const numericId = parseInt(teamId.replace(/\D/g, ''), 10);
    const id = !isNaN(numericId) ? numericId : 0;
    const cacheKey = CacheKey.teamMatches(teamId, season);
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getTeamMatches(id, season);
      return (response.data ?? []).map(m => this.adapter.normalizeFixture(m));
    }, 120000);
  }

  /** Get head-to-head record between two teams. */
  async headToHead(teamA: string, teamB: string): Promise<{
    total: number; winsA: number; winsB: number; draws: number;
    goalsA: number; goalsB: number; matches: any[];
  }> {
    const matchesA = await this.matches(teamA);
    const h2h = matchesA.filter(m =>
      m.awayTeamId === teamB || m.homeTeamId === teamB
    );

    let winsA = 0, winsB = 0, draws = 0, goalsA = 0, goalsB = 0;
    for (const m of h2h) {
      if (m.homeScore == null || m.awayScore == null) continue;
      const aIsHome = m.homeTeamId === teamA;
      const aGoals = aIsHome ? m.homeScore : m.awayScore;
      const bGoals = aIsHome ? m.awayScore : m.homeScore;
      goalsA += aGoals;
      goalsB += bGoals;
      if (aGoals > bGoals) winsA++;
      else if (bGoals > aGoals) winsB++;
      else draws++;
    }

    return { total: h2h.length, winsA, winsB, draws, goalsA, goalsB, matches: h2h };
  }

  /** Compare two teams across multiple dimensions. */
  async compare(teamA: string, teamB: string): Promise<{
    teamA: Team; teamB: Team;
    rankingDiff: number;
    formA: any; formB: any;
    h2h: { total: number; winsA: number; winsB: number; draws: number };
  }> {
    const [a, b, formA, formB, h2h] = await Promise.all([
      this.byId(teamA), this.byId(teamB),
      this.form(teamA).catch(() => null),
      this.form(teamB).catch(() => null),
      this.headToHead(teamA, teamB).catch(() => ({ total: 0, winsA: 0, winsB: 0, draws: 0, goalsA: 0, goalsB: 0, matches: [] })),
    ]);

    return {
      teamA: a, teamB: b,
      rankingDiff: (a.fifaRanking ?? 999) - (b.fifaRanking ?? 999),
      formA, formB, h2h,
    };
  }

  /** Get all teams indexed by ID. */
  getIndexedTeams(): Map<string, Team> {
    return new Map(this.teamIndex);
  }

  /** Clear the local team index (forces re-fetch). */
  clearIndex(): void {
    this.teamIndex.clear();
    this.nameIndex.clear();
    this.abbreviationIndex.clear();
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private applyFilters(teams: Team[], filters: TeamFilters): Team[] {
    let result = teams;
    if (filters.groupCode) result = result.filter(t => t.groupCode === filters.groupCode);
    if (filters.confederation) result = result.filter(t => t.confederation === filters.confederation);
    if (filters.minRanking != null) result = result.filter(t => (t.fifaRanking ?? 999) >= filters.minRanking!);
    if (filters.maxRanking != null) result = result.filter(t => (t.fifaRanking ?? 0) <= filters.maxRanking!);
    return result;
  }

  private searchTeams(query: string, teams: Team[]): TeamSearchResult[] {
    const normalized = query.toLowerCase().trim();
    const results: TeamSearchResult[] = [];

    for (const team of teams) {
      const nameLower = team.name.toLowerCase();
      const shortLower = team.shortName.toLowerCase();

      if (nameLower === normalized || shortLower === normalized) {
        results.push({ team, matchScore: 1.0, matchType: 'exact' });
      } else if (nameLower.startsWith(normalized) || shortLower.startsWith(normalized)) {
        results.push({ team, matchScore: 0.8, matchType: 'prefix' });
      } else if (nameLower.includes(normalized)) {
        results.push({ team, matchScore: 0.6, matchType: 'fuzzy' });
      } else if (team.countryCode?.toLowerCase() === normalized) {
        results.push({ team, matchScore: 0.9, matchType: 'abbreviation' });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}
