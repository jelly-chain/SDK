import type { EsportsConfig, EsportTeam, EsportMatch, EsportTournament } from './types.js';

export class EsportsClient {
  private readonly pandascoreKey: string;
  readonly enabled: boolean;

  constructor(config: EsportsConfig = {}) {
    this.pandascoreKey = config.pandascoreApiKey ?? process.env['PANDASCORE_API_KEY'] ?? '';
    this.enabled = config.enabled !== false;
  }

  private async get<T>(url: string): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.pandascoreKey}` },
      });
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    } catch {
      return null;
    }
  }

  async getTeams(title?: string): Promise<EsportTeam[]> {
    const url = title
      ? `https://api.pandascore.co/${title}/teams?per_page=50`
      : 'https://api.pandascore.co/teams?per_page=50';
    return (await this.get<EsportTeam[]>(url)) ?? [];
  }

  async getMatches(params: { title?: string; status?: string; limit?: number } = {}): Promise<EsportMatch[]> {
    const title = params.title ?? '';
    const status = params.status ?? 'upcoming';
    const limit = params.limit ?? 20;
    const url = `https://api.pandascore.co/${title}/matches?filter[status]=${status}&per_page=${limit}`;
    return (await this.get<EsportMatch[]>(url)) ?? [];
  }

  async getLiveMatches(): Promise<EsportMatch[]> {
    return this.getMatches({ status: 'running' });
  }

  async getUpcomingMatches(title?: string): Promise<EsportMatch[]> {
    return this.getMatches({ title, status: 'upcoming' });
  }

  async getTournaments(title?: string): Promise<EsportTournament[]> {
    const url = title
      ? `https://api.pandascore.co/${title}/tournaments?per_page=20`
      : 'https://api.pandascore.co/tournaments?per_page=20';
    return (await this.get<EsportTournament[]>(url)) ?? [];
  }

  async getTeam(teamId: string): Promise<EsportTeam | null> {
    return this.get<EsportTeam>(`https://api.pandascore.co/teams/${teamId}`);
  }

  async getMatch(matchId: string): Promise<EsportMatch | null> {
    return this.get<EsportMatch>(`https://api.pandascore.co/matches/${matchId}`);
  }
}
