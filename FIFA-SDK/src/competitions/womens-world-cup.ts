/**
 * Women's World Cup data layer.
 * Same architecture as men's World Cup, different competition IDs.
 */

export interface WomensTeam {
  id: string;
  name: string;
  shortName: string;
  countryCode: string;
  confederation: string;
  fifaRanking?: number;
}

export interface WomensMatch {
  id: string;
  competitionId: string;
  stage: 'group' | 'round-of-16' | 'quarterfinal' | 'semifinal' | 'final';
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  city: string;
  country: string;
  kickoffUtc: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  attendance?: number;
}

export interface WomensStanding {
  teamId: string;
  groupId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export interface WomensWorldCupConfig {
  competitionId: string; // e.g. "wwc-2027"
  season: string;
}

const WWC_COMPETITIONS: Record<string, { name: string; year: number; host: string; teams: number }> = {
  'wwc-2023': { name: '2023 FIFA Women\'s World Cup', year: 2023, host: 'Australia/New Zealand', teams: 32 },
  'wwc-2027': { name: '2027 FIFA Women\'s World Cup', year: 2027, host: 'Brazil', teams: 32 },
};

export class WomensWorldCupModule {
  private competitionId: string;
  private season: string;

  constructor(config: WomensWorldCupConfig) {
    this.competitionId = config.competitionId;
    this.season = config.season;
  }

  /** Get competition info */
  async getCompetitionInfo(): Promise<{ name: string; year: number; host: string; teams: number } | undefined> {
    return WWC_COMPETITIONS[this.competitionId];
  }

  /** List all WWC competitions */
  async listCompetitions(): Promise<Array<{ id: string; name: string; year: number; host: string }>> {
    return Object.entries(WWC_COMPETITIONS).map(([id, info]) => ({
      id,
      name: info.name,
      year: info.year,
      host: info.host,
    }));
  }

  /** Get team by ID */
  async getTeam(teamId: string): Promise<WomensTeam | undefined> {
    // In production, this would fetch from a data provider
    return undefined;
  }

  /** Get all teams in the competition */
  async getTeams(): Promise<WomensTeam[]> {
    return [];
  }

  /** Get matches by stage */
  async getMatches(stage?: WomensMatch['stage']): Promise<WomensMatch[]> {
    return [];
  }

  /** Get group standings */
  async getStandings(groupId: string): Promise<WomensStanding[]> {
    return [];
  }

  /** Get all group standings */
  async getAllStandings(): Promise<Record<string, WomensStanding[]>> {
    return {};
  }

  /** Check if competition is active */
  async isActive(): Promise<boolean> {
    const info = await this.getCompetitionInfo();
    if (!info) return false;
    const now = new Date();
    // Rough estimate: WWC runs ~1 month
    const year = now.getFullYear();
    return year === info.year;
  }

  /** Get competition ID for data provider queries */
  getCompetitionId(): string {
    return this.competitionId;
  }
}
