import { AbstractProvider } from '../base-provider.js';

export interface FootballApiConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Client stub for api-football.com (v3).
 * Set FOOTBALL_API_KEY in environment or pass via config.
 */
export class FootballApiClient extends AbstractProvider {
  readonly name = 'football-api';
  readonly enabled: boolean;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FootballApiConfig = {}) {
    super();
    this.apiKey = config.apiKey ?? process.env['FOOTBALL_API_KEY'] ?? '';
    this.enabled = this.apiKey.length > 0;
    this.baseUrl = config.baseUrl ?? 'https://v3.football.api-sports.io';
  }

  private get headers(): Record<string, string> {
    return { 'x-rapidapi-key': this.apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' };
  }

  async fetchFixtures(leagueId: number, season: number): Promise<unknown[]> {
    this.logRequest(`/fixtures?league=${leagueId}&season=${season}`);
    return [];
  }

  async fetchStandings(leagueId: number, season: number): Promise<unknown> {
    this.logRequest(`/standings?league=${leagueId}&season=${season}`);
    return null;
  }

  async fetchSquad(teamId: number): Promise<unknown> {
    this.logRequest(`/players/squads?team=${teamId}`);
    return null;
  }

  override async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
