import type { CricketConfig, CricketMatch, CricketTeam, CricketPlayer } from './types.js';

export class CricketClient {
  private readonly apiKey: string;
  readonly enabled: boolean;

  constructor(config: CricketConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['CRICAPI_KEY'] ?? '';
    this.enabled = config.enabled !== false && !!this.apiKey;
  }

  async getMatches(params: { league?: string; status?: string } = {}): Promise<CricketMatch[]> {
    if (!this.enabled) return [];
    try {
      const res = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${this.apiKey}&offset=0`);
      if (!res.ok) return [];
      const data = await res.json() as { data: any[] };
      return (data.data ?? []).map((m) => this.normalizeMatch(m));
    } catch {
      return [];
    }
  }

  async getMatch(matchId: string): Promise<CricketMatch | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`https://api.cricapi.com/v1/match_info?apikey=${this.apiKey}&id=${matchId}`);
      if (!res.ok) return null;
      const data = await res.json() as { data: any };
      return this.normalizeMatch(data.data);
    } catch {
      return null;
    }
  }

  async getPlayers(search: string): Promise<CricketPlayer[]> {
    if (!this.enabled) return [];
    try {
      const res = await fetch(`https://api.cricapi.com/v1/players?apikey=${this.apiKey}&search=${encodeURIComponent(search)}`);
      if (!res.ok) return [];
      const data = await res.json() as { data: any[] };
      return (data.data ?? []).map((p) => this.normalizePlayer(p));
    } catch {
      return [];
    }
  }

  async getLiveMatches(): Promise<CricketMatch[]> {
    return this.getMatches({ status: 'live' });
  }

  async getUpcomingMatches(): Promise<CricketMatch[]> {
    return this.getMatches({ status: 'upcoming' });
  }

  private normalizeMatch(m: any): CricketMatch {
    return {
      id: m.id ?? '',
      league: this.detectLeague(m.name ?? ''),
      format: this.detectFormat(m.matchType ?? ''),
      homeTeamId: m.teams?.[0]?.toLowerCase().replace(/\s+/g, '-') ?? '',
      awayTeamId: m.teams?.[1]?.toLowerCase().replace(/\s+/g, '-') ?? '',
      venue: m.venue ?? '',
      startDate: m.dateTimeGMT ?? '',
      status: m.matchStarted ? (m.matchEnded ? 'finished' : 'live') : 'upcoming',
      result: m.status,
      innings: [],
      tossWinner: m.tossWinner,
      tossDecision: m.tossChoice as 'bat' | 'field',
    };
  }

  private normalizePlayer(p: any): CricketPlayer {
    return {
      id: p.id ?? '',
      name: p.name ?? '',
      teamId: '',
      role: 'batsman',
      stats: { matches: 0 },
    };
  }

  private detectLeague(name: string): CricketLeague {
    const lower = name.toLowerCase();
    if (lower.includes('ipl')) return 'ipl';
    if (lower.includes('big bash')) return 'big-bash';
    if (lower.includes('cpl')) return 'cpl';
    if (lower.includes('psl')) return 'psl';
    if (lower.includes('world cup') && lower.includes('t20')) return 'icc-t20-world-cup';
    if (lower.includes('world cup')) return 'icc-world-cup';
    return 'ipl';
  }

  private detectFormat(type: string): CricketFormat {
    if (type === 't20') return 't20';
    if (type === 'odi') return 'odi';
    if (type === 'test') return 'test';
    return 't20';
  }
}
