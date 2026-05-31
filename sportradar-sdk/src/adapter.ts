/**
 * Sportradar Data Adapter
 * Normalizes Sportradar data into JellyOS-compatible formats.
 */

import type {
  SportradarMatch,
  SportradarStanding,
  SportradarInjury,
  SportradarCompetitor,
  SportradarPlayer,
} from './types.js';

export interface NormalizedTeam {
  id: string;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
}

export interface NormalizedMatch {
  id: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  status: string;
  scheduled: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  tournament: string;
}

export interface NormalizedStanding {
  teamId: string;
  teamName: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface NormalizedInjury {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  type: string;
  status: string;
  detail: string;
  startDate: string;
  expectedReturn?: string;
}

export class SportradarAdapter {
  /** Normalize a competitor to a team */
  normalizeTeam(competitor: SportradarCompetitor): NormalizedTeam {
    return {
      id: competitor.id,
      name: competitor.name,
      shortName: competitor.short_name || competitor.abbreviation,
      country: competitor.country,
      countryCode: competitor.country_code,
    };
  }

  /** Normalize a match */
  normalizeMatch(match: SportradarMatch): NormalizedMatch {
    return {
      id: match.id,
      homeTeam: this.normalizeTeam(match.home),
      awayTeam: this.normalizeTeam(match.away),
      status: match.status,
      scheduled: match.scheduled,
      homeScore: match.home_score,
      awayScore: match.away_score,
      venue: match.venue?.name,
      tournament: match.tournament_id,
    };
  }

  /** Normalize multiple matches */
  normalizeMatches(matches: SportradarMatch[]): NormalizedMatch[] {
    return matches.map((m) => this.normalizeMatch(m));
  }

  /** Normalize standings */
  normalizeStandings(standing: SportradarStanding): NormalizedStanding[] {
    const result: NormalizedStanding[] = [];

    for (const group of standing.groups) {
      for (const entry of group.standings) {
        result.push({
          teamId: entry.competitor_id,
          teamName: entry.competitor_name,
          position: entry.position,
          played: entry.played,
          won: entry.won,
          drawn: entry.drawn,
          lost: entry.lost,
          goalsFor: entry.goals_for,
          goalsAgainst: entry.goals_against,
          goalDifference: entry.goal_diff,
          points: entry.points,
        });
      }
    }

    return result.sort((a, b) => a.position - b.position);
  }

  /** Normalize injuries */
  normalizeInjuries(injuries: SportradarInjury[]): NormalizedInjury[] {
    return injuries.map((inj) => ({
      playerId: inj.player_id,
      playerName: inj.player_name,
      teamId: inj.team_id,
      teamName: inj.team_name,
      type: inj.type,
      status: inj.status,
      detail: inj.detail,
      startDate: inj.start_date,
      expectedReturn: inj.expected_return,
    }));
  }

  /** Extract match result for backtesting */
  extractResult(match: SportradarMatch): {
    fixtureId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    winner: string;
    isDraw: boolean;
  } | null {
    if (match.status !== 'finished' || match.home_score === undefined || match.away_score === undefined) {
      return null;
    }

    return {
      fixtureId: match.id,
      homeTeamId: match.home.id,
      awayTeamId: match.away.id,
      homeScore: match.home_score,
      awayScore: match.away_score,
      winner: match.home_score > match.away_score
        ? match.home.id
        : match.home_score < match.away_score
          ? match.away.id
          : 'draw',
      isDraw: match.home_score === match.away_score,
    };
  }

  /** Get team form from recent matches */
  extractForm(teamId: string, matches: SportradarMatch[], window: number = 5): string[] {
    const finished = matches
      .filter((m) => m.status === 'finished')
      .filter((m) => m.home.id === teamId || m.away.id === teamId)
      .slice(-window);

    return finished.map((m) => {
      const isHome = m.home.id === teamId;
      const teamScore = isHome ? m.home_score! : m.away_score!;
      const opponentScore = isHome ? m.away_score! : m.home_score!;

      if (teamScore > opponentScore) return 'W';
      if (teamScore < opponentScore) return 'L';
      return 'D';
    });
  }
}
