/**
 * Club World Cup 2025 — New 32-team tournament format.
 * Supports group stage + knockout bracket for club teams.
 */

export interface ClubTeam {
  id: string;
  name: string;
  shortName: string;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC';
  country: string;
  league: string;
  fifaRanking?: number;
  qualified: boolean;
}

export interface ClubWorldCupGroup {
  id: string;
  name: string; // e.g. "Group A"
  teams: string[]; // team IDs
  standings: ClubStanding[];
}

export interface ClubStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ClubWorldCupMatch {
  id: string;
  groupId?: string;
  round: 'group' | 'round-of-16' | 'quarterfinal' | 'semifinal' | 'final' | 'third-place';
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  kickoffUtc: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  attendance?: number;
}

export interface ClubWorldCupConfig {
  season: string; // e.g. "2025"
}

const CLUB_WORLD_CUP_2025_TEAMS: ClubTeam[] = [
  // UEFA (12 teams)
  { id: 'cwc-rma', name: 'Real Madrid', shortName: 'RMA', confederation: 'UEFA', country: 'Spain', league: 'La Liga', qualified: true },
  { id: 'cwc-mci', name: 'Manchester City', shortName: 'MCI', confederation: 'UEFA', country: 'England', league: 'Premier League', qualified: true },
  { id: 'cwc-bay', name: 'Bayern Munich', shortName: 'BAY', confederation: 'UEFA', country: 'Germany', league: 'Bundesliga', qualified: true },
  { id: 'cwc-che', name: 'Chelsea', shortName: 'CHE', confederation: 'UEFA', country: 'England', league: 'Premier League', qualified: true },
  { id: 'cwc-bvb', name: 'Borussia Dortmund', shortName: 'BVB', confederation: 'UEFA', country: 'Germany', league: 'Bundesliga', qualified: true },
  { id: 'cwc-int', name: 'Inter Milan', shortName: 'INT', confederation: 'UEFA', country: 'Italy', league: 'Serie A', qualified: true },
  { id: 'cwc-por', name: 'FC Porto', shortName: 'POR', confederation: 'UEFA', country: 'Portugal', league: 'Primeira Liga', qualified: true },
  { id: 'cwc-ben', name: 'Benfica', shortName: 'BEN', confederation: 'UEFA', country: 'Portugal', league: 'Primeira Liga', qualified: true },
  { id: 'cwc-juv', name: 'Juventus', shortName: 'JUV', confederation: 'UEFA', country: 'Italy', league: 'Serie A', qualified: true },
  { id: 'cwc-atl', name: 'Atletico Madrid', shortName: 'ATL', confederation: 'UEFA', country: 'Spain', league: 'La Liga', qualified: true },
  { id: 'cwc-sal', name: 'Red Bull Salzburg', shortName: 'SAL', confederation: 'UEFA', country: 'Austria', league: 'Austrian Bundesliga', qualified: true },
  { id: 'cwc-pse', name: 'Paris Saint-Germain', shortName: 'PSG', confederation: 'UEFA', country: 'France', league: 'Ligue 1', qualified: true },
  // CONMEBOL (6 teams)
  { id: 'cwc-pal', name: 'Palmeiras', shortName: 'PAL', confederation: 'CONMEBOL', country: 'Brazil', league: 'Brasileirao', qualified: true },
  { id: 'cwc-fla', name: 'Flamengo', shortName: 'FLA', confederation: 'CONMEBOL', country: 'Brazil', league: 'Brasileirao', qualified: true },
  { id: 'cwc-riv', name: 'River Plate', shortName: 'RIV', confederation: 'CONMEBOL', country: 'Argentina', league: 'Argentine Primera', qualified: true },
  { id: 'cwc-boc', name: 'Boca Juniors', shortName: 'BOC', confederation: 'CONMEBOL', country: 'Argentina', league: 'Argentine Primera', qualified: true },
  { id: 'cwc-flo', name: 'Fluminense', shortName: 'FLO', confederation: 'CONMEBOL', country: 'Brazil', league: 'Brasileirao', qualified: true },
  { id: 'cwc-bot', name: 'Botafogo', shortName: 'BOT', confederation: 'CONMEBOL', country: 'Brazil', league: 'Brasileirao', qualified: true },
  // CONCACAF (4 teams)
  { id: 'cwc-mon', name: 'Monterrey', shortName: 'MON', confederation: 'CONCACAF', country: 'Mexico', league: 'Liga MX', qualified: true },
  { id: 'cwc-leo', name: 'Leon', shortName: 'LEO', confederation: 'CONCACAF', country: 'Mexico', league: 'Liga MX', qualified: true },
  { id: 'cwc-sea', name: 'Seattle Sounders', shortName: 'SEA', confederation: 'CONCACAF', country: 'USA', league: 'MLS', qualified: true },
  { id: 'cwc-pac', name: 'Pachuca', shortName: 'PAC', confederation: 'CONCACAF', country: 'Mexico', league: 'Liga MX', qualified: true },
  // AFC (4 teams)
  { id: 'cwc-hil', name: 'Al Hilal', shortName: 'HIL', confederation: 'AFC', country: 'Saudi Arabia', league: 'Saudi Pro League', qualified: true },
  { id: 'cwc-ura', name: 'Urawa Red Diamonds', shortName: 'URA', confederation: 'AFC', country: 'Japan', league: 'J1 League', qualified: true },
  { id: 'cwc-ain', name: 'Al Ain', shortName: 'AIN', confederation: 'AFC', country: 'UAE', league: 'UAE Pro League', qualified: true },
  { id: 'cwc-uls', name: 'Ulsan Hyundai', shortName: 'ULS', confederation: 'AFC', country: 'South Korea', league: 'K League 1', qualified: true },
  // CAF (4 teams)
  { id: 'cwc-ahl', name: 'Al Ahly', shortName: 'AHL', confederation: 'CAF', country: 'Egypt', league: 'Egyptian Premier League', qualified: true },
  { id: 'cwc-wyd', name: 'Wydad Casablanca', shortName: 'WYD', confederation: 'CAF', country: 'Morocco', league: 'Botola Pro', qualified: true },
  { id: 'cwc-est', name: 'Esperance de Tunis', shortName: 'EST', confederation: 'CAF', country: 'Tunisia', league: 'Tunisian Ligue 1', qualified: true },
  { id: 'cwc-mam', name: 'Mamelodi Sundowns', shortName: 'MAM', confederation: 'CAF', country: 'South Africa', league: 'PSL', qualified: true },
  // OFC (1 team)
  { id: 'cwc-auc', name: 'Auckland City', shortName: 'AUC', confederation: 'OFC', country: 'New Zealand', league: 'NZ Northern League', qualified: true },
  // Host nation (1 team)
  { id: 'cwc-int', name: 'Inter Miami', shortName: 'MIA', confederation: 'CONCACAF', country: 'USA', league: 'MLS', qualified: true },
];

