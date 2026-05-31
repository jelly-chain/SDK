/**
 * Esports Support Module
 * League of Legends, CS2, Dota 2, Valorant — all have prediction markets on Polymarket.
 */

export type EsportTitle = 'league-of-legends' | 'cs2' | 'dota2' | 'valorant' | 'overwatch' | 'rocket-league' | 'apex-legends' | 'fortnite';

export type EsportTier = 'S-tier' | 'A-tier' | 'B-tier' | 'C-tier' | 'qualifier' | 'showmatch';

export interface EsportTeam {
  id: string;
  name: string;
  shortName: string;
  title: EsportTitle;
  region: string;
  country: string;
  rating: number; // HLTV/HLRDB equivalent
  worldRanking?: number;
  recentForm: string[]; // 'W' | 'L'
}

export interface EsportPlayer {
  id: string;
  name: string;
  realName?: string;
  teamId: string;
  title: EsportTitle;
  role: string;
  country: string;
  rating: number;
  stats: Record<string, number>;
}

export interface EsportMatch {
  id: string;
  title: EsportTitle;
  tournament: string;
  tier: EsportTier;
  bestOf: 1 | 2 | 3 | 5;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  maps: EsportMap[];
  streams?: { platform: string; url: string }[];
}

export interface EsportMap {
  number: number;
  name: string;
  homeScore: number;
  awayScore: number;
  winner?: string;
  duration?: number; // in seconds
}

export interface EsportTournament {
  id: string;
  name: string;
  title: EsportTitle;
  tier: EsportTier;
  region: string;
  startDate: string;
  endDate: string;
  prizePool?: number;
  teams: string[];
  stage: 'group' | 'playoffs' | 'finals';
  matches: EsportMatch[];
}

export interface EsportPredictionFeatures {
  homeTeamId: string;
  awayTeamId: string;
  title: EsportTitle;
  bestOf: number;
  homeRating: number;
  awayRating: number;
  homeForm: number; // 0-1
  awayForm: number;
  mapWinRates: {
    home: Record<string, number>; // map name -> win rate
    away: Record<string, number>;
  };
  headToHead: { homeWins: number; awayWins: number };
  lanOrOnline: 'lan' | 'online';
  crowdAdvantage: boolean;
}

export class EsportsModule {
  private teams: Map<string, EsportTeam> = new Map();
  private players: Map<string, EsportPlayer> = new Map();
  private matches: Map<string, EsportMatch> = new Map();
  private tournaments: Map<string, EsportTournament> = new Map();

  /** Register a team */
  addTeam(team: EsportTeam): void {
    this.teams.set(team.id, team);
  }

  /** Register a player */
  addPlayer(player: EsportPlayer): void {
    this.players.set(player.id, player);
  }

  /** Register a match */
  addMatch(match: EsportMatch): void {
    this.matches.set(match.id, match);
  }

  /** Register a tournament */
  addTournament(tournament: EsportTournament): void {
    this.tournaments.set(tournament.id, tournament);
  }

  /** Get teams by title */
  getTeamsByTitle(title: EsportTitle): EsportTeam[] {
    return Array.from(this.teams.values()).filter((t) => t.title === title);
  }

  /** Get teams by region */
  getTeamsByRegion(region: string): EsportTeam[] {
    return Array.from(this.teams.values()).filter((t) => t.region === region);
  }

  /** Get live matches */
  getLiveMatches(): EsportMatch[] {
    return Array.from(this.matches.values()).filter((m) => m.status === 'live');
  }

  /** Get upcoming matches for a title */
  getUpcomingMatches(title?: EsportTitle): EsportMatch[] {
    return Array.from(this.matches.values()).filter((m) => {
      const isUpcoming = m.status === 'upcoming';
      if (title) return isUpcoming && m.title === title;
      return isUpcoming;
    });
  }

  /** Get active tournaments */
  getActiveTournaments(title?: EsportTitle): EsportTournament[] {
    const now = new Date();
    return Array.from(this.tournaments.values()).filter((t) => {
      const isActive = new Date(t.startDate) <= now && now <= new Date(t.endDate);
      if (title) return isActive && t.title === title;
      return isActive;
    });
  }

  /** Predict match outcome */
  predictMatch(features: EsportPredictionFeatures): {
    homeWinProb: number;
    awayWinProb: number;
    factors: string[];
    mapAdvantage: string;
  } {
    let homeScore = 0.5;
    const factors: string[] = [];

    // Rating differential (Elo-like)
    const ratingDiff = features.homeRating - features.awayRating;
    homeScore += ratingDiff / 1000; // Scale appropriately
    if (Math.abs(ratingDiff) > 100) factors.push(`Rating advantage: ${ratingDiff > 0 ? 'home' : 'away'} (+${Math.abs(ratingDiff)})`);

    // Form
    const formDiff = features.homeForm - features.awayForm;
    homeScore += formDiff * 0.12;
    if (Math.abs(formDiff) > 0.2) factors.push('Recent form differential');

    // Head to head
    const h2hTotal = features.headToHead.homeWins + features.headToHead.awayWins;
    if (h2hTotal > 2) {
      const h2hHomeRate = features.headToHead.homeWins / h2hTotal;
      homeScore += (h2hHomeRate - 0.5) * 0.08;
      if (Math.abs(h2hHomeRate - 0.5) > 0.2) factors.push('Head-to-head advantage');
    }

    // Map pool analysis
    let mapAdvantage = 'Even map pool';
    const homeMapRates = Object.values(features.mapWinRates.home);
    const awayMapRates = Object.values(features.mapWinRates.away);
    if (homeMapRates.length > 0 && awayMapRates.length > 0) {
      const homeAvgMap = homeMapRates.reduce((a, b) => a + b, 0) / homeMapRates.length;
      const awayAvgMap = awayMapRates.reduce((a, b) => a + b, 0) / awayMapRates.length;
      const mapDiff = homeAvgMap - awayAvgMap;
      homeScore += mapDiff * 0.1;
      if (Math.abs(mapDiff) > 0.1) {
        mapAdvantage = `${mapDiff > 0 ? 'Home' : 'Away'} team has map pool advantage`;
        factors.push(mapAdvantage);
      }
    }

    // LAN vs Online (LAN tends to favor experienced teams)
    if (features.lanOrOnline === 'lan') {
      factors.push('LAN environment — experience matters more');
    }

    // Crowd advantage
    if (features.crowdAdvantage) {
      homeScore += 0.03;
      factors.push('Home crowd advantage');
    }

    // Best of format (longer series = less upset potential)
    if (features.bestOf === 5) {
      // Bo5 slightly reduces variance
      homeScore = 0.5 + (homeScore - 0.5) * 1.1;
      factors.push('Bo5 format — favorite has better chance');
    }

    homeScore = Math.max(0.1, Math.min(0.9, homeScore));

    return {
      homeWinProb: homeScore,
      awayWinProb: 1 - homeScore,
      factors,
      mapAdvantage,
    };
  }

  /** Get Polymarket-compatible event description */
  formatForPolymarket(match: EsportMatch): {
    title: string;
    description: string;
    outcomes: string[];
  } {
    const home = this.teams.get(match.homeTeamId);
    const away = this.teams.get(match.awayTeamId);
    const title = `${home?.name ?? match.homeTeamId} vs ${away?.name ?? match.awayTeamId}`;
    const description = `${match.tournament} — Best of ${match.bestOf}`;
    return {
      title,
      description,
      outcomes: [home?.name ?? 'Home', away?.name ?? 'Away'],
    };
  }
}
