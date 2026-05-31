/**
 * Basketball-specific Sportradar integration
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch, SportradarStanding } from '../types.js';

export class SportradarBasketball {
  constructor(private readonly client: SportradarClient) {}

  /** Get NBA schedule */
  async getNBASchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:132');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get EuroLeague schedule */
  async getEuroLeagueSchedule(seasonId?: string): Promise<SportradarMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:135');
    if (!season) return [];
    return this.client.getSchedule(season);
  }

  /** Get live basketball matches */
  async getLiveMatches(): Promise<SportradarMatch[]> {
    return this.client.getLiveMatches('sr:sport:2');
  }

  /** Get standings */
  async getStandings(seasonId: string): Promise<SportradarStanding | null> {
    return this.client.getStandings(seasonId);
  }

  private async getCurrentSeasonId(tournamentId: string): Promise<string | undefined> {
    const season = await this.client.getCurrentSeason(tournamentId);
    return season?.id;
  }
}