export class ClubWorldCupModule {
  private teams: ClubTeam[] = CLUB_WORLD_CUP_2025_TEAMS;
  private groups: ClubWorldCupGroup[] = [];
  private matches: ClubWorldCupMatch[] = [];

  constructor(private readonly config: ClubWorldCupConfig = { season: '2025' }) {}

  /** Get all qualified club teams */
  async getTeams(): Promise<ClubTeam[]> {
    return [...this.teams];
  }

  /** Get teams by confederation */
  async getTeamsByConfederation(conf: ClubTeam['confederation']): Promise<ClubTeam[]> {
    return this.teams.filter((t) => t.confederation === conf);
  }

  /** Get a specific team by ID */
  async getTeam(teamId: string): Promise<ClubTeam | undefined> {
    return this.teams.find((t) => t.id === teamId);
  }

  /** Get the group stage draw */
  async getGroups(): Promise<ClubWorldCupGroup[]> {
    return [...this.groups];
  }

  /** Get matches by round */
  async getMatchesByRound(round: ClubWorldCupMatch['round']): Promise<ClubWorldCupMatch[]> {
    return this.matches.filter((m) => m.round === round);
  }

  /** Get matches for a specific team */
  async getTeamMatches(teamId: string): Promise<ClubWorldCupMatch[]> {
    return this.matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);
  }

  /** Get live matches */
  async getLiveMatches(): Promise<ClubWorldCupMatch[]> {
    return this.matches.filter((m) => m.status === 'live');
  }

  /** Check if a team has qualified */
  async isQualified(teamId: string): Promise<boolean> {
    const team = this.teams.find((t) => t.id === teamId);
    return team?.qualified ?? false;
  }

  /** Get confederation representation summary */
  async getConfederationSummary(): Promise<Record<string, number>> {
    const summary: Record<string, number> = {};
    for (const team of this.teams) {
      summary[team.confederation] = (summary[team.confederation] ?? 0) + 1;
    }
    return summary;
  }
}
