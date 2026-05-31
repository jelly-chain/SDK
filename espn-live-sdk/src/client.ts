import type { EspnConfig, EspnLeague, EspnScore, EspnStanding, EspnTeam } from './types.js';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export class EspnClient {
  readonly enabled: boolean;

  constructor(config: EspnConfig = {}) {
    this.enabled = config.enabled !== false;
  }

  private async get<T>(url: string): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    } catch {
      return null;
    }
  }

  // ─── Scores ─────────────────────────────────────────────────────────────────

  async getScores(league: string): Promise<EspnScore[]> {
    const url = `${ESPN_BASE}/${this.getSportPath(league)}/${league}/scoreboard`;
    const data = await this.get<{ events: unknown[] }>(url);
    return (data?.events ?? []).map((e: any) => this.parseEvent(e, league));
  }

  async getLiveScores(league: string): Promise<EspnScore[]> {
    const scores = await this.getScores(league);
    return scores.filter((s) => s.status === 'in');
  }

  async getScore(league: string, eventId: string): Promise<EspnScore | null> {
    const url = `${ESPN_BASE}/${this.getSportPath(league)}/${league}/summary?event=${eventId}`;
    const data = await this.get<Record<string, unknown>>(url);
    if (!data) return null;
    return this.parseEvent(data['header'] as any, league);
  }

  // ─── Standings ──────────────────────────────────────────────────────────────

  async getStandings(league: string): Promise<EspnStanding[]> {
    const url = `${ESPN_BASE}/${this.getSportPath(league)}/${league}/standings`;
    const data = await this.get<Record<string, unknown>>(url);
    if (!data) return [];

    const standings: EspnStanding[] = [];
    const groups = (data['children'] as any[]) ?? [];
    for (const group of groups) {
      const entries = group?.standings?.entries ?? [];
      for (const entry of entries) {
        standings.push(this.parseStanding(entry));
      }
    }
    return standings;
  }

  // ─── Schedule ───────────────────────────────────────────────────────────────

  async getSchedule(league: string, date?: string): Promise<EspnScore[]> {
    const dateParam = date ? `?dates=${date}` : '';
    const url = `${ESPN_BASE}/${this.getSportPath(league)}/${league}/scoreboard${dateParam}`;
    const data = await this.get<{ events: unknown[] }>(url);
    return (data?.events ?? []).map((e: any) => this.parseEvent(e, league));
  }

  // ─── Teams ──────────────────────────────────────────────────────────────────

  async getTeams(league: string): Promise<EspnTeam[]> {
    const url = `${ESPN_BASE}/${this.getSportPath(league)}/${league}/teams`;
    const data = await this.get<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: any }> }> }> }>(url);
    return (data?.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t: any) => ({
      id: t.team.id,
      name: t.team.name,
      abbreviation: t.team.abbreviation,
      displayName: t.team.displayName,
      logo: t.team.logos?.[0]?.href,
    }));
  }

  // ─── Parsers ────────────────────────────────────────────────────────────────

  private parseEvent(e: any, league: string): EspnScore {
    const competition = e.competitions?.[0] ?? {};
    const home = competition.competitors?.find((c: any) => c.homeAway === 'home') ?? {};
    const away = competition.competitors?.find((c: any) => c.homeAway === 'away') ?? {};

    return {
      id: e.id,
      league,
      name: e.name ?? '',
      shortName: e.shortName ?? '',
      status: competition.status?.type?.state ?? 'pre',
      period: competition.status?.period,
      clock: competition.status?.clock,
      displayClock: competition.status?.displayClock,
      homeTeam: {
        id: home.team?.id ?? '',
        name: home.team?.name ?? '',
        abbreviation: home.team?.abbreviation ?? '',
        displayName: home.team?.displayName ?? '',
        score: home.score ?? '0',
      },
      awayTeam: {
        id: away.team?.id ?? '',
        name: away.team?.name ?? '',
        abbreviation: away.team?.abbreviation ?? '',
        displayName: away.team?.displayName ?? '',
        score: away.score ?? '0',
      },
      venue: competition.venue?.fullName,
      date: e.date ?? '',
    };
  }

  private parseStanding(entry: any): EspnStanding {
    return {
      team: {
        id: entry.team?.id ?? '',
        name: entry.team?.name ?? '',
        abbreviation: entry.team?.abbreviation ?? '',
        displayName: entry.team?.displayName ?? '',
      },
      wins: parseInt(entry.stats?.find((s: any) => s.name === 'wins')?.value ?? '0'),
      losses: parseInt(entry.stats?.find((s: any) => s.name === 'losses')?.value ?? '0'),
      ties: parseInt(entry.stats?.find((s: any) => s.name === 'ties')?.value ?? '0'),
      winPercent: parseFloat(entry.stats?.find((s: any) => s.name === 'winPercent')?.value ?? '0'),
      rank: entry.stats?.find((s: any) => s.name === 'rank')?.value ?? 0,
    };
  }

  private getSportPath(league: string): string {
    const map: Record<string, string> = {
      'nfl': 'football/nfl',
      'nba': 'basketball/nba',
      'mlb': 'baseball/mlb',
      'nhl': 'hockey/nhl',
      'mls': 'soccer/usa.1',
      'epl': 'soccer/eng.1',
      'ucl': 'soccer/uefa.champions',
      'ncaaf': 'college-football',
      'ncaab': 'mens-college-basketball',
    };
    return map[league] ?? `football/nfl`;
  }
}
