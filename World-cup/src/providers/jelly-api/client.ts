/**
 * World Cup Jelly SDK — Jelly API Client
 *
 * Full HTTP client for api.jellychain.fun /v1/fifa/*
 * Handles: auth, pagination, retries, error mapping, request coalescing.
 */

import { ProviderError, RateLimitError } from '../../errors.js';
import { Logger, ModuleLogger } from '../../logger.js';
import type { JellyApiResponse, CursorPagination, SeasonYear, GroupCode, MatchStatus, VendorId, PropType } from '../../types.js';

export interface JellyApiConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface PaginateOptions {
  cursor?: number;
  perPage?: number;
  signal?: AbortSignal;
}

interface RequestInFlight<T> {
  promise: Promise<JellyApiResponse<T>>;
  timestamp: number;
}

export class JellyApiClient {
  readonly name = 'jelly-api';
  readonly enabled: boolean;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly logger: ModuleLogger;
  private inFlight = new Map<string, RequestInFlight<unknown>>();
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: JellyApiConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['JELLY_API_KEY'] ?? '';
    this.enabled = this.apiKey.length > 0;
    this.baseUrl = (config.baseUrl ?? 'https://api.jellychain.fun').replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.maxRetries = config.maxRetries ?? 3;
    this.logger = Logger.getInstance().module('JellyApi');
  }

  private get headers(): Record<string, string> {
    return { Authorization: this.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' };
  }

  // ─── Generic request ───────────────────────────────────────────────────

  private async request<T>(method: string, path: string, params: Record<string, unknown> = {}, body?: unknown): Promise<JellyApiResponse<T>> {
    const url = this.buildUrl(path, params);
    const cacheKey = `${method}:${url}`;

    // Request coalescing: reuse in-flight GET requests
    if (method === 'GET' && !body) {
      const existing = this.inFlight.get(cacheKey) as RequestInFlight<T> | undefined;
      if (existing && Date.now() - existing.timestamp < 5000) {
        this.logger.debug(`Coalescing request: ${cacheKey}`);
        return existing.promise;
      }
    }

    const promise = this.executeRequest<T>(method, url, body);
    if (method === 'GET') {
      this.inFlight.set(cacheKey, { promise, timestamp: Date.now() });
      promise.finally(() => {
        setTimeout(() => this.inFlight.delete(cacheKey), 5000);
      });
    }

    return promise;
  }

  private async executeRequest<T>(method: string, url: string, body?: unknown): Promise<JellyApiResponse<T>> {
    this.requestCount++;
    this.logger.debug(`Request #${this.requestCount}: ${method} ${url}`);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const fetchOptions: RequestInit = {
          method,
          headers: this.headers,
          signal: controller.signal,
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5');
            throw new RateLimitError(this.name, retryAfter);
          }

          if (response.status === 401 || response.status === 403) {
            throw new ProviderError(
              `Authentication failed: ${response.statusText}. Check your JELLY_API_KEY.`,
              this.name, response.status, url,
            );
          }

          throw new ProviderError(
            `HTTP ${response.status}: ${response.statusText}${errorBody ? ' — ' + errorBody.slice(0, 300) : ''}`,
            this.name, response.status, url,
          );
        }

        const data = await response.json() as JellyApiResponse<T>;
        this.logger.debug(`Response: ${method} ${url} — OK`);
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RateLimitError && error.retryAfter && attempt < this.maxRetries) {
          this.logger.warn(`Rate limited, waiting ${error.retryAfter}s (attempt ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, error.retryAfter! * 1000));
          continue;
        }

        if (error instanceof ProviderError && error.isRetryable && attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.logger.warn(`Retryable error, waiting ${delay}ms (attempt ${attempt + 1}/${this.maxRetries}): ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    this.errorCount++;
    this.logger.error(`Request failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`);
    throw lastError;
  }

  private buildUrl(path: string, params: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  async paginate<T>(path: string, params: Record<string, unknown> = {}, maxPages = 10): Promise<T[]> {
    const results: T[] = [];
    let cursor: number | null = null;
    let page = 0;

    while (page < maxPages) {
      const pageParams = { ...params, ...(cursor ? { cursor } : {}) };
      const response = await this.request<T[]>(path.includes('/fifa/') ? path : path, pageParams);

      if (Array.isArray(response.data)) {
        results.push(...response.data);
      }

      if (!response.meta?.next_cursor) break;
      cursor = response.meta.next_cursor;
      page++;
    }

    if (page >= maxPages) {
      this.logger.warn(`Pagination limit reached (${maxPages} pages) for ${path}`);
    }

    return results;
  }

  // ─── Seasons ─────────────────────────────────────────────────────────

  async getSeasons(): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', '/v1/fifa/seasons');
  }

  async getSeason(year: SeasonYear): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/seasons/${year}`);
  }

  async getSeasonTournaments(year: SeasonYear): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/seasons/${year}/tournaments`);
  }

  // ─── Teams ────────────────────────────────────────────────────────────

  async getTeams(seasons?: SeasonYear[]): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (seasons) params['seasons[]'] = seasons;
    return this.request('GET', '/v1/fifa/teams', params);
  }

  async getTeam(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/teams/${id}`);
  }

  async getTeamRoster(id: number, season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/teams/${id}/roster`, params);
  }

  async getTeamForm(id: number, window = 5): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/teams/${id}/form`, { window });
  }

  async getTeamMatches(id: number, season?: SeasonYear, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/teams/${id}/matches`, params);
  }

  // ─── Stadiums ─────────────────────────────────────────────────────────

  async getStadiums(seasons?: SeasonYear[]): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (seasons) params['seasons[]'] = seasons;
    return this.request('GET', '/v1/fifa/stadiums', params);
  }

  async getStadium(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/stadiums/${id}`);
  }

  async getSeasonStadiums(year: SeasonYear): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/seasons/${year}/stadiums`);
  }

  // ─── Groups ───────────────────────────────────────────────────────────

  async getGroups(season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', '/v1/fifa/groups', params);
  }

  async getGroup(code: GroupCode, season?: SeasonYear): Promise<JellyApiResponse<any>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/groups/${code}`, params);
  }

  async getGroupStandings(code: GroupCode, season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/groups/${code}/standings`, params);
  }

  // ─── Standings ────────────────────────────────────────────────────────

  async getAllStandings(season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', '/v1/fifa/standings', params);
  }

  async getStandingsByGroup(code: GroupCode, season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/standings/group/${code}`, params);
  }

  async getTeamStanding(teamId: number, season?: SeasonYear): Promise<JellyApiResponse<any>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/teams/${teamId}/standings`, params);
  }

  async getTiebreakScenarios(season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', '/v1/fifa/standings/tiebreak', params);
  }

  // ─── Matches ──────────────────────────────────────────────────────────

  async getMatches(params: {
    seasons?: SeasonYear[];
    matchIds?: number[];
    teamIds?: number[];
    status?: MatchStatus;
    stageId?: number;
    cursor?: number;
    perPage?: number;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.seasons) query['seasons[]'] = params.seasons;
    if (params.matchIds) query['match_ids[]'] = params.matchIds;
    if (params.teamIds) query['team_ids[]'] = params.teamIds;
    if (params.status) query['status'] = params.status;
    if (params.stageId) query['stage_id'] = params.stageId;
    if (params.cursor) query['cursor'] = params.cursor;
    if (params.perPage) query['per_page'] = params.perPage;
    return this.request('GET', '/v1/fifa/matches', query);
  }

  async getMatch(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/matches/${id}`);
  }

  async getMatchEvents(id: number, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/events`, params);
  }

  async getMatchLineups(id: number, teamId?: number): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (teamId) params['team_id'] = teamId;
    return this.request('GET', `/v1/fifa/matches/${id}/lineups`, params);
  }

  async getMatchTeamForm(id: number): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/matches/${id}/form`);
  }

  async getMatchSummary(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/matches/${id}/summary`);
  }

  // ─── Players ──────────────────────────────────────────────────────────

  async getPlayers(params: {
    seasons?: SeasonYear[];
    teamIds?: number[];
    search?: string;
    cursor?: number;
    perPage?: number;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.seasons) query['seasons[]'] = params.seasons;
    if (params.teamIds) query['team_ids[]'] = params.teamIds;
    if (params.search) query['search'] = params.search;
    if (params.cursor) query['cursor'] = params.cursor;
    if (params.perPage) query['per_page'] = params.perPage;
    return this.request('GET', '/v1/fifa/players', query);
  }

  async getPlayer(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/players/${id}`);
  }

  async getPlayerStats(id: number, season?: SeasonYear): Promise<JellyApiResponse<any>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/players/${id}/stats`, params);
  }

  async getPlayerMatches(id: number, season?: SeasonYear, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/players/${id}/matches`, params);
  }

  // ─── Rosters ──────────────────────────────────────────────────────────

  async getRosters(params: {
    seasons?: SeasonYear[];
    teamIds?: number[];
    playerIds?: number[];
    cursor?: number;
    perPage?: number;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.seasons) query['seasons[]'] = params.seasons;
    if (params.teamIds) query['team_ids[]'] = params.teamIds;
    if (params.playerIds) query['player_ids[]'] = params.playerIds;
    if (params.cursor) query['cursor'] = params.cursor;
    if (params.perPage) query['per_page'] = params.perPage;
    return this.request('GET', '/v1/fifa/rosters', query);
  }

  async getSeasonRosters(year: SeasonYear, teamIds?: number[], options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (teamIds) params['team_ids[]'] = teamIds;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/seasons/${year}/rosters`, params);
  }

  // ─── Match Stats ──────────────────────────────────────────────────────

  async getMatchPlayerStats(id: number, params: {
    playerIds?: number[];
    teamIds?: number[];
    cursor?: number;
    perPage?: number;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.playerIds) query['player_ids[]'] = params.playerIds;
    if (params.teamIds) query['team_ids[]'] = params.teamIds;
    if (params.cursor) query['cursor'] = params.cursor;
    if (params.perPage) query['per_page'] = params.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/player-stats`, query);
  }

  async getMatchTeamStats(id: number): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/matches/${id}/team-stats`);
  }

  async getMatchShots(id: number, playerIds?: number[], options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (playerIds) params['player_ids[]'] = playerIds;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/shots`, params);
  }

  async getMatchMomentum(id: number, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/momentum`, params);
  }

  async getMatchBestPlayers(id: number, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/best-players`, params);
  }

  async getMatchAvgPositions(id: number, teamIds?: number[], options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (teamIds) params['team_ids[]'] = teamIds;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/matches/${id}/avg-positions`, params);
  }

  async getPlayerMatchStats(playerId: number, season?: SeasonYear, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/players/${playerId}/match-stats`, params);
  }

  async getTeamMatchStats(teamId: number, season?: SeasonYear, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/teams/${teamId}/match-stats`, params);
  }

  // ─── Betting Odds ─────────────────────────────────────────────────────

  async getOdds(params: {
    seasons?: SeasonYear[];
    matchIds?: number[];
    cursor?: number;
    perPage?: number;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.seasons) query['seasons[]'] = params.seasons;
    if (params.matchIds) query['match_ids[]'] = params.matchIds;
    if (params.cursor) query['cursor'] = params.cursor;
    if (params.perPage) query['per_page'] = params.perPage;
    return this.request('GET', '/v1/fifa/odds', query);
  }

  async getMatchOdds(matchId: number): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/matches/${matchId}/odds`);
  }

  async getFuturesOdds(seasons?: SeasonYear[]): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (seasons) params['seasons[]'] = seasons;
    return this.request('GET', '/v1/fifa/odds/futures', params);
  }

  async getPlayerProps(params: {
    matchId: number;
    playerId?: number;
    propType?: PropType;
    vendors?: VendorId[];
  }): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = { match_id: params.matchId };
    if (params.playerId) query['player_id'] = params.playerId;
    if (params.propType) query['prop_type'] = params.propType;
    if (params.vendors) query['vendors[]'] = params.vendors;
    return this.request('GET', '/v1/fifa/odds/player-props', query);
  }

  async getMatchPlayerProps(matchId: number, params: {
    playerId?: number;
    propType?: PropType;
  } = {}): Promise<JellyApiResponse<any[]>> {
    const query: Record<string, unknown> = {};
    if (params.playerId) query['player_id'] = params.playerId;
    if (params.propType) query['prop_type'] = params.propType;
    return this.request('GET', `/v1/fifa/matches/${matchId}/player-props`, query);
  }

  async getVendors(): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', '/v1/fifa/odds/vendors');
  }

  async getOddsByVendor(vendor: VendorId, matchId: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/odds/${vendor}/matches/${matchId}`);
  }

  async getLineMovement(matchId: number, vendor?: VendorId): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (vendor) params['vendor'] = vendor;
    return this.request('GET', `/v1/fifa/matches/${matchId}/odds/line-movement`, params);
  }

  // ─── Intelligence & Prediction ────────────────────────────────────────

  async getMatchPrediction(matchId: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/matches/${matchId}/prediction`);
  }

  async getGroupPrediction(code: GroupCode, season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/groups/${code}/prediction`, params);
  }

  async getTeamQualificationPath(teamId: number, season?: SeasonYear): Promise<JellyApiResponse<any>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', `/v1/fifa/teams/${teamId}/qualification-path`, params);
  }

  async getTournamentWinnerPrediction(tournamentId: number): Promise<JellyApiResponse<any[]>> {
    return this.request('GET', `/v1/fifa/tournaments/${tournamentId}/prediction`);
  }

  // ─── Tournament / Bracket ─────────────────────────────────────────────

  async getTournaments(season?: SeasonYear): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (season) params['season'] = season;
    return this.request('GET', '/v1/fifa/tournaments', params);
  }

  async getTournament(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/tournaments/${id}`);
  }

  async getTournamentBracket(id: number): Promise<JellyApiResponse<any>> {
    return this.request('GET', `/v1/fifa/tournaments/${id}/bracket`);
  }

  async getTournamentSchedule(id: number, options: PaginateOptions = {}): Promise<JellyApiResponse<any[]>> {
    const params: Record<string, unknown> = {};
    if (options.cursor) params['cursor'] = options.cursor;
    if (options.perPage) params['per_page'] = options.perPage;
    return this.request('GET', `/v1/fifa/tournaments/${id}/schedule`, params);
  }

  // ─── Health & Stats ───────────────────────────────────────────────────

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/fifa/seasons`, { headers: this.headers, signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      inFlightRequests: this.inFlight.size,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
    };
  }
}
