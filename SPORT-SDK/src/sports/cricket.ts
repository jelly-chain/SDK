/**
 * Cricket Support Module
 * IPL, ICC events, and major cricket leagues for prediction markets.
 */

export type CricketLeague =
  | 'ipl' | 'big-bash' | 'cpl' | 'psl' | 'hundred'
  | 'icc-world-cup' | 'icc-t20-world-cup' | 'icc-champions-trophy'
  | 'county-championship' | 'ranji-trophy' | 'test-series';

export type CricketFormat = 't20' | 'odi' | 'test' | 'hundred';

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  league: CricketLeague;
  country: string;
}

export interface CricketPlayer {
  id: string;
  name: string;
  teamId: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-hand' | 'left-hand';
  bowlingStyle?: string;
  nationality: string;
  isOverseas: boolean;
  stats: {
    matches: number;
    runs?: number;
    battingAvg?: number;
    strikeRate?: number;
    wickets?: number;
    bowlingAvg?: number;
    economy?: number;
  };
}

export interface CricketMatch {
  id: string;
  league: CricketLeague;
  format: CricketFormat;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  city: string;
  startDate: string;
  endDate?: string;
  status: 'upcoming' | 'live' | 'innings-break' | 'finished' | 'abandoned' | 'no-result';
  result?: string;
  tossWinner?: string;
  tossDecision?: 'bat' | 'field';
  innings: CricketInnings[];
}

export interface CricketInnings {
  teamId: string;
  runs: number;
  wickets: number;
  overs: number;
  runRate: number;
  extras: number;
  topBatsman?: { playerId: string; runs: number; balls: number; fours: number; sixes: number };
  topBowler?: { playerId: string; wickets: number; runs: number; overs: number; economy: number };
}

export interface CricketStanding {
  teamId: string;
  league: CricketLeague;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  netRunRate: number;
  position: number;
}

export interface CricketPredictionFeatures {
  homeTeamId: string;
  awayTeamId: string;
  format: CricketFormat;
  venue: string;
  homeForm: number; // 0-1
  awayForm: number;
  headToHead: { homeWins: number; awayWins: number; draws: number };
  homeBattingStrength: number;
  awayBattingStrength: number;
  homeBowlingStrength: number;
  awayBowlingStrength: number;
  tossImpact: number; // How much toss matters at this venue
  pitchCondition: 'batting-friendly' | 'bowling-friendly' | 'balanced' | 'spin-friendly' | 'pace-friendly';
  dewFactor: number; // 0-1, affects chasing teams in evening matches
}

export class CricketModule {
  private teams: Map<string, CricketTeam> = new Map();
  private players: Map<string, CricketPlayer> = new Map();
  private matches: Map<string, CricketMatch> = new Map();

  /** Register a team */
  addTeam(team: CricketTeam): void {
    this.teams.set(team.id, team);
  }

  /** Register a player */
  addPlayer(player: CricketPlayer): void {
    this.players.set(player.id, player);
  }

  /** Register a match */
  addMatch(match: CricketMatch): void {
    this.matches.set(match.id, match);
  }

  /** Get teams by league */
  getTeamsByLeague(league: CricketLeague): CricketTeam[] {
    return Array.from(this.teams.values()).filter((t) => t.league === league);
  }

  /** Get players by team */
  getPlayersByTeam(teamId: string): CricketPlayer[] {
    return Array.from(this.players.values()).filter((p) => p.teamId === teamId);
  }

  /** Get live matches */
  getLiveMatches(): CricketMatch[] {
    return Array.from(this.matches.values()).filter((m) => m.status === 'live' || m.status === 'innings-break');
  }

  /** Get upcoming matches */
  getUpcomingMatches(league?: CricketLeague): CricketMatch[] {
    return Array.from(this.matches.values()).filter((m) => {
      const isUpcoming = m.status === 'upcoming';
      if (league) return isUpcoming && m.league === league;
      return isUpcoming;
    });
  }

  /** Calculate Net Run Rate for a team */
  calculateNRR(teamId: string, matches: CricketMatch[]): number {
    let totalRunsScored = 0;
    let totalOversFaced = 0;
    let totalRunsConceded = 0;
    let totalOversBowled = 0;

    for (const match of matches) {
      for (const innings of match.innings) {
        if (innings.teamId === teamId) {
          totalRunsScored += innings.runs;
          totalOversFaced += innings.overs;
        } else {
          totalRunsConceded += innings.runs;
          totalOversBowled += innings.overs;
        }
      }
    }

    if (totalOversFaced === 0 || totalOversBowled === 0) return 0;
    return totalRunsScored / totalOversFaced - totalRunsConceded / totalOversBowled;
  }

  /** Predict match outcome */
  predictMatch(features: CricketPredictionFeatures): {
    homeWinProb: number;
    awayWinProb: number;
    drawProb: number;
    factors: string[];
    tossAdvantage: string;
  } {
    let homeScore = 0.5;
    const factors: string[] = [];

    // Form differential
    const formDiff = features.homeForm - features.awayForm;
    homeScore += formDiff * 0.15;
    if (Math.abs(formDiff) > 0.2) factors.push(`Form differential: ${formDiff > 0 ? 'home' : 'away'} advantage`);

    // Head to head
    const h2hTotal = features.headToHead.homeWins + features.headToHead.awayWins + features.headToHead.draws;
    if (h2hTotal > 0) {
      const h2hHomeRate = features.headToHead.homeWins / h2hTotal;
      homeScore += (h2hHomeRate - 0.5) * 0.1;
      if (Math.abs(h2hHomeRate - 0.5) > 0.15) factors.push('Head-to-head history favors one side');
    }

    // Batting strength
    const batDiff = features.homeBattingStrength - features.awayBattingStrength;
    homeScore += batDiff * 0.12;
    if (Math.abs(batDiff) > 0.15) factors.push('Batting strength differential');

    // Bowling strength
    const bowlDiff = features.homeBowlingStrength - features.awayBowlingStrength;
    homeScore += bowlDiff * 0.08;

    // Pitch condition impact
    if (features.pitchCondition === 'spin-friendly') {
      factors.push('Spin-friendly pitch — team with better spinners has edge');
    } else if (features.pitchCondition === 'pace-friendly') {
      factors.push('Pace-friendly pitch — team with better pace attack has edge');
    }

    // Dew factor (helps chasing team)
    if (features.dewFactor > 0.5 && features.format === 't20') {
      homeScore -= features.dewFactor * 0.05; // Slight disadvantage to batting first
      factors.push('Dew factor may help chasing team');
    }

    // Toss impact
    const tossAdvantage = features.tossImpact > 0.6
      ? 'Toss is significant at this venue — consider toss winner'
      : 'Toss has minimal impact';

    homeScore = Math.max(0.15, Math.min(0.85, homeScore));

    // Draw probability (mainly in Tests)
    let drawProb = 0;
    if (features.format === 'test') {
      drawProb = 0.15;
      homeScore *= 0.85;
    }

    return {
      homeWinProb: homeScore,
      awayWinProb: 1 - homeScore - drawProb,
      drawProb,
      factors,
      tossAdvantage,
    };
  }

  /** Get IPL-specific insights */
  getIPLInsights(): {
    mostExpensivePlayer: string;
    bestNRR: string;
    playoffsTeams: string[];
    bottomTeams: string[];
  } {
    // Placeholder — would use real data
    return {
      mostExpensivePlayer: 'TBD',
      bestNRR: 'TBD',
      playoffsTeams: [],
      bottomTeams: [],
    };
  }
}
