/**
 * Sportradar API Client
 */

import type {
  SportradarConfig,
  SportradarSport,
  SportradarTournament,
  SportradarMatch,
  SportradarStanding,
  SportradarInjury,
  SportradarLineup,
  SportradarMatchStatistics,
  SportradarPlayerStatistics,
  SportradarPlayByPlay,
} from './types.js';

export class SportradarClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly language: string;
  readonly enabled: boolean;

  constructor(config: SportradarConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = `https://api.sportradar.com/${config.version ?? 'v7'}`;
    this.language = config.language ?? 'en';
    this.enabled = config.enabled !== false && !!this.apiKey;
  }

  private async get<T>(endpoint: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&language=${this.language}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Sportradar API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      console.error('Sportradar API request failed:', error);
      return null;
    }
  }

  // ─── Sports ─────────────────────────────────────────────────────────────────

  /** Get all available sports */
  async getSports(): Promise<SportradarSport[]> {
    const result = await this.get<{ sports: SportradarSport[] }>('/sports');
    return result?.sports ?? [];
  }

  /** Get sport by ID */
  async getSport(sportId: string): Promise<SportradarSport | null> {
    return this.get<SportradarSport>(`/sports/${sportId}`);
  }

  // ─── Tournaments ────────────────────────────────────────────────────────────

  /** Get tournaments for a sport */
  async getTournaments(sportId: string): Promise<SportradarTournament[]> {
    const result = await this.get<{ tournaments: SportradarTournament[] }>(`/sports/${sportId}/tournaments`);
    return result?.tournaments ?? [];
  }

  /** Get tournament by ID */
  async getTournament(tournamentId: string): Promise<SportradarTournament | null> {
    return this.get<SportradarTournament>(`/tournaments/${tournamentId}`);
  }

  // ─── Seasons ────────────────────────────────────────────────────────────────

  /** Get seasons for a tournament */
  async getSeasons(tournamentId: string): Promise<SportradarTournament['season'][]> {
    const result = await this.get<{ seasons: SportradarTournament['season'][] }>(`/tournaments/${tournamentId}/seasons`);
    return result?.seasons ?? [];
  }

  /** Get current season for a tournament */
  async getCurrentSeason(tournamentId: string): Promise<SportradarTournament['season'] | null> {
    return this.get<SportradarTournament['season']>(`/tournaments/${tournamentId}/seasons/current`);
  }

  // ─── Matches ────────────────────────────────────────────────────────────────

  /** Get scheduled matches for a season */
  async getSchedule(seasonId: string): Promise<SportradarMatch[]> {
    const result = await this.get<{ sport_events: SportradarMatch[] }>(`/seasons/${seasonId}/schedule`);
    return result?.sport_events ?? [];
  }

  /** Get live matches for a sport */
  async getLiveMatches(sportId: string): Promise<SportradarMatch[]> {
    const result = await this.get<{ sport_events: SportradarMatch[] }>(`/sports/${sportId}/live`);
    return result?.sport_events ?? [];
  }

  /** Get match by ID */
  async getMatch(matchId: string): Promise<SportradarMatch | null> {
    return this.get<SportradarMatch>(`/sport_events/${matchId}`);
  }

  /** Get match summary (includes statistics) */
  async getMatchSummary(matchId: string): Promise<SportradarMatch | null> {
    return this.get<SportradarMatch>(`/sport_events/${matchId}/summary`);
  }

  // ─── Play-by-Play ───────────────────────────────────────────────────────────

  /** Get play-by-play for a match */
  async getPlayByPlay(matchId: string): Promise<SportradarPlayByPlay[]> {
    const result = await this.get<{ timeline: SportradarPlayByPlay[] }>(`/sport_events/${matchId}/timeline`);
    return result?.timeline ?? [];
  }

  // ─── Standings ──────────────────────────────────────────────────────────────

  /** Get standings for a season */
  async getStandings(seasonId: string): Promise<SportradarStanding | null> {
    return this.get<SportradarStanding>(`/seasons/${seasonId}/standings`);
  }

  // ─── Injuries ───────────────────────────────────────────────────────────────

  /** Get injuries for a tournament */
  async getInjuries(tournamentId: string): Promise<SportradarInjury[]> {
    const result = await this.get<{ injuries: SportradarInjury[] }>(`/tournaments/${tournamentId}/injuries`);
    return result?.injuries ?? [];
  }

  /** Get injuries for a team */
  async getTeamInjuries(teamId: string): Promise<SportradarInjury[]> {
    const result = await this.get<{ injuries: SportradarInjury[] }>(`/teams/${teamId}/injuries`);
    return result?.injuries ?? [];
  }

  // ─── Lineups ────────────────────────────────────────────────────────────────

  /** Get lineup for a match */
  async getLineup(matchId: string): Promise<SportradarLineup | null> {
    return this.get<SportradarLineup>(`/sport_events/${matchId}/lineups`);
  }

  // ─── Statistics ─────────────────────────────────────────────────────────────

  /** Get match statistics */
  async getMatchStatistics(matchId: string): Promise<SportradarMatchStatistics | null> {
    return this.get<SportradarMatchStatistics>(`/sport_events/${matchId}/statistics`);
  }

  /** Get player statistics for a match */
  async getPlayerStatistics(matchId: string): Promise<SportradarPlayerStatistics[]> {
    const result = await this.get<{ players: SportradarPlayerStatistics[] }>(`/sport_events/${matchId}/players`);
    return result?.players ?? [];
  }

  // ─── Health Check ───────────────────────────────────────────────────────────

  /** Check if API is accessible */
  async healthCheck(): Promise<boolean> {
    try {
      const sports = await this.getSports();
      return sports.length > 0;
    } catch {
      return false;
    }
  }
}
