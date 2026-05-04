import { AbstractProvider } from '../base-provider.js';

export interface FifaPlatformConfig {
  enabled?: boolean;
  baseUrl?: string;
}

/**
 * Client stub for the official FIFA platform data API.
 * Requires appropriate licensing for production use.
 */
export class FifaPlatformClient extends AbstractProvider {
  readonly name = 'fifa-platform';
  readonly enabled: boolean;
  private baseUrl: string;

  constructor(config: FifaPlatformConfig = {}) {
    super();
    this.enabled = config.enabled ?? false;
    this.baseUrl = config.baseUrl ?? 'https://api.fifa.com/api/v3';
  }

  async fetchCompetitions(): Promise<unknown[]> {
    this.logRequest('/competitions');
    return [];
  }

  async fetchMatches(competitionId: string): Promise<unknown[]> {
    this.logRequest(`/matches?competition=${competitionId}`);
    return [];
  }

  async fetchStandings(competitionId: string, groupId: string): Promise<unknown> {
    this.logRequest(`/standings?competition=${competitionId}&group=${groupId}`);
    return null;
  }
}
