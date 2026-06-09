/**
 * World Cup Jelly SDK — Stats Module
 * Player match stats, team match stats, shot maps, momentum, best players, avg positions.
 */
import { MemoryCache } from '../cache/memory-cache.js';
import { CacheKey } from '../cache/cache-keys.js';
import { Logger } from '../logger.js';
import type { PlayerMatchStat, TeamMatchStat, ShotEntry, MomentumPoint, BestPlayerEntry, AvgPosition, SeasonYear } from '../types.js';
import type { JellyApiClient } from '../providers/jelly-api/client.js';
import type { JellyApiAdapter } from '../providers/jelly-api/adapter.js';

export class StatsModule {
  private readonly cache: MemoryCache;
  private readonly client: JellyApiClient;
  private readonly adapter: JellyApiAdapter;
  private readonly logger = Logger.getInstance().module('StatsModule');

  constructor(cache: MemoryCache, client: JellyApiClient, adapter: JellyApiAdapter) {
    this.cache = cache; this.client = client; this.adapter = adapter;
  }

  async matchPlayerStats(matchId: string, playerIds?: number[], teamIds?: number[]): Promise<PlayerMatchStat[]> {
    const cacheKey = CacheKey.matchPlayerStats(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchPlayerStats(numericId, { playerIds, teamIds });
      return (response.data ?? []).map(s => this.adapter.normalizePlayerMatchStat(s));
    }, 60000);
  }

  async matchTeamStats(matchId: string): Promise<TeamMatchStat[]> {
    const cacheKey = CacheKey.matchTeamStats(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchTeamStats(numericId);
      return response.data ?? [];
    }, 60000);
  }

  async shots(matchId: string, playerIds?: number[]): Promise<ShotEntry[]> {
    const cacheKey = CacheKey.matchShots(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchShots(numericId, playerIds);
      return (response.data ?? []).map(s => this.adapter.normalizeShotEntry(s));
    }, 60000);
  }

  async momentum(matchId: string): Promise<MomentumPoint[]> {
    const cacheKey = CacheKey.matchMomentum(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchMomentum(numericId);
      return (response.data ?? []).map(m => this.adapter.normalizeMomentumPoint(m));
    }, 60000);
  }

  async bestPlayers(matchId: string): Promise<BestPlayerEntry[]> {
    const cacheKey = CacheKey.matchBestPlayers(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchBestPlayers(numericId);
      return (response.data ?? []).map(b => this.adapter.normalizeBestPlayer(b));
    }, 60000);
  }

  async avgPositions(matchId: string, teamIds?: number[]): Promise<AvgPosition[]> {
    const cacheKey = CacheKey.matchAvgPositions(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchAvgPositions(numericId, teamIds);
      return (response.data ?? []).map(p => this.adapter.normalizeAvgPosition(p));
    }, 60000);
  }

  async playerMatchStats(playerId: string, season?: SeasonYear): Promise<PlayerMatchStat[]> {
    const cacheKey = CacheKey.playerMatchStats(playerId, season);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(playerId.replace(/\D/g, ''), 10);
      const response = await this.client.getPlayerMatchStats(numericId, season);
      return (response.data ?? []).map(s => this.adapter.normalizePlayerMatchStat(s));
    }, 120000);
  }

  async teamMatchStats(teamId: string, season?: SeasonYear): Promise<TeamMatchStat[]> {
    const cacheKey = CacheKey.teamMatchStats(teamId, season);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(teamId.replace(/\D/g, ''), 10);
      const response = await this.client.getTeamMatchStats(numericId, season);
      return response.data ?? [];
    }, 120000);
  }

  /** Get xG summary for a match. */
  async xgSummary(matchId: string): Promise<{ homeXG: number; awayXG: number; shots: ShotEntry[] }> {
    const shots = await this.shots(matchId);
    const homeXG = shots.filter(s => s.isHome).reduce((sum, s) => sum + (s.xg ?? 0), 0);
    const awayXG = shots.filter(s => !s.isHome).reduce((sum, s) => sum + (s.xg ?? 0), 0);
    return { homeXG: Math.round(homeXG * 100) / 100, awayXG: Math.round(awayXG * 100) / 100, shots };
  }

  /** Get possession and passing summary. */
  async possessionSummary(matchId: string): Promise<{ home: TeamMatchStat | null; away: TeamMatchStat | null }> {
    const stats = await this.matchTeamStats(matchId);
    return { home: stats.find(s => s.isHome) ?? null, away: stats.find(s => !s.isHome) ?? null };
  }
}
