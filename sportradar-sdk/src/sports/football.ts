/**
 * Football-specific Sportradar integration
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch, SportradarStanding } from '../types.js';

export class SportradarFootball {
  constructor(private readonly client: SportradarClient) {}

  /** Get Premier League schedule */
  async getPremierLeagueSchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:17');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get La Liga schedule */
  async getLaLigaSchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:8');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get Champions League schedule */
  async getChampionsLeagueSchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:7');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get World Cup schedule */
  async getWorldCupSchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:1');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get live football matches */
  async getLiveMatches(): Promise<SportradarMatch[]> {
    return this.client.getLiveMatches('sr:sport:1');
  }

  /** Get standings for a season */
  async getStandings(seasonId: string): Promise<SportradarStanding | null> {
    return this.client.getStandings(seasonId);
  }

  /** Get head-to-head record */
  async getHeadToHead(team1Id: string, team2Id: string): Promise<SportradarMatch[]> {
    // Sportradar doesn't have a direct H2H endpoint, so we'd need to filter from schedules
    return [];
  }

  private async getCurrentSeasonId(tournamentId: string): Promise<string | undefined> {
    const season = await this.client.getCurrentSeason(tournamentId);
    return season?.id;
  }
}
