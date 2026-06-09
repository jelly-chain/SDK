/**
 * World Cup Jelly SDK — Odds Module
 * Betting odds: moneyline, spread, total, futures, player props, line movement.
 */
import { MemoryCache } from '../cache/memory-cache.js';
import { CacheKey } from '../cache/cache-keys.js';
import { Logger } from '../logger.js';
import type { BettingOdd, FuturesOdd, PlayerProp, LineMovementPoint, SeasonYear, VendorId, PropType } from '../types.js';
import type { JellyApiClient } from '../providers/jelly-api/client.js';
import type { JellyApiAdapter } from '../providers/jelly-api/adapter.js';

export class OddsModule {
  private readonly cache: MemoryCache;
  private readonly client: JellyApiClient;
  private readonly adapter: JellyApiAdapter;
  private readonly logger = Logger.getInstance().module('OddsModule');

  constructor(cache: MemoryCache, client: JellyApiClient, adapter: JellyApiAdapter) {
    this.cache = cache; this.client = client; this.adapter = adapter;
  }

  async list(params: { seasons?: SeasonYear[]; matchIds?: number[] } = {}): Promise<BettingOdd[]> {
    const cacheKey = CacheKey.odds(params.seasons?.[0]);
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getOdds(params);
      return (response.data ?? []).map(o => this.adapter.normalizeBettingOdd(o));
    }, 30000);
  }

  async byMatch(matchId: string): Promise<BettingOdd[]> {
    const cacheKey = CacheKey.matchOdds(matchId);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchOdds(numericId);
      return (response.data ?? []).map(o => this.adapter.normalizeBettingOdd(o));
    }, 30000);
  }

  async futures(seasons?: SeasonYear[]): Promise<FuturesOdd[]> {
    const cacheKey = CacheKey.futuresOdds(seasons?.[0]);
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getFuturesOdds(seasons);
      return (response.data ?? []).map(o => this.adapter.normalizeFuturesOdd(o));
    }, 60000);
  }

  async playerProps(params: { matchId: number; playerId?: number; propType?: PropType; vendors?: VendorId[] }): Promise<PlayerProp[]> {
    const cacheKey = CacheKey.playerProps(String(params.matchId));
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.getPlayerProps(params);
      return (response.data ?? []).map(p => this.adapter.normalizePlayerProp(p));
    }, 30000);
  }

  async matchPlayerProps(matchId: string, params: { playerId?: number; propType?: PropType } = {}): Promise<PlayerProp[]> {
    const cacheKey = `fifa:match:${matchId}:player-props:${params.playerId ?? 'all'}:${params.propType ?? 'all'}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getMatchPlayerProps(numericId, params);
      return (response.data ?? []).map(p => this.adapter.normalizePlayerProp(p));
    }, 30000);
  }

  async vendors() {
    return this.cache.getOrSet(CacheKey.vendors(), async () => {
      return this.client.getVendors();
    }, 3600000);
  }

  async byVendor(vendor: VendorId, matchId: string): Promise<any> {
    const cacheKey = `fifa:odds:${vendor}:match:${matchId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      return this.client.getOddsByVendor(vendor, numericId);
    }, 30000);
  }

  async lineMovement(matchId: string, vendor?: VendorId): Promise<LineMovementPoint[]> {
    const cacheKey = CacheKey.lineMovement(matchId, vendor);
    return this.cache.getOrSet(cacheKey, async () => {
      const numericId = parseInt(matchId.replace(/\D/g, ''), 10);
      const response = await this.client.getLineMovement(numericId, vendor);
      return response.data ?? [];
    }, 30000);
  }

  /** Find the best odds across all vendors for a match. */
  async bestOdds(matchId: string): Promise<{ bestHome: { odds: number; vendor: string } | null; bestAway: { odds: number; vendor: string } | null; bestDraw: { odds: number; vendor: string } | null }> {
    const odds = await this.byMatch(matchId);
    let bestHome: { odds: number; vendor: string } | null = null;
    let bestAway: { odds: number; vendor: string } | null = null;
    let bestDraw: { odds: number; vendor: string } | null = null;

    for (const o of odds) {
      if (o.moneylineHome && (!bestHome || o.moneylineHome > bestHome.odds)) bestHome = { odds: o.moneylineHome, vendor: o.vendor };
      if (o.moneylineAway && (!bestAway || o.moneylineAway > bestAway.odds)) bestAway = { odds: o.moneylineAway, vendor: o.vendor };
      if (o.moneylineDraw && (!bestDraw || o.moneylineDraw > bestDraw.odds)) bestDraw = { odds: o.moneylineDraw, vendor: o.vendor };
    }

    return { bestHome, bestAway, bestDraw };
  }

  /** Detect line movement direction. */
  async lineDirection(matchId: string, vendor?: VendorId): Promise<{ direction: 'toward_home' | 'toward_away' | 'stable'; magnitude: number }> {
    const movement = await this.lineMovement(matchId, vendor);
    if (movement.length < 2) return { direction: 'stable', magnitude: 0 };
    const first = movement[0];
    const last = movement[movement.length - 1];
    const homeChange = (last.moneylineHome ?? 0) - (first.moneylineHome ?? 0);
    const awayChange = (last.moneylineAway ?? 0) - (first.moneylineAway ?? 0);
    const magnitude = Math.abs(homeChange) + Math.abs(awayChange);
    if (magnitude < 5) return { direction: 'stable', magnitude };
    return { direction: homeChange < 0 ? 'toward_home' : 'toward_away', magnitude };
  }
}
